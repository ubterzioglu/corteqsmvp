# Batch C/E/F + iki sessiz canlı kusur — devir notu

**Devir tarihi:** 5 Eylül 2026 (ikinci yarı)
**Öncül:** `docs/handover/2026-09-05-profil-ws1-batch-b.md` (aynı günün ilk yarısı)
**Dal:** `main` · commit `fff0e26` … `21e2275`

## Kısa sonuç

Üç batch tek turda ilerledi. **İki sessiz canlı kusur** bulundu ve düzeltildi; ikisi de
build'i, testi ya da lint'i hiç kırmıyordu — yalnız kullanıcıda yanlış çalışıyordu.
Batch C'de **kod yazılmadı** ve bu bilinçli: dokuz yargıç üç tasarımı da reddetti.

---

## 1) Sessiz kusur: fontlar canlıda hiç yüklenmiyordu

`index.html` fontları `media="print" onload="this.media='all'"` hilesiyle çağırıyordu.
CSP `script-src`'inde `'unsafe-inline'` YOK (bilinçli karar, "Değişmez sözleşmeler" md.3),
bu yüzden tarayıcı inline `onload`'ı **hiç çalıştırmadı** ve stylesheet `media="print"`
olarak kaldı.

**Kanıt (canlı, Playwright):** `link.media = "print"`, `document.fonts` **boş**.
Site aylardır `system-ui` ile görüntüleniyordu.

Düzeltme: hile kaldırıldı, `preload` + doğrudan stylesheet. Deploy sonrası ölçüm:
`media: ""`, `Inter:loaded`, `cspViolations: []`.

**Sözleşme testi:** `src/lib/index-html-csp.test.ts` — inline olay işleyicisi yok, font
stylesheet'i print'e park edilmemiş, inline script yalnız JSON-LD olabilir.
⚠️ Test HTML **yorumlarını eler**; yoksa dosyanın kendi uyarı yorumu yanlış pozitif üretir
ve testi susturmak için uyarıyı silmek gerekirdi — test belgeyi bozardı.

## 2) Sessiz kusur: 6 üye hiç paylaşım yapamıyordu

Profil formu ülkeyi `geo_countries`'ten seçtiriyor ("ABD", "İngiltere"), Cadde
`cadde_countries` ile eşleştiriyor ("Amerika Birlesik Devletleri", "Birlesik Krallik").
`20260805130000` fold eşleşmesi eklemişti ama bunlar yazım varyantı **değil, farklı
kelimeler** — fold da eşleştiremez. `country_id` NULL kalıyor, `create_cadde_post_v2`
`cadde_invalid_targets` fırlatıyordu.

Düzeltme: veri onarımı yerine **köprü**. `cadde_countries.geo_country_id` canlıda 22/22
dolu; join artık katalog adı **veya** bağlı geo adı ile eşleşiyor (mig `20260905120000`).
Tek tek ad onarımından üstün: formun üreteceği her eş-adı kalıcı kapatır.

**Ölçüm: çözülen üye 107 → 113.** Kalan 16 gerçek ülke değil ("Belirtilmedi" 14 eski
WhatsApp-bot kaydı + "a" + "De").

## 3) Batch C — rol/etiket mimarisi: uygulanmadı, bilinçli

3 bağımsız tasarım × 3 lens (geçiş / mantık / ürün) = 9 yargıç. **Üçü de 3/10** aldı.
Kanıtlanmış kusurlar: `update_profile_attribute`'un yetki kapısı birleşim agregatında
yapısal olarak siliniyor · `has_cadde_feature` skaler alt sorgudur, birleşim CTE'si 21000
ile kırar · yeni `SECURITY DEFINER` fonksiyonlar REVOKE'suz · üç tasarım da etiketi dizin
sorgusunda `distinct on ... is_primary desc` ile atıyor (etiket aranamıyor).

**Asıl bulgu ürünsel:** soru "etiketi nereye yazalım" değil, "etiket nerede görünsün ve
ne iş yapsın". Cevaplanması gereken ilk soru: **unvan yetki mi verir, yalnız görünür mü?**
"Yalnız görünür" cevabı işin ~%80'ini kaldırır.
Karar notu: `docs/plans/2026-09-05-rol-etiket-mimarisi-karar-notu.md`.

## 4) Batch F — 73 maddenin kanıt turu

45 kanıtlı · 21 kısmen · 1 kanıt-yok · 6 kod-dışı. Denetim **8 iddiayı çürüttü**.
Rapor: `docs/status/2026-09-05-burak-onay-kuyrugu-kanit-raporu.md`.

