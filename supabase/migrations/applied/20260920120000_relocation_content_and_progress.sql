-- Relocation motoru — içerik + ilerleme şeması (2026-09-20).
-- Plan: docs/plans/2026-09-20-relocation-motor-plani.md §Faz 1
--
-- Neden: canlı ölçümde motorun mimarisi sağlam ama içeriği boştu
-- (relocation_moves=0, relocation_services=0, relocation_bureaucratic_steps=2).
-- Referans Lovable uygulamasındaki "Yaşam Masrafları" ve "Gerekli Belgeler"
-- sekmelerinin bizde KARŞILIĞI YOKTU:
--   • relocation_cost_ledger adı yanıltıcıdır — o bir AI sağlayıcı fatura defteri
--     (provider_key/unit_cost_usd), yaşam masrafı tablosu DEĞİL.
--   • relocation_locations yalnızca 0..1 normalize cost_index tutar, tutar tutmaz.
--   • relocation_bureaucratic_steps.required_documents bir text[]; referansın
--     {doc, category, note} modeli oraya sığmaz.
-- Ayrıca checklist/belge kutucuk durumu ve kayıtlı doküman için tablo yoktu
-- (yalnızca relocation_interactions içinde 'checklist_complete' olay tipi vardı).
--
-- Desen: 20260619100000_relocation_core.sql + 20260619101000_relocation_rls.sql.
--   • Referans içerik (living_costs / required_documents): public read, kullanıcı yazamaz.
--   • Kullanıcı durumu (move_progress / move_documents): sahip-bazlı RLS.

