# G14 · Grup şikayet sistemi — kullanıcı adımları (5 Ekim 2026)

> Ajan G14'ü bitirdi (migration canlıda, arayüz kodda, kabul 13/13, mutasyon 7/7).
> Aşağıdakiler **senin elini** veya **senin kararını** bekliyor. Her madde: ne · neden ·
> nasıl · sonra nasıl doğrulanır.

---

## 1 · 🔴 U06 bitmeden kimse şikayet EDEMEZ (bilinen, kusur değil)

**Ne:** Şikayet için telefon doğrulaması şart (politika §8, `groups.report_require_phone=true`).
Bugün SMS sağlayıcısı (Twilio) kimlikleri **boş** → hiçbir üye telefonunu doğrulayamıyor →
herkes "Şikayet için telefon doğrulaması gerekir" mesajını görüyor.

**Neden bloke:** U06 (SMS sağlayıcı kimlikleri) sende. Ayrıca telefon doğrulama kartı
(`PhoneVerificationCard.tsx`) henüz HİÇBİR sayfaya bağlı değil (`check:dead` kırmızı — G05'in
açık kalemi). Yani U06 gelse bile kartın profil sayfasına bağlanması gerekiyor.

**Nasıl:** U06 adımları `docs/handover/2026-10-04-g04-g05-kullanici-adimlari.md` dosyasında
(Twilio SID/token/message-service → Supabase Auth → Phone). Telefonla **giriş/kayıt** kapalı kalmalı.

**Sonra doğrula:** gerçek bir test hesabıyla telefonu doğrula →
`select public.is_phone_verified('<uid>')` = true → hesap ≥ 7 günlükse grup sayfasında
"Şikayet et" düğmesi görünür → bir şikayet gönder → `/admin/gruplar` → Şikayetler sekmesinde
görünmeli.

⚠️ Geçici çözüm istersen (önerilmez): `update group_settings set value='false' where
key='groups.report_require_phone'` telefon şartını kaldırır — ama sahte hesaplarla grup
gizletme kapısını açar. Politika §8 "doğrulanmış hesap" der; bu bir ürün kararıdır.

---

## 2 · KARAR GEREKİR — şikayetçiye / grup sahibine mail

Bugün **yeni mail eklenmedi** (bu karar turunda konuşulmadı):
- Şikayet eşiği grubu gizlediğinde (`hidden`, sebep `reports`) sahibe **mail GİTMEZ**.
  (Mevcut bildirim tetikleyicisi yalnız `link_dead` gizlemesine mail atıyor.)
- Şikayetçiye "şikayetin alındı / karara bağlandı" maili **yok**.
- Mevcut davranış (değişmedi): moderatör şikayeti ONAYLARSA uyarı (strike) maili sahibe
  gider (G23); şikayetler REDDEDİLİP grup yayına dönerse "yayında" maili gider (G23).

**Soru:** Eşikle gizlenen grubun sahibine "grubun şikayet nedeniyle incelemeye alındı" maili
gitsin mi? Şikayetçiye sonuç bildirimi gitsin mi? (Evet derseniz: outbox CHECK'ine yeni
`event_type` + metin + edge şablonu gerekir — küçük ama migration'lı iş.)

---

## 3 · TEYİT — sebep → kırmızı çizgi eşlemesi

Şikayet sebepleri politika §4'ün 7 maddesi + "Diğer". Onaylanan şikayet uyarı merdivenine şu
numarayla gider (2, 4, 6 doğrudan kalıcı kaldırma + yasak — G15):

| Sebep (anahtar) | Kırmızı çizgi |
|---|---|
| Link çalışmıyor, grup dolu veya kapalı (`link_broken`) | 1 |
| Vize/oturum/izin/denklik/randevu slotu satışı (`visa_slot_sale`) | **2 — doğrudan kaldırma** |
| Kripto sinyal, MLM, garantili getiri, kredi aracılığı (`crypto_mlm_finance`) | 3 |
| Katılım için kişisel veri isteme (`personal_data_request`) | **4 — doğrudan kaldırma** |
| Nefret, şiddet, taciz, yetişkin içerik (`hate_violence_adult`) | 5 |
| Reşit olmayanlara yönelik, doğrulanmamış kuruluş (`minors_unverified`) | **6 — doğrudan kaldırma** |
| Parti / seçim kampanyası aracı (`political_campaign`) | 7 |
| Diğer (açıklama zorunlu) (`diger`) | yok — normal merdiven |

⚠️ Dikkat: moderatör "visa_slot_sale" şikayetini onaylarsa grup **ilk seferde kalıcı
kaldırılır** ve ekleyen + sahip yeni grup ekleyemez. Bu eşleme doğru mu?

---

## 4 · TEYİT — ajanın verdiği üç karar (tasarım boş bırakmıştı)

1. **Kendi grubuna şikayet yasak.** "Kendi grubu" = grubu ekleyen (`user_id`/`submitted_by`)
   veya doğrulanmış sahibi (`owner_user_id`). Düğme bu kişilere hiç çizilmez; sunucu da reddeder.
2. **Tek onay = tek ihlal.** Moderatör bir grubun şikayetini onaylayınca o grubun TÜM açık
   şikayetleri aynı kararla kapanır ve **tek** uyarı yazılır. Aksi hâlde eşiği dolduran 3
   şikayeti tek tek onaylayan moderatör 3 ihlal → kalıcı kaldırma + yasak üretirdi. Asılsız
   olanlar önce tek tek reddedilir ("Yalnız bunu reddet").
3. **Onaydan sonra grup gizli KALIR.** Tasarım §2 gizli → yayında geçişini yalnız "şikayet
   reddedildi" için tanımlıyor. Ama politika §7 "1. ihlal: uyarı, grup yayında kalır" diyor.
   Bugün: 1. ihlal (uyarı) onaylanırsa grup `hidden` kalıyor ve panelde onu yayına döndüren
   bir düğme YOK (yalnız SQL: `set_group_status_v1(<id>,'published','published',...)` admin
   olarak). **Karar:** uyarı sonrası grup otomatik yayına dönsün mü? Evet derseniz
   `review_group_report_v1`'in `upheld` dalına "outcome=warning ise ve başka açık şikayet
   yoksa published" eklenir (küçük migration).

---

## 5 · Bilinen açık kalemler (G14'ün dışında bırakıldı)

- **G16 "güvenilir üye"nin "onaylanmış şikayet yok" yarısı** ve **G17 sağlık skorunun "son 90
  günde onaylanmış şikayet yok" (20 puan) kalemi** hâlâ `group_reports`'a bakmıyor (iki sözleşme
  testi bunu bugünkü hâliyle kilitliyor). Tablo artık var; bu iki fonksiyonun genişletilmesi
  ayrı küçük batch'tir (G17 compute'u yeniden tanımlar — skorları etkiler).
- **types.ts regen borcu:** yeni RPC'ler üretilmiş tiplerde yok (`as never` deseni, G12 borcu).
- **Frontend deploy:** arayüz (detaydaki "Şikayet et" + moderatör sekmesi) commit'te; canlı
  sitede görünmesi için frontend deploy gerekir (push koordinatörde).

## 6 · Doğrulama komutları (deploy sonrası)

```bash
psql "$SUPABASE_DB_URL" -f supabase/qa/group-motor-acceptance.sql   # exit 0, "13/13"
npm run check:migrations                                            # sapma yok
```
Tarayıcıda: `/addcom?group=<slug>` → girişsiz "Giriş yap ve şikayet et" · girişli (telefonsuz)
"Şikayet için telefon doğrulaması gerekir" · `/admin/gruplar` → Şikayetler sekmesi.
