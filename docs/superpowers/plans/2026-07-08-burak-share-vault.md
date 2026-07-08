# "BURAK BURAYA BAK" Paylaşım Bölümü Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/admin/social-share-vault` sayfasına, Burak'ın çalışacağı 4. bir sekme ("BURAK BURAYA BAK") ekle; ekteki 12 test aracını göster ve her Canva promptunun altına Supabase'e kalıcı, tüm adminlerin ortak gördüğü görsel/link/video/not medya paneli koy.

**Architecture:** İçerik metinleri kodda statik (`burak-share-tools.ts`), medya kayıtları tek jenerik tabloda (`social_share_assets`, `slot_key` unique). UI mevcut `TestToolsTab` desenini temel alır; her Canva yuvasının altına `BurakMediaPanel` eklenir. Görseller private `burak-share` bucket'ında, signed URL ile okunur. Video Drive'da tutulur, yalnız linki saklanır.

**Tech Stack:** React + Vite, TypeScript (relaxed strict), shadcn/ui, Supabase (Postgres + Storage), Vitest + Testing Library, Tailwind.

## Global Constraints

- **Türkçe metin:** Kullanıcıya görünen metinlerde bare `toUpperCase()/toLowerCase()` yasak; case gerekirse `@/lib/text-normalization` (`trUpper`/`trLower`/`trIncludes`). Statik içerik temiz UTF-8 Türkçe + gerçek tırnak + emoji — HTML-entity / mojibake YOK.
- **Supabase client:** tek kaynak `@/integrations/supabase/client` (`import { supabase }`).
- **Auth gate:** RLS = `public.is_admin(auth.uid())` (mevcut `social_share_log` deseni). Tüm adminler ortak görür.
- **Migration:** Yalnız yeni migration ekle; mevcut migration'ları silme/yeniden sıralama YOK. Commit ≠ canlı DB.
- **Hata yönetimi:** try/catch + `toast.error(message)`; `error instanceof Error ? error.message : "..."`.
- **Domain terimleri Türkçe kalır** (muhasebe, cadde vb.) — burada dokunulmuyor.
- **Sabitler:**
  - Drive video klasörü: `https://drive.google.com/drive/folders/1CPPtv-dOFdx9nO4eBzF7yv3QEyNe2_Od?usp=drive_link`
  - Burak'ın URL'i: `https://corteqs.net/admin/social-share-vault` → "BURAK BURAYA BAK" sekmesi.
- **types.ts senkron değil:** yeni tablo `supabase/types.ts`'te yok; Supabase çağrılarında `as any` köprüsü kabul (mevcut proje pratiği).
- **slot_key formatı:** `burak/<tool.id>/variant-<index0based>` (ör. `burak/burak-tool-11/variant-1`).

---

## File Structure

- **Create** `src/lib/admin-shell/burak-share-tools.ts` — 12 aracın statik içeriği (`BurakShareTool[]`).
- **Create** `src/lib/admin-shell/burak-share-assets.ts` — medya DB/storage API'si.
- **Create** `src/lib/admin-shell/burak-share-assets.test.ts` — API birim testleri.
- **Create** `src/components/admin/social-share/BurakMediaPanel.tsx` — tek yuva medya paneli.
- **Create** `src/components/admin/social-share/BurakShareTab.tsx` — 12 araç akordeon + panel.
- **Create** `supabase/migrations/20260708120000_burak_share_assets.sql` — tablo + RLS + bucket.
- **Modify** `src/pages/admin/AdminSocialShareVaultPage.tsx` — 4. sekme + bulk buton girdisi.
- **Modify** `src/lib/admin-shell/admin-updates.ts` — duyuru girdisi.

---

## Task 1: Statik içerik verisi (`burak-share-tools.ts`)

**Files:**
- Create: `src/lib/admin-shell/burak-share-tools.ts`

**Interfaces:**
- Produces:
  - `type BurakShareVariant = { canvaPrompt: string; linkedinPost: string }`
  - `type BurakShareTool = { id: string; order: number; name: string; description: string; variants: BurakShareVariant[] }`
  - `const BURAK_SHARE_TOOLS: BurakShareTool[]` — 12 eleman, id `"burak-tool-1"`..`"burak-tool-12"`, order 1..12, her biri 3 varyant.

- [ ] **Step 1: Dosyayı oluştur — tip + ilk 10 aracı mevcut veriden taşı**

`src/lib/admin-shell/social-test-tools.ts` içindeki `SOCIAL_TEST_TOOLS` (10 araç, her biri 3 varyant) metinlerini **birebir** kopyala; sadece `id` alanını `test-tool-N` → `burak-tool-N` yap. Başlık yorumunu güncelle. Dosya başı:

```ts
// /admin/social-share-vault "BURAK BURAYA BAK" sekmesi statik içerik kaynağı.
// 12 click-through test aracı; her araç 3 varyant (1 metinsiz Canva promptu +
// 1 hazır Türkçe LinkedIn postu). İçerik BU dosyadan düzenlenir. Metinler temiz
// UTF-8 Türkçe + gerçek tırnak + emoji — HTML-entity / mojibake KULLANILMAZ.
// İlk 10 araç social-test-tools.ts ile aynı içerik; 11-12 Almanya finans araçları.

export type BurakShareVariant = {
  canvaPrompt: string;
  linkedinPost: string;
};

export type BurakShareTool = {
  id: string;      // "burak-tool-1" ... "burak-tool-12"
  order: number;   // 1..12
  name: string;
  description: string;
  variants: BurakShareVariant[];
};

export const BURAK_SHARE_TOOLS: BurakShareTool[] = [
  // ... burak-tool-1 .. burak-tool-10 (social-test-tools.ts'ten, id yeniden adlandırılmış)
];
```

