-- Komuta Merkezi "TOP 10 HOT FIX" tablosu.
--
-- Neden ayrı tablo: hot fix kayıtları command_center_items'a item_type='hot_fix' olarak
-- eklenseydi mevcut facet view'ına (v_command_center_facets), filtrelere, rozet sayımlarına ve
-- Todo/Toplantı Notları sayfalarına sızardı; her sayım noktasına dışlama kodu yazmak gerekirdi.
-- Ayrı tablo mevcut akışın tek satırını bile değiştirmez.
--
-- Sınır kuralı: en fazla 10 AÇIK madde. "Tamamlandi" durumundaki madde slot işgal etmez —
-- tabloda görünmeye devam eder, sadece listenin altına düşer (sıralama uygulama tarafında).

begin;

create table if not exists public.command_center_hot_fixes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  detail text not null default '',
  category_label text not null default 'Genel',
  assignee text not null default 'Atanmadi',
  status text not null default 'Baslanmadi',
  priority integer not null default 5,
  due_date date,
  urgent boolean not null default false,
  sort_order integer not null default 0,
  archived_at timestamp with time zone,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint command_center_hot_fixes_assignee_check
    check (assignee = any (array['Atanmadi'::text, 'UBT'::text, 'Burak'::text, 'B+B'::text])),
  constraint command_center_hot_fixes_status_check
    check (status = any (array['Baslanmadi'::text, 'Beklemede'::text, 'Devam ediyor'::text, 'Tamamlandi'::text])),
  constraint command_center_hot_fixes_priority_check
    check (priority between 1 and 10)
);

comment on table public.command_center_hot_fixes is
  'Komuta Merkezi TOP 10 HOT FIX listesi. En fazla 10 acik madde (status <> Tamamlandi) tutulur; '
  'tamamlananlar slot isgal etmez ve listede kalmaya devam eder.';

create or replace function public.set_command_center_hot_fixes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_command_center_hot_fixes_updated_at on public.command_center_hot_fixes;
create trigger set_command_center_hot_fixes_updated_at
before update on public.command_center_hot_fixes
for each row
execute function public.set_command_center_hot_fixes_updated_at();

-- 10 acik madde tavani. Uygulama tarafi da ayni kurali onceden kontrol eder; bu trigger
-- SQL/panel disi yazimlara karsi son savunma hattidir.
-- Not: iki es zamanli INSERT teorik olarak 11'e cikarabilir (sayim kilitsiz). Panel iki kisilik
-- oldugu icin bilincli olarak tablo kilidi alinmadi; yarisi kapatmak gerekirse buraya
-- "lock table ... in share row exclusive mode" eklenir.
create or replace function public.enforce_command_center_hot_fix_limit()
returns trigger
language plpgsql
as $$
declare
  v_open_count integer;
begin
  -- Yeni satir slot tuketmiyorsa (silinmis, arsivlenmis veya tamamlanmis) kontrol gereksiz.
  if new.deleted_at is not null
     or new.archived_at is not null
     or new.status = 'Tamamlandi' then
    return new;
  end if;

  -- Zaten acik olan bir satirin guncellenmesi slot sayisini degistirmez.
  if tg_op = 'UPDATE'
     and old.deleted_at is null
     and old.archived_at is null
     and old.status <> 'Tamamlandi' then
    return new;
  end if;

  select count(*)
  into v_open_count
  from public.command_center_hot_fixes
  where deleted_at is null
    and archived_at is null
    and status <> 'Tamamlandi'
    and id <> new.id;

  if v_open_count >= 10 then
    raise exception 'HOT_FIX_LIMIT: TOP 10 HOT FIX listesi dolu, en fazla 10 acik madde tutulabilir.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_command_center_hot_fix_limit on public.command_center_hot_fixes;
create trigger enforce_command_center_hot_fix_limit
before insert or update on public.command_center_hot_fixes
for each row
execute function public.enforce_command_center_hot_fix_limit();

create index if not exists idx_command_center_hot_fixes_active
  on public.command_center_hot_fixes (deleted_at, archived_at, status);
create index if not exists idx_command_center_hot_fixes_priority
  on public.command_center_hot_fixes (priority desc);

alter table public.command_center_hot_fixes enable row level security;

-- Yalniz oturum acmis kullanicilar. command_center_items'ta anon rolunun tam yazma yetkisi
-- oldugu olculdu (2026-08-06); bu tabloda ayni acik birakilmiyor.
revoke all on public.command_center_hot_fixes from anon;
grant select, insert, update, delete on public.command_center_hot_fixes to authenticated;

drop policy if exists "command_center_hot_fixes_select_authenticated" on public.command_center_hot_fixes;
create policy "command_center_hot_fixes_select_authenticated"
on public.command_center_hot_fixes
for select
to authenticated
using (true);

drop policy if exists "command_center_hot_fixes_write_authenticated" on public.command_center_hot_fixes;
create policy "command_center_hot_fixes_write_authenticated"
on public.command_center_hot_fixes
for all
to authenticated
using (true)
with check (true);

commit;

-- Rollback:
-- drop trigger if exists enforce_command_center_hot_fix_limit on public.command_center_hot_fixes;
-- drop trigger if exists set_command_center_hot_fixes_updated_at on public.command_center_hot_fixes;
-- drop function if exists public.enforce_command_center_hot_fix_limit();
-- drop function if exists public.set_command_center_hot_fixes_updated_at();
-- drop table if exists public.command_center_hot_fixes;
