---
durum: yerini-aldı
yerini_alan: docs/plans/2026-10-04-stripe-odeme-altyapisi-plani.md
son_dogrulama: 2026-11-07
---
# CorteQS Demo — Ne Yapman Gerekiyor?

> ⛔ **GÜNCEL DEĞİL — 07.11.2026'dan beri tarihsel kayıt (ST00).** Bu talimatın anlattığı
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
> Bu talimatı test kullanıcısına GÖNDERME — 6.–8. adımlardaki ekran artık yok.

Merhaba! Aşağıdaki adımları takip ederek **hizmet talebi verme ve ödeme** akışını test edebilirsin.
Bu bir **demo / test ortamıdır** — girdiğin kart bilgisiyle **gerçek para çekilmez.**

---

## 🔑 Giriş bilgilerin

| | |
|---|---|
| **Adres** | https://corteqs.net/login |
| **E-posta** | `experimental3@corteqs.net` |
| **Şifre** | `Demo2026!corteqs` |

> Girişte **"E-posta ile Giriş"** sekmesini kullan (Google ile değil).

---

## ✅ Adım adım ne yapacaksın

1. **Giriş yap** → yukarıdaki e-posta ve şifre ile.
2. Sağ üstten **"Profilim"**e tıkla (veya https://corteqs.net/profile adresine git).
3. Açılan panelde sekmelerden **"Hizmet Talepleri"**ni seç.
4. Sağ üstteki **"Yeni Talep"** butonuna bas.
5. Formu doldur:
   - **Kime yönelik?** → Danışman (ya da İşletme)
   - **Kategori** → bir kategori seç (ör. Vize / Göçmenlik)
   - **Başlık** ve **Açıklama** → kısa bir şey yaz
   - Alttaki **onay kutularını** işaretle (KVKK/GDPR)
6. En altta **"Ödemeye Geç · €19"** butonuna bas.
7. **Ödeme ekranı** açılacak (mor renkli, Stripe görünümlü):
   - Kart numarası, tarih ve CVC **zaten dolu** gelir — değiştirmene gerek yok.
   - **"€19.00 Öde"** butonuna bas.
8. Birkaç saniye **"Ödeme işleniyor…"** yazısı çıkar → sonra **"Ödeme Başarılı ✓"**.
9. Talebin oluşur ve listede görünür. 🎉

---

## ℹ️ Bilmen gerekenler

- **Gerçek ödeme yok.** Ekranda kalıcı olarak **"Demo / Test ödemesi"** uyarısı görürsün.
  Kart bilgisi hiçbir yere gönderilmez.
- Ödeme ekranında **"Vazgeç"** dersen talep oluşmaz — ödeme bu demoda zorunlu adımdır.
- Bir sorun yaşarsan ekran görüntüsü alıp geri bildir.

---

## 🧪 Ne test ediyoruz?

> "Kullanıcı bir hizmet talebi oluşturduğunda **ödemeye yönlendiriliyor mu**, ödeme akışı
> baştan sona pürüzsüz mü?" — Senin geri bildirimin bunu doğrulamamıza yardımcı olacak.

Teşekkürler! 🙏
