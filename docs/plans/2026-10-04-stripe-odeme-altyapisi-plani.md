# Stripe / ödeme altyapısı — durum ölçümü ve uygulama planı

> **Tarih:** 4 Ekim 2026 · **Durum:** PLAN — kod yazılmadı, kullanıcı onayı bekler
> **Tetikleyen:** K05 parkının kaldırılması kararı (kullanıcı, 04.10)
> **Kaynak:** Haziran 2026 hazırlık paketi `docs/stripe/STRIPE_VERIFICATION_READINESS.md`
>
> 🛑 Bu dosya **plandır**. Hiçbir faz onay alınmadan başlatılmaz.

## 0 · Neden şimdi

Takvim sabit: **abonelik 01.01.2027**. Bugün 4 Ekim 2026 — yaklaşık **13 hafta** kaldı.
K05 03.10'da "sonra yapacağız" diye parka alınmıştı; 04.10'da kullanıcı "önce plan
çıkar, kod yazma" dedi.

> **⚠️ DÜZELTME (05.10, karar 9):** Ürün modeli **"Kurucu 1000 = 99 € DEĞİL"**.
> `/pricing` sayfası = 3 kademe × aylık/yıllık = **6 abonelik fiyatı** + 3 Freemium:
> - **Danışman Pro:** 25 €/ay · 20 €/ay (yıllık)
> - **Kuruluş Pro:** 50 €/ay · 40 €/ay (yıllık)
> - **İşletme Pro:** 75 €/ay · 60 €/ay (yıllık)
>
> **Hepsi yinelenen abonelik.** "Kurucu 1000 = 99 €" ayrı bir kampanya olarak SONRA
> ele alınır (Faz 1 veri modeli recurring + 6 price; 99 € tek seferlik kampanya için
> ayrı faz). Karar 10: **yalnız EUR, AB + Türkiye.**

## 1 · ÖLÇÜLEN başlangıç noktası (04.10, ezberleme — yeniden ölç)

⚠️ **"Kod SIFIR" ifadesi yalnız ÖDEME KODU için doğrudur.** Yasal/kamusal ayak
Haziran'da yapılmış ve bugün canlıda çalışıyor. Bu ayrımı yapmadan plan yapma.

### ✅ HAZIR olanlar

| Ne | Ölçüm |
|---|---|
| 8 yasal sayfa | `/legal/business-information` · `/privacy` · `/terms` · `/refund-cancellation` · `/service-delivery` · `/cookies` · `/pricing` · `/iletisim` — **8/8 App.tsx'te VAR**, canlıda örneklenen 3'ü **HTTP 200** |
| Tüzel kişi | **CorteQS Global L.L.C.** (hazırlık paketinde yazılı — ⚠️ Almanya vergi rejimi VARSAYMA) |
| Hazırlık dokümanı | `docs/stripe/` altında 5 dosya (readiness · mockup rehberi · demo senaryo · akış rehberi) |
| Edge function altyapısı | 12 fonksiyon canlı, deploy akışı biliniyor, secret yönetimi kurulu |
| Bildirim hattı | 5 parçalı outbox deseni kurulu ve kanıtlı (fatura/makbuz maili bunu kullanır) |

### ❌ OLMAYANLAR

| Ne | Ölçüm |
|---|---|
| `stripe` npm bağımlılığı | `package.json`'da **YOK** |
| Ödeme/abonelik/fatura tablosu | `payment`/`subscri`/`invoice`/`stripe`/`billing` adlı tablo **0** |
| Gerçek checkout | Tek şey `MockStripeCheckout.tsx` (**228 satır**) — kendi yorumunda *"gerçek bir ödeme YAPMAZ, hiçbir Stripe API'sine gitmez"* yazıyor; `setTimeout` ile sahte gecikme üretir |
| Webhook | Yok |
| Talep sinyali | `feature_interest` **0 satır** — bugüne dek toplanmış ilgi kaydı YOK |
| Kullanıcı tabanı | **175** kayıtlı kullanıcı |

🔴 **`MockStripeCheckout` bugün İKİ gerçek yerde kullanılıyor:**
`PremiumProfileTabs.tsx` · `ServiceRequestForm.tsx`. Yani kullanıcı bu ekranlarda
"ödeme başarılı" görüyor ve hiçbir tahsilat olmuyor. Gerçek entegrasyonda bu iki
çağrı yerinin ikisi de değişmeli; biri unutulursa sahte akış canlıda kalır.

