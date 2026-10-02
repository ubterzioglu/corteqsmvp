-- G15 · Dijital Gruplar: uyarı (strike) sistemi + ekleme yasağı
--
-- ═══ KAPSAM ═══
-- Tasarım §7 birebir:
--   1. ihlal → uyarı (grup yayında kalır)
--   2. ihlal → 30 gün `suspended` (süre G12'de `groups.suspension_days`'te)
--   3. ihlal → `removed` + ekleyen VE sahibin yeni grup eklemesi engellenir
--   Kırmızı çizgi 2/4/6 (politika §4: vize/slot satışı · kişisel veri isteme ·
--   reşit olmayanlara yönelik doğrulanmamış grup) → DOĞRUDAN `removed` + yasak.
--
-- Durum geçişleri YALNIZ G12'nin tek kapısı `set_group_status_v1` ile yapılır —
-- bu migration listing_status'e doğrudan YAZMAZ (guard zaten engeller).
-- `strike_count` motor alanıdır (G13 guard v2) → bayrakla güncellenir.
--
-- ═══ DEĞERLERİN KAYNAĞI ═══
-- Eşikler (2/3) tasarım §7'den, terminal kırmızı çizgiler [2,4,6] politika §4'ten
-- (`group_settings`'e yazılır — G09 doktrini: ürün sayısı kodda sabit durmaz).
-- Kırmızı çizgi numaraları 1..7 (politika §4 listesi).
--
-- ═══ KARARLAR (tasarımın boş bıraktığı yerler) ═══
--   • 2. ihlal grup `published` DEĞİLSE (hidden/suspended/pending_review):
--     geçiş matrisi `suspended`'a izin vermez → ihlal KAYDEDİLİR, durum
--     değişmez, outcome='warning' + not. (3. ihlal her durumdan `removed`'a
--     gidebildiği için merdiven aksamaz.)
--   • `removed` gruba ihlal işlenmez (terminal) → group_already_removed.
--   • Yasak SÜRESİZDİR (tasarım süre vermiyor); kaldırma moderatör işi (G24).
--   • Uyarı BİLDİRİMİ (tasarım §9) G23'te; bu batch log+tablo+geçiş kurar.
--   • Admin kendi eklediği grupta yasaklı olsa bile ekleyebilir (is_admin bypass)
--     — yasak moderatöre değil, kötüye kullanan üyeye karşı.
--
-- ═══ SALT EKLEME ═══
-- Hiçbir kolon/tablo/politika düşürülmez; legacy akışlar değişmez. INSERT
-- trigger'ı yalnız YASAKLI kullanıcının eklemesini engeller (bugünkü AddWhatsApp
-- akışı dahil — ölçüldü: insert yolu `user_id` ile RLS'ten geçiyor).

begin;

-- ── 1) İhlal kayıtları (tasarım §4: sebep · karar veren · tarih) ────────────

create table if not exists public.group_strikes (
  id bigint generated always as identity primary key,
  landing_id uuid not null references public.whatsapp_landings(id) on delete cascade,
  strike_no integer not null check (strike_no > 0),
  reason text not null,
  redline_number integer check (redline_number is null or redline_number between 1 and 7),
  outcome text not null check (outcome in ('warning', 'suspended', 'removed')),
  decided_by uuid not null references auth.users(id) on delete restrict,
  note text,
  created_at timestamptz not null default now()
);

comment on table public.group_strikes is
  'Grup ihlal kayıtları (G15, tasarım §7). Tek yazım yolu admin_record_group_strike '
  'RPC''si. 1.=uyarı · 2.=30 gün suspended · 3.=removed+yasak · kırmızı çizgi 2/4/6 '
  'doğrudan removed+yasak. Bildirim metni G23''te.';

create index if not exists group_strikes_landing_idx
  on public.group_strikes (landing_id, created_at);

alter table public.group_strikes enable row level security;
revoke all on table public.group_strikes from anon, authenticated;
grant select on table public.group_strikes to authenticated;

drop policy if exists group_strikes_admin_select on public.group_strikes;
create policy group_strikes_admin_select on public.group_strikes
  for select to authenticated using (public.is_admin(auth.uid()));

-- ── 2) Ekleme yasağı (3. ihlal + terminal kırmızı çizgi) ────────────────────

