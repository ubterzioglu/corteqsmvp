# Dijital Gruplar Motoru · Kod Öncesi Tasarım

**Amaç:** Politikanın (01) kod karşılığını tek yerde tanımlamak. Claude Code bu dosyayı kaynak kabul eder; burada olmayan bir iş kuralı uydurulmaz, sorulur.

**Varsayım:** Backend Supabase (Postgres + RLS + Edge Functions + zamanlanmış görevler). Canlı sitedeki görseller Supabase Storage'dan geliyor. Barış'ın altyapısı farklıysa kavramlar aynen kalır, sadece uygulama katmanı değişir.

---

## 1. Kavramlar

| Kavram | Değerler | Kim değiştirir |
|---|---|---|
| **Yayın durumu** (`listing_status`) | `pending_review` · `published` · `hidden` · `suspended` · `removed` · `rejected` | Sistem ve moderatör |
| **Sahiplik** (`ownership`) | `unclaimed` · `claim_pending` · `verified` | Sahiplik akışı |
| **Gizleme sebebi** (`hidden_reason`) | `link_dead` · `reports` · `owner_request` | Sistem |
| **Gönderi durumu** (`post_status`) | `pending_group_admin` · `pending_platform` · `published` · `rejected` | Grup admini, moderatör, sistem |

Ekrandaki etiketler: `verified` → "Sahibi doğruladı", `unclaimed` → "Üye önerisi", ilk 72 saat → "Yeni", skor ≥ 70 → "Onaylı Grup".

---

## 2. Durum makinesi

```
                 ┌──────────── rejected
gönderim ──► pending_review ──► published ◄──────────┐
   │                               │   │   │         │
   │ (hızlı şerit: admin +         │   │   └─► hidden ┘  (link düzelir / şikayet reddedilir)
   │  sahiplik verified +          │   │
   │  hızlı şerit açık)            │   └─► suspended (30 gün) ──► published
   └──────────────────────────────►┘
                                   └─► removed (kalıcı)
```

**Geçiş kuralları**

| Geçiş | Tetikleyici |
|---|---|
| gönderim → `pending_review` | Varsayılan |
| gönderim → `published` | Ekleyen admin **ve** sahiplik `verified` **ve** hızlı şerit açık **ve** kara liste ön taramasında işaret yok |
| `pending_review` → `published` / `rejected` | Moderatör kararı |
| `published` → `hidden` (`link_dead`) | Üst üste 2 başarısız link kontrolü |
| `published` → `hidden` (`reports`) | Eşiği geçen şikayet (Bölüm 6) |
| `published` → `hidden` (`owner_request`) | Doğrulanmış sahip kaldırma istedi. 24 saat içinde moderatör `removed` yapar |
| `hidden` → `published` | Link tekrar çalışıyor ya da şikayet reddedildi |
| `published` → `suspended` | 2. ihlal. 30 gün sonra otomatik `published` |
| herhangi → `removed` | 3. ihlal veya kırmızı çizgi 2, 4, 6 |

**Hızlı şerit:** `site_settings.groups_fast_lane_enabled` bayrağı. Varsayılan `false`. Moderasyondan geçmiş grup sayısı 100'e ulaşınca moderatör panelinde "Hızlı şeridi aç" önerisi görünür, açma kararı insanındır.

---

## 3. Akışlar

### A. Ekleme (admin olsun olmasın)
1. Kullanıcı linki yapıştırır.
2. İstemci linki normalize eder, platformu çıkarır (`chat.whatsapp.com` → whatsapp, `t.me` / `telegram.me` → telegram, `discord.gg` / `discord.com/invite` → discord). Başka alan adı reddedilir.
3. `group-preview` fonksiyonu davet kodunu tekilleştirme anahtarı olarak kontrol eder. Grup varsa: "Bu grup zaten listede. Sahibi misin?" (sahiplik akışına yönlendirir).
4. `group-preview` davet sayfasından ad ve görseli çekmeye çalışır. Başarısız olursa alanlar boş kalır, kullanıcı elle doldurur. Form hiçbir zaman bu adıma takılı kalmaz.
5. Gönderim: `groups` kaydı `pending_review` durumunda oluşur. "Evet, adminiyim" seçildiyse `ownership = claim_pending` ve sahiplik adımı açılır.
6. Kara liste ön taraması (Bölüm 8) yalnızca işaret koyar, otomatik reddetmez.

