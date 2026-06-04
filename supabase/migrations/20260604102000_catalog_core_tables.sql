begin;

create table if not exists public.catalog_item_types (
  key text primary key,
  label text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feature_definitions (
  key text primary key,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.item_type_features (
  item_type text not null references public.catalog_item_types(key) on delete cascade,
  feature_key text not null references public.feature_definitions(key) on delete cascade,
  is_enabled boolean not null default true,
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (item_type, feature_key)
);

create or replace function public.catalog_slugify(input_text text)
returns text
language sql
immutable
set search_path = public
as $$
  select trim(
    both '-'
    from regexp_replace(
      lower(
        translate(
          coalesce(input_text, ''),
          'ÇĞİIÖŞÜçğıiöşü',
          'CGIIOSUcgiiosu'
        )
      ),
      '[^a-z0-9]+',
      '-',
      'g'
    )
  );
$$;

create or replace function public.catalog_search_normalize(input_text text)
returns text
language sql
immutable
set search_path = public
as $$
  select trim(
    both ' '
    from lower(
      translate(
        coalesce(input_text, ''),
        'ÇĞİIÖŞÜçğıiöşü',
        'CGIIOSUcgiiosu'
      )
    )
  );
$$;

create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  item_type text not null references public.catalog_item_types(key) on delete restrict,
  slug text not null unique,
  title text not null,
  headline text,
  short_description text,
  long_description text,
  status text not null default 'draft',
  visibility text not null default 'public',
  verification_status text not null default 'unverified',
  created_by_user_id uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_items_status_check
    check (status in ('draft', 'pending_review', 'published', 'archived', 'rejected')),
  constraint catalog_items_visibility_check
    check (visibility in ('public', 'private', 'unlisted')),
  constraint catalog_items_verification_status_check
    check (verification_status in ('unverified', 'pending', 'verified', 'official_source', 'claimed'))
);

create table if not exists public.catalog_item_memberships (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, user_id, role),
  constraint catalog_item_memberships_role_check
    check (role in ('owner', 'manager', 'editor', 'contributor', 'viewer')),
  constraint catalog_item_memberships_status_check
    check (status in ('active', 'pending', 'revoked', 'suspended'))
);

create table if not exists public.catalog_claim_requests (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  requested_by_user_id uuid not null references public.profiles(id) on delete cascade,
  claim_type text not null default 'ownership',
  evidence jsonb not null default '{}'::jsonb,
  note text,
  status text not null default 'pending',
  reviewed_by_user_id uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_claim_requests_status_check
    check (status in ('pending', 'approved', 'rejected', 'cancelled'))
);

