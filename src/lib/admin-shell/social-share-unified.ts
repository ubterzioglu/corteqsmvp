// Sosyal Medya Paylaşım Deposu — 4 statik kaynağı (Araç Tanıtımları, Diaspora
// Postları, Test Araçları, Burak) tek bir birleşik kalem listesine normalize eder.
// UI tarafı (UnifiedShareList) bu tek listeyi render eder; kaynak verisi hâlâ
// kendi dosyasından gelir, burada sadece ortak şekle indirgenir.
//
// Kimlik: her kalemin kaynak dosyasında sabit bir globalId'si var
// ("item-1".."item-100", ilk atanışta interleaveBySource ile üretildi — bkz.
// git geçmişi). slot_key ve paylaşım takip DB'si SADECE globalId kullanır;
// tab/id sadece UI rozeti içindir, DB kimliğine hiç girmez.
//
// assignedDate: her kalemin görünüm sırasındaki (displayOrder) SABİT
// konumuna göre 20 Temmuz 2026'dan başlayarak ardışık atanan bir "önerilen
// gün" etiketi. Görünüm sırası RANDOMIZED_ORDER'daki deterministik (kod
// içinde sabit) karışık diziliştir — globalId'ler değişmez, sadece
// gösterim sırası karışıktır.

import {
  SOCIAL_SHARE_TOOLS,
  SOCIAL_SHARE_CATEGORY_LABELS,
  type SocialShareCategory,
} from "@/lib/admin-shell/social-share-vault";
import {
  DIASPORA_POSTS,
  DIASPORA_THEME_LABELS,
} from "@/lib/admin-shell/social-diaspora-posts";
import { SOCIAL_TEST_TOOLS } from "@/lib/admin-shell/social-test-tools";
import { BURAK_SHARE_TOOLS } from "@/lib/admin-shell/burak-share-tools";
import type { ShareTab } from "@/lib/admin-shell/social-share-log";

export type UnifiedVariant = {
  imagePrompts: string[];
  linkedinPost: string;
  instagramPost: string;
  redditPost: string;
};

export type UnifiedItem = {
  /** Kaynak dosyası — yalnız bilgi rozeti içindir; DB kimliği artık globalId. */
  tab: ShareTab;
  id: string;
  /** Tüm kaynaklar arası sabit tekil kimlik ("item-1".."item-100") — slot_key ve paylaşım takip DB'si bunu kullanır. */
  globalId: string;
  order: number;
  name: string;
  description?: string;
  /** Kart başlığında görünen kaynak rozeti. */
  sourceLabel: string;
  sourceBadgeClass: string;
  /** Yalnızca "tools" kaynağında dolu — kategori rozeti (Keşfet/Bağlan/...). */
  categoryLabel?: string;
  categoryBadgeClass?: string;
  /** Yalnızca "diaspora" kaynağında dolu — tema rozeti. */
  themeLabel?: string;
  /** tools/diaspora tek varyant; tests/burak çoklu varyant. */
  variants: UnifiedVariant[];
  /** Medya yükleme paneli gösterilir (tüm kaynaklarda true — her kalem görsel/video eklenebilir). */
  hasMediaPanel: boolean;
  /** "20 Tem", "21 Tem" ... — kalemin listedeki sabit konumuna göre türetilir. */
  assignedDate: string;
  /** 0-tabanlı sabit sıra (birleşik liste sırası) — assignedDate ile birebir eşleşir, görünüm sıralaması bu alana göre yapılır. */
  globalIndex: number;
};

/** İlk kalemin (globalIndex 0) önerilen günü. */
const VAULT_START_DATE = new Date(Date.UTC(2026, 6, 20));

/** globalIndex (0-tabanlı, birleşik liste sırası) → "20 Tem" gibi kısa Türkçe tarih etiketi. */
export const dateForGlobalIndex = (globalIndex: number): string => {
  const date = new Date(VAULT_START_DATE);
  date.setUTCDate(date.getUTCDate() + globalIndex);
  return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", timeZone: "UTC" });
};

export const SOURCE_LABELS: Record<ShareTab, string> = {
  tools: "Araç Tanıtımları",
  diaspora: "Diaspora Postları",
  tests: "Test Araçları",
  burak: "Burak",
};

const SOURCE_BADGE_CLASS: Record<ShareTab, string> = {
  tools: "border-violet-500/40 bg-violet-500/15 text-violet-600 dark:text-violet-300",
  diaspora: "border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-300",
  tests: "border-blue-500/40 bg-blue-500/15 text-blue-600 dark:text-blue-300",
  burak: "border-pink-500/40 bg-pink-500/15 text-pink-600 dark:text-pink-300",
};

const CATEGORY_BADGE_CLASS: Record<SocialShareCategory, string> = {
  kesfet: "border-teal-500/40 bg-teal-500/15 text-teal-600 dark:text-teal-300",
  baglan: "border-indigo-500/40 bg-indigo-500/15 text-indigo-600 dark:text-indigo-300",
  kullan: "border-orange-500/40 bg-orange-500/15 text-orange-600 dark:text-orange-300",
  koru: "border-pink-500/40 bg-pink-500/15 text-pink-600 dark:text-pink-300",
};

type UnscheduledItem = Omit<UnifiedItem, "assignedDate" | "globalIndex">;

