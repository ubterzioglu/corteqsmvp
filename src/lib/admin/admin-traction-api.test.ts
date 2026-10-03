/**
 * M15 · admin-traction-api sözleşmeleri.
 *
 * Kilitler: 5 view'ın OKUNMASI (doğru ad + maybeSingle), non-admin 0 satır → null
 * (hata değil), toplam içerik formülü, oran formatı (null → "—", uydurma sayı YOK).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const maybeSingleMock = vi.fn();
const fromMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

import {
  fetchTractionMetrics,
  formatRatePercent,
  totalContentCreated,
  type ContentCreatedMetric,
} from "@/lib/admin/admin-traction-api";

// Her view için ayrı veri döndüren zincir: from(view).select("*").maybeSingle()
const viewData: Record<string, unknown> = {};
beforeEach(() => {
  for (const key of Object.keys(viewData)) delete viewData[key]; // testler arası sızıntı olmasın
  fromMock.mockReset();
  maybeSingleMock.mockReset();
  fromMock.mockImplementation((view: string) => ({
    select: () => ({
      maybeSingle: () => maybeSingleMock(view),
    }),
  }));
  maybeSingleMock.mockImplementation((view: string) =>
    Promise.resolve({ data: viewData[view] ?? null, error: null }),
  );
});

const setContent = (overrides: Partial<ContentCreatedMetric> = {}) => {
  viewData["metrics_content_created"] = {
    events_7d: 0,
    events_total: 1,
    cadde_posts_7d: 2,
    cadde_posts_total: 30,
    carsi_items_7d: 0,
    carsi_items_total: 0,
    groups_7d: 0,
    groups_total: 10,
    group_posts_7d: 0,
    group_posts_total: 0,
    recommendations_total: 0,
    window_days: 7,
    ...overrides,
  };
};

describe("M15 · fetchTractionMetrics — 5 view okunur", () => {
  it("5 view'ı da doğru adla okur (maybeSingle: non-admin 0 satır → null, hata değil)", async () => {
    viewData["metrics_weekly_active_users"] = { active_7d: 12, window_days: 7 };
    setContent();
    viewData["metrics_recommendation_response_rate"] = {
      available: false,
      total: 0,
      responded: 0,
      response_rate: null,
      note: "Tavsiye modülü (M17) gelene dek boş — normal",
    };
    viewData["metrics_invite_signups"] = { last_7d: 1, last_30d: 3, total: 5 };
    viewData["metrics_30d_return_rate"] = {
      cohort_size: 40,
      returned: 10,
      return_rate: 0.25,
      window_days: 30,
    };

    const metrics = await fetchTractionMetrics();

    const readViews = maybeSingleMock.mock.calls.map((c) => c[0]).sort();
    expect(readViews).toEqual(
      [
        "metrics_30d_return_rate",
        "metrics_content_created",
        "metrics_invite_signups",
        "metrics_recommendation_response_rate",
        "metrics_weekly_active_users",
      ].sort(),
    );
    expect(metrics.weeklyActiveUsers?.active_7d).toBe(12);
    expect(metrics.inviteSignups?.total).toBe(5);
    expect(metrics.returnRate30d?.return_rate).toBe(0.25);
    expect(metrics.recommendationResponseRate?.available).toBe(false);
  });

  it("admin değilse (view 0 satır → null) metrikler null döner (hata YOK)", async () => {
    // maybeSingle tüm view'lar için null döndürüyor (non-admin/oturumsuz).
    const metrics = await fetchTractionMetrics();
    expect(metrics.weeklyActiveUsers).toBeNull();
    expect(metrics.contentCreated).toBeNull();
    expect(metrics.inviteSignups).toBeNull();
  });

  it("PostgREST hatası fırlatılır (react-query yakalar — sessiz yutulmaz)", async () => {
    maybeSingleMock.mockImplementation(() =>
      Promise.resolve({ data: null, error: { message: "permission denied" } }),
    );
    await expect(fetchTractionMetrics()).rejects.toBeTruthy();
  });
});

describe("M15 · totalContentCreated — tür kırılımı toplamı", () => {
  it("5 türün toplamını verir (tavsiye M17'ye dek 0 katılır)", () => {
    setContent(); // events 1 + cadde 30 + carsi 0 + groups 10 + group_posts 0 + reco 0
    expect(totalContentCreated(viewData["metrics_content_created"] as ContentCreatedMetric)).toBe(41);
  });

  it("null metrik → 0 (uydurma sayı yok)", () => {
    expect(totalContentCreated(null)).toBe(0);
  });
});

describe("M15 · formatRatePercent — oran → yüzde (null → '—')", () => {
  it("null/undefined/NaN → '—' (cohort boş ya da tavsiye yok)", () => {
    expect(formatRatePercent(null)).toBe("—");
    expect(formatRatePercent(undefined)).toBe("—");
    expect(formatRatePercent(Number.NaN)).toBe("—");
  });

  it("0.25 → '%25'; 0 → '%0' (sıfır gerçek değer, '—' değil)", () => {
    expect(formatRatePercent(0.25)).toBe("%25");
    expect(formatRatePercent(0)).toBe("%0");
  });
});
