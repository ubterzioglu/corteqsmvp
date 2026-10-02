-- G24 · Dijital Gruplar: M5 Moderatör paneli zemini (`/admin/gruplar`)
--
-- ═══ KAPSAM ═══
-- Tasarım §10: tek ekran dört kuyruk + üst şerit (kuyruk sayıları · moderasyondan
-- geçen grup sayacı x/100 · hızlı şerit anahtarı · görevlerin son çalışma zamanı).
-- Kuyruk VERİSİ istemciden RLS ile okunur (admin select politikaları G13/G16'da
-- hazır); bu migration yalnız İKİ eksik kapıyı ekler:
--   1. `admin_set_group_setting` — hızlı şerit anahtarının YAZMA yolu.
--      group_settings istemciye tamamen kapalı (G09); `set_notification_setting`
--      deseni birebir kopyalandı (is_admin + ANAHTAR BEYAZ LİSTESİ + updated_by).
--   2. `group_moderator_summary` — üst şerit: sayaçlar + cron.job_run_details
--      (cron şeması istemciye kapalı; güvenlik tanımlı fonksiyon şart).
--
-- ═══ KARARLAR ═══
--   • Beyaz liste TEK anahtar: `groups.fast_lane_enabled` (kabul: "anahtar
--     group_settings'i yazıyor"). Diğer eşikler ürün kararı = SQL update
--     (G09 doktrini) — panelden ayar yüzeyi UYDURULMAZ.
--   • "Moderasyondan geçen grup" sayacı = `listing_status='published'` sayısı;
--     eşik `groups.fast_lane_suggest_threshold` (100) — §2: "100'e ulaşınca
--     öneri görünür, açma kararı insanındır".
--   • Şikayet kuyruğu sayacı BUGÜN 0 döner (`group_reports` YOK — G14 ⛔);
--     panel boş durumu "G14'te açılacak" diye yazar, şema uydurulmaz.
--   • Görev son çalışmaları: `group_%` isimli cron işleri (G22) — iş başına son
--     run (status + end_time). Radar dersi: "cron yeşil" kanıt değildir; panel
--     SON KOŞUYU gösterir, etkiyi değil — etki ölçümü kabul testlerinde.
--
-- ═══ SALT EKLEME ═══
-- Tablo/kolon/fonksiyon düşürmez; mevcut RPC'lere dokunmaz.

begin;

-- ── 1) Hızlı şerit anahtarı (admin, beyaz liste) ────────────────────────────

create or replace function public.admin_set_group_setting(p_key text, p_value jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if not public.is_admin(v_uid) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  -- Beyaz liste: panelden YALNIZ hızlı şerit anahtarı yazılabilir (G24 kabulü).
  -- Eşikler ürün kararıdır, SQL update ister (G09 doktrini).
  if p_key is null or p_key not in ('groups.fast_lane_enabled') then
    raise exception 'unknown_setting_key' using errcode = '22023';
  end if;
  if p_value is null or jsonb_typeof(p_value) <> 'boolean' then
    raise exception 'setting_value_must_be_boolean' using errcode = '22023';
  end if;

  insert into public.group_settings as s (key, value, updated_at, updated_by)
  values (p_key, p_value, now(), v_uid)
  on conflict (key) do update
     set value = excluded.value,
         updated_at = now(),
         updated_by = v_uid;

  return jsonb_build_object('key', p_key, 'value', p_value);
end;
$$;

comment on function public.admin_set_group_setting(text, jsonb) is
  'Moderatör paneli ayar anahtarı (G24): YALNIZ is_admin + YALNIZ beyaz listedeki '
  'anahtarlar (bugün: groups.fast_lane_enabled). set_notification_setting deseni. '
  'Diğer group_settings anahtarları ürün kararıdır — SQL update (G09 doktrini).';

revoke all on function public.admin_set_group_setting(text, jsonb) from public, anon;
grant execute on function public.admin_set_group_setting(text, jsonb) to authenticated;

-- ── 2) Üst şerit: kuyruk sayıları + sayaç + görev son koşuları ───────────────

create or replace function public.group_moderator_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_pending_groups integer;
  v_pending_claims integer;
  v_pending_posts integer;
  v_moderated integer;
  v_threshold integer;
  v_fast boolean;
  v_runs jsonb;
begin
  if not public.is_admin(v_uid) then
    raise exception 'group_moderator_forbidden';
  end if;

  select count(*) into v_pending_groups
  from public.whatsapp_landings where listing_status = 'pending_review';

  -- Tasarım §10: sahiplik kuyruğu = ekran görüntüsü yöntemi (kod yolu otomatik).
  select count(*) into v_pending_claims
  from public.group_claims
  where status = 'pending' and method = 'screenshot';

  select count(*) into v_pending_posts
  from public.group_posts where post_status = 'pending_platform';

  select count(*) into v_moderated
  from public.whatsapp_landings where listing_status = 'published';

  v_threshold := public.group_setting_int('groups.fast_lane_suggest_threshold', 100);
  v_fast := public.group_setting_bool('groups.fast_lane_enabled', false);

  select coalesce(jsonb_agg(jsonb_build_object(
           'jobname', j.jobname,
           'schedule', j.schedule,
           'last_status', r.status,
           'last_end_time', r.end_time
         ) order by j.jobname), '[]'::jsonb)
    into v_runs
  from cron.job j
  left join lateral (
    select d.status, d.end_time
    from cron.job_run_details d
    where d.jobid = j.jobid
    order by d.start_time desc
    limit 1
  ) r on true
  where j.jobname like 'group\_%';

  return jsonb_build_object(
    'pending_groups', v_pending_groups,
    'pending_claims', v_pending_claims,
    'pending_posts', v_pending_posts,
    -- group_reports YOK (G14 ⛔) — şema uydurulmaz, sayaç 0 döner.
    'pending_reports', 0,
    'moderated_count', v_moderated,
    'fast_lane_suggest_threshold', v_threshold,
    'fast_lane_enabled', v_fast,
    'task_runs', v_runs
  );
end;
$$;

comment on function public.group_moderator_summary() is
  'M5 üst şeridi (G24, tasarım §10): dört kuyruk sayacı · moderasyondan geçen '
  'grup (published) sayacı + eşik · hızlı şerit bayrağı · group_% cron işlerinin '
  'son koşuları (cron.job_run_details istemciye kapalı — bu fonksiyon şart). '
  'pending_reports G14''e dek sabit 0 (group_reports YOK, uydurulmadı).';

revoke all on function public.group_moderator_summary() from public, anon;
grant execute on function public.group_moderator_summary() to authenticated;

commit;
