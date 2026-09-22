# Faz 10 — Relocation karar paketi (B27–B31)

**Tarih:** 22 Eylül 2026 · **Durum:** B29 uygulandı (kod); B27 · B28 · B30 · B31 karar bekliyor
**Kaynak:** `docs/kalanlar/2026-09-21-KALANLAR.md` Faz 10 ·
`docs/kalanlar/2026-09-21-relocation-kalan-kararlar.md`

Bu dosya beş kararın her biri için **canlıdan ölçülmüş** girdiyi, seçenekleri ve bir
öneriyi taşır. Uygulama adımı yoktur; her karar onaylandıktan sonra yol haritasına
kendi adımı olarak açılır.

---

## Önce: bugün canlıda gerçekten ne var

Beş kararın hepsi "veri var mı" sorusuna dayanıyor, o yüzden önce tablo:

| Tablo | Satır | Ne anlama geliyor |
|---|---|---|
| `relocation_required_documents` | **204** | Belge sekmesi gerçek veriyle çalışıyor |
| `relocation_living_costs` | **192** | 12 ülke × 6 kalem × household varyantları |
| `relocation_job_market_signals` | **40** | İş piyasası sinyali var |
| `relocation_locations` | **32** | Şehir/ülke kayıtları |
| `relocation_source_registry` | **8** | Kaynak defteri kurulu (Your Europe, Make it in Germany, BNetzA, …) |
| `relocation_bureaucratic_steps` | **2** | Bürokrasi sekmesi neredeyse boş |
| `relocation_jobs` | **0** | **İş sekmesini besleyecek veri yok** |
| `relocation_services` | **0** | **Servis verisi yok** |

---

## B27 — Üç demo sekmesini (İş · Okullar · Hoşgeldin) ne besleyecek?

**Ölçüm:** `relocation_jobs` **0**, `relocation_services` **0**. Okullar ve Hoşgeldin
Paketi için ayrılmış bir tablo **hiç yok**. Yani üç sekmenin üçü de bugün örnek
içerikle çiziliyor ve `isDemoRoute("/relocation")` ile gateli (doğru desen).

| Seçenek | Ne gerektirir | Ne zaman biter |
|---|---|---|
| **A. Sekmeleri kaldır** | Sadece kod. Üç sekme silinir, `/relocation` demo satırı `DEMO_ROUTES`'tan çıkar, sayfa tamamen gerçek veriye döner (şehir · servis · bürokrasi · maliyet · belge). | Bugün |
| **B. Mevcut kataloğa bağla** | `catalog_items` içindeki `Business_*` (25, **25/25 placeholder**) ve `Organization_EducationInstitution` kayıtlarına bağla. Bugün gerçek kayıt olmadığı için **boş sekme** demek. | Kayıt gelince |
| **C. Yeni tablo + içerik sahibi** | `relocation_jobs`/`relocation_services` doldurulur, Okullar ve Hoşgeldin için yeni tablo açılır. En pahalı yol; içerik toplayacak bir sahip ister. | Sahip atanınca |

**Öneri: A.** Sayfanın diğer beş sekmesi zaten gerçek veri gösteriyor; üç boş sekme
sayfanın tamamını "demo" etiketiyle tutuyor. Kaldırmak `/relocation`'ı demo
listesinden çıkarır ve sayfa bugün yayına hazır hâle gelir. B ve C her zaman
sonradan yapılabilir — sekmeyi geri eklemek ucuz, yanlış izlenim pahalı.

⚠️ B27 ve B31 **aynı `DEMO_ROUTES` desenini paylaşır** — birini uygularken öbürüne bak.

---

## B28 — Maliyet kaynağı + tazeleme sorumlusu; `freshness_at` arayüzde görünsün mü?

**Ölçüm — kararın kilit noktası:**

- `relocation_living_costs.source_id` → **0 / 192 dolu.** Kaynak defteri (8 kayıt)
  kurulu ama **hiçbir maliyet satırı ona bağlı değil.**
- `freshness_at` → **192 / 192 dolu** (hepsi içe aktarma anında yazıldı).
- `note` → 62 / 192.
- Son `updated_at`: **2026-09-21** (hepsi aynı gün).

Yani bugün ekranda bir tazelik tarihi gösterilebilir, ama **o tarihin arkasında bir
kaynak yok**. "21 Eylül 2026 itibarıyla" yazmak, doğrulanmamış bir rakama doğrulanmış
görüntüsü verir.

| Seçenek | Sonuç |
|---|---|
| **A. Önce `source_id`'yi doldur, sonra göster** | 192 satır 8 kaynaktan birine bağlanır; arayüzde "kaynak + tarih" birlikte çıkar. Bağlanamayan satır için "kaynak belirtilmemiş" yazılır. |
| **B. Yalnız tarihi göster** | Ucuz ama yanıltıcı: tarih tazeliği değil, içe aktarma gününü gösterir. |
| **C. Hiçbirini gösterme** | Bugünkü durum. Kullanıcı rakamın ne kadar eski olduğunu bilemez. |

**Öneri: A**, ve **tazeleme sorumlusu atanmadan gösterme.** Kaynak defterindeki
`refresh_sla_hours` alanı (168 = haftalık) zaten var; sahibi olmayan bir SLA, arayüzde
tutulamayan bir söz verir.

---

## B29 — Şehir kırılımı (192 satırın tamamı `city_code` NULL)

