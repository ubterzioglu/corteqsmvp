-- Sosyal Medya Paylaşım Deposu — tab kavramını DB kimliğinden kaldırır.
-- Önceki tasarım: her kalem (item_tab, item_id) çiftiyle tanımlıydı — 4 ayrı
-- kaynağın (tools/diaspora/tests/burak) kendi 1..N numaralandırması vardı ve
-- aynı sayı farklı kaynaklarda çakışabiliyordu (ör. "21.png" hem
-- "burak-tool-2" hem "diaspora post-2" anlamına gelebiliyordu — bu karışıklık
-- yüzünden yanlış görseller yanlış kartlara yüklenmişti).
--
-- Yeni tasarım: her kalemin TÜM kaynaklar arası sabit tekil bir globalId'si
-- var ("item-1".."item-100", src/lib/admin-shell/social-share-unified.ts
-- içinde atanır). slot_key ve paylaşım takip tabloları artık SADECE bunu
-- kullanır; tab/id sadece UI rozeti içindir, DB'ye hiç girmez.
--
-- Bu migration 3 şeyi yapar:
--   1) social_share_assets / social_share_asset_images: slot_key değerlerini
--      eski `${tab}/${itemId}/variant-N` formatından yeni `${globalId}/variant-N`
--      formatına çevirir (16+16 mevcut kayıt).
--   2) social_share_log / social_share_item_note: item_tab + item_id iki
--      kolonunu tek global_id koluna indirger (1 mevcut log kaydı).
--   3) Eski item_tab CHECK constraint'lerini kaldırır (tab artık DB'de yok).
--
-- IDEMPOTENT: eski kolonlara dokunan her adım `item_tab` kolonunun hâlâ var
-- olmasına bağlıdır ve dinamik EXECUTE ile çalışır. Böylece migration zaten
-- uygulanmış bir veritabanında yeniden çalıştırılırsa 42703 ("column item_tab
-- does not exist") yerine sessizce no-op olur.

-- 1) social_share_assets + social_share_asset_images: slot_key'leri çevir ----
-- Elle doğrulanmış (script: scripts/reseed-social-share-outputs.mjs çıktısı,
-- 2026-07-21) eski→yeni slot_key eşlemesi. Yalnız o an dolu olan 16 slot var.
-- Yeniden çalıştırmada eski anahtarlar artık eşleşmediği için UPDATE'ler no-op olur.
drop table if exists _social_share_slot_migration;
create temporary table _social_share_slot_migration (old_slot_key text primary key, new_slot_key text not null);
insert into _social_share_slot_migration (old_slot_key, new_slot_key) values
  ('diaspora/post-1/variant-0', 'item-1/variant-0'),
  ('diaspora/post-2/variant-0', 'item-2/variant-0'),
  ('burak/burak-tool-1/variant-0', 'item-3/variant-0'),
  ('diaspora/post-3/variant-0', 'item-4/variant-0'),
  ('tools/tool-1/variant-0', 'item-5/variant-0'),
  ('diaspora/post-4/variant-0', 'item-6/variant-0'),
  ('diaspora/post-5/variant-0', 'item-7/variant-0'),
  ('tests/test-tool-1/variant-0', 'item-8/variant-0'),
  ('diaspora/post-6/variant-0', 'item-9/variant-0'),
  ('diaspora/post-7/variant-0', 'item-10/variant-0'),
  ('diaspora/post-8/variant-0', 'item-11/variant-0'),
  ('burak/burak-tool-2/variant-1', 'item-12/variant-1'),
  ('burak/burak-tool-2/variant-2', 'item-12/variant-2'),
  ('burak/burak-tool-1/variant-1', 'item-3/variant-1'),
  ('tests/test-tool-1/variant-1', 'item-8/variant-1'),
  ('tests/test-tool-1/variant-2', 'item-8/variant-2');

update public.social_share_assets a
set slot_key = m.new_slot_key
from _social_share_slot_migration m
where a.slot_key = m.old_slot_key;

update public.social_share_asset_images ai
set slot_key = m.new_slot_key
from _social_share_slot_migration m
where ai.slot_key = m.old_slot_key;