🔴 **Talep sinyali sıfır.** 3 kademeli abonelik modelini 175 kişiye satmayı
planlıyoruz ama ilgi kaydı toplayan mekanizma (`feature_interest`) **hiç satır
üretmemiş**. Fiyat ve paket kararı veriyi değil varsayımı temel alıyor.

## 2 · Fazlar

Her faz ayrı batch, ayrı commit, ayrı onay. Sıra bağlayıcıdır.

### Faz 0 · Kullanıcı ön koşulları (KOD YOK) — ⛔ hepsi kullanıcıda

| # | İş | Neden bloke eder |
|---|---|---|
| S01 | Stripe hesabı açık mı, doğrulanmış mı? Canlı anahtarlar alınabilir durumda mı? | Hiçbir teknik faz bu olmadan doğrulanamaz |
| S02 | **Vergi rejimi netleşsin** — L.L.C. üzerinden AB'li müşteriye dijital hizmet satışı KDV/VAT doğurur. Stripe Tax açılacak mı, yoksa elle mi? | Yanlış kurgu geriye dönük düzeltilemez; fatura şekli buna bağlı |
| S03 | ✅ **CEVAPLANDI (karar 9, 05.10):** 3 kademe × aylık/yıllık = 6 abonelik fiyatı (Danışman Pro 25/20 € · Kuruluş Pro 50/40 € · İşletme Pro 75/60 €), hepsi yinelenen abonelik. "Kurucu 1000 = 99 €" ayrı kampanya (SONRA). İade koşulu `/legal/refund-cancellation` sayfasında. | Veri modeli buna göre kurulur |
| S04 | Para birimi ve ülke kapsamı (yalnız EUR mu?) | Fiyat nesneleri buna göre açılır |

⚠️ **S02 profesyonel teyit ister.** Bu plan vergi tavsiyesi vermez.

### Faz 1 · Veri modeli (migration) — 🟢 S03 gelince

`subscriptions` · `payments` · `stripe_events` (idempotency için). Kurallar:
Stripe **tek gerçek kaynaktır**, bizim tablo aynadır · her satır `stripe_*_id`
taşır · webhook olayı `stripe_events`'e **önce** yazılır, sonra işlenir (çift
işleme kapanır) · RLS: kullanıcı yalnız KENDİ satırını görür, `anon` **hiçbir
şey** görmez.

### Faz 2 · Checkout edge function — ⛔ Faz 1