create table if not exists public.group_submission_bans (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  landing_id uuid references public.whatsapp_landings(id) on delete set null,
  reason text not null check (reason in ('strike_3', 'redline_2', 'redline_4', 'redline_6')),
  banned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, landing_id, reason)
);

comment on table public.group_submission_bans is
  'Yeni grup eklemesi engellenen kullanıcılar (G15, tasarım §7: 3. ihlal ve '
  'kırmızı çizgi 2/4/6 → "ekleyen ve sahibin yeni grup eklemesi engellenir"). '
  'Süresizdir; kaldırma moderatör kararıdır (G24). Enforcement: '
  'trg_block_banned_submitter (BEFORE INSERT) + group_submission_banned() yardımcısı.';

create index if not exists group_submission_bans_user_idx
  on public.group_submission_bans (user_id);

alter table public.group_submission_bans enable row level security;
revoke all on table public.group_submission_bans from anon, authenticated;
grant select on table public.group_submission_bans to authenticated;

drop policy if exists group_submission_bans_admin_select on public.group_submission_bans;
create policy group_submission_bans_admin_select on public.group_submission_bans
  for select to authenticated using (public.is_admin(auth.uid()));

-- ── 3) Eşikler group_settings'te (G09 doktrini) ─────────────────────────────

insert into public.group_settings (key, value)
values
  -- Tasarım §7: 2. ihlal askı, 3. ihlal kalıcı kaldırma.
  ('groups.strike_suspend_threshold', '2'::jsonb),
  ('groups.strike_remove_threshold', '3'::jsonb),
  -- Politika §4: "2, 4 ve 6. maddelerin ihlali doğrudan kalıcı kaldırma sebebi."
  ('groups.terminal_redlines', '[2, 4, 6]'::jsonb)
on conflict (key) do nothing;

-- ── 4) Yasak sorgu yardımcısı (G18 formu da bunu okuyacak) ──────────────────

create or replace function public.group_submission_banned(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_submission_bans where user_id = p_user_id
  );
$$;

comment on function public.group_submission_banned(uuid) is
  'Kullanıcının yeni grup eklemesi yasak mı (G15)? Form/submit akışı bu '
  'yardımcıyı okur; DB düzeyinde trg_block_banned_submitter zorlar.';

revoke all on function public.group_submission_banned(uuid) from public, anon;
grant execute on function public.group_submission_banned(uuid) to authenticated;

-- ── 5) INSERT yasağı: yasaklı kullanıcı grup EKLEYEMEZ ──────────────────────

create or replace function public.whatsapp_landings_block_banned_submitter()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := coalesce(new.submitted_by, new.user_id);
begin
  if v_user is null then
    return new;
  end if;
  -- Admin bypass: yasak üyeye karşı, moderatöre değil.
  if public.is_admin(v_user) then
    return new;
  end if;
  if exists (select 1 from public.group_submission_bans where user_id = v_user) then
    raise exception 'group_submission_banned';
  end if;
  return new;
end;
$$;

comment on function public.whatsapp_landings_block_banned_submitter() is
  'Yasaklı kullanıcının whatsapp_landings INSERT''ini engeller (G15, tasarım §7). '
  'Bugünkü AddWhatsApp akışı dahil tüm ekleme yollarını kapsar.';

drop trigger if exists trg_block_banned_submitter on public.whatsapp_landings;
create trigger trg_block_banned_submitter
  before insert on public.whatsapp_landings
  for each row execute function public.whatsapp_landings_block_banned_submitter();

-- ── 6) Tek ihlal kapısı (moderatör) ─────────────────────────────────────────

