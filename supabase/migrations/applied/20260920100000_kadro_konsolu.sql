-- Kadro Konsolu — /admin/kadro sayfalarının veri kaynağı.
-- Karma model: 52 rolün TANIMI kodda (src/lib/kadro/roles/*.ts), değişebilen
-- DURUM burada. Rol tanımı tablosu YOKTUR ve bilinçli olarak yoktur;
-- bkz. docs/superpowers/specs/2026-09-20-kadro-konsolu-design.md §2.
--
-- role_key kodda yaşar, burada FK'sı yoktur. Kodda bir id değişirse DB satırı
-- yetim kalır ve hiçbir yerde hata vermez — pano yetim sayacı gösterir,
-- src/lib/kadro/roles/index.test.ts id'leri kilitler.
--
-- Görünürlük: yalnız admin okur/yazar. Desen: 20260730190000_workshop_items.sql.

-- 1) Rol durumu --------------------------------------------------------------
create table if not exists public.kadro_role_states (
  role_key   text primary key check (length(trim(role_key)) > 0),
  status     text check (status in
               ('dolu','destek','gorusme','aday','teklif','acik','beklemede')),
  priority   text check (priority in ('kritik','yuksek','orta','dusuk')),
  owner_name text,
  note       text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

-- 2) Değişiklik geçmişi (append-only) ----------------------------------------
create table if not exists public.kadro_role_events (
  id         uuid primary key default gen_random_uuid(),
  role_key   text not null,
  field      text not null check (field in ('status','priority','owner_name','note')),
  old_value  text,
  new_value  text,
  changed_by uuid references auth.users (id) on delete set null,
  changed_at timestamptz not null default now()
);

create index if not exists kadro_role_events_role_idx
  on public.kadro_role_events (role_key, changed_at desc);

-- 3) Aday hunisi -------------------------------------------------------------
create table if not exists public.kadro_candidates (
  id         uuid primary key default gen_random_uuid(),
  role_key   text not null,
  full_name  text not null check (length(trim(full_name)) > 0),
  links      text not null default '',
  stage      text not null default 'aday'
               check (stage in ('aday','gorusme','teklif','kapandi')),
  note       text not null default '',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kadro_candidates_role_idx
  on public.kadro_candidates (role_key, stage);

-- 4) updated_at trigger'ları -------------------------------------------------
create or replace function public.set_kadro_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_kadro_role_states_updated_at on public.kadro_role_states;
create trigger set_kadro_role_states_updated_at
before update on public.kadro_role_states
for each row execute function public.set_kadro_updated_at();

drop trigger if exists set_kadro_candidates_updated_at on public.kadro_candidates;
create trigger set_kadro_candidates_updated_at
before update on public.kadro_candidates
for each row execute function public.set_kadro_updated_at();

-- 5) Geçmiş trigger'ı --------------------------------------------------------
-- Uygulama katmanı DEĞİL, trigger yazar. Gerekçe: trigger atlanamaz — psql'den
-- ya da başka bir yoldan yapılan güncelleme de kayda düşer. API'ye bırakılan
-- geçmiş ilk unutulan çağrıda sessizce eksilir ve bunun testi yoktur.
create or replace function public.log_kadro_role_state_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    if new.status is not null then
      insert into public.kadro_role_events (role_key, field, old_value, new_value, changed_by)
      values (new.role_key, 'status', null, new.status, actor);
    end if;
    if new.priority is not null then
      insert into public.kadro_role_events (role_key, field, old_value, new_value, changed_by)
      values (new.role_key, 'priority', null, new.priority, actor);
    end if;
    if coalesce(new.owner_name, '') <> '' then
      insert into public.kadro_role_events (role_key, field, old_value, new_value, changed_by)
      values (new.role_key, 'owner_name', null, new.owner_name, actor);
    end if;
    if coalesce(new.note, '') <> '' then
      insert into public.kadro_role_events (role_key, field, old_value, new_value, changed_by)
      values (new.role_key, 'note', null, new.note, actor);
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.kadro_role_events (role_key, field, old_value, new_value, changed_by)
    values (new.role_key, 'status', old.status, new.status, actor);
  end if;
  if new.priority is distinct from old.priority then
    insert into public.kadro_role_events (role_key, field, old_value, new_value, changed_by)
    values (new.role_key, 'priority', old.priority, new.priority, actor);
  end if;
  if new.owner_name is distinct from old.owner_name then
    insert into public.kadro_role_events (role_key, field, old_value, new_value, changed_by)
    values (new.role_key, 'owner_name', old.owner_name, new.owner_name, actor);
  end if;
  if new.note is distinct from old.note then
    insert into public.kadro_role_events (role_key, field, old_value, new_value, changed_by)
    values (new.role_key, 'note', old.note, new.note, actor);
  end if;
  return new;
end;
$$;

drop trigger if exists log_kadro_role_state_change on public.kadro_role_states;
create trigger log_kadro_role_state_change
after insert or update on public.kadro_role_states
for each row execute function public.log_kadro_role_state_change();

-- 6) RLS — yalnız admin ------------------------------------------------------
alter table public.kadro_role_states enable row level security;
alter table public.kadro_role_events enable row level security;
alter table public.kadro_candidates  enable row level security;

drop policy if exists kadro_role_states_admin_select on public.kadro_role_states;
create policy kadro_role_states_admin_select on public.kadro_role_states
  for select using (public.is_admin(auth.uid()));

drop policy if exists kadro_role_states_admin_insert on public.kadro_role_states;
create policy kadro_role_states_admin_insert on public.kadro_role_states
  for insert with check (public.is_admin(auth.uid()));

drop policy if exists kadro_role_states_admin_update on public.kadro_role_states;
create policy kadro_role_states_admin_update on public.kadro_role_states
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists kadro_role_states_admin_delete on public.kadro_role_states;
create policy kadro_role_states_admin_delete on public.kadro_role_states
  for delete using (public.is_admin(auth.uid()));

-- Geçmiş yalnız OKUNUR. Yazımı trigger (security definer) yapar; kullanıcıya
-- insert/update/delete verilmez — geçmiş silinemez olmalıdır.
drop policy if exists kadro_role_events_admin_select on public.kadro_role_events;
create policy kadro_role_events_admin_select on public.kadro_role_events
  for select using (public.is_admin(auth.uid()));

drop policy if exists kadro_candidates_admin_select on public.kadro_candidates;
create policy kadro_candidates_admin_select on public.kadro_candidates
  for select using (public.is_admin(auth.uid()));

drop policy if exists kadro_candidates_admin_insert on public.kadro_candidates;
create policy kadro_candidates_admin_insert on public.kadro_candidates
  for insert with check (public.is_admin(auth.uid()));

drop policy if exists kadro_candidates_admin_update on public.kadro_candidates;
create policy kadro_candidates_admin_update on public.kadro_candidates
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists kadro_candidates_admin_delete on public.kadro_candidates;
create policy kadro_candidates_admin_delete on public.kadro_candidates
  for delete using (public.is_admin(auth.uid()));

comment on table public.kadro_role_states is
  'Kadro Konsolu rol durumu. Rol TANIMI kodda (src/lib/kadro/roles/); burada yalnız değişen durum tutulur.';
comment on table public.kadro_role_events is
  'Kadro rol durumu değişiklik geçmişi. Append-only; trigger yazar, kullanıcı yazamaz.';