`create-checkout-session`. **Fiyat istemciden GELMEZ** — sunucu `price_id`'yi
kendi tablosundan okur (istemciden fiyat almak, 1 €'ya abone olunmasına yol açar).
Kullanıcı oturumundan kimlik çözülür.

### Faz 3 · Webhook — ⛔ Faz 2 · **en kritik faz**

`stripe-webhook`. **İmza doğrulaması zorunlu** (`stripe-signature`) — doğrulamasız
webhook, herkesin "ödedim" diyebildiği bir uçtur. `verify_jwt=false` olmalı
(Stripe JWT göndermez) ⚠️ ama bu *yetkisiz* demek değildir, kapı imzadır.
Olaylar: `checkout.session.completed` · `invoice.paid` · `invoice.payment_failed` ·
`customer.subscription.updated|deleted`. **Idempotent** — Stripe aynı olayı
tekrar gönderir.

### Faz 4 · Yetkilendirme — ⛔ Faz 3

Ödeme → erişim. ⚠️ **Mevcut sisteme bağlanır, yeni paralel sistem AÇILMAZ:**
`role_features` + `user_feature_overrides` zaten var. Abonelik bitince erişim
**otomatik düşmeli** (süre dolumu cron'u).

### Faz 5 · Arayüz — ⛔ Faz 4

`MockStripeCheckout`'un **iki** çağrı yeri gerçek akışa geçer. Mock dosyası
**silinmez**, `demo-pages.ts` desenine benzer şekilde açıkça işaretlenir ya da
testte kilitlenir ki geri sızmasın.

### Faz 6 · İade / iptal / fatura — ⛔ Faz 4

`/legal/refund-cancellation` sayfası canlıda ve bir **söz** veriyor; kod o sözü
tutmalı. Fatura maili mevcut outbox hattından gider.

### Faz 7 · Canlı doğrulama — ⛔ hepsi · **KANIT TURU**

Test kartıyla uçtan uca: checkout → webhook → satır → erişim açıldı → iptal →
erişim düştü. 🔴 **"Kod yazıldı" kanıt değildir** (M23/M27 dersi): kanıt = gerçek
Stripe olayı + dolu DB satırı + ekranda açılan erişim.

## 3 · Takvim riski — dürüst değerlendirme

13 hafta var. Teknik fazlar (1–7) deneyimli bir akışla **4–6 hafta**lık iştir.
Ama kritik yol **teknik değil**: Faz 0'ın tamamı kullanıcıda ve **S02 (vergi)**
dış profesyonel gerektirir. Stripe hesap doğrulaması da günler/haftalar sürebilir.

**Önerilen hareket:** Faz 0'ı bu hafta başlat. Teknik fazlar beklerken ilerletilemez;
S01 olmadan hiçbir şey doğrulanamaz.

⚠️ **Ayrı ve daha erken bir soru:** `MockStripeCheckout` bugün canlıda iki yerde
"ödeme başarılı" diyor. Gerçek entegrasyon 2027'ye kalacaksa bile, bu ekranların
bugün kullanıcıya ne söylediği **şimdi** gözlenmiş.

---

## 4 · RAPOR: MockStripeCheckout'un canlıdaki iki yerde kullanıcıya ne gösterdiği
*(05.10, kod değiştirilmedi — yalnız gözlem)*

### Yer 1: `ServiceRequestForm.tsx` (Hizmet Talebi Başvurusu)

**Tutar:** `SERVICE_REQUEST_FEE = 19` → **€19.00**

**Kullanıcı akışı:**
1. Formu doldurur → "Ödemeye Geç · €19" düğmesine tıklar
2. Dialog açılır:
   - **Üst şerit (mor, Stripe-benzeri):** "Ödeme · Hizmet Talebi Başvurusu" + e-posta + "Stripe ile güvenli ödeme" + büyük "€19.00"
   - **DEMO uyarısı (sarı, kesikli kenarlı):** "Demo / Test ödemesi. Bu ekran göstermeliktir; gerçek para tahsil edilmez. Test kartı `4242…` ön-doludur."
   - Kart formu (ön-dolu: `4242 4242 4242 4242`, `12/34`, `123`)
   - Düğme: "€19.00 Öde"
3. "Öde"ye tıklar → 1.6 sn "Ödeme işleniyor…" (dönen ikon + "Test modu" rozeti)
4. **Başarı ekranı:** Yeşil daire içinde onay ikonu + **"Ödeme Başarılı"** + "€19.00 tutarındaki demo ödemeniz onaylandı."
5. 1.1 sn sonra dialog kapanır, `submitRequest()` çağrılır → talep kaydedilir

**Gözlem:** DEMO uyarısı VAR ama başarı ekranında "demo ödemeniz onaylandı" yazıyor.
Kullanıcı hızlı geçiyorsa "Ödeme Başarılı" başlığı baskın çıkabilir. Ancak uyarı
metni açıkça "gerçek para tahsil edilmez" diyor — tamamen aldatıcı değil.

### Yer 2: `PremiumProfileTabs.tsx` (Hizmet Taleplerim sekmesi)

Bu bileşen `ServiceRequestsPanel` içinde `ServiceRequestForm`'u render eder.
Dolayısıyla **aynı akış** — yukarıdaki Yer 1'in aynısı.

**Gözlem:** İki yerde aynı MockStripeCheckout kullanılıyor; farklı tutar/ürün adı
yok. Biri unutulursa sahte akış canlıda kalır riski YOK (ikisi de aynı bileşeni
çağırıyor).

### Sonuç

- **Kod değiştirilmedi** (karar: gerçek Stripe entegrasyonu Faz 5'te).
- **DEMO uyarısı mevcut** — tamamen sessiz sahte ödeme YOK.
- **Risk:** Kullanıcı "Ödeme Başarılı" başlığını görünce gerçek tahsilat olduğunu
  sanabilir (ama uyarı metni koruyor).
- **Faz 5'te:** MockStripeCheckout'un iki çağrı yeri de gerçek checkout edge
  function'a geçirilecek. Mock dosyası silinmez, açıkça işaretlenir.