const toolItems = (): UnscheduledItem[] =>
  SOCIAL_SHARE_TOOLS.map((tool) => ({
    tab: "tools" as const,
    id: tool.id,
    globalId: tool.globalId,
    order: tool.order,
    name: tool.name,
    description: tool.description,
    sourceLabel: SOURCE_LABELS.tools,
    sourceBadgeClass: SOURCE_BADGE_CLASS.tools,
    categoryLabel: SOCIAL_SHARE_CATEGORY_LABELS[tool.category],
    categoryBadgeClass: CATEGORY_BADGE_CLASS[tool.category],
    variants: [
      {
        imagePrompts: tool.imagePrompts,
        linkedinPost: tool.linkedinPost,
        instagramPost: tool.instagramPost,
        redditPost: tool.redditPost,
      },
    ],
    hasMediaPanel: true,
  }));

const diasporaItems = (): UnscheduledItem[] =>
  DIASPORA_POSTS.map((post) => ({
    tab: "diaspora" as const,
    id: post.id,
    globalId: post.globalId,
    order: post.order,
    name: post.title,
    sourceLabel: SOURCE_LABELS.diaspora,
    sourceBadgeClass: SOURCE_BADGE_CLASS.diaspora,
    themeLabel: DIASPORA_THEME_LABELS[post.theme],
    variants: [
      {
        imagePrompts: post.imagePrompts,
        linkedinPost: post.linkedinPost,
        instagramPost: post.instagramPost,
        redditPost: post.redditPost,
      },
    ],
    hasMediaPanel: true,
  }));

const testItems = (): UnscheduledItem[] =>
  SOCIAL_TEST_TOOLS.map((tool) => ({
    tab: "tests" as const,
    id: tool.id,
    globalId: tool.globalId,
    order: tool.order,
    name: tool.name,
    description: tool.description,
    sourceLabel: SOURCE_LABELS.tests,
    sourceBadgeClass: SOURCE_BADGE_CLASS.tests,
    variants: tool.variants,
    hasMediaPanel: true,
  }));

const burakItems = (): UnscheduledItem[] =>
  BURAK_SHARE_TOOLS.map((tool) => ({
    tab: "burak" as const,
    id: tool.id,
    globalId: tool.globalId,
    order: tool.order,
    name: tool.name,
    description: tool.description,
    sourceLabel: SOURCE_LABELS.burak,
    sourceBadgeClass: SOURCE_BADGE_CLASS.burak,
    variants: tool.variants,
    hasMediaPanel: true,
  }));

/**
 * Görünüm sırası — globalId'lerin (item-1..item-100) sabit, kod içine gömülü
 * karışık dizilişi. mulberry32(seed=20260721) ile üretilmiş tek seferlik
 * deterministik shuffle'ın çıktısıdır; yeniden hesaplanmaz, burada sabit
 * tutulur ki her sayfa yüklemesinde AYNI sıra çıksın. globalId'lerin kendisi
 * (dolayısıyla DB slot_key'leri) bu diziliş değişse de asla değişmez —
 * sadece kartların görünüm/numaralandırma sırası buna göre belirlenir.
 */
const RANDOMIZED_ORDER: readonly string[] = [
  "item-9", "item-49", "item-57", "item-51", "item-43", "item-79", "item-26", "item-37",
  "item-25", "item-54", "item-1", "item-95", "item-2", "item-16", "item-52", "item-28",
  "item-59", "item-48", "item-30", "item-58", "item-83", "item-89", "item-98", "item-99",
  "item-17", "item-11", "item-92", "item-75", "item-35", "item-23", "item-24", "item-65",
  "item-36", "item-74", "item-8", "item-68", "item-13", "item-93", "item-88", "item-60",
  "item-7", "item-78", "item-6", "item-41", "item-21", "item-22", "item-66", "item-19",
  "item-3", "item-67", "item-82", "item-84", "item-72", "item-76", "item-15", "item-18",
  "item-61", "item-31", "item-32", "item-5", "item-47", "item-20", "item-42", "item-53",
  "item-27", "item-63", "item-80", "item-85", "item-97", "item-46", "item-50", "item-77",
  "item-44", "item-70", "item-71", "item-86", "item-87", "item-69", "item-40", "item-14",
  "item-39", "item-45", "item-73", "item-10", "item-100", "item-38", "item-34", "item-96",
  "item-91", "item-55", "item-29", "item-64", "item-56", "item-81", "item-4", "item-33",
  "item-90", "item-94", "item-62", "item-12",
];

const RANDOMIZED_POSITION: ReadonlyMap<string, number> = new Map(
  RANDOMIZED_ORDER.map((globalId, index) => [globalId, index]),
);

const ALL_ITEMS: UnscheduledItem[] = [
  ...toolItems(),
  ...diasporaItems(),
  ...testItems(),
  ...burakItems(),
];

const SCHEDULED_ITEMS: UnscheduledItem[] = [...ALL_ITEMS].sort((a, b) => {
  const posA = RANDOMIZED_POSITION.get(a.globalId) ?? Number.MAX_SAFE_INTEGER;
  const posB = RANDOMIZED_POSITION.get(b.globalId) ?? Number.MAX_SAFE_INTEGER;
  return posA - posB;
});

/** Randomize edilmiş sabit sıra (globalIndex 0..N-1) + türetilen assignedDate. */
export const UNIFIED_ITEMS: UnifiedItem[] = SCHEDULED_ITEMS.map((item, globalIndex) => ({
  ...item,
  globalIndex,
  assignedDate: dateForGlobalIndex(globalIndex),
}));
