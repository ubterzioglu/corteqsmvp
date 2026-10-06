# AJAN PROMPT'U — KALAN İŞLER (P04–P07, K01+K04, SG, U01, Stripe, G10c, kullanıcı-adımları)

> **Kime:** CorteQS reposunda (c:\temp_private\corteqs\corteqs_fin) çalışacak yürütücü ajan.
> **Tarih:** 5 Ekim 2026 · **Kullanıcı ulaşılamaz** — karar gerektiren yerde DURMA: yapabildiğini
> bitir, kalanı kullanıcı-adımları dosyasına yaz. Kararların hepsi `docs/kalanlar/KALANLAR.md` →
> "2.0 · 4 EKİM KARAR TURU"nda verilmiştir; çelişki görürsen o bölüm kazanır.
> **Paralel çalışan başka bir ajan var (G14 — şikayet sistemi).** Dosyalarına dokunma (§1).

## 0 · Önce oku (sırayla)

1. `docs/handover/2026-10-04-yan-ajan-ana-prompt.md` — **§1 "ÇALIŞMA KURALLARI" burada aynen
   bağlayıcı** (git pathspec, DB bağlantısı, migration akışı, edge function deploy, PowerShell
   backtick tuzağı, sır kuralı, kanıt kuralı, doğrulama komutları). Aşağıdaki iş tanımları da
   oradaki §2.5–§2.11'in güncel halidir; ayrıntı için orayı aç.
2. `docs/kalanlar/KALANLAR.md` §2.0 (16 karar) + §3 (tuzaklar) + §4 (zorunlu doğrulama).
3. `docs/handover/2026-10-04-yan-ajan-ilerleme.md` — ne bitti, ne kaldı. Her batch sonunda
   **bu dosyayı güncelle** (G14 ajanı da yazıyor; çakışırsan yalnız kendi bölümünü ekle).
4. `git status -sb` + `git log --oneline -8`. Takipsiz duran şunlar senin değil, bırak:
   `.agents/` · `ROADMAP.md` · `corteqs-ekstre-motoru/` · `maillogo.png` · `public/mail/` ·
   `skills-lock.json` · `sunuekleglobalSKILL.md` · `docs/plans/2026-09-29-ekstre-*`.

### ✅ ZATEN BİTTİ — yeniden yapma
U04 (b1b0cbae) · P02+P03 (20dd0b56, mig `20261004280000`) · W04–W06 (ac9d5ec7, b2fdc356,
a5888025) · G04+G05 · G11 · W03 · Komuta Merkezi arşivi.

## 1 · KOORDİNASYON (iki ajan, bir çalışma ağacı)

- **G14 ajanı (dokunma):** `group_reports` migration'ı, `group-*` SQL/TS,
  `src/components/whatsapp/*`, `src/pages/admin/AdminGruplarPage*`,
  `src/lib/admin-shell/group-moderation-api*`, `supabase/qa/group-*`,
  `docs/handover/2026-10-05-g14-*`.
- **Ortak dosyalar** (`KALANLAR.md`, `admin-updates/2026-10.ts`, `…yan-ajan-ilerleme.md`):
  🔴 pathspec dosya İÇİNDEKİ başkasının satırlarını korumaz. Commit öncesi `git diff -- <dosya>`;
  karışıksa yalnız kendi hunk'ını `git apply --cached --unidiff-zero` ile stage'le.
- **Migration damgası** (P04–P07 migration gerektirirse):
  `TS=20261005300000; while ls supabase/migrations/applied | grep -q "^$TS"; do TS=$((TS+10000)); done`
  (G14 ajanı `…200000` bandında çalışıyor).
- 🛑 **PUSH ETME.** Commit'ler yerelde kalır; koordinatör inceleyip push'lar.
- Bir batch = bir commit (pathspec'li, Türkçe, trailer'lı, sonuna
  `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`). Bitmeden diğerine geçme.
- ⚠️ `npm run check:dead` şu an KIRMIZI ve senin değil (`PhoneVerificationCard.tsx` +
  `phone-verification-api.ts` sayfaya bağlı değil). `npm run lint` ~29 hata
  `corteqs-ekstre-motoru/` içinde (takipsiz). Kendi dosyalarında yeni hata üretme.
