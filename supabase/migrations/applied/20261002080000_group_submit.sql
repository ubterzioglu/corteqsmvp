-- G18 · Dijital Gruplar: S1 formunun gönderim kapısı (`submit_group_v1`)
--
-- ═══ KAPSAM ═══
-- Tasarım §3.A (ekleme akışı) + politika §2 (form alanları) + §5 (7 kategori).
-- Formun YAZMA yolu bu RPC'dir: link normalize + platform türetme + dedup
-- (invite_code) + kara liste ön taraması + hızlı şerit kararı + günlük sınır +
-- Grup Sözü kapısı. İstemciye tabloya doğrudan INSERT yolu kapanmaz (canlı eski
-- paket hâlâ `submitLanding` ile yazar — paralel sistem, G10c/deploy sonrası
-- temizlenir; RLS `Users can create own landings` bu yüzden DURUYOR).
--
-- ═══ KARARLAR (tasarımın boş bıraktığı yerler) ═══
--   • KABUL #3'ün ölçülebilmesi için: "Ekleyen admin VE sahiplik verified"
--     koşulu, admin gönderimde `p_claims_admin=true` ile SAĞLANIR — admin kendi
--     grubunu eklerken kod/ekran görüntüsü kanıtı istenmez (G12/G15'teki admin
--     güven doktrini; G13 claim akışı admin-OLMAYANLAR içindir). Admin değilse
--     `claims_admin` → `claim_pending` (tasarım §3.A adım 5 birebir).
--   • "Aile & Çocuk" K09/G06'ya kadar SUNUCUDA KİLİTLİ (`group_submit_category_locked`):
--     politika §5 onu Seviye-2 doğrulanmış kuruluşlara ayırır, seviye sistemi
--     henüz YOK → bugün kimse seçemez (kabul #10'un bugünkü doğru hâli).
--     G06 kilidi `verification_level=2` kontrolüne çevirirken sözleşme testi
--     bilinçli güncellenecek (G14/G16 deseni).
--   • Kategori anahtarları politika §5'ten; DB CHECK'i GENİŞLETİLİR (eski 10
--     değer canlı 10 satır + moderasyon ekranı için KALIR — düşürme G11/G19 sonrası).
--   • Legacy `country`/`city` metin kolonları (NOT NULL) `geo_*` kataloğundan
--     doldurulur — canlı eski paket onları okuyor. `is_global` → city='Genel'
--     (mevcut 6 Global grubun kalıbı), ülke = hedef ülke (politika §2 satır 4).
--   • Legacy `description` etiketleri (`[Platform: X]`, `[Badge ...]`) yazılır —
--     canlı paket rozetleri/platformu oradan okuyor (G19 kaldırana dek).
--   • Hızlı şerit yayını INSERT yoluyla (G12 başlığı bunu G18'e ayırdı; guard
--     UPDATE'e bakar) + `group_moderation_log`'a `fast_lane` satırı düşülür
--     (kabul #12'nin ruhu: otomatik yayın kararı da loglanır).
--   • Günlük sınır penceresi kayan 24 saat (`claim_start_daily_limit` deseni).
--   • "Davet sayfası açılıyor mu" kontrolü İSTEMCİDE (group-preview edge):
--     sunucu gönderim anında dış istek atmaz (Meta 200/W04 dersi — hızlı döner).
--     Sunucu tarafı link yaptırımı G22 link-health'ındır.
--   • Bildirim ("Grubun alındı…", §9) G23'te — burada kuyruğa yazılmaz.
--
-- ═══ SALT EKLEME ═══
-- Kolon/tablo DÜŞÜRMEZ. Tek istisna: `whatsapp_landings_category_check`
-- kısıtı 7 YENİ anahtarı alacak şekilde GENİŞLETİLİR (eski 10 değer korunur —
-- hiçbir mevcut satır geçersizleşmez).

begin;

-- ── 1) Kategori CHECK'i: eski 10 + yeni 7 (politika §5) ─────────────────────

alter table public.whatsapp_landings
  drop constraint if exists whatsapp_landings_category_check;

alter table public.whatsapp_landings
  add constraint whatsapp_landings_category_check
  check (category in (
    -- eski (canlı 10 satır + moderasyon/editör ekranları — G11 eşleyene dek geçerli)
    'alumni', 'hobi', 'is', 'doktor', 'yatirim', 'akademik', 'dayanisma',
    'hr', 'kisisel-gelisim', 'diger',
    -- yeni 7 kategori (politika §5 — "Diğer" YOK)
    'sehir-yasam', 'meslek-kariyer', 'is-girisim', 'alumni-akademik',
    'dayanisma-yardim', 'aile-cocuk', 'hobi-kultur'
  ));

-- ── 2) Slug yardımcısı (TS `slugify`'ın SQL karşılığı) ───────────────────────

create or replace function public.group_slugify(p_text text)
returns text
language sql
immutable
set search_path = public
as $$
  select nullif(
    regexp_replace(
      regexp_replace(
        translate(lower(coalesce(p_text, '')), 'ğüşıöç', 'gusioc'),
        '[^a-z0-9]+', '-', 'g'),
      '(^-+|-+$)', '', 'g'),
    '');
$$;

comment on function public.group_slugify(text) is
  'Türkçe harfleri ASCII''ye katlayıp slug üretir (G18). submit_group_v1 kullanır; '
  'TS tarafındaki slugify ile aynı çıktıyı hedefler (birebir bireşim değil).';

revoke all on function public.group_slugify(text) from public, anon;
grant execute on function public.group_slugify(text) to authenticated;

-- ── 3) Gönderim kapısı ───────────────────────────────────────────────────────

create or replace function public.submit_group_v1(
  p_link text,
  p_group_name text,
  p_category text,
  p_short_description text,
  p_country_code text,
  p_city_id uuid,
  p_is_global boolean,
  p_claims_admin boolean,
  p_pledge_accepted boolean,
  p_hero_image text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_link text;
  v_name text;
  v_desc text;
  v_platform text;
  v_invite text;
  v_dup record;
  v_keywords jsonb;
  v_kw text;
  v_flags text[] := '{}';
  v_haystack text;
  v_fast boolean;
  v_is_admin boolean;
  v_publish boolean;
  v_ownership text;
  v_country record;
  v_city record;
  v_city_id uuid;
  v_country_name text;
  v_city_name text;
  v_slug_base text;
  v_slug text;
  v_i integer;
  v_id uuid;
  v_daily_limit integer;
  v_hero text;
  v_listing text;
begin
  -- 0) Kimlik + ön koşullar
  if v_uid is null then
    raise exception 'group_submit_auth_required';
  end if;
  if p_pledge_accepted is distinct from true then
    raise exception 'group_submit_pledge_required';
  end if;
  if p_claims_admin is null then
    raise exception 'group_submit_admin_answer_required';
  end if;
  v_name := btrim(coalesce(p_group_name, ''));
  v_desc := btrim(coalesce(p_short_description, ''));
  if v_name = '' then
    raise exception 'group_submit_name_required';
  end if;
  if v_desc = '' then
    raise exception 'group_submit_description_required';
  end if;
  if char_length(v_desc) > 160 then
    raise exception 'group_submit_description_too_long';
  end if;

  -- 1) Kategori: politika §5'in 7 anahtarı; 'aile-cocuk' G06'ya dek kilitli
  if p_category = 'aile-cocuk' then
    raise exception 'group_submit_category_locked';
  end if;
  if p_category is null or p_category not in (
    'sehir-yasam', 'meslek-kariyer', 'is-girisim', 'alumni-akademik',
    'dayanisma-yardim', 'hobi-kultur'
  ) then
    raise exception 'group_submit_invalid_category';
  end if;

  -- 2) Link: platform ŞEMA-ÇIPALI türetilir; dedup anahtarı G10'un
  --    `group_invite_code`'u (backfill ile aynı tanım — tutarlılık şart).
  v_link := btrim(coalesce(p_link, ''));
  v_platform := case
    when v_link ~* '^https?://chat\.whatsapp\.com/' then 'whatsapp'
    when v_link ~* '^https?://(t\.me|telegram\.me)/' then 'telegram'
    when v_link ~* '^https?://(discord\.gg|discord\.com/invite)/' then 'discord'
    else null
  end;
  if v_platform is null then
    raise exception 'group_submit_link_unsupported';
  end if;
  v_invite := public.group_invite_code(v_link);
  if v_invite is null then
    raise exception 'group_submit_link_unsupported';
  end if;

  -- 3) Dedup: aynı davet kodu zaten listede mi (kabul #1)?
  select id, slug, group_name, ownership, listing_status
    into v_dup
  from public.whatsapp_landings
  where invite_code = v_invite
  limit 1;
  if found then
    return jsonb_build_object(
      'result', 'already_listed',
      'landing_id', v_dup.id,
      'slug', v_dup.slug,
      'group_name', v_dup.group_name,
      'ownership', v_dup.ownership,
      'listing_status', v_dup.listing_status);
  end if;

  -- 4) Yasaklı gönderici (G15) — trigger INSERT'te zaten yakalar, erken red
  --    kullanıcıya düzgün hata verir.
  if public.group_submission_banned(v_uid) then
    raise exception 'group_submission_banned';
  end if;

  -- 5) Günlük sınır (politika §2: günde 5; eşik group_settings)
  v_daily_limit := public.group_setting_int('groups.daily_submit_limit', 5);
  if (
    select count(*) from public.whatsapp_landings
    where submitted_by = v_uid and created_at > now() - interval '24 hours'
  ) >= v_daily_limit then
    raise exception 'group_submit_rate_limited';
  end if;

  -- 6) Kara liste ön taraması (tasarım §8): YALNIZ işaret koyar, reddetmez.
  --    Liste `group_settings`'ten (kodda sabit yok); ad + kısa açıklama taranır.
  v_keywords := public.group_setting_json('groups.blocklist_keywords', '[]'::jsonb);
  v_haystack := lower(v_name || ' ' || v_desc);
  for v_kw in select jsonb_array_elements_text(v_keywords) loop
    if v_kw <> '' and position(lower(v_kw) in v_haystack) > 0 then
      v_flags := v_flags || v_kw;
    end if;
  end loop;

  -- 7) Konum: geo_* zorunlu (serbest metin YOK). Global → hedef ülke + 'Genel'.
  select id, code, name into v_country
  from public.geo_countries
  where code = upper(btrim(coalesce(p_country_code, ''))) and is_active
  limit 1;
  if not found then
    raise exception 'group_submit_country_not_found';
  end if;
  if coalesce(p_is_global, false) then
    v_country_name := v_country.name;
    v_city_name := 'Genel';
    v_city_id := null;
  else
    if p_city_id is null then
      raise exception 'group_submit_city_required';
    end if;
    select id, name into v_city
    from public.geo_cities
    where id = p_city_id and is_active and country_id = v_country.id
    limit 1;
    if not found then
      raise exception 'group_submit_city_not_found';
    end if;
    v_country_name := v_country.name;
    v_city_name := v_city.name;
    v_city_id := v_city.id;
  end if;

  -- 8) Hızlı şerit (tasarım §2 geçiş tablosu): ekleyen admin VE sahiplik
  --    verified VE şerit açık VE kara liste işareti YOK → published.
  v_fast := public.group_setting_bool('groups.fast_lane_enabled', false);
  v_is_admin := public.is_admin(v_uid);
  v_ownership := case
    when not p_claims_admin then 'unclaimed'
    when v_is_admin then 'verified'          -- ↑ KARARLAR: admin özbeyanı yeterli
    else 'claim_pending'
  end;
  v_publish := v_fast and v_is_admin and p_claims_admin and cardinality(v_flags) = 0;
  v_listing := case when v_publish then 'published' else 'pending_review' end;

  -- 9) Görsel: yalnız http(s) URL (og:image önizlemesinden gelir)
  v_hero := case
    when coalesce(p_hero_image, '') ~* '^https?://' and length(p_hero_image) <= 2048
      then btrim(p_hero_image)
    else null
  end;

  -- 10) Slug (unique kısıtına karşı 5 deneme)
  v_slug_base := coalesce(
    public.group_slugify(v_name || ' ' || case when coalesce(p_is_global, false) then 'global' else v_city_name end),
    'grup');
  v_slug := v_slug_base;
  for v_i in 1..5 loop
    if not exists (select 1 from public.whatsapp_landings where slug = v_slug) then
      exit;
    end if;
    v_slug := v_slug_base || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 5);
  end loop;

  -- 11) INSERT (ban trigger'ı + catalog sync + updated_at trigger'ları işler;
  --     guard UPDATE'e bakar, INSERT'e bakmaz — G12 başlığı hızlı şeridi
  --     INSERT yoluna ayırdı).
  insert into public.whatsapp_landings (
    user_id, slug, group_name, category, country, city, mode,
    hero_image, whatsapp_link, description,
    status, member_approved, admin_approved,
    platform, invite_code, listing_status, ownership, owner_user_id,
    submitted_by, submitted_as_admin, review_flags,
    is_global, country_code, city_id, short_description,
    published_at
  ) values (
    v_uid, v_slug, v_name, p_category, v_country_name, v_city_name,
    case when v_hero is not null then 'visual' else 'text' end,
    v_hero, v_link,
    -- Legacy etiketler (canlı paket okuyor — G19 kaldırana dek):
    v_desc
      || ' [Platform: ' || case when v_platform = 'whatsapp' then 'WhatsApp' else initcap(v_platform) end || ']'
      || ' [Badge member: false]'
      || ' [Badge admin: ' || case when v_publish then 'true' else 'false' end || ']'
      || ' [Editor review pending: false]',
    case when v_publish then 'approved' else 'pending' end,
    false, v_publish,
    v_platform, v_invite, v_listing, v_ownership,
    case when v_ownership = 'verified' then v_uid else null end,
    v_uid, p_claims_admin, v_flags,
    coalesce(p_is_global, false), v_country.code,
    v_city_id,
    v_desc,
    case when v_publish then now() else null end
  )
  returning id into v_id;

  -- 12) Hızlı şerit kararı loglanır (kabul #12: her durum değişikliği logda)
  if v_publish then
    insert into public.group_moderation_log
      (landing_id, from_status, to_status, reason, note, actor_uid, actor_kind)
    values
      (v_id, null, 'published', 'fast_lane',
       'Hizli serit: ekleyen admin + sahiplik dogrulandi + isaret yok (G18)',
       v_uid, 'moderator');
  end if;

  return jsonb_build_object(
    'result', 'submitted',
    'landing_id', v_id,
    'slug', v_slug,
    'listing_status', v_listing,
    'ownership', v_ownership,
    'review_flagged', cardinality(v_flags) > 0);
end;
$$;

comment on function public.submit_group_v1(text, text, text, text, text, uuid, boolean, boolean, boolean, text) is
  'S1 formunun TEK gönderim kapısı (G18, tasarım §3.A + politika §2). Link '
  'normalize + platform türetme + invite_code dedup (kabul #1) + kara liste ön '
  'taraması (işaret koyar, reddetmez) + hızlı şerit (kabul #2/#3: admin değilse '
  'şerit açıkken bile pending_review) + günlük sınır + Grup Sözü kapısı. '
  'aile-cocuk G06''ya dek kilitli (kabul #10). Bildirim G23.';

revoke all on function public.submit_group_v1(text, text, text, text, text, uuid, boolean, boolean, boolean, text) from public, anon;
grant execute on function public.submit_group_v1(text, text, text, text, text, uuid, boolean, boolean, boolean, text) to authenticated;

commit;