-- G17 · Dijital Gruplar: Grup Sağlık Skoru + tavsiyeler (`group_recommendations`)
--
-- ═══ TASARIM §5 FORMÜLÜ (birebir) ═══
--   skor =
--     15 · (açıklama ve kategori dolu ve (şehir seçili veya is_global))
--   + 15 · (rules boş değil)
--   + 15 · (ownership = verified ve son 90 günde 48 saati aşan kuyruk kaydı yok)
--   + 15 · (son 4 link kontrolünün tamamı başarılı)
--   + 20 · min(tavsiye_sayısı, 10) / 10
--   + 20 · (son 90 günde onaylanmış şikayet yok)
--   • Günlük yeniden hesaplanır (cron G22'de bağlanır — `health-score` görevi).
--   • Yayında 7 gün dolmadan skor `null` (kabul #11; eşik G09'da seed edildi).
--   • Rozet ≥70'te kazanılır, <65'te kaybedilir (histerezis — 02 §5).
--
-- ═══ ÖLÇÜLEN GERÇEK (02.10, canlı + src) ═══
--   • `whatsapp_landings.group_score` kolonu MEVCUT (2026-06-03, arşiv migration)
--     ve 10/10 satırda NULL. Tasarım §4 "health_score" der — isimler kavramsal,
--     motor mevcut `group_score`'a yazar (KALANLAR G17 satırı).
--   • 🔴 ESKİ KOD group_score'A YAZIYOR: `updateLanding` (src/lib/whatsapp-landings.ts,
--     1a3310a1 · 03.06 → canlı pakette) her admin düzenleme kaydında
--     `group_score: null` gönderiyor (çağıran `groupScore` geçmiyor). DB tarafında
--     yazan yok (tek referans `catalog_sync_whatsapp_landing`, o da OKUR).
--     Bu batch'te src düzeltiliyor; guard v3 admin'i MUAF tutuyor ki canlı
--     moderasyon kaydı deploy'a kadar kırılmasın (legacy `status` doktrini).
--   • `group_reports` YOK (G14 açacak) → "onaylanmış şikayet yok" kalemi bugün
--     vacuous TRUE; compute fonksiyonu tabloya BAKAMAZ (G16 deseni, sözleşme
--     testi kilitler).
--   • Link kontrolü geçmişi YOK: tasarım §4'te tarihçe tablosu yok; mevcut
--     karşılık `link_fail_count` + `link_checked_at` (G10). "son 4 kontrol"ün
--     bugün taşınabilir karşılığı `link_fail_count = 0` (kontrol hiç koşmadıysa
--     başarısızlık kanıtı da yok — vacuous, şikayet kalemiyle aynı sınıf).
--     G22 link-health görevi gerçek sinyali üretir; gerekirse tarihçeyi O ekler.
--
-- ═══ KARARLAR (tasarımın boş bıraktığı yerler) ═══
--   • "48 saati aşan kuyruk kaydı" = o grupta, pencere içinde OLUŞTURULMUŞ ve
--     (a) `pending_group_admin` durumunda `escalate_at`'i geçmiş VEYA
--     (b) eskale olmuş (`pending_platform`) ama henüz KARAR VERİLMEMİŞ
--     (`reviewed_by is null`) gönderi. Sahip/admin kuyruğu eritince kalem
--     geri kazanılır (G21 "Kurallarını ekle, +15" rehberliğiyle aynı ruh).
--     Doğrulanmış grupta `pending_platform`+kararsız satır eskalasyondan gelir
--     (G16 ilk durum tablosu: sahipli grupta başlangıç `pending_group_admin`).
--   • Tavsiye yalnız `published` gruba (G16 `group_post_create` kararıyla aynı:
--     gizli/askıda grubun kartı görünmez, tavsiyesi anlamsız).
--   • Günlük hesap dışı YENİDEN HESAP TETİKLENMEZ (tasarım: "Günlük yeniden
--     hesaplanır") — tavsiye RPC'si skoru anında güncellemez, ertesi gün yansır.
--   • Skor kolonları (`group_score`, `has_approved_badge`, `group_score_breakdown`,
--     `group_score_computed_at`) motor alanıdır: guard v3 sahibi/anonimi engeller,
--     `via_rpc` bayrağı ve `is_admin` muaf (↑ canlı paket ölçümü).
--   • `whatsapp_landings_public` view'ına (G03a) rozet KOLONU EKLENMEDİ —
--     kart/detay yeniden yapımı G19/G20'nin işi; view'ı drop/recreate etmek bu
--     batch'in salt-ekleme ilkesini bozardı.
--   • `post_max_chars` sınıfı bir AJAN İHTİYATI YOK: buradaki her sayının kaynağı
--     paket (15/15/15/15/20/20 · 70/65 · 10 · 90 gün · 7 gün · 48 saat).
--
-- ═══ SALT EKLEME ═══
-- Hiçbir tablo/kolon/politika DÜŞÜRÜLMEZ. Yeni kolonlar `if not exists`.
-- group_recommendations'a istemci doğrudan YAZAMAZ (insert/update/delete grant
-- ve politika YOK; tek yol `group_recommendation_set` RPC'si — G16 deseni).
-- ⚠️ Bu migration HİÇBİR landing satırını güncellemez: skorlar canlıda cron
-- (G22) bağlanana kadar NULL kalır — bilerek (canlı eski kart "X / 10" çiziyor;
-- kalıcı yazım frontend deploy'undan ÖNCE kullanıcıya yanlış ölçek gösterirdi).

begin;

-- ── 1) Motor kolonları (salt ekleme) ─────────────────────────────────────────

alter table public.whatsapp_landings
  add column if not exists has_approved_badge boolean not null default false,
  add column if not exists group_score_computed_at timestamptz,
  add column if not exists group_score_breakdown jsonb;

comment on column public.whatsapp_landings.has_approved_badge is
  '"Onaylı Grup" rozeti (G17, tasarım §5): skor ≥ badge_award ile kazanılır, '
  '< badge_revoke ile kaybedilir (histerezis). Yalnız group_health_score_recompute yazar.';

comment on column public.whatsapp_landings.group_score_breakdown is
  'Son hesaplanan skorun kalem kırılımı (G17): G21 sahip paneli "eksik adım" '
  'rehberliğini buradan gösterir. Yalnız motor yazar.';

-- ── 2) Eşikler (G09 doktrini: kodda sabit YOK; hepsi paket kaynaklı) ─────────

insert into public.group_settings (key, value)
values
  -- Tasarım §5: "Skor ≥ 70 → Onaylı Grup. Rozet kaybı skor 65'in altına düşünce."
  ('groups.health_score_badge_award', '70'::jsonb),
  ('groups.health_score_badge_revoke', '65'::jsonb),
  -- Tasarım §5 formülü: "20 · min(tavsiye_sayısı, 10) / 10".
  ('groups.health_score_recommendation_cap', '10'::jsonb),
  -- Tasarım §5: "son 90 günde 48 saati aşan kuyruk kaydı yok".
  ('groups.health_score_queue_window_days', '90'::jsonb)
  -- 7 gün eşiği G09'da zaten seed edildi: groups.health_score_min_days_published.
on conflict (key) do nothing;

-- ── 3) Tavsiyeler ("Bu gruptayım, tavsiye ederim" — tasarım §4) ──────────────