- **Kendi yazdığını kendin onaylama:** kod/migration içeren batch'lerde ayrı inceleme turu
  (code-reviewer ajanı); yoksa raporda "yazan ve inceleyen aynı" de.

## 2 · İŞ SIRASI (hızlı/salt-okunurdan ağıra)

> ✅ **GÜNCELLEME (5 Ekim, ikinci ajan bitirdi) — şunları YENİDEN YAPMA:** §2.0 G14 düzeltmeleri
> (`3bf47622`, mig `20261005300000`) · §2.1 Stripe (`19c02b89`) · §2.2 K01+K04 (`569ac58b`) ·
> §2.7 kullanıcı-adımları ilk sürümü (`c43b985b`, `docs/handover/2026-10-05-kullanici-adimlari.md`)
> · ilerleme dosyası (`0910a336`).
> ✅✅ **İKİNCİ GÜNCELLEME (üçüncü ajan limit hatasıyla düşmeden önce bitirdi, commit'li):**
> P04 `a08e11c2` · P05 `6da5fc1e` · P06 `f8dc01bd` · P07 `55eefa16` · U01 `af7dd47e` ·
> G10c `9e2f01d3` · ilerleme `62a1d29d`. **BUNLARI YENİDEN YAPMA.**
> **KALAN İŞ YALNIZ SG (§2.6) + kullanıcı-adımları güncellemesi.**
> ⚠️ SG YARIM: çalışma ağacında COMMİTSİZ değişiklikler var (`nginx.conf.template`,
> `src/lib/redirects.test.ts`, `src/lib/use-seo-deps-contract.test.ts`, `src/pages/BlogPostPage.tsx`,
> `src/pages/May19IdeaPage.tsx`, `src/pages/SurveysPage.tsx`, takipsiz `src/pages/BlogPostPage.test.tsx`
> ve `docs/plans/2026-10-05-seo-geo-plani.md`). Önce `git diff` ile oku, plana karşı kontrol et,
> yarım kalanı tamamla ya da geri al; **körü körüne commit'leme.**
> 🔴 P05 bulgusu: `6da5fc1e` "geçerli service_role JWT herkese açık depoda" diyor. Ajan ağaçtan
> çıkardı ama **geçmişte ve uzakta hâlâ olabilir**; anahtar rotasyonu kullanıcıda (U01). Kullanıcı-adımları
> dosyasında bunun ÖNCELİKLİ madde olduğundan emin ol. Değeri hiçbir yere yazma.
> ~~**SENİN İŞİN, bu sırayla:** §2.3 P04–P07 → §2.4 U01 → §2.5 G10c → §2.6 SG →
> kullanıcı-adımları dosyasını SG deploy notu ve yeni bulgularla **güncelle** (yeniden yazma).
> Not: önceki ajan §2.0'daki deadlock düzeltmesini yalnız kod okumasıyla doğruladı; iki oturumlu
> gerçek eşzamanlı onay denemesi yapılmadı. Vaktin kalırsa bunu (geri alınan işlemde, iki
> oturum) kanıtla ve ilerleme dosyasına yaz.

### 2.0 · G14 İNCELEME DÜZELTMELERİ + KAPANIŞ TEMİZLİĞİ  *(ÖNCE bunu bitir, tek commit)*
G14 `ea40f63e` commit'lendi (migration `20261005200000_group_reports.sql` CANLIDA). Bağımsız
`code-reviewer` turu 0 kritik/0 yüksek, 2 orta + 1 düşük buldu. **Uygulanmış migration dosyasını
DÜZENLEME** — düzeltmeler yeni migration + TS.
1. **Orta · kilitlenme:** `review_group_report_v1` upheld yolu yalnız tıklanan şikayeti `FOR
   UPDATE` ile kilitleyip sonra grubun TÜM açık şikayetlerini güncelliyor; iki moderatör aynı
   grubun farklı şikayetlerini aynı anda onaylarsa deadlock. Düzelt: `submit_group_report_v1`
   gibi önce `whatsapp_landings` satırını kilitle (grup bazlı serileştirme). Fonksiyonu
   `create or replace` ile yeniden tanımla, **gövdenin geri kalanı birebir aynı kalsın**. Kabul:
   iki oturumla gerçek eşzamanlı onay → kilitlenme YOK (önce eski sürümde göstermeye çalış).
2. **Orta · ASCII kuralı:** aynı fonksiyonda `coalesce(v_note, 'Onaylanan şikayet')` Türkçe 'ş'
   taşıyor; migration'ın diğer notları ASCII. Yeni migration'da `'Onaylanan sikayet'` yap ve
   `supabase/qa/group-motor-acceptance.sql` ~satır 566'daki iddiayı güncelle. (Mevcut
   `group_strikes.reason` satırlarına DOKUNMA.)
