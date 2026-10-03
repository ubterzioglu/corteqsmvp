-- M03 · Topluluk Motoru Faz 1: T1 KAPANIR — RLS status zorlaması + status trigger'ı
--
-- ═══ ÖLÇÜLEN AÇIK (plan T1, 30.09) ═══
--   "Users can create own events"  INSERT  WITH CHECK (auth.uid() = user_id)  -- status YOK
--   "Users can update own events"  UPDATE  USING (auth.uid() = user_id)       -- WITH CHECK YOK
--   → PostgREST'e doğrudan `status='published'` yazan onayı TAMAMEN atlıyordu.
--   `status:'pending'` yalnız istemcide (events-api.ts) — kural kodda değil.
--
-- ═══ ÇÖZÜM (plan Faz 1 madde 2 — iki katman) ═══
--   1. INSERT politikası `status='pending'` ZORUNLU kılar (doğrudan 'published'
--      insert RLS'te düşer). `create_event_v1` security definer (tablo sahibi)
--      → RLS'i bypass eder, RPC'nin auto-publish yolu ETKİLENMEZ.
--   2. UPDATE'te RLS eski satırı GÖREMEZ (USING yalnız görünürlük) — status
--      değişikliğini TRIGGER keser: `events_guard_status` (G12 guard v2/v3
--      deseni). Yayınlama yalnız admin (`is_admin`) veya service (edge/cron)
--      ya da `event_status.via_rpc` bayrağıyla (geleceğin onay RPC'leri — M08).
--
-- ═══ KARARLAR ═══
--   • `approval_source` da korunur: kullanıcı kendi kaydına 'auto' basıp
--     "onaylıymış" görüntüsü veremesin (yalnız admin/service/RPC yazar).
--   • Mevcut istemci akışı BOZULMAZ: form zaten `status:'pending'` insert
--     ediyor (events-api.ts:158 — ölçüldü); updateEvent ile status değiştiren
--     tek yer AdminEventsPage (is_admin → muaf).
--   • Bayrak GUC'si AYRI isim alanı: `event_status.via_rpc` (grup motorunun
--     `group_status.via_rpc`'siyle karışmasın — iki motorun kapıları ayrı).
--   • Trigger BEFORE UPDATE FOR EACH ROW; içerik alanları (title, description…)
--     SERBEST — guard yalnız status + approval_source değişimine bakar.
--
-- ═══ SALT EKLEME ═══
-- Politika YENİDEN yaratılır (drop+create aynı transaction'da — dışarıdan
-- atomik); kolon/tablo/fonksiyon düşürmez.

begin;

-- ── 1) INSERT politikası: status='pending' zorunlu ──────────────────────────

drop policy if exists "Users can create own events" on public.events;
create policy "Users can create own events" on public.events
  for insert to authenticated
  with check (auth.uid() = user_id and status = 'pending');

comment on policy "Users can create own events" on public.events is
  'M03 (T1 kapanışı): doğrudan insert YALNIZ pending açabilir — published '
  'oluşturmanın yolu create_event_v1 (auto) veya admin onayıdır. RPC security '
  'definer olduğundan bu politika onu kesmez.';

-- ── 2) UPDATE guard: status + approval_source ───────────────────────────────

create or replace function public.events_guard_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- RPC yolu: transaction-local bayrak (M08 onay RPC'leri açar)
  if coalesce(current_setting('event_status.via_rpc', true), '') = 'on' then
    return new;
  end if;

  if new.status is distinct from old.status
     or new.approval_source is distinct from old.approval_source then
    -- Yayınlama/ret ve kaynak damgası: yalnız admin veya service (edge/cron).
    if coalesce(public.is_admin(auth.uid()), false)
       or auth.role() = 'service_role' then
      return new;
    end if;
    raise exception 'event_status_direct_update_forbidden';
  end if;

  -- İçerik alanları (title, description, tarih, konum…) serbest — sahibi
  -- kendi etkinliğini düzenleyebilir (RLS USING zaten sahiple sınırlıyor).
  return new;
end;
$$;

comment on function public.events_guard_status() is
  'T1 kapanışı (M03): events.status ve approval_source doğrudan UPDATE ile '
  'değiştirilemez — yalnız is_admin / service_role / event_status.via_rpc '
  'bayrağı. RLS UPDATE''te eski satırı göremediği için bu iş trigger''a düşer '
  '(G12 guard deseni). Icerik alanlari SERBESTTIR.';

drop trigger if exists trg_events_guard_status on public.events;
create trigger trg_events_guard_status
  before update on public.events
  for each row execute function public.events_guard_status();

commit;
