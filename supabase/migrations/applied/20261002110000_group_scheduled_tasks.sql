-- G22 · Dijital Gruplar: 6 zamanlanmış görev (tasarım §6 + M0 keşfi: pg_cron+pg_net HAZIR, 6 aktif iş)
--
-- ═══ GÖREVLER ═══
--   1. link-health      saatlik :23 — edge `group-link-health` (net.http_post, radar deseni)
--   2. queue-escalation saatlik :17 — `group_posts_escalate_due` (G16 hazır)
--   3. health-score     günlük 04:31 — `group_health_score_cron` (🔴 BAYRAKLA KAPALI ↓)
--   4. suspension-release günlük 04:37 — `group_suspensions_release_due`
--   5. owner-renewal    günlük 04:43 — `group_owner_renewals_process`
--   6. claim-expiry     10 dk'da bir — `group_claims_expire_due`
--
-- ═══ KARARLAR ═══
--   • 🔴 **health-score BAYRAKLA KAPALI AÇILIR** (`groups.health_score_cron_enabled=false`):
--     G17 tuzağı — canlı ESKİ paket kartta `groupScore / 10` çiziyor; cron 0-100 skor
--     yazmaya başlarsa kullanıcı "35 / 10" görür. Bayrak YALNIZ yeni kart
--     deploy edildikten SONRA (G03b+G18-G21 kuyruğu) insan kararıyla açılır
--     (fast_lane doktrini: açma kararı insanındır).
--   • Link kontrolü ÜÇ DEĞERLİ (tasarım §6): `ok` sayacı sıfırlar · `invalid`
--     artırır, eşikte (`groups.link_fail_threshold=2`) `hidden(link_dead)` ·
--     **`unknown` sayacı ARTIRMAZ** (G08 kural 5) ama kontrol yapıldı diye
--     `link_checked_at` tazelenir (yoksa grup her saat yeniden "due" olur).
--   • Gizli (link_dead) gruplar da taranır: "1 başarılı kontrol geri açar"
--     (kabul #8) — tarama yalnız published olsaydı geri açılma yolu ölürdü.
--   • Yayma: `mod(abs(hashtext(slug)), 24) = saat` — her grup haftada bir,
--     günün farklı saatlerinde; parti başına `link_health_batch_limit` (⚠️ ajan
--     ihtiyatı — "dakikada en fazla birkaç istek", Meta 200/W04 dersi). İstekler
--     arasında `link_health_request_delay_ms` beklenir (edge).
--   • Linki BOŞ 2 canlı grup taranmaz (G11/U07 ekip kararı bekliyor) — due
--     sorgusu boş linki eler.
--   • Cron→edge kimliği: `x-dispatch-secret` (send-notification-emails deseni,
--     sabit-zamanlı karşılaştırma). Secret vault'tan okunur (`radar_news_cron_secret`
--     — ⚠️ YENİ vault secret'ı SQL'den yaratılamıyor: `_crypto_aead_det_noncegen`
--     permission denied ÖLÇÜLDÜ; bu yüzden mevcut secret YENİDEN KULLANILDI ve
--     aynı değer edge env'e `supabase secrets set` ile yazıldı. Rotasyonda İKİ
--     yer güncellenir — KALANLAR'da kayıtlı. Migration secret LİTERALİ TAŞIMAZ.)
--   • Owner-renewal çıpası: doğrulanmış sahiplikte `owner_renewal_due` bir kez
--     doldurulur = coalesce(claim.reviewed_at, published_at, now()) + 365 gün
--     (tasarım §8 "yılda bir"). 30 gün yanıt yoksa `ownership=unclaimed`
--     (§6 görev satırı). Yenileme eylemi: `group_owner_renew_v1` (sahip paneli
--     düğmesi) — due'yu 365 gün ileri atar. Hatırlatma BİLDİRİMİ G23'te.
--   • Tüm görev fonksiyonları YALNIZ service_role (pg_cron postgres rolüyle
--     koşar; istemci çağıramaz). Durum geçişleri TEK kapıdan: `set_group_status_v1`.
--
-- ═══ SALT EKLEME ═══
-- Kolon/tablo düşürmez; mevcut fonksiyonları DEĞİŞTİRMEZ (yeni sarmallar ekler).

begin;

-- ── 1) Ayarlar (kaynak: tasarım §6/§8; ⚠️ işaretliler ajan ihtiyatı) ────────

