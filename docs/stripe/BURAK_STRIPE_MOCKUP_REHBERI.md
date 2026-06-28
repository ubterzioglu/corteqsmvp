# Burak için — Stripe Mockup Nasıl Kullanılır?

Merhaba Burak 👋

Bu rehber, siteye eklenen **göstermelik (mockup) Stripe ödeme akışını** nasıl deneyeceğini
ve nasıl sunacağını anlatır. Önemli: bu **demo bir ödemedir**, **gerçek para çekilmez**.
Amaç, "kullanıcı bir hizmet talebi verince ödemeye yönlendiriliyor" senaryosunu canlı göstermek.

---

## 1. Önce 30 saniyede özet

- Bir kullanıcı **hizmet talebi** oluşturuyor → karşısına **Stripe ödeme ekranı** çıkıyor →
  "ödeme" yapınca talep sisteme düşüyor.
- Ödeme ekranı gerçek Stripe'a **benziyor** ama hiçbir yere para/kart bilgisi gitmiyor.
- Test kartı (`4242 4242 4242 4242`) ekranda **hazır gelir**, sadece "Öde" demen yeterli.

---

## 2. Giriş bilgilerin

| | |
|---|---|
| **Adres** | https://corteqs.net/login |
| **E-posta** | `experimental3@corteqs.net` |
| **Şifre** | `Demo2026!corteqs` |

> **"E-posta ile Giriş"** sekmesini kullan (Google ile değil).

---

## 3. Adım adım gösterim

1. **Giriş yap.**
2. Sağ üstten **"Profilim"** → ya da doğrudan https://corteqs.net/profile.
3. Sekmelerden **"Hizmet Talepleri"**ni seç.
4. **"Yeni Talep"** butonuna bas.
5. Formu doldur (hepsi kısa olabilir):
   - Kime yönelik → **Danışman**
   - Kategori → ör. **Vize / Göçmenlik**
   - Başlık + Açıklama → birkaç kelime
   - Alttaki **onay kutuları** (KVKK/GDPR) → işaretle
6. En altta **"Ödemeye Geç · €19"** → bas.
7. **Stripe ekranı açılır** (mor renkli):
   - Kart no / tarih / CVC **zaten dolu** gelir.
   - **"€19.00 Öde"** → bas.
8. **"Ödeme işleniyor…"** → **"Ödeme Başarılı ✓"**.
9. Talep oluşur, listede görünür. ✅

---

## 4. Sunumda söyleyebileceklerin

> "Diasporadaki bir kullanıcı danışmanlık almak istiyor. Talebini oluşturuyor ve
> **Stripe ile ödeme adımına yönlendiriliyor.** Ödemesini yapıyor, talebi sisteme düşüyor,
> danışmanlar teklif veriyor. Şu an ödeme ekranı **demo modunda** — altyapı hazır,
> gerçek Stripe hesabı bağlanınca aynı akış canlı ödeme alacak."

---

## 5. Sık sorulanlar

**"Gerçekten para çekiliyor mu?"**
Hayır. Ekranda kalıcı **"Demo / Test ödemesi"** uyarısı var. Girilen kart bilgisi
hiçbir yere gönderilmez, kaydedilmez.

**"Ödemeyi iptal edersem?"**
Ödeme ekranında **"Vazgeç"** dersen talep **oluşmaz**. Bu demoda ödeme zorunlu adım.

**"Neden €19?"**
Göstermelik bir "hizmet talebi başvuru ücreti". İstenirse kolayca değiştirilebilir
(`src/components/ServiceRequestForm.tsx` içindeki `SERVICE_REQUEST_FEE`).

**"Admin panelinde ödeme kaydı görünür mü?"**
Hayır — bu mockup gerçek işlem yazmaz. Sadece oluşan **hizmet talebi**,
`/admin → Veritabanı Tabloları → service_requests` altında görünür.

---

## 6. Gerçek Stripe'a geçiş (ileride)

Mockup'tan gerçek ödemeye geçmek için gerekenler (henüz yapılmadı):
1. Stripe hesabı + API anahtarları (hazırlık notu: `docs/stripe/STRIPE_VERIFICATION_READINESS.md`).
2. `create-checkout-session` adında bir edge function (server-side).
3. Sahte ekran yerine gerçek Stripe Checkout'a yönlendirme + webhook ile ödeme onayı.

Kod buna hazır: ödeme başarılı olunca talebi oluşturan mantık zaten ayrılmış durumda;
sadece "ödeme tetikleyicisi" gerçek Stripe ile değiştirilecek.

---

## 7. Teknik özet (geliştirici notu)

| Parça | Dosya |
|---|---|
| Sahte Stripe ekranı | `src/components/payments/MockStripeCheckout.tsx` |
| Ödeme adımı + talep oluşturma | `src/components/ServiceRequestForm.tsx` |
| "Hizmet Talepleri" sekmesi | `src/components/profile/premium/PremiumProfileTabs.tsx` |
| Premium panel rol eşlemesi | `src/lib/profile-presentation.ts` (Experimental_2 / Experimental_3) |

> Premium panel (ve dolayısıyla bu sekme) yalnızca `Experimental_2` / `Experimental_3`
> rollerinde açılır. Demo kullanıcı `experimental3@corteqs.net` bu rol ile hazırlandı.

İyi sunumlar! 🚀
