# Relocation Tools: Eksik Görseller + Admin Soru Sayısı Paneli

**Tarih:** 2026-07-01
**Durum:** Onay bekliyor

## Bağlam

`/relocation/tools` sayfasında (bkz. kullanıcı ekran görüntüsü) 7 kartta hero görseli eksik: Banka Seçimi, Sigorta Seçimi, Maaş Hesaplama, Vize Seçimi, Vatandaşlık Testi, Para Transferi, StepStone Maaş Karşılaştırma — hepsi "(Almanya)" etiketli, ref101'den 2026-06-30/07-01'de port edilen yeni araçlar (bkz. proje hafızası `project_ref101_germany_tools_port_2026_06_30`).

Ayrıca kullanıcı, hangi relocation aracında kaç soru olduğunu (hızlı/normal mod ayrımıyla) tablo halinde gösteren bir admin paneli istiyor; DB ile canlı bağlantılı olmalı çünkü bazı araçların soru içeriğini yakında derinleştirecek (ör. daha fazla soru eklenecek) ve panel bunu otomatik yansıtmalı.

## Kısım 1 — Görsel Eksikliği Kök Nedeni ve Çözümü

### Kök neden

`src/lib/relocation-tools-images.ts` içindeki `TOOL_HERO_BY_SLUG` sabit haritası yalnızca ilk 10 relocation aracının slug'larını içeriyor. `ToolLandingCard.tsx` şu şekilde çalışıyor:

```ts
const heroImage = toolHeroImage(tool.slug); // haritada yoksa undefined
...
{heroImage && <img src={heroImage} ... />}  // undefined ise hiç render edilmiyor
```

7 yeni Almanya aracının slug'ları (`banka-secim-almanya`, `sigorta-secim-almanya`, `maas-hesaplama-almanya`, `vize-secim-almanya`, `vatandaslik-testi-almanya`, `para-transferi-almanya`, `stepstone-karsilastirma-almanya`) bu haritada yok, ve `public/relocation-tools/` klasöründe bu isimlerle `.jpg` dosyası da yok. Sonuç: kartlar görselsiz render ediliyor (ekran görüntüsündeki bozuk grid budur).

### Çözüm

1. **Görsel üretimi (Higgsfield `generate_image`):** Mevcut 10 görselin stiliyle tutarlı (flat vector illustration, cream/bej arka plan `#F5EFE3` civarı, teal `#2F6F6B`-ish ana renk + turuncu/amber `#E8823C`-ish aksan, 16:9 oran, karakter + ikon kompozisyonu) 7 yeni hero görseli üretilecek. Onaylanan konseptler:
   - **Banka Seçimi:** karakter banka kartı tutuyor, arkasında çoklu banka ikon/logo şeması
   - **Sigorta Seçimi:** karakter şemsiye/kalkan ikonuyla, sağlık+eşya sigortası sembolleri
   - **Maaş Hesaplama:** karakter hesap makinesi + € banknot ile
   - **Vize Seçimi:** karakter pasaport tutuyor, önünde yol ayrımı/işaret levhası
   - **Vatandaşlık Testi:** karakter kitap/sınav kağıdı + Almanya bayrağı motifi
   - **Para Transferi:** karakter telefon tutuyor, EUR→TRY ok/döviz sembolü
   - **StepStone Maaş Karşılaştırma:** karakter bar chart/grafik paneliyle

