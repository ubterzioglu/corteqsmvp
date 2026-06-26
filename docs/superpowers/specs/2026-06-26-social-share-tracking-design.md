# Sosyal Paylaşım Takip Sistemi — Tasarım

**Tarih:** 2026-06-26
**Sayfa:** `/admin/social-share-vault` (`src/pages/admin/AdminSocialShareVaultPage.tsx`)
**Durum:** Onaylandı, implementasyona hazır

## Amaç

`/admin/social-share-vault` sayfasındaki üç içerik sekmesinin (Araç Tanıtımları,
Diaspora Postları, Test Araçları) her kalemine, hangi platformlarda paylaşıldığını
işaretleyebileceğimiz tıklanabilir platform rozetleri ekliyoruz. İşaretler veritabanında
kalıcı tutulur ve tüm adminler ortak durumu görür. Her kalem için opsiyonel tek not/link
alanı da bulunur.

## Gereksinimler (kullanıcı kararları)

- **Platformlar (6):** LinkedIn, Instagram, Reddit, X (Twitter), Facebook, Threads.
- **İşaret kapsamı:** Kalem × platform — her araç/post için ayrı ayrı platform rozetleri.
- **Görünürlük:** Tüm adminler ortak. Bir admin işaretler, diğer adminler de görür.
- **Kayıt detayı:** Her rozet için `shared` + ne zaman (`marked_at`) + kim (`marked_by`).
- **Not alanı:** Kalem başına tek not (platform başına değil), opsiyonel link/metin.

## Mevcut yapı (bağlam)

Sayfa üç sekmeli; içerik **statik TS tek-kaynak** dosyalarından beslenir:

- `tools` → `src/lib/admin-shell/social-share-vault.ts` (`SOCIAL_SHARE_TOOLS`, id: `tool-1`..`tool-10`)
- `diaspora` → `src/lib/admin-shell/social-diaspora-posts.ts` (`DIASPORA_POSTS`, id: `post-1`..)
- `tests` → `src/lib/admin-shell/social-test-tools.ts` (`SOCIAL_TEST_TOOLS`, id: `test-tool-1`..)

Her kalemin **stabil string `id`**'si var; içerik DB'de değil, kodda yaşıyor. Takip
katmanını bu id'lere göre üstüne ekliyoruz; içerik kaynağına dokunmuyoruz (FK yok,
serbest `text` id).

DB konvansiyonları: `public` şeması + RLS, RLS gate'i `public.is_admin(auth.uid())`,
tarih-prefixli immutable migration'lar (`supabase/migrations/`). Tek Supabase client:
`@/integrations/supabase/client`.

## Veri modeli

### Tablo 1 — `public.social_share_log` (rozetler)

| kolon | tip | not |
|---|---|---|
| `id` | uuid PK default gen_random_uuid() | |
| `item_tab` | text NOT NULL | CHECK in (`tools`,`diaspora`,`tests`) |
| `item_id` | text NOT NULL | mevcut stabil id (`tool-1`, `post-1`, `test-tool-1`) |
| `platform` | text NOT NULL | CHECK in (`linkedin`,`instagram`,`reddit`,`x`,`facebook`,`threads`) |
| `shared` | boolean NOT NULL default true | aç/kapa durumu |
| `marked_by` | uuid NULL | `auth.users(id)` ON DELETE SET NULL — son işaretleyen admin |
| `marked_at` | timestamptz NOT NULL default now() | son değişiklik |
| `created_at` | timestamptz NOT NULL default now() | |

- **UNIQUE (`item_tab`, `item_id`, `platform`)** — her kalem×platform tek satır; tıklama = upsert.

### Tablo 2 — `public.social_share_item_note` (kalem başına tek not)

| kolon | tip | not |
|---|---|---|
| `id` | uuid PK default gen_random_uuid() | |
| `item_tab` | text NOT NULL | CHECK in (`tools`,`diaspora`,`tests`) |
| `item_id` | text NOT NULL | |
| `note` | text NOT NULL default '' | opsiyonel link/metin |
| `marked_by` | uuid NULL | `auth.users(id)` ON DELETE SET NULL |
| `marked_at` | timestamptz NOT NULL default now() | |
| `created_at` | timestamptz NOT NULL default now() | |

- **UNIQUE (`item_tab`, `item_id`)** — kalem başına tek not satırı.

### RLS

Her iki tabloda RLS aktif; tek policy ailesi `public.is_admin(auth.uid())`:

- SELECT: `using (public.is_admin(auth.uid()))`
- INSERT: `with check (public.is_admin(auth.uid()))`
- UPDATE: `using (...) with check (...)`
- DELETE: gerekmez (toggle = `shared=false` update; satır silinmez).

Tüm adminler aynı satırları görür/yazar (ortak durum).

### Migration

