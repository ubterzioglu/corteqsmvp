# Kullanıcı Adımları — 5 Ekim 2026

> **Bu dosya:** Sağlığına kavuştuğunda tek bakışta yapabileceklerin.
> **Bağlı dosyalar:** Mevcut kullanıcı-adımları dosyalarına bağlantı var, çoğaltma.
> **Push yok:** Hiçbir commit push edilmedi — koordinatör inceleyip push'lar.

---

## 1 · Acil kararlar (bu hafta)

### K01 · Cadde panel sıralaması
**Dosya:** `docs/plans/2026-10-05-k01-k04-karar-hazirligi.md`
**Soru:** Cadde sayfasında paneller sağ kolonda mı (bugün) yoksa akışın üstünde mi dursun?
**Eylem:** Dosyayı oku, A veya B'yi seç, söyle.

### K04 · Davet kodu alanı — 🔴 CANLIDA KUSUR
**Dosya:** `docs/plans/2026-10-05-k01-k04-karar-hazirligi.md`
**Sorun:** Profil sayfasındaki "Davet Kodu" alanı ters yönde çalışıyor. "Sizi yönlendiren kodu gir" diyor ama kullanıcılar "benim kodum" sanıyor.
**Soru:** Alan düzeltilsin mi (A) yoksa kaldırılsın mı (B)?
**Eylem:** Dosyayı oku, A veya B'yi seç, söyle.

### G10c · Eski kolonları düşür (GERİ ALINAMAZ)
**Durum:** Onay talebi hazırlanmadı (bu oturumda zaman yetmedi).
**Ne yapılacak:** Ajan ölçüm + geri alma planı hazırlayacak → sen onaylayacaksın → kolonlar düşecek.
**Zaman:** Bu turda yapılmadı, sonraki oturumda.

---

## 2 · Panel / secret adımları

### U09 · WhatsApp Meta secret'ları → ✅ GİRDİ (W01)
**Dosya:** `docs/handover/2026-10-05-w-kullanici-adimlari.md`
**Kalan:** Meta panelinde webhook bağlantısı:
1. Meta Business Suite → WhatsApp → Configuration → Webhook
2. Callback URL: `https://injprdrsklkxgnaiixzh.supabase.co/functions/v1/whatsapp-webhook`
3. Verify token: `.env.local`'daki `WHATSAPP_VERIFY_TOKEN` değeri
4. "Verify and save" → `messages` alanına Subscribe
5. Kendi telefonundan bir mesaj gönder → W02 testi

### U06 · SMS sağlayıcı kimlikleri
**Dosya:** `docs/handover/2026-10-04-g04-g05-kullanici-adimlari.md`
**Ölçüm (04.10):** `sms_provider=twilio` AMA SID/token/message-service **üçü de BOŞ**.
**Eylem:** Twilio panelinden SID, Auth Token, Message Service SID gir.
⚠️ Açarken telefonla giriş/kayıt KAPALI kalmalı — G04 guard trigger'ı kayıt yolunu kapatır.

### U03 · İki gerçek mail testi
**Ne:** (a) E-posta doğrulama maili (`info@corteqs.net` Zoho alias mı?) · (b) Revizyon tamamlanma maili
**Eylem:** Test hesabıyla kayıt ol → mail gelmiyor → Zoho alias'ı kontrol et.

### U11 / S01–S02 · Stripe hesabı + vergi
**Dosya:** `docs/plans/2026-10-04-stripe-odeme-altyapisi-plani.md`
**S01:** Stripe hesabı açık mı, doğrulanmış mı? Canlı anahtar alınabilir mi?
**S02:** 🔴 **Vergi rejimi** — L.L.C. üzerinden AB'ye dijital hizmet → KDV/VAT. Stripe Tax mı elle mi? **Profesyonel teyit ister.**

---

## 3 · Bekleyen onaylar / kararlar

