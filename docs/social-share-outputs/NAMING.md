# docs/social-share-outputs/ — Dosya Adı Kuralı (TEK KAYNAK)

Bu dosya, `docs/social-share-outputs/` klasörüne görsel eklerken kullanılan dosya adı
kodunu sabitler. Kod her değiştiğinde (ör. panel mantığı değişirse) bu dosya da
güncellenir — tahmin/hatırlama yerine buraya bakılır.

## Temel formül

Kaynak: `src/components/admin/social-share/UnifiedShareList.tsx:242-244`

```
displayOrder = panelde kartın üstünde yazan numara (1..100, sabit — RANDOMIZED_ORDER
               bir kez rastgele üretilip kilitlendi, bir daha DEĞİŞMEZ)
promptNo     = 1 (kapak görseli) veya 2 (ek görsel)
variantNo    = sadece çok-varyantlı kalemlerde (Burak, Test Araçları) var, 1'den başlar

tek varyantlı kalem (Araç Tanıtımları, Diaspora Postları):
  dosya adı = `${displayOrder}${promptNo}`

çok varyantlı kalem (Burak, Test Araçları):
  dosya adı = `${displayOrder}${variantNo}${promptNo}`
```

## Somut örnekler

| Panelde görünen | Kaynak | Anlamı | Dosya adı |
|---|---|---|---|
| 100 | Diaspora Postları (tek varyant) | 100. kartın 1. görseli (kapak) | `1001.png` |
| 100 | Diaspora Postları (tek varyant) | 100. kartın 2. görseli (ek) | `1002.png` |
| 41 | Burak (çok varyant) | 41. kartın varyant 1, kapak | `411.png` |
| 41 | Burak (çok varyant) | 41. kartın varyant 2, ek görsel | `412.png` (varyant 2, prompt 2 — 3 haneli ama farklı anlam, DİKKAT) |

**Kritik tuzak:** 3 haneli bir dosya adı (`412.png` gibi) İKİ farklı şekilde okunabilir —
tek-varyantlı kalemde "displayOrder=41, promptNo=2" (ama bu 2 haneli olurdu, `412` olmaz)
YA DA çok-varyantlı kalemde "displayOrder=41, variantNo=1, promptNo=2". **Hangi yorumun
doğru olduğu, o `displayOrder` numarasının HANGİ KAYNAĞA ait olduğuna bağlı** — tek başına
dosya adına bakarak kesin çözülemez, `UNIFIED_ITEMS`'ta o displayOrder'ın hangi `tab`'a
(`tools`/`diaspora`/`tests`/`burak`) ait olduğu bilinmeli.

## displayOrder ≠ globalId — ASLA KARIŞTIRMA

- **`displayOrder`** = panelde görünen numara, kartın `RANDOMIZED_ORDER` dizisindeki
  pozisyonu + 1. Dosya adı bunu kullanır.
- **`globalId`** (`item-1`..`item-100`) = veritabanı kimliği (`slot_key` içinde geçer),
  kaynak dosyada (`burak-share-tools.ts`, `social-diaspora-posts.ts` vb.) sabit tanımlı.
  Dosya adında ASLA görünmez.
- İkisi arasındaki eşleme `src/lib/admin-shell/social-share-unified.ts` içindeki
  `RANDOMIZED_ORDER` dizisinin kendisi — `RANDOMIZED_ORDER[displayOrder - 1] === globalId`.
  Bu dizi **kilitli, bir daha değişmeyecek** (kullanıcı kararı, 2026-07-23).

## Yeni görsel eklerken kontrol listesi

1. Admin panelinde (`/admin/social-share-vault`) kartın üstündeki numarayı oku — bu `displayOrder`.
2. Kartın kaç varyantı olduğuna bak (Burak/Test Araçları = çok varyant, diğerleri = tek varyant).
3. Yukarıdaki formülle dosya adını üret, `docs/social-share-outputs/` içine koy.
4. **[[feedback_social_share_new_images_workflow]]** kuralına göre: dosyayı hem git'e commit
   et hem `social_share_assets`/`social_share_asset_images` tablosuna slot_key ile kaydını düş
   (slot_key = `${globalId}/variant-${variantIndex}`, globalId'yi bulmak için adım 5'e bak).
5. `globalId`'yi bulmak için: `RANDOMIZED_ORDER[displayOrder - 1]` (0-tabanlı index —
   displayOrder 100 ise `RANDOMIZED_ORDER[99]`).
