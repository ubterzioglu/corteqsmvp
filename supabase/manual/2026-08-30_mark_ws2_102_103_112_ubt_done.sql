-- Sprint C6/C7 teknik kabulünden SONRA çalıştırılır.
-- Yalnız UBT teknik onayını işaretler; Burak onayı/hukuk açılışı yapılmış sayılmaz.

do $$
declare
  v_expected integer;
begin
  select count(*) into v_expected
  from public.workshop_items
  where workshop_key = 'cadde'
    and session_key = 'WS2'
    and deleted_at is null
    and (
      (item_no = 102 and title = 'Kullanıcıların konum bilgisi olmadan araç raporu göndermesi engellenecek.')
      or (item_no = 103 and title = 'Araç kullanım raporlarında kullanıcının ülke veya konum bilgisi ayrı bir kolonda gösterilecek.')
      or (item_no = 112 and title = 'Kullanıcı bir aracı tamamlamadan çıkarsa daha sonra işlemi tamamlaması için e-posta gönderilecek.')
    );

  if v_expected <> 3 then
    raise exception 'ws2_guard_failed: expected 3 exact items, found %', v_expected;
  end if;

  update public.workshop_items
    set ubt_done = true,
        ubt_done_at = coalesce(ubt_done_at, now())
  where workshop_key = 'cadde'
    and session_key = 'WS2'
    and item_no in (102, 103, 112)
    and deleted_at is null;

  if (
    select count(*) from public.workshop_items
    where workshop_key = 'cadde' and session_key = 'WS2'
      and item_no in (102, 103, 112) and ubt_done
  ) <> 3 then
    raise exception 'ws2_update_failed';
  end if;
end;
$$;
