# Göstermelik Stripe Ödeme Akışı — Kullanım Kılavuzu

Son güncelleme: 28 Haziran 2026

Bu kılavuz, demo/tanıtım amaçlı eklenen **göstermelik (mockup) Stripe ödeme akışını**
nasıl kullanacağını anlatır. **Gerçek para tahsil edilmez** — hiçbir Stripe API'sine,
edge function'a veya dış servise istek gitmez. Amaç, bir kullanıcının hizmet talebi
oluştururken "ödemeye yönlendirilmesini" canlı olarak göstermektir.

---

## 1. Ne yapıldı? (Özet)

| Parça | Dosya | Açıklama |
|---|---|---|
| Sahte Stripe ekranı | `src/components/payments/MockStripeCheckout.tsx` | Stripe Checkout görünümünü taklit eden dialog. Kart no/SKT/CVC alanları görsel; test kartı `4242…` ön-dolu. "Öde" → sahte işlem → "Ödeme Başarılı". |
| Ödeme adımı | `src/components/ServiceRequestForm.tsx` | "Talebi Gönder" yerine artık önce **göstermelik ödeme** açılır (€19 başvuru ücreti). Ödeme "başarılı" olunca talep gerçekten kaydedilir. |
| Panele bağlama | `src/components/profile/premium/PremiumProfileTabs.tsx` | Premium profil panelindeki **"Hizmet Talepleri"** sekmesi artık gerçek formu ve talep listesini gösteriyor (eskiden "yakında" placeholder'dı). |

> **Önemli:** Akışın canlıda görünür olması için sitenin yeniden yayınlanması (Coolify deploy) gerekir.

---

## 2. Test müşterisi (demo kullanıcı)

Bu akışı denemek için hazır bir test kullanıcısı oluşturuldu:

| Alan | Değer |
|---|---|
| **E-posta** | `experimental3@corteqs.net` |
| **Şifre** | `Demo2026!corteqs` |
| Rol | `Experimental_3` (premium pilot klonu — premium panel + Hizmet Talepleri sekmesi açık) |
| E-posta doğrulama | Onaylı (doğrudan giriş yapılabilir) |

> Bu bilgileri istediğin kişiye verebilirsin; giriş yapıp akışı uçtan uca deneyebilir.
> Test bittiğinde kullanıcıyı silmek istersen: **Supabase Dashboard → Authentication → Users → `experimental3@corteqs.net` → Delete**.
>
> **Not:** Premium panel (ve "Hizmet Talepleri" sekmesi) yalnızca `Experimental_2`/`Experimental_3`
> rollerinde açılır (bkz. `src/lib/profile-presentation.ts`). Daha önce açılan
> `demo-musteri@corteqs.net` kullanıcısı `User_DiasporaMember` rolündedir ve premium paneli görmez.

---

## 3. Akış nasıl denenir? (Adım adım)

1. **Giriş yap:** [corteqs.net/login](https://corteqs.net/login) → yukarıdaki demo e-posta + şifre ile gir
   (Google ile değil, **e-posta/şifre** sekmesinden).
2. **Profil paneline git:** [corteqs.net/profile](https://corteqs.net/profile).
3. Sekme çubuğundan **"Hizmet Talepleri"**ni seç.
4. Sağ üstteki **"Yeni Talep"** butonuna bas.
5. Formu doldur:
   - Hedef tür (Danışman / İşletme), kategori, başlık, açıklama (zorunlu).
   - KVKK/GDPR onay kutularını işaretle.
6. Altta **"Ödemeye Geç · €19"** butonuna bas.
7. **Göstermelik Stripe ekranı açılır:**
   - Üstte mor Stripe şeridi + tutar (€19.00).
   - "Demo / Test ödemesi" uyarısı görünür.
   - Kart numarası `4242 4242 4242 4242`, SKT `12/34`, CVC `123` ön-dolu (değiştirmene gerek yok).
   - **"€19.00 Öde"** butonuna bas.
8. ~1.5 sn "Ödeme işleniyor…" animasyonu → **"Ödeme Başarılı ✓"**.
9. Ekran kapanır, talep **gerçekten kaydedilir** (`service_requests` tablosu) ve
   liste görünümünde yeni talebin belirir. Toast: **"Ödeme alındı, talep oluşturuldu! 🎉"**

> **İptal:** Ödeme ekranında "Vazgeç"e basarsan talep **oluşturulmaz** — ödeme zorunlu adımdır.

---

## 4. Admin panelinden ne görülür?

Bu akış **müşteri tarafıdır**; admin panelinde ayrı bir "ödeme yönetimi" ekranı **eklenmedi**
(göstermelik olduğu için gerçek tahsilat kaydı tutulmaz). Admin/yönetici olarak:

- **Hizmet talepleri** veri tablosundan görülebilir:
  `/admin` → **Veritabanı Tabloları** → `service_requests`.
  Demo kullanıcının oluşturduğu talep burada satır olarak görünür.
- **Stripe işlem paneli** (`StripeTransactionsPanel`) hâlâ "Stripe Ready · Yakında" demo
  görünümündedir — bu mockup gerçek işlem kaydı yazmaz, dolayısıyla orada otomatik satır oluşmaz.

> Gerçek bir ödeme geçmişi/raporu istersen, bu mockup'ı gerçek Stripe'a bağlamak gerekir (bkz. §6).

---

## 5. "Göstermelik" olduğunu nasıl anlarız? (Güvenlik notu)

Akışın hiçbir yerinde gerçek ödeme **mümkün değildir**:
- `MockStripeCheckout` yalnızca `setTimeout` ile sahte gecikme yapar; **hiçbir `fetch`/ağ çağrısı yok**.
- Kart alanlarına girilen değer **hiçbir yere gönderilmez**, state'te bile kalıcı tutulmaz.
- Ekranda kalıcı **"Demo / Test ödemesi"** ve **"Test modu"** rozetleri vardır.

---

## 6. Gerçek Stripe'a geçmek istenirse (sonraki adım — opsiyonel)

Bu mockup'ı gerçek ödemeye çevirmek için yapılacaklar (şimdilik **yapılmadı**):
1. Stripe hesabı + test/live API anahtarları (`docs/stripe/STRIPE_VERIFICATION_READINESS.md` hazır).
2. Bir edge function: `create-checkout-session` (server-side, secret key ile).
3. `MockStripeCheckout` yerine `onPaymentSuccess`'i gerçek Checkout redirect'ine bağla.
4. Webhook ile ödeme onayını `service_requests` kaydının oluşturulmasına bağla.

Mevcut kod buna hazır: `ServiceRequestForm` zaten "ödeme başarılı → talep oluştur" mantığını
ayırmış durumda; tek değişecek yer `onPaymentSuccess` tetikleyicisidir.
