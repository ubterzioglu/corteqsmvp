# YAN AJAN ANA PROMPT'U — kalan TÜM işler (4 Ekim 2026 gece)

> **Kime:** CorteQS reposunda (c:\temp_private\corteqs\corteqs_fin) çalışacak yürütücü ajan.
> **Kullanıcı hasta ve ulaşılamaz.** Karar gerektiren yerde DURMA: yapabildiğini bitir, kalanı
> kullanıcı-adımları dosyasına yaz. Kullanıcı bu bölümdeki **hiçbir karar için yeniden onay
> istemez** — hepsi `docs/kalanlar/KALANLAR.md` → "2.0 · 4 EKİM KARAR TURU"nda verilmiştir.
> Çelişki görürsen o bölüm kazanır.

---

## 0 · BAŞLAMADAN ÖNCE (sırayla, atlama)

1. `docs/kalanlar/KALANLAR.md` §2.0 (16 karar) + §3 (tuzaklar) + §4 (zorunlu doğrulama).
2. `git status -sb` ve `git log --oneline -8`. **Paralel oturumlar çalışma ağacını paylaşıyor.**
   Başkasının yarım dosyasına DOKUNMA. Takipsiz duran şunlar senin değil, bırak:
   `.agents/` · `ROADMAP.md` · `corteqs-ekstre-motoru/` · `maillogo.png` · `public/mail/` ·
   `skills-lock.json` · `sunuekleglobalSKILL.md` · `docs/plans/2026-09-29-ekstre-*`.
3. Aşağıdaki "ZATEN BİTTİ" listesini oku — **yeniden yapma**.

### ✅ ZATEN BİTTİ (04.10) — tekrar etme
W03 (canlı v19) · G04 + G05 (mig `20261004270000`, `phone-verification-api.ts`,
`PhoneVerificationCard.tsx`) · G11 + G11c + K11 (mig `20261004260000`) · Komuta Merkezi arşivi
(495→56) · özgeçmiş dosyaları silindi · 90 günlük erişim logu incelemesi · haftalık şehir özeti
anahtarı AÇILDI · `caddelogo.png` arşive taşındı · Stripe planı yazıldı.

⚠️ G04/G05'i yapan ajan KALANLAR + admin-updates kapanış satırlarını **hâlâ yazıyor olabilir**
(çalışma ağacında yarım diff görürsen). O hunk'ları ASLA kendi commit'ine alma.

---

## 1 · ÇALIŞMA KURALLARI (bu repoda yaşanmış tuzaklar — ihlal etme)

**Kapsam:** Bir batch = bir commit. Bir batch bitmeden diğerine geçme. Kanıt = commit hash,
ölçülmüş sayı, SQL çıktısı, canlı HTTP kodu. **"Yaptım" kanıt değildir.**

**Kendi yazdığını kendin onaylama.** Her batch'ten sonra bağımsız bir inceleme turu yap
(mümkünse ayrı bir ajan/`code-reviewer`; yoksa mutasyon turunu bağımsız betikle koş ve raporda
"yazan ve inceleyen aynı ajan" diye açıkça belirt). W03'te bağımsız inceleme gerçek bir boşluk
buldu (tek-istemci kilidi yalnız `index.ts` tarıyordu).

**Git:**
- Commit HER ZAMAN pathspec'li: `git commit -m "..." -- <yalnız senin dosyaların>`.
- 🔴 **Pathspec aynı dosyanın İÇİNDEKİ başkasının satırlarını KORUMAZ.** Ortak dosyada
  (KALANLAR.md, admin-updates/2026-10.ts) commit öncesi `git diff -- <dosya>` ile yalnız
  kendi hunk'larının olduğunu doğrula. Karışıksa `git diff -U0` ile kendi hunk'ını çıkarıp
  `git apply --cached --unidiff-zero` ile yalnız onu stage'le.
- Commit mesajı Türkçe, conventional + trailer'lar (`Constraint:` `Rejected:` `Directive:`
  `Confidence:` `Scope-risk:` `Not-tested:`). Sonuna `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Push öncesi `git status -sb` + **tam takım**. Başkasının commit'i "ahead" içindeyse onu
  incelemeden push'lamak yerine raporda belirt.

**DB (çalışıyor):**
```bash
PW=$(grep -E '^SUPABASE_DB_PASSWORD=' .env.local | cut -d= -f2- | tr -d '\r')
PGPASSWORD="$PW" psql -h aws-1-eu-west-2.pooler.supabase.com -p 6543 \
  -U postgres.injprdrsklkxgnaiixzh -d postgres -f <dosya>