3. **Düşük:** `src/hooks/useGroupReports.ts:29` hata tipi `Error` → `GroupReportError`.
4. **Doğrulama:** kabul 13/13 hâlâ yeşil · tam takım · `tsc` · `ingest:tools:check` (G14 ajanı
   bunları son docs değişikliğinden sonra yeniden koşmadı) · `check:migrations`.
5. **Unutulan temizlik:** `docs/handover/2026-10-04-yan-ajan-ilerleme.md` hâlâ G14'ü "sırada"
   gösteriyor → G14 ✅ (ea40f63e) yaz, kalan listesini güncelle. W04 migration'ının
   (`20261005100000`) `schema_migrations` satırı eksikti, G14 ajanı elle ekledi: ilerleme
   dosyasına not düş.
6. **Karar BEKLEYEN, dokunma:** G14'ün 4 tasarım kararı (kendi grubu yasak · tek onay = tek
   ihlal · onaydan sonra grup gizli kalır, Politika §7 ↔ tasarım §2 çelişkisi · mail yok)
   `docs/handover/2026-10-05-g14-kullanici-adimlari.md`'de kullanıcıya sorulmayı bekliyor.
   Kendin karar verme. Ayrıca G16 güvenilir üye kuralı ve G17 sağlık skoru hâlâ `group_reports`'a
   bakmıyor — ayrı küçük batch, bu turda YAPMA, ilerleme dosyasına "KALAN" yaz.

### 2.1 · Stripe — yalnız DÜZELTME + RAPOR  *(~30 dk, kod YOK)*
`docs/plans/2026-10-04-stripe-odeme-altyapisi-plani.md` hâlâ "Kurucu 1000 = 99 €" diyor.
Karar 9: ürün modeli **`/pricing`** = 3 kademe × aylık/yıllık = 6 abonelik fiyatı + 3 Freemium
(Danışman Pro 25/20 € · Kuruluş Pro 50/40 € · İşletme Pro 75/60 €, yinelenen abonelik). Karar 10:
**yalnız EUR, AB + Türkiye.** Planı düzelt (Faz 1 veri modeli recurring + 6 price; "99 €" ayrı
kampanya). `MockStripeCheckout` iki gerçek yerde (`PremiumProfileTabs.tsx`,
`ServiceRequestForm.tsx`) kullanıcıya "ödeme başarılı" diyor: ekranda ne görüldüğünü **raporla**,
kodu değiştirme. Faz 1–7 ⛔ U11 (S01 hesap, S02 vergi kullanıcıda).

### 2.2 · K01 + K04 — HAZIRLIK DOSYASI  *(~45 dk, KOD/MIGRATION/CANLI YAZIM YOK)*
Burak "anlamadım" dedi; görevin **anlaşılır, teknik olmayan** açıklama.
- **K01 (Cadde ana sayfa sıralaması):** `CaddePage.tsx` yorumu (05.08) sağ kolon diyor, T18
  (27.08) akışın üstü. İki seçeneği ekran görüntüsü (Chrome araçları varsa) ya da adım adım
  tarifle göster. Karar sorusu en altta, tek cümle.