> ✅ **22.09 · Seçenek A UYGULANDI — okuma tarafı artık şehir farkındası.**
> `groupCostsByCountry` → `groupCostsByScope` oldu; anahtar `country_code + city_code`.
> Panel (`LivingCostsPanel`) ülke geneli ile şehri **ayrı kart** çizer ve başlıkta
> "· ülke geneli" / "· BER" yazar. AI bağlamı (`relocation-chat-context.ts`) aynı
> sözleşmeye geçti: `DE (ülke geneli)` ve `DE/BER` ayrı satır. **6 test eklendi**
> (şehir↔ülke karışmaz, iki şehir karışmaz, ülke geneli önce gelir, kapsam toplamı
> yalnız o kapsamdan, bot iki rakamı da yazar). Tam suite **329 dosya / 2.442 test**.
> **Veri hâlâ girilmedi** — artık girilebilir; kalan karar "hangi şehirler".
> ⚠️ Panel ile bot AYNI sözleşmededir; birini değiştiren öbürünü de değiştirmelidir.

**Yol haritası bu kararı bir önkoşula bağlamıştı: "önce `pickRowForHousehold` okuma
tarafı gözden geçirilmiş." Gözden geçirildi — ve sonuç kararı değiştiriyor.**

`src/lib/relocation-content-format.ts` okuma zinciri **düzeltmeden önce** şöyleydi:
`groupCostsByCountry` (ülke) → `groupCostsByItem` (kalem) → `pickRowForHousehold`
(hane halkı). **Hiçbir aşamada `city_code` yoktu.**

Sonuç: `city_code` doldurulsaydı Berlin kirası ile Almanya geneli kirası **aynı gruba**
düşerdi; `pickRowForHousehold` ikisinden birini `household_size`'a göre seçer,
eşitlikte **dizi sırasına** göre karar verirdi. Bu, aynı dosyada ülke ekseni için zaten
belgelenmiş olan hatanın şehir eksenindeki aynısıdır: panel tek rakam gösterir,
hangisi olduğu DB sırasına bağlıdır. Zincir bugün `groupCostsByScope` (ülke + şehir) →
`groupCostsByItem` → `pickRowForHousehold` biçimindedir.

| Seçenek | Sonuç |
|---|---|
| **A. Okuma tarafını şehir farkındası yap, sonra doldur** | `groupCostsByCity` eklenir ya da gruplama anahtarı `country+city+item` olur; panel "Almanya geneli" ile "Berlin"i ayrı satır çizer. Sonra veri doldurulur. |
| **B. Önce doldur** | **Sessiz yanlış rakam.** Test kırılmaz, hata çıkmaz. |
| **C. Hiç doldurma** | Bugünkü durum korunur; maliyetler ülke geneli kalır. Dürüst ama kaba. |

**Öneri: A ya da C — B kesinlikle değil.** Veri doldurmadan önce okuma tarafı
düzeltilmelidir; sıra tersine çevrilirse hata canlıda görünmez.

---

## B30 — Para birimi: üye tek karşılık görsün mü?

**Ölçüm:** 12 ülke, **7 farklı para birimi** (EUR 5 ülke · USD · QAR · SEK · AED ·
CAD · CHF · GBP). Repoda **kur kaynağı yok** — `relocation_source_registry`'deki 8
kaydın hiçbiri döviz kuru sağlayıcısı değil.

| Seçenek | Sonuç |
|---|---|
| **A. Gösterme (bugünkü durum)** | Her ülke kendi para biriminde. Karşılaştırma kullanıcıya kalır. |
| **B. Kur sağlayıcısı ekle, sonra göster** | Yeni bir dış bağımlılık + `source_registry` kaydı + tazeleme SLA'i. Tek karşılık gerçekten faydalı. |
| **C. Sabit kur gir** | **Yapılmaz.** Yol haritasının kendi kuralı: "kur kaynağı yoksa girilmez." |

**Öneri: A**, B ancak B28'in kaynak/tazeleme çerçevesi kurulduktan sonra anlamlı —
ikisi aynı altyapıyı paylaşır.

---

## B31 — `/businesses` gerçek veriye geçiş

**Ölçüm:** `Business_*` kayıtları → **25 adet, 25/25 `is_placeholder = true`.**
Yani "gerçek kayıt geldi mi?" sorusunun cevabı bugün **hayır**.

Beş adım (yol haritasının şartı: birlikte yapılır) → **bugün başlatılamaz**, çünkü ilk
şart olan gerçek kayıt yok. `DEMO_ROUTES`'tan `/businesses` satırı **kalmalıdır**.

⚠️ Kayıt sıfırken sitemap'e eklenmez — `/cadde` ile bir kez yaşandı ("Crawled –
currently not indexed").

**Öneri: karar "bekliyor" olarak kapatılır**, tetikleyici yazılır: ilk gerçek
(placeholder olmayan) `Business_*` kaydı geldiğinde beş adım birlikte açılır.

---

## Özet — beş kararın önerilen hâli

| # | Öneri | Bugün uygulanabilir mi |
|---|---|---|
| B27 | **A** — üç boş sekmeyi kaldır, `/relocation`'ı demodan çıkar | Evet |
| B28 | **A** — önce `source_id` doldur, tazeleme sahibi atanmadan gösterme | Kısmen (sahip kararı ister) |
| B29 | ✅ **A uygulandı** — okuma tarafı şehir farkındası; veri girilebilir | **Bitti** |
| B30 | **A** — kur kaynağı yok, tek karşılık gösterilmez | Evet (değişiklik yok) |
| B31 | Tetikleyiciyle beklet — gerçek kayıt yok | Hayır |
