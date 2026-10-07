-- ═══════════════════════════════════════════════════════════════════════════
-- CorteQS Ekstre Motoru — kart ekstresi / Mercury -> expenses
-- Mevcut `expenses` tablosu korunur; yalnızca YENİ ve BOŞ BIRAKILABİLİR kolonlar eklenir.
-- Yetki: tüm yeni tablolar yalnızca admin (public.is_admin()) içindir.
--   ⚠ Barış: projedeki is_admin imzası farklıysa (örn. is_admin(auth.uid())) aşağıdaki
--     politikaları expenses tablosundaki mevcut politikalarla aynı ifadeye çevir.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) expenses: ek kolonlar ------------------------------------------------------
-- Ekstreden gelen giderler CorteQS muhasebesine HER ZAMAN USD olarak girer:
--   amount = amount_usd_net (gider ortağı katkısı düşülmüş),  currency = 'USD'
--   amount_original / currency_original = ekstrede yazan asıl tutar (TL, EUR, …)
alter table public.expenses
  add column if not exists amount_original     numeric(14,2),
  add column if not exists currency_original   text,
  add column if not exists partner_name        text,                             -- dış gider ortağı (örn. Baran)
  add column if not exists amount_try          numeric(14,2),
  add column if not exists amount_usd          numeric(14,2),
  add column if not exists amount_usd_net      numeric(14,2),
  add column if not exists partner_share_usd   numeric(14,2),
  add column if not exists fx_rate_usd         numeric(18,8),
  add column if not exists card_last4          text,
  add column if not exists merchant_raw        text,
  add column if not exists source              text not null default 'manual',   -- manual | pdf_statement | sheet_csv | mercury
  add column if not exists source_import_id    uuid,
  add column if not exists source_fingerprint  text,
  add column if not exists external_id         text;                             -- Mercury transaction id

create unique index if not exists expenses_source_fingerprint_uq on public.expenses (source_fingerprint) where source_fingerprint is not null;
create unique index if not exists expenses_external_id_uq       on public.expenses (external_id)       where external_id is not null;
create index        if not exists expenses_source_idx           on public.expenses (source);

-- İade satırları negatif tutarla gelir. expenses.amount üzerinde "amount >= 0" kısıtı varsa kaldırılmalı
-- ya da iadeler ayrı ele alınmalı. (Kontrol: \d public.expenses)

-- 2) Kartlar ----------------------------------------------------------------------
create table if not exists public.payment_cards (
  last4           text primary key,                 -- "6108" (Maximiles için geçici "MAXI")
  label           text not null,
  bank            text not null,                    -- QNB Finansbank | İş Bankası | Mercury
  payment_method  text not null,                    -- expenses.payment_method değerlerinden biri
  owner           text not null default 'burak',    -- burak | baris | ortak
  is_virtual      boolean not null default false,
  default_person  text not null default 'ortak',
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- 3) Tüccar kuralları ------------------------------------------------------------
create table if not exists public.merchant_rules (
  id           uuid primary key default gen_random_uuid(),
  pattern      text not null,                       -- case-insensitive regex (normalize edilmiş açıklamaya)
  merchant     text not null,
  category     text not null,
  person       text,                                -- null => kart/varsayılan
  is_tech      boolean not null default true,
  share_pct    numeric(5,2),                        -- ortak alımlarda karşı tarafın payı (%)
  priority     int not null default 100,
  auto_commit  boolean not null default false,      -- Mercury'de incelemesiz aktarım
  active       boolean not null default true,
  hit_count    int not null default 0,
  created_by   uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists merchant_rules_active_idx on public.merchant_rules (active, priority);

-- 4) Kur önbelleği -----------------------------------------------------------------
create table if not exists public.fx_rates (
  rate_date  date not null,
  currency   text not null,                         -- TRY | EUR | GBP | QAR
  usd_rate   numeric(18,10) not null,               -- 1 birim = ? USD
  source     text not null default 'tcmb',
  created_at timestamptz not null default now(),
  primary key (rate_date, currency)
);

-- 5) Yüklemeler (bir PDF / CSV / Mercury senkron turu = bir import) ------------------
create table if not exists public.statement_imports (
  id              uuid primary key default gen_random_uuid(),
  source          text not null,                    -- pdf_statement | sheet_csv | mercury
  file_path       text,                             -- storage: statements/<yyyy>/<uuid>.pdf
  file_name       text,
  file_sha256     text,                             -- aynı dosyanın iki kez yüklenmesini engeller
  bank            text,
  period_start    date,
  period_end      date,
  statement_date  date,
  card_last4s     text[],
  status          text not null default 'uploaded', -- uploaded | parsing | ready | committed | partially_committed | failed
  provider        text,                             -- gemini | anthropic | lovable
  meta            jsonb not null default '{}'::jsonb,
  warnings        jsonb not null default '[]'::jsonb,
  summary         jsonb not null default '{}'::jsonb,
  raw_lines       jsonb,                            -- yapay zekâdan gelen ham satırlar (yeniden işlemede tekrar okumamak için)
  error           text,
  created_by      uuid default auth.uid(),
  created_at      timestamptz not null default now(),
  committed_at    timestamptz
);
create unique index if not exists statement_imports_sha_uq on public.statement_imports (file_sha256) where file_sha256 is not null and status <> 'failed';