create or replace function public.admin_record_group_strike(
  p_landing_id uuid,
  p_reason text,
  p_redline_number integer default null,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_status text;
  v_submitted_by uuid;
  v_owner uuid;
  v_strike_no integer;
  v_suspend_on integer;
  v_remove_on integer;
  v_terminal_redlines integer[];
  v_is_terminal boolean;
  v_outcome text;
  v_note text := p_note;
  v_banned integer := 0;
begin
  if not public.is_admin(v_uid) then
    raise exception 'group_strike_forbidden';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'group_strike_reason_required';
  end if;
  if p_redline_number is not null and (p_redline_number < 1 or p_redline_number > 7) then
    raise exception 'group_strike_invalid_redline';
  end if;

  select listing_status, submitted_by, owner_user_id
    into v_status, v_submitted_by, v_owner
  from public.whatsapp_landings
  where id = p_landing_id
  for update;
  if not found then
    raise exception 'group_not_found';
  end if;
  if v_status = 'removed' then
    raise exception 'group_already_removed';
  end if;

  -- Eşikler ve terminal liste group_settings'ten (kodda sabit YOK)
  v_suspend_on := public.group_setting_int('groups.strike_suspend_threshold', 2);
  v_remove_on := public.group_setting_int('groups.strike_remove_threshold', 3);
  select coalesce(
    array(select (jsonb_array_elements_text(
      public.group_setting_json('groups.terminal_redlines', '[2, 4, 6]'::jsonb)))::integer),
    '{}'::integer[]
  ) into v_terminal_redlines;

  v_is_terminal := p_redline_number is not null and p_redline_number = any (v_terminal_redlines);

  select count(*) + 1 into v_strike_no
  from public.group_strikes
  where landing_id = p_landing_id;

  -- ── Sonuç belirleme (tasarım §7) ──
  if v_is_terminal or v_strike_no >= v_remove_on then
    v_outcome := 'removed';
  elsif v_strike_no >= v_suspend_on then
    if v_status = 'published' then
      v_outcome := 'suspended';
    else
      -- Karar: published olmayan gruba askı geçişi matris gereği yapılamaz;
      -- ihlal kaydedilir, merdiven 3.'te removed'la kapanır.
      v_outcome := 'warning';
      v_note := trim(coalesce(p_note || ' | ', '')
        || 'Grup published değildi (' || v_status || '); askı uygulanamadı.');
    end if;
  else
    v_outcome := 'warning';
  end if;

  -- ── Durum geçişi YALNIZ G12 tek kapısıyla ──
  if v_outcome = 'removed' then
    perform public.set_group_status_v1(
      p_landing_id, 'removed',
      case when v_is_terminal then 'redline_' || p_redline_number else 'strike_' || v_strike_no end,
      p_reason);
  elsif v_outcome = 'suspended' then
    perform public.set_group_status_v1(p_landing_id, 'suspended', 'strike_' || v_strike_no, p_reason);
  end if;

  -- ── İhlal satırı ──
  insert into public.group_strikes
    (landing_id, strike_no, reason, redline_number, outcome, decided_by, note)
  values
    (p_landing_id, v_strike_no, p_reason, p_redline_number, v_outcome, v_uid, v_note);

  -- ── strike_count senkronu (motor alanı — guard bayrağıyla) ──
  perform set_config('group_status.via_rpc', 'on', true);
  update public.whatsapp_landings
     set strike_count = v_strike_no
   where id = p_landing_id;
  perform set_config('group_status.via_rpc', '', true);

  -- ── Yasak: 3. ihlal veya terminal kırmızı çizgi → ekleyen VE sahip ──
  if v_outcome = 'removed' then
    insert into public.group_submission_bans (user_id, landing_id, reason, banned_by)
    select u.uid, p_landing_id,
           case when v_is_terminal then 'redline_' || p_redline_number else 'strike_3' end,
           v_uid
    from (values (coalesce(v_submitted_by, v_owner)), (v_owner)) as u(uid)
    where u.uid is not null
    on conflict (user_id, landing_id, reason) do nothing;
    get diagnostics v_banned = row_count;
  end if;

  return jsonb_build_object(
    'strike_no', v_strike_no,
    'outcome', v_outcome,
    'terminal_redline', v_is_terminal,
    'bans_written', v_banned);
end;
$$;

comment on function public.admin_record_group_strike(uuid, text, integer, text) is
  'TEK ihlal kapısı (G15, tasarım §7): 1.=uyarı · 2.=suspended(30 gün, '
  'suspended_until''da) · 3.=removed+yasak · kırmızı çizgi 2/4/6=doğrudan '
  'removed+yasak. Durum geçişleri set_group_status_v1 üzerinden; moderasyon logu '
  'orada yazılır. İhlal kaydı group_strikes''ta.';

revoke all on function public.admin_record_group_strike(uuid, text, integer, text) from public, anon;
grant execute on function public.admin_record_group_strike(uuid, text, integer, text) to authenticated;

commit;
