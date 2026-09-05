import { describe, expect, it } from "vitest";

import {
  WORKSHOP_KEYS,
  WORKSHOP_LABELS,
  calculateWorkshopProgress,
  collectWorkshopSections,
  collectWorkshopSessions,
  filterWorkshopItems,
  groupWorkshopItems,
  isAwaitingBurak,
  isAwaitingUbt,
  isWorkshopItemComplete,
  latestWorkshopSession,
  partitionWorkshopItems,
  validateWorkshopItemDraft,
  type WorkshopItem,
} from "./workshop-items";
import { ADMIN_ROUTE_PATTERNS } from "./admin-route-meta";

function item(overrides: Partial<WorkshopItem> = {}): WorkshopItem {
  return {
    id: `id-${overrides.itemNo ?? 1}`,
    workshopKey: "cadde",
    sessionKey: "WS1",
    section: "Akış",
    itemNo: 1,
    title: "Madde",
    ubtDone: false,
    burakDone: false,
    ubtDoneAt: null,
    burakDoneAt: null,
    createdAt: "2026-07-30T10:00:00Z",
    updatedAt: "2026-07-30T10:00:00Z",
    ...overrides,
  };
}

describe("isWorkshopItemComplete", () => {
  it("yalnız iki onay da varsa bitmiş sayar", () => {
    expect(isWorkshopItemComplete(item({ ubtDone: true, burakDone: true }))).toBe(true);
    expect(isWorkshopItemComplete(item({ ubtDone: true, burakDone: false }))).toBe(false);
    expect(isWorkshopItemComplete(item({ ubtDone: false, burakDone: true }))).toBe(false);
    expect(isWorkshopItemComplete(item())).toBe(false);
  });
});

describe("calculateWorkshopProgress", () => {
  it("sayaçları ve yüzdeyi hesaplar", () => {
    const progress = calculateWorkshopProgress([
      item({ itemNo: 1, ubtDone: true, burakDone: true }),
      item({ itemNo: 2, ubtDone: true }),
      item({ itemNo: 3, burakDone: true }),
      item({ itemNo: 4 }),
    ]);

    expect(progress).toEqual({
      total: 4,
      ubtDone: 2,
      burakDone: 2,
      completed: 1,
      awaitingBurak: 1,
      percent: 25,
    });
  });

  it("boş listede sıfıra bölme yapmaz", () => {
    expect(calculateWorkshopProgress([])).toEqual({
      total: 0,
      ubtDone: 0,
      burakDone: 0,
      completed: 0,
      awaitingBurak: 0,
      percent: 0,
    });
  });
});

describe("onay kuyruğu yardımcıları", () => {
  it("isAwaitingBurak yalnız UBT ✓ + Burak boş durumunu sayar", () => {
    expect(isAwaitingBurak(item({ ubtDone: true, burakDone: false }))).toBe(true);
    expect(isAwaitingBurak(item({ ubtDone: true, burakDone: true }))).toBe(false);
    expect(isAwaitingBurak(item({ ubtDone: false, burakDone: true }))).toBe(false);
    expect(isAwaitingBurak(item())).toBe(false);
  });

  it("isAwaitingUbt UBT işaretlememişse doğrudur; Burak'ın tek onayı bunu kapatmaz", () => {
    expect(isAwaitingUbt(item())).toBe(true);
    expect(isAwaitingUbt(item({ burakDone: true }))).toBe(true);
    expect(isAwaitingUbt(item({ ubtDone: true }))).toBe(false);
  });
});

