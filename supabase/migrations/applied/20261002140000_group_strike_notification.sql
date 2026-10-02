-- G25 · DÜZELTME: uyarı bildirimi yanlış kancadaydı (QA #13 canlı ölçümde yakaladı)
--
-- 🔴 KUSUR: G23, `group_strike_warning` bildirimini `group_moderation_log`
-- satırlarına (reason strike_1/2/3) bağlamıştı. Ama G15 merdiveninin İLK
-- basamağı (warning) durum geçişi YAPMAZ → log satırı YAZILMAZ (G12: no-op
-- log yazmaz) → uyarı maili HİÇBİR ZAMAN gitmezdi. strike_2/3'te ise hem log
-- hem (bu düzeltmeden sonra) strikes tablosu tetiklenirse ÇİFT mail riski.
--
-- ÇÖZÜM: uyarı bildiriminin tek kancası `group_strikes` AFTER INSERT — her
-- ihlal kaydı (warning/suspended/removed) tam olarak bir satır üretir (G15
-- zaten oraya yazar). Log trigger'ından strike dalı KALDIRILIR (çift mail yok).
--
-- KARAR: tasarım §9 tek uyarı metni tanımlar ("…İkinci ihlalde grup 30 gün
-- askıya alınır"); {sebep} alanına outcome da işlenir ki 2./3. ihlalde cümle
-- yanlış anlaşılmasın ("— grup 30 gün askıya alındı" / "— listeden kaldırıldı").
-- Kırmızı çizgide "kırmızı çizgi N" öneki eklenir.
--
-- ═══ SALT EKLEME ═══
-- G23'ün log trigger fonksiyonu strike dalı OLMADAN yeniden tanımlanır
-- (published/rejected/link_dead dalları birebir korunur); yeni trigger eklenir.

begin;

-- ── 1) Log trigger'ı strike dalı olmadan (diğer dallar G23 ile birebir) ─────

create or replace function public.group_notify_moderation_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_landing record;
begin
  -- fast_lane log satırı (from_status NULL) INSERT trigger'ında zaten işlendi.
  if new.from_status is null then
    return new;
  end if;

  select w.group_name, w.slug, w.submitted_by, w.user_id, w.owner_user_id
    into v_landing
  from public.whatsapp_landings w
  where w.id = new.landing_id;
  if not found then
    return new;
  end if;

  if new.to_status = 'published' then
    perform public.enqueue_group_notification(
      'group_published', 'group_published:' || new.id::text || ':submitter',
      coalesce(v_landing.submitted_by, v_landing.user_id),
      jsonb_build_object('group_name', v_landing.group_name, 'slug', v_landing.slug));
    if v_landing.owner_user_id is not null
       and v_landing.owner_user_id is distinct from v_landing.submitted_by then
      perform public.enqueue_group_notification(
        'group_published', 'group_published:' || new.id::text || ':owner',
        v_landing.owner_user_id,
        jsonb_build_object('group_name', v_landing.group_name, 'slug', v_landing.slug));
    end if;
  elsif new.to_status = 'rejected' then
    perform public.enqueue_group_notification(
      'group_rejected', 'group_rejected:' || new.id::text,
      coalesce(v_landing.submitted_by, v_landing.user_id),
      jsonb_build_object(
        'group_name', v_landing.group_name, 'slug', v_landing.slug,
        'reason', coalesce(nullif(btrim(coalesce(new.note, '')), ''), new.reason, 'belirtilmedi')));
  elsif new.to_status = 'hidden' and new.reason = 'link_dead' then
    perform public.enqueue_group_notification(
      'group_link_dead', 'group_link_dead:' || new.id::text,
      coalesce(v_landing.owner_user_id, v_landing.submitted_by, v_landing.user_id),
      jsonb_build_object('group_name', v_landing.group_name, 'slug', v_landing.slug));
  end if;
  -- ⚠️ strike_1/2/3 dalı BURADA YOK (G25 düzeltmesi): uyarı bildirimi
  -- `group_strikes` trigger'ından gider — warning geçiş üretmediği için log
  -- satırı hiç yazılmıyordu (QA #13 ölçümü).

  return new;
end;
$$;

comment on function public.group_notify_moderation_log() is
  'G23+G25: published/rejected/link_dead bildirimleri. Strike dalı G25''te '
  'group_strikes trigger''ına TAŞINDI (warning geçiş üretmez → log satırı yok → '
  'eski kanca hiç çalışmıyordu; strike_2/3''te de çift mail riski vardı).';

-- ── 2) Uyarı bildirimi: group_strikes AFTER INSERT (tek kanca) ──────────────

create or replace function public.group_notify_strike()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_landing record;
  v_reason text;
begin
  select w.group_name, w.slug, w.submitted_by, w.user_id, w.owner_user_id
    into v_landing
  from public.whatsapp_landings w
  where w.id = new.landing_id;
  if not found then
    return new;
  end if;

  v_reason := coalesce(nullif(btrim(new.reason), ''), 'belirtilmedi');
  if new.redline_number is not null then
    v_reason := 'kırmızı çizgi ' || new.redline_number || ' — ' || v_reason;
  end if;
  v_reason := case new.outcome
    when 'suspended' then v_reason || ' — grup 30 gün askıya alındı'
    when 'removed' then v_reason || ' — grup listeden kaldırıldı'
    else v_reason
  end;

  perform public.enqueue_group_notification(
    'group_strike_warning',
    'group_strike_warning:' || new.id::text,
    coalesce(v_landing.owner_user_id, v_landing.submitted_by, v_landing.user_id),
    jsonb_build_object(
      'group_name', v_landing.group_name, 'slug', v_landing.slug,
      'reason', v_reason));

  return new;
end;
$$;

comment on function public.group_notify_strike() is
  'Uyarı bildiriminin TEK kancası (G25): her group_strikes satırı = 1 ihlal = '
  '1 mail (warning/suspended/removed outcome''u {sebep} içine işlenir). '
  'Alıcı: sahip, yoksa ekleyen (G23 kararı).';

drop trigger if exists trg_group_notify_strike on public.group_strikes;
create trigger trg_group_notify_strike
  after insert on public.group_strikes
  for each row execute function public.group_notify_strike();

commit;
