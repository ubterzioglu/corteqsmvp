-- G15b · Uyarı merdiveni sıkılaştırma: 1 ihlal = askı, 2 ihlal = kaldırma
--
-- ═══ KAYNAK ═══
--   6 Ekim 2026 kullanıcı kararı: "1 ihlal, askıya alma".
--   Mevcut (G15, 20261002050000): 1.=uyarı · 2.=30 gün askı · 3.=kaldırma+yasak.
--   Yeni: 1.=30 gün askı · 2.=kaldırma+yasak.
--
-- ═══ DEĞİŞİKLİKLER ═══
--   1. group_settings tohumları:
--      groups.strike_suspend_threshold: 2 → 1
--      groups.strike_remove_threshold: 3 → 2
--   2. admin_record_group_strike fonksiyonundaki varsayılan değerler:
--      v_suspend_on := 2 → 1
--      v_remove_on := 3 → 2
--   3. Fonksiyon yorumu güncellenir.
--
-- ═══ SALT EKLEME ═══
--   Tablo/kolon düşürmez. admin_record_group_strike CREATE OR REPLACE ile
--   yeniden tanımlanır; imza aynı kalır. Mevcut ihlal kayıtları değişmez.
--
-- ═══ ETKİ ═══
--   Yeni ihlaller sıkı merdivenle değerlendirilir. Eski ihlal kayıtları
--   değişmez; ancak 2+ ihlali olan gruplar zaten removed'da (eski merdivende
--   3. ihlal = removed). 1 ihlalli gruplar warning'deydi → şimdi suspended
--   olmalıydı. GEÇİŞ: Bu migration mevcut warning'deki grupları otomatik
--   suspended'a çekmez; sonraki ihlal sıkı merdivenle değerlendirilir.
--   (Geçiş migration'ı ayrı yazılabilir — kullanıcı onayı gerekir.)

begin;

-- ── 1) group_settings tohumlarını güncelle ────────────────────────────────────

insert into public.group_settings (key, value)
values
  ('groups.strike_suspend_threshold', '1'::jsonb),
  ('groups.strike_remove_threshold', '2'::jsonb)
on conflict (key) do update
set value = excluded.value;

-- ── 1b) group_submission_bans CHECK constraint güncelle ───────────────────────
-- G15: strike_3 (3. ihlal = kaldırma) → G15b: strike_2 (2. ihlal = kaldırma)

alter table public.group_submission_bans
drop constraint if exists group_submission_bans_reason_check;

alter table public.group_submission_bans
add constraint group_submission_bans_reason_check
check (reason in ('strike_2', 'redline_2', 'redline_4', 'redline_6'));

-- ── 2) admin_record_group_strike fonksiyonunu güncelle ────────────────────────
-- Yalnızca v_suspend_on ve v_remove_on varsayılanları değişir; geri kalan
-- mantık aynı kalır (merdiven zaten doğru çalışır).

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

  -- G15b: Eşikler sıkılaştırıldı (1=askı, 2=kaldırma).
  v_suspend_on := public.group_setting_int('groups.strike_suspend_threshold', 1);
  v_remove_on := public.group_setting_int('groups.strike_remove_threshold', 2);
  select coalesce(
    array(select (jsonb_array_elements_text(
      public.group_setting_json('groups.terminal_redlines', '[2, 4, 6]'::jsonb)))::integer),
    '{}'::integer[]
  ) into v_terminal_redlines;

  v_is_terminal := p_redline_number is not null and p_redline_number = any (v_terminal_redlines);

  select count(*) + 1 into v_strike_no
  from public.group_strikes
  where landing_id = p_landing_id;

  -- ── Sonuç belirleme (G15b sıkı merdiven) ──
  if v_is_terminal or v_strike_no >= v_remove_on then
    v_outcome := 'removed';
  elsif v_strike_no >= v_suspend_on then
    if v_status = 'published' then
      v_outcome := 'suspended';
    else
      -- published olmayan gruba askı geçişi matris gereği yapılamaz;
      -- ihlal kaydedilir, merdiven 2.'de removed'la kapanır.
      v_outcome := 'warning';
      v_note := trim(coalesce(p_note || ' | ', '')
        || 'Grup published değildi (' || v_status || '); askı uygulanamadı.');
    end if;
  else
    v_outcome := 'warning';
  end if;

  -- ── Durum geçişi YALNIZ G12 tek kapıyla ──
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

  -- ── Yasak: 2. ihlal veya terminal kırmızı çizgi → ekleyen VE sahip ──
  if v_outcome = 'removed' then
    insert into public.group_submission_bans (user_id, landing_id, reason, banned_by)
    select u.uid, p_landing_id,
           case when v_is_terminal then 'redline_' || p_redline_number else 'strike_2' end,
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
  'TEK ihlal kapısı (G15, G15b sıkılaştırma): 1.=30 gün suspended · 2.=removed+yasak · '
  'kırmızı çizgi 2/4/6=doğrudan removed+yasak. Durum geçişleri set_group_status_v1 üzerinden; '
  'moderasyon logu orada yazılır. İhlal kaydı group_strikes''ta.';

commit;
