-- M24 — Haftalık şehir özeti, Migration 1: `user_city_follows` + outbox genişletme.
--
-- ── ÖLÇÜM (04.10, yazmadan önce; plandaki rakamlar BAYATTI) ─────────────────
--   `user_city_follows` ................ YOK (kurulacak)
--   outbox `event_type` CHECK .......... plan "7 değere kilitli" diyor,
--                                        CANLIDA **18** değer var (G23 9→17,
--                                        KR09 +career, M17 +recommendation_match)
--   `notification_settings` ............ 17 anahtar
--   `geo_countries` / `geo_cities` ..... 251 / 76.992
--
-- ⚠️ Plandaki "7 değer" rakamına göre iş yapma — CHECK listesi bu repoda sürekli
--    büyüyor. Yeni değer eklerken DAİMA canlı tanımı oku, üzerine ekle.
--
-- ── BİLİNÇLİ SAPMA: PK metin değil, geo_cities'e FK ─────────────────────────
-- Plan `(user_id, country, city)` üçlüsünü (serbest metin) öneriyordu.
-- UYGULANMADI. CLAUDE.md'nin Dijital Gruplar kuralı md.3 açık:
--   "Şehir/ülke `geo_countries` (251) / `geo_cities` (76.992) tablolarından
--    gelir, `cadde_*`'tan DEĞİL. İki ayrık katalogdur; bu ayrışma Cadde'de
--    aylarca sessiz kusur üretti. Serbest metin konum yok."
-- Serbest metin kullanılsaydı `Münih`/`Münih `/`munih` üç ayrı takip olurdu ve
-- özet sorgusu hiçbirini birleştiremezdi — Cadde'de yaşanan kusurun aynısı.
-- Ülke bilgisi `geo_cities.country_id` üzerinden TÜRETİLİR, ayrıca saklanmaz.
--
-- ⚠️ 1 GB RAM: `geo_cities` 76.992 satır. Bu tabloya satır başına fonksiyon
--    uygulayan sorgu YASAK (05.08'de site 50 dk düştü). M25'in özet sorgusu
--    önce takip edilen DISTINCT şehir kümesini alacak, sonra join edecek.

-- ── 1) Takip tablosu ────────────────────────────────────────────────────────
create table if not exists public.user_city_follows (
  user_id    uuid        not null references auth.users(id)       on delete cascade,
  city_id    uuid        not null references public.geo_cities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, city_id)
);

comment on table public.user_city_follows is
  'Üyenin haftalık özet almak için takip ettiği şehirler. Şehir `geo_cities`''e '
  'FK''dir — serbest metin DEĞİL (CLAUDE.md Dijital Gruplar md.3). Ülke '
  'geo_cities.country_id üzerinden türetilir, burada saklanmaz.';

-- Özet işi "bu şehri kimler takip ediyor" diye sorar; PK (user_id, city_id)
-- bu yöne hizmet etmez, bu yüzden ters indeks şart.
create index if not exists user_city_follows_city_idx
  on public.user_city_follows (city_id);

alter table public.user_city_follows enable row level security;

drop policy if exists user_city_follows_select_own on public.user_city_follows;
create policy user_city_follows_select_own on public.user_city_follows
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists user_city_follows_insert_own on public.user_city_follows;
create policy user_city_follows_insert_own on public.user_city_follows
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists user_city_follows_delete_own on public.user_city_follows;
create policy user_city_follows_delete_own on public.user_city_follows
  for delete to authenticated
  using (user_id = auth.uid());

-- UPDATE politikası BİLEREK YOK: tablo bir bağ tablosudur, takip ya vardır ya
-- yoktur. UPDATE açmak `user_id`'yi başkasına kaydırma yolu açardı.

-- ── 2) Outbox: yeni olay tipi ───────────────────────────────────────────────
-- ⚠️ KR09 DERSİ: TS birliğini genişletmek YETMEZ. CHECK'e eklenmeyen bir tip
--    insert anında `23514` ile reddedilir ve `reportClientError` fırlatmadığı
--    için kayıt SESSİZCE kaybolur. Radar özeti tam bu yüzden 19 Eylül'den beri
--    hiç gitmemişti.
alter table public.notification_email_outbox
  drop constraint if exists notification_email_outbox_event_type_check;

alter table public.notification_email_outbox
  add constraint notification_email_outbox_event_type_check
  check (event_type = any (array[
    'new_member', 'admin_update', 'member_welcome',
    'revision_request', 'revision_request_completed',
    'relocation_tool_report', 'relocation_tool_abandonment',
    'radar_scan_digest', 'career_application',
    'group_submission_received', 'group_published', 'group_rejected',
    'group_ownership_verified', 'group_post_pending', 'group_link_dead',
    'group_score_badge', 'group_strike_warning',
    'recommendation_match',
    'weekly_city_digest'
  ]));

-- ── 3) Ayar anahtarı — KAPALI başlar ────────────────────────────────────────
-- G22/G17 deseni: otomatik gönderim yapan bir hat KAPALI doğar, uçtan uca
-- kanıtlandıktan sonra (M27) İNSAN kararıyla açılır. Açık doğsaydı M25'in
-- cron'u ilk koşuda tüm üyelere mail atardı.
insert into public.notification_settings (key, value)
values ('email.weekly_city_digest.enabled', 'false'::jsonb)
on conflict (key) do nothing;

-- Takip tavanı: tek üyenin 76.992 şehrin tamamını takip edip özet sorgusunu
-- şişirmesini engeller. Uygulaması M26'nın yazma yolundadır; eşik burada
-- tanımlanır ki kodda sabit yazılmasın (cadde_settings deseni).
insert into public.notification_settings (key, value)
values ('weekly_city_digest.max_follows_per_user', '10'::jsonb)
on conflict (key) do nothing;