`supabase/migrations/20260627100000_social_share_tracking.sql` — iki tablo + index'ler
(UNIQUE constraint'ler) + RLS + policy'ler. Türkçe yorumlu, UTF-8.

> Not: Bu migration commit edilmesi canlıya uygulandığı anlamına gelmez; canlı DB'ye
> ayrıca uygulanmalı (`project_assessment_*` notlarındaki Management API yolu).

## API katmanı

`src/lib/admin-shell/social-share-log.ts`:

```ts
export const SHARE_PLATFORMS = ["linkedin","instagram","reddit","x","facebook","threads"] as const;
export type SharePlatform = (typeof SHARE_PLATFORMS)[number];
export type ShareTab = "tools" | "diaspora" | "tests";

// Türkçe etiket + lucide ikon eşlemesi (UI'da kullanılır)
export const SHARE_PLATFORM_LABELS: Record<SharePlatform, string>;

export type ShareBadge = { shared: boolean; markedAt: string; markedBy: string | null };
export type ShareNote  = { note: string; markedAt: string; markedBy: string | null };

export type ShareState = {
  // anahtar: `${tab}:${itemId}`
  badges: Record<string, Partial<Record<SharePlatform, ShareBadge>>>;
  notes: Record<string, ShareNote>;
};

export async function fetchShareState(): Promise<ShareState>;
export async function toggleShare(args: { tab: ShareTab; itemId: string; platform: SharePlatform; shared: boolean }): Promise<void>;
export async function saveItemNote(args: { tab: ShareTab; itemId: string; note: string }): Promise<void>;
```

- `fetchShareState` her iki tabloyu çeker, `${tab}:${itemId}` anahtarlı haritalara dönüştürür.
- `toggleShare` → `social_share_log` upsert (`onConflict: item_tab,item_id,platform`),
  `shared`, `marked_by = auth user id`, `marked_at = now()`.
- `saveItemNote` → `social_share_item_note` upsert (`onConflict: item_tab,item_id`).
- Hata yönetimi: try/catch + anlamlı Error fırlat; UI tarafında Türkçe toast.
- `key(tab, itemId)` küçük yardımcı, anahtar üretimi tek yerde.

## UI

### Yeni bileşen: `src/components/admin/social-share/ShareStatusBar.tsx`

Bir kalem için:
- 6 platform rozeti (kalem×platform). Kapalı = soluk outline; açık = dolu yeşil + ✓.
  Açık rozette `marked_at` kısa tarih (ör. "12 Haz") altyazı/tooltip.
- Kalem başına tek not alanı: küçük "Not" butonu → popover içinde `Textarea` + Kaydet.
  Not doluysa buton dolu/rozetli görünür.

Props:
```ts
type ShareStatusBarProps = {
  tab: ShareTab;
  itemId: string;
  badges: Partial<Record<SharePlatform, ShareBadge>>;
  note: ShareNote | undefined;
  onToggle: (platform: SharePlatform, shared: boolean) => void;
  onSaveNote: (note: string) => void;
  pending?: boolean;
};
```

Bileşen kendi içinde DB çağrısı yapmaz; yalnızca callback tetikler (sunum/etkileşim ayrımı).

### Sayfa entegrasyonu: `AdminSocialShareVaultPage.tsx`

- `useQuery(["social-share-state"], fetchShareState)` — açılışta bir kez.
- `useMutation` (toggle / saveNote) → optimistic update; başarıda `invalidateQueries`,
  hatada toast + geri al (React Query optimistic pattern).
- Mevcut `copiedId`/`onCopy` deseniyle aynı şekilde, `shareState` + `onToggle`/`onSaveNote`
  callback'leri üç tab bileşenine prop olarak geçer.

### Tab bileşenleri

`ToolPromotionsTab`, `DiasporaPostsTab`, `TestToolsTab` — her birinde akordeon içeriğinin
**altına** `ShareStatusBar` eklenir. İlgili kalemin `tab` + `itemId`'si ile beslenir.
İçerik kopyalama davranışı değişmez.

## Hata yönetimi

- API: try/catch, `error instanceof Error ? error.message : 'Beklenmeyen hata'`, Error fırlat.
- UI: mutation `onError` → `toast({ variant: "destructive" })` + optimistic geri al.
- Supabase yapılandırılmamışsa (`isSupabaseConfigured=false`) query hata verir; sayfa
  rozetleri pasif/uyarı gösterir (mevcut sayfa zaten admin-gated).

## Test

- `src/lib/admin-shell/social-share-log.test.ts`:
  - `fetchShareState` satırları doğru `${tab}:${itemId}` haritalarına çeviriyor (mock supabase).
  - `toggleShare` / `saveItemNote` doğru upsert payload + `onConflict` üretiyor.
- Bileşen testi (`ShareStatusBar.test.tsx`): rozet tıklayınca `onToggle(platform, !shared)`
  çağrılıyor; not kaydedince `onSaveNote(text)` çağrılıyor.
- Hedef: yeni kod için anlamlı kapsam; mevcut `*-api.test.ts` / `*.test.tsx` desenleri.

## Kapsam dışı (YAGNI)

- Platform başına ayrı not (kullanıcı kalem başına tek not istedi).
- Paylaşım zamanlaması / otomatik paylaşım API entegrasyonu.
- Admin başına ayrı görünürlük (ortak durum seçildi).
- Geçmiş/audit log (yalnız son `marked_by`/`marked_at` tutulur).