⚠️ **m9 — düzeltildi ama yarım:** Cadde "Ek hedef" düğmesi normal üyede paylaşımı
kaybettiriyordu (`cadde.post.multi_target` anahtarı `afs_features`'a hiç eklenmemiş;
yöneticiler muaf olduğu için test hesaplarında görünmüyordu). Composer'a
`canAddExtraTarget` kapısı eklendi, **varsayılan kapalı** — kayıp durdu. Açılması ürün
kararı bekliyor.
⚠️ **m22 geçersiz:** "Enter ile gönder" diyor, daha yeni WS2-80/81 tersini söylüyor ve
canlıda WS2 uygulanmış. Onaylanmamalı, kapatılmalı.
⚠️ **m11 bayat:** "globale çıkış performans eşiğine bağlı" — eşikler 10 Ağustos'ta 0/0/0.

## 5) Batch E — 44 revizyon isteği

Triyaj: 43 madde, 20 yapılabilir, 23 ürün kararı/ekran görüntüsü bekliyor.

**Kapatılanlar (kanıtla, 44 → 39):** tagline, "Ol" satır kırılması, geri bildirim linki,
kafe kapasitesi, muhasebe bütçe.

**Düzeltilenler:** taşınma testi CTA regresyonu (2 Ağustos'ta gerekçesiz kilitlenmiş,
testler bozuk davranışı kilitliyordu) · dizin admin filtresi (SQL önek bakıyor, TS tam
eşleşme bakıyordu → `Admin_SuperAdmin` kaçıyordu) · cafe başlığı · composer etiketleme
ipucu · fallback uyarı şeridi · Radar rehberlerine ülke filtresi · dizinde kurum kayıtları
kart görünümü.

**İkinci parti düzeltmeler (commit `5908ad4` … `ee46608`):**
- **Kafe temaları** — "İş" teması hiç yoktu, "İK" `hr` anahtarıyla ve İngilizce "HR"
  etiketiyle duruyordu (mig `20260905160000`). ⚠️ Anahtar `hr` **bilinçli bırakıldı**:
  `cadde_cafes.theme_key='hr'` olan kayıtlar var ve RPC temayı bu tabloya karşı
  doğruluyor; yeniden adlandırmak eski kafeleri geçersiz temaya düşürürdü.
  Frontend değişmedi ve değişmesi gerekmedi — liste sabit değil, tablodan okunuyor,
  yani yeni tema **deploy beklemeden** görünür.
- **Tepkiler tek tetiğin arkasında + boş kutulara maskot.** ⚠️ Hazır `HoverCard`
  bileşeni **kullanılmadı**: Radix her render'da içindeki odaklanabilir öğeye
  `tabindex="-1"` veriyor, beş tepki **düğmesi** oraya konsaydı klavyeyle hiç
  ulaşılamazdı. Yerine satır içi disclosure yazıldı, test bunu kilitliyor.
  Yolda gerçek bir kusur bulundu: fare tetikten panele geçerken panel kapanıyordu,
  yani tepki düğmelerine fareyle hiç tıklanamıyordu (180 ms gecikmeli kapanışla çözüldü).
- **Çarşı kategori rozetleri** tıklanabilir; sayfa URL parametresini okuyor (link
  "görünür ama işe yaramaz" olmasın diye).
- **Araçlarda şehir drill-down** + sihirbazda ISO kodu yerine ülke adı. Değer hâlâ
  alpha-2 kod; değişen yalnız görünen etiket.
- **Radar rehberlerine ülke filtresi** ve **dizinde kurum kayıtları kart görünümü**.

⚠️ **Ajan tool kataloğu drift'i:** `cadde-carsi-api.ts`'e iki export eklenince
`scripts/agent/tools-catalog.test.mjs` kırıldı. Çözüm testi gevşetmek değil,
`npm run ingest:tools` çalıştırmak. `check:drift` bunu **görmez** — ayrı mekanizma.

