# Oturum özeti — 2026-08-05: Cadde paylaşım zinciri onarımı

**Kapsam:** Cadde'de paylaşım yapılamamasının kök nedeni, düzeltmesi ve yan bulgular.
**Sonuç:** paylaşabilen üye **42 → 104**. Üç commit, ikisi canlı veritabanına uygulandı.

---

## Nasıl başladı

Kullanıcı `/cadde` ekran görüntüsü ve konsol çıktısı paylaştı: paylaş butonu
**"Paylaşım gönderilemedi — Paylaşım hedefi geçersiz"** toast'u veriyor,
`create_cadde_post_v2` RPC'si `400` ve `cadde_invalid_targets` dönüyordu.

Soru "bu hata nereden geliyor?" idi; iş, kök nedene inip zinciri uçtan uca onarmaya dönüştü.

---

## Kök neden

Profil konumu **serbest metindir** ve `get_cadde_actor_context` bunu HAM döndürür.
Composer bu ham değeri RPC'ye geri gönderir. `create_cadde_post_v2` ise hedefi
**birebir isimle** çözüyordu:

```sql
left join public.cadde_countries c on c.name = r.country_name
```

Profilinde `Türkiye` yazan üye, katalogdaki `Turkiye` (diakritiksiz) satırıyla
eşleşmiyor → `country_id` NULL → `cadde_invalid_targets`.

**Okuma tarafı 2026-07-29'da `cadde_fold_text` ile aksan/kasa duyarsız hale getirilmişti;
yazma tarafı atlanmıştı.** Asimetri buradan geliyordu.

---

## Yapılan üç iş

### 1. `460c68a` — fold eşleşmesi (migration `20260805130000`)

Ülke ve şehir join'leri `cadde_fold_text` karşılaştırmasına çevrildi, NULL koruması
eklendi (`cadde_fold_text(NULL)` boş string döner; birebir karşılaştırma NULL'da hiç
eşleşmiyordu — koruma olmadan boş hedef, katalogdaki boş adlı bir kayda eşleşebilirdi).

Doğrulama yöntemi: fonksiyon gövdesi **uygulama öncesinde** canlı `pg_get_functiondef`
çıktısıyla satır satır karşılaştırıldı — 206'ya karşı 213 satır, tek fark hedeflenen
iki join. Kopyalama hatası olmadığı böyle kanıtlandı.

Sözleşme testi: `src/lib/cadde-post-target-fold.test.ts` (6 test).

### 2. `07548b6` — CSP `connect-src`'e `wss` (nginx)

Supabase Realtime `wss://<ref>.supabase.co/realtime/...` adresine bağlanıyor, ama CSP
listesinde yalnız `https://*.supabase.co` vardı. **Tarayıcılar CSP'de ws/wss şemasını
https'ten ayrı değerlendirir**, bu yüzden realtime bağlantısı bloklanıyordu — akış anlık
güncellenmiyor, yalnız periyodik yoklamayla tazeleniyordu.

`wss://*.supabase.co` ve `wss://*.supabase.in` eklendi. CSP tek kaynaktan geldiği için
(`map $host $corteqs_csp`) tek satır 6 location'ın tamamını kapsadı.

Canlı doğrulama: `curl -I https://corteqs.net/` → başlıkta `wss` girdileri göründü,
HTTP 200, tüm güvenlik başlıkları yerinde. Bu, CLAUDE.md'de duran "CSP konteynerde
doğrulanamadı" çekincesinin ilk kez çalışan nginx'e karşı kapanması oldu.

Sözleşme testi `src/lib/redirects.test.ts` içine eklendi (15 → 16 test).

### 3. `78fe9e1` — profil konum verisi onarımı (migration `20260805140000`)

Fold sonrası kalan değerler yazılış farkı değil, **bambaska kelimeydi**
(`Qatar`/`Katar`, `Deutschland`/`Almanya`, `ABD`/`Amerika Birlesik Devletleri`).
Kullanıcı kararı: alias/kural tablosu eklemek yerine **doğrudan veriyi düzeltmek**.

- 4 eksik ülke eklendi: Güney Afrika, İtalya, Moldova, Suudi Arabistan
- 4 şehir eklendi: Cape Town, Roma, Kişinev, Riyad
- 21 ülke + 3 şehir attribute değeri düzeltildi

**Kritik ara bulgu:** ülke eklemek tek başına yetmiyordu. RPC şehri de zorunlu kılıyor
(`city_name is not null and city_id is null` → geçersiz) ve yeni ülkelerde hiç şehir
olmuyor. Bu ölçülmeden yazılsaydı B grubu açılmayacak, "düzeltildi" denmiş olacaktı.

Güvenlik kilidi: `DO` bloğu içinde `GET DIAGNOSTICS` + eşik aşılırsa `raise exception`
— veri yazan bir migration'ın sessizce geniş bir UPDATE çalıştırmasına izin verilmedi.

Salt-okunur prova canlıya karşı koşuldu: 4 ülke, 21 ülke satırı, 3 şehir satırı,
**zaten çalışan kayda dokunma: 0**.

---

## Ölçümler

Toplam 156 kayıt (126'sının ülkesi dolu, 30'unun boş).

| Aşama | Paylaşabilen | Ülkesi çözülmüyor | Şehri çözülmüyor | Ülkesi boş |
|---|---|---|---|---|
| Başlangıç | **42** | 81 | 3 | 30 |
| Fold sonrası (`460c68a`) | **83** | 38 | 5 | 30 |
| Veri onarımı sonrası (`78fe9e1`) | **104** | 17 | 5 | 30 |

> Oturum içinde bir ara "43 üye açıldı" ve "62 → 104" denmişti; ikisi de yanlıştı.
> Doğrusu: fold **41** üye açtı (2 üyenin ülkesi çözülüp şehri çözülemediği için),
> başlangıç değeri **42**. Sayılar yukarıdaki tablodan alınmalı.

