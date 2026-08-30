-- Cadde workshop — mevcut uygulama kanıtları doğrulanan maddeler (m70,m77,m91,m93,m100).
-- Yalnız UBT onayı güncellenir; burak_done alanına dokunulmaz.
-- Uygulama: psql "..." -v ON_ERROR_STOP=1 -f <bu-dosya>

do $$
declare
  v_hedef constant integer[] := array[70, 77, 91, 93, 100];
  v_bulunan integer;
  v_guncellenen integer;
begin
  select count(*) into v_bulunan
  from public.workshop_items
  where workshop_key = 'cadde'
    and deleted_at is null
    and item_no = any(v_hedef);

  if v_bulunan <> array_length(v_hedef, 1) then
    raise exception 'Beklenen % madde bulunamadi; bulunan %. Pano degismis olabilir.',
      array_length(v_hedef, 1), v_bulunan;
  end if;

  update public.workshop_items
  set ubt_done = true,
      ubt_done_at = now()
  where workshop_key = 'cadde'
    and deleted_at is null
    and item_no = any(v_hedef)
    and ubt_done = false;

  get diagnostics v_guncellenen = row_count;
  raise notice 'Mevcut kanit fazi: % UBT onayi eklendi.', v_guncellenen;
end
$$;

select item_no, session_key, ubt_done, burak_done
from public.workshop_items
where workshop_key = 'cadde'
  and deleted_at is null
  and item_no = any(array[70, 77, 91, 93, 100])
order by item_no;