> Not: 10 aracın tam metnini `src/lib/admin-shell/social-test-tools.ts`'ten oku ve aynen taşı. `order` ve varyant sırası korunur.

- [ ] **Step 2: Araç 11 (Almanya Banka) ekle**

`BURAK_SHARE_TOOLS` dizisine ekle (metinler ekli `buraksosyal.html` tool-11'den, temiz UTF-8):

```ts
  {
    id: "burak-tool-11",
    order: 11,
    name: "Almanya'da Sana Hangi Banka Uygun?",
    description:
      "Almanya'daki yaşam sürene, dil seviyene, ücret hassasiyetine ve yatırım/kripto alışkanlıklarına göre 19 banka arasından sana en uygun 3'ünü sıralayan karar aracı. Yeni gelen ve yerleşik Türkler için.",
    variants: [
      {
        canvaPrompt:
          "A glowing bank/debit card and a smartphone floating above a stylized German city map, three glowing bank-badge orbs ranked on a soft light podium, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, best-bank matching mood, no text, no letters, no words, no typography.",
        linkedinPost: `🏦 Almanya'da hâlâ yanlış bankada mı boğuşuyorsun?

N26, ING, Sparkasse, Trade Republic... 20 soruyla dil, şube, ücret ve yatırım tercihini eşleştirip sana en uygun 3 bankayı sıralıyoruz. Doğru banka, dertsiz hayat.

👉 Ücretsiz kayıt olun!
CorteQS, Almanya'daki finans kararlarını netleştiriyor ve aynı yoldan geçmiş Türklerle seni buluşturuyor. Tecrübe paylaşıldıkça kolaylaşır.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#AlmanyaHayatı #BankaSeçimi #TürkDiasporası #Almanya #CorteQS`,
      },
      {
        canvaPrompt:
          "A balanced scale of light weighing high monthly fees against a clean glowing mobile app icon, with small SEPA-transfer arrows flowing, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, cost-vs-convenience concept, no text, no letters, no words, no typography.",
        linkedinPost: `💳 Gereksiz hesap ücretlerine kaç yıldır para mı yatırıyorsun?

Nakit mi mobil mi? Şube mi dijital mi? Kripto ve ETF yapıyor musun? Birkaç soruyla senin profiline en uygun masrafsız/dengeli/şubeli bankayı buluyoruz.

👉 Ücretsiz kayıt olun!
CorteQS, gurbette parana sahip çıkman için hem veriyi hem topluluğu bir araya getiriyor. Doğru seçim, ceplerine yansır.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Almanya #Banka #Finans #TürkDiasporası #CorteQS`,
      },
      {
        canvaPrompt:
          "A decision compass of light choosing between a traditional branch building glow and a sleek digital-bank glow, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, newcomer bank-decision mood, no text, no letters, no words, no typography.",
        linkedinPost: `🧭 Almanya'ya yeni geldin ve banka seçimi kafanı mı karıştırdı?

İngilizce destek mi, şube yakınlığı mı, düşük komisyon mu senin için önemli? 20 soruluk testle güven, hız ve maliyet arasında sana en uygun bankayı öğren.

👉 Ücretsiz kayıt olun!
CorteQS, Almanya'daki ilk adımlarını kolaylaştırıyor; aynı bankalarda hesap açmış bir diaspora ağı bir tık uzağında. Yalnız uğraşma.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#YeniGelenler #AlmanyaRehberi #Banka #TürkDiasporası #CorteQS`,
      },
    ],
  },
```

- [ ] **Step 3: Araç 12 (Almanya Sigorta) ekle**

```ts
  {
    id: "burak-tool-12",
    order: 12,
    name: "Almanya'da Hangi Sigortalar Sana Şart?",
    description:
      "Çalışma durumun, ailen, araç, konut ve risk profiline göre 12 sigorta türü arasından hangilerinin \"önce al\", \"güçlü öneri\" veya \"opsiyonel\" olduğunu gösteren karar aracı.",
    variants: [
      {
        canvaPrompt:
          "A glowing protective shield surrounded by small floating icons (health cross, car, house, tooth, paw, umbrella) softly lit, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, insurance-coverage clarity mood, no text, no letters, no words, no typography.",
        linkedinPost: `🛡️ Almanya'da hangi sigorta gerçekten şart, hangisi lüks?

Krankenversicherung mu, Haftpflicht mi, Rechtsschutz mu? 20 soruyla durumunu değerlendirip sana "önce al / güçlü öneri / opsiyonel" olarak net bir liste çıkarıyoruz.

👉 Ücretsiz kayıt olun!
CorteQS, Almanya bürokrasisinde seni yalnız bırakmıyor; aynı kararları vermiş Türklerin tecrübesi hep yanında. Bilgi, en iyi güvencedir.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Almanya #Sigorta #TürkDiasporası #AlmanyaHayatı #CorteQS`,
      },
      {
        canvaPrompt:
          "A glowing checklist of insurance types with some marked as urgent priority and others as optional, sorted into soft light tiers, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, priority-sorting feel, no text, no letters, no words, no typography.",
        linkedinPost: `📋 Onlarca sigorta türü var, hangisiyle başlayacağını bilmiyor musun?

Sigorta Seçimi Aracımız; çalışma durumun, ailen, araç ve konut profiline göre 12 sigorta türünü senin için önceliklendiriyor. Fazla ödeme de yok, açıkta kalma da.

👉 Ücretsiz kayıt olun!
CorteQS, gurbette doğru güvenceyi kurman için hem rehber hem topluluk sunuyor. Doğru sigorta, huzurlu bir hayat demek.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#SigortaRehberi #Almanya #Finans #TürkDiasporası #CorteQS`,
      },
      {
        canvaPrompt:
          "A family silhouette under a large glowing umbrella of light, with a car, a house and a suitcase safely beneath it, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, family-protection mood, no text, no letters, no words, no typography.",
        linkedinPost: `☂️ Bir kaza, bir dava, bir hastalık — Almanya'da hazırlıklı mısın?

Ailen, işin, araban ve yaşam tarzına göre gerçekten ihtiyacın olan sigortaları birkaç soruda belirliyoruz. Eksik güvenceyle risk alma, gereksizle de para kaybetme.

👉 Ücretsiz kayıt olun!
CorteQS, seni ve sevdiklerini korumana yardımcı oluyor; aynı yolu yürümüş bir diaspora ağı çözümü hep yakında. Birlikte daha güvendeyiz.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Sigorta #AileGüvencesi #Almanya #TürkDiasporası #CorteQS`,
      },
    ],
  },
];
```

- [ ] **Step 4: UTF-8 / mojibake denetimi çalıştır**

Run: `npm run verify:text`
Expected: PASS (yeni dosya dahil hata yok). Ayrıca `npx tsc --noEmit` — yeni dosya için hata yok.

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin-shell/burak-share-tools.ts
git commit -m "feat(burak-share): 12 aracın statik içerik verisi (BURAK BURAYA BAK)"
```

