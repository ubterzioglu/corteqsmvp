-- Yalnız 30 Ağustos sprintinde dosya/canlı kanıtı tamamlanan kayıtları kapatır.
-- İnsan onayı, dış paylaşım veya iki kullanıcılı kabul isteyen maddelere dokunmaz.

begin;

do $$
declare
  v_id constant uuid := 'c0dc7a45-87a8-4b32-b829-ebb23ae1741b'::uuid;
  v_expected integer;
begin
  select count(*) into v_expected
  from public.command_center_items
  where id = v_id
    and title = 'Bir veya amacına göre bir kaç qr üretip dashboarda koyalım referral gibi, postlarda kullanırız.'
    and deleted_at is null
    and archived_at is null;

  if v_expected <> 1 then
    raise exception 'referral_qr_guard_failed: expected 1 exact item, found %', v_expected;
  end if;

  update public.command_center_items
  set status = 'Tamamlandi'
  where id = v_id
    and deleted_at is null
    and archived_at is null;
end;
$$;

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
      (item_no = 106 and title = 'Kare görselden kısa tanıtım videosu üretmek için kullanılacak prompt hazırlanacak.')
      or (item_no = 107 and title = 'Her özellik için kullanılabilecek LinkedIn paylaşım metinleri hazırlanacak.')
      or (item_no = 113 and title = 'Kafe özelliğinin nasıl tanıtılacağını açıklayan ayrı bir pazarlama brief''i hazırlanacak.')
      or (item_no = 115 and title = 'Kafe özelliğinin hızlı ve kontrollü bir topluluk oluşturma aracı olduğu vurgulanacak.')
      or (item_no = 135 and title = 'Cadde''de Caddenin logosunu kullansak.')
    );

  if v_expected <> 5 then
    raise exception 'workshop_output_guard_failed: expected 5 exact items, found %', v_expected;
  end if;

  update public.workshop_items
  set ubt_done = true,
      ubt_done_at = coalesce(ubt_done_at, now())
  where workshop_key = 'cadde'
    and session_key = 'WS2'
    and item_no in (106, 107, 113, 115, 135)
    and deleted_at is null;

  if (
    select count(*)
    from public.workshop_items
    where workshop_key = 'cadde'
      and session_key = 'WS2'
      and item_no in (106, 107, 113, 115, 135)
      and deleted_at is null
      and ubt_done
  ) <> 5 then
    raise exception 'workshop_output_update_failed';
  end if;
end;
$$;

commit;

select id, status, title
from public.command_center_items
where id = 'c0dc7a45-87a8-4b32-b829-ebb23ae1741b'::uuid;

select item_no, ubt_done, burak_done, title
from public.workshop_items
where workshop_key = 'cadde'
  and session_key = 'WS2'
  and item_no in (106, 107, 113, 115, 135)
order by item_no;
