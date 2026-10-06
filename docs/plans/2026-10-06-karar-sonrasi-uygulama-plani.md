# CorteQS — Karar Sonrası Uygulama Planı

*6 Ekim 2026 · Kaynak: `2026-10-06-kalan-isler-sade-anlatim.md` (22 soru) · Cevaplayanlar: Burak Akçakanat + Umut Barış Terzioğlu*

Bu dosya, 22 sorunun cevaplarından çıkan **uygulanabilir iş planıdır.** Eski "tek plan" dosyasının yerine geçmez; onun karar bekleyen kısımlarını kapatır.

---

## 1. Karar özeti

### Burak'ın cevapları

| # | Konu | Karar |
|---|---|---|
| 5 | Excel "açık nokta" rol satırları | **Evet** — sadece kararı belli satırlarla ilerlenir, kalanı Burak bitirince eklenir |
| 6 | Yeni alt rol (örn. Diş Hekimi) | **B — mevcut rolün altına etiket**; yeni rol satırı AÇILMAZ |
| 9 | Cadde gönderileri aramada | **Aranmayacak** |
| 10 | AI Legion / TED InnoVenture | Kategoriler: **Meslek & Kariyer**, **Hobi & Kültür**. TED konumu: **Dubai** |
| 11 | Grup yöneticisi kendi grubunu şikayet | **Edemez** |
| 12 | Onaylanan şikayet | **1 ihlal** |
| 13 | Onaylanan şikayetten sonra grup | **Görünmez + askıya alınır**, **15 gün** içinde nihai karar |
| 14 | Şikayette yöneticiye e-posta | **Evet, otomatik** |
| 15 | Kişiye yapılan şikayetler grup ihlal sayımına | **Hayır** — yalnız gruba yapılan şikayetler sayılır |
| 16 | Eski onay sütunları | `admin_approved` **kalır**. `member_approved`: **1 ay otomatik beklesin**, sorun çıkmazsa silinir |
| 17 | WAU | Tavsiye İste kullananlar **aktif sayılır** |
| 18 | `maillogo.png`, `skills-lock.json` | "Fark etmez, ana klasör temiz olsun" — **yapıldı** (bkz. §3, iş 9) |
| 19 | Twilio metni | **Güncellenecek** (SMS → WhatsApp) |
| 20 | Meta iş doğrulaması | Durum kontrol edilir, gerekirse **hemen başlatılır** |
| 21 | Muhasebe / vergi | **Mevcut muhasebeci**, ayrı vergi danışmanı yok |
| 22 | Canlıya alma | **Barış + Burak, yapay zekâ desteğiyle**; Stripe için ortak çalışma günü |
| — | Burak kişisel aksiyon | Konsolosluk kayıtlarının eş zamanlı taranması/incelenmesi |

### Barış'ın cevapları

| # | Konu | Karar |
|---|---|---|
| 7 | Etkinlik yayını | **Otomatik yayın (limit 2)**. "Onay bekleyen" kural silinir; bekleyenler mail atılmadan yayınlanır |
| 8 | 241 konsolosluk kaydı | **Önce 10–20 kayıt, sonra hepsi** |

### Barış'ta kalanlar (güvenlik — bu planın kapsamı DIŞI)

Soru **1** (anahtar/şifre temizliği), **2** (26 Eylül gece ziyareti), **3** (CV bağlantısı), **4** (5 güvenlik kapısı).
⚠️ **Soru 4 cevaplanana kadar 5 kapıdan HİÇBİRİ kapatılmaz** — iş 12 bu yüzden bloklu.

---

## 2. Çelişki ve açık kalan noktalar

1. **Soru 6 (B) ↔ eski "yeni satır" önerisi.** Önceki sade anlatımın önerisi "yeni rol satırı"ydı; Burak **etiket** dedi. Plan etikete göre yazıldı. Etiketin tutulacağı yer (`afs_attributes` değeri mi, `role_attributes` kuralı mı) iş 5'in ilk ölçümüdür — uydurma yok, önce canlıyı ölç.
2. **Soru 16 — 1 ay.** `member_approved` 6 Kasım 2026'dan önce silinmez. "Otomatik bekle" = takvim hatırlatması; sütun önce kullanımdan ölçülür.
3. **15 gün kararı (Soru 13).** Süreyi tutacak mekanizma kararda yok, yeni iştir (iş 2).
4. **Soru 10 — TED konumu.** Önceki dosya "Global" yazıyordu, karar **Dubai**. Veri güncellenmeli.

---

## 3. İş listesi

Her iş: **ne · neden böyle · bağımlılık · kabul ölçütü.**

### İş 1 — Şikayet sistemi çekirdeği (Soru 11, 12, 13, 15)