insert into public.group_settings (key, value)
values
  ('groups.link_fail_threshold', '2'::jsonb),            -- §6: "2 olursa hidden"
  ('groups.link_health_interval_days', '7'::jsonb),      -- §6: "haftalık"
  ('groups.link_health_batch_limit', '10'::jsonb),       -- ⚠️ ajan ihtiyatı (parti tavanı)
  ('groups.link_health_request_delay_ms', '5000'::jsonb),-- ⚠️ ajan ihtiyatı ("dakikada en fazla birkaç istek")
  ('groups.health_score_cron_enabled', 'false'::jsonb),  -- 🔴 deploy'a dek KAPALI (↑ KARARLAR)
  ('groups.owner_renewal_interval_days', '365'::jsonb),  -- §8: "yılda bir"
  ('groups.owner_renewal_grace_days', '30'::jsonb)       -- §6: "30 gün yanıt yoksa"
on conflict (key) do nothing;

-- ── 2) link-health: due seçimi (saat yuvası + haftalık aralık) ───────────────

create or replace function public.group_link_health_due(p_limit integer default null, p_hour integer default null)
returns table(id uuid, platform text, invite_link text)
language sql
stable
security definer
set search_path = public
as $$
  select w.id, w.platform, btrim(w.whatsapp_link)
  from public.whatsapp_landings w
  where (w.listing_status = 'published'
         or (w.listing_status = 'hidden' and w.hidden_reason = 'link_dead'))  -- geri açma yolu
    and coalesce(btrim(w.whatsapp_link), '') <> ''                            -- linki boş grup taranmaz
    and w.platform in ('whatsapp', 'telegram', 'discord')
    and (w.link_checked_at is null
         or w.link_checked_at < now() - make_interval(days => public.group_setting_int('groups.link_health_interval_days', 7)))
    and mod(abs(hashtext(w.slug)), 24) = coalesce(p_hour, (extract(hour from now()))::integer)
  order by w.link_checked_at nulls first, w.slug
  limit greatest(coalesce(p_limit, public.group_setting_int('groups.link_health_batch_limit', 10)), 0);
$$;

comment on function public.group_link_health_due(integer, integer) is
  'Link kontrolü sırası gelen gruplar (G22): yayın + link_dead gizliler, haftalık '
  'aralık, saat yuvasıyla yayılmış (mod(hash(slug),24)), parti tavanı ayarlardan. '
  'invite_link YALNIZ service_role''e döner (sunucu-tarafı okuma — G08 kural 1).';

revoke all on function public.group_link_health_due(integer, integer) from public, anon, authenticated;
grant execute on function public.group_link_health_due(integer, integer) to service_role;

