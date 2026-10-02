-- KR09b · Kariyer başvurusu bildirimi TÜM yöneticilere gider
--
-- ═══ NEDEN (kullanıcı isteği + canlı ölçüm 2026-10-02) ═══
-- `admin_get_notification_subscribers` alıcıları **`admin_notification_subscriptions`
-- tablosundan** çeker. Satırı olmayan kullanıcı hiç dönmez — yani bildirim
-- fiilen **opt-in**dir ve aboneliği olmayan bir yönetici sessizce mail almaz.
--
-- Ölçüm: sistemde bugün **2 yönetici** var ve ikisinin de abonelik satırı var,
-- yani kariyer maili bugün zaten ikisine gidiyor. Kusur gelecekte patlar:
-- yeni atanan bir yönetici satır açılana kadar hiçbir başvurudan haberdar olmaz
-- ve bunu fark ettiren bir hata da yoktur.
--
-- Bu migration YALNIZ `career_application` için davranışı **opt-out**'a çevirir:
--   • `is_admin(u.id)` olan herkes alıcıdır,
--   • abonelik satırı YOKSA da alır (`coalesce(..., true)`),
--   • yalnız açıkça `career_application_email = false` diyen çıkar.
--
-- ⚠️ Diğer olay tipleri DEĞİŞMEDİ — onlar abonelik tablosundan gelmeye devam
-- eder. Burada tek bir olay tipinin kuralı gevşetiliyor, genel bildirim
-- politikası değil.
--
-- ⚠️ Kapı `is_admin` (rol anahtarı `Admin_%` öneki), `is_moderator` değil.
-- Bugün iki küme AYNI (2/2 ölçüldü), yani hiçbir mevcut alıcı kaybolmuyor;
-- ileride yönetici olmayan bir moderatör eklenirse kariyer maili ona gitmez —
-- istek "tüm adminler" idi.

begin;

create or replace function public.admin_get_notification_subscribers(p_event_type text)
returns table(user_id uuid, email text)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if p_event_type not in (
    'new_member', 'admin_update', 'revision_request',
    'revision_request_completed', 'radar_scan_digest', 'career_application'
  ) then
    raise exception 'unknown_event_type' using errcode = '22023';
  end if;

  -- Kariyer başvurusu: TÜM yöneticiler, abonelik satırı olmasa bile.
  if p_event_type = 'career_application' then
    return query
    select u.id, u.email::text
    from auth.users u
    left join public.admin_notification_subscriptions s on s.user_id = u.id
    where u.email is not null
      and public.is_admin(u.id)
      and coalesce(s.career_application_email, true);
    return;
  end if;

  return query
  select s.user_id, au.email::text
  from public.admin_notification_subscriptions s
  join auth.users au on au.id = s.user_id
  where au.email is not null
    and public.is_moderator(s.user_id)
    and case p_event_type
      when 'new_member' then s.new_member_email
      when 'revision_request' then s.revision_request_email
      -- Tamamlanma, açılışla AYNI aboneliği paylaşır (ayrı sütun yok).
      when 'revision_request_completed' then s.revision_request_email
      when 'radar_scan_digest' then s.radar_scan_digest_email
      else s.admin_update_email
    end;
end;
$function$;

commit;