**Ölçümle kod işi olmadığı anlaşılanlar (not düşüldü, status korundu):**
- `fb174151` Cadde şehir filtresi: katalog dar seçilmiş değil, **üye konumlarından
  türüyor** (`cadde_profile_city_sync` trigger'ı). ABD'de 2 şehir görünmesinin sebebi
  ABD'de 2 üye olması. Karar gerekiyor — filtre yalnız dolu şehirleri mi göstersin?
- `9f1d416f` Radar metinleri: 9 kayıt, özeti boş olan 0, yedek cümleye düşen 0, ortalama
  70 karakter. Metinler gerçek ama kısa; `/admin/marquee`'den uzatılır.

---

## Sıradaki adımlar

1. **Üç ürün kararı** — (a) unvan yetki mi verir, (b) ek hedef ücretli mi, (c) m22 kapatılsın mı.
2. **45 maddeyi Burak'a tek turda sun** (rapor hazır).
3. Kalan yapılabilir revizyon maddeleri: renkli sonuç grafikleri (`a275f131`), CTA'dan
   test sonucuna geri dönüş (`0838da0b`), araç sonucunu profile kaydetme (`50362e2a`).
4. WS1-7 (SMTP → e-posta doğrulaması) ve WS1-8/11 (OTP sağlayıcı) hâlâ dış karar bekliyor.
5. ~~Takip işi: araçlardaki şehir drill-down'ın 1. adımı, kullanıcının 4. soruda verdiği
   `target_countries` cevabını okumuyor~~ → **KAPANDI** (`dea913c`). Kapsam
   `src/lib/relocation-city-scope.ts` ile türetilip `QuestionRenderer`'a dar bir
   `scopeCountryCodes` prop'u olarak geçiyor. Kapsam dışı ülkeler **gizlenmez**, yalnız
   başa alınır — ülke bir kapı değil daraltmadır; kapsam boşsa eski davranış korunur.

## ⚠️ Windows tuzağı: küçük harfli `c:` çalışma dizini testleri sahte kırar

`npm run test` **266 dosyanın 262'sinde** şu hatayı verirse tek bir gerçek kusur yoktur:

```
TypeError: Cannot read properties of undefined (reading 'config')
  at initSuite (@vitest/runner/dist/chunk-artifact.js:1848)
```

Sebep sürücü harfinin küçük olmasıdır. Node'un ESM yükleyicisi `file:///c:/...` ile
`file:///C:/...` adreslerini **farklı modül** sayar, böylece `@vitest/runner` worker
sürecinde İKİ KEZ örneklenir (modül gövdesine log konarak doğrulandı: aynı pid'de iki
"INSTANTIATE"). Vitest `runner`'ı bir örnekte kurar; test dosyasının `import { describe }
from "vitest"` ile aldığı diğer örnekte `runner` tanımsız kalır ve `describe` daha ilk
satırda patlar. Yani hata **toplama (collection) aşamasındadır**, testlerle ilgisi yoktur.

**Çözüm:** komutu büyük harfli dizinden çalıştır (`C:\temp_private\corteqs\corteqs_fin`).
Aynı komut küçük harfte 262 başarısız, büyük harfte 266 başarılı — ikisi de ölçüldü.
`npm run test` çıktısının ilk satırındaki `RUN v4.1.11 c:/...` / `C:/...` yolu hangi
durumda olduğunu tek bakışta söyler; **önce oraya bak**.

⚠️ Bunu "vitest 4 / jsdom 29 yükseltmesi bozdu" diye teşhis etme ve bağımlılık düşürme.
Yükseltme (`5c75dca`, vitest 3.2.4→4.1.11, jsdom 20→29) masumdur: eklentisiz minimal
config, `--environment=node` ve `--pool=forks` ile de aynen tekrarlanır — **config
suçsuz, cwd suçlu**.

## Son durum (ölçüldü)

| Kontrol | Sonuç |
|---|---|
| Test | **1852 geçti** / 267 dosya (gün başı 1768 → 1841 → 1852) |
| ESLint | 0 problem |
| tsc | 22 (taban, artmadı) |
| Build | yeşil |
| Migration | 383 dosya / 383 canlı kayıt, sapma yok |
| Dal | `main`, **`d5f7d4f`'e kadar push edildi** (uzak `git ls-remote` ile doğrulandı) |

⚠️ `public/sitemap.xml` (yalnız `lastmod` tazelenmesi) ve
`docs/status/mevcut-profil-yapisi-raporu-2026-08-20-sade-anlatim.html` çalışma dizininde
commit edilmemiş duruyor. **İki oturumun da ilk `git status` anlık görüntüsünde zaten
vardılar**, yani daha önceki bir oturumdan kalmışlar; ikisi de dokunmadı. Commit edilip
edilmeyecekleri kullanıcı kararı.

## Bu turda öğrenilen üç şey

1. **Kodun var olması kullanıcıda çalıştığı anlamına gelmez.** m9'da arayüz hazır, sunucu
   reddediyor; fontta link var, media yanlış. Kanıt = canlı ölçüm, kaynak okuması değil.
2. **Yönetici muafiyeti kusuru gizler.** `is_admin` muaf tutan her kontrolü normal üye
   hesabıyla sına — aksi hâlde "testçide çalışıyor, üyede bozuk" aylarca sürer.
3. **Test bozuk davranışı kilitleyebilir.** CTA regresyonunda üç iddia "Yakında" rozetini
   doğruluyordu. Testin geçmesi davranışın doğru olduğunu göstermez.
