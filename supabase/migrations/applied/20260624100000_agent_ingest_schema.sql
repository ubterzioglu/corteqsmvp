-- Agent ingestion şeması (Faz 1: Kanonikleştirme)
-- docs/agent/tools.json kataloğunun sorgulanabilir ikincil kopyası.
-- Tek doğruluk kaynağı git'teki tools.json'dur; bu tablolar opsiyonel DB projeksiyonudur.
-- scripts/ingest-tools.mjs --push tarafından doldurulur (service role).
-- Kaynak tasarım: newtools.md §"Repo ingestion ve kanonik veri modeli".
--
-- Erişim: yalnız admin (public.is_admin(auth.uid())). RLS etkin + politika dar →
-- anon/authenticated için deny-all. ops.* analytics tabloları Faz 1 dışıdır.

create schema if not exists ingest;

-- 1) Repo dosya envanteri ----------------------------------------------------
create table if not exists ingest.repo_files (
  file_id         bigserial primary key,
  path            text not null unique,
  kind            text not null,            -- ts, tsx, sql, json, mjs, md, ...
  module_family   text not null,            -- cadde, muhasebe, surveys, edge, worker, ...
  parsed_at       timestamptz not null default now(),
  meta            jsonb not null default '{}'::jsonb
);

create index if not exists repo_files_module_idx
  on ingest.repo_files (module_family, kind);
create index if not exists repo_files_meta_gin
  on ingest.repo_files using gin (meta);

-- 2) Çıkarılan semboller (route, function, rpc, table_ref, env_var, ...) ------
create table if not exists ingest.repo_symbols (
  symbol_id       bigserial primary key,
  file_id         bigint not null references ingest.repo_files(file_id) on delete cascade,
  symbol_type     text not null,            -- route, function, rpc, table_ref, env_var, script
  symbol_name     text not null,
  attrs           jsonb not null default '{}'::jsonb
);

create index if not exists repo_symbols_lookup_idx
  on ingest.repo_symbols (symbol_type, symbol_name);
create index if not exists repo_symbols_attrs_gin
  on ingest.repo_symbols using gin (attrs);

-- 3) Kanonik tool registry ---------------------------------------------------
create table if not exists ingest.tools (
  tool_key            text primary key,     -- edge.find_matches, worker.service_finder, ...
  tool_name           text not null,
  tool_family         text not null,        -- edge_function, worker, ui_module, script
  status              text not null,        -- active, deprecated, unknown
  entrypoint_path     text not null,
  interface_kind      text not null,        -- http, cli, internal_api
  input_schema        jsonb,
  tables_read_write   jsonb not null default '[]'::jsonb,
  rpcs                jsonb not null default '[]'::jsonb,
  dependencies        jsonb not null default '[]'::jsonb,
  version_pins        jsonb not null default '{}'::jsonb,
  evidence_path       text,
  updated_at          timestamptz not null default now()
);

create index if not exists tools_family_status_idx
  on ingest.tools (tool_family, status);
create index if not exists tools_input_gin
  on ingest.tools using gin (input_schema);

-- RLS: deny-all default, yalnız admin okuma/yazma ---------------------------
alter table ingest.repo_files   enable row level security;
alter table ingest.repo_symbols enable row level security;
alter table ingest.tools        enable row level security;

-- Not: service role RLS'i bypass eder; aşağıdaki politikalar admin kullanıcı
-- erişimi içindir. Salt-okuma admin paneli bu politikalara dayanır.
drop policy if exists repo_files_admin_read on ingest.repo_files;
create policy repo_files_admin_read on ingest.repo_files
  for select using (public.is_admin(auth.uid()));

drop policy if exists repo_symbols_admin_read on ingest.repo_symbols;
create policy repo_symbols_admin_read on ingest.repo_symbols
  for select using (public.is_admin(auth.uid()));

drop policy if exists tools_admin_read on ingest.tools;
create policy tools_admin_read on ingest.tools
  for select using (public.is_admin(auth.uid()));

comment on schema ingest is
  'Agent tool kataloğu projeksiyonu. Doğruluk kaynağı: docs/agent/tools.json (scripts/ingest-tools.mjs).';
