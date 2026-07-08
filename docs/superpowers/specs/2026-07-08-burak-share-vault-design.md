# "BURAK BURAYA BAK" Paylaşım Bölümü — Tasarım

**Tarih:** 2026-07-08
**Sayfa:** `/admin/social-share-vault` (`src/pages/admin/AdminSocialShareVaultPage.tsx`)
**Durum:** Onaylandı, implementasyon planı bekleniyor

## 1. Amaç

`/admin/social-share-vault` sayfası şu an 3 sekmeli bir "paylaşım deposu": Araç Tanıtımları,
Diaspora Postları, Test Araçları. Her sekme hazır Canva promptları + kopyala-yapıştır LinkedIn
postları gösterir.

Bu iş, Burak'ın (içerik/sosyal medya) çalışacağı **4. bir sekme** ekler: **"BURAK BURAYA BAK"**.
Bu sekme ekteki 12 test aracını (`buraksosyal.html`) paylaşım deposu mantığıyla gösterir; farkı,
her Canva promptunun altına **medya paneli** (görsel yükleme / görsel linki / video linki / not)
eklenmesidir. Yüklenen medya Supabase'e kalıcı yazılır ve **tüm adminler ortak görür**.

## 2. Kapsam

### Dahil
- Yeni 4. sekme "BURAK BURAYA BAK" (mevcut 3 sekme **hiç değişmez**).
- Ekteki 12 aracın tamamı statik veri olarak (10'u mevcut `social-test-tools.ts`'te var; 2 yeni:
  Almanya Banka + Almanya Sigorta ekte).
- Her araç × 3 varyant × her varyantın Canva promptu = **36 medya yuvası**. Her yuvada:
  - Görsel yükleme (Supabase Storage) — opsiyonel
  - Görsel linki (Gmail/Drive) — opsiyonel, foto yerine
  - Video: "Videoyu Drive'a Yükle" butonu (sabit Drive klasörünü yeni sekmede açar) + video linki input'u
  - Serbest not — opsiyonel
- Kalıcılık: yeni `social_share_assets` tablosu + Supabase Storage bucket, RLS admin-only.
- Mevcut Test Araçları desenine (`TestToolsTab`) uygun akordeon + kopyala butonları.

### Dahil değil (YAGNI)
- İçerik metinleri (12 aracın Canva/LinkedIn metni) **admin panelden düzenlenemez** — kodda statik.
  Metin değişikliği kod değişikliğidir (mevcut `social-test-tools.ts` deseniyle tutarlı).
- Ham HTML gömme yok; ekli HTML'in JS'i (toplu kopyalama) mevcut React desenine uyarlanır.
- İçin video dosyasını doğrudan Supabase'e yükleme yok — video Drive'da tutulur, sadece linki saklanır.

## 3. Sabitler

- **Drive video klasörü (buton hedefi):**
  `https://drive.google.com/drive/folders/1CPPtv-dOFdx9nO4eBzF7yv3QEyNe2_Od?usp=drive_link`
- **Burak'ın çalışacağı URL:** `https://corteqs.net/admin/social-share-vault` → "BURAK BURAYA BAK" sekmesi.

## 4. Veri Modeli (Yaklaşım A — tek jenerik tablo)

### Statik içerik (kod)
Yeni dosya `src/lib/admin-shell/burak-share-tools.ts`, mevcut `SocialTestTool` tipiyle **birebir aynı
şekil**:

```ts
export type BurakShareVariant = { canvaPrompt: string; linkedinPost: string };
export type BurakShareTool = {
  id: string;        // "burak-tool-1" ... "burak-tool-12"
  order: number;     // 1..12
  name: string;
  description: string;
  variants: BurakShareVariant[];  // 3 varyant
};
export const BURAK_SHARE_TOOLS: BurakShareTool[] = [ /* 12 araç */ ];
```

İlk 10 araç `social-test-tools.ts`'ten kopyalanır (metinler birebir). Araç 11 (Almanya Banka) ve 12
(Almanya Sigorta) ekli HTML'den temiz UTF-8 Türkçe olarak eklenir. **HTML-entity / mojibake
KULLANILMAZ** (CLAUDE.md Türkçe metin kuralları).

### Dinamik medya (DB)
Tablo **`social_share_assets`**:

| kolon | tip | not |
|---|---|---|
| `id` | uuid PK default gen_random_uuid() | |
| `slot_key` | text **UNIQUE NOT NULL** | ör. `"burak/burak-tool-11/variant-2"` |
| `image_bucket` | text null | yüklenen görselin bucket'ı |
| `image_path` | text null | yüklenen görselin path'i |
| `image_url` | text null | foto yerine verilen Gmail/Drive görsel linki |
| `video_url` | text null | Drive'a yüklenen videonun paylaşım linki |
| `note` | text null | serbest not |
| `updated_by` | uuid null references auth.users | son düzenleyen |
| `updated_at` | timestamptz not null default now() | |

- **`slot_key` formatı:** `burak/<tool.id>/variant-<index0based>` → 12 × 3 = 36 olası anahtar.
- **RLS:** SELECT/INSERT/UPDATE/DELETE yalnızca `is_admin()` OR `is_moderator()` (mevcut desen).
  Anon/authenticated genel erişim yok.
