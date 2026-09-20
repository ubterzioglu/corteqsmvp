import { describe, expect, it } from "vitest";

import { businesses } from "@/data/mock";
import {
  BUSINESS_DEMO_ROWS,
  EXCLUDED_REAL_BRAND_ID_LIST,
  KNOWN_BUSINESS_SECTORS,
  businessDemoHref,
  findBusinessDemo,
} from "@/lib/business-demo-rows";
import { BUSINESS_ROLE_GROUPS, roleKeysOf } from "@/lib/directory-role-groups";

describe("demo işletme kartları", () => {
  it("her kartın rol anahtarı İşletmeler taksonomisinde vardır", () => {
    // Taksonomide olmayan bir rol anahtarı, kartın rozetini boş bırakır ve
    // sektör filtresine düşmemesine yol açar.
    const known = new Set(roleKeysOf(BUSINESS_ROLE_GROUPS));
    for (const row of BUSINESS_DEMO_ROWS) {
      expect(known.has(row.roleKey ?? ""), `${row.title} → ${row.roleKey} bilinmiyor`).toBe(true);
    }
  });

  it("mock.ts'teki her sektörün bir rol karşılığı vardır", () => {
    // Bu test, `mock.ts`'e yeni bir sektör eklenip eşleme güncellenmediğinde
    // düşer. Yoksa o işletme kartı sessizce listeden düşerdi.
    const mapped = new Set(KNOWN_BUSINESS_SECTORS);
    const excluded = new Set(EXCLUDED_REAL_BRAND_ID_LIST);
    const unmapped = businesses
      .filter((business) => !excluded.has(business.id))
      .map((business) => business.sector)
      .filter((sector) => !mapped.has(sector));
    expect(unmapped).toEqual([]);
  });

  it("hiçbir demo kart doğrulanmış görünmez", () => {
    // Güven rozeti uydurma veriye verilmez.
    expect(BUSINESS_DEMO_ROWS.every((row) => row.isVerified === false)).toBe(true);
  });

  it("kartlar Türkçe detay yoluna bağlanır", () => {
    for (const row of BUSINESS_DEMO_ROWS) {
      expect(row.href).toBe(`/isletme/${row.slug}`);
    }
    expect(businessDemoHref("abc")).toBe("/isletme/abc");
  });

  it("kimlikler tekildir ve gerçek kayıtlarla çakışmaz", () => {
    const ids = BUSINESS_DEMO_ROWS.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
    // `demo-` öneki, gerçek katalog kayıtlarının uuid'leriyle karışmayı önler
    // (ortak kabuk demo satırları id ile ayırt ediyor).
    expect(ids.every((id) => id.startsWith("demo-"))).toBe(true);
  });

  it("ülke ve şehir dolu gelir (filtre seçeneği üretebilsin)", () => {
    for (const row of BUSINESS_DEMO_ROWS) {
      expect(row.countryName, `${row.title} ülkesiz`).toBeTruthy();
      expect(row.city, `${row.title} şehirsiz`).toBeTruthy();
    }
  });

  it("boş liste değildir", () => {
    expect(BUSINESS_DEMO_ROWS.length).toBeGreaterThan(0);
  });
});

describe("gerçek markalar demo listesinden çıkarılır", () => {
  // Gerçek bir şirketi kendi vitrininde listelemek — DEMO rozeti olsa bile —
  // var olmayan bir iş ortaklığı ima eder. Bu testin gevşetilmesi bunu geri getirir.
  it("loyalty partner kayıtları listede YOKTUR", () => {
    const slugs = new Set(BUSINESS_DEMO_ROWS.map((row) => row.slug));
    for (const excludedId of EXCLUDED_REAL_BRAND_ID_LIST) {
      expect(slugs.has(excludedId), `${excludedId} demo listesinde görünüyor`).toBe(false);
    }
  });

  it("gerçek marka adları hiçbir kartta geçmez", () => {
    const titles = BUSINESS_DEMO_ROWS.map((row) => row.title).join(" | ");
    for (const brand of ["HSBC", "Türk Hava Yolları", "Vodafone"]) {
      expect(titles).not.toContain(brand);
    }
  });

  it("detay sayfası da gerçek markayı açmaz", () => {
    for (const excludedId of EXCLUDED_REAL_BRAND_ID_LIST) {
      expect(findBusinessDemo(excludedId)).toBeUndefined();
    }
  });

  it("dışlama listesi mock veriyle uyumludur", () => {
    // Bir id `mock.ts`'ten silinirse dışlama satırı ölü kalır; bunu fark et.
    const mockIds = new Set(businesses.map((business) => business.id));
    for (const excludedId of EXCLUDED_REAL_BRAND_ID_LIST) {
      expect(mockIds.has(excludedId), `${excludedId} artık mock.ts'te yok`).toBe(true);
    }
  });
});

describe("findBusinessDemo", () => {
  it("bilinen slug için kaydı döner", () => {
    const first = BUSINESS_DEMO_ROWS[0];
    expect(findBusinessDemo(first.slug)?.name).toBe(first.title);
  });

  it("bilinmeyen ve boş slug için undefined döner", () => {
    expect(findBusinessDemo("yok-boyle-bir-sey")).toBeUndefined();
    expect(findBusinessDemo(undefined)).toBeUndefined();
    expect(findBusinessDemo("")).toBeUndefined();
  });
});
