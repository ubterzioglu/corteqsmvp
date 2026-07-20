# BURAK BURAYA BAK — Mevcut Görsellerin DB'ye Seed Edilmesi

**Tarih:** 2026-07-20
**Durum:** Onaylandı, plan aşamasına geçiliyor.

## Problem

`docs/social-share-outputs/` klasöründe, ChatGPT ile üretilmiş 32 adet PNG görsel var
(`11.png`, `12.png`, `21.png`, `22.png`, `311.png`, ... `1231.png`, `1232.png`). Bu görseller
BURAK BURAYA BAK aracının (`/admin/social-share-vault`) çeşitli araç/varyant/prompt
kombinasyonlarına ait, ama henüz admin panelde görünmüyorlar — her birinin elle tek tek
`BurakMediaPanel` üzerinden yüklenmesi gerekirdi. Bu iş, dosyaları doğru slotlara otomatik
yükleyen bir seed script'i ile bu elle yükleme adımını ortadan kaldırıyor.

## Dosya Adlandırma Kodu (doğrulandı)

Kod: `<araçOrder><varyant><promptNo>` — **varyant 1 ise varyant hanesi atlanır.**

Bu, `UnifiedShareList.tsx`'teki canlı UI etiketiyle (`simpleLabel`, satır 303-305) birebir
aynı formül:
```ts
const simpleLabel = singleVariant
  ? `${displayOrder}${promptNo}`
  : `${displayOrder}${variantNo}${promptNo}`;
```
Burak filtresi aktifken `displayOrder === item.order` (1..12), yani filtre kodu doğrudan
`burak-tool-N`'nin `N`'sine eşittir.

Örnekler:
- `11` → tool 1, varyant 1, prompt 1
- `12` → tool 1, varyant 1, prompt 2
- `311` → tool 3, varyant 1, prompt 1
- `321` → tool 3, varyant 2, prompt 1
- `1221` → tool 12, varyant 2, prompt 1
- `1232` → tool 12, varyant 3, prompt 2

32 dosyanın tamamı bu kuralla çelişkisiz çözülüyor (doğrulandı, mtime sıralaması da tool
sırasıyla tutarlı).

## Slot / Tablo Eşlemesi

Mevcut kod tabanı (`burak-share-assets.ts`, `burakSlotKey`) şu yapıyı kullanıyor:

- **Slot** = `tool × variant` → `burakSlotKey("burak", "burak-tool-<order>", variantIndex)`
  = `burak/burak-tool-<order>/variant-<variantIndex>` (variantIndex = varyant - 1, 0-tabanlı).
- Her slotta en fazla 1 **kapak görseli** (`social_share_assets` tablosu, `slot_key` UNIQUE) +
  N adet **ek görsel** (`social_share_asset_images` tablosu, `slot_key` + `sort_order`).
- Her varyantın 2 prompt görseli var (p1, p2):
  - **p1 → kapak görseli** (`social_share_assets`)
  - **p2 → ek görsel** (`social_share_asset_images`, `sort_order = 0`)

Bu ayrım admin panelin "Görsel" butonundaki kapak+ek görsel gösterimiyle birebir uyumlu.

## Uygulama

Tek seferlik Node/tsx script (`scripts/seed-burak-share-images.mjs`):

1. `.env.local`'den `VITE_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` oku (RLS admin-only
   olduğu için service role gerekli — bkz. `supabase/migrations/20260708120000_burak_share_assets.sql`).
2. `docs/social-share-outputs/*.png` dosyalarını sırayla oku; dosya adından
   `(toolOrder, variant, promptNo)` çöz (regex: `^(\d+?)(\d)?(\d)$` gibi değil — açık kural:
   son hane `promptNo` (1|2), ondan önceki hane varsa `variant` (2|3), geri kalanı `toolOrder`;
   varyant hanesi yoksa `variant = 1`).
3. Her dosya için:
   - Hedef bucket yolu: `burak/burak-tool-<toolOrder>/variant-<variant-1>/<timestamp>-<rand>-<orijinalDosyaAdı>`
     (mevcut `buildImagePath` formatıyla tutarlı).
   - Supabase Storage `burak-share` bucket'ına yükle.
   - p1 ise: `social_share_assets` tablosuna `slot_key` ile upsert (`image_bucket`, `image_path`).
   - p2 ise: `social_share_asset_images` tablosuna insert (`slot_key`, `image_bucket`,
     `image_path`, `sort_order: 0`, `created_by: null` — script service-role ile çalıştığı için
     kullanıcı yok).
4. **İdempotentlik:** Script çalışmadan önce mevcut `social_share_assets` / `social_share_asset_images`
   satırlarını slot_key bazında kontrol eder; zaten dolu bir kapak slotu varsa o dosyayı atlar ve
   uyarı loglar (üzerine yazmaz). Böylece script güvenle tekrar çalıştırılabilir.
5. Script sonunda özet rapor: kaç kapak, kaç ek görsel yüklendi, kaç tanesi atlandı (zaten
   doluydu) — terminale yazdırılır.

## Kapsam Dışı

- Migration gerekmiyor — `social_share_assets` ve `social_share_asset_images` tabloları zaten
  canlıda (2026-07-08, 2026-07-18 tarihli önceki işler).
- Kod tarafında (`UnifiedShareList.tsx`, `BurakMediaPanel.tsx`) hiçbir değişiklik gerekmiyor —
  bu sayfalar zaten DB'den okuyor, script sadece veriyi dolduruyor.
- 32 dosya, olası 72 slotun (12 araç × 3 varyant × 2 prompt) bir kısmı — eksik kalan slotlar
  script sonrası admin panelden elle tamamlanabilir, bu işin kapsamında değil.

## Doğrulama

1. Script çalıştıktan sonra SQL ile `social_share_assets` (kapak sayısı) ve
   `social_share_asset_images` (ek görsel sayısı) satır sayıları kontrol edilir; toplam 32
   olmalı (atlanan yoksa).
2. Dev sunucu açılıp `/admin/social-share-vault` → Burak filtresi altında birkaç kart açılıp
   görsellerin doğru araç/varyant altında göründüğü gözle doğrulanır.
