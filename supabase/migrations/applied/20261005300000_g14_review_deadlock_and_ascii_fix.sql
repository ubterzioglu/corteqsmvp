-- G14 inceleme düzeltmeleri (code-review turu bulguları)
--
-- 1. Orta · deadlock: review_group_report_v1 upheld yolunda yalnız tıklanan
--    şikayeti FOR UPDATE ile kilitleyip grubun TÜM açık şikayetlerini güncelliyordu.
--    İki moderatör aynı grubun farklı şikayetlerini aynı anda onaylarsa deadlock.
--    Düzeltme: submit_group_report_v1 gibi önce whatsapp_landings satırını kilitle
--    (grup bazlı serileştirme).
--
-- 2. Orta · ASCII: coalesce(v_note, 'Onaylanan şikayet') Türkçe 'ş' taşıyordu;
--    migration'ın diğer notları ASCII. 'Onaylanan sikayet' yapıldı.
--
-- Uygulanan migration (20261005200000) CANLIDA — düzenlenmez, bu yeni migration
-- fonksiyonu CREATE OR REPLACE ile yeniden tanımlar.

begin;

-- ── 1) review_group_report_v1 — deadlock düzeltmesi + ASCII ──

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

  -- Raporu oku (kilitsiz) — landing_id'yi bulmak için.
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

  -- Grup satırı KİLİTLENİR: aynı grubun şikayetlerini aynı anda onaylayan
  -- iki moderatör sıraya girer (deadlock kapalı). submit_group_report_v1 deseni.
  v_landing_id := v_report.landing_id;
  perform 1 from public.whatsapp_landings where id = v_landing_id for update;

  -- Kilidi aldıktan sonra raputu yeniden kilitle (durum değişmiş olabilir).
  select id, landing_id, reason, status
    into v_report
  from public.group_reports
  where id = p_report_id
  for update;
  if v_report.status <> 'open' then
    raise exception 'group_report_already_reviewed';
  end if;

  if p_decision = 'upheld' then
    -- TEK karar = TEK ihlal: grubun tüm AÇIK şikayetleri aynı kararla kapanır.
    update public.group_reports
       set status = 'upheld', reviewed_by = v_uid, reviewed_at = now(), review_note = v_note
     where landing_id = v_report.landing_id and status = 'open';
    get diagnostics v_closed = row_count;

    -- G15 uyarı merdiveni (tek ihlal kapısı; is_admin kendi içinde yeniden denetler).
    v_strike := public.admin_record_group_strike(
      v_report.landing_id,
      coalesce(v_note, 'Onaylanan sikayet'),
      public.group_report_redline_number(v_report.reason),
      'G14 sikayet ' || v_report.id::text);
  else
    update public.group_reports
       set status = 'rejected', reviewed_by = v_uid, reviewed_at = now(), review_note = v_note
     where id = v_report.id;
    v_closed := 1;

    -- Politika: "şikayet reddedilirse grup yayına döner" — yalnız başka AÇIK
    -- şikayet kalmadıysa ve gizleme sebebi şikayetse.
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
  end if;

  select listing_status into v_listing from public.whatsapp_landings where id = v_report.landing_id;

  return jsonb_build_object(
    'report_id', v_report.id,
    'decision', p_decision,
    'closed_reports', v_closed,
    'strike', v_strike,
    'group_republished', v_republished,
    'listing_status', v_listing);
end;
$$;

comment on function public.review_group_report_v1(uuid, text, text) is
  'Şikayet kararı (G14, is_admin tek kapı). upheld → grubun açık şikayetleri kapanır + '
  'admin_record_group_strike (sebep → kırmızı çizgi 1..7, diger → NULL). rejected → '
  'başka açık şikayet yoksa ve hidden_reason=reports ise grup published (G12 kapısı). '
  'Deadlock düzeltmesi: whatsapp_landings satırı önce kilitlenir (grup bazlı serileştirme).';

-- ── 2) QA dosyasındaki ASCII iddiası güncellenecek (migration dışı) ──
-- supabase/qa/group-motor-acceptance.sql satır 566:
--   'Onaylanan şikayet' → 'Onaylanan sikayet'

commit;
