-- G21 · Dijital Gruplar: S4 Sahip paneli zemini (tasarım §11 + §3.C)
--
-- ═══ KAPSAM ═══
-- Sahibin gördüğü sayfa: skor + eksik adımlar · grup bilgilerini düzenleme ·
-- onay bekleyen gönderiler (G16 `group_post_review` hazır) · "Grubu listeden
-- kaldır" (G12 `set_group_status_v1` owner_request yolu hazır). Bu migration
-- panelin OKUMA yüzeyini (`group_owner_panel_state`) ve SAHİP DÜZENLEMESİNİ
-- (`group_owner_update_v1`) kurar; kaldırma ve gönderi incelemesi mevcut
-- RPC'lerle gider (yeni kapı UYDURULMAZ).
--
-- ═══ NEDEN YENİ RPC'LER ═══
--   • `owner_user_id` public view'da YOK (G19 kararı — iç veri sızmaz) →
--     istemci "ben sahip miyim"i ancak sunucudan öğrenebilir. Panel durumu TEK
--     çağrıda döner: sahiplik + skor kırılımı (G17 compute) + kuyruk.
--   • RLS `Users can update own landings` politikası `user_id`'ye (ESKİ
--     gönderen) bakar; motor sahibi `owner_user_id`'dir ve çoğu zaman farklı
--     kişidir → sahip kendi grubunu doğrudan UPDATE EDEMEZ. Düzenleme security
--     definer RPC'den geçer.
--
-- ═══ KARARLAR ═══
--   • Panel YALNIZ `ownership='verified' AND owner_user_id=auth.uid()` sahibe
--     açılır (tasarım §11 "Sahibin gördüğü sayfa"). Admin G24'ün panelini
--     kullanır; `is_owner=false` yanıtı veri SIZDIRMAZ (tek alan döner).
--   • Düzenlenebilir alanlar MOTOR formuyla aynı küme (G18): kısa açıklama
--     (≤160) · rules · kategori (yeni 7; `aile-cocuk` G06'ya dek KİLİTLİ —
--     G18 ile aynı sunucu kilidi) · ülke/şehir/Global (geo doğrulamalı) · hero
--     (http(s)) · tagline. Skor kolonları, sahiplik, listing_status, link,
--     platform, invite_code YAZILAMAZ (guard v3 zaten keser; RPC hiç dokunmaz).
--   • Legacy paralellik (deploy'a dek): `country/city` metinleri geo'dan
--     tazelenir; `description` = yeni kısa açıklama + MEVCUT etiket kuyruğu
--     (`[Platform: …]` vb. korunur — canlı eski paket rozetleri/platformu
--     oradan okuyor). Etiket yoksa salt açıklama yazılır.
--   • Kaldırma isteği (tasarım §3.C): "Doğrulanmış sahip 'Grubu listeden
--     kaldır'a basar → anında hidden (owner_request). Gerekçe SORULMAZ."
--     UI doğrudan `set_group_status_v1(lid,'hidden','owner_request')` çağırır
--     (G12 owner aktörüne bu geçişi zaten açıyor; log otomatik). Kabul #9'un
--     "anında"sı RPC'nin kendisidir — bu migration'da yeni kapı yok.
--
-- ═══ SALT EKLEME ═══
-- Kolon/tablo düşürmez; mevcut fonksiyon/politika DEĞİŞTİRMEZ.

begin;

-- ── 1) Panel durumu — tek okuma kapısı ──────────────────────────────────────

