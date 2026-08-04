create extension if not exists pgcrypto;

create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed', 'archived')),
  is_featured boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  allow_anonymous boolean not null default true,
  allow_multiple_submissions boolean not null default false,
  created_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  published_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.survey_questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  type text not null check (type in ('short_text', 'long_text', 'single_choice', 'multiple_choice', 'rating', 'yes_no', 'email')),
  question text not null,
  description text,
  placeholder text,
  options jsonb not null default '[]'::jsonb,
  validation jsonb not null default '{}'::jsonb,
  is_required boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  respondent_user_id uuid references auth.users(id),
  respondent_name text,
  respondent_email text,
  contact_opt_in boolean not null default false,
  status text not null default 'submitted' check (status in ('submitted', 'reviewed', 'archived')),
  ip_hash text,
  user_agent text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.survey_answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.survey_responses(id) on delete cascade,
  question_id uuid not null references public.survey_questions(id) on delete cascade,
  answer_value jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_surveys_status on public.surveys(status);
create index if not exists idx_surveys_slug on public.surveys(slug);
create index if not exists idx_survey_questions_survey_id on public.survey_questions(survey_id);
create index if not exists idx_survey_questions_sort_order on public.survey_questions(sort_order);
create index if not exists idx_survey_responses_survey_id on public.survey_responses(survey_id);
create index if not exists idx_survey_answers_response_id on public.survey_answers(response_id);
create index if not exists idx_survey_answers_question_id on public.survey_answers(question_id);

create or replace function public.normalize_survey_slug()
returns trigger
language plpgsql
as $$
begin
  new.slug = lower(trim(new.slug));
  new.slug = regexp_replace(new.slug, '[^a-z0-9]+', '-', 'g');
  new.slug = regexp_replace(new.slug, '(^-|-$)', '', 'g');
  return new;
end;
$$;

drop trigger if exists set_survey_slug on public.surveys;
create trigger set_survey_slug
before insert or update on public.surveys
for each row execute function public.normalize_survey_slug();

drop trigger if exists set_surveys_updated_at on public.surveys;
create trigger set_surveys_updated_at
before update on public.surveys
for each row execute function public.set_updated_at();

drop trigger if exists set_survey_questions_updated_at on public.survey_questions;
create trigger set_survey_questions_updated_at
before update on public.survey_questions
for each row execute function public.set_updated_at();

alter table public.surveys enable row level security;
alter table public.survey_questions enable row level security;
alter table public.survey_responses enable row level security;
alter table public.survey_answers enable row level security;

drop policy if exists "Public can read published surveys" on public.surveys;
create policy "Public can read published surveys"
on public.surveys
for select
to anon, authenticated
using (
  status = 'published'
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);

drop policy if exists "Admins can read all surveys" on public.surveys;
create policy "Admins can read all surveys"
on public.surveys
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can insert surveys" on public.surveys;
create policy "Admins can insert surveys"
on public.surveys
for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can update surveys" on public.surveys;
create policy "Admins can update surveys"
on public.surveys
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete surveys" on public.surveys;
create policy "Admins can delete surveys"
on public.surveys
for delete
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Public can read questions for published surveys" on public.survey_questions;
create policy "Public can read questions for published surveys"
on public.survey_questions
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.surveys s
    where s.id = survey_questions.survey_id
      and s.status = 'published'
      and (s.starts_at is null or s.starts_at <= now())
      and (s.ends_at is null or s.ends_at >= now())
  )
);

drop policy if exists "Admins can manage survey questions" on public.survey_questions;
create policy "Admins can manage survey questions"
on public.survey_questions
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can read survey responses" on public.survey_responses;
create policy "Admins can read survey responses"
on public.survey_responses
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can update survey responses" on public.survey_responses;
create policy "Admins can update survey responses"
on public.survey_responses
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete survey responses" on public.survey_responses;
create policy "Admins can delete survey responses"
on public.survey_responses
for delete
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can read survey answers" on public.survey_answers;
create policy "Admins can read survey answers"
on public.survey_answers
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete survey answers" on public.survey_answers;
create policy "Admins can delete survey answers"
on public.survey_answers
for delete
to authenticated
using (public.is_admin(auth.uid()));
