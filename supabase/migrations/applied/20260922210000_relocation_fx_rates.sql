-- B30: maliyet rakamları için kur tablosu + kaynak kaydı.
--
-- Karar (22.09): üye tek karşılık görsün; sağlayıcı `open.er-api.com`.
-- Sağlayıcı seçimi ÖLÇÜMLE yapıldı: 12 ülkenin 7 para birimi var ve ECB referans
-- kurları (frankfurter.app, 29 birim) **QAR ile AED'yi yayımlamıyor** — USD'ye
-- sabitlenmiş Körfez para birimleri ECB listesinde yok. open.er-api.com 166 birim
-- taşıyor ve 8/8 hedefi kapsıyor. Bedeli künyeye yazılır: kaynak bir merkez bankası
-- DEĞİLDİR. `authority_level` sözlüğünde 'aggregator' yok; en dürüst karşılık
-- **`licensed_commercial`**. Buraya 'official' YAZILMAZ — o etiket merkez bankası /
-- resmî kurum içindir ve toplayıcıya verilirse künye yalan söyler.
--
-- ⚠️ Kur ANLIK ÇEKİLMEZ, kaydedilir. Sayfa her açılışta dış servise gitmez; ayrıca
-- kurun hangi ana ait olduğu (`fetched_at`) görünür. B28'in dersi: tarihsiz bir
-- dönüştürme, ölçülmemiş bir rakama kesinlik havası verir.
--
-- ⚠️ Sabit parite ELLE GİRİLMEZ. QAR ve AED USD'ye sabitlidir ama pariteyi koda
-- yazmak yol haritasının "kur kaynağı yoksa girilmez" kuralını çiğner.
--
-- Geri alma: `drop table public.relocation_fx_rates;` + kaynak kaydını sil.

create table if not exists public.relocation_fx_rates (
  id uuid primary key default gen_random_uuid(),
  base_currency text not null,
  quote_currency text not null,
  -- 1 base_currency = rate quote_currency
  rate numeric(20, 10) not null check (rate > 0),
  source_id uuid not null references public.relocation_source_registry(id),
  -- Sağlayıcının kuru yayımladığı an (bizim çektiğimiz an değil).
  rate_at timestamptz not null,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint relocation_fx_rates_pair_uniq unique (base_currency, quote_currency),
  constraint relocation_fx_rates_not_self check (base_currency <> quote_currency)
);

comment on table public.relocation_fx_rates is
  'B30: saklanan döviz kurları. Anlık çekim YOK; rate_at kurun ait olduğu anı taşır.';

create index if not exists idx_relocation_fx_rates_quote
  on public.relocation_fx_rates (quote_currency);

alter table public.relocation_fx_rates enable row level security;

-- Kurlar herkese açık okunur: maliyet paneli giriş yapmamış ziyaretçiye de çizilebilir
-- ve kurda gizli bir şey yok. Yazma YALNIZ service_role'dedir (tazeleme komutu).
drop policy if exists relocation_fx_rates_read on public.relocation_fx_rates;
create policy relocation_fx_rates_read
  on public.relocation_fx_rates for select
  to anon, authenticated
  using (true);

revoke all on table public.relocation_fx_rates from anon, authenticated;
grant select on table public.relocation_fx_rates to anon, authenticated;

-- Kaynak künyesi. `refresh_sla_hours = 24`: sağlayıcı günde bir yayımlıyor.
insert into public.relocation_source_registry
  (source_key, provider_name, authority_level, category, license_type,
   api_terms_summary, refresh_sla_hours, is_active)
values
  ('fx_open_er_api', 'open.er-api.com', 'licensed_commercial', 'fx', 'free',
   'Ucretsiz, anahtarsiz. Gunluk guncellenir. Merkez bankasi degil, toplayici.',
   24, true)
on conflict (source_key) do update
  set provider_name = excluded.provider_name,
      authority_level = excluded.authority_level,
      category = excluded.category,
      refresh_sla_hours = excluded.refresh_sla_hours,
      is_active = true,
      updated_at = now();
