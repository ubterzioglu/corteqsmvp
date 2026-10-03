-- M14 · Faz 6 — admin traction panosu: 5 türetilmiş metrik view'ı.
--
-- ═══ KURALLAR (plan Faz 6 + canlı dersler) ═══
--   • MATERIALIZED VIEW YASAK — 1 GB RAM'de refresh riski (05.08'de site 50 dk
--     düştü). Tablolar KÜÇÜK (175 kullanıcı · 30 cadde · 10 grup · 1 etkinlik,
--     03.10 ölçümü) → normal view yeterli, yazma yükü sıfır.
--   • Ham view'a ANON GRANT YOK — her view `where is_admin(auth.uid())` ile
--     gövdede kilitli; anon'a SELECT verilmez (PostgREST permission denied).
--   • 🔴 `is_admin()` PARAMETRESİZ DEĞİL — canlı imza `is_admin(uid uuid)`,
--     sıfır argümanlı aşırı yükleme YOK (G06'da parametresiz çağrı migration'ı
--     "function does not exist" ile düşürdü). Burada HER zaman `is_admin(auth.uid())`.
--   • View'lar OWNER (postgres) yetkisiyle çalışır → auth.users'ı RLS'e takılmadan
--     okur; ama `auth.uid()` çağıranın JWT sub'ıdır, yani is_admin guard ÇAĞIRANA
--     göre değerlendirilir. security_invoker KULLANILMAZ (auth.users RLS'i admini
--     de bloklardı).
--
-- ═══ GUARD DESENİ ═══
--   `from (select 1) dummy where public.is_admin(auth.uid())`:
--     • admin     → 1 satır + gerçek metrikler
--     • non-admin → 0 satır (aggregate ZORLAMAZ çünkü dummy tek satır, where eler)
--     • anon      → grant yok → permission denied (hata)
--   Böylece "non-admin gerçek veri görüyor mu?" ayırt edilebilir (vakum değil).
--
-- ═══ METRİK TANIMLARI (plan Faz 6) ═══
--   1 weekly_active_users  — son 7 günde giriş (auth.users.last_sign_in_at) VEYA
--                            içerik üreten (events/carsi/cadde/group_posts) distinct kullanıcı
--   2 content_created      — haftalık + toplam: etkinlik · cadde gönderisi · grup ·
--                            çarşı ilanı · grup gönderisi (tavsiye M17'ye dek 0)
--   3 recommendation_response_rate — M17 öncesi BOŞ (available=false) — normal
--   4 invite_signups       — user_invite_redemptions (7g/30g/toplam)
--   5 30d_return_rate      — ≥30 gün önce kaydolup son 30 günde dönen oranı

begin;

-- ── 1) Haftalık aktif kullanıcı ─────────────────────────────────────────────
create or replace view public.metrics_weekly_active_users as
select
  (select count(distinct uid) from (
     select id as uid from auth.users
       where last_sign_in_at >= now() - interval '7 days'
     union
     select user_id from public.events
       where created_at >= now() - interval '7 days' and user_id is not null
     union
     select owner_user_id from public.carsi_items
       where created_at >= now() - interval '7 days' and owner_user_id is not null
     union
     select author_user_id from public.cadde_posts
       where created_at >= now() - interval '7 days' and author_user_id is not null
     union
     select author_user_id from public.group_posts
       where created_at >= now() - interval '7 days' and author_user_id is not null
   ) u) as active_7d,
  7 as window_days
from (select 1) dummy
where public.is_admin(auth.uid());

comment on view public.metrics_weekly_active_users is
  'Faz 6 traction (M14): son 7 gün aktif kullanıcı (giriş VEYA içerik üretimi). '
  'admin-only (is_admin(auth.uid()) guard) · MATERIALIZED DEGIL · anon grant YOK.';