-- ---------------------------------------------------------------------------
-- 1) Yaşam masrafları — kalem bazlı, SAYISAL aralık
--    Referanstaki "€800 - €1,500/ay" metin aralıkları DB'ye string olarak GİRMEZ;
--    biçimlendirme sunum katmanının işidir (src/lib/muhasebe-format.ts deseni).
-- ---------------------------------------------------------------------------
create table if not exists public.relocation_living_costs (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,                       -- ISO 3166-1 alpha-2
  city_code text,                                   -- null = ülke geneli
  item_key text not null
    check (item_key in ('rent', 'groceries', 'transport', 'insurance', 'utilities', 'childcare')),
  amount_min numeric(12,2),
  amount_max numeric(12,2),
  currency text not null default 'EUR',
  -- Hane büyüklüğü: 1 = yalnız, 2 = çift, 3+ = aile. Referans aileyi 1.6 katsayısıyla
  -- ÇARPIYORDU (uydurma); burada gerçek satır tutulur, katsayı yok.
  household_size smallint not null default 1 check (household_size between 1 and 8),
  period text not null default 'monthly' check (period in ('monthly', 'one_off')),
  note text,
  source_id uuid references public.relocation_source_registry(id),
  freshness_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.relocation_living_costs is
  'Ülke/şehir bazlı yaşam masrafı kalemleri. Tutarlar SAYISAL (min/max); "€800-1500/ay" gibi metin aralığı saklanmaz. Plan: docs/plans/2026-09-20-relocation-motor-plani.md';

create unique index if not exists relocation_living_costs_uniq
  on public.relocation_living_costs (country_code, coalesce(city_code, ''), item_key, household_size, period);

create index if not exists relocation_living_costs_lookup_idx
  on public.relocation_living_costs (country_code, is_active);

-- ---------------------------------------------------------------------------
-- 2) Gerekli belgeler — kategori + not (apostil / yeminli tercüme bilgisi)
--    Bu, referans uygulamanın tek gerçek alan değeri: 5 ülke için apostil ve
--    tercüme notlarıyla belge listesi.
-- ---------------------------------------------------------------------------
create table if not exists public.relocation_required_documents (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  doc_name text not null,
  category text not null,                           -- ör. Kimlik / Eğitim / Finans / Sağlık
  note text,                                        -- ör. "Apostil tasdikli, yeminli tercüme"
  sort_order integer not null default 0,
  source_id uuid references public.relocation_source_registry(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.relocation_required_documents is
  'Ülke bazlı taşınma belge listesi (kategori + apostil/tercüme notu). relocation_bureaucratic_steps.required_documents text[] alanı bu modeli taşıyamadığı için ayrı tablodur.';

create index if not exists relocation_required_documents_lookup_idx
  on public.relocation_required_documents (country_code, is_active, sort_order);

-- ---------------------------------------------------------------------------
-- 3) Kullanıcı ilerlemesi — checklist / belge kutucukları
--    relocation_interactions yalnızca OLAY yazar (checklist_complete); kalıcı
--    kutucuk durumu için yeri yoktu.
-- ---------------------------------------------------------------------------
create table if not exists public.relocation_move_progress (
  id uuid primary key default gen_random_uuid(),
  move_id uuid not null references public.relocation_moves(id) on delete cascade,
  item_type text not null check (item_type in ('checklist_step', 'required_document')),
  item_key text not null,                           -- step id ya da document id (metin)
  is_done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.relocation_move_progress is
  'Taşınma dosyasındaki checklist adımı / belge kutucuğunun kalıcı durumu. Sahip-bazlı RLS (move üzerinden).';

create unique index if not exists relocation_move_progress_uniq
  on public.relocation_move_progress (move_id, item_type, item_key);

-- ---------------------------------------------------------------------------
-- 4) Kayıtlı dokümanlar — referansın savedDocs'unun DB karşılığı
--    Referans bunları localStorage'da tutuyordu; cihaz değişince kayboluyordu.
-- ---------------------------------------------------------------------------
create table if not exists public.relocation_move_documents (
  id uuid primary key default gen_random_uuid(),
  move_id uuid not null references public.relocation_moves(id) on delete cascade,
  title text not null,
  content text not null,
  doc_type text not null check (doc_type in ('checklist', 'chat', 'report', 'costs')),
  created_at timestamptz not null default now()
);

comment on table public.relocation_move_documents is
  'Taşınma dosyasına kaydedilen rapor/checklist/sohbet çıktıları. Referans uygulama bunu localStorage''da tutuyordu (cihaz değişince kayıp).';

create index if not exists relocation_move_documents_move_idx
  on public.relocation_move_documents (move_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 5) RLS
-- ---------------------------------------------------------------------------
alter table public.relocation_living_costs        enable row level security;
alter table public.relocation_required_documents  enable row level security;
alter table public.relocation_move_progress       enable row level security;
alter table public.relocation_move_documents      enable row level security;

-- Referans içerik: herkes aktif satırı okur; kullanıcı INSERT/UPDATE yok
-- (yazma service_role ingestion ya da security-definer RPC üzerinden).
drop policy if exists relocation_living_costs_read on public.relocation_living_costs;
create policy relocation_living_costs_read on public.relocation_living_costs
  for select using (is_active);

drop policy if exists relocation_required_documents_read on public.relocation_required_documents;
create policy relocation_required_documents_read on public.relocation_required_documents
  for select using (is_active);

-- Kullanıcı durumu: sahiplik move üzerinden doğrulanır.
drop policy if exists relocation_move_progress_owner_select on public.relocation_move_progress;
create policy relocation_move_progress_owner_select on public.relocation_move_progress
  for select to authenticated using (
    exists (
      select 1 from public.relocation_moves m
      where m.id = relocation_move_progress.move_id and m.user_id = auth.uid()
    )
  );

drop policy if exists relocation_move_progress_owner_write on public.relocation_move_progress;
create policy relocation_move_progress_owner_write on public.relocation_move_progress
  for all to authenticated using (
    exists (
      select 1 from public.relocation_moves m
      where m.id = relocation_move_progress.move_id and m.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.relocation_moves m
      where m.id = relocation_move_progress.move_id and m.user_id = auth.uid()
    )
  );

drop policy if exists relocation_move_documents_owner_select on public.relocation_move_documents;
create policy relocation_move_documents_owner_select on public.relocation_move_documents
  for select to authenticated using (
    exists (
      select 1 from public.relocation_moves m
      where m.id = relocation_move_documents.move_id and m.user_id = auth.uid()
    )
  );

drop policy if exists relocation_move_documents_owner_write on public.relocation_move_documents;
create policy relocation_move_documents_owner_write on public.relocation_move_documents
  for all to authenticated using (
    exists (
      select 1 from public.relocation_moves m
      where m.id = relocation_move_documents.move_id and m.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.relocation_moves m
      where m.id = relocation_move_documents.move_id and m.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 6) Grants (RLS zaten kısıtlıyor; grant olmadan policy tek başına yetmez)
-- ---------------------------------------------------------------------------
grant select on public.relocation_living_costs       to anon, authenticated;
grant select on public.relocation_required_documents to anon, authenticated;
grant select, insert, update, delete on public.relocation_move_progress  to authenticated;
grant select, insert, delete          on public.relocation_move_documents to authenticated;
