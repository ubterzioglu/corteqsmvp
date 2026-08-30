-- Admin üye takibi ekranı için submissions okuma ve durum güncelleme erişimi.
-- Bucket private kalır; dosya erişimi mevcut admin storage policy + kısa ömürlü signed URL ile yapılır.

begin;

alter table public.submissions enable row level security;

drop policy if exists "submissions_admin_select" on public.submissions;
create policy "submissions_admin_select"
  on public.submissions
  for select
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "submissions_admin_update" on public.submissions;
create policy "submissions_admin_update"
  on public.submissions
  for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

grant select on table public.submissions to authenticated;
revoke update on table public.submissions from authenticated;
grant update (status, reviewed_at, reviewed_by) on table public.submissions to authenticated;

comment on policy "submissions_admin_select" on public.submissions is
  'Yalnız is_admin() doğrulamasından geçen kullanıcılar kayıt başvurularını okuyabilir.';
comment on policy "submissions_admin_update" on public.submissions is
  'Yalnız is_admin() doğrulamasından geçen kullanıcılar başvuru durumunu ve inceleme alanlarını güncelleyebilir.';

commit;

-- Rollback:
-- drop policy if exists "submissions_admin_select" on public.submissions;
-- drop policy if exists "submissions_admin_update" on public.submissions;