2. Üretilen 7 görsel `public/relocation-tools/<slug>.jpg` yoluna kaydedilir (dosya adları yukarıdaki slug'larla birebir).

3. `src/lib/relocation-tools-images.ts` → `TOOL_HERO_BY_SLUG` haritasına 7 yeni satır eklenir. Fonksiyon mantığı değişmez (yeni satır eklemek yeterli).

**Etki alanı:** sadece 1 dosya kod değişikliği (`relocation-tools-images.ts`) + 7 yeni statik asset. Component/API/DB değişikliği yok.

## Kısım 2 — Admin "Araç Soru Sayıları" Paneli

### Mimari netliği (önemli, tartışıldı)

Relocation tools "ortak motoru" (`relocation_tools` + `relocation_tool_questions` + `relocation_tool_sessions/answers/results` + genel RPC'ler) sadece **paylaşılan altyapı**dır (oturum/cevap CRUD + dispatch). Her aracın **skorlama mantığı ayrıdır** (kendi `weights` jsonb + kendi skor RPC'si). 17 relocation aracından 5 tanesi (Maaş Hesaplama, Vize Seçimi, Vatandaşlık Testi, Para Transferi, StepStone) bu ortak motoru **bilinçli olarak kullanmıyor** çünkü mantıkları "N ağırlıklı soru → skor" kalıbına uymuyor (sınav havuzu / karar ağacı / deterministik hesaplayıcı). Bu, eksiklik değil kasıtlı mimari ayrımdır.

Bu nedenle panel, her aracı **gerçek tipine göre** ve **gerçek veri kaynağından canlı sayarak** gösterir — statik `quick_question_count`/`detailed_question_count` kolonları güvenilir değildir (migration'larda elle girilmiş, standalone araçlarda hep `0`).

### Araç tipleri ve sayım kaynağı

| Tip | Kapsam | Sayım kaynağı |
|---|---|---|
| **Soru Bankası (motor)** | 12 araç: orijinal 10 + Banka Seçimi + Sigorta Seçimi | `relocation_tool_questions` tablosu → `tool_key` + `mode` bazlı `count()` (`mode='quick'`, `mode='detailed'`, `mode='both'` her ikisine de sayılır) |
| **Soru Bankası (standalone)** | Vatandaşlık Testi | `germany_citizenship_questions` tablosu → `count()` (genel + eyalet kırılımı ayrı gösterilebilir) |
| **Karar Ağacı** | Vize Seçimi | `src/lib/germany-vize-data.ts` → `VIZE_QUESTIONS.length` (derleme zamanı sabit, DB değil) |
| **Hesaplayıcı** | Maaş Hesaplama, Para Transferi, StepStone | Form alanı sayısı (kod içinde sabit, ör. Maaş Hesaplama ~6 alan: vergi sınıfı, eyalet, kilise vergisi, sigorta, brüt/net yönü) |

### Sayfa

**Route:** `/admin/relocation-tools/soru-sayilari` (yeni), `src/pages/admin/relocation/routes.tsx` içine eklenir (mevcut `relocation-ingestion` alt-ağacının yanına, ayrı bir `Route`).

**Dosyalar:**
- `src/pages/admin/relocation/RelocationToolsQuestionCountsPage.tsx` — yeni sayfa, `AdminPageShell` deseni (`AdminToolRegistryPage.tsx` referans alınır: arama kutusu + tablo, ama veri DB'den React Query ile)
- `src/lib/relocation-tools-admin-api.ts` — yeni, `relocation-tools-api.ts` deseniyle tutarlı: `relocation_tool_questions` üzerinden `group by tool_key, mode` sorgusu + `germany_citizenship_questions` count'u tek fonksiyonda birleştirip normalize eder; Vize/Hesaplayıcı satırları için sabit kod-kaynaklı sayılar bir `const` map ile eklenir
- `src/pages/admin/relocation/routes.tsx` — yeni `<Route path="soru-sayilari" element=.../>` eklenir
- `src/lib/admin-shell/admin-route-meta.ts` ve `admin-navigation-registry.ts` — yeni path + menü girdisi eklenir (mevcut `relocation-ingestion` girdilerinin yanına, "Taşınma Veri Toplama" grubuna veya yeni bir "Relocation Araçları" grubuna)

**Tablo kolonları:** Araç Adı | Kategori | Tip (rozet: Soru Bankası/Karar Ağacı/Hesaplayıcı) | Hızlı | Normal | Toplam | Durum (Aktif/Pasif)

React Query key: `["admin", "relocation-tools", "question-counts"]`, cache'siz her admin ziyaretinde tazelenir (kullanıcı içerik derinleştirdikçe panel güncel kalsın diye `staleTime: 0` veya kısa).

## Kapsam Dışı

- Görsellerin İngilizce/diğer dil versiyonları
- Soru bankası CRUD (ekleme/düzenleme) — bu panel salt-okuma, sadece sayım gösterir
- `relocation_tools.quick_question_count`/`detailed_question_count` statik kolonlarının migration ile düzeltilmesi (opsiyonel, ayrı iş)

## Doğrulama

1. `npm run build` + `npm run lint` temiz
2. `npm run test` — yeni admin sayfası için basit render/data-shape testi (`RelocationToolsQuestionCountsPage.test.tsx`, mevcut admin test desenleri)
3. Dev server (`npm run dev`) ile:
   - `/relocation/tools` → 17 kartın hepsinde görsel görünüyor mu (görsel QA)
   - `/admin/relocation-tools` (veya belirlenen path) → tablo doğru say ve doğru Tip rozetiyle geliyor mu