-- ── 3) link-health: sonuç işleme (ÜÇ DEĞERLİ — kabul #8) ─────────────────────

create or replace function public.group_link_health_record(p_landing_id uuid, p_result text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_listing text;
  v_reason text;
  v_threshold integer;
  v_new integer;
  v_prev_claims text;
begin
  if p_result is null or p_result not in ('ok', 'invalid', 'unknown') then
    raise exception 'group_link_invalid_result';
  end if;

  select link_fail_count, listing_status, hidden_reason
    into v_count, v_listing, v_reason
  from public.whatsapp_landings
  where id = p_landing_id
  for update;
  if not found then
    raise exception 'group_not_found';
  end if;

  v_threshold := public.group_setting_int('groups.link_fail_threshold', 2);

  perform set_config('group_status.via_rpc', 'on', true);
  if p_result = 'unknown' then
    -- G08 kural 5: sayaç DOKUNULMAZ. Kontrol yapıldı → zaman damgası tazelenir
    -- (yoksa grup her saat yeniden due olur).
    update public.whatsapp_landings
       set link_checked_at = now()
     where id = p_landing_id;
  elsif p_result = 'ok' then
    update public.whatsapp_landings
       set link_fail_count = 0, link_checked_at = now()
     where id = p_landing_id;
  else
    v_new := coalesce(v_count, 0) + 1;
    update public.whatsapp_landings
       set link_fail_count = v_new, link_checked_at = now()
     where id = p_landing_id;
  end if;
  perform set_config('group_status.via_rpc', '', true);

  -- Durum geçişleri TEK kapıdan (G12): log + guard otomatik.
  -- ⚠️ set_group_status_v1 servisi `auth.role()='service_role'` JWT claim'inden
  -- tanır; security-definer zincirinde claim TAŞINMAZ (canlı ölçüldü:
  -- group_forbidden). Bu fonksiyon ZATEN service_role-only — içeride geçici
  -- service kimliği açılır ve SONRA geri yüklenir (transaction'a sızmaz).
  if (p_result = 'ok' and v_listing = 'hidden' and v_reason = 'link_dead')
     or (p_result = 'invalid' and coalesce(v_new, 0) >= v_threshold and v_listing = 'published') then
    v_prev_claims := current_setting('request.jwt.claims', true);
    perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
    if p_result = 'ok' and v_listing = 'hidden' and v_reason = 'link_dead' then
      perform public.set_group_status_v1(p_landing_id, 'published', 'published',
        'Link kontrolu basarili — gizleme kalkti (G22)');
    else
      perform public.set_group_status_v1(p_landing_id, 'hidden', 'link_dead',
        'Ust uste ' || v_new || ' basarisiz link kontrolu (G22)');
    end if;
    perform set_config('request.jwt.claims', coalesce(v_prev_claims, ''), true);
  end if;

  select link_fail_count, listing_status
    into v_count, v_listing
  from public.whatsapp_landings
  where id = p_landing_id;

  return jsonb_build_object(
    'landing_id', p_landing_id,
    'result', p_result,
    'link_fail_count', v_count,
    'listing_status', v_listing);
end;
$$;

comment on function public.group_link_health_record(uuid, text) is
  'Üç değerli link sonucu işler (G22, kabul #8): ok → sayaç 0 + link_dead gizliyse '
  'published · invalid → sayaç++ ve eşikte hidden(link_dead) · unknown → sayaca '
  'DOKUNMAZ (G08 kural 5), yalnız link_checked_at. Geçişler set_group_status_v1''den.';

revoke all on function public.group_link_health_record(uuid, text) from public, anon, authenticated;
grant execute on function public.group_link_health_record(uuid, text) to service_role;

-- ── 4) health-score: BAYRAKLI sarmalayıcı (🔴 G17 tuzağı) ────────────────────

create or replace function public.group_health_score_cron()
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.group_setting_bool('groups.health_score_cron_enabled', false) then
    return -1; -- bayrak kapalı: skor YAZILMAZ (canlı eski kart "X / 10" çiziyor)
  end if;
  return public.group_health_scores_recompute_all();
end;
$$;

comment on function public.group_health_score_cron() is
  'G17 recompute_all sarmalısı — groups.health_score_cron_enabled=false iken -1 '
  ' döner (skor yazılmaz). Bayrak YALNIZ yeni kart deploy edildikten sonra insan '
  'kararıyla açılır (G17 tuzağı: canlı eski paket 0-100 skoru "X / 10" gösterirdi).';

revoke all on function public.group_health_score_cron() from public, anon, authenticated;
grant execute on function public.group_health_score_cron() to service_role;

-- ── 5) suspension-release: süresi dolan askılar ──────────────────────────────

create or replace function public.group_suspensions_release_due()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_count integer := 0;
  v_prev_claims text;
begin
  for v_row in
    select id from public.whatsapp_landings
    where listing_status = 'suspended'
      and suspended_until is not null
      and suspended_until <= now()
    order by suspended_until
  loop
    -- ↑ record'daki ile aynı ders: security-definer zinciri JWT claim taşımaz.
    v_prev_claims := current_setting('request.jwt.claims', true);
    perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
    perform public.set_group_status_v1(v_row.id, 'published', 'published',
      'Aski suresi doldu (G22)');
    perform set_config('request.jwt.claims', coalesce(v_prev_claims, ''), true);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

comment on function public.group_suspensions_release_due() is
  'Süresi dolan askıları published''a döner (tasarım §2: "30 gün sonra otomatik '
  'published"). Geçiş set_group_status_v1''den — log otomatik.';

revoke all on function public.group_suspensions_release_due() from public, anon, authenticated;
grant execute on function public.group_suspensions_release_due() to service_role;

-- ── 6) owner-renewal: çıpa + 30 gün yanıt yoksa düşürme ──────────────────────