### B. Sahiplik doğrulama
1. Sistem `CQ` + 4 haneli kod üretir, 10 dakika geçerli. Aynı grup için aktif tek kod olur.
2. Kullanıcıya talimat: "Grup adının sonuna `· CQ4821` ekle, sonra Kontrol et'e bas."
3. `claim-verify` fonksiyonu davet sayfasındaki adı okur, kodu arar.
4. Bulunursa `ownership = verified`, kullanıcıya grup admini rolü atanır, "Kodu artık silebilirsin" mesajı gösterilir.
5. Bulunamazsa 3 deneme hakkı verilir. Sonra yedek yol: ekran görüntüsü yükleme → `claim_pending`, moderatör kuyruğuna.
6. Grup zaten `verified` ise yeni talep mevcut sahibe bildirilir ve moderatöre düşer, otomatik devir olmaz.

### C. Sahibin kaldırma isteği
Doğrulanmış sahip "Grubu listeden kaldır"a basar → anında `hidden` (`owner_request`). Moderatör 24 saat içinde `removed` yapar. Gerekçe sorulmaz.
Doğrulanmamış biri "Bu grup benim, kaldırın" derse: önce sahiplik akışı (B), sonra C.

### D. Gönderi moderasyonu (grup sayfası yorumları)
| Yazan | İlk durum |
|---|---|
| Grubun doğrulanmış admini | `published` |
| O grupta güvenilir üye | `published` (sonradan denetlenir) |
| Diğer herkes, sahiplenilmiş grupta | `pending_group_admin` |
| Diğer herkes, sahiplenilmemiş grupta | `pending_platform` |

`pending_group_admin` durumundaki gönderi 48 saat sonra otomatik `pending_platform` olur.
**Güvenilir üye:** O grupta onaylanmış ≥ 5 gönderi ve onaylanmış şikayet yok. Rozet grup bazlıdır, platform geneli değildir.

### E. Şikayet
Şikayet eden: giriş yapmış, telefonu doğrulanmış, hesabı ≥ 7 günlük. Aynı kişi aynı gruba 30 günde 1 şikayet verebilir.
Sebep seçenekleri politikadaki kırmızı çizgilerle birebir aynıdır, artı "Diğer (açıklama zorunlu)".
Eşik: 3 geçerli şikayet → `hidden` (`reports`) → moderatör kuyruğu.
Moderatör şikayeti onaylarsa uyarı sistemi işler (Bölüm 7), reddederse grup `published` olur.

### F. Katılım isteği (Faz 2)
Mevcut `whatsapp_join_requests` tablosu kullanılır. Ziyaretçi telefonunu doğrular, istek admine düşer, admin onaylarsa davet linki ziyaretçiye tek seferlik gösterilir. Faz 1'de "Katıl" butonu giriş yapmış kullanıcıyı doğrudan linke yönlendirir.

---

## 4. Veri modeli (öneri)

Mevcut tablolar: `whatsapp_landings`, `whatsapp_link_requests`, `whatsapp_join_requests`, `whatsapp_landing_comments`, `whatsapp_landing_likes`, `whatsapp_landing_follows`.
**Kural:** Claude Code önce mevcut şemayı okur. Yeni tablo açmak yerine mümkün olduğunca mevcut tabloyu genişletir. Aşağıdaki isimler kavramsaldır.

**`whatsapp_landings` (genişletilir)**

| Alan | Tip | Not |
|---|---|---|
| `platform` | enum: whatsapp, telegram, discord | |
| `invite_code` | text, unique | Tekilleştirme anahtarı, normalize edilmiş |
| `invite_url` | text | **RLS ile anonim kullanıcıya kapalı** |
| `category` | enum (7 kategori) | |
| `country_code`, `city_id` | | `city_id` boş olabilir (Global) |
| `is_global` | bool | true ise `country_code` hedef ülkedir |
| `short_description` | varchar(160) | |
| `rules` | text, boş olabilir | |
| `listing_status`, `hidden_reason` | enum | |
| `ownership` | enum | |
| `owner_user_id` | uuid, boş olabilir | |
| `submitted_by`, `submitted_as_admin` | uuid, bool | |
| `review_flags` | text[] | Kara liste işaretleri |
| `health_score` | int, boş olabilir | Boşsa kartta gösterilmez |
| `strike_count` | int | |
| `published_at`, `suspended_until`, `owner_renewal_due` | timestamptz | |
| `link_fail_count`, `link_checked_at` | int, timestamptz | |

**Yeni tablolar**

| Tablo | Amaç |
|---|---|
| `group_claims` | Sahiplik talepleri: kod, son geçerlilik, deneme sayısı, yöntem (code/screenshot), durum |
| `group_reports` | Şikayetler: raporlayan, sebep, not, durum |
| `group_strikes` | İhlal kaydı: sebep, karar veren, tarih |
| `group_recommendations` | "Bu gruptayım, tavsiye ederim": kullanıcı + grup, tekil |
| `group_moderation_log` | Her durum değişikliği: kim, ne zaman, önce, sonra, not |

