/**
 * G14 · şikayet API katmanı (`group-reports-api.ts`).
 *
 * Kilitler: sebep etiketleri politika §4 metnine BİREBİR (politika dosyasından
 * ayrıştırılır — kopya liste kayarsa düşer) · RPC hatası DÜZ NESNE olarak
 * çözülür (instanceof Error daraltması yok — KR03) · gönderim doğru RPC'ye doğru
 * parametrelerle gider · "diger" açıklamasız istemcide de durur.
 */
import { readFileSync } from "node:fs";

import { beforeEach, describe, expect, it, vi } from "vitest";

const rpcSpy = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: (...args: unknown[]) => rpcSpy(...args) },
}));

import {
  GROUP_REPORT_REASONS,
  GroupReportError,
  fetchGroupReportQueue,
  groupReportInputSchema,
  reviewGroupReport,
  submitGroupReport,
  toGroupReportError,
} from "@/lib/group-reports-api";
import { sliceBetween } from "@/test/source-slice";

const LANDING = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  rpcSpy.mockReset();
});

describe("G14 · sebepler politika §4 ile birebir", () => {
  it("7 kırmızı çizgi etiketi politika metninden (sıra = numara) + Diğer", () => {
    const policy = readFileSync("docs/dijital-gruplar/01_politika_v1.1.md", "utf8");
    const section = sliceBetween(policy, "## 4. Kırmızı çizgiler", "**2, 4 ve 6.", "politika §4");
    const items = [...section.matchAll(/^(\d)\. (.+?)\.?\s*$/gm)].map((match) => ({
      n: Number(match[1]),
      // İlk cümle (madde 7'nin ikinci cümlesi kapsam açıklamasıdır, sebep değil).
      text: match[2].split(". ")[0].replace(/\.$/, ""),
    }));

    expect(items).toHaveLength(7);
    const redlines = GROUP_REPORT_REASONS.filter((reason) => reason.redline !== null);
    expect(redlines.map((reason) => ({ n: reason.redline, text: reason.label }))).toEqual(items);
    expect(GROUP_REPORT_REASONS.at(-1)).toMatchObject({ key: "diger", redline: null, label: "Diğer (açıklama zorunlu)" });
  });
});

describe("G14 · hata çözümü (düz nesne)", () => {
  it("RPC'nin düz nesne hatası Türkçe mesaja + koda çevrilir", () => {
    const error = toGroupReportError({ message: "group_report_phone_required", code: "P0001" }, "yedek");

    expect(error).toBeInstanceOf(GroupReportError);
    expect(error.code).toBe("group_report_phone_required");
    expect(error.message).toBe("Şikayet için telefon doğrulaması gerekir.");
  });

  it("review'dan kabaran G15 kodları moderasyon haritasından çözülür", () => {
    expect(toGroupReportError({ message: "group_already_removed" }, "yedek").message).toContain("kaldırılmış");
  });

  it("bilinmeyen kod → yedek mesaj (ham kod kullanıcıya gösterilmez)", () => {
    expect(toGroupReportError({ message: "boom" }, "Şikayet gönderilemedi.").message).toBe("Şikayet gönderilemedi.");
  });
});

describe("G14 · gönderim", () => {
  it("diger + boş açıklama istemcide de reddedilir (RPC çağrılmaz)", async () => {
    expect(groupReportInputSchema.safeParse({ landingId: LANDING, reason: "diger", note: "  " }).success).toBe(false);
    await expect(submitGroupReport({ landingId: LANDING, reason: "diger" })).rejects.toMatchObject({
      code: "client_validation",
    });
    expect(rpcSpy).not.toHaveBeenCalled();
  });

  it("submit_group_report_v1'e p_* parametreleriyle gider; boş not null olur", async () => {
    rpcSpy.mockResolvedValue({ data: { report_id: "r1", group_hidden: false }, error: null });

    await submitGroupReport({ landingId: LANDING, reason: "hate_violence_adult", note: "" });

    expect(rpcSpy).toHaveBeenCalledWith("submit_group_report_v1", {
      p_landing_id: LANDING,
      p_reason: "hate_violence_adult",
      p_note: null,
    });
  });

  it("sunucu reddi (cooldown) GroupReportError olarak kabarır", async () => {
    rpcSpy.mockResolvedValue({ data: null, error: { message: "group_report_cooldown", code: "P0001" } });

    await expect(submitGroupReport({ landingId: LANDING, reason: "link_broken" })).rejects.toMatchObject({
      code: "group_report_cooldown",
    });
  });
});

describe("G14 · moderatör kapıları", () => {
  it("kuyruk admin_list_group_reports'tan, karar review_group_report_v1'den", async () => {
    rpcSpy.mockResolvedValueOnce({ data: [], error: null });
    await fetchGroupReportQueue();
    expect(rpcSpy).toHaveBeenLastCalledWith("admin_list_group_reports", {});

    rpcSpy.mockResolvedValueOnce({ data: { report_id: "r1" }, error: null });
    await reviewGroupReport("r1", "rejected", "  asilsiz ");
    expect(rpcSpy).toHaveBeenLastCalledWith("review_group_report_v1", {
      p_report_id: "r1",
      p_decision: "rejected",
      p_note: "asilsiz",
    });
  });
});