- **Kendi grubunu şikayet yasağı:** SQL tarafında zorlanır (`SECURITY DEFINER` RPC içinde yönetici = şikayet eden kontrolü). İstemciye güvenilmez — etkinlik T1 dersi.
- **İhlal sayımı:** onaylanan her **grup** şikayeti = 1 ihlal. **Kişi şikayetleri sayıma GİRMEZ** (Soru 15 = Hayır); ayrı takip edilir, grubun sayacına yazılmaz.
- **Onay etkisi:** grup `görünmez` + `askıda` durumuna alınır.
- **Neden SQL:** RLS/RPC dışında kural istemciye yazılırsa PostgREST'e doğrudan istek atan her şeyi atlar.
- **Kabul:** (a) yönetici kendi grubuna şikayet açınca RPC `42501`/kod döner; (b) onay → sayaç +1, grup anonim listeden düşer; (c) kişi şikayeti onaylanınca grup sayacı DEĞİŞMEZ. Üçü de sözleşme testiyle kilitlenir.
- **Bağımlılık:** yok (G-serisi şemasına ek, yeni tablo açmadan genişletme tercih).

### İş 2 — 15 günlük karar süresi (Soru 13)

- Askıya alınan grupta `suspended_until` (= onay + 15 gün). Süre bayrağı **`group_settings`** satırıdır, kodda sabit yazılmaz.
- `pg_cron` (kurulu) 15. gün gelince yöneticiye hatırlatma işi atar; **süre dolunca grup kendiliğinden yeniden AÇILMAZ** — karar insanındır.
- **Kabul:** süresi dolmuş askıdaki grup panoda "karar bekliyor" görünür.

### İş 3 — Şikayette yöneticiye e-posta (Soru 14)