`whatsapp_landing_comments` tablosuna `post_status`, `escalate_at` alanları eklenir.

**Kategori ve şehir:** Serbest metin yok. Şehir listesi mevcut şehir tablosundan gelir. Yoksa ülke + şehir için tek bir referans tablosu açılır ve mevcut 10 grup buna eşlenir.

---

## 5. Grup Sağlık Skoru

```
skor =
  15 · (açıklama ve kategori dolu ve (şehir seçili veya is_global))
+ 15 · (rules boş değil)
+ 15 · (ownership = verified ve son 90 günde 48 saati aşan kuyruk kaydı yok)
+ 15 · (son 4 link kontrolünün tamamı başarılı)
+ 20 · min(tavsiye_sayısı, 10) / 10
+ 20 · (son 90 günde onaylanmış şikayet yok)
```

- Günlük yeniden hesaplanır.
- Grup yayında 7 günü doldurmadan skor `null` kalır ve gösterilmez.
- Skor ≥ 70 → "Onaylı Grup". Rozet kaybı skor 65'in altına düşünce olur (sürekli gidip gelmesin diye).
- Admin paneli skoru kalem kalem ve eksik adımlarla gösterir: "Kurallarını ekle, +15".

---

## 6. Zamanlanmış görevler

| Görev | Sıklık | İş |
|---|---|---|
| `link-health` | Haftalık, gruplara yayılmış | Davet sayfasını kontrol eder. Başarısızsa `link_fail_count++`, 2 olursa `hidden`. Başarılıysa sayaç sıfırlanır, `link_dead` gizlemesi kalkar |
| `queue-escalation` | Saatlik | 48 saati geçen `pending_group_admin` gönderileri `pending_platform` yapar |
| `health-score` | Günlük | Skoru hesaplar, rozeti günceller |
| `suspension-release` | Günlük | Süresi dolan askıları kaldırır |
| `owner-renewal` | Günlük | Yıllık yenileme hatırlatması. 30 gün yanıt yoksa `ownership = unclaimed` |
| `claim-expiry` | 10 dakikada bir | Süresi dolan kodları kapatır |

**Link kontrolünde dikkat:** WhatsApp davet sayfası sunucu isteklerini sınırlayabilir. Kontrol sonucu üç değerlidir: `ok`, `invalid`, `unknown`. `unknown` sayacı artırmaz. Gruplar hafta içine yayılır, dakikada en fazla birkaç istek atılır.

---

## 7. Uyarı sistemi

| İhlal | Sonuç |
|---|---|
| 1. | Uyarı bildirimi, grup yayında kalır |
| 2. | 30 gün `suspended` |
| 3. | `removed`, ekleyen ve sahibin yeni grup eklemesi engellenir |
| Kırmızı çizgi 2, 4, 6 | Doğrudan `removed` + engelleme |

---

## 8. Güvenlik

- **RLS:** Anonim kullanıcı yalnızca `published` grupların herkese açık alanlarını okur; `invite_url` bu alanlara dahil değildir. Link, giriş yapmış kullanıcıya bir fonksiyon üzerinden verilir ve her çağrı loglanır (kötüye kullanım tespiti için).
- **Hız sınırları:** Kullanıcı başına günde 5 grup gönderimi, 10 dakikada 3 sahiplik denemesi, günde 20 link açma.
- **Kara liste ön taraması:** Ad ve açıklamada anahtar kelime eşleşmesi (vize, oturum, garanti, sinyal, yatırım getirisi, kredi vb.). Sadece `review_flags` doldurur ve hızlı şeridi kapatır, reddetmez. Liste `site_settings` içinde tutulur, kodda sabit yazılmaz.
- **Aile & Çocuk kategorisi:** Ekleyen Seviye 2 doğrulanmış kuruluş değilse gönderim formda engellenir.
- **Kişisel veri:** Telefon numarası `group_*` tablolarına yazılmaz. Mevcut telefon doğrulaması (`send-phone-otp`, `verify-phone-otp`) kullanılır.
- **Log:** Her durum değişikliği `group_moderation_log` tablosuna yazılır.

---

## 9. Bildirimler (metinler)