---

## Kalan işler

**a) Şehri katalogda olmayan 5 üye** (ülkesi çözülüyor, yine de paylaşamıyor):

| Üye | Ülke | Şehir | Durum |
|---|---|---|---|
| Güres Yüksel | Almanya | `München` | katalogda `Münih` var |
| Hanife Zeray | Almanya | `Böblingen` | katalogda yok |
| Aslihan Çınar Yalçın | Almanya | `Düsseldorf/Grevenbroich` | iki şehir tek alanda |
| Halil Sanbur | Türkiye | `Çankaya` | Ankara ilçesi |
| Birey CorteQaaaa | Türkiye | `Vanuu` | anlamsız |

**b) C grubu (2 kayıt)** — şehirden çıkarım gerekiyor, karar bekliyor:
`cenk cenk` (ülke alanına `vancouver` yazmış → Kanada) ve `971585717916`
(telefonu +971/BAE, şehri `Doha`/Katar — çelişkili).

**c) D grubu (15 kayıt)** — 2026-06-09 WhatsApp toplu içe aktarımı. İsimleri telefon
numarası, e-postaları `<telefon>@wa.local`, ülke alanı `Belirtilmedi`, profil hiç
doldurulmamış. **Telefon ülke kodundan ülke çıkarmak bu üründe sistematik olarak
yanıltır** — `+90` numaralı bir diaspora üyesi Berlin'de yaşıyor olabilir. Dokunulmadı.

**d) Kalıcı çözüm (yapılmadı):** profil formu hâlâ serbest metin. Bu oturumdaki
düzeltmeler bugünkü kayıtları onarır, **tekrarı önlemez**. Formu katalogdan beslenen
seçim listesine çevirmek gerekiyor; aksi halde yarın biri yine `Germany` yazacak.

**e) `admin-todos.ts`** kaydı hâlâ "düzeltme yazıldı, canlıya uygulanmadı" diyor —
artık yanlış, panelde öyle görünüyor.

---

## Yan bulgular

- **`verify:text` migration'ları hiç denetlemiyor.** Script'in yorumu "migration'lar da
  denetlenir" diyor ama uzantı listesinde `.sql` yok; 365 migration kontrol edilmiyor.
  Eklemek denendi ve **geri alındı**: `suspiciousTokens` içindeki çıplak U+00C4
  (Almanca büyük A-umlaut) meşru Almanca içerikli bir migration'a takılıp
  `prebuild`/`pretest`'i kırıyor. Bulgu dosyaya yorum olarak yazıldı; kapatmak için
  kural inceltilmeli ya da dosya istisnası tanımlanmalı.
- **Katalog dar:** 18 ülke, 51 şehir. Global bir diaspora platformu için bu, ülke
  adı doğru yazılsa bile pek çok üyeyi dışarıda bırakır.
- **Katalogda veri kirliliği:** `Roma` ve `vancouver` şehirleri **Amerika Birleşik
  Devletleri** altında kayıtlı (muhtemelen `cadde_ensure_geo_city` tarafından bozuk
  profil verisinden otomatik üretilmiş).
- **Mükerrer üye kayıtları:** `Serkan Altinay` ×2, `Burak Akçakanat`/`Burak Akcakanat` ×3,
  `Evren Tortum` ×2. Ayrı bir konu.
- 21 düzeltilen kaydın 19'u gerçek kişi: `Policy Test Minimal` test hesabı,
  `Evren Tortum` iki hesapla kayıtlı.

---

## Kayda değer dersler

1. **Yetki sorunu gibi görünen her şey yetki sorunu değil.** "Admin'lere bu yetkiyi
   verebilir miyiz?" sorusunun cevabı hayırdı: `v_is_privileged` zaten hesaplanıyordu ve
   iki kapıyı açıyordu, ama `cadde_invalid_targets` bir izin kontrolü değil, çözülememiş
   veriydi. Muafiyet verilse `cadde_post_targets.country_id NOT NULL` kısıtına takılıp
   okunabilir hata yerine ham 500 dönerdi.
2. **Bir tarafı düzeltince diğerini de düzelt.** Okuma tarafı fold'a geçirilirken yazma
   tarafı atlandığı için kusur 7 gün yaşadı. `cadde_fold_text` kullanan her yerin
   simetrik olması gerekiyor.
3. **Veri yazan migration'dan önce salt-okunur prova koş.** Hangi satırlara dokunacağı
   gerçek veriye karşı sayıldı; "zaten çalışan kayda dokunma: 0" ölçüsü olmasa
   collateral damage görünmezdi.
4. **`create or replace function` yazarken canlı tanımla diff al.** `pg_get_functiondef`
   çıktısıyla satır satır karşılaştırma, 200+ satırlık bir fonksiyonu elle kopyalarken
   sessiz bir kayıp olmadığını kanıtlayan tek yol.
5. **Bu ortam canlı DB'ye YAZAMAZ** (izin sınıflandırıcısı; okuma geçer). Migration'lar
   kullanıcı tarafından uygulandı. Türkçe veri içeren SQL daima `psql -f` + UTF-8 ile
   gönderilmeli — `-c` ile karakterler bozulur.

---

## İlgili dosyalar

- `supabase/migrations/applied/20260805130000_cadde_post_target_fold.sql`
- `supabase/migrations/applied/20260805140000_cadde_geo_data_repair_ab.sql`
- `src/lib/cadde-post-target-fold.test.ts`
- `src/lib/redirects.test.ts`
- `nginx.conf.template`
- `src/lib/admin-shell/admin-todos.ts` (`20260805-cadde-hedef-eslesmesi-fold`)
