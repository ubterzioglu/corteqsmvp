-- Cadde V1 (5/6): Cafe tema kataloğu + kapasite seçenekleri + marka koruması.
--
-- 1) TEMA: theme_key serbest metindi (CreateCafeForm'daki 7 öneri: IT, Hekimler,
--    Profesyoneller…) — bunlar kategori gibi duruyordu, tema gibi değil. Artık DB'de
--    16 gerçek tema var; ürün kararı SQL update, deploy gerekmiyor.
--    Canlıda yalnız 3 cafe var (2 null + 1 'Genel'), göç önemsiz.
--
-- 2) MARKA KORUMASI: "Starbucks Cafe" adını herkes açamamalı. Sahiplik sinyali olarak
--    user_verifications KULLANILAMAZ — o tabloda yalnız telefon doğrulaması var, işletme
--    doğrulaması yok. Tek gerçek sahiplik sinyali catalog_item_managers: kullanıcı o
--    markanın yayındaki katalog kaydını yönetiyorsa cafe'yi açabilir.
--    Diğer herkese "Parodi X" adı önerilir (frontend uygular, DB dayatmaz).
--
-- Eşleşme kelime sınırıyla yapılır (\m...\M): "nike" → "Nike Cafe" yakalanır,
-- "Teknike Dair" yakalanmaz.

begin;