-- 6) Satırlar (inceleme tablosu) -----------------------------------------------------
create table if not exists public.statement_lines (
  id                 uuid primary key default gen_random_uuid(),
  import_id          uuid not null references public.statement_imports(id) on delete cascade,
  line_no            int not null,
  txn_date           date not null,
  description_raw    text not null,
  merchant           text not null,
  merchant_normalized text,
  line_type          text not null default 'purchase',
  amount_original    numeric(14,2) not null,
  currency_original  text not null,
  amount_try         numeric(14,2),
  amount_usd         numeric(14,2),
  amount_usd_net     numeric(14,2),
  partner_share_usd  numeric(14,2),
  partner_name       text,
  fx_rate_usd        numeric(18,10),
  card_last4         text,
  card_label         text,
  category           text not null,
  person             text not null,
  payment_method     text not null,
  is_virtual_card    boolean not null default false,
  is_tech            boolean not null default false,
  rule_id            uuid references public.merchant_rules(id) on delete set null,
  confidence         numeric(4,3) not null default 0,
  fingerprint        text not null,
  external_id        text,
  duplicate_of       uuid,                         -- expenses.id
  duplicate_reason   text,
  decision           text not null,                -- import | review | skip  (motorun önerisi)
  include            boolean not null,             -- kullanıcının son kararı (varsayılan: decision = 'import')
  flags              text[] not null default '{}',
  note               text,
  invoice_url        text,
  expense_id         uuid,                         -- aktarıldıysa oluşan expenses.id
  status             text not null default 'pending', -- pending | committed | skipped
  edited             boolean not null default false,   -- kullanıcı elle değiştirdiyse yeniden işlemede korunur
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists statement_lines_import_idx on public.statement_lines (import_id, line_no);
create index if not exists statement_lines_status_idx on public.statement_lines (status);

-- 7) Mercury senkron durumu -----------------------------------------------------------
create table if not exists public.mercury_sync_state (
  account_id      text primary key,
  account_name    text,
  last_synced_at  timestamptz,
  last_txn_date   date,
  last_result     jsonb
);

-- 7b) Muhasebe ayarları (tek satır) ---------------------------------------------------------
create table if not exists public.accounting_settings (
  id                     int primary key default 1 check (id = 1),
  partner_share_enabled  boolean not null default true,        -- gider ortağı kolonu (ileride kapatılabilir)
  fx_rate_date           text not null default 'transaction'   -- transaction = işlem günü TCMB kuru | upload = yükleme günü (güncel) kur
                         check (fx_rate_date in ('transaction','upload')),
  mercury_auto_commit    boolean not null default false,       -- false: Mercury satırları da önce incelemeye düşer
  updated_at             timestamptz not null default now()
);
insert into public.accounting_settings (id) values (1) on conflict (id) do nothing;

-- 8) RLS ------------------------------------------------------------------------------
alter table public.payment_cards      enable row level security;
alter table public.merchant_rules     enable row level security;
alter table public.fx_rates           enable row level security;
alter table public.statement_imports  enable row level security;
alter table public.statement_lines    enable row level security;
alter table public.mercury_sync_state enable row level security;
alter table public.accounting_settings enable row level security;

do $$
declare t text;
begin
  foreach t in array array['payment_cards','merchant_rules','fx_rates','statement_imports','statement_lines','mercury_sync_state','accounting_settings'] loop
    execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t || '_admin_all', t);
  end loop;
end $$;

-- 9) Storage: özel "statements" kovası (yalnızca admin) ---------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('statements', 'statements', false, 20 * 1024 * 1024, array['application/pdf','text/csv','application/json'])
on conflict (id) do nothing;

drop policy if exists statements_admin_rw on storage.objects;
create policy statements_admin_rw on storage.objects for all to authenticated
  using (bucket_id = 'statements' and public.is_admin())
  with check (bucket_id = 'statements' and public.is_admin());