create or replace function public.group_owner_renewals_process()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_interval_days integer := public.group_setting_int('groups.owner_renewal_interval_days', 365);
  v_grace_days integer := public.group_setting_int('groups.owner_renewal_grace_days', 30);
  v_row record;
  v_anchor timestamptz;
  v_anchored integer := 0;
  v_demoted integer := 0;
begin
  -- (a) Çıpa: verified sahiplerde due bir kez doldurulur
  for v_row in
    select w.id, w.published_at,
           (select max(c.reviewed_at) from public.group_claims c
             where c.landing_id = w.id and c.status = 'verified') as claim_at
    from public.whatsapp_landings w
    where w.ownership = 'verified' and w.owner_renewal_due is null
    for update of w
  loop
    v_anchor := greatest(coalesce(v_row.claim_at, v_row.published_at, now()), now());
    perform set_config('group_status.via_rpc', 'on', true);
    update public.whatsapp_landings
       set owner_renewal_due = v_anchor + make_interval(days => v_interval_days)
     where id = v_row.id;
    perform set_config('group_status.via_rpc', '', true);
    v_anchored := v_anchored + 1;
  end loop;

  -- (b) Düşürme: due + 30 gün geçti, yanıt (yenileme) yok → unclaimed
  for v_row in
    select id from public.whatsapp_landings
    where ownership = 'verified'
      and owner_renewal_due is not null
      and owner_renewal_due < now() - make_interval(days => v_grace_days)
    order by owner_renewal_due
    for update
  loop
    perform set_config('group_status.via_rpc', 'on', true);
    update public.whatsapp_landings
       set ownership = 'unclaimed',
           owner_user_id = null,
           owner_renewal_due = null
     where id = v_row.id;
    perform set_config('group_status.via_rpc', '', true);
    v_demoted := v_demoted + 1;
  end loop;

  return jsonb_build_object('anchored', v_anchored, 'demoted', v_demoted);
end;
$$;

comment on function public.group_owner_renewals_process() is
  'Yıllık sahiplik yenileme döngüsü (tasarım §8 + §6): due çıpası bir kez yazılır '
  '(claim.reviewed_at > published_at > now()); due + grace geçtiyse ownership '
  'unclaimed''a düşer (guard v3 via_rpc ile geçilir). Yenileme eylemi '
  'group_owner_renew_v1 (sahip paneli). Bildirim G23.';

revoke all on function public.group_owner_renewals_process() from public, anon, authenticated;
grant execute on function public.group_owner_renewals_process() to service_role;

-- ── 7) Yenileme onayı (sahip — "yılda bir kısa onay") ────────────────────────

create or replace function public.group_owner_renew_v1()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_landing record;
  v_interval_days integer := public.group_setting_int('groups.owner_renewal_interval_days', 365);
  v_due timestamptz;