create or replace function public.group_owner_panel_state(p_landing_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row record;
  v_score jsonb;
  v_posts jsonb;
begin
  if v_uid is null then
    return jsonb_build_object('is_owner', false);
  end if;

  -- Sahiplik kontrolü VERİDEN ÖNCE: sahip değilse tek alan döner, hiçbir
  -- iç veri (kuyruk, skor, alanlar) sızmaz.
  select w.group_name, w.slug, w.listing_status, w.short_description, w.rules,
         w.category, w.country_code, w.city_id, w.is_global, w.hero_image,
         w.tagline, w.group_score, w.has_approved_badge
    into v_row
  from public.whatsapp_landings w
  where w.id = p_landing_id
    and w.ownership = 'verified'
    and w.owner_user_id = v_uid;
  if not found then
    return jsonb_build_object('is_owner', false);
  end if;

  -- Skor + eksik adımlar (G17 compute — breakdown zaten kalem kalem)
  v_score := public.group_health_score_compute(p_landing_id);

  select coalesce(jsonb_agg(
           jsonb_build_object(
             'id', gp.id,
             'body', gp.body,
             'author_user_id', gp.author_user_id,
             'created_at', gp.created_at,
             'escalate_at', gp.escalate_at
           ) order by gp.created_at
         ), '[]'::jsonb)
    into v_posts
  from public.group_posts gp
  where gp.landing_id = p_landing_id
    and gp.post_status = 'pending_group_admin';

  return jsonb_build_object(
    'is_owner', true,
    'landing', jsonb_build_object(
      'group_name', v_row.group_name,
      'slug', v_row.slug,
      'listing_status', v_row.listing_status,
      'short_description', v_row.short_description,
      'rules', v_row.rules,
      'category', v_row.category,
      'country_code', v_row.country_code,
      'city_id', v_row.city_id,
      'is_global', v_row.is_global,
      'hero_image', v_row.hero_image,
      'tagline', v_row.tagline,
      'group_score', v_row.group_score,
      'has_approved_badge', v_row.has_approved_badge
    ),
    'score', v_score,
    'pending_posts', v_posts,
    'pending_count', jsonb_array_length(v_posts)
  );
end;
$$;

comment on function public.group_owner_panel_state(uuid) is
  'S4 sahip panelinin tek okuma kapısı (G21, tasarım §11). Yalnız doğrulanmış '
  'sahibe veri döner; diğer herkese {is_owner:false} (sızıntı yok). Skor '
  'kırılımı G17 compute''tan, kuyruk pending_group_admin gönderilerden.';

revoke all on function public.group_owner_panel_state(uuid) from public, anon;
grant execute on function public.group_owner_panel_state(uuid) to authenticated;

-- ── 2) Sahip düzenlemesi ────────────────────────────────────────────────────

