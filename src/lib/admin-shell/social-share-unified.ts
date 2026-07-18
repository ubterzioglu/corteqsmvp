// Sosyal Medya Paylaşım Deposu — 4 statik kaynağı (Araç Tanıtımları, Diaspora
// Postları, Test Araçları, Burak) tek bir birleşik kalem listesine normalize eder.
// UI tarafı (UnifiedShareList) bu tek listeyi render eder; kaynak verisi hâlâ
// kendi dosyasından gelir, burada sadece ortak şekle indirgenir.
//
// assignedDate: her kalemin harmanlanmış SABİT konumuna (globalIndex) göre
// 20 Temmuz 2026'dan başlayarak ardışık atanan bir "önerilen gün" etiketi.
// UI (UnifiedShareList) "Tümü" görünümünde kartları bu sabit sıraya göre
// gösterir. Kaynaklar (tools/diaspora/tests/burak) art arda bloklar halinde
// değil, interleaveBySource ile oranlarına göre harmanlanmış sırayla dizilir
// — böylece art arda günlerde aynı kaynaktan (dolayısıyla genelde aynı
// formattan/temadan) içerik gelme olasılığı azalır.

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
  /** Kaynak sekmesi — paylaşım takip DB'sindeki item_tab ile birebir aynı. */
  tab: ShareTab;
  id: string;
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
    order: tool.order,
    name: tool.name,
    description: tool.description,
    sourceLabel: SOURCE_LABELS.burak,
    sourceBadgeClass: SOURCE_BADGE_CLASS.burak,
    variants: tool.variants,
    hasMediaPanel: true,
  }));

/**
 * 4 kaynağı (tools/diaspora/tests/burak) en büyük kalan yöntemiyle (largest
 * remainder) günlere harmanlar — art arda günlerde aynı kaynaktan içerik
 * gelme olasılığı en aza iner. Her kaynak kendi içindeki sırayı korur
 * (tools kendi 1..10 sırasıyla, diaspora kendi 1..68 sırasıyla ilerler),
 * sadece kaynaklar arası geçiş oranlara göre dağıtılır.
 */
const interleaveBySource = (sources: UnscheduledItem[][]): UnscheduledItem[] => {
  const total = sources.reduce((sum, list) => sum + list.length, 0);
  const cursors = sources.map(() => 0);
  const result: UnscheduledItem[] = [];

  for (let slot = 0; slot < total; slot++) {
    // Her kaynağın "hedef doluluk oranı" bu slot'a kadar ne olmalıydı — en
    // geride kalan (hedeften en uzak) kaynak bir sonraki kalemi verir.
    let bestSource = -1;
    let bestDeficit = -Infinity;
    for (let s = 0; s < sources.length; s++) {
      if (cursors[s] >= sources[s].length) continue;
      const targetShare = (sources[s].length / total) * (slot + 1);
      const deficit = targetShare - cursors[s];
      if (deficit > bestDeficit) {
        bestDeficit = deficit;
        bestSource = s;
      }
    }
    result.push(sources[bestSource][cursors[bestSource]]);
    cursors[bestSource] += 1;
  }

  return result;
};

const SCHEDULED_ITEMS: UnscheduledItem[] = interleaveBySource([
  toolItems(),
  diasporaItems(),
  testItems(),
  burakItems(),
]);

/** Harmanlanmış sabit sıra (globalIndex 0..N-1) + türetilen assignedDate. */
export const UNIFIED_ITEMS: UnifiedItem[] = SCHEDULED_ITEMS.map((item, globalIndex) => ({
  ...item,
  globalIndex,
  assignedDate: dateForGlobalIndex(globalIndex),
}));