---

## Task 2: Medya API katmanı (`burak-share-assets.ts`)

**Files:**
- Create: `src/lib/admin-shell/burak-share-assets.ts`
- Test: `src/lib/admin-shell/burak-share-assets.test.ts`

**Interfaces:**
- Consumes: `supabase` from `@/integrations/supabase/client`.
- Produces:
  - `const BURAK_DRIVE_FOLDER_URL: string`
  - `type BurakShareAsset = { slotKey: string; imageBucket: string | null; imagePath: string | null; imageUrl: string | null; videoUrl: string | null; note: string | null }`
  - `function burakSlotKey(toolId: string, variantIndex: number): string` → `"burak/<toolId>/variant-<variantIndex>"`
  - `function listBurakShareAssets(): Promise<Record<string, BurakShareAsset>>` (slotKey → asset)
  - `type BurakAssetPatch = Partial<Pick<BurakShareAsset, "imageBucket" | "imagePath" | "imageUrl" | "videoUrl" | "note">>`
  - `function upsertBurakShareAsset(slotKey: string, patch: BurakAssetPatch): Promise<void>`
  - `function uploadBurakShareImage(toolId: string, variantIndex: number, file: File): Promise<{ bucket: string; path: string }>`
  - `function removeBurakShareImage(bucket: string, path: string): Promise<void>`
  - `function getBurakShareImageUrl(bucket: string, path: string): Promise<string>`

- [ ] **Step 1: Failing test yaz**

`src/lib/admin-shell/burak-share-assets.test.ts` (mevcut `social-share-log.test.ts` mock desenini kullanır):

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock, getUserMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  getUserMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: fromMock,
    auth: { getUser: getUserMock },
  },
}));

import {
  burakSlotKey,
  listBurakShareAssets,
  upsertBurakShareAsset,
} from "@/lib/admin-shell/burak-share-assets";

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: "admin-1" } } });
});

describe("burakSlotKey", () => {
  it("builds a deterministic slot key from tool id and variant index", () => {
    expect(burakSlotKey("burak-tool-11", 1)).toBe("burak/burak-tool-11/variant-1");
  });
});

describe("listBurakShareAssets", () => {
  it("maps rows into a slot_key keyed record with camelCase fields", async () => {
    const rows = [
      {
        slot_key: "burak/burak-tool-1/variant-0",
        image_bucket: "burak-share",
        image_path: "burak-tool-1/variant-0/x.png",
        image_url: null,
        video_url: "https://drive.google.com/file/d/abc/view",
        note: "hazır",
      },
    ];
    fromMock.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: rows, error: null }),
    });

    const state = await listBurakShareAssets();

    expect(fromMock).toHaveBeenCalledWith("social_share_assets");
    expect(state["burak/burak-tool-1/variant-0"]).toEqual({
      slotKey: "burak/burak-tool-1/variant-0",
      imageBucket: "burak-share",
      imagePath: "burak-tool-1/variant-0/x.png",
      imageUrl: null,
      videoUrl: "https://drive.google.com/file/d/abc/view",
      note: "hazır",
    });
  });

  it("throws a Turkish fallback message when the query fails", async () => {
    fromMock.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: { code: "42501" } }),
    });
    await expect(listBurakShareAssets()).rejects.toThrow("Medya kayıtları yüklenemedi");
  });
});

describe("upsertBurakShareAsset", () => {
  it("upserts by slot_key with current user and snake_case patch", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    fromMock.mockReturnValue({ upsert });

    await upsertBurakShareAsset("burak/burak-tool-2/variant-1", {
      videoUrl: "https://drive.google.com/file/d/zzz/view",
      note: "video eklendi",
    });

    expect(fromMock).toHaveBeenCalledWith("social_share_assets");
    const [values, options] = upsert.mock.calls[0];
    expect(values).toMatchObject({
      slot_key: "burak/burak-tool-2/variant-1",
      video_url: "https://drive.google.com/file/d/zzz/view",
      note: "video eklendi",
      updated_by: "admin-1",
    });
    expect(options).toEqual({ onConflict: "slot_key" });
  });

  it("throws when the upsert errors", async () => {
    fromMock.mockReturnValue({ upsert: vi.fn().mockResolvedValue({ error: new Error("nope") }) });
    await expect(
      upsertBurakShareAsset("burak/burak-tool-1/variant-0", { note: "x" }),
    ).rejects.toThrow("nope");
  });
});
```

- [ ] **Step 2: Testi çalıştır, FAIL gör**

Run: `npm run test -- src/lib/admin-shell/burak-share-assets.test.ts`
Expected: FAIL — modül/exportlar tanımsız (`burakSlotKey is not a function` vb.).

- [ ] **Step 3: API dosyasını yaz**

`src/lib/admin-shell/burak-share-assets.ts`:

```ts
// /admin/social-share-vault "BURAK BURAYA BAK" sekmesi medya API'si.
// Görsel Supabase Storage'a (private burak-share bucket), link/not/video URL
// social_share_assets tablosuna yazılır (slot_key unique). Tüm adminler ortak
// görür; RLS = is_admin(auth.uid()). Metin içerik DB'de değil, burak-share-tools.ts'te.