- **Storage bucket:** yeni private bucket `burak-share`. Görsel path'i:
  `<tool.id>/variant-<i>/<timestamp>-<rand>-<safeName>` (mevcut `profile-documents.ts`
  `buildProfileDocumentStoragePath` deseni). Erişim `createSignedUrl` (300 sn) ile.

## 5. API Katmanı

Yeni dosya `src/lib/admin-shell/burak-share-assets.ts`:

```ts
export type BurakShareAsset = {
  slotKey: string;
  imageBucket: string | null;
  imagePath: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  note: string | null;
};

listBurakShareAssets(): Promise<Record<string, BurakShareAsset>>   // slot_key -> asset map
upsertBurakShareAsset(slotKey, patch): Promise<BurakShareAsset>    // upsert by slot_key
uploadBurakShareImage(slotKey, toolId, variantIndex, file): Promise<{bucket, path}>
removeBurakShareImage(asset): Promise<void>
getBurakShareImageUrl(bucket, path): Promise<string>              // signed URL
```

- Supabase tek client: `@/integrations/supabase/client`.
- `updated_by` = mevcut oturum kullanıcısı (`supabase.auth.getUser()`); RLS zaten koruyor, kolon audit için.
- Hata yönetimi: try/catch + `toast.error(message)` (CLAUDE.md Error Handling Pattern).
- `supabase/types.ts` senkron değilse `as any` cast köprüsü kullanılır (mevcut proje pratiği; B1 backlog).

## 6. UI Bileşenleri

### `AdminSocialShareVaultPage.tsx` (düzenleme)
- `TabKey` tipine `"burak"` eklenir.
- `TabsList`'e 4. `TabsTrigger` (label "BURAK BURAYA BAK", ikon `Video`/`Camera`).
- 4. `TabsContent` → `<BurakShareTab .../>`.
- `BULK_BUTTONS`'a `burak` girdisi (tüm Canva / tüm LinkedIn) — mevcut desen.

### `src/components/admin/social-share/BurakShareTab.tsx` (yeni)
- `TestToolsTab` yapısını temel alır: 12 araç akordeon, her varyant için Canva + LinkedIn kartları,
  kopyala butonları.
- Fark: her Canva promptunun altında `<BurakMediaPanel slotKey=... />`.
- Sayfa açılışında `listBurakShareAssets()` bir kez çağrılır (React Query veya `useEffect`),
  `slot_key -> asset` map olarak tüm panellere prop geçilir.

### `src/components/admin/social-share/BurakMediaPanel.tsx` (yeni)
Bir `slotKey` alır. İçerir:
1. **Görsel:** asset.imagePath varsa signed-URL önizleme (küçük) + "Kaldır"; yoksa "Görsel Yükle"
   (`<input type=file accept=image/*>`). Yükleme sonrası `upsertBurakShareAsset`.
2. **Görsel linki:** `image_url` input (opsiyonel). Doluysa tıklanabilir "Görseli Aç" linki.
3. **Video:** "Videoyu Drive'a Yükle" butonu → `window.open(DRIVE_FOLDER_URL, "_blank", "noopener")`;
   yanında `video_url` input; doluysa tıklanabilir "Videoyu Aç".
4. **Not:** kısa `Textarea` / `Input`.
- Değişiklikler debounce'lu (input'lar ~600ms) `upsertBurakShareAsset(slotKey, patch)` ile kaydedilir;
  görsel yükle/kaldır anında. Kaydolunca küçük "Kaydedildi" göstergesi (toast veya inline check).
- Tüm alanlar opsiyonel ve bağımsız (görsel VEYA link; ikisi de boş olabilir).

## 7. Migration

Yeni migration `supabase/migrations/2026070812xxxx_burak_share_assets.sql`:
1. `create table social_share_assets (...)` (Bölüm 4 şeması).
2. `alter table ... enable row level security`.
3. RLS policy: admin/moderator full access (`is_admin() or is_moderator()`).
4. `insert into storage.buckets (id, name, public) values ('burak-share','burak-share', false)`
   (varsa atla) + storage RLS policy admin/moderator upload/read/delete.

(`slot_key` UNIQUE kısıtı zaten index sağlar; ayrı index gerekmez.)

**Not:** Migration commit ≠ canlı DB. Canlıya uygulama Management API curl ile ayrı adım
(memory: `project_referral_admin_rls_fix` dersi). Frontend deploy Coolify.

## 8. Doğrulama & Test

- `npm run verify:text` (UTF-8/mojibake) — yeni `burak-share-tools.ts` için kritik.
- `npm run lint`, `tsc` temiz.
- Unit test: `burak-share-assets.test.ts` (slot_key üretimi, patch upsert mantığı — mevcut
  `social-share-log.test.ts` deseni).
- Manuel QA: sekme görünür, 12 araç listeli, görsel yükle → önizleme, link yapıştır → tıklanabilir,
  Drive butonu yeni sekme açar, sayfa yenilenince veri kalıcı, ikinci admin görüyor.

## 9. Bitiş

1. `admin-updates.ts`'e günlük dille duyuru girdisi (memory: admin-updates deploy-gap alışkanlığı).
2. Commit (conventional + trailer'lar).
3. **Push** (main classifier'a takılırsa kullanıcıdan onay + `dangerouslyDisableSandbox`).
4. Kalan (kullanıcı tarafı): migration'ı canlıya uygula + Coolify deploy + görsel QA.
5. Burak'a verilecek link: `https://corteqs.net/admin/social-share-vault` → "BURAK BURAYA BAK".
