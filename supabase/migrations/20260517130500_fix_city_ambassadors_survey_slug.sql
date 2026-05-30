-- Force-update City Ambassadors survey slug to a stable numeric value
-- New public URL: /anket/7392846150

do $$
declare
  target_id uuid;
begin
  -- Find survey by known old slugs first
  select id into target_id
  from public.surveys
  where slug in (
    'sehir-elcileri-toplanti-anketi-13052026',
    'anket-4829173506',
    'anket-20260513',
    'anket-20260517',
    'anket-20260517-2',
    'anket-sehir-elcileri-20260517'
  )
  order by created_at desc
  limit 1;

  -- Fallback by title match
  if target_id is null then
    select id into target_id
    from public.surveys
    where title ilike '%Şehir Elçileri Toplantı Anketi%'
    order by created_at desc
    limit 1;
  end if;

  if target_id is not null then
    update public.surveys
    set slug = '7392846150',
        updated_at = now()
    where id = target_id;
  end if;
end $$;