import { supabase } from "@/integrations/supabase/client";

// Video Drive klasörü — "Videoyu Drive'a Yükle" butonu bunu yeni sekmede açar.
export const BURAK_DRIVE_FOLDER_URL =
  "https://drive.google.com/drive/folders/1CPPtv-dOFdx9nO4eBzF7yv3QEyNe2_Od?usp=drive_link";

const BUCKET = "burak-share";

export type BurakShareAsset = {
  slotKey: string;
  imageBucket: string | null;
  imagePath: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  note: string | null;
};

export type BurakAssetPatch = Partial<
  Pick<BurakShareAsset, "imageBucket" | "imagePath" | "imageUrl" | "videoUrl" | "note">
>;

// db, henüz supabase/types.ts'te olmayan yeni tabloya erişmek için as any köprüsü.
const db = supabase as unknown as {
  from: (table: string) => any;
  auth: typeof supabase.auth;
  storage: typeof supabase.storage;
};

export function burakSlotKey(toolId: string, variantIndex: number): string {
  return `burak/${toolId}/variant-${variantIndex}`;
}

function messageOf(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  return fallback;
}

export async function listBurakShareAssets(): Promise<Record<string, BurakShareAsset>> {
  const { data, error } = await db
    .from("social_share_assets")
    .select("slot_key, image_bucket, image_path, image_url, video_url, note");

  if (error) throw new Error(messageOf(error, "Medya kayıtları yüklenemedi"));

  const map: Record<string, BurakShareAsset> = {};
  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    const slotKey = String(row.slot_key ?? "");
    if (!slotKey) continue;
    map[slotKey] = {
      slotKey,
      imageBucket: (row.image_bucket as string | null) ?? null,
      imagePath: (row.image_path as string | null) ?? null,
      imageUrl: (row.image_url as string | null) ?? null,
      videoUrl: (row.video_url as string | null) ?? null,
      note: (row.note as string | null) ?? null,
    };
  }
  return map;
}

export async function upsertBurakShareAsset(
  slotKey: string,
  patch: BurakAssetPatch,
): Promise<void> {
  const { data: userData } = await db.auth.getUser();
  const userId = userData?.user?.id ?? null;

  const values: Record<string, unknown> = {
    slot_key: slotKey,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };
  if ("imageBucket" in patch) values.image_bucket = patch.imageBucket ?? null;
  if ("imagePath" in patch) values.image_path = patch.imagePath ?? null;
  if ("imageUrl" in patch) values.image_url = patch.imageUrl ?? null;
  if ("videoUrl" in patch) values.video_url = patch.videoUrl ?? null;
  if ("note" in patch) values.note = patch.note ?? null;

  const { error } = await db
    .from("social_share_assets")
    .upsert(values, { onConflict: "slot_key" });

  if (error) throw new Error(messageOf(error, "Medya kaydı kaydedilemedi"));
}

function buildImagePath(toolId: string, variantIndex: number, file: File): string {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const rand = Math.random().toString(36).slice(2, 8);
  return `${toolId}/variant-${variantIndex}/${Date.now()}-${rand}-${safeName}`;
}

export async function uploadBurakShareImage(
  toolId: string,
  variantIndex: number,
  file: File,
): Promise<{ bucket: string; path: string }> {
  const path = buildImagePath(toolId, variantIndex, file);
  const { error } = await db.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (error) throw new Error(messageOf(error, "Görsel yüklenemedi"));
  return { bucket: BUCKET, path };
}

export async function removeBurakShareImage(bucket: string, path: string): Promise<void> {
  if (!bucket || !path) return;
  const { error } = await db.storage.from(bucket).remove([path]);
  if (error) throw new Error(messageOf(error, "Görsel silinemedi"));
}

export async function getBurakShareImageUrl(bucket: string, path: string): Promise<string> {
  const { data, error } = await db.storage.from(bucket).createSignedUrl(path, 300);
  if (error || !data?.signedUrl) {
    throw new Error(messageOf(error, "Görsel için erişim linki üretilemedi"));
  }
  return data.signedUrl;
}
```

- [ ] **Step 4: Testi çalıştır, PASS gör**

Run: `npm run test -- src/lib/admin-shell/burak-share-assets.test.ts`
Expected: PASS (5 test).

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin-shell/burak-share-assets.ts src/lib/admin-shell/burak-share-assets.test.ts
git commit -m "feat(burak-share): medya asset API'si + testleri (slot_key upsert, storage)"
```

---

## Task 3: Migration (tablo + RLS + bucket)

**Files:**
- Create: `supabase/migrations/20260708120000_burak_share_assets.sql`

**Interfaces:**
- Produces: `public.social_share_assets` tablosu (kolonlar: `slot_key` unique, `image_bucket`, `image_path`, `image_url`, `video_url`, `note`, `updated_by`, `updated_at`); private `burak-share` storage bucket; admin-only RLS.

- [ ] **Step 1: Migration dosyasını yaz**

