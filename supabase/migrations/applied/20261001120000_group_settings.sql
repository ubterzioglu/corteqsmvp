-- G09 · Dijital Gruplar: `group_settings` anahtar-değer ayar tablosu
--
-- BU MIGRATION SALT EKLEMEDİR. Hiçbir tablo, politika veya grant kaldırılmaz;
-- bugünkü davranış DEĞİŞMEZ. Kurduğu şey, G12–G17'nin eşiklerini kodda sabit
-- yazmak zorunda kalmaması için tek kaynak.
--
-- ═══ NEDEN YENİ TABLO ═══
-- Paketin tasarımı (`docs/dijital-gruplar/02_motor-tasarimi.md`) eşikleri
-- `site_settings` içinde tutmayı söylüyor. ⚠️ Bu varsayım ÇÜRÜDÜ (ölçüm
-- 2026-09-30, CLAUDE.md'de yazılı): `public.site_settings` anahtar-değer tablosu
-- DEĞİLDİR — tek satırlık marka tablosudur (`id · brand_name · logo_url ·
-- favicon_url · email_header_html`). Oraya anahtar yazılamaz.
--
-- Bu yüzden `public.cadde_settings` deseni birebir uygulanır: ürün kararı bir
-- SQL update'idir, kod değişikliği değil.
--
-- ═══ DEĞERLERİN KAYNAĞI ═══
-- Aşağıdaki her satırın kaynağı paketin kendi dosyalarıdır; uydurulan sayı
-- YOKTUR. Kaynak satır her anahtarın yanında yazılı (`02` = motor tasarımı,
-- `01` = politika v1.1). Kaynağı olmayan TEK anahtar `groups.otp_rate_limits`
-- olup bilerek işaretlenmiştir (↓).
--
-- ⚠️ `groups.blocklist_keywords` okuma yardımcısı (`group_setting_json`)
-- istemciye AÇILMAZ. Kara listeyi okuyabilen kullanıcı onu atlatacak metni
-- yazabilir; tarama ön eleme olduğu için gizli kalmalıdır. Sayısal eşikler
-- (bool/int) arayüzde gösterilebilsin diye `authenticated`'a açıktır —
-- `cadde_setting_*` ile aynı seçim.

begin;

create table if not exists public.group_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

comment on table public.group_settings is
  'Dijital Gruplar modül ayarları (cadde_settings deseni). Ürün eşikleri burada '
  'tutulur, kodda sabit yazılmaz; sözleşme testi src/lib/group-settings.test.ts '
  'bunu denetler. İstemci erişimi yoktur, okuma group_setting_* yardımcılarıyla.';

alter table public.group_settings enable row level security;
revoke all on table public.group_settings from anon, authenticated;

-- ── Okuma yardımcıları (public.cadde_setting_* aynası) ──────────────────────

create or replace function public.group_setting_bool(p_key text, p_default boolean)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select (value #>> '{}')::boolean from public.group_settings where key = p_key),
    p_default
  );
$$;

create or replace function public.group_setting_int(p_key text, p_default integer)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select (value #>> '{}')::integer from public.group_settings where key = p_key),
    p_default
  );
$$;

-- jsonb döner (liste/nesne değerler: kara liste, OTP sınırları).
create or replace function public.group_setting_json(p_key text, p_default jsonb)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select value from public.group_settings where key = p_key),
    p_default
  );
$$;

revoke all on function public.group_setting_bool(text, boolean) from public, anon;
revoke all on function public.group_setting_int(text, integer) from public, anon;
revoke all on function public.group_setting_json(text, jsonb) from public, anon, authenticated;
grant execute on function public.group_setting_bool(text, boolean) to authenticated;
grant execute on function public.group_setting_int(text, integer) to authenticated;

-- ── İlk satırlar ────────────────────────────────────────────────────────────

insert into public.group_settings (key, value)
values
  -- Hızlı şerit: varsayılan kapalı; 100 gruba ulaşınca moderatöre ÖNERİ çıkar,
  -- açma kararı insanındır (02 §Hızlı şerit).
  ('groups.fast_lane_enabled', 'false'::jsonb),
  ('groups.fast_lane_suggest_threshold', '100'::jsonb),

  -- Hız sınırları (02 §Hız sınırları): kullanıcı başına günde 5 grup gönderimi,
  -- 10 dakikada 3 sahiplik denemesi, günde 20 link açma.
  ('groups.daily_submit_limit', '5'::jsonb),
  ('groups.claim_attempt_limit', '3'::jsonb),
  ('groups.claim_attempt_window_minutes', '10'::jsonb),
  ('groups.invite_open_daily_limit', '20'::jsonb),

  -- Sahiplik kodu 10 dakika geçerli, aynı grup için aktif tek kod (02 §Sahiplik).
  ('groups.claim_code_ttl_minutes', '10'::jsonb),

  -- Şikayet (02 §E): eşik 3 geçerli şikayet → hidden; şikayet eden girişli,
  -- telefonu doğrulanmış ve hesabı ≥ 7 günlük; aynı kişi aynı gruba 30 günde 1.
  -- `report_require_phone` Karar 1 ile AÇIK (telefon OTP G04'te kuruluyor).
  ('groups.report_threshold', '3'::jsonb),
  ('groups.report_require_phone', 'true'::jsonb),
  ('groups.report_min_account_age_days', '7'::jsonb),
  ('groups.report_same_group_cooldown_days', '30'::jsonb),

  -- Kara liste ön taraması (02 §Kara liste): yalnız `review_flags` doldurur ve
  -- hızlı şeridi kapatır, REDDETMEZ. Liste kodda sabit yazılmaz.
  ('groups.blocklist_keywords',
   '["vize","oturum","garanti","sinyal","yatırım getirisi","kredi"]'::jsonb),

  -- Sağlık skoru (02 §Skor): grup yayında 7 günü doldurmadan skor null kalır.
  ('groups.health_score_min_days_published', '7'::jsonb),

  -- Güvenilir üye rozeti (02 §D): o grupta onaylanmış ≥ 5 gönderi.
  ('groups.trusted_member_min_approved_posts', '5'::jsonb),

  -- ⚠️ KAYNAĞI OLMAYAN TEK SATIR. Paket OTP için sayı vermiyor; SMS ÜCRETLİ
  -- (bütçe 20–25 €, T21) olduğu için sıfır sınırla bırakılamazdı. Buradaki
  -- değerler AJAN TARAFINDAN konmuş ihtiyatlı tavandır ve G05'te kullanıcıyla
  -- teyit edilmelidir (KALANLAR → G05'e not düşüldü). Değiştirmek için kod
  -- değil, bu satıra bir UPDATE yeter.
  ('groups.otp_rate_limits',
   '{"per_user_per_day": 5, "per_user_per_hour": 3, "resend_cooldown_seconds": 60, "max_verify_attempts": 5}'::jsonb)
on conflict (key) do nothing;

commit;