### G05 · Telefon OTP limiti enforce edilsin mi?
**Soru:** Kullanıcı başına 5/gün, 3/saat ENFORCED edilmeli mi?
**Şu an:** Native yolda DB araya girmiyor. Enforce için edge function gerekir.
**Auth'un kendi sınırı:** Proje geneli 30 SMS/saat, 5 sn bekleme, OTP süresi 60 sn.
**Eylem:** Karar ver → spike: `docs/plans/2026-10-04-g04-g05-telefon-otp-spike.md`

### G14 · 4 tasarım kararı (kullanıcıya sorulmayı bekliyor)
**Dosya:** `docs/handover/2026-10-05-g14-kullanici-adimlari.md`
**Kararlar:**
1. Kendi grubu yasak (ajan kararı, teyit bekliyor)
2. Tek onay = tek ihlal (ajan kararı)
3. Onaydan sonra grup gizli kalır (Politika §7 ↔ tasarım §2 çelişkisi)
4. Mail yok (bu karar turunda konuşulmadı)

---

## 4 · Ajan yapacakları (sonraki oturumlar)

### P04–P07 · Çeşitli denetimler
**Durum:** Bu oturumda yapılmadı (zaman/bağlam yetmedi).
**Kapsam:**
- P04: `lansman-admin` + `relocation-notifications` yetki okuması + deploy
- P05: Git geçmişi secret taraması
- P06: Türkçe collate ölçümü
- P07: Bucket MIME + RPC migration + deploy

### U01 · Service role anahtar spike
**Durum:** Bu oturumda yapılmadı.
**Kapsam:** 14 edge function analizi → hangisi legacy JWT anahtarına bağlı → geçiş sırası.
⚠️ **"Disable JWT-based API keys" düğmesine ASLA basma.**

### SG · SEO/GEO planı
**Durum:** Bu oturumda yapılmadı.
**Kapsam:** Canlıyı ölç (canonical, sitemap, hreflang, robots, 404) → plan yaz → kusurları kapat.
⚠️ `index.html` JSON-LD'ye DOKUNULMAZ (karar 8).

---

## 5 · Deploy sonrası kontroller

### WhatsApp botu (W04–W06)
**Dosya:** `docs/handover/2026-10-05-w-kullanici-adimlari.md`
- Edge function deploy: `whatsapp-autoreply`
- `npm run check:functions` sapma 0
- Canlı `verify_jwt=false` ölçülmüş
- Gerçek Meta webhook davranışı U09'a kadar doğrulanamaz

### G14 şikayet sistemi
**Dosya:** `docs/handover/2026-10-05-g14-kullanici-adimlari.md`
- Frontend deploy → "Şikayet et" düğmesi görünür olur
- Moderatör paneli → şikayet sekmesi aktif olur
- Gerçek telefonla uçtan uca U06'ya kadar doğrulanamaz

---

## 6 · Kök dosyalar (sorulmadı, dokunulmadı)

CLAUDE.md kökte yalnız `CLAUDE.md` + `README.md` ister. Şu an kökte:
- `maillogo.png` — silinsin mi, arşive mi?
- `ROADMAP.md` — silinsin mi, docs/'a mı?
- `sunuekleglobalSKILL.md` — silinsin mi?

**Eylem:** Ne yapılacağı kullanıcıya sorulur (ajan karar vermez).

---

## 7 · Repo dışı ~50 madde

Panel durumları, hesap ayarları, dış servis kimlikleri — toplu teyit gerekir.
**Eylem:** Liste hazırlanıp sana gönderilecek.

---

## Özet — öncelik sırası

1. **K01 + K04** kararları (hazırlık dosyası hazır)
2. **U09** webhook bağlantısı (Meta paneli)
3. **U06** SMS sağlayıcı (Twilio paneli)
4. **G05** OTP limiti kararı
5. **G14** 4 tasarım kararı
6. **S01 + S02** Stripe hesap + vergi
7. **U03** iki mail testi
8. Kök dosyalar kararı
9. Repo dışı ~50 madde teyidi

---

**Dosyayı hazırlayan:** İkinci ajan (Claude Sonnet 5.5)
**Tarih:** 5 Ekim 2026
