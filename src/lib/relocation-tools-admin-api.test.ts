import { describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

import { listToolQuestionCounts } from "@/lib/relocation-tools-admin-api";

function buildQueryResult(data: unknown) {
  return {
    eq: () => buildQueryResult(data),
    order: () => Promise.resolve({ data, error: null }),
    select: () => buildQueryResult(data),
  };
}

describe("listToolQuestionCounts", () => {
  it("motor tabanlı araçları relocation_tool_questions'tan mode bazlı sayar", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "relocation_tools") {
        return {
          select: () => ({
            order: () =>
              Promise.resolve({
                data: [
                  {
                    key: "ulke_secimi",
                    slug: "ulke-secimi",
                    title_tr: "Ülke Seçimi",
                    category: "core",
                    is_active: true,
                  },
                ],
                error: null,
              }),
          }),
        };
      }
      if (table === "relocation_tool_questions") {
        return {
          select: () => ({
            eq: () =>
              Promise.resolve({
                data: [
                  { tool_key: "ulke_secimi", mode: "quick" },
                  { tool_key: "ulke_secimi", mode: "quick" },
                  { tool_key: "ulke_secimi", mode: "detailed" },
                  { tool_key: "ulke_secimi", mode: "both" },
                ],
                error: null,
              }),
          }),
        };
      }
      if (table === "germany_citizenship_questions") {
        return { select: () => ({ error: null, data: [] }) };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const rows = await listToolQuestionCounts();
    const ulke = rows.find((r) => r.key === "ulke_secimi");

    expect(ulke).toBeDefined();
    expect(ulke?.kind).toBe("question_bank");
    // quick = 2 "quick" + 1 "both" = 3; detailed = 1 "detailed" + 1 "both" = 2
    expect(ulke?.quick_count).toBe(3);
    expect(ulke?.detailed_count).toBe(2);
    expect(ulke?.total_count).toBe(4);
  });

  it("standalone hesaplayıcı araçlar için sabit alan sayısı döner", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "relocation_tools") {
        return {
          select: () => ({
            order: () =>
              Promise.resolve({
                data: [
                  {
                    key: "maas_hesaplama_almanya",
                    slug: "maas-hesaplama-almanya",
                    title_tr: "Maaş Hesaplama (Almanya)",
                    category: "germany_tools",
                    is_active: true,
                  },
                ],
                error: null,
              }),
          }),
        };
      }
      if (table === "relocation_tool_questions") {
        return { select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) };
      }
      if (table === "germany_citizenship_questions") {
        return { select: () => ({ error: null, data: [] }) };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const rows = await listToolQuestionCounts();
    const maas = rows.find((r) => r.key === "maas_hesaplama_almanya");

    expect(maas?.kind).toBe("calculator");
    expect(maas?.quick_count).toBe(9);
    expect(maas?.detailed_count).toBe(9);
    expect(maas?.total_count).toBe(9);
  });

  it("vatandaşlık testi için germany_citizenship_questions satır sayısını döner", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "relocation_tools") {
        return {
          select: () => ({
            order: () =>
              Promise.resolve({
                data: [
                  {
                    key: "vatandaslik_testi_almanya",
                    slug: "vatandaslik-testi-almanya",
                    title_tr: "Vatandaşlık Testi (Almanya)",
                    category: "germany_tools",
                    is_active: true,
                  },
                ],
                error: null,
              }),
          }),
        };
      }
      if (table === "relocation_tool_questions") {
        return { select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) };
      }
      if (table === "germany_citizenship_questions") {
        return {
          select: () =>
            Promise.resolve({
              data: Array.from({ length: 469 }, (_, i) => ({ id: i })),
              error: null,
            }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const rows = await listToolQuestionCounts();
    const vatandaslik = rows.find((r) => r.key === "vatandaslik_testi_almanya");

    expect(vatandaslik?.kind).toBe("question_bank");
    expect(vatandaslik?.quick_count).toBe(469);
    expect(vatandaslik?.detailed_count).toBe(469);
    expect(vatandaslik?.total_count).toBe(469);
  });

  it("vize seçimi için karar ağacı düğüm sayısını döner", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "relocation_tools") {
        return {
          select: () => ({
            order: () =>
              Promise.resolve({
                data: [
                  {
                    key: "vize_secim_almanya",
                    slug: "vize-secim-almanya",
                    title_tr: "Vize Seçimi (Almanya)",
                    category: "germany_tools",
                    is_active: true,
                  },
                ],
                error: null,
              }),
          }),
        };
      }
      if (table === "relocation_tool_questions") {
        return { select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) };
      }
      if (table === "germany_citizenship_questions") {
        return { select: () => ({ error: null, data: [] }) };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const rows = await listToolQuestionCounts();
    const vize = rows.find((r) => r.key === "vize_secim_almanya");

    expect(vize?.kind).toBe("decision_tree");
    expect(vize?.total_count).toBeGreaterThan(0);
  });
});