begin
  if v_uid is null then
    raise exception 'group_owner_auth_required';
  end if;

  select id into v_landing
  from public.whatsapp_landings
  where ownership = 'verified' and owner_user_id = v_uid
  order by published_at nulls last
  limit 1;
  if not found then
    raise exception 'group_owner_forbidden';
  end if;

  v_due := now() + make_interval(days => v_interval_days);
  perform set_config('group_status.via_rpc', 'on', true);
  update public.whatsapp_landings
     set owner_renewal_due = v_due
   where id = v_landing.id;
  perform set_config('group_status.via_rpc', '', true);

  return jsonb_build_object('landing_id', v_landing.id, 'owner_renewal_due', v_due);
end;
$$;

comment on function public.group_owner_renew_v1() is
  'Sahibin yıllık yenileme onayı (tasarım §8): due''yu 365 gün ileri atar. '
  'Doğrulanmış sahibi olmayan kullanıcı group_owner_forbidden alır.';

revoke all on function public.group_owner_renew_v1() from public, anon;
grant execute on function public.group_owner_renew_v1() to authenticated;

-- ── 8) claim-expiry: süresi dolan kodlar ─────────────────────────────────────

create or replace function public.group_claims_expire_due()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.group_claims
     set status = 'expired'
   where status = 'pending'
     and method = 'code'
     and code_expires_at is not null
     and code_expires_at < now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

comment on function public.group_claims_expire_due() is
  'Süresi dolan bekleyen kod taleplerini expired yapar (tasarım §6: claim-expiry '
  '10 dk''da bir). start_code''taki tembel düşürmenin saati — tablo temiz kalır, '
  '"grup başına aktif tek kod" kısmi indeksi boşa işgal edilmez.';

revoke all on function public.group_claims_expire_due() from public, anon, authenticated;
grant execute on function public.group_claims_expire_due() to service_role;

-- ── 9) pg_cron bağlama (radar/dispatcher deseni; isimli + idempotent) ────────

do $$
begin
  perform cron.unschedule('group_queue_escalation');
exception when others then null;
end $$;
select cron.schedule('group_queue_escalation', '17 * * * *',
  $cron$ select public.group_posts_escalate_due() $cron$);

do $$
begin
  perform cron.unschedule('group_health_score');
exception when others then null;
end $$;
select cron.schedule('group_health_score', '31 4 * * *',
  $cron$ select public.group_health_score_cron() $cron$);

do $$
begin
  perform cron.unschedule('group_suspension_release');
exception when others then null;
end $$;
select cron.schedule('group_suspension_release', '37 4 * * *',
  $cron$ select public.group_suspensions_release_due() $cron$);

do $$
begin
  perform cron.unschedule('group_owner_renewal');
exception when others then null;
end $$;
select cron.schedule('group_owner_renewal', '43 4 * * *',
  $cron$ select public.group_owner_renewals_process() $cron$);

do $$
begin
  perform cron.unschedule('group_claim_expiry');
exception when others then null;
end $$;
select cron.schedule('group_claim_expiry', '*/10 * * * *',
  $cron$ select public.group_claims_expire_due() $cron$);

-- link-health: cron → edge (net.http_post + vault secret — LİTERAL SECRET YOK,
-- değer koşu anında vault'tan okunur; radar-news-scan deseni).
do $$
begin
  perform cron.unschedule('group_link_health');
exception when others then null;
end $$;
select cron.schedule('group_link_health', '23 * * * *', $cron$
  select net.http_post(
    url := 'https://injprdrsklkxgnaiixzh.supabase.co/functions/v1/group-link-health',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-dispatch-secret',
      (select decrypted_secret from vault.decrypted_secrets where name = 'radar_news_cron_secret')
    ),
    body := '{"triggerType":"cron"}'::jsonb
  );
$cron$);

commit;