create table if not exists public.group_recommendations (
  id uuid primary key default gen_random_uuid(),
  landing_id uuid not null references public.whatsapp_landings(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Tasarım §4: "kullanıcı + grup, tekil"
  unique (landing_id, user_id)
);

comment on table public.group_recommendations is
  'Grup tavsiyeleri (G17, tasarım §4/§5): kullanıcı + grup tekil. Skorun '
  'tavsiye kalemi buradan sayar. Yazma yolu yalnız group_recommendation_set '
  'RPC''si (insert/update/delete grant ve politika YOK).';

create index if not exists group_recommendations_landing_idx
  on public.group_recommendations (landing_id);

alter table public.group_recommendations enable row level security;
revoke all on table public.group_recommendations from anon, authenticated;
grant select on table public.group_recommendations to anon, authenticated;

-- Okuma: kullanıcı kendi tavsiyesini (buton durumu) + admin her şeyi görür.
-- Sayı zaten herkese açık bilgi (skor kalemi); liste teşhiri tasarında yok.
drop policy if exists group_recommendations_select_own on public.group_recommendations;
create policy group_recommendations_select_own on public.group_recommendations
  for select to anon, authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- ── 4) Tavsiye RPC'si (tek kapı) ─────────────────────────────────────────────

create or replace function public.group_recommendation_set(p_landing_id uuid, p_recommend boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_listing text;
  v_count integer;
begin
  if v_uid is null then
    raise exception 'group_recommendation_auth_required';
  end if;
  if p_recommend is null then
    raise exception 'group_recommendation_invalid';
  end if;

  select listing_status into v_listing
  from public.whatsapp_landings
  where id = p_landing_id;
  if not found then
    raise exception 'group_not_found';
  end if;
  -- G16 group_post_create kararıyla aynı: yalnız published grup tavsiye edilir.
  if v_listing <> 'published' then
    raise exception 'group_not_published';
  end if;

  if p_recommend then
    insert into public.group_recommendations (landing_id, user_id)
    values (p_landing_id, v_uid)
    on conflict (landing_id, user_id) do nothing;
  else
    delete from public.group_recommendations
    where landing_id = p_landing_id and user_id = v_uid;
  end if;

  select count(*) into v_count
  from public.group_recommendations
  where landing_id = p_landing_id;

  return jsonb_build_object(
    'recommended', p_recommend,
    'recommendation_count', v_count);
end;
$$;

comment on function public.group_recommendation_set(uuid, boolean) is
  'Tavsiye aç/kapat (G17): idempotent, kullanıcı+grup tekil, yalnız published '
  'gruba. Skoru ANINDA güncellemez — tasarım §5: günlük hesap (cron G22).';

revoke all on function public.group_recommendation_set(uuid, boolean) from public, anon;
grant execute on function public.group_recommendation_set(uuid, boolean) to authenticated;

-- ── 5) Skor hesaplama (tasarım §5 birebir; SAF okuma, yazmaz) ────────────────

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
  v_profile boolean;
  v_rules boolean;
  v_moderation boolean;
  v_queue_overdue boolean;
  v_link boolean;
  v_reports boolean;
  v_rec_count integer;
  v_rec_points integer;
  v_in_grace boolean;
  v_score integer;