**Beş parçalı bildirim hattı** — biri eksikse hata vermez, yalnız mail gitmez:
1. `notification_email_outbox` **CHECK listesi** (TS'te tanımlamak YETMEZ, insert `23514` ile reddedilir)
2. `notification_settings` anahtarı
3. `admin_notification_subscriptions` sütunu
4. `admin_get_notification_subscribers` eşlemesi
5. Edge function (`SETTING_KEY_BY_EVENT` + `buildEmail` kolu)

- ⚠️ **Coolify edge function deploy ETMEZ** — commit canlıya çıkarmaz. Deploy elle yapılır, sonra `npm run check:functions` ile doğrulanır.
- ⚠️ Mailde dosya yolu/bağlantısı konmaz (kariyer bildirimi md.10 ile aynı kural).
- **Kabul:** test şikayetinde outbox satırı oluşur ve gerçek posta kutusuna düşer.

### İş 4 — Etkinlik: otomatik yayın, limit 2 (Soru 7)

- Kural **SQL'de** olmalı: `create_event_v1` RPC + INSERT politikası/status trigger'ı (M02/M03). Aksi hâlde doğrudan `status='published'` POST'u mevcut kuralı atlar.
- "Onay bekleyen" kural silinir; **bekleyen eski etkinlikler mail atılmadan yayınlanır** → yayınlama sırasında bildirim tetikleyicisi atlanmalı.
- ⚠️ `events.type` üzerinde CHECK yok; değerler `src/lib/events-vocabulary.ts`'ten gelir, elle yazılmaz.
- ⚠️ `events.create` flag'ine ve `RequireFeature`'a **dokunulmaz** (T2).
- Taslak migration zaten çalışma ağacında: `20261005900000_events_auto_approval.sql` (uygulanmamış). **Uygulamadan önce** diğer bekleyen migration'larla çakışma kontrolü.
- **Kabul:** (a) 2 etkinlik otomatik yayında, 3.'sü reddedilir; (b) doğrudan `published` POST'u bile limiti aşamaz; (c) bekleyenler yayınlandı ve 0 mail gitti.

### İş 5 — Rol etiketleri (Soru 5, 6)

- **Yalnız kararı belli Excel satırları** işlenir; "açık nokta" satırlarına dokunulmaz.
- Alt rol (Diş Hekimi vb.) **etiket** olarak ana rolün altına eklenir; yeni rol satırı açılmaz.
- ⚠️ Etiket/özellik yeni eklenirken tüm ilgili rollere `role_attributes` kuralı yazılmalı — kural yoksa alan sessizce hiç görünmez (profil WS1 dersi). Ölçüm: 78 aktif rol.
- **Kabul:** etiket seçilebilir, profilde görünür; Burak "açık nokta" satırları bitirince aynı yolla eklenir.

### İş 6 — Konsolosluk yayını (Soru 8)

- 241 kayıt hazır, hepsi "inceleme bekliyor". **Aşama 1:** 10–20 kayıt yayınlanır. **Aşama 2:** Burak onaylarsa kalanı toplu açılır.
- Burak'ın eş zamanlı taraması bu işin giriş kapısıdır; tarama bitmeden Aşama 2 başlamaz.
- ⚠️ Telefon/e-posta sızıntısı kontrolü yayından ÖNCE (B16/B17'de 10 telefon sızıntısı yayın anında yakalanmıştı). Kaynak resmî kayıt DEĞİLDİR — arayüzde bu şekilde belirtilmeli.
- **Kabul:** yayındaki kayıtlarda iletişim alanı sızıntısı 0.

### İş 7 — AI Legion / TED InnoVenture verisi (Soru 10)

- AI Legion kategorileri zaten doğru → dokunulmaz. **TED konumu Dubai** olarak güncellenir.
- Konum `geo_countries`/`geo_cities`'ten gelir, serbest metin değil. ⚠️ `geo_cities` 76.992 satır: **önce `select distinct`, sonra join** — satır başına fonksiyon uygulayan keşif sorgusu YASAK (canlı DB <1 GB RAM).
- **Kabul:** TED kaydı Dubai konumuyla dizinde görünür.

### İş 8 — Küçük kararlar (Soru 9, 17, 19)

- **Cadde aramada yok (9):** kod işi yok. Arama korpusuna cadde kaynağı girmediğini kilitleyen bir sözleşme testi eklenir.
- **WAU (17):** metrik tanımına "Tavsiye İste kullanan = aktif" eklenir.
- **Twilio metni (19):** SMS→WhatsApp'a göre güncellenir. ⚠️ Meta doğrulaması bitmeden WhatsApp çalışmaz; metin hazır, bağlantı kapalı kalır.

### İş 9 — Kök klasör temizliği (Soru 18) — ✅ YAPILDI 6 Ekim

- `maillogo.png` → `docs/assets/maillogo.png` (`git mv`). Kökte `images/` klasörü YOKTU, `docs/assets/` kullanıldı; `public/`'e konmadı (public her şeyi dışarı sunar). Koddaki tek geçişi `member-welcome.test.ts` — o yalnızca `/sharedx/maillogo.png`'nin **maile girmediğini** iddia eder, dosya yoluna bağlı değildir.
- `skills-lock.json` → `.gitignore`'a eklendi (dosya zaten izlenmiyordu).
- **Kabul:** kökte yalnız `CLAUDE.md` ve `README.md` kalır — `git ls-files` ile doğrulanmalı.

### İş 10 — Meta ve Stripe (Soru 20, 21, 22)

- **Meta:** başvuru durumu kontrol edilir; yoksa **bu hafta** başlatılır (uzun sürer; WhatsApp doğrulama + bot buna bağlı).
- **Stripe:** Barış + Burak ortak bir çalışma günü belirlenir. Muhasebeci mevcut; **vergi rejimi sorusu muhasebeciye açıkça sorulur** (kaldırılacak bir "ayrı danışman yok" kararı bunu kapatmaz).
- **Takvim hedefi:** 1 Ocak 2027.
- **Kabul:** Meta başvuru numarası kayda geçer; çalışma günü takvime girer.

### İş 11 — `member_approved` silme (Soru 16)

- **6 Kasım 2026'dan önce silinmez.** Önce kullanım ölçülür (okuyan kod/RLS/RPC var mı).
- Silme **yeni migration'dır**, eski dosyalar silinmez/yeniden sıralanmaz.
- `admin_approved` KALIR.
- **Kabul:** 1 ay boyunca sütunu okuyan sıfır ise silinir; bir tane bile varsa sebep yazılır, silinmez.

### İş 12 — 5 güvenlik kapısı (Soru 4) — ⛔ BLOKLU

- Barış'ın cevabını bekliyor. Cevap gelmeden **hiçbiri** uygulanmaz.
- Cevap "hepsi" gelirse: 1, 2, 4, 5 yapılır; **3 (telefon tuzu) dokunulmaz** — değiştirilirse mevcut şifreli veri bozulur.

---

## 4. Sıra ve bağımlılıklar

```
HEMEN      İş 9 ✅   ·   İş 10 (Meta kontrolü)
PARALEL    İş 1 → İş 2 → İş 3          (şikayet hattı, sıralı)
           İş 4  ·  İş 5  ·  İş 7 · İş 8
GİRİŞ KAPISI İş 6 Aşama 1  (Burak taraması paralel)
TAKVİM     İş 11  (≥ 6 Kasım)
BLOKLU     İş 12  (Soru 4 cevabı)
SON        Canlıya alma
```

**Canlıya alma sırası (Barış + Burak):**
1. Edge function'lar (e-posta, bildirim) — elle deploy, `npm run check:functions`.
2. Migration'lar tek tek; her birinden **önce canlıda "bu zaten var mı?"** ölçümü (`check:migrations`).
3. Frontend (Coolify).
4. Hemen ardından: `curl -I https://corteqs.net/` ile güvenlik başlıkları + tarayıcı konsolunda CSP ihlali + ana sayfalar.

## 5. Bu planın kuralları

- Plan yazan (bu dosya) ile onaylayan ayrı lanedir; her iş bitince `verifier` ayrı geçer.
- "Yapıldı" yazan her şey kanıtla: test çıktısı ya da canlı ölçüm. Rakam yazarken ezberleme, komutu çalıştır.
- Burak'ın "açık nokta" rolleri ve kişi şikayetleri gibi **kararı olmayan** konulara kod yazılmaz.
