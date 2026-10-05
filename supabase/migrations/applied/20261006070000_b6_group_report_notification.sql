-- B6 · Grup şikayet kararı bildirimi (uygulama içi bildirim)
--
-- Karar: 5 Ekim 2026 — kullanıcı onayı alındı.
-- Şikayet onay/red edildiğinde grup sahibine UYGULAMA İÇİ BİLDİRİM gider.
-- Mail GİTMEZ (kullanıcı isteği üzerine değiştirildi).
--
-- Değişiklikler:
-- 1. review_group_report_v1 fonksiyonunu güncelle (notifications tablosuna insert)
--
-- NOT: B6'nın diğer 5 kararı zaten migration'da uygulanmış:
--   - Kendi grubuna şikayet reddedilir (submit_group_report_v1)
--   - Tek onay = tek ihlal (review_group_report_v1 upheld)
--   - Onay sonrası grup gizli kalır (admin görünür yapabilir)
--   - Sebep listesi doğru (7 kırmızı çizgi + diger)
--   - "Şikayet almamış üye" = gruba karşı şikayet

begin;

-- review_group_report_v1 fonksiyonunu güncelle (notifications insert ekle)
create or replace function public.review_group_report_v1(
  p_report_id uuid,
  p_decision text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_report record;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_closed integer := 0;
  v_strike jsonb;
  v_republished boolean := false;
  v_listing text;
  v_hidden_reason text;
  v_landing_id uuid;
  v_owner_user_id uuid;
  v_group_name text;
begin
  if not public.is_admin(v_uid) then
    raise exception 'group_report_review_forbidden';
  end if;
  if p_decision is null or p_decision not in ('upheld', 'rejected') then
    raise exception 'group_report_invalid_decision';
  end if;
  if v_note is not null and char_length(v_note) > 1000 then
    raise exception 'group_report_note_too_long';
  end if;

  -- Raporu oku (kilitsiz)
  select id, landing_id, reason, status
    into v_report
  from public.group_reports
  where id = p_report_id;
  if not found then
    raise exception 'group_report_not_found';
  end if;
  if v_report.status <> 'open' then
    raise exception 'group_report_already_reviewed';
  end if;

  -- Grup satırı KİLİTLENİR (deadlock kapısı)
  v_landing_id := v_report.landing_id;
  perform 1 from public.whatsapp_landings where id = v_landing_id for update;

  -- Raporu yeniden kilitle
  select id, landing_id, reason, status
    into v_report
  from public.group_reports
  where id = p_report_id
  for update;
  if v_report.status <> 'open' then
    raise exception 'group_report_already_reviewed';
  end if;

  -- Grup sahibinin user_id'sini ve grup adını al (bildirim için)
  select wl.group_name, wl.owner_user_id
    into v_group_name, v_owner_user_id
  from public.whatsapp_landings wl
  where wl.id = v_landing_id;

  if p_decision = 'upheld' then
    -- TEK karar = TEK ihlal: grubun tüm AÇIK şikayetleri aynı kararla kapanır.
    update public.group_reports
       set status = 'upheld', reviewed_by = v_uid, reviewed_at = now(), review_note = v_note
     where landing_id = v_report.landing_id and status = 'open';
    get diagnostics v_closed = row_count;

    -- G15 uyarı merdiveni
    v_strike := public.admin_record_group_strike(
      v_report.landing_id,
      coalesce(v_note, 'Onaylanan sikayet'),
      public.group_report_redline_number(v_report.reason),
      'G14 sikayet ' || v_report.id::text);

    -- B6: Grup sahibine bildirim gönder (upheld)
    if v_owner_user_id is not null then
      insert into public.notifications (
        user_id, type, title, message, related_id, entity_type
      ) values (
        v_owner_user_id,
        'group_report_upheld',
        'Grup şikayet kararı: ' || coalesce(v_group_name, 'Grubunuz'),
        'Şikayet onaylandı ve grubunuz dizinden gizlendi. Yönetici panelinden tekrar görünür yapabilirsiniz.',
        v_report.landing_id,
        'whatsapp_landing'
      );
    end if;
  else
    update public.group_reports
       set status = 'rejected', reviewed_by = v_uid, reviewed_at = now(), review_note = v_note
     where id = v_report.id;
    v_closed := 1;

    -- Politika: şikayet reddedilirse grup yayına döner (başka açık şikayet yoksa)
    select listing_status, hidden_reason into v_listing, v_hidden_reason
    from public.whatsapp_landings where id = v_report.landing_id;
    if v_listing = 'hidden' and v_hidden_reason = 'reports'
       and not exists (
         select 1 from public.group_reports
         where landing_id = v_report.landing_id and status = 'open') then
      perform public.set_group_status_v1(
        v_report.landing_id, 'published', 'reports_rejected',
        coalesce(v_note, 'Sikayetler reddedildi (G14)'));
      v_republished := true;
    end if;

    -- B6: Grup sahibine bildirim gönder (rejected)
    if v_owner_user_id is not null then
      insert into public.notifications (
        user_id, type, title, message, related_id, entity_type
      ) values (
        v_owner_user_id,
        'group_report_rejected',
        'Grup şikayet kararı: ' || coalesce(v_group_name, 'Grubunuz'),
        case
          when v_republished then 'Şikayet reddedildi ve grubunuz otomatik olarak yeniden yayına alındı.'
          else 'Şikayet reddedildi. Grubunuz yayında kalmaya devam ediyor.'
        end,
        v_report.landing_id,
        'whatsapp_landing'
      );
    end if;
  end if;

  select listing_status into v_listing from public.whatsapp_landings where id = v_report.landing_id;

  return jsonb_build_object(
    'report_id', v_report.id,
    'decision', p_decision,
    'closed_reports', v_closed,
    'strike', v_strike,
    'group_republished', v_republished,
    'listing_status', v_listing,
    'owner_notified', v_owner_user_id is not null);
end;
$$;

comment on function public.review_group_report_v1(uuid, text, text) is
  'B6: Şikayet kararı (G14, is_admin tek kapı). upheld → grubun açık şikayetleri kapanır + '
  'admin_record_group_strike + grup sahibine bildirim. rejected → başka açık şikayet yoksa ve '
  'hidden_reason=reports ise grup published + grup sahibine bildirim. '
  'Deadlock düzeltmesi: whatsapp_landings satırı önce kilitlenir (grup bazlı serileştirme).';

commit;