begin
  select * into v_landing from public.whatsapp_landings where id = p_landing_id;
  if not found then
    return null;
  end if;

  v_min_days := public.group_setting_int('groups.health_score_min_days_published', 7);
  v_cap := public.group_setting_int('groups.health_score_recommendation_cap', 10);
  v_queue_days := public.group_setting_int('groups.health_score_queue_window_days', 90);

  -- Kalem 1 (15): açıklama ve kategori dolu ve (şehir seçili veya is_global).
  -- Açıklama = motor alanı `short_description` (tasarım §4, 160); legacy
  -- `description` DEĞİL — G11 göçü short_description'ı doldurana kadar bu
  -- kalem mevcut 10 grupta boş kalır (bilinçli, ekip kararı alanına dokunulmaz).
  v_profile := (
    coalesce(btrim(v_landing.short_description), '') <> ''
    and coalesce(btrim(v_landing.category), '') <> ''
    and (v_landing.city_id is not null or v_landing.is_global)
  );

  -- Kalem 2 (15): rules boş değil.
  v_rules := coalesce(btrim(v_landing.rules), '') <> '';

  -- Kalem 3 (15): ownership = verified ve son 90 günde 48 saati aşan kuyruk
  -- kaydı yok (↑ KARARLAR: süresi dolmuş pending_group_admin VEYA eskale olmuş
  -- kararsız pending_platform).
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

  -- Kalem 4 (15): link sağlığı. ⚠️ TARİHÇE TABLOSU YOK (↑ ÖLÇÜLEN GERÇEK) —
  -- bugünkü karşılık: G22'nin sayacı sıfır (hiç kontrol koşmadıysa başarısızlık
  -- kanıtı da yok; vacuous). "son 4 kontrol" tarihçesini G22 kararlaştırır.
  v_link := coalesce(v_landing.link_fail_count, 0) = 0;

  -- Kalem 5 (20): 20 · min(tavsiye_sayısı, cap) / cap.
  select count(*) into v_rec_count
  from public.group_recommendations
  where landing_id = v_landing.id;
  v_rec_points := round(20.0 * least(v_rec_count, v_cap) / greatest(v_cap, 1))::integer;

  -- Kalem 6 (20): son 90 günde onaylanmış şikayet yok. ⚠️ `group_reports`
  -- canlıda YOK (G14 açacak) — şema uydurulmaz, G16 deseni: bugün vacuous TRUE.
  -- G14 bu fonksiyonu genişletirken src/lib/group-health-score-schema.test.ts
  -- bilinçli güncellenecek (kilit: compute `group_reports`'a BAKAMAZ).
  v_reports := true;

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
  'Grup sağlık skoru (tasarım §5 birebir): 15+15+15+15+20+20. İlk 7 gün null '
  '(groups.health_score_min_days_published). group_reports ve link tarihçesi '
  'BUGÜN YOK — ilgili kalemler vacuous (↑ migration başlığı). SAF okuma; '
  'yazım group_health_score_recompute''ta.';

revoke all on function public.group_health_score_compute(uuid) from public, anon;
grant execute on function public.group_health_score_compute(uuid) to authenticated;

-- ── 6) Tek grup yeniden hesap (yazan yol; via_rpc + guard v3) ─────────────────