| Olay | Alıcı | Metin |
|---|---|---|
| Gönderim alındı | Ekleyen | "Grubun alındı. İnceleme genelde 24 saat sürer." |
| Yayına çıktı | Ekleyen, sahip | "{Grup} yayında. Sayfanı paylaşmak için hazır: {link}" |
| Reddedildi | Ekleyen | "{Grup} yayınlanamadı. Sebep: {sebep}. Grup Sözü: {link}" |
| Sahiplik doğrulandı | Sahip | "Artık {Grup} sayfasının sahibisin. Kodu grup adından silebilirsin." |
| Yeni gönderi onay bekliyor | Sahip | "{Grup} sayfasında onay bekleyen {n} gönderi var. 48 saat içinde bakmazsan ekibimiz devralır." |
| Link çalışmıyor | Sahip | "{Grup} davet linkin çalışmıyor, grup geçici olarak gizlendi. Yeni linki ekle: {link}" |
| Skor kazanımı | Sahip | "Tebrikler, {Grup} Onaylı Grup oldu. Rozet görselin hazır: {link}" |
| Uyarı | Sahip | "{Grup} için bir ihlal kaydı oluştu: {sebep}. İkinci ihlalde grup 30 gün askıya alınır." |

---

## 10. Moderatör paneli

Tek ekranda dört kuyruk: **Yeni gruplar**, **Sahiplik talepleri** (ekran görüntüsü yöntemi), **Şikayetler**, **Gönderiler** (`pending_platform`).
Her kayıtta: grup özeti, işaretler, geçmiş log, tek tıkla karar (Onayla / Reddet + hazır sebep listesi / Uyarı ver). Klavye kısayolları: `A` onayla, `R` reddet, `J/K` sonraki/önceki.
Üst şerit: kuyruk sayıları, moderasyondan geçen grup sayacı (x / 100), hızlı şerit anahtarı.

## 11. Grup admini paneli

Sahibin gördüğü sayfa: grup bilgilerini düzenleme, onay bekleyen gönderiler, skor ve eksik adımlar, rozet görseli indirme, "Sayfayı paylaş" linki, "Grubu listeden kaldır".

---

## 12. Mevcut 10 grubun geçişi

- Hepsi `published` kalır.
- Hepsi `ownership = unclaimed` başlar. Ekip sahiplere sahiplik davetini DM ile gönderir (bkz. 05 ve 06 dosyalarındaki DM metinleri).
- Kategoriler yeni listeye elle eşlenir. "Genel, Global" olanlar için hedef ülke sorulur. almanya101 → Almanya.
- Uzun açıklamalar `rules` veya uzun açıklama alanına taşınır, `short_description` elle 160 karaktere indirilir.
- Mevcut "Admin onaylı" ve "Üye onaylı" etiketleri kaldırılır.

---

## 13. Kabul testleri

1. Aynı davet linki ikinci kez girilince form "zaten listede" uyarısı verir.
2. Admin olmayan gönderi, hızlı şerit açık olsa bile `pending_review` durumunda başlar.
3. Hızlı şerit açık, sahiplik doğrulanmış, işaret yok → gönderi anında `published` olur ve "Yeni" etiketi 72 saat sonra kalkar.
4. Kara liste kelimesi içeren gönderi hızlı şeritten geçmez.
5. Anonim istemci API'den `invite_url` okuyamaz (RLS testi).
6. 3 farklı, 7 günlük, doğrulanmış hesaptan gelen şikayet grubu gizler. 6 günlük hesabın şikayeti sayılmaz.
7. 48 saat bekleyen gönderi platform kuyruğuna geçer.
8. 2 başarısız link kontrolü grubu gizler, 1 başarılı kontrol geri açar. `unknown` sonucu sayacı artırmaz.
9. Sahip kaldırma isteği grubu anında gizler.
10. Aile & Çocuk kategorisi, Seviye 2 olmayan hesaba kapalıdır.
11. Skor ilk 7 gün `null`dır ve kartta görünmez.
12. Her durum değişikliği log tablosunda görünür.

---

## 14. Kod öncesi açık teknik sorular

| # | Soru | Nasıl kapanır |
|---|---|---|
| 1 | WhatsApp davet sayfasından grup adı sunucu tarafında okunabiliyor mu? | Spike (03 dosyası, M1). Hayırsa sahiplik ekran görüntüsüyle, link kontrolü yalnızca HTTP durumuyla yapılır |
| 2 | Telegram ve Discord için aynı okuma mümkün mü? | Aynı spike |
| 3 | Şehir referans tablosu var mı? | M0 keşif adımı |
| 4 | Zamanlanmış görevler nereden çalışacak (pg_cron, harici cron)? | M0 keşif adımı |
| 5 | Mevcut `whatsapp_link_requests` ile `whatsapp_landings` ilişkisi | M0 keşif adımı |
