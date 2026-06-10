// Admin Panel V2 — shell tip tanımları.
// Tek kaynaklı navigasyon registry'sinin (admin-navigation-registry.ts) ve
// onu tüketen tüm yüzeylerin (sidebar, mobile drawer, command palette,
// breadcrumb, dashboard) ortak tipleri.
// Bkz: docs/plans/2026-06-10-admin-panel-v2-masterplan.md §6.3

import type { LucideIcon } from "lucide-react";

/** Modül renk kodu — masterplan §5.2 renk mantığı. */
export type AdminAccent =
  | "indigo" // Genel Bakış
  | "sky" // Üyeler ve Dizin
  | "emerald" // Roller ve AFS
  | "rose" // Topluluklar
  | "amber" // İçerik ve Kampanyalar
  | "slate" // Operasyon Workspace
  | "green" // Muhasebe
  | "red"; // Sistem ve Güvenlik

/** Sidebar / palette item'larında gösterilebilecek dinamik badge türleri. */
export type AdminNavBadgeKind =
  | "approval-count"
  | "claim-count"
  | "system-warning"
  | "static";

export type AdminNavItem = {
  /** Registry genelinde benzersiz, kebab-case kimlik. */
  id: string;
  label: string;
  shortLabel?: string;
  description?: string;
  /** Internal route path'i. External item'larda boş bırakılır. */
  to?: string;
  /** External link URL'i. isExternal=true item'larda zorunlu. */
  href?: string;
  icon: LucideIcon;
  accent: AdminAccent;
  /**
   * `to` dışında bu item'ı aktif sayacak ek path'ler.
   * Prefix eşleşmesi yapılır (path veya path + "/...").
   */
  match?: string[];
  /** Command palette araması için ek anahtar kelimeler. */
  aliases?: string[];
  children?: AdminNavItem[];
  isExternal?: boolean;
  /** Aktif kullanılmayan ekranlar; sidebar'da ayrı alt bölümde gösterilir. */
  isInactive?: boolean;
  requiredAccess?: "admin" | "moderator";
  badge?: AdminNavBadgeKind;
};

export type AdminNavGroup = {
  id: string;
  label: string;
  icon?: LucideIcon;
  accent: AdminAccent;
  defaultOpen?: boolean;
  items: AdminNavItem[];
};

export type AdminBreadcrumb = {
  label: string;
  to?: string;
};

/**
 * Navigasyonda görünmeyen route'lar için metadata (detay sayfaları,
 * redirect-only path'ler). Breadcrumb ve route doğrulama testleri kullanır.
 */
export type AdminRouteMeta = {
  /** react-router pattern'i, ":param" destekler (ör. "/admin/surveys/:id/edit"). */
  pattern: string;
  /** Breadcrumb'da gösterilecek isim. Redirect'lerde opsiyoneldir. */
  label?: string;
  /** Breadcrumb zincirinde bağlanacağı registry item id'si. */
  parentId?: string;
  kind: "page" | "redirect";
  /** Redirect hedef path'i (dokümantasyon amaçlı). */
  redirectTo?: string;
};