-- ── 2) Üretilen içerik ──────────────────────────────────────────────────────
create or replace view public.metrics_content_created as
select
  (select count(*) from public.events
     where created_at >= now() - interval '7 days') as events_7d,
  (select count(*) from public.events) as events_total,
  (select count(*) from public.cadde_posts
     where created_at >= now() - interval '7 days') as cadde_posts_7d,
  (select count(*) from public.cadde_posts) as cadde_posts_total,
  (select count(*) from public.carsi_items
     where created_at >= now() - interval '7 days') as carsi_items_7d,
  (select count(*) from public.carsi_items) as carsi_items_total,
  (select count(*) from public.whatsapp_landings
     where created_at >= now() - interval '7 days') as groups_7d,
  (select count(*) from public.whatsapp_landings) as groups_total,
  (select count(*) from public.group_posts
     where created_at >= now() - interval '7 days') as group_posts_7d,
  (select count(*) from public.group_posts) as group_posts_total,
  0 as recommendations_total,  -- Tavsiye (M17) gelene dek 0 — normal
  7 as window_days
from (select 1) dummy
where public.is_admin(auth.uid());

comment on view public.metrics_content_created is
  'Faz 6 traction (M14): haftalık + toplam içerik (etkinlik/cadde/çarşı/grup/grup '
  'gönderisi). Tavsiye M17''e dek 0. admin-only · MATERIALIZED DEGIL · anon grant YOK.';

-- ── 3) Tavsiye yanıt oranı (M17 öncesi boş) ─────────────────────────────────
create or replace view public.metrics_recommendation_response_rate as
select
  false as available,
  0 as total,
  0 as responded,
  null::numeric as response_rate,
  'Tavsiye modülü (M17) gelene dek boş — normal' as note
from (select 1) dummy
where public.is_admin(auth.uid());

comment on view public.metrics_recommendation_response_rate is
  'Faz 6 traction (M14): yanıtlanan/toplam tavsiye talebi. M17 tavsiye modülü '
  'gelene dek available=false (boş dönmesi NORMAL). admin-only · anon grant YOK.';

-- ── 4) Davetle gelen kayıt ──────────────────────────────────────────────────
create or replace view public.metrics_invite_signups as
select
  (select count(*) from public.user_invite_redemptions
     where redeemed_at >= now() - interval '7 days') as last_7d,
  (select count(*) from public.user_invite_redemptions
     where redeemed_at >= now() - interval '30 days') as last_30d,
  (select count(*) from public.user_invite_redemptions) as total
from (select 1) dummy
where public.is_admin(auth.uid());

comment on view public.metrics_invite_signups is
  'Faz 6 traction (M14): davetle gelen kayıt (user_invite_redemptions, 7g/30g/toplam). '
  'admin-only · MATERIALIZED DEGIL · anon grant YOK.';

-- ── 5) 30 gün geri dönüş oranı ──────────────────────────────────────────────
create or replace view public.metrics_30d_return_rate as
select
  (select count(*) from auth.users
     where created_at <= now() - interval '30 days') as cohort_size,
  (select count(*) from auth.users
     where created_at <= now() - interval '30 days'
       and last_sign_in_at >= now() - interval '30 days') as returned,
  case
    when (select count(*) from auth.users where created_at <= now() - interval '30 days') = 0
      then null
    else round(
      (select count(*) from auth.users
         where created_at <= now() - interval '30 days'
           and last_sign_in_at >= now() - interval '30 days')::numeric
      / (select count(*) from auth.users where created_at <= now() - interval '30 days'),
      4)
  end as return_rate,
  30 as window_days
from (select 1) dummy
where public.is_admin(auth.uid());

comment on view public.metrics_30d_return_rate is
  'Faz 6 traction (M14): ≥30 gün önce kaydolup son 30 günde geri dönen oranı. '
  'Cohort boşsa rate NULL (uydurma yüzde yok). admin-only · anon grant YOK.';

-- ── Grant'lar: anon YOK, authenticated VAR (guard içeride) ──────────────────
-- revoke from public/anon → anon permission denied (hata). grant authenticated →
-- admin is_admin guard'ı geçer (1 satır), non-admin 0 satır.
do $$
declare v text;
begin
  foreach v in array array[
    'metrics_weekly_active_users','metrics_content_created',
    'metrics_recommendation_response_rate','metrics_invite_signups',
    'metrics_30d_return_rate'
  ] loop
    execute format('revoke all on public.%I from public, anon, authenticated', v);
    execute format('grant select on public.%I to authenticated', v);
  end loop;
end $$;

commit;
