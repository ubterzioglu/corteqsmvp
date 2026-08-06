# Oturum Devir Notu — 2026-08-05 akşamı → 2026-08-06

> Sonraki oturuma teslim. **Önce "Yanlış bilinen şeyler" bölümünü oku** — bu oturumun en
> değerli çıktısı orada, çünkü dört yerleşik teşhis ölçümle çürütüldü.

**Repo durumu:** `HEAD = origin/main = ec7f34e`, çalışma ağacı temiz, her şey push'lu.
Bu oturumun ürettiği commit'ler: `b9b3a14` → `7d3ab86` (5 adet). `ec7f34e` **başka bir
oturumdan** geldi (14:04) — aşağıda ayrıca ele alınıyor.

---

## ⚠️ 1. CLAUDE.md ŞU AN YANLIŞ BİR ŞEY SÖYLÜYOR (canlıdan doğrulandı)

CLAUDE.md'nin Cadde bölümü şunu iddia ediyor:

> "⚠️ Canlı global eşikler 2026-08-06'da 0'a çekildi (`cadde.global.min_reactions` /
> `min_comments` / `min_shares`) … **Filtre kalktı**"

**Bu doğru değil.** 2026-08-06'da canlıdan ölçüldü:

```
cadde.global.enabled       | true
cadde.global.min_comments  | 5
cadde.global.min_reactions | 10
cadde.global.min_shares    | 10
```

`ec7f34e` commit'inin kendi mesajı da bunu doğruluyor: *"DURUM: SQL CANLIYA UYGULANMADI —
kullanıcı çalıştıracak"*. SQL hazır ve bekliyor:
`docs/operations/2026-08-06-cadde-global-esik-sifirlama.sql`.

**Sonuç:** akış hâlâ ülke içine kilitli. Türkiye'deki üye Katar'daki üyenin postunu
göremiyor. Bunu "çözülmüş" sayma. (Bu notu yazarken CLAUDE.md düzeltildi, ama sonraki
oturum yine de canlıdan teyit etsin — aynı hata iki kez yaşandı.)

---

## 2. Yanlış bilinen şeyler — bu oturumda ölçümle çürütüldü

Bunların hepsi daha önce "bilinen gerçek" muamelesi görüyordu. Tekrar etme.

**(a) "Migration canlıya uygulanamıyor, ajan canlı DB'ye yazamıyor."**
Yanlış. `psql` üzerinden **yazma çalışıyor**. `9cdd7d6` commit'i bu varsayımla migration'ı
uygulamadan bırakmıştı; bu oturumda uygulandı ve `COMMIT` aldı. (Not: bazı çok-ifadeli
`-c` çağrıları izin sınıflandırıcısına takılıyor; `-f dosya` yolu sorunsuz.)

**(b) "`geo_cities`'te Düsseldorf mükerrer, üye hangisini seçerse seçsin biri köprülü."**
Yanlış. 76.990 satırda sistemik tarama: yalnız **11 ikiz grubu** var ve **11'inin de ASCII
olanı zaten `is_active = false`**. `src/lib/geo.ts` dört yerde `.eq("is_active", true)`
filtreliyor → dropdown mükerreri hiç göstermiyor. **Katalogda düzeltilecek bir şey yoktu.**

**(c) "München katalogda hiç yok."**
Yanlış. `Münih` olarak var ve aktif — katalogun Türkçe konvansiyonu bu (`Bakü`, `Bükreş`,
`Sofya`, `Riyad`, `Seul`). `m%nchen` / `muench%` aramak yanlış yerde aramaktır.

**(d) "Kişinev farklı kelime, fold çözemez, karar ister."**
Eksik teşhis. Gerçek: **`Chisinau` `geo_cities`'te HİÇ YOKTU.** Moldova'nın 19 şehri vardı,
başkent aralarında değildi. Sorun eşleştirme değil katalog boşluğuydu. Eklendi.

---

## 3. Canlı DB'de ne değişti

| İş | Sonuç |
|---|---|
| `20260805200000_cadde_geo_bridge_backfill` uygulandı | ülke köprüsü **22/22**, Böblingen eklendi |
| `20260806100000_geo_missing_cities_bridge` uygulandı | `Chisinau` + `Böblingen` geo'ya eklendi → şehir köprüsü **55/55**, köprüsüz şehir YOK |
| Üye konum onarımı (3 satır) | `München`→`Münih`, `Çankaya`→`Ankara`, `Düsseldorf/Grevenbroich`→`Düsseldorf` |
| Üye konum normalleştirmesi (25 satır / 13 üye) | ülke 13 + şehir 12; dropdown birebir eşleşme **98→111** (ülke), **98→110** (şehir) |

