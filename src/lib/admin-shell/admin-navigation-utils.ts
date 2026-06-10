// Admin Panel V2 — navigasyon yardımcıları.
// Registry üzerinde route eşleştirme, aktif item bulma, breadcrumb üretimi
// ve command palette araması. Tüm yüzeyler bu util'leri kullanmalıdır;
// component içinde ad-hoc path karşılaştırması yazılmamalıdır.

import { adminNavGroups } from "./admin-navigation-registry";
import { adminRouteMeta } from "./admin-route-meta";
import type {
  AdminBreadcrumb,
  AdminNavGroup,
  AdminNavItem,
  AdminRouteMeta,
} from "./admin-shell-types";

/** Registry'deki bir item'ın grup ve parent zinciriyle birlikte görünümü. */
export type AdminNavEntry = {
  item: AdminNavItem;
  group: AdminNavGroup;
  parents: AdminNavItem[];
};

export function normalizeAdminPath(pathname: string): string {
  const trimmed = pathname.trim();
  if (trimmed.length > 1 && trimmed.endsWith("/")) {
    return trimmed.slice(0, -1);
  }
  return trimmed;
}

function pathStartsWith(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Grupları, child item'lar dahil düz bir entry listesine açar. */
export function flattenAdminNav(groups: AdminNavGroup[] = adminNavGroups): AdminNavEntry[] {
  const entries: AdminNavEntry[] = [];

  const visit = (item: AdminNavItem, group: AdminNavGroup, parents: AdminNavItem[]) => {
    entries.push({ item, group, parents });
    for (const child of item.children ?? []) {
      visit(child, group, [...parents, item]);
    }
  };

  for (const group of groups) {
    for (const item of group.items) {
      visit(item, group, []);
    }
  }

  return entries;
}

/** Registry'deki tüm internal path'ler (external item'lar hariç). */
export function collectInternalNavPaths(groups: AdminNavGroup[] = adminNavGroups): string[] {
  return flattenAdminNav(groups)
    .map((entry) => entry.item.to)
    .filter((to): to is string => Boolean(to));
}

/** Item'ın kendisi aktif mi? (`to` tam eşleşme veya `match` prefix eşleşmesi) */
export function isNavItemActive(item: AdminNavItem, pathname: string): boolean {
  const path = normalizeAdminPath(pathname);
  if (item.to && path === item.to) return true;
  return (item.match ?? []).some((prefix) => pathStartsWith(path, prefix));
}

/** Item veya child'larından biri aktif mi? (sidebar parent highlight için) */
export function isNavItemOrChildActive(item: AdminNavItem, pathname: string): boolean {
  if (isNavItemActive(item, pathname)) return true;
  return (item.children ?? []).some((child) => isNavItemOrChildActive(child, pathname));
}

function matchSpecificity(item: AdminNavItem, path: string): number {
  if (item.to && path === item.to) {
    // Tam eşleşme her zaman en spesifiktir; uzun path daha spesifik.
    return 10_000 + item.to.length;
  }
  const prefixLengths = (item.match ?? [])
    .filter((prefix) => pathStartsWith(path, prefix))
    .map((prefix) => prefix.length);
  return prefixLengths.length > 0 ? Math.max(...prefixLengths) : -1;
}

/** Verilen path için en spesifik aktif entry'yi döndürür. */
export function findActiveNavEntry(
  pathname: string,
  groups: AdminNavGroup[] = adminNavGroups,
): AdminNavEntry | undefined {
  const path = normalizeAdminPath(pathname);
  let best: AdminNavEntry | undefined;
  let bestScore = -1;

  for (const entry of flattenAdminNav(groups)) {
    const score = matchSpecificity(entry.item, path);
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }

  return bestScore >= 0 ? best : undefined;
}

/** Aktif child içeren grubu döndürür (sidebar'da otomatik açmak için). */
export function findActiveNavGroup(
  pathname: string,
  groups: AdminNavGroup[] = adminNavGroups,
): AdminNavGroup | undefined {
  return findActiveNavEntry(pathname, groups)?.group;
}

/** ":param" destekli route pattern eşleştirmesi (ör. "/admin/surveys/:id/edit"). */
export function matchesRoutePattern(pattern: string, pathname: string): boolean {
  const patternSegments = normalizeAdminPath(pattern).split("/");
  const pathSegments = normalizeAdminPath(pathname).split("/");
  if (patternSegments.length !== pathSegments.length) return false;
  return patternSegments.every(
    (segment, index) => segment.startsWith(":") || segment === pathSegments[index],
  );
}

function findRouteMeta(pathname: string, meta: AdminRouteMeta[]): AdminRouteMeta | undefined {
  return meta.find((entry) => matchesRoutePattern(entry.pattern, pathname));
}

function entryToBreadcrumbs(entry: AdminNavEntry): AdminBreadcrumb[] {
  const crumbs: AdminBreadcrumb[] = [{ label: entry.group.label }];
  for (const parent of entry.parents) {
    crumbs.push({ label: parent.label, to: parent.to });
  }
  crumbs.push({ label: entry.item.label, to: entry.item.to });
  return crumbs;
}

/**
 * Path'ten breadcrumb zinciri üretir.
 * Öncelik: nav item tam eşleşmesi > route meta (görünmeyen sayfalar) >
 * prefix eşleşmesi. Bilinmeyen path'te boş dizi döner.
 */
export function buildAdminBreadcrumbs(
  pathname: string,
  groups: AdminNavGroup[] = adminNavGroups,
  meta: AdminRouteMeta[] = adminRouteMeta,
): AdminBreadcrumb[] {
  const path = normalizeAdminPath(pathname);

  if (path === "/admin") {
    return [{ label: "Genel Bakış", to: "/admin" }];
  }

  const entries = flattenAdminNav(groups);

  const exact = entries.find((entry) => entry.item.to === path);
  if (exact) return entryToBreadcrumbs(exact);

  const metaEntry = findRouteMeta(path, meta);
  if (metaEntry?.kind === "page" && metaEntry.label) {
    const parent = metaEntry.parentId
      ? entries.find((entry) => entry.item.id === metaEntry.parentId)
      : undefined;
    if (parent) {
      return [...entryToBreadcrumbs(parent), { label: metaEntry.label }];
    }
    return [{ label: metaEntry.label }];
  }

  const active = findActiveNavEntry(path, groups);
  if (active) return entryToBreadcrumbs(active);

  return [];
}

function toSearchable(value: string): string {
  return value.toLocaleLowerCase("tr-TR");
}

/**
 * Command palette araması: label, shortLabel, alias, description,
 * grup adı ve URL üzerinden arar.
 */
export function searchAdminNav(
  query: string,
  groups: AdminNavGroup[] = adminNavGroups,
): AdminNavEntry[] {
  const needle = toSearchable(query.trim());
  if (!needle) return [];

  return flattenAdminNav(groups).filter(({ item, group }) => {
    const haystack = [
      item.label,
      item.shortLabel ?? "",
      item.description ?? "",
      group.label,
      item.to ?? "",
      item.href ?? "",
      ...(item.aliases ?? []),
    ];
    return haystack.some((value) => toSearchable(value).includes(needle));
  });
}
