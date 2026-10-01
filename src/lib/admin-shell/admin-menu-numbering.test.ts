// N01 sözleşmesi — yönetici menüsü numaralandırması.
//
// Numaranın TEK kaynağı `buildAdminMenuCatalog()`. Sidebar (N02), komut paleti
// ve bot korpusu (N04) aynı katalogdan beslenecek; buradaki kurallar bozulursa
// kullanıcıya söylenen numara ile menüde yazan numara sessizce ayrışır.
import { describe, expect, it } from "vitest";
import { FileText, Users } from "lucide-react";

import {
  adminMenuNumberById,
  buildAdminMenuCatalog,
  buildAdminMenuNumberById,
} from "@/lib/admin-shell/admin-menu-numbering";
import { adminNavGroups } from "@/lib/admin-shell/admin-navigation-registry";
import type { AdminNavGroup } from "@/lib/admin-shell/admin-shell-types";

/** Sidebar davranışını birebir taklit eden küçük sahte registry. */
const fixture: AdminNavGroup[] = [
  {
    id: "grup-a",
    label: "Grup A",
    accent: "sky",
    items: [
      { id: "a1", label: "A Bir", to: "/admin/a1", icon: Users, accent: "sky" },
      {
        id: "a2",
        label: "A İki",
        to: "/admin/a2",
        icon: FileText,
        accent: "sky",
        children: [
          { id: "a2c1", label: "A İki Alt Bir", to: "/admin/a2/c1", icon: FileText, accent: "sky" },
          { id: "a2c2", label: "A İki Alt İki", to: "/admin/a2/c2", icon: FileText, accent: "sky" },
        ],
      },
      { id: "a3", label: "A Pasif", to: "/admin/a3", icon: Users, accent: "sky", isInactive: true },
    ],
  },
  {
    id: "grup-b",
    label: "Grup B",
    accent: "amber",
    items: [
      { id: "b1", label: "B Bir", to: "/admin/b1", icon: Users, accent: "amber" },
      { id: "b2", label: "B Pasif", to: "/admin/b2", icon: Users, accent: "amber", isInactive: true },
    ],
  },
];

const numbersOf = (groups: AdminNavGroup[]) =>
  buildAdminMenuCatalog(groups).map((entry) => `${entry.id}=${entry.number}`);

describe("N01 · numaralandırma sırası", () => {
  it("gruplar registry sırasında, grup içinde aktif öğeler kendi sırasında", () => {
    expect(numbersOf(fixture)).toEqual([
      "a1=1",
      "a2=2",
      "a2c1=2.1",
      "a2c2=2.2",
      "b1=3",
      // İnaktifler EN SONDA, kendi aralarında grup sırasıyla.
      "a3=4",
      "b2=5",
    ]);
  });

  it("inaktif öğeler aktiflerin ARASINA girmez", () => {
    const catalog = buildAdminMenuCatalog(fixture);
    const firstInactive = catalog.findIndex((entry) => entry.isInactive);
    const lastActive = catalog.map((entry) => entry.isInactive).lastIndexOf(false);
    expect(firstInactive).toBeGreaterThan(lastActive);
  });

  it("alt öğe ÜST sayacı kaydırmaz", () => {
    // `a2`nin iki alt öğesi var; `b1` yine de 3 olmalı. Kaymaya izin verilseydi
    // dinamik alt sayfa eklenince tüm menü numaraları bir gecede bayatlardı.
    const withoutChildren: AdminNavGroup[] = [
      { ...fixture[0], items: fixture[0].items.map((item) => ({ ...item, children: undefined })) },
      fixture[1],
    ];
    const numaraOf = (groups: AdminNavGroup[], id: string) =>
      buildAdminMenuCatalog(groups).find((entry) => entry.id === id)?.number;

    expect(numaraOf(fixture, "b1")).toBe("3");
    expect(numaraOf(withoutChildren, "b1")).toBe("3");
  });

  it("alt öğe numarası ebeveynin numarasını önek alır", () => {
    const catalog = buildAdminMenuCatalog(fixture);
    const parent = catalog.find((entry) => entry.id === "a2");
    const child = catalog.find((entry) => entry.id === "a2c2");

    expect(child?.parentId).toBe("a2");
    expect(child?.number).toBe(`${parent?.number}.2`);
    expect(child?.topLevelIndex).toBe(parent?.topLevelIndex);
  });

  it("alt öğe grup bilgisini ebeveynden devralır", () => {
    const child = buildAdminMenuCatalog(fixture).find((entry) => entry.id === "a2c1");
    expect(child?.groupId).toBe("grup-a");
    expect(child?.groupLabel).toBe("Grup A");
  });
});

describe("N01 · canlı registry", () => {
  const catalog = buildAdminMenuCatalog();

  it("her id benzersizdir", () => {
    const ids = catalog.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("her numara benzersizdir", () => {
    const numbers = catalog.map((entry) => entry.number);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it("numara biçimi `N` veya `N.M`dir", () => {
    for (const entry of catalog) {
      expect(entry.number, `${entry.id} biçimi bozuk`).toMatch(/^\d+(\.\d+)?$/);
    }
  });

  it("üst seviye numaralar 1'den başlayıp boşluksuz artar", () => {
    const topLevel = catalog.filter((entry) => entry.childIndex === null);
    expect(topLevel.map((entry) => entry.topLevelIndex)).toEqual(
      topLevel.map((_, index) => index + 1),
    );
  });

  it("katalog registry'deki TÜM öğeleri kapsar — hiçbiri düşmez", () => {
    // Sessiz kayıp sınıfı: bir grup yanlışlıkla atlanırsa numaralar yine
    // benzersiz ve sıralı görünür, yalnız o sayfalar hiç numara almaz.
    const expected = adminNavGroups.flatMap((group) =>
      group.items.flatMap((item) => [item.id, ...(item.children ?? []).map((child) => child.id)]),
    );
    expect(catalog.map((entry) => entry.id).sort()).toEqual([...expected].sort());
  });

  it("inaktif öğeler listenin sonundadır", () => {
    const inactiveFlags = catalog.filter((entry) => entry.childIndex === null).map((e) => e.isInactive);
    expect(inactiveFlags).toEqual([...inactiveFlags].sort((a, b) => Number(a) - Number(b)));
  });

  it("önceden hesaplanmış harita katalogla aynıdır", () => {
    expect(adminMenuNumberById.size).toBe(catalog.length);
    for (const entry of catalog) {
      expect(adminMenuNumberById.get(entry.id)).toBe(entry.number);
    }
    expect([...buildAdminMenuNumberById().entries()]).toEqual([...adminMenuNumberById.entries()]);
  });
});