```sql
-- "BURAK BURAYA BAK" paylaşım bölümü medya kayıtları.
-- /admin/social-share-vault "BURAK BURAYA BAK" sekmesindeki her Canva yuvası (slot)
-- için yüklenen görsel + opsiyonel görsel linki + video linki + not.
-- İçerik metinleri kodda statik (src/lib/admin-shell/burak-share-tools.ts); burada
-- yalnız medya kayıtları. Görünürlük: tüm adminler ortak. RLS = public.is_admin(auth.uid()).
-- Desen kaynağı: 20260627100000_social_share_tracking.sql + 20260517110000_add_whatsapp_landing_hero_bucket.sql.

-- 1) Tablo: slot başına tek satır -------------------------------------------
create table if not exists public.social_share_assets (
  id            uuid primary key default gen_random_uuid(),
  slot_key      text not null,                 -- ör. 'burak/burak-tool-11/variant-1'
  image_bucket  text,
  image_path    text,
  image_url     text,                          -- foto yerine verilen Gmail/Drive görsel linki
  video_url     text,                          -- Drive'a yüklenen videonun paylaşım linki
  note          text,
  updated_by    uuid references auth.users (id) on delete set null,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  constraint social_share_assets_slot_key_uniq unique (slot_key)
);

-- 2) RLS: yalnız admin okur/yazar; tüm adminler ortak görür -----------------
alter table public.social_share_assets enable row level security;

drop policy if exists social_share_assets_admin_select on public.social_share_assets;
create policy social_share_assets_admin_select on public.social_share_assets
  for select using (public.is_admin(auth.uid()));

drop policy if exists social_share_assets_admin_insert on public.social_share_assets;
create policy social_share_assets_admin_insert on public.social_share_assets
  for insert with check (public.is_admin(auth.uid()));

drop policy if exists social_share_assets_admin_update on public.social_share_assets;
create policy social_share_assets_admin_update on public.social_share_assets
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists social_share_assets_admin_delete on public.social_share_assets;
create policy social_share_assets_admin_delete on public.social_share_assets
  for delete using (public.is_admin(auth.uid()));

comment on table public.social_share_assets is
  'BURAK BURAYA BAK paylaşım medya kayıtları: slot başına görsel/görsel-linki/video-linki/not (ortak, admin-only).';

-- 3) Private storage bucket (yalnız admin okuma/yazma) ----------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select
  'burak-share',
  'burak-share',
  false,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where not exists (
  select 1 from storage.buckets where id = 'burak-share'
);

drop policy if exists "burak share admin read" on storage.objects;
create policy "burak share admin read"
  on storage.objects for select to authenticated
  using (bucket_id = 'burak-share' and public.is_admin(auth.uid()));

drop policy if exists "burak share admin insert" on storage.objects;
create policy "burak share admin insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'burak-share' and public.is_admin(auth.uid()));

drop policy if exists "burak share admin update" on storage.objects;
create policy "burak share admin update"
  on storage.objects for update to authenticated
  using (bucket_id = 'burak-share' and public.is_admin(auth.uid()))
  with check (bucket_id = 'burak-share' and public.is_admin(auth.uid()));

drop policy if exists "burak share admin delete" on storage.objects;
create policy "burak share admin delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'burak-share' and public.is_admin(auth.uid()));
```

- [ ] **Step 2: SQL sözdizimi gözden geçir**

Migration'ı gözle kontrol et: tüm ifadeler `;` ile bitiyor, `public.is_admin` çağrıları tutarlı, bucket adı `burak-share` her yerde aynı. (Canlıya uygulama ayrı adım — bu plan yalnız dosyayı ekler.)

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260708120000_burak_share_assets.sql
git commit -m "feat(burak-share): social_share_assets tablosu + RLS + burak-share bucket migration"
```

---

## Task 4: Medya paneli bileşeni (`BurakMediaPanel.tsx`)

**Files:**
- Create: `src/components/admin/social-share/BurakMediaPanel.tsx`

**Interfaces:**
- Consumes: `burak-share-assets.ts` exportları (`BurakShareAsset`, `BURAK_DRIVE_FOLDER_URL`, `upsertBurakShareAsset`, `uploadBurakShareImage`, `removeBurakShareImage`, `getBurakShareImageUrl`), `useToast`.
- Produces:
  - `type BurakMediaPanelProps = { slotKey: string; toolId: string; variantIndex: number; asset: BurakShareAsset | undefined }`
  - `function BurakMediaPanel(props: BurakMediaPanelProps): JSX.Element`

- [ ] **Step 1: Bileşeni yaz**

```tsx
// "BURAK BURAYA BAK" sekmesinde tek bir Canva yuvasının medya paneli.
// Görsel yükle VEYA görsel linki (Gmail/Drive) + Drive video butonu & video linki + not.
// Hepsi opsiyonel, bağımsız; değişiklik anında social_share_assets'e upsert edilir.

import { useEffect, useRef, useState } from "react";
import { ExternalLink, ImageIcon, Loader2, Trash2, Upload, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  BURAK_DRIVE_FOLDER_URL,
  getBurakShareImageUrl,
  removeBurakShareImage,
  uploadBurakShareImage,
  upsertBurakShareAsset,
  type BurakShareAsset,
} from "@/lib/admin-shell/burak-share-assets";

type BurakMediaPanelProps = {
  slotKey: string;
  toolId: string;
  variantIndex: number;
  asset: BurakShareAsset | undefined;
};

const errMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Beklenmeyen hata";

