# AJAN PROMPT'U — G14 (Şikayet sistemi)

> **Kime:** CorteQS reposunda (c:\temp_private\corteqs\corteqs_fin) çalışacak yürütücü ajan.
> **Tarih:** 5 Ekim 2026 · **Kullanıcı ulaşılamaz** — karar gerektiren yerde DURMA: yapabildiğini
> bitir, kalanı `docs/handover/2026-10-05-g14-kullanici-adimlari.md`'ye yaz.
> **Paralel çalışan başka bir ajan var (W04–W06).** Dosyalarına dokunma (§1).

## 0 · Önce oku (sırayla)

1. `docs/kalanlar/KALANLAR.md` → **G14** (satır ~2266) + **G15, G12, G13, G16, G20, G24, G25**
   bölümleri (G14 hepsine bağlanır) + **"2.0 · 4 EKİM KARAR TURU"** (karar 16: engelde atla).
2. `docs/dijital-gruplar/01_politika_v1.1.md` (**§4 kırmızı çizgiler**, §7 şikayet eşiği) ve
   `02_motor-tasarimi.md` (durum makinesi, "Şikayet eden" kuralları, kabul #6). **İş kuralı
   UYDURMA.**
3. `docs/handover/2026-10-04-yan-ajan-ana-prompt.md` §1 "ÇALIŞMA KURALLARI" — **burada da
   bağlayıcı** (git/DB/migration/deploy/PowerShell tuzakları, sır kuralı, kanıt kuralı).
4. Kod/SQL: `applied/20261002050000_group_strikes.sql` (`admin_record_group_strike`) ·
   `applied/20261002030000_group_status_machine.sql` (G12 `set_group_status_v1`, kapı) ·
   `applied/20261002110000_group_scheduled_tasks.sql` satır ~140–160 (**geçici service claim +
   geri yükleme deseni**) · `applied/20261002130000_group_moderator_panel.sql` ·
   `supabase/qa/group-motor-acceptance.sql` (#6 tripwire) · `supabase/qa/phone-otp-acceptance.sql`
   (**telefonu doğrulanmış fixture kurulumu**).

## 1 · KOORDİNASYON (iki ajan, bir çalışma ağacı)

- **Sen:** `group_reports` migration'ı, `group-*` SQL/TS, `src/components/whatsapp/*` (arayüz),
  `src/pages/admin/AdminGruplarPage*`, `src/lib/admin-shell/group-moderation-api*`,
  `src/lib/group-moderator-panel-schema.test.ts`, `supabase/qa/group-*`.
- **W ajanı (dokunma):** `supabase/functions/whatsapp-*`, `_shared/whatsapp-*`,
  `_shared/assistant-usage*`, `supabase/qa/whatsapp-bot-*`.
- **Ortak dosyalar** (`KALANLAR.md`, `admin-updates/2026-10.ts`): 🔴 **pathspec dosya İÇİNDEKİ
  başkasının satırlarını korumaz.** Commit öncesi `git diff -- <dosya>`; karışıksa yalnız kendi
  hunk'ını `git apply --cached --unidiff-zero` ile stage'le.
- **Migration damgası:** `TS=20261005200000; while ls supabase/migrations/applied | grep -q "^$TS"; do TS=$((TS+10000)); done`.
- 🛑 **PUSH ETME.** Commit'ler yerelde kalır; koordinatör inceleyip push'lar.
- ⚠️ `npm run check:dead` şu an KIRMIZI ve **senin değil** (`PhoneVerificationCard.tsx` +
  `phone-verification-api.ts` hiçbir sayfaya bağlı değil). Düzeltme sende DEĞİL; kendi
  dosyalarında yeni erişilemez dosya üretmediğini doğrula. `npm run lint` ~29 hata
  `corteqs-ekstre-motoru/` içinde (takipsiz, senin değil).

## 2 · ÖLÇÜLMÜŞ TABAN (05.10 sabah — başlarken yeniden doğrula)

| Ne | Ölçüm |
|---|---|
| `group_reports` | **YOK.** `%report%group%` adlı fonksiyon da yok. |
| 🟢 Ayarlar **ZATEN TOHUMLANMIŞ** — kopyasını AÇMA | `groups.report_threshold=3` · `groups.report_min_account_age_days=7` · `groups.report_require_phone=true` · `groups.report_same_group_cooldown_days=30`. Okuma yardımcıları: `group_setting_int/bool/json(p_key, p_default)`. |
| Telefon doğrulama | `is_phone_verified(uid)` canlı; G04 aynalama trigger'ı canlı (`auth.users.phone_confirmed_at` → `user_verifications`). **Gerçek SMS YOK** (U06: Twilio kimliklerinin üçü de boş) → bugün **hiçbir gerçek üye telefon doğrulayamaz**. |
| Durum kapısı | `set_group_status_v1(p_landing_id, p_to_status, p_reason, p_note)` — `p_reason` yalnız {`link_dead`,`reports`,`owner_request`} (hidden için). Çağıran **`service_role` veya `is_admin`** olmalı; yoksa `group_forbidden`. |
| Strike kapısı | `admin_record_group_strike(p_landing_id, p_reason, p_redline_number int default null, p_note)` — `is_admin` ister; `p_redline_number` 1..7 ya da NULL. Eşikler `group_settings`'te. |
| 🔴 **4 "yokluk kilidi" testi** | Bunlar G14 gelene kadar şikayetin YOKLUĞUNU kilitliyor; **gevşetme, bilinçli ÇEVİR (yok→var):** `src/components/whatsapp/GroupOwnershipClaim.test.tsx:93` · `src/components/whatsapp/LandingDetailView.g20.test.tsx:103` · `src/lib/group-moderator-panel-schema.test.ts:111` (`'pending_reports', 0` sabit) · `src/pages/admin/AdminGruplarPage.test.tsx:162` ("şikayet kuyruğu BİLİNÇLİ boş"). |
| Kabul tripwire'ı | `supabase/qa/group-motor-acceptance.sql` #6: `group_reports` ortaya çıkınca QA kızarır → **gerçek senaryoya çevir**. |
| Fixture kuralı | G04 `auth.users` BEFORE INSERT guard'ı **phone-only kayıtları reddeder.** Test kullanıcısı: `insert into auth.users (id, email) …`, sonra `update … set phone_confirmed_at = now(), created_at = now() - interval '10 days'`. Hesap yaşı için `created_at` geriye çekilir. |
| Canlı | 10 grup: 8 yayında + 2 gizli (HCD-Bilinç, SHAMAN). `group_moderation_log` var; `corteqs.skip_group_notify` bayrağı var. |

## 3 · İŞ — tek batch, tek commit  (migration + TS + arayüz + kabul)

### 3.1 · Migration `…_group_reports.sql`

1. **`group_reports`:** `id` · `landing_id` (FK, cascade DEĞİL) · `reporter_id` (auth.users) ·
   `reason` CHECK = **politika §4'ün 7 kırmızı çizgisi birebir + `diger`** (anahtar adlarını
   İngilizce/ASCII seç, Türkçe etiketi TS'te tut; DB'ye Türkçe karakter yazma) · `note` (`diger`
   ise **zorunlu**, üst sınır koy) · `status` {`open`,`upheld`,`rejected`} · `created_at` ·
   `reviewed_by/at` · `review_note`. RLS **açık**; kullanıcı yalnız **kendi** satırını okur;
   admin hepsini okur; **kullanıcıya INSERT/UPDATE/DELETE politikası YOK** (RPC-only yazma —
   Cadde deseni). Şikayet edenin kimliği **grup sahibine ASLA görünmez.**
2. **`submit_group_report_v1(p_landing_id, p_reason, p_note)`** — `security definer`, yalnız
   `authenticated` EXECUTE (`revoke … from public, anon`). Sırayla reddet (her biri **ayrı,
   Türkçe'ye eşlenecek hata kodu**; kodları `group_report_*` öneki ile):
   giriş yok · grup yok/yayında değil · **kendi grubu** (ekleyen/sahip — ajan kararı, rapora yaz) ·
   sebep geçersiz · `diger`+not boş · **telefon doğrulanmamış** (`report_require_phone` açıksa
   `is_phone_verified`) · **hesap < `report_min_account_age_days`** · **aynı kişi aynı gruba
   `report_same_group_cooldown_days` içinde 2.** (yarış koşulunu kapat: advisory lock ya da
   `for update`; iki eşzamanlı çağrı iki satır üretmesin).
   **Uygun olmayan şikayet SAYILMAZ = reddedilir, hiç saklanmaz.**
3. **Eşik:** başarılı insert sonrası o grubun `open` şikayetlerinden **farklı `reporter_id`**
   sayısı ≥ `report_threshold` ise grup `published` → `hidden`, sebep **`reports`**, **YALNIZ
   `set_group_status_v1` kapısından** (log satırı `group_moderation_log`'a düşer).
   Çağıran şikayetçi admin/service olmadığı için **G22'nin geçici service claim desenini
   kullan** (`request.jwt.claims` önceki değeri sakla → service_role ver → çağır → **geri
   yükle**). Geri yüklemeyi atlarsan aynı işlemdeki sonraki ifadeler yükseltilmiş yetkiyle
   koşar — **testle kanıtla** (çağrıdan sonra `auth.role()` eski değerde).
   ⚠️ **Geçiş matrisi ölçüldü (`group_status_transition_allowed`, 05.10):** `published →
   {hidden, removed, suspended}` · `hidden → {published, removed}` · `suspended → {published,
   removed}` · `pending_review → {published, rejected, removed}` · `rejected → {removed}` ·
   `removed →` hiçbiri. Yani `hidden`'a yalnız `published`'tan geçilir: grup zaten
   hidden/suspended ise şikayet yine kaydedilir ama durum değişmez (matris izin vermez,
   `group_illegal_transition` fırlar — bunu YAKALA, şikayeti kaybetme).
4. **`review_group_report_v1(p_report_id, p_decision, p_note)`** — `is_admin` tek kapı.
   `upheld` → G15 uyarı sistemi: `admin_record_group_strike(landing, reason, redline_no, note)`
   (sebep→kırmızı çizgi numarası eşlemesi: ilk 7 anahtar 1..7, `diger` → NULL). `rejected` →
   o grubun **başka açık şikayeti kalmadıysa** ve `hidden_reason='reports'` ise grup
   `hidden → published` (kapıdan; politika "şikayet reddedilirse grup yayına döner").
   Çifte karar reddedilir (zaten karara bağlanmış).
5. **`group_moderator_summary`'yi yeniden tanımla:** `pending_reports` artık gerçek açık
   şikayet sayısı. ⚠️ Diğer **her şey birebir aynı kalmalı** (4 sayaç, `moderated x/threshold`,
   cron özeti). Bu fonksiyonu kilitleyen "en son tanımlayan migration" bayatlama kapanı
   (`group-moderator-panel-schema.test.ts`) varsa **bilinçli güncelle**, gevşetme.
6. Okuma API'si: moderatör için `admin_list_group_reports` (grup bazlı: sebep dağılımı, kaç
   farklı şikayetçi, notlar; **şikayetçi kimliği yalnız admin'e**). `anon` hiçbir şey göremez.

⚠️ **Bildirim maili EKLEME.** `group_notify_moderation_log` yalnız `hidden`+`link_dead` için mail
atar; `reports` ile gizlemede mail yok ve bu karar turunda konuşulmadı. Şikayetçiye/sahibe mail
ekleme — gerekirse kullanıcı-adımları dosyasına "karar gerekir" olarak yaz.

### 3.2 · TS katmanı
`src/lib/group-reports-api.ts` + Zod şema + React Query hook'ları (muhasebe/`*-api.ts` deseni;
bileşende doğrudan `supabase.from()` YOK). Hata kodu → Türkçe mesaj haritası **çift yönlü
sözleşme testi** (SQL'deki `raise exception` kodları ⇄ TS haritası; `service-finder-format.test.ts`
deseni). ⚠️ RPC hatası düz nesnedir (`instanceof Error` ile DARALTMA).

### 3.3 · Arayüz
- **Herkese açık grup detayı** (`src/components/whatsapp/LandingDetailView.tsx`): "Şikayet et"
  düğmesi + sebep listesi (Türkçe etiketler, politika §4 metniyle uyumlu) + `diger` için zorunlu
  not alanı. Girişsizse giriş yönlendirmesi (`next=`). Telefon doğrulanmamışsa **dürüst mesaj**:
  "Şikayet için telefon doğrulaması gerekir" + profile yönlendirme.
  🔴 **U06 gelene dek hiçbir üye telefon doğrulayamaz → pratikte kimse şikayet edemez.** Bu
  beklenen ve bir kusur DEĞİL; ama ekranda bunu gizleme, ve kullanıcı-adımları dosyasına yaz.
  Şikayet edenin kendi grubunda düğme **çizilmez**. Gönderince tekrar gönderilemez durum (30 gün
  bekleme) gösterilir.
- **Moderatör paneli** (`AdminGruplarPage.tsx` "Şikayetler" sekmesi, şu an bilerek boş): açık
  şikayetleri grup bazlı listele; sebep/not/şikayetçi sayısı; **Onayla/Reddet** (+ red notu).
  Klavye kısayolları mevcut deseni bozmasın. Hata görünür (boş ekranla yutma YOK).
- Dört yokluk kilidini **çevir** (§2 tablosu): yeni test "düğme VAR + doğru koşullarda çizilir".

### 3.4 · Kabul — `supabase/qa/group-motor-acceptance.sql` #6'yı gerçek yap
**Önce KIRMIZI koş** (tripwire zaten kırmızı verir), sonra yeşil. Geri alınan işlem (BEGIN…ROLLBACK).
Asgari senaryolar (`⚠️ "0 geçerli şikayet"le geçmiş sayma — eşiğin GERÇEKTEN tetiklendiğini ölç`):
- **3 uygun hesap** → grup `hidden`, `hidden_reason='reports'`, log satırı `actor_kind='system'`.
- **2 uygun hesap** → hâlâ `published` (eşik sınırı).
- **6 günlük hesap** şikayeti → reddedilir, **sayılmaz**, 3. uygun hesap olsa bile eşik dolmaz.
- **Telefonu doğrulanmamış** hesap → reddedilir.
- Aynı kişi aynı gruba **2. şikayet (30 gün içinde)** → reddedilir; ikisi eşzamanlı → tek satır.
- `diger` + boş not → reddedilir. Geçersiz sebep → reddedilir.
- Kendi grubuna şikayet → reddedilir. Yayında olmayan gruba → reddedilir.
- `anon` `submit_group_report_v1`'i çağıramıyor (`has_function_privilege`), `group_reports`'u okuyamıyor.
- Kullanıcı yalnız **kendi** şikayetini okur; **grup sahibi** şikayetçiyi göremez.
- `review`: `upheld` strike işletir (log + strike satırı); son açık şikayet `rejected` →
  grup `published`'a döner; başka açık şikayet varsa dönmez; çifte karar reddedilir.
- Claim geri yüklendi: çağrı sonrası `auth.role()` yükseltilmiş değil.
- `group_moderator_summary.pending_reports` gerçek sayıyı veriyor, diğer alanlar değişmedi.
- Regresyon: `group-motor-acceptance.sql` diğer 12 madde **yeşil kalır**.

**Mutasyon ≥6** (canlı fonksiyonlar üzerinde, G25 deseni, her mutasyon sonrası geri yükle ve
canlıyı yeniden ölç): yaş kontrolünü sil · telefon kontrolünü sil · eşiği `>=`→`>` · cooldown'u
sil · claim geri yüklemeyi sil · `anon` grant'i ver · sahibe şikayetçi kimliğini aç. Düzenek
"betik patladı" ile "iddia düştü"yü AYIRT etmeli (özet satırında "TUMU YAKALANDI").

## 4 · DOĞRULAMA ve KAPANIŞ

`npx tsc -p tsconfig.app.json --noEmit` · `npm run test` (TAM takım) · `npm run verify:text`
(⚠️ eksik Türkçe harfi YAKALAMAZ — arayüz metinlerini gözle kontrol et) ·
`npm run check:migrations` (ledger ELLE) · `npm run ingest:tools:check` (src/lib değiştiyse).
Tek commit, pathspec'li, Türkçe, trailer'lı. **Bağımsız inceleme:** kendi yazdığını kendin
onaylama — ayrı inceleme turu; yoksa raporda "yazan ve inceleyen aynı" de.

Kapanış: admin-updates'e **düz Türkçe** giriş · KALANLAR'da G14 ✅ + kanıt satırı → Kapananlar ·
`docs/handover/2026-10-05-g14-kullanici-adimlari.md`: U06 bitmeden şikayet edilemez (Twilio),
şikayetçi/sahibe mail kararı, "sebep→kırmızı çizgi eşlemesi" teyidi, "kendi grubuna şikayet
yasak" ajan kararının teyidi.

## 5 · FİNAL RAPOR
1. Yapılanlar: commit hash · kabul N/N (RED→GREEN) · mutasyon N/7 · tam takım sayıları.
2. **KANITLANAMAYANLAR** açıkça: gerçek telefonla şikayet (U06), gerçek tarayıcıda arayüz.
3. Ölçümün çürüttüğü öncüller. 4. Kendi hataların. 5. Push edilmedi; hash'leri listele.
