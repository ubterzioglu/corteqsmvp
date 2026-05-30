drop policy if exists "Public may19 campaign submissions insert" on public.may19_campaign_submissions;

create policy "Public may19 campaign submissions insert"
  on public.may19_campaign_submissions
  for insert
  to anon, authenticated
  with check (true);