drop table _social_share_slot_migration;

-- 2) social_share_log: item_tab + item_id → global_id ------------------------
alter table public.social_share_log add column if not exists global_id text;

do $$
begin
  -- Eski kolonlar duruyorsa: veriyi taşı, doğrula, kolonları düşür.
  -- Zaten taşınmışsa bu blok tamamen atlanır (yeniden çalıştırma güvenliği).
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'social_share_log' and column_name = 'item_tab'
  ) then
    -- Mevcut tek kayıt: (tools, tool-1) → item-5 (bkz. social-share-unified.ts globalId ataması).
    execute $sql$
      update public.social_share_log
      set global_id = case
        when item_tab = 'tools' and item_id = 'tool-1' then 'item-5'
        else null
      end
      where global_id is null
    $sql$;

    if exists (select 1 from public.social_share_log where global_id is null) then
      raise exception 'social_share_log: eşlenemeyen satır kaldı — migration verisini genişlet';
    end if;

    alter table public.social_share_log drop constraint if exists social_share_log_item_platform_uniq;
    drop index if exists social_share_log_item_idx;

    -- item_tab'e dokunan CHECK constraint'leri isimsiz tanımlanmış olabilir.
    declare
      con_name text;
    begin
      for con_name in
        select con.conname
        from pg_constraint con
        join pg_class rel on rel.oid = con.conrelid
        join pg_namespace nsp on nsp.oid = rel.relnamespace
        where nsp.nspname = 'public'
          and rel.relname = 'social_share_log'
          and con.contype = 'c'
          and pg_get_constraintdef(con.oid) ilike '%item_tab%'
      loop
        execute format('alter table public.social_share_log drop constraint %I', con_name);
      end loop;
    end;

    alter table public.social_share_log drop column item_tab;
    alter table public.social_share_log drop column item_id;
  end if;
end $$;

alter table public.social_share_log alter column global_id set not null;

alter table public.social_share_log
  drop constraint if exists social_share_log_global_id_platform_uniq;
alter table public.social_share_log
  add constraint social_share_log_global_id_platform_uniq unique (global_id, platform);

create index if not exists social_share_log_global_id_idx
  on public.social_share_log (global_id);

-- 3) social_share_item_note: item_tab + item_id → global_id ------------------
alter table public.social_share_item_note add column if not exists global_id text;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'social_share_item_note' and column_name = 'item_tab'
  ) then
    -- Kaynak DB'de bu tablo boştu; eşleme verisi tanımlı değil. Satır varsa
    -- sessizce NULL bırakmak yerine yüksek sesle patlat.
    if exists (select 1 from public.social_share_item_note where global_id is null) then
      raise exception 'social_share_item_note: eşlenemeyen satır kaldı — migration verisini genişlet';
    end if;

    alter table public.social_share_item_note drop constraint if exists social_share_item_note_item_uniq;

    declare
      con_name text;
    begin
      for con_name in
        select con.conname
        from pg_constraint con
        join pg_class rel on rel.oid = con.conrelid
        join pg_namespace nsp on nsp.oid = rel.relnamespace
        where nsp.nspname = 'public'
          and rel.relname = 'social_share_item_note'
          and con.contype = 'c'
          and pg_get_constraintdef(con.oid) ilike '%item_tab%'
      loop
        execute format('alter table public.social_share_item_note drop constraint %I', con_name);
      end loop;
    end;

    alter table public.social_share_item_note drop column item_tab;
    alter table public.social_share_item_note drop column item_id;
  end if;
end $$;

alter table public.social_share_item_note alter column global_id set not null;

alter table public.social_share_item_note
  drop constraint if exists social_share_item_note_global_id_uniq;
alter table public.social_share_item_note
  add constraint social_share_item_note_global_id_uniq unique (global_id);

comment on column public.social_share_log.global_id is
  'Tüm kaynaklar arası sabit tekil kimlik ("item-1".."item-100") — src/lib/admin-shell/social-share-unified.ts.';
comment on column public.social_share_item_note.global_id is
  'Tüm kaynaklar arası sabit tekil kimlik ("item-1".."item-100") — src/lib/admin-shell/social-share-unified.ts.';