-- ── 1. Tema kataloğu ─────────────────────────────────────────────────────────
create table if not exists public.cadde_cafe_themes (
  key text primary key,
  label_tr text not null,
  icon_key text,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

insert into public.cadde_cafe_themes (key, label_tr, icon_key, sort_order) values
  ('girisim',    'Girişim',    'rocket',        10),
  ('startup',    'Startup',    'zap',           20),
  ('yatirim',    'Yatırım',    'trending-up',   30),
  ('yazilim',    'Yazılım',    'code',          40),
  ('ai',         'AI',         'brain',         50),
  ('meslek',     'Meslek',     'briefcase',     60),
  ('hr',         'HR',         'users',         70),
  ('networking', 'Networking', 'handshake',     80),
  ('egitim',     'Eğitim',     'graduation-cap', 90),
  ('saglik',     'Sağlık',     'heart-pulse',   100),
  ('spor',       'Spor',       'dumbbell',      110),
  ('gusto',      'Gusto',      'utensils',      120),
  ('muzik',      'Müzik',      'music',         130),
  ('hobi',       'Hobi',       'palette',       140),
  ('party',      'Party',      'party-popper',  150),
  ('gundem',     'Gündem',     'newspaper',     160)
on conflict (key) do nothing;

alter table public.cadde_cafe_themes enable row level security;

drop policy if exists "cadde cafe themes public read" on public.cadde_cafe_themes;
create policy "cadde cafe themes public read"
  on public.cadde_cafe_themes for select to anon, authenticated using (is_active = true);

drop policy if exists "cadde cafe themes admin write" on public.cadde_cafe_themes;
create policy "cadde cafe themes admin write"
  on public.cadde_cafe_themes for all
  using (public.is_admin_user(auth.uid())) with check (public.is_admin_user(auth.uid()));

-- Eski serbest metin temaların göçü. FK EKLENMEZ: eşleşmeyen legacy satır
-- cafe kaydını düşürmesin; doğrulama RPC'de yapılır.
update public.cadde_cafes set theme_key = case lower(coalesce(theme_key, ''))
  when 'it' then 'yazilim'
  when 'hekimler' then 'saglik'
  when 'profesyoneller' then 'meslek'
  when 'işletmeler' then 'girisim'
  when 'kuruluşlar' then 'networking'
  when 'blogger/vlogger' then 'hobi'
  else 'gundem'
end
where theme_key is null or theme_key not in (select key from public.cadde_cafe_themes);

-- ── 2. Korumalı markalar ─────────────────────────────────────────────────────
create table if not exists public.cadde_protected_brands (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null,
  /** Normalize (ASCII, küçük harf) eşleşme anahtarı. */
  match_pattern text not null unique,
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);

alter table public.cadde_protected_brands enable row level security;

drop policy if exists "cadde brands authenticated read" on public.cadde_protected_brands;
create policy "cadde brands authenticated read"
  on public.cadde_protected_brands for select using (auth.uid() is not null);

drop policy if exists "cadde brands admin write" on public.cadde_protected_brands;
create policy "cadde brands admin write"
  on public.cadde_protected_brands for all
  using (public.is_admin_user(auth.uid())) with check (public.is_admin_user(auth.uid()));

insert into public.cadde_protected_brands (brand_name, match_pattern) values
  ('Starbucks', 'starbucks'), ('BigChefs', 'bigchefs'), ('Gucci', 'gucci'),
  ('Nike', 'nike'), ('Adidas', 'adidas'), ('Puma', 'puma'), ('Zara', 'zara'),
  ('McDonald''s', 'mcdonalds'), ('Burger King', 'burger king'), ('KFC', 'kfc'),
  ('Domino''s', 'dominos'), ('Pizza Hut', 'pizza hut'), ('Subway', 'subway'),
  ('Apple', 'apple'), ('Google', 'google'), ('Microsoft', 'microsoft'),
  ('Amazon', 'amazon'), ('Meta', 'meta'), ('Netflix', 'netflix'), ('Spotify', 'spotify'),
  ('Tesla', 'tesla'), ('BMW', 'bmw'), ('Mercedes', 'mercedes'), ('Audi', 'audi'),
  ('Volkswagen', 'volkswagen'), ('Toyota', 'toyota'), ('Ford', 'ford'),
  ('Turkcell', 'turkcell'), ('Vodafone', 'vodafone'), ('Türk Telekom', 'turk telekom'),
  ('THY', 'thy'), ('Türk Hava Yolları', 'turk hava yollari'), ('Pegasus', 'pegasus'),
  ('Migros', 'migros'), ('BİM', 'bim'), ('A101', 'a101'), ('ŞOK', 'sok'),
  ('CarrefourSA', 'carrefoursa'), ('Metro', 'metro'),
  ('Ziraat Bankası', 'ziraat'), ('İş Bankası', 'is bankasi'), ('Garanti BBVA', 'garanti'),
  ('Akbank', 'akbank'), ('Yapı Kredi', 'yapi kredi'), ('QNB', 'qnb'), ('Denizbank', 'denizbank'),
  ('Deutsche Bank', 'deutsche bank'), ('Commerzbank', 'commerzbank'), ('Sparkasse', 'sparkasse'),
  ('Arçelik', 'arcelik'), ('Beko', 'beko'), ('Vestel', 'vestel'), ('Bosch', 'bosch'),
  ('Siemens', 'siemens'), ('Philips', 'philips'), ('Samsung', 'samsung'), ('LG', 'lg'),
  ('Sony', 'sony'), ('Huawei', 'huawei'), ('Xiaomi', 'xiaomi'),
  ('Ülker', 'ulker'), ('Eti', 'eti'), ('Torku', 'torku'), ('Pınar', 'pinar'),
  ('Sütaş', 'sutas'), ('Coca-Cola', 'coca cola'), ('Pepsi', 'pepsi'), ('Nestlé', 'nestle'),
  ('Efes', 'efes'), ('Doğuş', 'dogus'), ('Koç', 'koc holding'), ('Sabancı', 'sabanci'),
  ('LC Waikiki', 'lc waikiki'), ('Mavi', 'mavi jeans'), ('Koton', 'koton'),
  ('DeFacto', 'defacto'), ('Boyner', 'boyner'), ('Vakko', 'vakko'), ('Beymen', 'beymen'),
  ('Trendyol', 'trendyol'), ('Hepsiburada', 'hepsiburada'), ('Getir', 'getir'),
  ('Yemeksepeti', 'yemeksepeti'), ('BiTaksi', 'bitaksi'), ('Uber', 'uber'),
  ('Booking.com', 'booking'), ('Airbnb', 'airbnb'), ('IKEA', 'ikea'),
  ('Kahve Dünyası', 'kahve dunyasi'), ('Simit Sarayı', 'simit sarayi'),
  ('Mado', 'mado'), ('Gloria Jean''s', 'gloria jeans'), ('Caribou', 'caribou'),
  ('Espressolab', 'espressolab'), ('Tchibo', 'tchibo'), ('Nespresso', 'nespresso')
on conflict (match_pattern) do nothing;

-- ── 3. Marka çakışma kontrolü ────────────────────────────────────────────────
-- Dönüş: çakışan markanın görünen adı, yoksa null. TS aynası: cadde-rules.ts
-- checkBrandConflict — ikisi de aynı kelime-sınırı mantığını uygular.
create or replace function public.cadde_check_brand_conflict(p_name text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select b.brand_name
  from public.cadde_protected_brands b
  where b.is_active = true
    and lower(unaccent(coalesce(p_name, ''))) ~ ('\m' || b.match_pattern || '\M')
  order by length(b.match_pattern) desc
  limit 1;
$$;

revoke all on function public.cadde_check_brand_conflict(text) from public, anon;
grant execute on function public.cadde_check_brand_conflict(text) to authenticated;

/**
 * Kullanıcı markanın meşru sahibi mi?
 * user_verifications yalnız telefon doğrulaması tutuyor — işletme doğrulaması YOK.
 * Tek gerçek sahiplik sinyali: kullanıcının yönettiği YAYINDAKİ bir katalog kaydının
 * adı markayla eşleşiyorsa.
 */
create or replace function public.cadde_user_owns_brand(p_user_id uuid, p_brand_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.catalog_item_managers m
    join public.catalog_items ci on ci.id = m.item_id
    where m.user_id = p_user_id
      and m.status = 'active'
      and ci.status = 'published'
      and lower(unaccent(ci.title)) like '%' || lower(unaccent(coalesce(p_brand_name, '~'))) || '%'
  );
$$;

revoke all on function public.cadde_user_owns_brand(uuid, text) from public, anon;
grant execute on function public.cadde_user_owns_brand(uuid, text) to authenticated;


-- ── 4. create_cadde_cafe_v1: tema doğrulaması + marka koruması ───────────────
-- Canlı tanımdan türetildi; yalnız başlık kontrolünden sonra iki blok eklendi.
drop function if exists public.create_cadde_cafe_v1(text, text, text, text, text, boolean, text, text, text, timestamptz, timestamptz, integer, jsonb, text);

CREATE OR REPLACE FUNCTION public.create_cadde_cafe_v1(p_title text, p_summary text, p_theme_key text, p_country text, p_city text, p_is_bridge boolean, p_entry_mode text, p_referral_code text DEFAULT NULL::text, p_entry_question text DEFAULT NULL::text, p_starts_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_ends_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_capacity integer DEFAULT NULL::integer, p_external_links jsonb DEFAULT '[]'::jsonb, p_diaspora_key text DEFAULT 'tr'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_title text := trim(coalesce(p_title, ''));
  v_summary text := trim(coalesce(p_summary, ''));
  v_theme text := nullif(trim(coalesce(p_theme_key, '')), '');
  v_brand text;
  v_referral text := nullif(trim(coalesce(p_referral_code, '')), '');
  v_question text := nullif(trim(coalesce(p_entry_question, '')), '');
  v_starts timestamptz := coalesce(p_starts_at, now());
  v_ends timestamptz;
  v_max_hours integer := public.cadde_setting_int('cadde.cafe.max_duration_hours', 6);
  v_diaspora text := coalesce(nullif(trim(coalesce(p_diaspora_key, '')), ''), 'tr');
  v_country_id uuid;
  v_city_id uuid;
  v_cafe_id uuid;
  v_slug text;
  v_today_count integer;
begin
  if v_uid is null then
    raise exception 'cadde_auth_required';
  end if;

  if v_diaspora not in ('tr', 'in', 'cn', 'ph') then
    raise exception 'cadde_invalid_diaspora';
  end if;

  if not public.is_cadde_profile_complete(v_uid) then
    if public.cadde_phone_required() and not public.is_phone_verified(v_uid) then
      raise exception 'phone_verification_required';
    end if;
    raise exception 'cadde_profile_incomplete';
  end if;

  if not public.has_cadde_feature(v_uid, 'cadde.cafe.create') then
    if public.is_cadde_banned(v_uid) then
      raise exception 'cadde_banned';
    end if;
    raise exception 'cadde_cafe_permission_denied';
  end if;

  if length(v_title) < 3 or length(v_title) > 80 then
    raise exception 'cadde_invalid_cafe_title';
  end if;

  -- Tema kataloğa bağlı (FK yok — legacy satırlar düşmesin diye burada doğrulanır).
  if v_theme is null or not exists (
    select 1 from public.cadde_cafe_themes t where t.key = v_theme and t.is_active = true
  ) then
    raise exception 'cadde_invalid_cafe_theme';
  end if;

  -- Marka koruması: markanın meşru sahibi değilse bu adla cafe açılamaz.
  -- Admin/moderatör muaf (moderasyon amaçlı açabilmeliler).
  v_brand := public.cadde_check_brand_conflict(v_title);
  if v_brand is not null
     and not public.cadde_user_owns_brand(v_uid, v_brand)
     and not (public.is_admin(v_uid) or public.is_moderator(v_uid)) then
    raise exception 'cadde_cafe_brand_protected';
  end if;

  if length(v_summary) < 1 or length(v_summary) > 500 then
    raise exception 'cadde_invalid_cafe_summary';
  end if;

  if p_entry_mode not in ('open', 'approval', 'referral') then
    raise exception 'cadde_invalid_entry_mode';
  end if;

  if p_entry_mode = 'referral' and (v_referral is null or length(v_referral) < 4) then
    raise exception 'cadde_cafe_referral_code_required';
  end if;

  if p_entry_mode = 'approval' and v_question is null then
    raise exception 'cadde_cafe_question_required';
  end if;

  v_ends := coalesce(p_ends_at, v_starts + interval '2 hours');
  if v_ends <= v_starts then
    raise exception 'cadde_invalid_cafe_time';
  end if;
  if v_ends > v_starts + make_interval(hours => v_max_hours) then
    raise exception 'cadde_cafe_duration_exceeded';
  end if;

  if p_capacity is not null and p_capacity < 1 then
    raise exception 'cadde_invalid_cafe_capacity';
  end if;

  if not (public.is_admin(v_uid) or public.is_moderator(v_uid)) then
    select count(*) into v_today_count
    from public.cadde_cafes
    where host_user_id = v_uid and created_at > now() - interval '24 hours';
    if v_today_count >= public.cadde_setting_int('cadde.cafe.daily_create_limit', 3) then
      raise exception 'cadde_rate_limit';
    end if;
  end if;

  select c.id into v_country_id
  from public.cadde_countries c
  where c.name = nullif(trim(coalesce(p_country, '')), '') and c.is_active = true
  limit 1;

  select ci.id into v_city_id
  from public.cadde_cities ci
  where ci.name = nullif(trim(coalesce(p_city, '')), '')
    and (v_country_id is null or ci.country_id = v_country_id)
    and ci.is_active = true
  limit 1;

  v_slug := trim(both '-' from regexp_replace(lower(v_title), '[^a-z0-9]+', '-', 'g'));
  v_slug := nullif(v_slug, '') || '-' || substr(md5(gen_random_uuid()::text), 1, 6);

  insert into public.cadde_cafes (
    host_user_id, title, summary, country_id, city_id,
    content_mode, status, is_bridge, is_free,
    starts_at, ends_at, is_active,
    slug, theme_key, entry_mode, referral_code_hash, entry_question,
    capacity, external_links, diaspora_key
  )
  values (
    v_uid, v_title, v_summary, v_country_id, v_city_id,
    'real', 'published', coalesce(p_is_bridge, false), true,
    v_starts, v_ends, true,
    v_slug, v_theme, p_entry_mode,
    case when v_referral is not null then encode(digest(upper(v_referral), 'sha256'), 'hex') end,
    v_question, p_capacity, coalesce(p_external_links, '[]'::jsonb), v_diaspora
  )
  returning id into v_cafe_id;

  insert into public.cadde_cafe_members (cafe_id, user_id, status, approved_at, approved_by)
  values (v_cafe_id, v_uid, 'approved', now(), v_uid)
  on conflict (cafe_id, user_id) do nothing;

  return v_cafe_id;
end;
$function$;

revoke all on function public.create_cadde_cafe_v1(text, text, text, text, text, boolean, text, text, text, timestamptz, timestamptz, integer, jsonb, text) from public, anon;
grant execute on function public.create_cadde_cafe_v1(text, text, text, text, text, boolean, text, text, text, timestamptz, timestamptz, integer, jsonb, text) to authenticated;

commit;
