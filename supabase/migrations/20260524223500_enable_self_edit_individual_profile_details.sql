begin;

alter table public.individual_profile_details enable row level security;

drop policy if exists "individual_profile_details_self_insert" on public.individual_profile_details;
create policy "individual_profile_details_self_insert"
on public.individual_profile_details
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "individual_profile_details_self_update" on public.individual_profile_details;
create policy "individual_profile_details_self_update"
on public.individual_profile_details
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant insert, update on public.individual_profile_details to authenticated;

commit;
