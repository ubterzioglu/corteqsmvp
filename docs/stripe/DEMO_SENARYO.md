---
durum: yerini-aldı
yerini_alan: docs/plans/2026-10-04-stripe-odeme-altyapisi-plani.md
son_dogrulama: 2026-11-07
---
# Demo Senaryo — "Müşteri Hizmet Talebi Verir, Ödemeye Yönlenir"

> ⛔ **GÜNCEL DEĞİL — 07.11.2026'dan beri tarihsel kayıt (ST00).** Bu senaryonun gösterdiği
> göstermelik ödeme akışı üye akışlarından **kaldırıldı**: "Ödemeye Geç · €19" düğmesi,
> sahte kart ekranı ("€19.00 Öde" → "Ödeme Başarılı ✓") ve
> `src/components/payments/MockStripeCheckout.tsx` artık **yok**.
> ⚠️ Bu değişiklik **kodda** yapıldı; canlı site, frontend Coolify'dan yeniden yayına alınana dek eski akışı göstermeyi sürdürür.
>
> **Bugünkü akış:** hizmet talebi formu (`src/components/ServiceRequestForm.tsx`) talebi
> **doğrudan** kaydeder ("Talebi Gönder" → bildirim "Talep oluşturuldu! 🎉"). €19 başvuru
> ücreti formda yalnız **gösterilir, tahsil edilmez** ("şu an ücret alınmıyor"). Gerçek ödeme
> altyapısının planı: `docs/plans/2026-10-04-stripe-odeme-altyapisi-plani.md` (açık iş:
> KALANLAR U11).
>
> Bu senaryo canlıda **oynatılamaz** — "ödemeye yönlenir" anlatımıyla sunum YAPMA.

---

> Göstermelik (mockup) Stripe ödeme akışı. **Gerçek para tahsil edilmez.**

## 🎬 Senaryo (sunum dili)

> "Diasporadaki bir kullanıcı, bir danışmandan hizmet almak istiyor.
> Platforma giriyor, hizmet talebini oluşturuyor ve **ödeme adımına yönlendiriliyor.**
> Stripe ödeme ekranında kartını giriyor, ödemesini yapıyor ve talebi sisteme düşüyor.
> Artık danışmanlar bu talebe teklif verebilir."

## 👤 Demo kullanıcı

| | |
|---|---|
| **E-posta** | `experimental3@corteqs.net` |
| **Şifre** | `Demo2026!corteqs` |

## ▶️ Adımlar (canlı gösterim)

1. **Giriş:** corteqs.net/login → e-posta/şifre sekmesi → yukarıdaki bilgiler.
2. **Profil:** corteqs.net/profile → **"Hizmet Talepleri"** sekmesi → **"Yeni Talep"**.
3. **Form:** hedef (Danışman) + kategori + başlık + açıklama + KVKK onayı.
4. **"Ödemeye Geç · €19"** butonuna bas.
5. **Stripe ekranı açılır** (mor şerit, €19, test kartı `4242…` ön-dolu) → **"€19.00 Öde"**.
6. "Ödeme işleniyor…" → **"Ödeme Başarılı ✓"**.
7. Talep listeye düşer, toast: **"Ödeme alındı, talep oluşturuldu 🎉"**.

## 🔒 Vurgulanacak not

Ekranda kalıcı **"Demo / Test ödemesi"** rozeti var; hiçbir gerçek tahsilat yapılmaz,
kart bilgisi hiçbir yere gönderilmez. Gerçek Stripe'a geçiş tek bir entegrasyon adımıdır
(detay: `MOCK_PAYMENT_FLOW_GUIDE.md`).
