begin;

insert into public.catalog_categories (module, slug, name, description, is_active, sort_order)
values (
  'advisor',
  'advisor-healthcare',
  'Healthcare',
  'Doctor, dentist and healthcare advisor records',
  true,
  115
)
on conflict (module, slug) do update
set
  name = excluded.name,
  description = excluded.description,
  is_active = true,
  sort_order = excluded.sort_order,
  updated_at = now();

commit;
