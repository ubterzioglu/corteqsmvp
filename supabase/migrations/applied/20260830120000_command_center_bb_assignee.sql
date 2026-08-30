-- Komuta Merkezi ortak sorumluluk seçeneği: B+B (Barış + Burak).

begin;

do $$
declare
  v_constraint record;
begin
  for v_constraint in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.command_center_items'::regclass
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%assignee%'
  loop
    execute format(
      'alter table public.command_center_items drop constraint %I',
      v_constraint.conname
    );
  end loop;
end
$$;

alter table public.command_center_items
  add constraint command_center_items_assignee_check
  check (assignee = any (array['Atanmadi'::text, 'UBT'::text, 'Burak'::text, 'B+B'::text]));

commit;

-- Rollback:
-- alter table public.command_center_items drop constraint if exists command_center_items_assignee_check;
-- alter table public.command_center_items add constraint command_center_items_assignee_check
--   check (assignee = any (array['Atanmadi'::text, 'UBT'::text, 'Burak'::text]));
