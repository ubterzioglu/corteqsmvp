-- Contributor Admin ilk kullanılabilir batch'i production'da doğrulandıktan sonra çalıştırılır.
-- Epic tamamen bitmedi: contributor self-service gönderimi sonraki bağımsız batch'tir.

begin;

do $$
declare
  v_id constant uuid := '660fb53d-3c19-4f65-b8a3-1bc516b63721'::uuid;
  v_expected integer;
begin
  select count(*) into v_expected
  from public.command_center_items
  where id = v_id
    and title = 'CONTRIBUTOR ADMIN'
    and deleted_at is null
    and archived_at is null;

  if v_expected <> 1 then
    raise exception 'contributor_admin_guard_failed: expected 1 exact item, found %', v_expected;
  end if;

  update public.command_center_items
  set status = 'Devam ediyor',
      updated_at = now()
  where id = v_id
    and deleted_at is null
    and archived_at is null
    and status <> 'Tamamlandi';
end;
$$;

commit;

select id, status, title
from public.command_center_items
where id = '660fb53d-3c19-4f65-b8a3-1bc516b63721'::uuid;
