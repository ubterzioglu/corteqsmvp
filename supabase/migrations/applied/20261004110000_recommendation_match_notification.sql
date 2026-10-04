-- M22 · Tavsiye eşleşme bildirimi + kilitli Pro gelen kutusu altyapısı.
--
-- DÖRT parça (bildirim hattı BEŞ parçalıdır dersi — hepsi TEK batch'te):
--   1. `notification_email_outbox.event_type` CHECK'ine `recommendation_match`
--      EKLENİR. 🔴 CHECK genişletilmezse insert 23514 ile reddedilir ve SESSİZCE
--      kaybolur (KR09 radar dersi: özet 19 Eylül'den beri hiç gitmemişti).
--   2. `notification_settings` anahtarı seed: `email.recommendation_match.enabled`
--      (edge `isEventEnabled` bu anahtarı okur; anahtar yoksa mail gitmez).
--   3. `register_feature_interest` beyaz listesi GENİŞLER: `pro.inbox` (M10 ayna
--      testi İKİ yönü de kilitler — TS FEATURE_INTEREST_KEYS ile aynı batch'te).
--   4. `create_recommendation_request_v1` YENİDEN tanımlanır: talep oluşunca
--      EŞLEŞEN profesyonellere (M18 skoru: kategori 100 + şehir 30 + ülke 15,
--      skor>0, en iyi 5) outbox satırı yazar. 🔴 Talep SAHİBİNE ve BANLI
--      kullanıcıya satır YAZILMAZ (kill-switch bildirimi de kapsar).
--
-- Edge tarafı (aynı batch): SETTING_KEY_BY_EVENT + buildEmail kolu + directEvents
-- (send-notification-emails/index.ts) + şablon (_shared/emails/recommendation-match.ts).
-- 🔴 Mail'de talep sahibinin İLETİŞİMİ YOK — iletişim Pro kilidinin arkasında
-- (ProLockedInboxCard → feature_interest 'pro.inbox'; "ücretli tarafın ne zaman
-- yapılacağına bu tablo karar verecek").
--
-- M17 davranışı AYNEN korunur (ban/auth/doğrulama/status) — kabul K1–K11 yeniden koşulur.

begin;

-- ── 1) outbox event_type CHECK genişlet (mevcut adı dinamik bul) ─────────────
do $$
declare
  v_conname text;
begin
  select con.conname into v_conname
  from pg_constraint con
  where con.conrelid = 'public.notification_email_outbox'::regclass
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) like '%event_type%';
  if v_conname is null then
    raise exception 'notification_email_outbox event_type CHECK bulunamadi';
  end if;
  execute format('alter table public.notification_email_outbox drop constraint %I', v_conname);
end $$;

alter table public.notification_email_outbox
  add constraint notification_email_outbox_event_type_check
  check (event_type = any (array[
    'new_member','admin_update','member_welcome','revision_request',
    'revision_request_completed','relocation_tool_report','relocation_tool_abandonment',
    'radar_scan_digest','career_application','group_submission_received','group_published',
    'group_rejected','group_ownership_verified','group_post_pending','group_link_dead',
    'group_score_badge','group_strike_warning',
    'recommendation_match'  -- M22
  ]::text[]));

-- ── 2) global ayar anahtarı (edge isEventEnabled bunu okur) ──────────────────
insert into public.notification_settings (key, value)
values ('email.recommendation_match.enabled', 'true'::jsonb)
on conflict (key) do nothing;

-- ── 3) feature_interest beyaz listesi + pro.inbox (M10 aynası TS ile birlikte) ─
create or replace function public.register_feature_interest(p_feature_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_existing boolean;
begin
  if v_uid is null then
    raise exception 'feature_interest_auth_required';
  end if;

  -- Beyaz liste: çöp/uydurma anahtar birikmez. Liste ürün söz dağarcığıdır;
  -- genişletme migration + ayna testiyle (M22: pro.inbox EKLENDİ).
  if p_feature_key is null or p_feature_key not in ('event.featured', 'event.ticketing', 'pro.inbox') then
    raise exception 'feature_interest_unknown_key';
  end if;

  select true into v_existing
  from public.feature_interest
  where feature_key = p_feature_key and user_id = v_uid;

  if v_existing then
    return jsonb_build_object('feature_key', p_feature_key, 'registered', true, 'already', true);
  end if;

  insert into public.feature_interest (feature_key, user_id)
  values (p_feature_key, v_uid);

  return jsonb_build_object('feature_key', p_feature_key, 'registered', true, 'already', false);
end;
$$;

comment on function public.register_feature_interest(text) is
  'Kilitli ücretli yüzey ilgisi kaydeder (M10): beyaz liste event.featured + '
  'event.ticketing + pro.inbox (M22). Idempotent — aynı ilgi ikinci kez '
  'sayılmaz, already:true döner.';

-- ── 4) create_recommendation_request_v1 + eşleşen profesyonel bildirimi ──────
create or replace function public.create_recommendation_request_v1(
  p_title text,
  p_body text,
  p_category_slug text default null,
  p_country text default null,
  p_city text default null,
  p_diaspora_key text default 'tr'
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_title text := nullif(trim(coalesce(p_title, '')), '');
  v_body text := trim(coalesce(p_body, ''));
  v_diaspora text := coalesce(nullif(trim(coalesce(p_diaspora_key, '')), ''), 'tr');
  v_category text := nullif(trim(coalesce(p_category_slug, '')), '');
  v_country text := nullif(trim(coalesce(p_country, '')), '');
  v_city text := nullif(trim(coalesce(p_city, '')), '');
  -- M18 ile AYNI katlama (tek kaynak: catalog_search_normalize).
  v_cat_n text := public.catalog_search_normalize(v_category);
  v_city_n text := public.catalog_search_normalize(v_city);
  v_country_n text := public.catalog_search_normalize(v_country);
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'recommendation_auth_required';
  end if;

  -- 🔴 BAN KILL-SWITCH (tek nokta): banlı kullanıcı otomatik reddedilir.
  if public.is_cadde_banned(v_uid) then
    raise exception 'recommendation_banned';
  end if;

  if v_diaspora not in ('tr','in','cn','ph') then
    raise exception 'recommendation_invalid_diaspora';
  end if;
  if v_title is null or length(v_title) > 160 then
    raise exception 'recommendation_invalid_title';
  end if;
  if length(v_body) < 1 or length(v_body) > 4000 then
    raise exception 'recommendation_invalid_body';
  end if;

  insert into public.recommendation_requests
    (user_id, title, body, category_slug, country, city, status, diaspora_key)
  values
    (v_uid, v_title, v_body, v_category, v_country, v_city, 'open', v_diaspora)
  returning id into v_id;

  -- ── Eşleşen profesyonellere bildirim kuyruğu (M18 skoru, en iyi 5) ──
  -- 🔴 Talep SAHİBİNE satır YOK (cim.user_id <> v_uid) · 🔴 BANLI profesyonele
  -- satır YOK (kill-switch bildirimi kapsar) · 🔴 skor=0'a satır YOK (eşleşmeyen
  -- profesyonel spamlenmez; M18 "eler değil sıralar" kuralı LİSTE içindir,
  -- BİLDİRİM eşleşene gider) · payload'da talep sahibinin İLETİŞİMİ YOK.
  insert into public.notification_email_outbox (event_type, dedupe_key, payload)
  select
    'recommendation_match',
    'recommendation_match:' || v_id || ':' || g.user_id,
    jsonb_build_object(
      'email', g.email,
      'pro_name', g.pro_name,
      'request_id', v_id,
      'request_title', v_title,
      'request_city', v_city,
      'request_country', v_country
    )
  from (
    select s.user_id, s.email, s.pro_name, s.score
    from (
      select
        cim.user_id,
        max(au.email) as email,
        max(ci.title) as pro_name,
        max(
          (case when v_cat_n <> '' and exists (
              select 1 from unnest(coalesce(d.category_slugs, '{}'::text[])) sx
              where public.catalog_search_normalize(sx) = v_cat_n
            ) then 100 else 0 end)
          + (case when v_city_n <> '' and public.catalog_search_normalize(ci.city) = v_city_n then 30 else 0 end)
          + (case when v_country_n <> '' and public.catalog_search_normalize(ci.country_code) = v_country_n then 15 else 0 end)
        ) as score
      from public.catalog_items ci
      join public.roles rl on rl.key = ci.platform_role_key and rl.is_directory_visible = true
      join public.catalog_item_managers cim on cim.item_id = ci.id and cim.status = 'active'
      join auth.users au on au.id = cim.user_id
      left join public.catalog_search_documents d on d.item_id = ci.id
      where ci.item_type = 'member'
        and ci.status = 'published'
        and ci.visibility = 'public'
        and coalesce(ci.is_placeholder, false) = false
        and cim.user_id <> v_uid
        and not public.is_cadde_banned(cim.user_id)
        and au.email is not null
      group by cim.user_id
    ) s
    where s.score > 0
    order by s.score desc, s.user_id
    limit 5
  ) g
  on conflict (dedupe_key) do nothing;

  if found then
    perform public.poke_notification_dispatcher();
  end if;

  return v_id;
end;
$$;

comment on function public.create_recommendation_request_v1(text,text,text,text,text,text) is
  'M17: tavsiye talebi oluştur (tek yazma yolu) + M22: eşleşen profesyonellere '
  '(M18 skoru>0, en iyi 5) recommendation_match outbox satırı. ban kill-switch · '
  'status GÖVDEDE open · talep sahibi ve banlılar bildirim ALMAZ · payload''da '
  'talep sahibinin iletişimi YOK (Pro kilidi).';

commit;
