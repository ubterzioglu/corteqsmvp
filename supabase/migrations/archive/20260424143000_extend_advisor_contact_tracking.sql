-- Extend advisor records with contact details and per-channel contacted state.

alter table public.advisor_social_media_links
  add column if not exists name text not null default 'İsimsiz',
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists whatsapp text,
  add column if not exists instagram text,
  add column if not exists contacted_whatsapp boolean not null default false,
  add column if not exists contacted_instagram boolean not null default false,
  add column if not exists contacted_email boolean not null default false,
  add column if not exists contacted_phone boolean not null default false;

create index if not exists advisor_social_media_links_name_idx
  on public.advisor_social_media_links (name);

update public.advisor_social_media_links
set instagram = link
where instagram is null
  and link is not null;