create or replace function public.group_health_score_recompute(p_landing_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_computed jsonb;
  v_score integer;
  v_old_badge boolean;
  v_award integer;
  v_revoke integer;
  v_new_badge boolean;
begin
  v_computed := public.group_health_score_compute(p_landing_id);
  if v_computed is null then
    raise exception 'group_not_found';
  end if;
  v_score := case
    when jsonb_typeof(v_computed -> 'score') = 'number'
      then (v_computed ->> 'score')::integer
    else null
  end;

  select has_approved_badge into v_old_badge
  from public.whatsapp_landings
  where id = p_landing_id
  for update;

  v_award := public.group_setting_int('groups.health_score_badge_award', 70);
  v_revoke := public.group_setting_int('groups.health_score_badge_revoke', 65);

  -- Histerezis (tasarım §5): ≥70 kazanır · <65 kaybeder · aradaki bant mevcut
  -- rozeti KORUR (sürekli gidip gelmesin). Skor null (ilk 7 gün) → rozet yok.
  v_new_badge := case
    when v_score is null then false
    when v_score >= v_award then true
    when v_score < v_revoke then false
    else v_old_badge
  end;

  perform set_config('group_status.via_rpc', 'on', true);
  update public.whatsapp_landings
     set group_score = v_score,
         has_approved_badge = v_new_badge,
         group_score_breakdown = v_computed -> 'components',
         group_score_computed_at = case when v_score is null then null else now() end
   where id = p_landing_id;
  perform set_config('group_status.via_rpc', '', true);

  return jsonb_build_object(
    'landing_id', p_landing_id,
    'score', v_score,
    'badge', v_new_badge);
end;
$$;

comment on function public.group_health_score_recompute(uuid) is
  'Skoru hesaplar ve group_score + has_approved_badge + breakdown''a YAZAR '
  '(G17). Histerezis: award ≥70 / revoke <65 (group_settings). Yetki '
  'service_role — günlük cron G22''de bağlanır.';

revoke all on function public.group_health_score_recompute(uuid) from public, anon, authenticated;
grant execute on function public.group_health_score_recompute(uuid) to service_role;

-- ── 7) Günlük tur (cron G22: `health-score`) ─────────────────────────────────

create or replace function public.group_health_scores_recompute_all()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_count integer := 0;
begin
  for v_row in select id from public.whatsapp_landings loop
    perform public.group_health_score_recompute(v_row.id);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

comment on function public.group_health_scores_recompute_all() is
  'Tüm grupların skorunu yeniden hesaplar (tasarım §5: günlük). G22 '
  'health-score cron''u bunu çağırır; yetki service_role (pg_cron/edge).';