create or replace function public.group_owner_update_v1(
  p_landing_id uuid,
  p_short_description text,
  p_rules text,
  p_category text,
  p_country_code text,
  p_city_id uuid,
  p_is_global boolean,
  p_hero_image text default null,
  p_tagline text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_is_owner boolean;
  v_old record;
  v_desc text;
  v_tags text;
  v_country record;
  v_city record;
  v_country_code text := null;   -- ⚠️ record alanı DEĞİL: atanmamış record
  v_country_name text;           -- alanına erişim G18'de canlı testte patladı
  v_city_name text;              -- ("record is not assigned yet") — düz text.
  v_city_id uuid;
  v_short text;
  v_hero text;
begin
  if v_uid is null then
    raise exception 'group_owner_auth_required';
  end if;

  select id, description, short_description, rules, category, country_code,
         city_id, is_global, hero_image, tagline
    into v_old
  from public.whatsapp_landings
  where id = p_landing_id
  for update;
  if not found then
    raise exception 'group_not_found';
  end if;

  select (ownership = 'verified' and owner_user_id = v_uid) into v_is_owner
  from public.whatsapp_landings where id = p_landing_id;
  if not v_is_owner then
    raise exception 'group_owner_forbidden';
  end if;

  -- Açıklama: zorunlu değil (mevcut korunur) ama verilirse ≤160 (DB CHECK aynı).
  v_short := case
    when p_short_description is null then v_old.short_description
    else nullif(btrim(p_short_description), '')
  end;
  if v_short is not null and char_length(v_short) > 160 then
    raise exception 'group_owner_description_too_long';
  end if;

  -- Kategori: verilirse yeni 7'den olmalı; aile-cocuk G06'ya dek kilitli
  -- (G18 submit ile AYNI sunucu kilidi).
  if p_category is not null then
    if p_category = 'aile-cocuk' then
      raise exception 'group_owner_category_locked';
    end if;
    if p_category not in (
      'sehir-yasam', 'meslek-kariyer', 'is-girisim', 'alumni-akademik',
      'dayanisma-yardim', 'hobi-kultur'
    ) then
      raise exception 'group_owner_invalid_category';
    end if;
  end if;

  -- Konum: ülke kodu verilirse geo'dan doğrulanır; Global değilse şehir şart.
  v_country_name := null;
  v_city_name := null;
  v_city_id := v_old.city_id;
  if p_country_code is not null then
    select id, code, name into v_country
    from public.geo_countries
    where code = upper(btrim(p_country_code)) and is_active
    limit 1;
    if not found then
      raise exception 'group_owner_country_not_found';
    end if;
    v_country_code := v_country.code;
    v_country_name := v_country.name;
    if coalesce(p_is_global, v_old.is_global) then
      v_city_name := 'Genel';
      v_city_id := null;
    else
      if p_city_id is null then
        raise exception 'group_owner_city_required';
      end if;
      select id, name into v_city
      from public.geo_cities
      where id = p_city_id and is_active and country_id = v_country.id
      limit 1;
      if not found then
        raise exception 'group_owner_city_not_found';
      end if;
      v_city_name := v_city.name;
      v_city_id := v_city.id;
    end if;
  elsif p_is_global is true then
    -- Ülke verilmeden Global'e geçiş: mevcut ülke hedef ülke olur.
    v_city_name := 'Genel';
    v_city_id := null;
  end if;

  -- Görsel: verilirse http(s) (G18 ile aynı doğrulama)
  v_hero := case
    when p_hero_image is null then v_old.hero_image
    when p_hero_image = '' then null
    when p_hero_image ~* '^https?://' and length(p_hero_image) <= 2048 then btrim(p_hero_image)
    else v_old.hero_image
  end;

  -- Legacy description: yeni kısa açıklama + MEVCUT etiket kuyruğu korunur
  -- (canlı eski paket [Platform:]/[Badge …] etiketlerini okuyor).
  v_tags := (regexp_match(coalesce(v_old.description, ''), ' \[(?:Platform|Başvuru|Badge|Editor)[\s\S]*$'))[1];
  v_desc := case
    when v_short is null then v_old.description
    else v_short || coalesce(v_tags, '')
  end;

  update public.whatsapp_landings
     set short_description = v_short,
         rules = case when p_rules is null then v_old.rules else nullif(btrim(p_rules), '') end,
         category = coalesce(p_category, v_old.category),
         country_code = coalesce(v_country_code, v_old.country_code),
         city_id = v_city_id,
         is_global = coalesce(p_is_global, v_old.is_global),
         hero_image = v_hero,
         tagline = case when p_tagline is null then v_old.tagline else nullif(btrim(p_tagline), '') end,
         country = coalesce(v_country_name, country),
         city = coalesce(v_city_name, city),
         description = v_desc
   where id = p_landing_id;

  return jsonb_build_object('landing_id', p_landing_id, 'updated', true);
end;
$$;

comment on function public.group_owner_update_v1(uuid, text, text, text, text, uuid, boolean, text, text) is
  'Sahip düzenlemesi (G21, tasarım §11): motor form alanları + rules + tagline. '
  'YALNIZ doğrulanmış sahip. Skor/sahiplik/listing/link/platform/invite_code '
  'YAZILAMAZ. aile-cocuk G06''ya dek kilitli (G18 ile aynı). Legacy description '
  'etiketleri korunur (paralel sistem deploy''a dek).';

revoke all on function public.group_owner_update_v1(uuid, text, text, text, text, uuid, boolean, text, text)
  from public, anon;
grant execute on function public.group_owner_update_v1(uuid, text, text, text, text, uuid, boolean, text, text)
  to authenticated;

commit;
