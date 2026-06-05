begin;

update public.catalog_categories
set
  name = 'Healthcare',
  description = 'Doctor, dentist and healthcare advisor records',
  is_active = true,
  sort_order = 115,
  updated_at = now()
where module = 'advisor'
  and slug = 'advisor-healthcare';

insert into public.catalog_categories (module, slug, name, description, is_active, sort_order)
select
  'advisor',
  'advisor-healthcare',
  'Healthcare',
  'Doctor, dentist and healthcare advisor records',
  true,
  115
where not exists (
  select 1
  from public.catalog_categories
  where module = 'advisor'
    and slug = 'advisor-healthcare'
);

commit;