-- 10) Onaylı satırları expenses'a aktaran atomik fonksiyon ------------------------------
--  • Yalnızca include = true ve status = 'pending' satırlar aktarılır
--  • source_fingerprint / external_id benzersiz: aynı satır ikinci kez aktarılamaz
--  • p_line_ids verilirse yalnızca o satırlar; null ise import'taki tüm include=true satırlar
create or replace function public.commit_statement_lines(p_import_id uuid, p_line_ids uuid[] default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_src text;
  v_share_on boolean;
  v_inserted int := 0;
  v_skipped  int := 0;
  v_no_fx    int := 0;
  v_amount numeric;
  r record;
  v_id uuid;
begin
  if not public.is_admin() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'yetkisiz';
  end if;

  select source into v_src from statement_imports where id = p_import_id;
  if v_src is null then raise exception 'import bulunamadı'; end if;
  select coalesce((select partner_share_enabled from accounting_settings where id = 1), true) into v_share_on;

  for r in
    select * from statement_lines
    where import_id = p_import_id and status = 'pending' and include
      and (p_line_ids is null or id = any(p_line_ids))
    order by line_no
  loop
    -- USD karşılığı yoksa muhasebeye girmez, satır beklemede kalır
    if r.amount_usd is null then
      v_no_fx := v_no_fx + 1;
      continue;
    end if;
    -- CorteQS'e giren gider: brüt $ − gider ortağı katkısı $
    v_amount := case when v_share_on then coalesce(r.amount_usd_net, r.amount_usd - coalesce(r.partner_share_usd, 0)) else r.amount_usd end;

    insert into expenses (
      expense_date, person, category, description, amount, currency, status, payment_method,
      is_virtual_card, invoice_url, note,
      amount_original, currency_original, partner_name,
      amount_try, amount_usd, amount_usd_net, partner_share_usd, fx_rate_usd, card_last4, merchant_raw,
      source, source_import_id, source_fingerprint, external_id, created_by
    ) values (
      r.txn_date, r.person, r.category, r.merchant, v_amount, 'USD', 'odendi', r.payment_method,
      r.is_virtual_card, r.invoice_url,
      left(concat_ws(' · ', nullif(r.note,''),
             case when v_share_on and coalesce(r.partner_share_usd,0) <> 0
                  then format('Gider ortağı%s: $%s (brüt $%s)', coalesce(' ' || r.partner_name, ''), r.partner_share_usd, r.amount_usd) end,
             case when r.currency_original <> 'USD'
                  then format('Orijinal: %s %s', r.amount_original, r.currency_original) end,
             'Ekstre: ' || r.description_raw), 1000),
      r.amount_original, r.currency_original, case when v_share_on then r.partner_name end,
      r.amount_try, r.amount_usd, v_amount, case when v_share_on then r.partner_share_usd end, r.fx_rate_usd, r.card_last4, r.description_raw,
      v_src, p_import_id, r.fingerprint, r.external_id, auth.uid()
    )
    on conflict do nothing
    returning id into v_id;

    if v_id is null then
      v_skipped := v_skipped + 1;
      update statement_lines set status = 'skipped', flags = array_append(flags, 'mukerrer'), updated_at = now() where id = r.id;
    else
      v_inserted := v_inserted + 1;
      update statement_lines set status = 'committed', expense_id = v_id, updated_at = now() where id = r.id;
      if r.rule_id is not null then update merchant_rules set hit_count = hit_count + 1 where id = r.rule_id; end if;
    end if;
    v_id := null;
  end loop;

  -- Seçilmeyen satırlar "skipped" olur (sadece tüm import onaylanırken)
  if p_line_ids is null then
    update statement_lines set status = 'skipped', updated_at = now()
    where import_id = p_import_id and status = 'pending' and not include;
  end if;

  update statement_imports set
    status = case when exists (select 1 from statement_lines where import_id = p_import_id and status = 'pending')
                  then 'partially_committed' else 'committed' end,
    committed_at = now()
  where id = p_import_id;

  return jsonb_build_object('inserted', v_inserted, 'skipped_duplicates', v_skipped, 'missing_fx', v_no_fx);
end $$;

revoke all on function public.commit_statement_lines(uuid, uuid[]) from public, anon;
grant execute on function public.commit_statement_lines(uuid, uuid[]) to authenticated, service_role;

-- 11) Aktarılmış bir import'u geri alma (yanlış yükleme için) -----------------------------
create or replace function public.revert_statement_import(p_import_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  if not public.is_admin() then raise exception 'yetkisiz'; end if;
  delete from expenses where source_import_id = p_import_id;
  get diagnostics v_count = row_count;
  update statement_lines set status = 'pending', expense_id = null, updated_at = now() where import_id = p_import_id;
  update statement_imports set status = 'ready', committed_at = null where id = p_import_id;
  return jsonb_build_object('deleted', v_count);
end $$;
revoke all on function public.revert_statement_import(uuid) from public, anon;
grant execute on function public.revert_statement_import(uuid) to authenticated;