- **K04 (Cadde davet kodu):** 🔴 soru değil, **canlıda duran kusur**: profildeki davet kodu
  alanı ters yönde çalışıyor (#1731, "kullanıcının kendi kodu diye bir şey yok"). Önce kodu ve
  canlı veriyi OKU/ÖLÇ (yazma yok), kusuru sade dille anlat, sonra "düzeltelim mi / alanı
  kaldıralım mı" sor. "Park = kusur yok" izlenimi verme.
- Çıktı: `docs/plans/2026-10-05-k01-k04-karar-hazirligi.md`.

### 2.3 · P04, P05, P06, P07  *(karar 13: hepsi onaylı; plan `.kilo/plans/1790537630793-tidy-cactus.md`)*
Her biri kendi commit'i. Ölçüm "sorun yok" çıkarsa bunu da kanıtla yaz.
- **P04:** `lansman-admin` + `relocation-notifications` yetki okuması; eksikse fonksiyon içi
  admin kapısı + **deploy** (`lansman-admin` zaten HTTP 410 deprecated — önce ölç). Deploy sonrası
  `check:functions` sapma 0, canlı `verify_jwt` ölç. `verify_jwt` yetki DEĞİLDİR.
- **P05:** git geçmişi secret taraması (`gitleaks` yoksa `git log -S 'eyJ'` / `sb_secret`).
  🔴 **Çıktıda secret DEĞERİ yazdırma** — yalnız dosya + commit hash + sayı + "düzeltilmeli mi".
- **P06:** Türkçe collate ölçümü (`collate "tr-TR-x-icu"`), yalnız küçük tablolarda.
  🔴 Canlı instance <1 GB RAM: satır başına fonksiyon çalıştıran keşif sorgusu YASAK; önce
  `select distinct`, sonra join.
- **P07:** bucket MIME (A09a) · A10b · A11a/b RPC migration · A12b deploy · A99 Radar.
  KALANLAR'da her birinin tanımını bul; tanım yoksa/bayatsa **uydurma, raporla**.

### 2.4 · U01 — service role anahtarı  *(SPIKE; ROTASYON YAPMA)*
Karar 12: önce edge function'lar yeni anahtar düzenine taşınır, sonra rotasyon. 🔴 "3 fonksiyon
düşer" iddiası doğrulanmadı: `SUPABASE_SERVICE_ROLE_KEY` okuyan **14** fonksiyon var
(directory-search, find-matches, group-claim-verify, group-link-health, group-preview,
lansman-admin, radar-news-scan, relocation-assistant, relocation-notifications,
send-notification-emails, send-submission-email, site-assistant, submit-survey-response,
whatsapp-webhook; `whatsapp-autoreply` de eklendi — say). Hangisinin **gerçekten legacy JWT
anahtarına bağlı** olduğunu ÖLÇ (M27 dersi: `sb_secret_` REST'te çalıştı ama `auth.admin`
API'de 401 verdi). Çıktı: `docs/plans/2026-10-05-u01-anahtar-gecisi-spike.md` — hangi fonksiyon,
hangi çağrı yolu, geçiş sırası, doğrulama komutları. Taşımayı yalnız kanıtlanabilir ve geri
alınabilir ise yap. 🔴 **"Disable JWT-based API keys" düğmesine ASLA basma.**

### 2.5 · G10c — yalnız ONAY TALEBİ HAZIRLA  *(karar 11: KOŞMA)*
Kolon düşürmek geri alınamaz. `docs/plans/2026-10-05-g10c-onay-talebi.md`: düşürülecek kolonlar,
her birini okuyan kod/RPC/view/trigger (ölç: `pg_depend`, kod grep), veri göçünün tamam olduğunun
kanıtı (G11 sonrası legacy `country/city` metni DURUYOR — silinecekse ne olacağı), geri alma
planı, önce/sonra ölçüm komutları. **Çalıştırma.**

### 2.6 · SG (SEO/GEO) — 🔴 PLAN REPODA YOK, önce planı yaz  *(en ağır, sona)*
Devir notu "SG01–SG08 plan hazır" diyor ama dosya yok (`grep SG01` yalnız devir notunda çıkıyor).
Kaynaklar: `docs/audits/2026-08-04-seo-geo-audit.md` ·
`docs/history/completed-plans/corteqs-seo-geo-plan-v2.md` ·
`docs/plans/2026-09-20-public-rotalar-sitemap-plani.md` (kapalı). 20.09 Ahrefs denetiminin 97
bulgusunun tek kök nedeni `index.html` sabit canonical'iydi (9093a5e).
- Adım 1: **canlıyı ölç** (`corteqs.net`: canonical, sitemap, hreflang, robots, 404, başlıklar),
  `docs/plans/2026-10-05-seo-geo-plani.md` yaz. Uydurma bulgu yok; her madde ölçümle.
- Adım 2: yalnız ölçülmüş, kanıtlı kusurları kapat. Karar 8: 🔴 **`index.html` JSON-LD'ye
  DOKUNULMAZ** (12 soruluk FAQPage, `Offer` 99 EUR, sabit `dateModified`, "164 ülkede 8,8
  milyon", `foundingDate`, `SearchAction`) — planda "yalnız rapor" başlığı altında listele.
- Değişmez sözleşmeler (CLAUDE.md): yönlendirme üç dosyada birlikte (`redirects.ts` +
  `nginx.conf.template` + `App.tsx`) · nginx `add_header` KALITILMAZ · CSP `script-src`'e
  `'unsafe-inline'` YOK · sitemap'e rota eklemeden 3 kriter · `server_name _` joker DEĞİL.
  `redirects.test.ts` / `seo.test.ts` / `generate-sitemap.test.mjs` gevşetilmez.
- nginx/CSP değişikliği çalışan nginx'te doğrulanamıyor → deploy sonrası `curl -I` kontrolünü
  kullanıcı-adımları dosyasına yaz.

### 2.7 · KULLANICI-ADIMLARI DOSYASI  *(en sona, ama sürekli beslen)*
`docs/handover/2026-10-05-kullanici-adimlari.md`. Mevcut `…g04-g05-kullanici-adimlari.md` ve
`…2026-10-05-w-kullanici-adimlari.md` varsa **birleştir/bağla, çoğaltma** (G14 ajanı kendi
`g14-kullanici-adimlari.md` dosyasını yazıyor, ona dokunma, yalnız bağla). Her madde: ne · neden
bloke · adım adım (panel ekranı) · sonra hangi komutla doğrulanır. İçerik: U09 (5 Meta secret,
kalıcı sistem kullanıcısı token'ı) + W01/W02/W07/W08 · U06 (SMS sağlayıcı; Twilio üçü BOŞ) ·
G05 kararı · U03 (iki gerçek mail testi) · U11/S01–S02 (Stripe hesabı + vergi) · K07 · K12 ·
repo dışı ~50 madde teyidi · kök dosyalar (`maillogo.png`, `ROADMAP.md`,
`sunuekleglobalSKILL.md`) · G10c onayı · K01/K04 kararları · Stripe Faz 1+ başlatma · SG deploy
sonrası `curl -I` kontrolü.

## 3 · DOĞRULAMA ve KAPANIŞ
Her kod/migration batch'inde: `npx tsc -p tsconfig.app.json --noEmit` · `npm run test` (TAM
takım) · `npm run verify:text` (eksik Türkçe harfi YAKALAMAZ — gözle bak) ·
`npm run check:migrations` (ledger ELLE) · `npm run ingest:tools:check` (src/lib değiştiyse).
Kapanış: admin-updates'e düz Türkçe giriş (kullanıcıya görünen ne varsa) · KALANLAR'da ✅ + kanıt
satırı → Kapananlar · ilerleme dosyası güncel.

## 4 · FİNAL RAPOR
1. Yapılanlar: batch başına commit hash + kabul N/N + mutasyon N/6 (varsa) + canlı kanıt.
2. **KANITLANAMAYANLAR** açıkça. "Doğrulandı" yazma.
3. Ölçümün çürüttüğü öncüller ("99 €", "3 fonksiyon", "SG planı hazır" gibi).
4. Kendi hataların. 5. Push edilmedi; hash'leri listele. 6. Kullanıcı-adımları dosyasının yolu.

> Kanıtsız "bitti" demektense kanıtlı "yapılamadı" yaz.
