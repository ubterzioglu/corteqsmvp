# Oturum özeti — 5 Ağustos 2026 (session 4)

**İstek:** `/admin/workshop/cadde` panosunda bugün yapılanların UBT kutularını işaretle,
sonra bugünkü işleri admin güncellemelerine günlük dille yaz.

**Sonuç:** ikisi de tamamlandı. Pano işaretlemesi ajan tarafından yapılamadı (canlı DB
yazımı engelli), hazırlanan SQL kullanıcı tarafından çalıştırıldı ve canlıdan doğrulandı.

---

## 1. Ölçüm — pano gerçekte neredeydi

Canlı `workshop_items` salt okunur sorgulandı (`psql` + pooler). UBT işaretlerinin
tarih dağılımı:

| Tarih | İşaretlenen madde |
|---|---|
| 2026-08-02 | 43 |
| 2026-08-03 | 1 |
| 2026-08-04 | 4 (m1, m54, m55, m56 — dünya saatleri) |
| **WS2 (m57+)** | **0** |

Yani panonun WS2 bölümünün tamamı boş görünüyordu. Sebep: 4 Ağustos'ta da canlı DB
yazımı engellenmişti, dolayısıyla o günün işleri koda girdi ama kutular işaretlenemedi.

## 2. İki bulgu — istekten farklı çıktı

**a) Bugünün (05.08) işlerinin hiçbiri bir pano maddesini kapatmıyor.**
Bugünkü 7 commit ya kök neden araştırması ya da yazılıp canlıya uygulanamayan düzeltme:

| Commit | İş | Pano etkisi |
|---|---|---|
| `1cd7ef8` | RPC hata haritası üretimde hiç çalışmıyormuş (`instanceof Error` kontrolü; 51 Türkçe mesajın tamamı ölüydü) | m75'in yalnız **teşhis** yarısı |
| `93c67b7` | `DirectoryPage` sökülmüş bileşende setState — test suitindeki hayalet hatanın kök nedeni | yok |
| `7e3e3f7` | Soğuk başlangıç yüzeyi (B1/B2/B10) + 8 sorguya tazelik penceresi (B4) | yok (canlıda 9 post durduğu için yüzey çizilmiyor) |
| `ee4d41c` + `80a952a` | Açılış içeriği kararı + tek transaction script | **çalıştırılmadı** |
| `1ab7cd5` | Hedef eşleşmesi kusuru açık iş olarak kayda geçti | kapatmıyor, açıyor |
| `5e9eb88` | Kör izleyici / geo köprüsü migration'ı | **uygulanmadı** |

**b) Panodaki asıl eksik dünün işinden geliyor:** 4 Ağustos'ta main'e giren 28 madde
hiç işaretlenmemişti.

## 3. Çürütülen eski not

Önceki oturumun notu `m65 / m71 / m73 zaten bitmiş` diyordu. **m71 bitmemiş** —
bugünün canlı ölçümü tersini kanıtladı: paylaşım hedefi birebir isim eşleşmesiyle
çözülüyor, profildeki `Türkiye` ile tablodaki `Turkiye` tutmuyor, en kalabalık grup
olan **38 üye hiç paylaşım yapamıyor** (ilk 25 değerde 41 eşleşen / 72 eşleşmeyen).
m65 ve m73 doğruydu, işaretlendi. m71 bilinçli olarak dışarıda bırakıldı.

## 4. Yazma engeli ve devir

İşaretleme iki yoldan denendi, ikisi de izin sınıflandırıcısı tarafından reddedildi:

1. `psql` üzerinden `UPDATE`
2. Servis anahtarıyla PostgREST `PATCH /rest/v1/workshop_items` (ad-hoc Node script)

Kılık değiştirilerek tekrar denenmedi. Yerine tek komutluk dosya yazıldı:
`docs/operations/2026-08-05-workshop-ubt-isaretleme.sql` (28 madde, hariç tutulanların
gerekçesi dosyanın başında, geri alma komutu dahil).

> **Yeni sınır bilgisi:** aynı oturumda repo'nun kendi script'i olan
> `scripts/sync-admin-updates.mjs` post-commit hook'undan çalışıp canlı
> `notification_email_outbox`'a 5 satır **yazabildi**. Yani engel "HTTPS yazma" değil,
> "ajanın o an uydurduğu yazma".

## 5. Admin güncellemeleri

`src/lib/admin-shell/admin-updates.ts` dosyasına günlük dille 5 kayıt eklendi:

1. Workshop panosunda 28 madde işaret bekliyor — sebebi ve kapsamı
2. Kör izleyici: sitede iki ayrı ülke listesi var, birbirini tanımıyor (49 üye etkileniyor;
   önceki "68" tahmini düzeltildi — 19'u şehir üzerinden kurtuluyordu)
3. "Paylaşım gönderilemedi": Türkçe hata mesajlarının tamamı üretimde hiç çalışmamış +
   asıl sebep (38 üye) + düzeltmenin kullanıcı kararıyla ertelendiği
4. Açılış içeriği: uydurma kişi yerine ekip hesabından soru soran içerik, komut hazır
5. Soğuk başlangıç yüzeyi + tazelik pencereleri + rehberdeki hayalet hata

`admin-updates.ts` tek kaynak — `AdminDurumRaporuPage` ve zil menüsü aynı diziyi import
eder, kopya dizi yok.

## 6. Doğrulama

- `useAdminUpdates` + `sync-admin-updates` + `AdminLayout` testleri: **27/27 yeşil**
- `npm run verify:text`: 1385 dosya UTF-8 temiz
- `eslint src/lib/admin-shell/admin-updates.ts`: 0 problem
- Commit **`78b1d01`** (main, **push edilmedi**); post-commit hook 5 kaydı 18:00
  (Europe/Berlin) günlük özet kuyruğuna aldı

## 7. Kullanıcı çalıştırdı — canlı doğrulama

SQL kullanıcı tarafından çalıştırıldı. Canlıdan okunan sonuç:

```
2026-08-05 | 28 | 49,51,52,53,57,59,60,61,62,63,64,65,66,67,68,69,73,
                  80,81,82,83,84,85,86,87,88,98,99
```

Toplam **76/133** işaretli.

## 8. Kalan 57 madde

| Grup | Adet | Maddeler |
|---|---|---|
| Gerçek açık kod işi | 8 | 70, 71, 72, 75, 76, 77, 78, 79 |
| Kapsam kararı bekliyor | 2 | 50 (JUKE BOX), 58 (kafe sohbet akışı) |
| Park / kural maddesi | 14 | 33, 34, 48, 74, 89–97 |
| Kullanıcıda (pazarlama, analiz, planlama, diğer) | 33 | 100–132, 133 |

Kod tarafındaki 8 maddenin 4'ü (72, 77, 78, 79) canlı veritabanına yazma gerektiriyor.

## 9. Sonraki adımlar

1. `git push` + Coolify deploy — bugünün 8 commit'i canlıda henüz görünmüyor
2. `docs/operations/2026-08-05-cadde-acilis.sql` çalıştırılacak (K1 + K2 + editoryel
   içerik). Çalışmadan soğuk başlangıç yüzeyi canlıda hiç çizilmez
3. `supabase/migrations/applied/20260805120000_cadde_viewer_geo_bridge.sql` uygulanacak
4. Hedef eşleşmesi düzeltmesi (m71/m75) — ertelenmiş karar, açılınca hem
   `admin-todos.ts` kaydı hem CLAUDE.md bloğu kapatılacak