describe("groupWorkshopItems", () => {
  it("bölümleri ilk madde numarasına göre, madde içi sırayı item_no'ya göre dizer", () => {
    const groups = groupWorkshopItems([
      item({ itemNo: 5, section: "Akış" }),
      item({ itemNo: 2, section: "Üst Alan" }),
      item({ itemNo: 4, section: "Akış" }),
      item({ itemNo: 1, section: "Üst Alan" }),
    ]);

    expect(groups.map((group) => group.section)).toEqual(["Üst Alan", "Akış"]);
    expect(groups[0].items.map((entry) => entry.itemNo)).toEqual([1, 2]);
    expect(groups[1].items.map((entry) => entry.itemNo)).toEqual([4, 5]);
  });

  it("ayni adli bolumu iki oturumda birlestirmez", () => {
    const groups = groupWorkshopItems([
      item({ itemNo: 47, sessionKey: "WS1", section: "Süreç" }),
      item({ itemNo: 120, sessionKey: "WS2", section: "Süreç" }),
      item({ itemNo: 48, sessionKey: "WS1", section: "Süreç" }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.sessionKey)).toEqual(["WS1", "WS2"]);
    expect(groups[0].items.map((entry) => entry.itemNo)).toEqual([47, 48]);
    expect(groups[1].items.map((entry) => entry.itemNo)).toEqual([120]);
  });

  it("bölümsüz maddeleri tek boş grupta toplar", () => {
    const groups = groupWorkshopItems([
      item({ itemNo: 1, section: "" }),
      item({ itemNo: 2, section: "   " }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].section).toBe("");
  });
});

describe("filterWorkshopItems", () => {
  const items = [
    item({ itemNo: 1, title: "Üsküdar kafe layout'u düzeltilecek", ubtDone: true, burakDone: true }),
    item({ itemNo: 2, title: "Emoji bankası eklenecek" }),
    item({ itemNo: 3, title: "Köprü baloncuğu", section: "Erişim ve Köprü" }),
  ];

  it("varsayılan olarak hepsini döner", () => {
    expect(filterWorkshopItems(items)).toHaveLength(3);
  });

  it("durum filtresi uygular", () => {
    expect(filterWorkshopItems(items, { status: "completed" }).map((entry) => entry.itemNo)).toEqual([1]);
    expect(filterWorkshopItems(items, { status: "open" }).map((entry) => entry.itemNo)).toEqual([2, 3]);
  });

  it("onay kuyruğu filtreleri: Burak'ı bekleyenler ile UBT'yi bekleyenler ayrışır", () => {
    const queue = [
      item({ itemNo: 1, ubtDone: true, burakDone: true }),
      item({ itemNo: 2, ubtDone: true, burakDone: false }),
      item({ itemNo: 3, ubtDone: false, burakDone: true }),
      item({ itemNo: 4 }),
    ];

    expect(filterWorkshopItems(queue, { status: "burak_pending" }).map((entry) => entry.itemNo)).toEqual([2]);
    expect(filterWorkshopItems(queue, { status: "ubt_pending" }).map((entry) => entry.itemNo)).toEqual([3, 4]);
    // Arama ile birleşir: "Madde" başlığı hepsinde var, kuyruk daraltması korunur.
    expect(filterWorkshopItems(queue, { status: "burak_pending", search: "madde" })).toHaveLength(1);
  });

  it("Türkçe aramada aksan-toleranslı eşleşir", () => {
    expect(filterWorkshopItems(items, { search: "uskudar" }).map((entry) => entry.itemNo)).toEqual([1]);
    expect(filterWorkshopItems(items, { search: "KÖPRÜ" }).map((entry) => entry.itemNo)).toEqual([3]);
  });

  it("bölüm adında da arar", () => {
    expect(filterWorkshopItems(items, { search: "erişim" }).map((entry) => entry.itemNo)).toEqual([3]);
  });

  it("oturum filtresi uygular ve diger filtrelerle birlesir", () => {
    const mixed = [
      item({ itemNo: 1, sessionKey: "WS1", ubtDone: true, burakDone: true }),
      item({ itemNo: 2, sessionKey: "WS1" }),
      item({ itemNo: 49, sessionKey: "WS2" }),
      item({ itemNo: 50, sessionKey: "WS2", ubtDone: true, burakDone: true }),
    ];

    expect(filterWorkshopItems(mixed, { session: "WS2" }).map((entry) => entry.itemNo)).toEqual([49, 50]);
    expect(filterWorkshopItems(mixed, { session: "all" })).toHaveLength(4);
    expect(
      filterWorkshopItems(mixed, { session: "WS2", status: "open" }).map((entry) => entry.itemNo),
    ).toEqual([49]);
  });
});

describe("partitionWorkshopItems", () => {
  it("iki onayı olanları tamamlanan tarafına ayırır, sırayı korur", () => {
    const { open, completed } = partitionWorkshopItems([
      item({ itemNo: 1, ubtDone: true, burakDone: true }),
      item({ itemNo: 2, ubtDone: true }),
      item({ itemNo: 3, burakDone: true }),
      item({ itemNo: 4, ubtDone: true, burakDone: true }),
      item({ itemNo: 5 }),
    ]);

    expect(open.map((entry) => entry.itemNo)).toEqual([2, 3, 5]);
    expect(completed.map((entry) => entry.itemNo)).toEqual([1, 4]);
  });

  it("boş listede iki boş dizi döner", () => {
    expect(partitionWorkshopItems([])).toEqual({ open: [], completed: [] });
  });
});

describe("collectWorkshopSessions", () => {
  it("oturumlari sayisal sirayla dizer (WS10 > WS9)", () => {
    const sessions = collectWorkshopSessions([
      item({ itemNo: 1, sessionKey: "WS2" }),
      item({ itemNo: 2, sessionKey: "WS10" }),
      item({ itemNo: 3, sessionKey: "WS1" }),
      item({ itemNo: 4, sessionKey: "WS9" }),
      item({ itemNo: 5, sessionKey: "WS2" }),
    ]);

    expect(sessions).toEqual(["WS1", "WS2", "WS9", "WS10"]);
  });

  it("en son oturumu doner, bos listede WS1'e duser", () => {
    expect(latestWorkshopSession([item({ sessionKey: "WS1" }), item({ sessionKey: "WS2" })])).toBe("WS2");
    expect(latestWorkshopSession([])).toBe("WS1");
  });
});

describe("collectWorkshopSections", () => {
  it("tekilleştirir, boşları atar ve Türkçe sıralar", () => {
    const sections = collectWorkshopSections([
      item({ itemNo: 1, section: "Çarşı" }),
      item({ itemNo: 2, section: "Akış" }),
      item({ itemNo: 3, section: "Akış" }),
      item({ itemNo: 4, section: "" }),
    ]);

    expect(sections).toEqual(["Akış", "Çarşı"]);
  });
});

describe("validateWorkshopItemDraft", () => {
  it("geçerli maddede null döner", () => {
    expect(
      validateWorkshopItemDraft({
        sessionKey: "WS2",
        section: "Akış",
        title: "Filtre açıklaması eklenecek",
      }),
    ).toBeNull();
  });

  it("boş madde metnini reddeder", () => {
    expect(validateWorkshopItemDraft({ sessionKey: "WS1", section: "Akış", title: "   " })).toBe(
      "Madde metni boş bırakılamaz.",
    );
  });

  it("gecersiz oturum etiketini reddeder", () => {
    expect(validateWorkshopItemDraft({ sessionKey: "ikinci", section: "Akış", title: "Madde" })).toBe(
      "Workshop oturumu WS1, WS2 gibi olmalı.",
    );
  });

  it("çok uzun bölüm adını reddeder", () => {
    expect(
      validateWorkshopItemDraft({ sessionKey: "WS1", section: "a".repeat(121), title: "Madde" }),
    ).toBe("Bölüm adı en fazla 120 karakter olabilir.");
  });
});

// Yeni workshop eklemek 4 dosyaya dokunur: WORKSHOP_KEYS, WORKSHOP_LABELS,
// pages/admin/workshop/routes.tsx ve admin-route-meta + nav registry. Aşağıdaki
// testler bunlardan birini unutmayı build/test kırarak yakalar; gevşetmeyin.
describe("workshop kayıt defteri", () => {
  it("her workshop anahtarının bir etiketi vardır", () => {
    for (const key of WORKSHOP_KEYS) {
      expect(WORKSHOP_LABELS[key]).toBeTruthy();
    }
    expect(Object.keys(WORKSHOP_LABELS).sort()).toEqual([...WORKSHOP_KEYS].sort());
  });

  it("her workshop anahtarının bir admin route'u vardır", () => {
    for (const key of WORKSHOP_KEYS) {
      expect(ADMIN_ROUTE_PATTERNS).toContain(`/admin/workshop/${key}`);
    }
  });

  it("cadde ve profil panoları tanımlıdır", () => {
    expect(WORKSHOP_KEYS).toContain("cadde");
    expect(WORKSHOP_KEYS).toContain("profil");
  });
});
