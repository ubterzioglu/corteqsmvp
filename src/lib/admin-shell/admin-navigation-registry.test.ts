import { describe, expect, it } from "vitest";

import { adminNavGroups } from "./admin-navigation-registry";
import { ADMIN_ROUTE_PATTERNS, adminRouteMeta } from "./admin-route-meta";
import {
  buildAdminBreadcrumbs,
  collectInternalNavPaths,
  findActiveNavEntry,
  findActiveNavGroup,
  flattenAdminNav,
  isNavItemActive,
  isNavItemOrChildActive,
  matchesRoutePattern,
  normalizeAdminPath,
  searchAdminNav,
} from "./admin-navigation-utils";

const allEntries = flattenAdminNav(adminNavGroups);

describe("admin-navigation-registry", () => {
  it("tüm item ve grup ID'leri benzersizdir", () => {
    const groupIds = adminNavGroups.map((group) => group.id);
    expect(new Set(groupIds).size).toBe(groupIds.length);

    const itemIds = allEntries.map((entry) => entry.item.id);
    expect(new Set(itemIds).size).toBe(itemIds.length);
  });

  it("internal `to` değerleri benzersizdir", () => {
    const paths = collectInternalNavPaths(adminNavGroups);
    const duplicates = paths.filter((path, index) => paths.indexOf(path) !== index);
    expect(duplicates).toEqual([]);
  });

  it("external item'larda href ve isExternal vardır, `to` yoktur", () => {
    const externals = allEntries.filter((entry) => entry.item.isExternal);
    expect(externals.length).toBeGreaterThan(0);
    for (const { item } of externals) {
      expect(item.href).toMatch(/^https:\/\//);
      expect(item.to).toBeUndefined();
    }
  });

  it("internal item'larda `to` veya children vardır", () => {
    const internals = allEntries.filter((entry) => !entry.item.isExternal);
    for (const { item } of internals) {
      expect(Boolean(item.to) || (item.children?.length ?? 0) > 0).toBe(true);
    }
  });

  it("registry'deki tüm internal URL'ler App route ağacında geçerlidir", () => {
    const paths = collectInternalNavPaths(adminNavGroups);
    const unmatched = paths.filter(
      (path) => !ADMIN_ROUTE_PATTERNS.some((pattern) => matchesRoutePattern(pattern, path)),
    );
    expect(unmatched).toEqual([]);
  });

  it("tüm internal `to` değerleri /admin ile başlar", () => {
    for (const path of collectInternalNavPaths(adminNavGroups)) {
      expect(path.startsWith("/admin")).toBe(true);
    }
  });

  it("redirect-only route'lar görünür navigasyonda yer almaz", () => {
    const navPaths = new Set(collectInternalNavPaths(adminNavGroups));
    const redirectPatterns = adminRouteMeta
      .filter((meta) => meta.kind === "redirect")
      .map((meta) => meta.pattern);
    for (const pattern of redirectPatterns) {
      expect(navPaths.has(pattern)).toBe(false);
    }
  });

  it("inactive item'lar işaretlidir ve aktif item'lara karışmaz", () => {
    const inactiveIds = allEntries
      .filter((entry) => entry.item.isInactive)
      .map((entry) => entry.item.id);
    expect(inactiveIds).toContain("may19-kelime");
    expect(inactiveIds).toContain("may19-ani");
    expect(inactiveIds).toContain("roles-draft");

    const activeEntries = allEntries.filter((entry) => !entry.item.isInactive);
    for (const entry of activeEntries) {
      expect(entry.item.isInactive).toBeFalsy();
    }
  });

  it("dinamik child'lar registry'ye bağlanmıştır (advisors + workspace docs)", () => {
    const advisorParent = allEntries.find((entry) => entry.item.id === "advisor-profiles");
    expect(advisorParent?.item.children?.length).toBeGreaterThan(0);

    const docsParent = allEntries.find((entry) => entry.item.id === "workspace-docs");
    expect(docsParent?.item.children?.length).toBeGreaterThan(0);
    for (const child of docsParent?.item.children ?? []) {
      expect(child.to).toMatch(/^\/admin\/workspace\/docs\//);
    }
  });
});

describe("route matching", () => {
  it("normalizeAdminPath trailing slash temizler", () => {
    expect(normalizeAdminPath("/admin/data/")).toBe("/admin/data");
    expect(normalizeAdminPath("/admin")).toBe("/admin");
  });

  it("matchesRoutePattern :param segmentlerini eşler", () => {
    expect(matchesRoutePattern("/admin/surveys/:id/edit", "/admin/surveys/42/edit")).toBe(true);
    expect(matchesRoutePattern("/admin/surveys/:id/edit", "/admin/surveys/42/responses")).toBe(false);
    expect(matchesRoutePattern("/admin/data", "/admin/data")).toBe(true);
    expect(matchesRoutePattern("/admin/data", "/admin/data/extra")).toBe(false);
  });

  it("tam `to` eşleşmesi aktif item'ı bulur", () => {
    const entry = findActiveNavEntry("/admin/approvals");
    expect(entry?.item.id).toBe("approvals");
  });

  it("alias URL'ler doğru item'ı aktif eder (profile-role-assignment -> catalog-database)", () => {
    const entry = findActiveNavEntry("/admin/new-member/profile-role-assignment");
    expect(entry?.item.id).toBe("catalog-database");
  });

  it("prefix match alt path'lerde çalışır (surveys/:id/edit -> surveys)", () => {
    const entry = findActiveNavEntry("/admin/surveys/42/edit");
    expect(entry?.item.id).toBe("surveys");
  });

  it("en spesifik eşleşme kazanır (muhasebe/giderler parent'a değil child'a gider)", () => {
    const entry = findActiveNavEntry("/admin/muhasebe/giderler");
    expect(entry?.item.id).toBe("muhasebe-giderler");
  });

  it("aktif grup doğru bulunur", () => {
    expect(findActiveNavGroup("/admin/audit-logs")?.id).toBe("members");
    expect(findActiveNavGroup("/admin/whatsapp-landings/editors")?.id).toBe("communities");
  });

  it("isNavItemOrChildActive parent'ı child route'unda aktif sayar", () => {
    const docsParent = allEntries.find((entry) => entry.item.id === "workspace-docs");
    const firstDoc = docsParent?.item.children?.[0];
    expect(firstDoc?.to).toBeDefined();
    expect(isNavItemOrChildActive(docsParent!.item, firstDoc!.to!)).toBe(true);
    expect(isNavItemActive(docsParent!.item, "/admin/workspace")).toBe(false);
  });
});

describe("breadcrumbs", () => {
  it("/admin için Genel Bakış döner", () => {
    expect(buildAdminBreadcrumbs("/admin")).toEqual([{ label: "Genel Bakış", to: "/admin" }]);
  });

  it("birinci seviye sayfa: Grup > Sayfa", () => {
    const crumbs = buildAdminBreadcrumbs("/admin/data");
    expect(crumbs.map((crumb) => crumb.label)).toEqual(["Üyeler ve Dizin", "Kayıt Veritabanı"]);
  });

  it("nested muhasebe sayfası: Muhasebe > Nakit Akışı", () => {
    const crumbs = buildAdminBreadcrumbs("/admin/muhasebe/nakit-akisi");
    expect(crumbs.map((crumb) => crumb.label)).toEqual(["Muhasebe", "Nakit Akışı"]);
  });

  it("route meta sayfası: Anketler > Anket Düzenle", () => {
    const crumbs = buildAdminBreadcrumbs("/admin/surveys/42/edit");
    expect(crumbs.map((crumb) => crumb.label)).toEqual([
      "İçerik ve Kampanyalar",
      "Anketler",
      "Anket Düzenle",
    ]);
  });

  it("dinamik doc child'ı parent zinciriyle çözülür", () => {
    const docsParent = allEntries.find((entry) => entry.item.id === "workspace-docs");
    const firstDoc = docsParent?.item.children?.[0];
    const crumbs = buildAdminBreadcrumbs(firstDoc!.to!);
    expect(crumbs[0]?.label).toBe("Operasyon Workspace");
    expect(crumbs[1]?.label).toBe("Dokümanlar");
    expect(crumbs[crumbs.length - 1]?.label).toBe(firstDoc!.label);
  });

  it("bilinmeyen path boş dizi döner", () => {
    expect(buildAdminBreadcrumbs("/admin/boyle-bir-sayfa-yok")).toEqual([]);
  });
});

describe("command palette search", () => {
  it("alias ile bulur: 'override' -> Feature Override", () => {
    const results = searchAdminNav("override");
    expect(results.map((entry) => entry.item.id)).toContain("feature-overrides");
  });

  it("Türkçe label ile bulur: 'veritabanı'", () => {
    const ids = searchAdminNav("veritabanı").map((entry) => entry.item.id);
    expect(ids).toContain("catalog-database");
    expect(ids).toContain("database-tables");
  });

  it("grup adıyla bulur: 'muhasebe' tüm muhasebe ekranlarını döndürür", () => {
    const ids = searchAdminNav("muhasebe").map((entry) => entry.item.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "muhasebe-dashboard",
        "muhasebe-giderler",
        "muhasebe-gelirler",
        "muhasebe-nakit-akisi",
      ]),
    );
  });

  it("boş sorgu boş sonuç döner", () => {
    expect(searchAdminNav("   ")).toEqual([]);
  });

  it("external link'ler aranabilir", () => {
    const ids = searchAdminNav("globe").map((entry) => entry.item.id);
    expect(ids).toContain("external-globe");
  });
});
