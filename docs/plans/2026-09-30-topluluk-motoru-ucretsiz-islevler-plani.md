# Topluluk Motoru — Sürtünmesiz Ücretsiz İşlevler Planı

> Tarih: 2026-09-30 · Durum: onaya sunuldu, uygulama başlamadı
>
> **Yürütme:** bu plan **M01–M27** batch'lerine bölündü — sıra, kapsam ve kabul kriterleri
> [`docs/kalanlar/KALANLAR.md`](../kalanlar/KALANLAR.md) master'ının
> **M bölümünde**. Batch'e başlarken ayrıntı (bağlam, tuzak gerekçesi, canlı ölçümler) için
> bu dosyanın ilgili fazı okunur; neyin sırada olduğu master'dan öğrenilir.

## Bağlam — bu iş neden yapılıyor

İlk 6–12 ayda hedef gelir değil **traction ve retention**. Topluluk etkisi yaratan işlevler
sürtünmesiz ve herkese açık olmalı; ücret yalnızca *görünürlük*, *tahsilat* ve *profesyonel
yanıtlama* üzerinden alınmalı.

Bugünkü tablo bu ihtiyacı doğruluyor (canlı ölçüm, 2026-09-30):

| Ölçüm | Değer |
|---|---|
| Kayıtlı kullanıcı (`auth.users`) | **174** |
| Son 7 günde giriş yapan (WAU) | **5** |
| Son 30 günde giriş yapan | **14** |
| `events` tablosundaki TOPLAM etkinlik | **1** (o da `pending`) |
| `approval_requests` toplam kayıt | **10** (2'si `event_create`, ikisi de `rejected`) |
| `whatsapp_landings` | 10, hepsi `approved` |

174 kayıtlı üyeye karşı 1 etkinlik ve 5 haftalık aktif kullanıcı — ürün çalışıyor ama
**topluluk döngüsü dönmüyor.** Bu plan o döngüyü kuran altı işlevi ücretsiz ve panelden
tek tıkla erişilebilir hâle getirir, sonra dönüp dönmediğini ölçer.

---

## Ölçülen taban — neyin zaten var olduğu

⚠️ Plana başlamadan önce okunmalı. Altı maddenin **ikisi zaten canlıda tamam**; onlar için
kod yazmak boşa iştir.

| İstenen | Canlı durum | Kalan iş |
|---|---|---|
| **3. Cadde ücretsiz** | ✅ `cadde.access` **82/82 rolde açık** | **YOK** — sıfır iş |
| **4. Dijital grup ekleme** | ✅ `/addcom` hiç guard'sız, Telegram da destekli, 10 onaylı kayıt | **YOK** — yalnız panele kısayol |
| **1. Etkinlik** | 🟡 Oluşturma ücretsiz (`App.tsx:209` yalnız `RequireAuth`), ama **her** etkinlik `pending`'e düşüyor (`events-api.ts:158`). Admin onay ekranı var. `featured` sütunu mevcut. | İlk-etkinlik kuralı, 2 aktif limiti, katılım |
| **2. Tavsiye İste** | 🔴 Yok | Tam modül |
| **5. Davet + liderlik** | 🔴 Yok. Mevcut `referral_codes` **admin'in dağıttığı pazarlama kodu**, kişisel davet linki değil — karıştırma. | Tam modül |
| **6. Haftalık şehir özeti** | 🔴 Şehir takibi yok. Mail altyapısı olgun (outbox + dedupe + pg_cron). | Takip + özet işi |
| Panel hızlı eylemler | 🔴 Ayrı üye paneli yok; üye ekranı `/profile` (`ProfileSidebarLayout`) | Hızlı eylem kartı |
| Admin traction metrikleri | 🔴 Olay takibi tablosu yok; tek analitik sayfası AI ajan kullanımı için | Türetilmiş metrik sayfası |

İlgili dosyalar: [App.tsx:208-210](../../src/App.tsx#L208-L210) ·
[events-api.ts](../../src/lib/events-api.ts) ·
[AdminEventsPage.tsx](../../src/pages/admin/AdminEventsPage.tsx) ·
[AddWhatsAppPage.tsx](../../src/pages/AddWhatsAppPage.tsx) ·
[features.ts](../../src/lib/features.ts)

### İki kritik tuzak (ölçüldü — varsayım değil)

**T1 — Etkinlik onay kuyruğu bugün RLS'te ZORLANMIYOR.** Canlı politikalar:

```
Users can create own events   INSERT  WITH CHECK (auth.uid() = user_id)
Users can update own events   UPDATE  USING (auth.uid() = user_id)   -- WITH CHECK yok
```

Hiçbirinde `status` kısıtı yok. `status: "pending"` yalnız istemci kodunda
(`events-api.ts:158`) yazılıyor; bir kullanıcı PostgREST'e doğrudan `status='published'`
gönderip onayı **tamamen atlayabilir**. Bugün bu kimsenin umurunda değil çünkü tabloda 1
kayıt var — ama "ilk etkinlik onaydan geçer, sonrakiler otomatik" kuralı istemcide
yazılırsa kural hiç var olmamış olur. **Kural SQL'de olmalı.**

**T2 — `events.create` ve `offers.create` feature'larının `role_features`'ta HİÇ KURALI YOK
(0 satır).** Bu iki key `features.ts:32` ve `profile-requestable-features.ts:27`'de tanımlı
ama hiçbir role bağlanmamış. Bugün etkinlik açık *çünkü rota bu flag'i kullanmıyor*, sadece
`RequireAuth` var. **Etkinliği `RequireFeature` arkasına alma** — CLAUDE.md'nin telefon alanı
vakasıyla birebir aynı sınıf: kuralı olmayan feature sessizce herkese kapalıdır. Ücretsiz
kalması isteniyorsa flag'e hiç dokunma.

---

## Verilen kararlar

1. **Ödeme kapsam dışı.** Yalnız ücretsiz taraf kurulur. Ücretli yüzeylerde (öne çıkarma,
   bilet/aidat, profesyonel yanıt kutusu) *kilitli durum + ilgi kaydı* gösterilir. Stripe
   entegrasyonu ayrı plan.
2. **"Tavsiye İste" ayrı modül**, Cadde akışında kart olarak görünür. Cadde'nin bant/skor
   sıralamasına ve hedefleme kurallarına bulaşmaz.
3. **Site içi katılım kurulur** (`event_attendees`), dış `registration_url` yanında durur.
4. **Metrikler mevcut tablolardan türetilir** (SQL view/RPC). Yeni olay yazma yükü yok —
   canlı instance 1 GB RAM, CLAUDE.md tek kötü sorgunun siteyi 50 dk düşürdüğünü belgeliyor.

### Kapsam dışı (bilinçli)
Stripe/tahsilat · komisyon · WhatsApp bot özeti (secret'lar yer tutucu) · Cadde'ye yeni post
türü · `analytics_events` olay takibi altyapısı.

---

## Fazlar

Fazlar bağımsız sevk edilebilir. Her faz kendi migration'ı + sözleşme testi + doğrulaması ile kapanır.

### Faz 0 — Ücretsizliği kilitle (küçük, önce bu)

Amaç: bugün ücretsiz olanın *kaza ile* kapanmasını imkânsız kılmak.

- **Sözleşme testi** `src/lib/community-free-features.test.ts` (yeni):
  `App.tsx` metnini okuyup `/events`, `/events/create`, `/addcom`, `/tavsiye`, `/liderlik`
  rotalarının `RequireFeature` **içermediğini** doğrular; `cadde.access`'in bilinçli olarak
  korunduğunu belgeler.
  Desen: [redirects.test.ts](../../src/lib/redirects.test.ts) (kaynak metni denetleyen sözleşme testi).
  ⚠️ Kaynak dilimlemede çıplak `indexOf + slice` kullanma — `@/test/source-slice` yardımcıları
  zorunlu (`test-source-slice-contract.test.ts` bunu kilitler).
- **Belge:** `CLAUDE.md`'ye "Ücretsiz topluluk işlevleri" bölümü — T1 ve T2 tuzakları yazılır.

### Faz 1 — Etkinlik: ilk-onay kuralı + katılım

**Migration `<ts>_events_first_approval_and_attendees.sql`**

1. `events` tablosuna `approval_source text` (`'auto' | 'admin'`) — kaydın niye yayında
   olduğu SQL'den cevaplanabilir olsun.
2. **RPC `create_event_v1(...)` (security definer)** — tek yazma yolu:
   - Kullanıcının daha önce `published` olmuş etkinliği var mı? Yoksa → `status='pending'`
     + `approval_requests`'e `request_type='event_create'` satırı. Varsa → `status='published'`,
     `approval_source='auto'`.
   - **Aynı anda en fazla 2 aktif etkinlik** (`status='published'` ve `event_date >= current_date`).
     Aşılırsa `errcode='P0001'`, mesaj anahtarı `event_active_limit`.
   - Bireysel dışındaki roller (kurum/işletme) limitten muaf; muafiyet ve limit değeri
     **`cadde_settings` desenini kopyalayan bir ayar tablosundan** okunur — ürün kararı SQL
     update'i olsun, kod değişikliği değil.
3. **RLS sıkılaştırma:** INSERT politikası `status='pending'` zorunlu kılacak şekilde daraltılır;
   status değiştirmeyi engelleyen bir **trigger** eklenir (RLS UPDATE'te satırın eski hâline
   bakamaz). Yayınlama yalnız RPC ve `is_admin()` üzerinden.
4. **`event_attendees`**: `(event_id, user_id)` PK, `created_at`, `status` (`going`|`cancelled`).
   RLS: kendi kaydını yazar/siler; etkinlik sahibi ve admin okur; sayaç herkese açık
   (aggregate RPC ile, satırlar değil).
5. **RPC `join_event_v1` / `leave_event_v1`** — `max_attendees` kontenjanını **SQL'de** kontrol
   eder (istemcide yarış koşulu olur).

**Kod**
- [events-api.ts](../../src/lib/events-api.ts): `createEvent` doğrudan `insert` yerine
  `create_event_v1` RPC'sini çağırır; `joinEvent`/`leaveEvent`/`fetchEventAttendeeCount` eklenir.
- `src/lib/events-rules.ts` (yeni): limit sabiti + hata kodu → Türkçe mesaj haritası.
  ⚠️ RPC hataları **düz nesnedir, `Error` örneği değil** — `instanceof Error` ile daraltma;
  `code`/`details`/`hint` okunur ([service-finder-format.ts](../../src/lib/service-finder-format.ts) referans).
- `src/components/events/EventAttendeeButton.tsx` (yeni);
  [MyEventsPanel.tsx](../../src/components/events/MyEventsPanel.tsx) limit ve onay durumunu
  kullanıcıya açıkça anlatacak şekilde güncellenir.
- `src/components/events/EventFeaturePromo.tsx` (yeni): "Öne çıkar" / "Bilet sat" için
  **kilitli** kart + ilgi kaydı (Faz 5).

**Sözleşme testi** `src/lib/events-first-approval.test.ts` — SQL↔TS ayna sözleşmesi
([cadde-rules.ts](../../src/lib/cadde-rules.ts) deseni): migration metnindeki limit sabiti ile
`events-rules.ts`'teki sabitin birebir aynı olduğunu ve hata kodlarının iki yönlü eşleştiğini kilitler.

### Faz 2 — Tavsiye İste

**Migration `<ts>_recommendation_requests.sql`**

- `recommendation_requests`: `id`, `user_id`, `title`, `body`, `category_slug`, `country`,
  `city`, `status` (`open`|`answered`|`closed`), **`diaspora_key` + CHECK**, `created_at`.
  ⚠️ CLAUDE.md kuralı: yeni topluluk içerik tablosu `diaspora_key` taşımalı ve liste filtresine girmeli.
- `recommendation_answers`: `id`, `request_id`, `user_id`, `body`, `is_professional`, `created_at`.
- RLS: okuma herkese açık (yayınlanmış), yazma **yalnız security-definer RPC** ile
  (`create_recommendation_request_v1`, `answer_recommendation_v1`) — Cadde'nin "RPC-only
  mutations" kuralı bu modülde de geçerli.
- **Ban kill-switch** tek noktadan (`has_cadde_feature` deseni) geçer ki yeni yazma yolları
  otomatik kapsansın.
- `match_recommendation_professionals(request_id)`: kategori + şehir/ülke eşleşen profesyonelleri
  döner. **Eşleşme eler değil sıralar** (dizin aramasındaki `match_rank` dersi),
  `catalog_search_normalize()` ile katlanır.
  ⚠️ **`catalog_search_documents.search_text` KULLANILMAZ** — iletişim bilgisi taşır.

**Kod** — `muhasebe` / `cadde` modül desenini birebir kopyalar:

```
src/lib/recommendations-api.ts         (RPC çağrıları)
src/lib/recommendations-schemas.ts     (Zod + z.infer)
src/lib/recommendations-rules.ts       (hata kodu → Türkçe mesaj; SQL ile aynalı)
src/hooks/use-recommendations.ts       (React Query)
src/pages/RecommendationsPage.tsx      (/tavsiye)
src/pages/RecommendationDetailPage.tsx (/tavsiye/:id)
src/components/recommendations/*       (form, kart, yanıt listesi)
src/components/cadde/CaddeRecommendationCard.tsx  (Cadde akışında görünürlük)
```

- **Profesyonel gelen kutusu kilitli:** eşleşen profesyonele bildirim düşer ama talebin iletişim
  detayı `ProLockedInboxCard` ile kilitli gösterilir → ilgi kaydı (Faz 5).
  [MessagesInbox.tsx](../../src/components/messaging/MessagesInbox.tsx) bu ekranın deseni.
- Rotalar `App.tsx`'e `lazyWithReload` ile eklenir, **`RequireFeature` YOK** (bkz. T2).
- Türkçe arama `trIncludes`/`trCompare` ([text-normalization.ts](../../src/lib/text-normalization.ts)).

### Faz 3 — Davet et + liderlik

**Migration `<ts>_user_invites_and_leaderboard.sql`**

- `user_invites`: `code` (benzersiz; [referral-codes.ts](../../src/lib/referral-codes.ts)'teki
  `SAFE_CHARS` alfabesi yeniden kullanılır — karıştırılabilir harf yok), `owner_user_id`, `created_at`.
- `user_invite_redemptions`: `code`, `invited_user_id` (benzersiz — bir üye bir kez sayılır), `redeemed_at`.
- RPC: `get_or_create_my_invite_code()`, `redeem_invite_code(p_code)` (kayıt akışında çağrılır),
  `get_invite_leaderboard(p_limit)`.
- ⚠️ **Rozet eşikleri veriden gelir**, koda gömülmez (`cadde_settings` deseni).
- ⚠️ **Liderlik tablosu dizinin görünürlük kuralını aynen yansıtır**: `is_directory_visible=false`
  roller (Süper Admin, test hesapları) ve `[PLACEHOLDER]` kayıtlar **SQL'de** elenir. AI korpus
  vakasında tam olarak bu üç sızıntı ölçüldü — tekrarlama.

**Kod**

```
src/lib/invites-api.ts · src/lib/invites-badges.ts (eşik → rozet)
src/pages/LeaderboardPage.tsx         (/liderlik)
src/components/invites/InviteCard.tsx (link + kopyala + QR)
```

- QR için mevcut [referral-qr.ts](../../src/lib/referral-qr.ts) yeniden kullanılır.
- `/liderlik` anonime açılacaksa: dizin araması vakasındaki gibi RPC'nin `anon` EXECUTE grant'i
  **ve gövdede auth kontrolü olmadığı** ayrı ayrı doğrulanır.
- Sitemap'e eklenmeden önce CLAUDE.md'deki **3 kriter** (auth arkasında değil · `useSeo` +
  `canonicalPath` var · thin content değil) tek tek doğrulanır.

### Faz 4 — Haftalık şehir özeti

**Migration `<ts>_city_follows_and_weekly_digest.sql`**

1. `user_city_follows`: `user_id`, `country`, `city` (birlikte PK). RLS: kendi satırları.
2. ⚠️ **`notification_email_outbox.event_type` CHECK'i canlıda 7 değere kilitli**
   (`new_member`, `admin_update`, `member_welcome`, `revision_request`,
   `revision_request_completed`, `relocation_tool_report`, `relocation_tool_abandonment`).
   `weekly_city_digest` eklemek **migration ister**; TS birliğini tek başına genişletirsen RPC
   reddeder ve kayıt **sessizce kaybolur** (`client_error_reports` ile aynı sınıf).
3. `enqueue_weekly_city_digest()` — takip edilen şehirdeki son 7 günün yeni etkinlik / tavsiye /
   profesyonellerini toplar, outbox'a **kullanıcı başına tek satır** yazar
   (`dedupe_key = user_id || hafta`).
4. `pg_cron` ile haftada bir; mevcut `notification-email-drain` cron'u gönderimi yapar.
   ⚠️ **"cron yeşil" kanıt değildir** (Radar dersi, 2026-09-28) — doğrulama gerçek outbox satırı
   ve dolu `sent_at` ile yapılır.
5. ⚠️ **PostgREST 1000 satır tavanı**: toplu veri çeken sorgu `fetchAllRows()` desenini
   (`scripts/generate-sitemap.mjs`) kullanır.
6. ⚠️ **1 GB RAM**: `geo_cities` 76.990 satır. Satır başına fonksiyon uygulama YASAK; önce
   `select distinct` ile küçült, sonra join et.

**Kod:** `src/lib/city-follows-api.ts`, `src/components/profile/CityFollowCard.tsx`,
[NotificationPreferencesPage.tsx](../../src/pages/NotificationPreferencesPage.tsx)'e özet
aç/kapa anahtarı. Mail HTML kuralları: hoş geldin maili deseni.

### Faz 5 — Panel hızlı eylemleri + ilgi kaydı

- **Hızlı eylem kartı** `src/components/profile/QuickActionsCard.tsx`: "Etkinlik oluştur" ·
  "Tavsiye iste" · "Davet et" · "Grup ekle". `ProfileSidebarLayout`'un ilk ekranında, tüm
  rollerde. Kaynak tek liste: `src/lib/community-quick-actions.ts`.
- **Başlangıç listesi** `src/components/profile/GettingStartedCard.tsx`: profili tamamla · ilk
  hizmet/ürün/etkinlik · 3 davet. Tamamlanma durumu **gerçek veriden** okunur (uydurma yüzde yok).
- **`feature_interest` tablosu** (küçük): kilitli bir ücretli yüzeye tıklayan kullanıcının
  ilgisini kaydeder (`feature_key`, `user_id`, `created_at`). Ücretli tarafın ne zaman
  yapılacağına bu tablo karar verecek.

### Faz 6 — Admin traction panosu

**Migration `<ts>_traction_metrics_views.sql`** — türetilmiş, yazma yükü sıfır:

- `metrics_weekly_active_users` — `auth.users.last_sign_in_at` + içerik üretim tabloları
- `metrics_content_created` — haftalık etkinlik / tavsiye / cadde gönderisi / grup
- `metrics_recommendation_response_rate` — yanıtlanan talep / toplam talep
- `metrics_invite_signups` — davetle gelen kayıt
- `metrics_30d_return_rate` — 30 gün önce kaydolup son 30 günde dönen oranı

⚠️ Hepsi **`security_invoker` view veya `is_admin()` gövdeli RPC** olmalı; ham view'a anon grant
verme. ⚠️ **Materialized view kullanma** — 1 GB RAM'de refresh riski; sorgular küçük tablolara
vuruyor, normal view yeterli.

**Kod:** `src/lib/admin/admin-traction-api.ts`, `src/pages/admin/AdminTractionPage.tsx`
(`KpiCard` muhasebe deseni), navigasyon satırı
[admin-navigation-registry/overview.ts](../../src/lib/admin-shell/admin-navigation-registry/overview.ts)'e eklenir.

---

## Her fazda uyulacak proje kuralları

- **Migration akışı:** yaz → uygula → **`supabase/migrations/applied/` altına TAŞI**. Parent
  `supabase/migrations/` dizininde dosya bırakma — `check:migrations` orayı taramaz ve
  "sapma yok" yalanı üretir. Zaman damgasını **tekrar kullanma**.
- **`as TablesInsert<...>` CAST YASAK** — `satisfies` kullan. Cast, olmayan sütuna yazmayı
  tsc'den gizler; hata canlıda `PGRST204` olarak çıkar.
- **DB'ye yazılan `value`/`key` alanlarından Türkçe karakter silinmez.** Vokabüler tek kaynaktan
  gelir ([events-vocabulary.ts](../../src/lib/events-vocabulary.ts) deseni), elle yazılmaz.
- **Veri bağımlı `useSeo` çağrısı `deps` geçmeli** (`use-seo-deps-contract.test.ts`).
- **Yeni `src/lib/**` dosyası eklendiyse `npm run ingest:tools:check` çalıştır** — ne lint ne
  test bunu yakalar.
- **Ayrıştırma ve inceleme AYRI ajanlara verilir**; denetleyene "onayla" değil "çürütmeye çalış"
  görevi ver.

---

## Doğrulama

**Faz bazında (yerel)**

1. `npm run test` — yeni sözleşme testleri dahil yeşil
2. `npx tsc -p tsconfig.app.json --noEmit` → 0 hata
3. `npm run lint` → 0 problem
4. `npm run verify:text` → temiz (⚠️ eksik Türkçe harfi yakalamaz, gözle de kontrol et)
5. `npm run check:migrations` → sapma yok (parent dizin taraması dahil)
6. `npm run ingest:tools:check` (yeni `src/lib` dosyası varsa)

**Canlı (uygulama sonrası — ölç, varsayma)**

- **Faz 1:** test hesabıyla **ilk** etkinlik → `pending` + `approval_requests` satırı; admin
  onaylar; **ikinci** etkinlik → doğrudan `published`, `approval_source='auto'`. Üçüncü aktif
  etkinlik → `event_active_limit`. **Ayrıca PostgREST'e doğrudan `status='published'` POST at
  ve reddedildiğini gör** — T1'in kapandığının tek kanıtı budur.
- **Faz 2:** anonim ziyaretçi `/tavsiye` listesini görür; üye talep açar; eşleşen profesyonele
  bildirim düşer; kilitli kutu görünür.
- **Faz 3:** davet linkiyle kayıt → `user_invite_redemptions` satırı; `/liderlik`'te admin ve
  test hesapları **görünmüyor**.
- **Faz 4:** `enqueue_weekly_city_digest()` elle tetiklenir → outbox satırı oluşur → drenaj
  sonrası `sent_at` dolar. Cron'un "yeşil" olması kanıt sayılmaz.
- **Faz 6:** her metrik için SQL çıktısı ile panel rakamı elle karşılaştırılır.

**Kabul kriteri (orijinal talep)**

- [ ] Altı işlev ücretsiz hesapla kullanılabiliyor
- [ ] Bireysel ilk etkinlik onay kuyruğuna düşüyor, ikincisi otomatik yayınlanıyor
- [ ] Aynı anda en fazla 2 aktif etkinlik SQL'de zorlanıyor
- [ ] Panelde "Etkinlik oluştur · Tavsiye iste · Davet et · Grup ekle" tek tıkla
- [ ] Admin panelinde WAU, üretilen içerik, yanıt oranı, davetle gelen kayıt, 30 günlük geri
      dönüş görünüyor

---

## Faz sırası önerisi

`Faz 0` (küçük, koruyucu) → `Faz 1` (etkinlik, en somut değer) → `Faz 5` (panel — 1'i görünür
kılar) → `Faz 3` (davet, büyüme döngüsü) → `Faz 6` (ölçüm) → `Faz 2` (tavsiye, en büyük) →
`Faz 4` (özet mail — 1, 2, 3'ün içeriğini besler, en sona kalması doğaldır).

Faz 6'yı Faz 2'den **önce** koymak bilinçlidir: tavsiye modülüne girmeden önce etkinlik ve
davetin traction üretip üretmediğini görmek istiyoruz. Üretmiyorsa Faz 2'nin tasarımı değişir.
