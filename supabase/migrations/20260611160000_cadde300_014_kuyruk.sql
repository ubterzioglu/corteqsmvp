-- Cadde 3.0 — Rebuild sonrası kuyruk (1/1): otomatik içerik taraması + eksik bildirim üreticileri.
-- (spec §18.1 "otomatik kelime / spam kontrolü" + §17.1 cadde.carsi.item_contacted / cadde.cafe.expiring)
--
-- 1. Otomatik tarama: cadde_posts / cadde_post_comments / cadde_cafes / carsi_items
--    INSERT'lerinde AFTER trigger riskli sinyal arar (küfür/parti propagandası/kumar-yetişkin
--    spam'i, aşırı tekrar, 3+ URL). İçerik YAYINI ENGELLENMEZ — yalnız moderasyon kuyruğuna
--    'auto:' önekiyle kayıt düşer (insan kararı esastır; cadde-rules.ts'teki TS blocklist'in
--    SQL karşılığıdır, birini güncelleyen diğerini de günceller).
-- 2. record_carsi_contact_v1: ilan sahibine "ilanınla ilgilenildi" bildirimi
--    (görüntüleyen+ilan başına 24 saatte 1 — spam yapmaz; kendi ilanına tetiklemez).
-- 3. cafe.expiring: pg_cron VARSA 10 dakikada bir, 30 dk içinde bitecek canlı cafe'lerin
--    host + onaylı üyelerine tek seferlik bildirim. pg_cron yoksa migration HATA VERMEZ —
--    notice düşer, iş scheduler kararına kalır (durum change-report'ta).

begin;

-- ── 1. Otomatik içerik taraması ──────────────────────────────────────────────
create or replace function public.cadde_risky_signal(p_text text)
returns text
language plpgsql
immutable
as $$
declare
  v_text text := lower(coalesce(p_text, ''));
begin
  if v_text ~ '\m(amk|aq|orospu|piç|sik|yarrak|göt|amcık)\M' then
    return 'kufur';
  end if;
  if v_text ~ '\m(akp|chp|mhp|hdp|dem parti|iyi parti)\M' then
    return 'siyasi-propaganda';
  end if;
  if v_text ~ '\m(porn|porno|escort|bahis|casino|kumar)\M' then
    return 'yetiskin-kumar-spam';
  end if;
  if v_text ~ '(.)\1{9,}' then
    return 'asiri-tekrar';
  end if;
  if (length(v_text) - length(replace(replace(v_text, 'https://', ''), 'http://', ''))) / 7 >= 3 then
    return 'coklu-url';
  end if;
  return null;
end;
$$;

create or replace function public.cadde_auto_moderation_scan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_content text;
  v_entity_type text;
  v_signal text;
begin
  case tg_table_name
    when 'cadde_posts' then
      v_content := coalesce(new.title, '') || ' ' || coalesce(new.body, '');
      v_entity_type := 'post';
    when 'cadde_post_comments' then
      v_content := coalesce(new.body, '');
      v_entity_type := 'comment';
    when 'cadde_cafes' then
      v_content := coalesce(new.title, '') || ' ' || coalesce(new.summary, '');
      v_entity_type := 'cafe';
    when 'carsi_items' then
      v_content := coalesce(new.title, '') || ' ' || coalesce(new.description, '');
      v_entity_type := 'carsi_item';
  end case;

  v_signal := public.cadde_risky_signal(v_content);
  if v_signal is not null then
    -- Açık kayıt varsa çoğaltma; yoksa kuyruğa düşür (yayın engellenmez — insan kararı).
    if not exists (
      select 1 from public.cadde_moderation_queue
      where entity_type = v_entity_type and entity_id = new.id and status = 'open'
    ) then
      insert into public.cadde_moderation_queue (entity_type, entity_id, reason, status, risk_score)
      values (v_entity_type, new.id, 'auto: ' || v_signal, 'open', 0.5);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_cadde_auto_scan_posts on public.cadde_posts;
create trigger trg_cadde_auto_scan_posts
after insert on public.cadde_posts
for each row execute function public.cadde_auto_moderation_scan();

drop trigger if exists trg_cadde_auto_scan_comments on public.cadde_post_comments;
create trigger trg_cadde_auto_scan_comments
after insert on public.cadde_post_comments
for each row execute function public.cadde_auto_moderation_scan();

drop trigger if exists trg_cadde_auto_scan_cafes on public.cadde_cafes;
create trigger trg_cadde_auto_scan_cafes
after insert on public.cadde_cafes
for each row execute function public.cadde_auto_moderation_scan();

drop trigger if exists trg_cadde_auto_scan_carsi on public.carsi_items;
create trigger trg_cadde_auto_scan_carsi
after insert on public.carsi_items
for each row execute function public.cadde_auto_moderation_scan();

-- ── 2. carsi.item_contacted bildirimi ────────────────────────────────────────
create or replace function public.record_carsi_contact_v1(p_item_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_item public.carsi_items%rowtype;
begin
  if v_uid is null then
    return false;
  end if;

  select * into v_item from public.carsi_items where id = p_item_id and deleted_at is null;
  if v_item.id is null or v_item.owner_user_id = v_uid then
    return false;
  end if;

  -- Görüntüleyen + ilan başına 24 saatte en fazla 1 bildirim.
  if exists (
    select 1 from public.notifications
    where user_id = v_item.owner_user_id
      and actor_user_id = v_uid
      and type = 'cadde.carsi.item_contacted'
      and related_id = p_item_id
      and created_at > now() - interval '24 hours'
  ) then
    return false;
  end if;

  perform public.cadde_notify(
    v_item.owner_user_id, v_uid, 'cadde.carsi.item_contacted',
    'İlanınla ilgilenen var',
    v_item.title,
    'carsi_item', p_item_id,
    '{}'::jsonb
  );

  return true;
end;
$$;

revoke all on function public.record_carsi_contact_v1(uuid) from public, anon;
grant execute on function public.record_carsi_contact_v1(uuid) to authenticated;

-- ── 3. cafe.expiring (pg_cron korumalı) ──────────────────────────────────────
create or replace function public.cadde_notify_expiring_cafes()
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_cafe record;
  v_member record;
  v_count integer := 0;
begin
  for v_cafe in
    select c.*
    from public.cadde_cafes c
    where c.content_mode = 'real'
      and c.status = 'published'
      and c.is_active = true
      and c.archived_at is null
      and c.ends_at between now() and now() + interval '30 minutes'
      and not exists (
        select 1 from public.notifications n
        where n.type = 'cadde.cafe.expiring' and n.related_id = c.id
      )
  loop
    perform public.cadde_notify(
      v_cafe.host_user_id, null, 'cadde.cafe.expiring',
      'Cafe''n yakında kapanıyor',
      v_cafe.title || ' 30 dakika içinde sona eriyor.',
      'cafe', v_cafe.id, '{}'::jsonb
    );
    for v_member in
      select user_id from public.cadde_cafe_members
      where cafe_id = v_cafe.id and status = 'approved' and user_id is distinct from v_cafe.host_user_id
    loop
      perform public.cadde_notify(
        v_member.user_id, null, 'cadde.cafe.expiring',
        'Katıldığın cafe yakında kapanıyor',
        v_cafe.title || ' 30 dakika içinde sona eriyor.',
        'cafe', v_cafe.id, '{}'::jsonb
      );
    end loop;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.cadde_notify_expiring_cafes() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('cadde-cafe-expiring', '*/10 * * * *', 'select public.cadde_notify_expiring_cafes()');
    raise notice 'pg_cron bulundu: cadde-cafe-expiring 10 dakikada bir zamanlandi.';
  elsif exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension pg_cron;
    perform cron.schedule('cadde-cafe-expiring', '*/10 * * * *', 'select public.cadde_notify_expiring_cafes()');
    raise notice 'pg_cron kuruldu ve cadde-cafe-expiring zamanlandi.';
  else
    raise notice 'pg_cron yok: cadde_notify_expiring_cafes hazir ama zamanlanamadi (scheduler karari acik).';
  end if;
exception when others then
  raise notice 'pg_cron zamanlamasi atlandi: %', sqlerrm;
end $$;

commit;
