-- B10 · Dizin kartında "Etkinliği Var" bilgisi (PII-free).
--
-- Kaynak: docs/plans/qwen-sirali/01-tek-plan-kalan-isler.md §2.6
--
-- Yeni RPC: public_member_next_event(p_user_id uuid)
-- Yalnız published + gelecek etkinlikleri döner (event_date >= current_date).
-- PII-free: user_id, e-posta, iletişim bilgisi DÖNMEZ.
-- Yalnız başlık, tarih, şehir, kapak URL'si.

begin;

create or replace function public.public_member_next_event(p_user_id uuid)
returns table (
  event_id uuid,
  title text,
  event_date date,
  city text,
  cover_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id as event_id,
    e.title,
    e.event_date,
    e.city,
    e.cover_image as cover_url
  from public.events e
  where e.user_id = p_user_id
    and e.status = 'published'
    and e.event_date >= current_date
  order by e.event_date asc
  limit 1;
$$;

revoke all on function public.public_member_next_event(uuid) from public;
grant execute on function public.public_member_next_event(uuid)
  to anon, authenticated, service_role;

comment on function public.public_member_next_event(uuid) is
  'B10: Dizin kartında gösterilecek gelecek etkinlik bilgisi (PII-free). '
  'Yalnız published + gelecek etkinlik. Başlık, tarih, şehir, kapak döner.';

commit;