create table if not exists public.catalog_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.catalog_categories(id) on delete set null,
  module text not null references public.catalog_item_types(key) on delete cascade,
  slug text not null unique,
  name text not null,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_item_categories (
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  category_id uuid not null references public.catalog_categories(id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (item_id, category_id)
);

create table if not exists public.catalog_item_contacts (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  contact_type text not null,
  contact_value text not null,
  label text,
  is_public boolean not null default true,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_item_contacts_type_check
    check (contact_type in ('phone', 'email', 'website', 'whatsapp', 'telegram', 'instagram', 'linkedin', 'facebook', 'youtube', 'appointment_url'))
);

create table if not exists public.catalog_item_locations (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  country_code text,
  region text,
  city text,
  postal_code text,
  address_line text,
  latitude numeric,
  longitude numeric,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_item_links (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  link_type text not null,
  url text not null,
  label text,
  is_public boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_item_media (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  media_type text not null,
  url text,
  storage_bucket text,
  storage_path text,
  thumbnail_url text,
  alt_text text,
  caption text,
  is_public boolean not null default true,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_item_media_type_check
    check (media_type in ('image', 'video', 'document', 'logo', 'cover'))
);

create table if not exists public.catalog_item_languages (
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  language_code text not null,
  proficiency text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (item_id, language_code)
);

create table if not exists public.catalog_item_tags (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  tag_slug text not null,
  tag_label text not null,
  created_at timestamptz not null default now(),
  unique (item_id, tag_slug)
);

create table if not exists public.catalog_item_services (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  service_slug text not null,
  service_name text not null,
  description text,
  is_public boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, service_slug)
);

create table if not exists public.catalog_item_relations (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  related_item_id uuid not null references public.catalog_items(id) on delete cascade,
  relation_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, related_item_id, relation_type),
  constraint catalog_item_relations_no_self_check
    check (item_id <> related_item_id)
);

create table if not exists public.catalog_item_favorites (
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (item_id, user_id)
);

create table if not exists public.catalog_item_reviews (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  rating smallint not null,
  title text,
  body text,
  status text not null default 'pending',
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_item_reviews_rating_check
    check (rating between 1 and 5),
  constraint catalog_item_reviews_status_check
    check (status in ('pending', 'published', 'rejected'))
);

create table if not exists public.catalog_item_reports (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  reporter_user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_item_reports_status_check
    check (status in ('open', 'reviewing', 'resolved', 'dismissed'))
);

create table if not exists public.catalog_item_verification_records (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  verification_type text not null,
  verification_status text not null default 'pending',
  provider text,
  note text,
  evidence jsonb not null default '{}'::jsonb,
  verified_by_user_id uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_item_verification_records_status_check
    check (verification_status in ('pending', 'verified', 'rejected'))
);

create table if not exists public.catalog_audit_logs (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references public.catalog_items(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.source_records (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  source_type text not null,
  external_id text not null,
  source_url text,
  raw_snapshot jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now(),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_type, external_id)
);

create table if not exists public.duplicate_candidates (
  id uuid primary key default gen_random_uuid(),
  left_item_id uuid not null references public.catalog_items(id) on delete cascade,
  right_item_id uuid not null references public.catalog_items(id) on delete cascade,
  confidence numeric(5,2) not null default 0,
  reason text not null,
  status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  reviewed_by_user_id uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (left_item_id, right_item_id),
  constraint duplicate_candidates_no_self_check check (left_item_id <> right_item_id),
  constraint duplicate_candidates_status_check check (status in ('pending', 'approved', 'merged', 'dismissed'))
);

create table if not exists public.merge_history (
  id uuid primary key default gen_random_uuid(),
  source_item_id uuid not null references public.catalog_items(id) on delete cascade,
  target_item_id uuid not null references public.catalog_items(id) on delete cascade,
  merged_by_user_id uuid references public.profiles(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint merge_history_no_self_check check (source_item_id <> target_item_id)
);

create table if not exists public.moderation_queue (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references public.catalog_items(id) on delete cascade,
  source_record_id uuid references public.source_records(id) on delete cascade,
  queue_type text not null,
  reason text not null,
  status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references public.profiles(id) on delete set null,
  reviewed_by_user_id uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint moderation_queue_status_check check (status in ('pending', 'reviewing', 'resolved', 'dismissed'))
);

create table if not exists public.advisor_details (
  item_id uuid primary key references public.catalog_items(id) on delete cascade,
  consultation_modes text[] not null default '{}'::text[],
  languages text[] not null default '{}'::text[],
  supports_online_consultation boolean not null default false,
  appointment_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_details (
  item_id uuid primary key references public.catalog_items(id) on delete cascade,
  organization_kind text,
  legal_name text,
  founded_year integer,
  employee_count integer,
  primary_contact_name text,
  is_nonprofit boolean,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_details (
  item_id uuid primary key references public.catalog_items(id) on delete cascade,
  opening_hours jsonb not null default '{}'::jsonb,
  price_segment text,
  supports_delivery boolean not null default false,
  supports_online_booking boolean not null default false,
  appointment_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_details (
  item_id uuid primary key references public.catalog_items(id) on delete cascade,
  starts_at timestamptz,
  ends_at timestamptz,
  venue_name text,
  registration_url text,
  capacity integer,
  timezone text,
  is_online boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_listing_details (
  item_id uuid primary key references public.catalog_items(id) on delete cascade,
  listing_mode text,
  price numeric,
  currency text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_posting_details (
  item_id uuid primary key references public.catalog_items(id) on delete cascade,
  employment_type text,
  workplace_mode text,
  application_url text,
  application_email text,
  salary_min numeric,
  salary_max numeric,
  currency text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_group_details (
  item_id uuid primary key references public.catalog_items(id) on delete cascade,
  platform text,
  join_url text,
  member_count integer,
  requires_approval boolean not null default false,
  admin_approved boolean not null default false,
  language_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.person_profile_details (
  item_id uuid primary key references public.catalog_items(id) on delete cascade,
  linked_profile_id uuid references public.profiles(id) on delete set null,
  directory_opt_in boolean not null default false,
  interests text[] not null default '{}'::text[],
  public_bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_person_profile_details_linked_profile
  on public.person_profile_details(linked_profile_id)
  where linked_profile_id is not null;

create index if not exists idx_catalog_items_item_type on public.catalog_items(item_type);
create index if not exists idx_catalog_items_status on public.catalog_items(status);
create index if not exists idx_catalog_items_visibility on public.catalog_items(visibility);
create index if not exists idx_catalog_items_verification_status on public.catalog_items(verification_status);
create index if not exists idx_catalog_items_created_by on public.catalog_items(created_by_user_id);
create index if not exists idx_catalog_items_published_at on public.catalog_items(published_at desc);
create index if not exists idx_catalog_memberships_user_status on public.catalog_item_memberships(user_id, status);
create index if not exists idx_catalog_memberships_item_status on public.catalog_item_memberships(item_id, status);
create index if not exists idx_catalog_claim_requests_item_status on public.catalog_claim_requests(item_id, status);
create index if not exists idx_catalog_claim_requests_requested_by on public.catalog_claim_requests(requested_by_user_id, status);
create index if not exists idx_catalog_categories_module_sort on public.catalog_categories(module, sort_order);
create index if not exists idx_catalog_categories_parent on public.catalog_categories(parent_id);
create index if not exists idx_catalog_item_categories_category on public.catalog_item_categories(category_id, item_id);
create unique index if not exists idx_catalog_item_categories_primary
  on public.catalog_item_categories(item_id)
  where is_primary = true;
create index if not exists idx_catalog_item_contacts_item_public on public.catalog_item_contacts(item_id, is_public);
create unique index if not exists idx_catalog_item_contacts_primary
  on public.catalog_item_contacts(item_id)
  where is_primary = true;
create index if not exists idx_catalog_item_locations_item_primary on public.catalog_item_locations(item_id, is_primary);
create unique index if not exists idx_catalog_item_locations_primary
  on public.catalog_item_locations(item_id)
  where is_primary = true;
create index if not exists idx_catalog_item_links_item_public on public.catalog_item_links(item_id, is_public);
create index if not exists idx_catalog_item_media_item_public on public.catalog_item_media(item_id, is_public);
create unique index if not exists idx_catalog_item_media_primary
  on public.catalog_item_media(item_id)
  where is_primary = true;
create unique index if not exists idx_catalog_item_languages_primary
  on public.catalog_item_languages(item_id)
  where is_primary = true;
create index if not exists idx_catalog_item_services_item_public on public.catalog_item_services(item_id, is_public);
create index if not exists idx_catalog_item_relations_item_type on public.catalog_item_relations(item_id, relation_type);
create index if not exists idx_catalog_item_reviews_item_status on public.catalog_item_reviews(item_id, status);
create index if not exists idx_catalog_item_reports_item_status on public.catalog_item_reports(item_id, status);
create index if not exists idx_catalog_verification_item_status on public.catalog_item_verification_records(item_id, verification_status);
create index if not exists idx_catalog_audit_logs_item_created on public.catalog_audit_logs(item_id, created_at desc);
create index if not exists idx_source_records_item on public.source_records(item_id);
create index if not exists idx_duplicate_candidates_status on public.duplicate_candidates(status, confidence desc);
create index if not exists idx_merge_history_target on public.merge_history(target_item_id, created_at desc);
create index if not exists idx_moderation_queue_status on public.moderation_queue(status, queue_type, created_at desc);
create index if not exists idx_job_posting_details_expires_at on public.job_posting_details(expires_at);
create index if not exists idx_marketplace_listing_details_expires_at on public.marketplace_listing_details(expires_at);
create index if not exists idx_event_details_starts_at on public.event_details(starts_at);
create index if not exists idx_person_profile_details_directory_opt_in on public.person_profile_details(directory_opt_in);

do $$
declare
  v_table_name text;
begin
  foreach v_table_name in array[
    'catalog_item_types',
    'feature_definitions',
    'item_type_features',
    'catalog_items',
    'catalog_item_memberships',
    'catalog_claim_requests',
    'catalog_categories',
    'catalog_item_contacts',
    'catalog_item_locations',
    'catalog_item_links',
    'catalog_item_media',
    'catalog_item_services',
    'catalog_item_reviews',
    'catalog_item_reports',
    'catalog_item_verification_records',
    'source_records',
    'duplicate_candidates',
    'moderation_queue',
    'advisor_details',
    'organization_details',
    'business_details',
    'event_details',
    'marketplace_listing_details',
    'job_posting_details',
    'community_group_details',
    'person_profile_details'
  ]
  loop
    execute format('drop trigger if exists trg_%1$s_updated_at on public.%1$s', v_table_name);
    execute format(
      'create trigger trg_%1$s_updated_at before update on public.%1$s for each row execute function public.update_updated_at_column()',
      v_table_name
    );
  end loop;
end
$$;

comment on table public.catalog_items is
  'Universal searchable catalog record. Type-specific fields live in extension tables keyed by catalog_items.id.';

comment on table public.catalog_item_memberships is
  'Record-level authorization table for owners, managers and collaborators.';

comment on table public.source_records is
  'Maps external or legacy sources to canonical catalog_items without destructive auto-merges.';

commit;