export function BurakMediaPanel({ slotKey, toolId, variantIndex, asset }: BurakMediaPanelProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [imageBucket, setImageBucket] = useState<string | null>(asset?.imageBucket ?? null);
  const [imagePath, setImagePath] = useState<string | null>(asset?.imagePath ?? null);
  const [imageUrl, setImageUrl] = useState(asset?.imageUrl ?? "");
  const [videoUrl, setVideoUrl] = useState(asset?.videoUrl ?? "");
  const [note, setNote] = useState(asset?.note ?? "");

  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Yüklü görselin signed URL önizlemesi.
  useEffect(() => {
    let active = true;
    if (imageBucket && imagePath) {
      getBurakShareImageUrl(imageBucket, imagePath)
        .then((url) => {
          if (active) setPreview(url);
        })
        .catch(() => {
          if (active) setPreview(null);
        });
    } else {
      setPreview(null);
    }
    return () => {
      active = false;
    };
  }, [imageBucket, imagePath]);

  const saveText = async (patch: Parameters<typeof upsertBurakShareAsset>[1]) => {
    try {
      await upsertBurakShareAsset(slotKey, patch);
    } catch (error: unknown) {
      toast({ title: "Kaydedilemedi", description: errMessage(error), variant: "destructive" });
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const { bucket, path } = await uploadBurakShareImage(toolId, variantIndex, file);
      await upsertBurakShareAsset(slotKey, { imageBucket: bucket, imagePath: path });
      setImageBucket(bucket);
      setImagePath(path);
      toast({ title: "Görsel yüklendi" });
    } catch (error: unknown) {
      toast({ title: "Yüklenemedi", description: errMessage(error), variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemoveImage = async () => {
    try {
      if (imageBucket && imagePath) await removeBurakShareImage(imageBucket, imagePath);
      await upsertBurakShareAsset(slotKey, { imageBucket: null, imagePath: null });
      setImageBucket(null);
      setImagePath(null);
      toast({ title: "Görsel kaldırıldı" });
    } catch (error: unknown) {
      toast({ title: "Kaldırılamadı", description: errMessage(error), variant: "destructive" });
    }
  };

  return (
    <div className="mt-2 space-y-3 rounded-lg border border-dashed bg-muted/30 p-3">
      {/* Görsel */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-semibold">
          <ImageIcon className="h-3.5 w-3.5" /> Görsel
        </Label>
        {preview ? (
          <div className="flex items-center gap-3">
            <img src={preview} alt="" className="h-16 w-16 rounded object-cover" />
            <Button variant="ghost" size="sm" onClick={handleRemoveImage}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Kaldır
            </Button>
          </div>
        ) : (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="mr-1.5 h-3.5 w-3.5" />
              )}
              Görsel Yükle
            </Button>
          </div>
        )}
      </div>

      {/* Görsel linki (foto yüklenmezse) */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">
          Görsel linki (foto yüklenmezse Gmail/Drive)
        </Label>
        <div className="flex items-center gap-2">
          <Input
            value={imageUrl}
            placeholder="https://drive.google.com/..."
            className="h-8 text-xs"
            onChange={(e) => setImageUrl(e.target.value)}
            onBlur={() => void saveText({ imageUrl: imageUrl.trim() || null })}
          />
          {imageUrl.trim() ? (
            <a href={imageUrl.trim()} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          ) : null}
        </div>
      </div>

      {/* Video */}
      <div className="space-y-1">
        <Label className="flex items-center gap-1.5 text-xs font-semibold">
          <Video className="h-3.5 w-3.5" /> Video
        </Label>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(BURAK_DRIVE_FOLDER_URL, "_blank", "noopener,noreferrer")}
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" /> Videoyu Drive'a Yükle
          </Button>
          <Input
            value={videoUrl}
            placeholder="Drive video linki yapıştır"
            className="h-8 flex-1 text-xs"
            onChange={(e) => setVideoUrl(e.target.value)}
            onBlur={() => void saveText({ videoUrl: videoUrl.trim() || null })}
          />
          {videoUrl.trim() ? (
            <a href={videoUrl.trim()} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <ExternalLink className="mr-1 h-3.5 w-3.5" /> Aç
              </Button>
            </a>
          ) : null}
        </div>
      </div>

      {/* Not */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Not</Label>
        <Textarea
          value={note}
          placeholder="Kısa not (opsiyonel)"
          className="min-h-[52px] resize-y text-xs"
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => void saveText({ note: note.trim() || null })}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Tip denetimi**

Run: `npx tsc --noEmit`
Expected: `BurakMediaPanel.tsx` için hata yok. (Import ettiği tüm shadcn bileşenleri `@/components/ui/*` altında mevcut: `input`, `label`, `textarea`, `button`.)

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/social-share/BurakMediaPanel.tsx
git commit -m "feat(burak-share): BurakMediaPanel (görsel/link/video/not yuvası)"
```

---

## Task 5: Sekme bileşeni (`BurakShareTab.tsx`)

**Files:**
- Create: `src/components/admin/social-share/BurakShareTab.tsx`

**Interfaces:**
- Consumes: `BURAK_SHARE_TOOLS` (Task 1), `burakSlotKey`, `listBurakShareAssets`, `BurakShareAsset` (Task 2), `BurakMediaPanel` (Task 4).
- Produces:
  - `type BurakShareTabProps = { copiedId: string | null; onCopy: (text: string, id: string) => void }`
  - `function BurakShareTab(props: BurakShareTabProps): JSX.Element`

- [ ] **Step 1: Bileşeni yaz**

`TestToolsTab` yapısını temel al; her varyantın Canva kartından SONRA `BurakMediaPanel` ekle. Asset'leri sayfa açılışında bir kez yükle.

```tsx
// "BURAK BURAYA BAK" sekmesi: 12 aracın akordeonu; her varyant Canva + LinkedIn
// kartı, Canva'nın altında BurakMediaPanel. Veri: burak-share-tools.ts (statik) +
// social_share_assets (medya). Asset'ler açılışta bir kez yüklenir, slot_key ile eşlenir.

import { useEffect, useState } from "react";
import { Check, Copy, Linkedin, Palette } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { BurakMediaPanel } from "@/components/admin/social-share/BurakMediaPanel";
import { BURAK_SHARE_TOOLS } from "@/lib/admin-shell/burak-share-tools";
import {
  burakSlotKey,
  listBurakShareAssets,
  type BurakShareAsset,
} from "@/lib/admin-shell/burak-share-assets";

type BurakShareTabProps = {
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
};

export function BurakShareTab({ copiedId, onCopy }: BurakShareTabProps) {
  const { toast } = useToast();
  const [assets, setAssets] = useState<Record<string, BurakShareAsset>>({});

  useEffect(() => {
    let active = true;
    listBurakShareAssets()
      .then((map) => {
        if (active) setAssets(map);
      })
      .catch((error: unknown) => {
        toast({
          title: "Medya kayıtları yüklenemedi",
          description: error instanceof Error ? error.message : "Beklenmeyen hata",
          variant: "destructive",
        });
      });
    return () => {
      active = false;
    };
  }, [toast]);

  return (
    <Accordion type="single" collapsible className="space-y-2">
      {BURAK_SHARE_TOOLS.map((tool) => (
        <AccordionItem key={tool.id} value={tool.id} className="rounded-xl border bg-card px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex flex-1 items-center gap-3 pr-3 text-left">
              <span className="font-mono text-sm font-bold text-muted-foreground">
                {String(tool.order).padStart(2, "0")}
              </span>
              <span className="text-base font-semibold">{tool.name}</span>
              <Badge
                variant="outline"
                className="border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-300"
              >
                Burak
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <p className="mb-4 text-sm text-muted-foreground">{tool.description}</p>
            <div className="space-y-4">
              {tool.variants.map((variant, index) => {
                const variantNo = index + 1;
                const slotKey = burakSlotKey(tool.id, index);
                return (
                  <div key={`${tool.id}-v${variantNo}`} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        Varyant {variantNo}
                      </Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <Palette className="h-4 w-4" /> Canva Promptu
                            <span className="text-xs font-normal text-muted-foreground">
                              metinsiz
                            </span>
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              onCopy(variant.canvaPrompt, `${tool.id}-v${variantNo}-canva`)
                            }
                          >
                            {copiedId === `${tool.id}-v${variantNo}-canva` ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <Textarea
                            readOnly
                            value={variant.canvaPrompt}
                            className="min-h-[140px] resize-y text-xs"
                          />
                          <BurakMediaPanel
                            slotKey={slotKey}
                            toolId={tool.id}
                            variantIndex={index}
                            asset={assets[slotKey]}
                          />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <Linkedin className="h-4 w-4" /> LinkedIn Postu
                            <span className="text-xs font-normal text-muted-foreground">
                              kopyala-yapıştır
                            </span>
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              onCopy(variant.linkedinPost, `${tool.id}-v${variantNo}-linkedin`)
                            }
                          >
                            {copiedId === `${tool.id}-v${variantNo}-linkedin` ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <Textarea
                            readOnly
                            value={variant.linkedinPost}
                            className="min-h-[220px] resize-y text-sm"
                          />
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
```

- [ ] **Step 2: Tip denetimi**

Run: `npx tsc --noEmit`
Expected: `BurakShareTab.tsx` için hata yok.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/social-share/BurakShareTab.tsx
git commit -m "feat(burak-share): BurakShareTab (12 araç akordeon + medya panelleri)"
```

---

## Task 6: Sayfaya 4. sekmeyi bağla

**Files:**
- Modify: `src/pages/admin/AdminSocialShareVaultPage.tsx`

**Interfaces:**
- Consumes: `BurakShareTab` (Task 5), `BURAK_SHARE_TOOLS` (Task 1).

- [ ] **Step 1: Importları ekle**

`AdminSocialShareVaultPage.tsx` üst importlarına ekle:

```ts
import { BurakShareTab } from "@/components/admin/social-share/BurakShareTab";
import { BURAK_SHARE_TOOLS } from "@/lib/admin-shell/burak-share-tools";
```

Ve `lucide-react` importuna `Camera` ikonunu ekle (mevcut satır: `import { Check, ClipboardList, Linkedin, Megaphone, Palette, Share2, Users } from "lucide-react";` → sonuna `Camera` ekle, alfabetik: `Camera, Check, ...`).

- [ ] **Step 2: TabKey + bulk buton + bulk üreticiler**

`type TabKey = "tools" | "diaspora" | "tests";` → `"burak"` ekle:

```ts
type TabKey = "tools" | "diaspora" | "tests" | "burak";
```

Bulk üreticileri (dosyanın üst kısmındaki `allTestCanva`/`allTestLinkedin`'in yanına) ekle:

```ts
const allBurakCanva = (): string =>
  BURAK_SHARE_TOOLS.map((t) =>
    t.variants.map((v, i) => `${t.order}.${i + 1} ${t.name}\n\n${v.canvaPrompt}`).join("\n\n"),
  ).join(SEPARATOR);

const allBurakLinkedin = (): string =>
  BURAK_SHARE_TOOLS.map((t) =>
    t.variants.map((v, i) => `${t.order}.${i + 1} ${t.name}\n\n${v.linkedinPost}`).join("\n\n"),
  ).join(SEPARATOR);
```

`BULK_BUTTONS` objesine `burak` girdisi ekle:

```ts
  burak: [
    { id: "all-burak-canva", label: "Tüm Canva Promptları", value: allBurakCanva },
    { id: "all-burak-linkedin", label: "Tüm LinkedIn Postları", value: allBurakLinkedin },
  ],
```

- [ ] **Step 3: TabsList + TabsContent ekle**

`TabsList` içine (tests trigger'ından sonra) yeni trigger:

```tsx
          <TabsTrigger value="burak" className="gap-2">
            <Camera className="h-4 w-4" />
            BURAK BURAYA BAK ({BURAK_SHARE_TOOLS.length})
          </TabsTrigger>
```

`tests` `TabsContent`'inden sonra yeni içerik:

```tsx
        <TabsContent value="burak">
          <BurakShareTab copiedId={copiedId} onCopy={handleCopy} />
        </TabsContent>
```

- [ ] **Step 4: Lint + tip + build denetimi**

Run: `npm run lint` → `AdminSocialShareVaultPage.tsx` temiz.
Run: `npx tsc --noEmit` → hata yok.
Run: `npm run build` → başarılı (production bundle kırılmıyor).

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/AdminSocialShareVaultPage.tsx
git commit -m "feat(burak-share): 4. sekme 'BURAK BURAYA BAK' + bulk kopyala butonları"
```

---

## Task 7: Duyuru girdisi + tam doğrulama

**Files:**
- Modify: `src/lib/admin-shell/admin-updates.ts`

- [ ] **Step 1: admin-updates.ts girdisini incele ve ekle**

`src/lib/admin-shell/admin-updates.ts`'i oku; en yeni girdinin şeklini (tarih, başlık, açıklama alanları) taklit ederek listenin başına bir girdi ekle. Örnek içerik (dosyadaki gerçek alan adlarına uyarlanır):

- Tarih: `2026-07-08`
- Başlık: `"BURAK BURAYA BAK" paylaşım bölümü eklendi`
- Açıklama (günlük Türkçe): `Sosyal Medya Paylaşım Deposu'na Burak için yeni bir sekme eklendi. 12 tanıtım aracının her görseli için foto yükleme, foto yoksa Gmail/Drive linki, Drive'a video yükleme butonu ve not alanı var. Yüklenenler tüm adminlerde ortak görünür.`

> Not: `admin-updates.ts`'in gerçek tip/alan adlarına birebir uy (ör. `date`, `title`, `description` veya kategori alanı). Yeni alan uydurma.

- [ ] **Step 2: Tüm test + doğrulama süiti**

Run: `npm run verify:text` → PASS
Run: `npm run test` → tüm testler yeşil (yeni `burak-share-assets.test.ts` dahil)
Run: `npm run lint` → temiz
Run: `npx tsc --noEmit` → hata yok
Run: `npm run build` → başarılı

- [ ] **Step 3: Commit**

```bash
git add src/lib/admin-shell/admin-updates.ts
git commit -m "docs(burak-share): admin güncellemeleri girdisi (BURAK BURAYA BAK)"
```

---

## Task 8: Push

- [ ] **Step 1: Branch'i push et**

```bash
git push -u origin feat/burak-share-vault
```

> Not: `main`'e değil `feat/burak-share-vault` branch'ine push. Push classifier'a takılırsa kullanıcıdan onay al ve `dangerouslyDisableSandbox` ile tekrar dene (memory: `feedback_merge_and_cleanup_branches`, `project_db_pooler_connection`).

- [ ] **Step 2: Kalan işleri kullanıcıya bildir**

Kullanıcıya net devir:
- Burak'ın linki: `https://corteqs.net/admin/social-share-vault` → **BURAK BURAYA BAK** sekmesi.
- Kalan (kullanıcı/sen): migration'ı canlı DB'ye uygula (Management API curl — bucket + tablo), sonra Coolify frontend deploy, sonra görsel QA. **Deploy edilmeden Burak canlıda göremez** (memory: `project_admin_updates_deploy_gap`).

---

## Self-Review (yazan tarafından)

**Spec coverage:**
- 4. sekme "BURAK BURAYA BAK" → Task 6 ✓
- 12 araç statik (10 mevcut + 2 Almanya) → Task 1 ✓
- 36 medya yuvası (her Canva altında) → Task 4 + Task 5 ✓
- Görsel yükle VEYA görsel linki (opsiyonel) → Task 4 ✓
- Video: Drive butonu + video linki (görselle aynı seviyede) → Task 4 ✓
- Not alanı → Task 4 ✓
- `social_share_assets` tablosu + RLS admin-only + bucket → Task 3 + Task 2 ✓
- Tüm adminler ortak görür (RLS is_admin) → Task 3 ✓
- Mevcut 3 sekme değişmez → Task 6 sadece ekleme ✓
- Metin kodda statik (düzenlenemez) → Task 1 ✓
- admin-updates girdisi → Task 7 ✓
- Push (branch, classifier onayı) → Task 8 ✓
- Sabitler (Drive URL, Burak URL) → Global Constraints + Task 2/8 ✓

**Placeholder scan:** admin-updates girdisi Task 7'de "dosyadaki gerçek alan adlarına uyarlanır" diyor — bu, dosyanın şu an okunmadığı için kasıtlı; adım okuma + uydurmama talimatı veriyor. Diğer tüm adımlar tam kod içeriyor. Kabul edilebilir (dosya yapısı bilinmiyor, uydurma yerine oku deniyor).

**Type consistency:** `burakSlotKey(toolId, variantIndex)` her yerde 0-based index; `BurakMediaPanel` `variantIndex={index}` (0-based) geçiyor, slotKey `burakSlotKey(tool.id, index)` ile aynı. `upsertBurakShareAsset(slotKey, patch)` imzası Task 2 tanımı ile Task 4 kullanımı tutarlı. `BurakShareAsset` alan adları (imageBucket/imagePath/imageUrl/videoUrl/note) Task 2, 4, 5'te aynı. ✓
