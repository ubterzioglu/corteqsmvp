-- ============================================================
-- Purpose:                Dizin aramasını anonim erişime aç, sayfala ve Türkçe
--                         katlamalı (lower+unaccent) sıralamalı eşleşmeye geçir.
-- Module:                 CATALOG / DIRECTORY
-- Plan:                   docs/plans/2026-09-20-dizin-arama-plani.md (Batch 0, 2, 3)
-- Risk level:             medium — tek fonksiyon, ama halka açık yüzeye açılıyor.
--
-- Bu migration ÜÇ işi birlikte yapar çünkü üçü de AYNI fonksiyon gövdesidir:
--
--   Batch 0 — Anonim erişim + sayfalama
--     Eski gövde `auth.uid() is null` iken 42501 fırlatıyordu. Fonksiyonun
--     EXECUTE grant'i zaten `anon`'daydı (ölçüldü 2026-09-21: acl'de `anon=X`);
--     ziyaretçiyi durduran tek şey gövdedeki bu satırdı. Artık ziyaretçi de
--     sonuç alır; karşılığında sonuç kümesi ZORUNLU olarak sayfalıdır
--     (p_limit tavanı 100) ve dönen kolonlar PII taşımaz.
--
--   Batch 2 — Türkçe normalizasyon + sıralamalı eşleşme
--     Eski gövde ham `ilike` ile katı AND yapıyordu: "Berlin'de yazılımcı"
--     araması `Berlin'de` kelimesini hiçbir alanda bulamadığı için GARANTİLİ 0
--     dönüyordu ve `yazilimci` ≠ `yazılımcı` idi. Artık hem sorgu hem belge
--     `catalog_search_normalize()` (= lower(unaccent(...))) ile katlanır ve
--     eşleşme elemek yerine SIRALAR: tam başlık eşleşmesi 0, başlık öneki 1,
--     tüm kelimeler 2, kısmi eşleşme 3. Ek/apostrof tuzağı böylece sonucu
--     sıfırlamaz, yalnız aşağı sıraya iter.
--
--   Batch 3 — Güvenlik: B20 yönetici elemesi HER İKİ dalda
--     ⚠️ Canlıda ölçülen açık (2026-09-21): B20 koşulu YALNIZ Branch 2'ye
--     (bireysel profiller) eklenmişti. Branch 1'de (katalog kayıtları)
--     `[PLACEHOLDER] İçerik Moderatör` kaydı `Admin_ContentModerator` rolüyle,
--     `is_directory_visible = true` olduğu için SQL filtresinden GEÇİYORDU.
--     Bugün onu gizleyen tek şey TypeScript tarafındaki `isPublicDirectoryRole`
--     guard'ıydı — yani RPC'yi doğrudan çağıran biri (ve anonim erişim açılınca
--     HERKES) yönetici kaydını görebilirdi. Koşul artık iki dalda da SQL'de.
--
-- PII kararı — `catalog_search_documents.search_text` BİLEREK kullanılmadı:
--   O blob `catalog_item_contacts.contact_value` (is_public) değerlerini de
--   içerir (canlıda 336 açık iletişim kaydı). Anonime açık bir arama yüzeyinde
--   bu, e-posta/telefon doğrulama (enumeration) yüzeyi açardı. Bunun yerine
--   aranacak metin burada AÇIKÇA kurulur; iletişim alanları dışarıdadır.
--   csd'den yalnız türetilmiş, PII'siz kolonlar alınır: city, country_code,
--   category_slugs. `search_catalog` RPC'si ve rebuild fonksiyonu DEĞİŞMEDİ.
--
-- Sayaç sözleşmesi: `total_count` pencere fonksiyonuyla FİLTRELENMİŞ küme
--   üzerinden döner. Böylece "kaç kayıt var" ile "hangi kayıtlar geliyor" tek
--   kaynaktan gelir; TS tarafındaki ayrı `catalog_items` sayımı (dizin
--   filtrelerini bilmiyordu, yönetici elemesini hiç uygulamıyordu) kalkar.
--
-- Geri alma: eski gövde `supabase/migrations/archive/20260607090000_...sql` +
--   `applied/20260730220000_...sql` yamasıdır; 7 argümanlı sürümü DROP edip
--   5 argümanlıyı yeniden yaratmak yeterlidir.
-- Estimated lock impact:  negligible (tek fonksiyon tanımı).
-- ============================================================

BEGIN;

create or replace function public.search_directory_catalog(
  p_search_text text default null,
  p_role_key text default null,
  p_country_code text default null,
  p_city text default null,
  p_featured_only boolean default false,
  p_limit integer default 24,
  p_offset integer default 0
)
returns table (
  item_id uuid,
  item_type text,
  slug text,
  title text,
  role_key text,
  role_label text,
  description text,
  city text,
  country text,
  image_url text,
  special_label text,
  special_value text,
  is_featured boolean,
  is_verified boolean,
  is_claimable boolean,
  match_rank integer,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_search_text  text    := nullif(btrim(coalesce(p_search_text, '')), '');
  v_role_key     text    := nullif(btrim(coalesce(p_role_key, '')), '');
  v_country_code text    := upper(nullif(btrim(coalesce(p_country_code, '')), ''));
  v_city         text    := nullif(btrim(coalesce(p_city, '')), '');
  -- Katlanmış (lower+unaccent) tam sorgu — tam/önek eşleşme sıralaması için.
  v_query        text    := null;
  -- Katlanmış kelimeler — kısmi eşleşme sıralaması için.
  v_words        text[]  := '{}';
  -- Sayfalama sınırları. Tavan bilinçli: anonim çağrı tüm dizini tek seferde
  -- çekemesin (kazıma/kopyalama yüzeyini daraltır).
  v_limit        integer := least(greatest(coalesce(p_limit, 24), 1), 100);
  v_offset       integer := greatest(coalesce(p_offset, 0), 0);
begin
  if v_search_text is not null then
    v_query := public.catalog_search_normalize(v_search_text);

    select coalesce(array_agg(t.w), '{}'::text[])
      into v_words
    from (select unnest(regexp_split_to_array(v_query, '\s+')) as w) t
    where btrim(t.w) <> '';

    -- Sorgu yalnız noktalama/boşluktan ibaretse arama yok sayılır.
    if coalesce(array_length(v_words, 1), 0) = 0 then
      v_query := null;
    end if;
  end if;

  return query
  with primary_locations as (
    select distinct on (cil.item_id)
      cil.item_id,
      cil.city,
      cil.country_code
    from public.catalog_item_locations cil
    order by cil.item_id, cil.is_primary desc, cil.created_at asc
  ),
  primary_media as (
    select distinct on (cim.item_id)
      cim.item_id,
      coalesce(cim.thumbnail_url, cim.url) as image_url
    from public.catalog_item_media cim
    where cim.is_public = true
    order by cim.item_id, cim.is_primary desc, cim.created_at asc
  ),
  claim_status as (
    select
      ccr.item_id,
      bool_or(ccr.status = 'pending') as has_pending_claim
    from public.catalog_item_claims ccr
    group by ccr.item_id
  ),
  -- Branch 1: katalog kayıtları
  catalog_rows as (
    select
      ci.id as row_item_id,
      ci.item_type as row_item_type,
      ci.slug as row_slug,
      ci.title as row_title,
      coalesce(ci.platform_role_key, r.key, ci.item_type) as row_role_key,
      coalesce(r.label, ci.platform_role_key, ci.item_type) as row_role_label,
      coalesce(ci.short_description, ci.headline, left(ci.long_description, 220)) as row_description,
      pl.city as row_city,
      pl.country_code as row_country,
      pm.image_url as row_image_url,
      case
        when coalesce(ci.attributes ->> 'specialty_summary', '') <> '' then 'Uzmanlık / Kategori'
        when coalesce(ci.headline, '') <> '' then 'Başlık'
        else null
      end as row_special_label,
      nullif(coalesce(ci.attributes ->> 'specialty_summary', ci.headline), '') as row_special_value,
      coalesce((ci.attributes ->> 'is_featured')::boolean, false) as row_is_featured,
      (ci.verification_status in ('verified', 'official_source', 'claimed')) as row_is_verified,
      (
        ci.verification_status <> 'claimed'
        and not coalesce(cs.has_pending_claim, false)
      ) as row_is_claimable,
      public.catalog_search_normalize(ci.title) as row_title_folded,
      -- Aranacak metin AÇIKÇA kurulur. csd.search_text KULLANILMAZ: iletişim
      -- değerlerini içerir (yukarıdaki PII kararı). Buraya yeni alan eklerken
      -- o alanın herkese açık olduğunu doğrula.
      public.catalog_search_normalize(
        concat_ws(
          ' ',
          ci.title,
          ci.headline,
          ci.short_description,
          ci.long_description,
          r.label,
          ci.platform_role_key,
          pl.city,
          pl.country_code,
          array_to_string(coalesce(d.category_slugs, '{}'::text[]), ' ')
        )
      ) as row_haystack
    from public.catalog_items ci
    left join public.roles r
      on r.key = ci.platform_role_key
    left join primary_locations pl
      on pl.item_id = ci.id
    left join primary_media pm
      on pm.item_id = ci.id
    left join claim_status cs
      on cs.item_id = ci.id
    left join public.catalog_search_documents d
      on d.item_id = ci.id
    where ci.status = 'published'
      and ci.visibility in ('public', 'unlisted')
      and coalesce(r.is_directory_visible, true)
      -- B20 (Branch 1): yönetici/moderatör kayıtları halka açık dizinde
      -- listelenmez. Desen is_admin()/is_moderator() ile AYNI (`_` burada da
      -- joker karakterdir — bilinçli, daha geniş eleme güvenli yönde hata yapar).
      -- Bu koşul olmadan `Admin_ContentModerator` gibi is_directory_visible=true
      -- kalmış bir rol dizine sızar (canlıda 1 kayıt vardı).
      and coalesce(ci.platform_role_key, '') not ilike 'Admin_%'
      and coalesce(ci.platform_role_key, '') not ilike 'Moderator_%'
      and coalesce(ci.platform_role_key, '') <> 'moderator'
      and coalesce(ci.item_type, '') not ilike 'Admin_%'
      and coalesce(ci.item_type, '') not ilike 'Moderator_%'
      and (v_role_key is null or ci.platform_role_key = v_role_key)
      and (v_country_code is null or upper(coalesce(pl.country_code, '')) = v_country_code)
      and (v_city is null or lower(coalesce(pl.city, '')) = lower(v_city))
      and (
        not p_featured_only
        or coalesce((ci.attributes ->> 'is_featured')::boolean, false)
      )
  ),
  -- Branch 2: bireysel üyeler (AFS — individual_profile_details)
  member_rows as (
    select
      ipd.user_id as row_item_id,
      'member' as row_item_type,
      ipd.user_id::text as row_slug,
      coalesce(member_name.full_name, 'CorteQS Üyesi') as row_title,
      'bireysel' as row_role_key,
      'Bireysel Kullanıcı' as row_role_label,
      ipd.tagline as row_description,
      ipd.active_city as row_city,
      gc.code as row_country,
      (ipd.front_card ->> 'profile_image_url') as row_image_url,
      null::text as row_special_label,
      null::text as row_special_value,
      false as row_is_featured,
      false as row_is_verified,
      false as row_is_claimable,
      public.catalog_search_normalize(coalesce(member_name.full_name, 'CorteQS Üyesi')) as row_title_folded,
      public.catalog_search_normalize(
        concat_ws(
          ' ',
          member_name.full_name,
          ipd.tagline,
          ipd.active_city,
          ipd.active_country,
          'Bireysel Kullanıcı'
        )
      ) as row_haystack
    from public.individual_profile_details ipd
    left join lateral (
      select upa.value_text as full_name
      from public.user_profile_attributes upa
      join public.afs_attributes ac on ac.id = upa.attribute_id
      where upa.user_id = ipd.user_id
        and ac.key = 'full_name'
        and upa.approval_status = 'approved'
      limit 1
    ) member_name on true
    left join public.geo_countries gc
      on gc.is_active = true
      and (
        gc.name = ipd.active_country
        or gc.code = upper(ipd.active_country)
      )
    where ipd.visibility_status = 'open'
      -- B20 (Branch 2): yönetici/moderatör hesapları halka açık dizinde
      -- listelenmez (is_admin/is_moderator ile aynı rol deseni).
      and not exists (
        select 1
        from public.user_role_assignments ura_x
        join public.roles r_x on r_x.id = ura_x.role_id
        where ura_x.user_id = ipd.user_id
          and (r_x.key ilike 'Admin_%' or r_x.key ilike 'Moderator_%' or r_x.key = 'moderator')
      )
      and not p_featured_only
      and (v_role_key is null or v_role_key = 'bireysel')
      and (v_country_code is null or upper(coalesce(gc.code, '')) = v_country_code)
      and (v_city is null or lower(coalesce(ipd.active_city, '')) = lower(v_city))
  ),
  candidates as (
    select * from catalog_rows
    union all
    select * from member_rows
  ),
  ranked as (
    select
      c.*,
      case
        -- Arama yoksa herkes nötr bantta; sıralamayı öne çıkan/doğrulanmış belirler.
        when v_query is null then 2
        -- Tam başlık eşleşmesi: "Eczane" araması "Eczane" başlıklı kaydı üste alır.
        when c.row_title_folded = v_query then 0
        -- Başlık öneki: "dr" → "Dr. Filiz Dogan".
        when left(c.row_title_folded, length(v_query)) = v_query then 1
        -- Tüm kelimeler bir yerde geçiyor (eski AND davranışı — artık üst bant).
        -- `position()` kullanılır, `like` DEĞİL: kullanıcı girdisindeki `%`/`_`
        -- karakterleri joker olarak yorumlanmasın.
        when (
          select bool_and(position(w in c.row_haystack) > 0)
          from unnest(v_words) as w
        ) then 2
        -- Kelimelerin en az biri geçiyor: ek/apostrof tuzağı artık sonucu
        -- sıfırlamaz ("Berlin'de doktor" → `berlin'de` eşleşmese bile `doktor`
        -- eşleşir ve kayıt bu bantta görünür).
        when (
          select bool_or(position(w in c.row_haystack) > 0)
          from unnest(v_words) as w
        ) then 3
        else 9
      end as row_match_rank
    from candidates c
  )
  select
    q.row_item_id,
    q.row_item_type,
    q.row_slug,
    q.row_title,
    q.row_role_key,
    q.row_role_label,
    q.row_description,
    q.row_city,
    q.row_country,
    q.row_image_url,
    q.row_special_label,
    q.row_special_value,
    q.row_is_featured,
    q.row_is_verified,
    q.row_is_claimable,
    q.row_match_rank,
    -- Pencere fonksiyonu WHERE'den SONRA hesaplanır: sayaç, sonuç listesiyle
    -- BİREBİR aynı filtreyi görür. Sayacı ayrı bir sorguyla üretmek, iki
    -- filtrenin zamanla ayrışmasına ve "645 kayıt" yalanına yol açıyordu.
    count(*) over () as total_count
  from ranked q
  where q.row_match_rank <= 3
  order by
    q.row_match_rank asc,
    q.row_is_featured desc,
    q.row_is_verified desc,
    q.row_title asc
  limit v_limit
  offset v_offset;
end;
$$;

-- Eski 5 argümanlı sürüm DROP edilir. Bırakılırsa PostgREST iki aşırı yükleme
-- arasında karar veremez ("Could not choose the best candidate function").
drop function if exists public.search_directory_catalog(text, text, text, text, boolean);

revoke all on function public.search_directory_catalog(text, text, text, text, boolean, integer, integer) from public;
grant execute on function public.search_directory_catalog(text, text, text, text, boolean, integer, integer)
  to anon, authenticated, service_role;

comment on function public.search_directory_catalog(text, text, text, text, boolean, integer, integer) is
  'Herkese açık dizin araması. Anonim çağrılabilir, sayfalıdır (tavan 100) ve '
  'PII döndürmez. Türkçe katlama catalog_search_normalize() ile yapılır; eşleşme '
  'elemez, SIRALAR (match_rank 0=tam başlık, 1=başlık öneki, 2=tüm kelimeler, '
  '3=kısmi). B20 yönetici elemesi HER İKİ dalda uygulanır. total_count filtrelenmiş '
  'küme sayısıdır — sonuç listesiyle aynı filtreyi paylaşır.';

COMMIT;
