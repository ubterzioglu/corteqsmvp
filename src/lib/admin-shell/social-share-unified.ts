// Sosyal Medya Paylaşım Deposu — 4 statik kaynağı (Araç Tanıtımları, Diaspora
// Postları, Test Araçları, Burak) tek bir birleşik kalem listesine normalize eder.
// UI tarafı (UnifiedShareList) bu tek listeyi render eder; kaynak verisi hâlâ
// kendi dosyasından gelir, burada sadece ortak şekle indirgenir.

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
  canvaPrompt: string;
  linkedinPost: string;
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
  /** Yalnızca "burak" kaynağında true — medya yükleme paneli gösterilir. */
  hasMediaPanel: boolean;
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

const toolItems = (): UnifiedItem[] =>
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
    variants: [{ canvaPrompt: tool.canvaPrompts.join("\n\n"), linkedinPost: tool.linkedinPost }],
    hasMediaPanel: false,
  }));

const diasporaItems = (): UnifiedItem[] =>
  DIASPORA_POSTS.map((post) => ({
    tab: "diaspora" as const,
    id: post.id,
    order: post.order,
    name: post.title,
    sourceLabel: SOURCE_LABELS.diaspora,
    sourceBadgeClass: SOURCE_BADGE_CLASS.diaspora,
    themeLabel: DIASPORA_THEME_LABELS[post.theme],
    variants: [{ canvaPrompt: post.canvaPrompt, linkedinPost: post.linkedinPost }],
    hasMediaPanel: false,
  }));

const testItems = (): UnifiedItem[] =>
  SOCIAL_TEST_TOOLS.map((tool) => ({
    tab: "tests" as const,
    id: tool.id,
    order: tool.order,
    name: tool.name,
    description: tool.description,
    sourceLabel: SOURCE_LABELS.tests,
    sourceBadgeClass: SOURCE_BADGE_CLASS.tests,
    variants: tool.variants,
    hasMediaPanel: false,
  }));

const burakItems = (): UnifiedItem[] =>
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

/** Tüm kaynaklar, kaynak sırasına göre (tools → diaspora → tests → burak) tek liste. */
export const UNIFIED_ITEMS: UnifiedItem[] = [
  ...toolItems(),
  ...diasporaItems(),
  ...testItems(),
  ...burakItems(),
];