```
Bash'te `dangerouslyDisableSandbox: true` şart. `aws-1` (aws-0 DEĞİL). Türkçe SQL'i `-c` ile
DEĞİL `-f` ile gönder. 🔴 **Canlı instance <1 GB RAM:** satır başına fonksiyon çalıştıran keşif
sorgusu YASAK (`geo_cities` 76.992 satır). Önce `select distinct`, sonra join.

**Migration:** yaz → `psql -f` ile uygula → `supabase/migrations/applied/` altına koy →
`schema_migrations` satırını **ELLE** ekle (`psql -f` yazmaz) → `npm run check:migrations`
sapmasız olmalı. Damgayı SABİT yazma:
`TS=20261004280000; while ls supabase/migrations/applied | grep -q "^$TS"; do TS=$((TS+10000)); done`
(şu an en yüksek `…270000`; paralel oturumlar aynı saniyeyi iki kez aldı).

**Edge function:** commit ≠ canlı. `npx supabase functions deploy <ad> --project-ref
injprdrsklkxgnaiixzh` (sandbox kapalı) → `npm run check:functions` sapma 0 → canlı
`verify_jwt` değerini **ÖLÇ** (Management API `GET /v1/projects/<ref>/functions`) →
smoke çağrıları. **`verify_jwt` yetki DEĞİLDİR** — anon anahtar geçerli bir JWT'dir, gateway'den
geçer; reddi fonksiyonun kendisi yapar. 🔴 `anon`'un `admin_*` RPC'lerinde EXECUTE'u **YOK**
(KS03) → anon ile çağrı 403 `admin_required` değil **409 `reply_not_allowed`** döner. Yetkiyi
eski belgeden değil `has_function_privilege`'den al.

**Yazarken:**
- 🔴 **PowerShell çift tırnaklı dizeyle backtick içeren markdown YAZMA** (kod işaretleri silinir,
  ayar adları bozulur). `Write` aracı veya tek tırnaklı here-string kullan; yazdıktan sonra
  backtick sayısını doğrula. `[IO.File]::WriteAllText` + Python tercih et.
- Arayüz metinleri Türkçe (`trIncludes`/`trUpper`), kod İngilizce. `npm run verify:text` eksik
  Türkçe harfi YAKALAMAZ — gözle kontrol et. DB'ye yazılan değerden Türkçe karakter SİLME.
- `as TablesInsert<...>` cast YOK (`satisfies`). `instanceof Error` ile RPC hatasını daraltma.
- Yeni `*-api.ts` + React Query; bileşende doğrudan `supabase.from()` YOK.
- Kabul iddiasında **beklenen sayıyı yazmadan önce kümeyi SAY** ("1 olmalı" denip 5 geldi).
- Kabul testini ÖNCE koş (kırmızı olmalı), SONRA uygula (yeşil). Kırmızı yoksa test boştur.
- Mutasyon düzeneği "betik patladı" ile "iddia düştü"yü AYIRT etmeli: özet satırına
  ("TUMU YAKALANDI") bak, "FAIL" yokluğuna değil. Mutasyonun gerçekten uygulandığını
  doğrula (CRLF/kalıp bulunamadı → sahte "geçti"). Yedeği `/tmp`'ye değil scratchpad'e al.
- 🔴 **Sır asla:** token/secret'ı sohbete, commit'e, log'a, dosyaya YAZMA. Alan "DOLU/BOŞ" de,
  değeri yazma. `WHATSAPP_*` beşi **yer tutucu**.
- Toplu grup işlemlerinde `corteqs.skip_group_notify='on'` işlem-yerel aç — yoksa
  `group_moderation_log` trigger'ı gerçek kişilere mail kuyruklar.

**Doğrulama (her batch):**
```bash
npx tsc -p tsconfig.app.json --noEmit
npm run test                # TAM takım — yalnız ilgili dosya yetmez
npm run lint                # ⚠️ ~29 hata corteqs-ekstre-motoru/ içinde (takipsiz, senin değil)
npm run check:dead && npm run verify:text && npm run check:migrations
npm run ingest:tools:check  # src/lib/** değiştiyse
```
Kapanışta: `src/lib/admin-shell/admin-updates/2026-10.ts`'e düz Türkçe giriş (kullanıcıya görünen
ne varsa) + KALANLAR'da ✅ + kanıt satırı → **Kapananlar** tablosuna taşı.

**İlerleme günlüğü:** bağlamın dolmadan, her batch sonunda
`docs/handover/2026-10-04-yan-ajan-ilerleme.md`'yi güncelle (yapılan / kalan / engeller).
Bağlam biterse sonraki ajan oradan devam eder.

---

## 2 · İŞ SIRASI

Sıra risk ve bağımlılığa göre. Her kalem: **kapı → ne → kabul → kanıtlanamayan**.

### 2.1 · U04 — etkinlik planındaki 16 kanıtsız ✅ → 🔒  *(küçük, önce bunu bitir)*
- Dosya: `docs/plans/2026-09-20-etkinlik-modulu-plani.md` (+ `…-etkinlik-kalan-isler.md` varsa
  onda da bak). Karar 7: kullanıcı yaptığını hatırlamıyor → **🔒** ("auth gerektiriyor, test
  hesabı gerekli"). **Yalan yeşil kırmızıdan tehlikelidir.**
- Önce **16'yı kendin tespit et** (✅ olup yanında kanıt — commit/ölçüm/HTTP — olmayan satırlar).
  Sayı 16 çıkmazsa gerçeği yaz, uydurma. Silme, yalnız işaret değiştir + not düş.
- Kabul: işaretlenen satır sayısı = tespit edilen küme; kanıtlı ✅'lere DOKUNULMADI.

### 2.2 · P02 → P03 — anon grant denetimi, sonra iletişim bilgisi kararının uygulanması
- Plan: `.kilo/plans/1790537630793-tidy-cactus.md` (P02–P07). **Karar 13: hepsi onaylı.**
- **P02 (salt-okunur):** canlı `anon` EXECUTE grant'leri (özellikle
  `get_catalog_item_public_page_v2`, `get_public_catalog_item_profile`, `search_catalog`,
  `list_public_directory_profiles`, `search_directory_catalog`) ve hangi kolonları döndükleri.
  `has_function_privilege` + gövde okuma ile **ölç**; "4 ölçülemeyen nokta"yı kapat.
- **P03 (karar 5 — UYGULA):** herkese açık profilde `is_public` iletişim: **website anonime AÇIK,
  kişisel veri KAPALI.** Ölçüm (04.10): `catalog_item_contacts` 326 `is_public` kayıt = **312
  website + 11 whatsapp + 1 email + 1 phone + 1 appointment_url**. Kişisel veri **13**
  (whatsapp/email/phone) → **yalnız girişli üyeye**. `appointment_url` kişisel değil (iş bağlantısı)
  → website gibi AÇIK say, rapora yaz. Dizin aramasındaki ilkenin aynısı:
  `catalog_search_documents.search_text` **iletişim değeri taşır → aramada KULLANILMAZ**
  (enumeration yüzeyi). Anonim yoldan dönen HER fonksiyonu kapsa; tek birini unutmak sızıntıdır.
- Kabul: **anon HTTP isteğiyle** (gerçek PostgREST/RPC çağrısı) 13 kişisel kayıt görünmüyor, 312
  website görünüyor · girişli üyede 13 görünüyor · geri alınan işlem testi `supabase/qa/` altında ·
  mutasyon ≥6 · `search_directory_catalog` regresyonsuz (21.09 sözleşmesi: anon açık, 7 argüman).
- ⚠️ "Önce SONRA" kanıtı: değiştirmeden ÖNCE anon isteğiyle sızıntıyı gerçekten göster.

### 2.3 · W04 → W05 → W06 — WhatsApp botu otomatik yanıt  *(W03 canlı; sıra kilidi gevşedi)*
- Şartname: KALANLAR **"W — WhatsApp botu"** (üç değişmez kısıt dahil). **Burada tekrar
  yazılmayan ama bağlayıcı:** kitle `["public"]` SABİT · Meta hızlı 200 bekler → yanıt üretimi
  AYRI fonksiyonda · bot yazdığı mesaj admin RPC'sinden geçemez.
- **Ölçülen taban (04.10):**
  - `whatsapp_bot_settings` tablosu **YOK**. `whatsapp_customer_messages` kolonları:
    id, thread_id, direction, provider_message_id, message_type, body, template_name,
    template_language, delivery_status, error_code, provider_timestamp, created_by, created_at,
    expires_at → **`is_automated` YOK** (W04 ekler).
  - Hız limiti için **yeni tablo YAZMA**: `edge_rate_limits` (scope, client_key,
    window_started_at, request_count) var → `client_key = wa_id_hash`.
  - 🔴 **Public korpus = yalnız `blog`: 91 belge** (hepsinin embedding'i dolu). `catalog`
    (474) ve `docs-member` (85) **member**, `docs-admin` (4.901) + `admin-menu` (92) **admin** —
    **WhatsApp'a AÇILAMAZ.** 91 belgelik korpusla bot dar kalır; bu bir kusur değil, bilinen sınır.
    Sınırı W07 notlarına yaz, korpusu genişletmek için kitle filtresini GEVŞETME.
  - W03: `_shared/whatsapp-graph.ts` canlıda (`sendGraphMessage`, `resolveGraphVersion`).
    **İkinci Graph istemcisi YAZMA** — "tek istemci" kilidi tüm `supabase/functions/**/*.ts`'i
    tarıyor ve düşer.
- **W04 (migration, geri alınamaz → dikkat):** `is_automated` · `bot_prepare_whatsapp_reply` /
  `bot_finalize_whatsapp_reply` (`admin_*` çiftinin service_role karşılığı; **yönetici çiftine
  DOKUNMA**; grant yalnız `service_role`; `anon`/`authenticated` çağıramıyor) ·
  `whatsapp_bot_settings` tek satır (`enabled` · `model` · `max_replies_per_sender_per_day` ·
  `handover_keywords` · `fallback_message`). **`enabled=false` DOĞAR.**
- **W05:** saf mantık `_shared/whatsapp-autoreply.ts` (Deno API'siz → vitest'te test edilir).
  Mevcut parçaları yeniden kullan: `ai_knowledge_search` RPC · `_shared/ai-assistant-context.ts` ·
  `providers.ts` `callModel` · `assistant-usage.ts` (`functionName: "whatsapp-autoreply"`).
  `resolveAudiences()` KULLANMA. **WhatsApp promptu AYRI**: düz metin, tek `*yıldız*`, ≤600
  karakter (sert tavan 4000). Bağlam yoksa uydurma yok → `fallback_message` + insana devir.
- **W06:** `whatsapp-webhook` olayı yazdıktan SONRA `whatsapp-autoreply`'ı ateşler ve
  **beklemez** (`EdgeRuntime.waitUntil`). **İmza doğrulama yolu DEĞİŞMEZ.** Yalnız
  `inbound_message` + metin tetikler. `config.toml`'a `[functions.whatsapp-autoreply]
  verify_jwt = false` + kendi paylaşımlı secret'ı (üret, `supabase secrets set` ile gir,
  **değeri yazdırma**). Deploy sonrası `check:functions` **16/16**, canlı `verify_jwt=false` ölçülmüş.
- **Güvenlik varsayımı:** secret'lar yer tutucu + `enabled=false` iken bu hat **hiçbir şey
  göndermez** — deploy güvenlidir. `enabled`'ı ASLA `true` yapma (U09 + W02 sonrası insan kararı).
- **Kanıtlanamayan:** Meta'ya gerçek gönderim, gerçek webhook davranışı. Karar 1 bunu
  **bilinçli risk** olarak kabul etti (düzeltme turu beklenir). W07/W08 (gerçek telefon, panel)
  **kullanıcı-adımları dosyasına** yazılır, sen yapma.

### 2.4 · G14 — şikayet akışı  *(G04 aynası canlı → artık yazılabilir)*
- Şartname: KALANLAR G bölümü (G14) + `docs/dijital-gruplar/` politika. İş kuralı UYDURMA.
- Kabul testi "telefonu doğrulanmış hesap" ister. Gerçek SMS yok → **geri alınan işlemde**
  `auth.users.phone_confirmed_at` yazdırıp G04'ün aynalama trigger'ının `user_verifications`
  satırı açtığını kullan (G04 kabulü aynı fixture'ı kullanıyor — `supabase/qa/phone-otp-acceptance.sql`).
- `group_reports` sıfırdan. G24 moderatör panelinin şikayet sekmesi bilerek boş duruyor
  (`pending_reports` sabit 0, fonksiyon `group_reports`'a bakamıyor) → **onu da bağla** ve
  `group-motor-acceptance.sql`'deki #6 tripwire'ı (group_reports ortaya çıkınca QA kızarır)
  gerçek senaryoya çevir. G20'de bilerek çizilmeyen "Şikayet et" düğmesini ekle.
- **Kanıtlanamayan:** gerçek telefonla uçtan uca (U06). Açıkça yaz.

### 2.5 · P04, P05, P06, P07  *(karar 13: hepsi onaylı)*
Plan: `.kilo/plans/1790537630793-tidy-cactus.md`.
- **P04:** `lansman-admin` + `relocation-notifications` yetki okuması; eksikse fonksiyon içi admin
  kapısı + **deploy**. (`lansman-admin` zaten HTTP 410 deprecated — önce ölç.)
- **P05:** git geçmişi secret taraması (`gitleaks` yoksa `git log -S 'eyJ'` / `sb_secret`).
  🔴 **Çıktıda secret DEĞERİ yazdırma** — yalnız dosya + commit hash + sayı + "düzeltilmeli mi".
- **P06:** Türkçe collate ölçümü (`collate "tr-TR-x-icu"`). Küçük tablolarda ölç.
- **P07:** bucket MIME (A09a) · A10b · A11a/b RPC migration · A12b deploy · A99 Radar.
  KALANLAR'da her birinin tanımını bul; tanım yoksa/bayatsa **uydurma, raporla**.
- Her biri kendi commit'i. Ölçüm sonucu "sorun yok" çıkarsa bunu da kanıtla yaz.

### 2.6 · K01 + K04 — HAZIRLIK DOSYALARI  *(karar 14: KOD DEĞİŞTİRME)*
Burak ikisine de "anlamadım" dedi çünkü soru teknik yazılmıştı. Görevin **anlaşılır bir açıklama**.
- **K01 (Cadde ana sayfa sıralaması):** `CaddePage.tsx` yorumu (05.08) sağ kolon diyor, T18 (27.08)
  akışın üstü. İki seçeneği **ekran görüntüsü** (Chrome araçları varsa) ya da adım adım
  tarifle göster. Nontechnical dil. Karar sorusu en altta, tek cümle.
- **K04 (Cadde davet kodu):** 🔴 Bu soru değil, **canlıda duran kusur**: profildeki davet kodu
  alanı ters yönde çalışıyor (#1731, "kullanıcının kendi kodu diye bir şey yok"). Önce kodu ve
  canlı veriyi **oku/ölç** (yazma yok), kusuru sade dille anlat, sonra "düzeltelim mi / alanı
  kaldıralım mı" sor. "Park = kusur yok" izlenimi vermeyecek.
- Çıktı: `docs/plans/2026-10-0X-k01-k04-karar-hazirligi.md`. **Kod, migration, canlı yazım YOK.**

### 2.7 · SG (SEO/GEO) — 🔴 PLAN REPODA YOK, önce planı yaz
- Devir notu "SG01–SG08 plan hazır" diyor ama **dosya yok** (`grep SG01` yalnız devir notunda
  çıkıyor). Mevcut kaynaklar: `docs/audits/2026-08-04-seo-geo-audit.md` ·
  `docs/history/completed-plans/corteqs-seo-geo-plan-v2.md` ·
  `docs/plans/2026-09-20-public-rotalar-sitemap-plani.md` (kapalı). Hafıza: 20.09 Ahrefs
  denetiminin 97 bulgusunun tek kök nedeni `index.html` sabit canonical'iydi (9093a5e).
- Adım 1: **canlıyı ölç** (`corteqs.net`: canonical, sitemap, hreflang, robots, 404, başlıklar) ve
  `docs/plans/2026-10-0X-seo-geo-plani.md` yaz. Uydurma bulgu yok; her madde ölçümle.
- Adım 2: yalnız **ölçülmüş, kanıtlı kusurları** kapat. Karar 8: 🔴 **`index.html` JSON-LD'ye
  DOKUNULMAZ** (CLAUDE.md "yalnız raporla, DEĞİŞTİRME": 12 soruluk FAQPage, `Offer` 99 EUR,
  sabit `dateModified`, doğrulanamayan "164 ülkede 8,8 milyon", `foundingDate`, `SearchAction`).
  Bunları planda **"yalnız rapor"** başlığı altında listele.
- **Değişmez sözleşmeler (CLAUDE.md "Değişmez sözleşmeler"):** yönlendirme üç dosyada birlikte
  (`redirects.ts` + `nginx.conf.template` + `App.tsx`) · nginx `add_header` KALITILMAZ ·
  CSP `script-src`'e `'unsafe-inline'` YOK · sitemap'e rota eklemeden 3 kriter · `server_name _`
  joker DEĞİL. `redirects.test.ts` / `seo.test.ts` / `generate-sitemap.test.mjs` gevşetilmez.
- ⚠️ nginx/CSP değişikliği çalışan nginx'te doğrulanamıyor (yalnız metin testi) → deploy sonrası
  `curl -I` kontrolünü **kullanıcı-adımları dosyasına** yaz.

### 2.8 · U01 — service role anahtarı  *(SPIKE; ROTASYON YAPMA)*
- Karar 12: önce edge function'lar yeni anahtar düzenine taşınır, sonra rotasyon.
- 🔴 **"3 fonksiyon düşer" iddiası doğrulanmadı:** `SUPABASE_SERVICE_ROLE_KEY` okuyan **14**
  fonksiyon var (directory-search, find-matches, group-claim-verify, group-link-health,
  group-preview, lansman-admin, radar-news-scan, relocation-assistant, relocation-notifications,
  send-notification-emails, send-submission-email, site-assistant, submit-survey-response,
  whatsapp-webhook). Hangisinin **gerçekten legacy JWT anahtarına bağlı** olduğunu ÖLÇ
  (M27 dersi: `sb_secret_` anahtarı REST'te çalıştı ama `auth.admin` API'de 401 verdi).
- Çıktı: `docs/plans/2026-10-0X-u01-anahtar-gecisi-spike.md` — hangi fonksiyon, hangi çağrı yolu,
  geçiş sırası, doğrulama komutları. Taşımayı yalnız **kanıtlanabilir ve geri alınabilir** ise yap.
- 🔴 **"Disable JWT-based API keys" düğmesine ASLA basma** (panel eylemi, kullanıcıya ait;
  yanlış sırada 3+ fonksiyonu düşürür).

### 2.9 · Stripe — yalnız DÜZELTME + RAPOR  *(Faz 1–7 ⛔ U11)*
- `docs/plans/2026-10-04-stripe-odeme-altyapisi-plani.md` hâlâ **"Kurucu 1000 = 99 €"** diyor.
  Karar 9: ürün modeli **`/pricing`** = 3 kademe × aylık/yıllık = 6 abonelik fiyatı +
  3 Freemium (Danışman Pro 25/20 € · Kuruluş Pro 50/40 € · İşletme Pro 75/60 €, hepsi yinelenen
  abonelik). Karar 10: **yalnız EUR, AB + Türkiye.** Planı buna göre düzelt (Faz 1 veri modeli
  recurring + 6 price). "99 €" bir kampanya olarak sonra, ayrı.
- `MockStripeCheckout` bugün **iki gerçek yerde** (`PremiumProfileTabs.tsx`,
  `ServiceRequestForm.tsx`) kullanıcıya "ödeme başarılı" diyor. Her iki yerde kullanıcının ekranda
  tam olarak ne gördüğünü **raporla** (kod değiştirme).
- **Kod YAZMA.** S01 hesap, **S02 vergi (profesyonel teyit)** kullanıcıda.

### 2.10 · G10c — yalnız ONAY TALEBİ HAZIRLA  *(karar 11: koşma)*
Kolon düşürmek geri alınamaz. `docs/plans/2026-10-0X-g10c-onay-talebi.md` yaz: düşürülecek kolonlar,
her birini okuyan kod/RPC/view/trigger (ölç: `pg_depend`, kod grep), veri göçünün tamam olduğunun
kanıtı (G11 sonrası legacy `country/city` metni DURUYOR — silinecekse ne olacağı), geri alma planı,
**önce/sonra ölçüm komutları**. **Çalıştırma.**

### 2.11 · KULLANICI-ADIMLARI DOSYASI  *(en sona, ama sürekli beslen)*
`docs/handover/2026-10-0X-kullanici-adimlari.md` — kullanıcı sağlığına kavuşunca tek bakışta
yapabilsin. Mevcut `…g04-g05-kullanici-adimlari.md` varsa onu **birleştir, çoğaltma**.
Her madde: ne · neden bloke · adım adım (panel ekranı) · sonra hangi komutla doğrulanır.
1. **U09** — 5 Meta secret'ı (`WHATSAPP_ACCESS_TOKEN`, `_APP_SECRET`, `_PHONE_NUMBER_ID`,
   `_VERIFY_TOKEN`, `_GRAPH_API_VERSION`). ⚠️ **Kalıcı sistem kullanıcısı token'ı** (24 saatlik
   test token'ı bot'u ertesi gün sessizce susturur). Sonra W01/W02/W07/W08 (gerçek telefon,
   panel). Hepsi bitmeden `whatsapp_bot_settings.enabled` AÇILMAZ.
2. **U06** — SMS sağlayıcı kimlikleri. 🔴 Ölçüm (04.10): `sms_provider=twilio` AMA SID/token/
   message-service **üçü de BOŞ**, `external_phone_enabled=false`. "Twilio tanımlı" iddiası yanlış.
   ⚠️ Açarken telefonla giriş/kayıt KAPALI kalmalı; G04 guard trigger'ı kayıt yolunu kapatır,
   **sign-in** kapatılabilirliği ayrı doğrulanmalı.
3. **G05 kararı** — kullanıcı başına 5/gün 3/saat **enforce edilmeli mi?** Native yolda DB araya
   girmiyor; enforce için edge function gerekir (spike: `docs/plans/2026-10-04-g04-g05-telefon-otp-spike.md`).
   Auth'un kendi sınırı: proje geneli 30 SMS/saat, 5 sn bekleme, OTP süresi 60 sn.
4. **U03** — iki gerçek mail testi (e-posta doğrulama gönderen `info@corteqs.net` Zoho alias mı;
   revizyon tamamlanma maili).
5. **U11 / S01–S02** — Stripe hesabı + **vergi rejimi** (L.L.C. üzerinden AB'ye dijital hizmet).
6. **K07** — 25 Eylül transkriptinin son ~25 dk'sı (dosya kullanıcıda).
7. **K11 değil, K12** — 26 Eylül ~17:11 UTC envanter taraması senin miydi?
8. Repo dışı ~50 maddenin toplu teyidi.
9. **Kök dosyalar (sorulmadı):** `maillogo.png`, `ROADMAP.md`, `sunuekleglobalSKILL.md` —
   CLAUDE.md kökte yalnız `CLAUDE.md` + `README.md` ister; ne yapılacağı kullanıcıya sorulur.
10. **G10c onayı** · **K01/K04 kararları** (hazırlık dosyalarından sonra) · **Stripe Faz 1+ başlatma**.

---

## 3 · BİTİŞ KRİTERİ VE FİNAL RAPOR

Bağlamın/zamanın elverdiği kadarını sırayla bitir; bitiremediğini `…yan-ajan-ilerleme.md`'ye
"KALAN" olarak yaz. Final mesajında:
1. **Yapılanlar** — her biri için commit hash + kabul N/N + mutasyon N/6 + canlı kanıt.
2. **KANITLANAMAYANLAR** — açıkça ("U09'a kadar doğrulanamadı" gibi). "Doğrulandı" yazma.
3. **Karar bulgusu** — ölçümün bir öncülü çürüttüğü her yer (örn. "99 €", "3 fonksiyon",
   "SG planı hazır"). Bu repoda panolar **dört kez** yanlış "yapıldı" gösterdi; ezberleme, ölç.
4. **Kendi hataların** — kısa ve düz.
5. **Kullanıcı-adımları dosyasının yolu.**

> Kullanıcı hasta. İş durmasın; ama **kanıtsız "bitti" demektense kanıtlı "yapılamadı" yaz.**