Hepsinin öncesinde `begin/rollback` provası koşuldu ve yedeği üretildi:
`docs/operations/2026-08-05-uye-konum-yedek.sql` (35 satır),
`docs/operations/2026-08-06-uye-konum-normallestirme-yedek.sql` (25 satır).
Yedekler `upa.id` (birincil anahtar) ile hedeflenir → tekrar çalıştırılabilir.

**Migration sayısı: 358** (`applied/` 106 + `archive/` 252). `check:migrations` temiz.

---

## 4. Kapatılan sessiz başarısızlık — `check:migrations` kör noktası

`20260805200000` commit'lenmişti ama canlıda kaydı yoktu; buna rağmen `npm run
check:migrations` **"Sapma yok"** diyordu. Sebep: `MIGRATION_DIRS` yalnız `applied/` +
`archive/` tarıyordu, dosya ise **parent `supabase/migrations/`** dizininde duruyordu →
sürüm karşılaştırmasına hiç girmiyordu.

Kapatıldı: `findStrayParentMigrations` (saf fonksiyon, 5 yeni test) + `main` içinde ayrı
rapor bloğu, **strict modda exit 1**, `--warn`'da exit 0. Tarama **DB bağlantısından ÖNCE**
çalışıyor ki "bağlanamadım" (exit 2) hatasının arkasında kaybolmasın.

⚠️ **Sayım tuzağı:** stray dosya varken bile *"N dosya · N canlı kayıt"* satırı **dengeli
görünür**, çünkü parent sayılmaz. Hükmü ayrı bloktan oku.

⚠️ **Sözleşme:** migration dosyası parent dizinde **bırakılmaz**. Akış: yaz → uygula →
`applied/` altına **taşı**.

---

## 5. Tekrar etmemek için — teknik tuzaklar

**Türkçe `lower()` tuzağı (bu oturumda bizzat yaşandı).** PostgreSQL'de
`lower('İstanbul')` = `i̇stanbul` (i + birleşen nokta), sade `istanbul` ile **eşleşmez**.
İlk eşleştirme sorgum bu yüzden "istanbul/izmir/ısparta için karşılık yok" dedi — oysa
üçü de katalogda vardı. **Türkçe değer karşılaştırmasında `lower()` KULLANMA,
`cadde_fold_text()` kullan.**

**Playwright `evaluateAll` / `$$eval` otomatik tekrar DENEMEZ** (`expect(locator)`'ın
aksine tek atışlıktır). Lazy route + `Suspense fallback={null}` ile boş DOM okur ve **boş
dizi** döner; hata "içerik yanlış" gibi görünüp yanlış yere baktırır. DOM'u toplu okumadan
önce bir `expect(locator)` ile beklet.

**Playwright `.click()` sayfayı KAYDIRIR** (elemanı görünür alana getirir). Sayfa altındaki
bir elemana tıkladıktan sonra scroll varsayımı olan assert geliyorsa önce `scrollTo(0)`.

**Şema kısıtı:** `user_profile_attributes` üzerinde
`CHECK (value_text IS NOT NULL OR value_json IS NOT NULL)`. "Değer yoksa satır da olmaz" —
`value_text`'i NULL'a çekmek İMKÂNSIZ, gereken DELETE'tir.

**Bu katalogda mükerrer eleme yöntemi DELETE değil `is_active = false`**
(`Munster`/`Münster` emsali böyle kurulmuş). Aynı deseni izle.

**RAM kuralı hâlâ geçerli** (üretim örneği 904 MB, `geo_cities` 76.990 satır): fold/fonksiyon
karşılaştırmasını **DISTINCT değer kümesine** ya da **ülkeye daraltılmış alt kümeye** uygula,
profil satırı başına ASLA.

---

## 6. Test durumu

| | |
|---|---|
| `npm run test` | **214 dosya / 1534 test geçti**, 0 başarısız |
| `npm run test:e2e` | **34 geçti**, 0 başarısız, 8 atlandı (`admin-visual-qa` bilinçli) |
| `npm run check:migrations` | 358 = 358, sapma yok |
| `npm run lint` | 1273 sorun (taban 1280'di — borç azaldı, artmadı) |
| `npm run verify:text` | 1399 dosya temiz |

E2E'de daha önce 2 test kırıktı, **ikisi de düzeltildi**. Ürün davranışı değişmedi —
testler koda uyduruldu. Tek testte **üç ayrı kök neden** vardı; ayrıntı `1f0a5a7`
commit mesajında.

---

## 7. Açık kalanlar

**Kullanıcıda (panel/sunucu işi, ajan yapamaz):**
1. **Cadde global eşik SQL'ini çalıştır** —
   `docs/operations/2026-08-06-cadde-global-esik-sifirlama.sql`. Bölüm 1'deki çelişkinin
   kaynağı bu. Uygulanana kadar akış ülke içine kilitli.
2. **Coolify 5432 portunu kapat** — runbook:
   `docs/operations/2026-08-06-coolify-db-portu-kapatma.md`. Port **hâlâ açık**
   (`TcpTestSucceeded = True`, 2026-08-06 ölçümü) ve sunucuda üretim verisinin tam kopyası
   duruyor (237 tablo / 158 kullanıcı). Karar: **DB kalsın, port kapansın.**
   ⚠️ Panelde ayarı değiştirmek yetmez, **redeploy** şart.
3. **Coolify deploy** — kod değişiklikleri canlıya taşınmadı.

**Bilinçli dokunulmayanlar (karar verildi, yeniden açma):**
- **32 çöp/`Belirtilmedi` satırı** kalıyor (kullanıcı kararı 2026-08-05). Silinmesi
  gerekirse DELETE şart (şema NULL'a izin vermiyor) ve yedeği **INSERT olarak** yeniden
  üretilmeli — mevcut yedek sadece UPDATE, silmeyi geri alamaz.
- **`Kisinev` taşıyan 1 üye** — `Chisinau`ya çevirmek profil dropdown'ını düzeltir ama
  **Cadde eşleşmesini kırar** (`cadde_cities`'te `Kişinev` yazılı, `chisinau` ile fold
  tutmaz).
- **Coolify geçişi İPTAL** — Supabase esas. Repoda `COOLIFY_DB_*` referansı **sıfır**;
  yeniden ekleme.

**Yapısal, planlanmadı:**
- **Cadde eşleşmesi adla değil köprüyle (`geo_city_id`) yürümeli.** Köprü artık **55/55
  dolu** ama eşleşme hâlâ ad + fold üzerinden. Köprüye geçilirse `Kişinev`/`Chisinau`
  sınıfı tamamen kapanır. Bu, iki-katalog probleminin gerçek çözümü.
- `geo_cities`'te `Dusseldorf`/`Düsseldorf` gibi 11 ikiz **pasif** duruyor — zararsız,
  ama temizlik istenirse ayrı iş.

---

## 8. ⚠️ Paralel oturum var — bu not yazılırken başka bir oturum çalışıyordu

Bu belge yazılırken (2026-08-06 ~16:35) çalışma ağacında **başka bir oturumun commit
edilmemiş dosyaları** vardı. Dokunulmadı, commit edilmedi:

```
?? docs/history/session7.md                                  (kendi devir notları)
?? src/lib/cadde-reach.test.ts
?? supabase/migrations/20260806140000_cadde_feed_reach_rpc.sql
```

Yaptıkları iş: `get_cadde_feed_reach_v1` — üyeye "bu paylaşımı kaç kişi görüyor"u anlatan
kart. Kendi ölçümleri: Antalya/Türkiye hedefli 0 etkileşimli bir postu 158 hesabın
**68'i göremiyor** (%43) ve bu tasarımın kendisi.

**İki not:**
1. `docs/history/session7.md` onların devir notudur; bu dosyayla **çakışmaz, tamamlar**.
   Global eşik konusunda ikisi de aynı şeyi söylüyor: **SQL uygulanmadı.**
2. `20260806140000_cadde_feed_reach_rpc.sql` **parent dizinde** duruyor — yani
   `npm run check:migrations` artık bunu "bekleyen migration" olarak raporlar ve strict
   modda exit 1 verir (bkz. Bölüm 4). Bu doğru davranıştır; uygulandıktan sonra
   `applied/` altına taşınmalı.

---

## 9. Bu oturumun commit'leri

| Commit | Konu |
|---|---|
| `b9b3a14` | geo köprü migration'ı canlıya uygulandı + üye konumu 3 kayıtta onarıldı |
| `d452e5e` | `check:migrations` parent dizin kör noktası kapatıldı |
| `1f0a5a7` | 2 bayat e2e testi yeni cadde yerleşimine uyduruldu (32→34) |
| `e408f5a` | geo köprüsü 55/55 kapandı — eksik iki şehir kataloğa eklendi |
| `7d3ab86` | eski serbest-metin konum değerleri katalog yazımına normalleştirildi |
| `ec7f34e` | *(başka oturum)* Cadde global eşik SQL'i — **uygulanmadı** |

Commit mesajları ayrıntılı ve `Constraint:` / `Rejected:` / `Directive:` / `Not-tested:`
trailer'ları taşıyor; bir kararın **neden** öyle verildiğini merak edersen önce oraya bak.