revoke all on function public.group_health_scores_recompute_all() from public, anon, authenticated;
grant execute on function public.group_health_scores_recompute_all() to service_role;

-- ── 8) Guard v3: skor kolonları motor alanı ──────────────────────────────────
--
-- 🔴 Ölçüldü (02.10): guard v2 group_score'u KORUMUYORDU — sahibi kendi
-- satırına `group_score=100` yazabilirdi (`Users can update own landings`).
-- ⚠️ Canlı eski paket admin moderasyon kaydında `group_score: null` GÖNDERİYOR
-- (updateLanding, 1a3310a1) → admin yolu MUAF tutulur, yoksa canlı moderasyon
-- ekranı deploy'a kadar kırılır (legacy `status` doktrini, G12). src tarafında
-- clobber bu batch'te kaldırıldı; canlı pakette deploy'a (G03b kuyruğu) dek sürer.

create or replace function public.whatsapp_landings_guard_listing_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- RPC yolu: transaction-local bayrak açıksa izin ver (set_group_status_v1,
  -- group_claim_apply_verified, group_health_score_recompute ve migration
  -- betikleri açar)
  if coalesce(current_setting('group_status.via_rpc', true), '') = 'on' then
    return new;
  end if;

  -- Eski paket legacy `status`'ü ve içerik alanlarını (tagline, group_name…)
  -- günceller; bunlar SERBEST. Yalnız korunan alanlar değişiyorsa engelle.
  if new.listing_status is distinct from old.listing_status then
    raise exception 'group_status_direct_update_forbidden';
  end if;

  -- G13: sahiplik yalnız sahiplik akışıyla yazılır (kendini doğrulama kapatıldı)
  if new.ownership is distinct from old.ownership
     or new.owner_user_id is distinct from old.owner_user_id then
    raise exception 'group_ownership_direct_update_forbidden';
  end if;

  -- G13: motorun sahip olduğu sayaçlar/yaşam döngüsü alanları (G15/G22 bunları
  -- zamanlanmış görevlerle yazar; kullanıcı karışamaz)
  if new.hidden_reason is distinct from old.hidden_reason
     or new.submitted_as_admin is distinct from old.submitted_as_admin
     or new.review_flags is distinct from old.review_flags
     or new.strike_count is distinct from old.strike_count
     or new.published_at is distinct from old.published_at
     or new.suspended_until is distinct from old.suspended_until
     or new.owner_renewal_due is distinct from old.owner_renewal_due
     or new.link_fail_count is distinct from old.link_fail_count
     or new.link_checked_at is distinct from old.link_checked_at
     or new.invite_code is distinct from old.invite_code
     or new.platform is distinct from old.platform then
    raise exception 'group_engine_field_direct_update_forbidden';
  end if;

  -- G17 (guard v3): skor + rozet yalnız motor RPC'siyle yazılır. Admin MUAF:
  -- canlı eski paket moderasyon kaydı `group_score: null` gönderiyor (↑ ölçüm);
  -- deploy'a kadar kırılmamalı. Sahip/anonim kendi skorunu YÜKSELTEMESİN.
  if (new.group_score is distinct from old.group_score
      or new.has_approved_badge is distinct from old.has_approved_badge
      or new.group_score_computed_at is distinct from old.group_score_computed_at
      or new.group_score_breakdown is distinct from old.group_score_breakdown)
     and not public.is_admin(auth.uid()) then
    raise exception 'group_score_direct_update_forbidden';
  end if;

  return new;
end;
$$;

comment on function public.whatsapp_landings_guard_listing_status() is
  'whatsapp_landings motor alanlarını doğrudan update''e karşı korur. Kapsam: '
  'listing_status (G12) + ownership/owner_user_id + motor sayaçları (G13) + '
  'skor/rozet kolonları (G17, admin muaf — canlı paket clobber''ı). Ad '
  'tarihsel (G12); trigger trg_guard_listing_status yerinde. İçerik/legacy '
  'alanları (status, tagline, group_name, description…) SERBESTTİR.';

commit;
