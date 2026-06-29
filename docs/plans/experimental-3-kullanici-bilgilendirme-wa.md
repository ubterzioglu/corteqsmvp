# Experimental_3 — Son Kullanıcı Bilgilendirme (WhatsApp)

> Durum: **Rol canlıda** (mig `20260629100000`, `Experimental_2` birebir kopyası — premium profil deneyimi)
> Amaç: `Experimental_3` rolüne atanan test kullanıcısına gönderilecek hazır WhatsApp mesajı.
> Tarih: 2026-06-29

---

## Rol özeti (iç bilgi — mesaja dahil değil)

- `Experimental_3`, `Experimental_2` premium pilotunun birebir kopyası (24 attribute / 44 feature / 7 section).
- Frontend zaten premium görünüme bağlıydı (`profile-presentation.ts` → `supportedRoleKeys` `Experimental_3`'ü içeriyor).
- Premium deneyim neleri içeriyor: premium hero (büyük isim tipografisi, "Premium Profil" etiketi, avatar ring),
  iki kolonlu public profil + sticky kenar çubuğu, güven kartı (Doğrulanmış / Yönetilen / Sahiplenilebilir),
  **WhatsApp** ve **Randevu Al** hızlı aksiyonları, mobilde alt aksiyon barı, profil tamamlanma kartı + canlı önizleme.

---

## WhatsApp mesajı (kopyala–yapıştır)

Merhaba 👋

CorteQS'te size **yeni premium profil deneyimini** test etmeniz için özel bir profil tanımladık. 🎉

Profilinizde artık şunlar var:

✨ *Premium görünüm* — daha modern, mobil öncelikli tasarım
👤 Büyük profil başlığı, profil fotoğrafı çerçevesi ve "Premium Profil" rozeti
📱 Telefondan tek dokunuşla *WhatsApp* ve *Randevu Al* butonları
🛡️ Güven kartı — profilinizin doğrulanmış/yönetilen olduğunu gösterir
📊 Profil tamamlanma yüzdesi + profilinizin herkese nasıl göründüğünün canlı önizlemesi

*Sizden ricamız:*
1️⃣ Giriş yapıp profilinizi açın, eksik alanları doldurun.
2️⃣ "Herkese Açık Profili Görüntüle" ile dışarıdan nasıl göründüğüne bakın.
3️⃣ Telefondan da bir göz atın (butonlar, kaydırma, görünüm).
4️⃣ Beğendiğiniz / garip gelen / eksik bulduğunuz her şeyi bize yazın. 🙏

Geri bildirimleriniz bu deneyimi diğer kullanıcılara açmadan önce bizim için çok değerli.

Teşekkürler! 💙
*CorteQS Ekibi*

---

## Kısa versiyon (tek paragraf — hızlı gönderim için)

Merhaba 👋 CorteQS'te size yeni *premium profil deneyimini* test etmeniz için özel bir profil açtık.
Daha modern, mobil öncelikli bir tasarım; WhatsApp & Randevu Al butonları, güven kartı ve profilinizin
canlı önizlemesi var. Lütfen giriş yapıp profilinizi tamamlayın, "Herkese Açık Profili Görüntüle" ile
dışarıdan nasıl göründüğüne bakın ve görüşlerinizi bize yazın. 🙏 Teşekkürler! — *CorteQS Ekibi*

---

## Notlar

- Mesajdaki "Randevu Al" butonu, profile `appointment_url` eklendiğinde otomatik görünür; veri yoksa kullanıcı görmez.
- Bu mesaj **teknik olmayan** son kullanıcı içindir; rol adı (`Experimental_3`), migration veya pilot terimleri bilinçli olarak mesaja konmadı.
- Atama: kullanıcının `user_role_assignments` kaydına `Experimental_3` rolü eklenince premium görünüm anında aktif olur.
