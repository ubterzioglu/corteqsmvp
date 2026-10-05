-- G17 genişletmesi: Grup sağlık skoru `group_reports`'u okur.
--
-- ═══ KAYNAK ═══
--   Politika §7 (Grup Sağlık Skoru), madde 6: "Son 90 günde onaylanmış şikayet yok" = 20 puan.
--   20261002070000 migration'ında `v_reports := true;` sabitti (group_reports YOK'tu).
--   G14 (20261005200000) group_reports tablosunu açtı → bu migration compute fonksiyonunu
--   genişletir.
--
-- ═══ TASARIM ═══
--   `group_health_score_compute(p_landing_id)` fonksiyonunda kalem 6:
--     v_reports := NOT EXISTS (
--       SELECT 1 FROM public.group_reports
--       WHERE landing_id = p_landing_id
--         AND status = 'upheld'
--         AND reviewed_at >= now() - interval '90 days'
--     )
--   Yani: Son 90 günde bu grupta ONAYLANMIŞ (upheld) şikayet VARSA → v_reports = false → 0 puan.
--   Yoksa → v_reports = true → 20 puan.
--
-- ═══ SALT EKLEME ═══
--   Fonksiyon CREATE OR REPLACE ile yeniden tanımlanır; gövde değişir, imza aynı kalır.
--   Mevcut skorlar yeniden hesaplanmaz (cron ertesi gün çalışır).

begin;

create or replace function public.group_health_score_compute(p_landing_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_landing public.whatsapp_landings%rowtype;
  v_min_days integer;
  v_cap integer;
  v_queue_days integer;
  v_report_days integer;
  v_profile boolean;
  v_rules boolean;
  v_moderation boolean;
  v_link boolean;
  v_reports boolean;
  v_rec_count integer;
  v_rec_points integer;
  v_in_grace boolean;
  v_score integer;
  v_queue_overdue boolean;
begin
  select * into v_landing from public.whatsapp_landings where id = p_landing_id;
  if not found then
    return null;
  end if;

  v_min_days := public.group_setting_int('groups.health_score_min_days_published', 7);
  v_cap := public.group_setting_int('groups.health_score_recommendation_cap', 10);
  v_queue_days := public.group_setting_int('groups.health_score_queue_window_days', 90);
  -- Şikayet penceresi KUYRUK penceresinden BAĞIMSIZ bir ayardır: ikisi aynı sayıda (90) başlasa da
  -- ayrı kararlardır; kuyruk penceresini oynatmak şikayet kalemini sessizce değiştirmemeli.
  -- Satır tohumlanmadı: yoksa varsayılan 90 (politika §7 madde 6) devreye girer.
  v_report_days := public.group_setting_int('groups.health_score_report_window_days', 90);

  -- Kalem 1 (15): açıklama ve kategori dolu ve (şehir seçili veya is_global).
  v_profile := (
    coalesce(btrim(v_landing.short_description), '') <> ''
    and coalesce(btrim(v_landing.category), '') <> ''
    and (v_landing.city_id is not null or v_landing.is_global)
  );

  -- Kalem 2 (15): rules boş değil.
  v_rules := coalesce(btrim(v_landing.rules), '') <> '';

  -- Kalem 3 (15): ownership = verified ve son 90 günde 48 saati aşan kuyruk kaydı yok.
  select exists (
    select 1
    from public.group_posts gp
    where gp.landing_id = v_landing.id
      and gp.created_at >= now() - make_interval(days => v_queue_days)
      and (
        (gp.post_status = 'pending_group_admin'
          and gp.escalate_at is not null and gp.escalate_at <= now())
        or (gp.post_status = 'pending_platform' and gp.reviewed_by is null)
      )
  ) into v_queue_overdue;
  v_moderation := (v_landing.ownership = 'verified' and not v_queue_overdue);

  -- Kalem 4 (15): link sağlığı.
  v_link := coalesce(v_landing.link_fail_count, 0) = 0;

  -- Kalem 5 (20): 20 · min(tavsiye_sayısı, cap) / cap.
  select count(*) into v_rec_count
  from public.group_recommendations
  where landing_id = v_landing.id;
  v_rec_points := round(20.0 * least(v_rec_count, v_cap) / greatest(v_cap, 1))::integer;

  -- Kalem 6 (20): son 90 günde onaylanmış şikayet yok.
  -- G14 (20261005200000) group_reports tablosunu açtı → artık okunabilir.
  v_reports := not exists (
    select 1
    from public.group_reports
    where landing_id = v_landing.id
      and status = 'upheld'
      and reviewed_at >= now() - make_interval(days => v_report_days)
  );

  -- İlk 7 gün skor null (kabul #11). published_at hiç dolmadıysa da null.
  v_in_grace := (
    v_landing.published_at is null
    or v_landing.published_at > now() - make_interval(days => v_min_days)
  );

  v_score := case
    when v_in_grace then null
    else
      (case when v_profile then 15 else 0 end)
      + (case when v_rules then 15 else 0 end)
      + (case when v_moderation then 15 else 0 end)
      + (case when v_link then 15 else 0 end)
      + v_rec_points
      + (case when v_reports then 20 else 0 end)
  end;

  return jsonb_build_object(
    'score', v_score,
    'in_grace', v_in_grace,
    'recommendation_count', v_rec_count,
    'components', jsonb_build_object(
      'profile', case when v_profile then 15 else 0 end,
      'rules', case when v_rules then 15 else 0 end,
      'moderation', case when v_moderation then 15 else 0 end,
      'link', case when v_link then 15 else 0 end,
      'recommendations', v_rec_points,
      'reports', case when v_reports then 20 else 0 end
    )
  );
end;
$$;

comment on function public.group_health_score_compute(uuid) is
  'Grup sağlık skoru (tasarım §5 birebir): 15+15+15+15+20+20. İlk 7 gün null. '
  'G17 genişletmesi (05.10): kalem 6 artık group_reports''u okur — son 90 günde '
  'onaylanmış (upheld) şikayet varsa 0 puan, yoksa 20 puan.';

commit;
