import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { ReportDeliveryCard } from "@/components/relocation/tools/ReportDeliveryCard";
import { requestRelocationToolReport } from "@/lib/relocation-tools-api";
import { reportErrorMessage } from "@/lib/relocation-tool-report-errors";
import type { RelocationToolResultPayload } from "@/lib/relocation-tools-types";

vi.mock("@/lib/relocation-tools-api", () => ({
  requestRelocationToolReport: vi.fn(),
}));

const requestMock = vi.mocked(requestRelocationToolReport);
const RESULT = {
  result_id: "11111111-2222-3333-4444-555555555555",
  location_snapshot: { country: "Almanya", city: "Berlin", source: "approved_attributes" },
} as RelocationToolResultPayload;

describe("ReportDeliveryCard", () => {
  beforeEach(() => requestMock.mockReset());

  it("DB isteği pending döndüğünde butonu kilitler", async () => {
    requestMock.mockResolvedValue({
      result_id: RESULT.result_id,
      status: "pending",
      location_country: "Almanya",
      location_city: "Berlin",
    });
    render(<MemoryRouter><ReportDeliveryCard result={RESULT} /></MemoryRouter>);

    fireEvent.click(screen.getByRole("button", { name: "Raporu gönder" }));

    await waitFor(() => expect(requestMock).toHaveBeenCalledWith(RESULT.result_id));
    expect(screen.getByRole("button", { name: "Rapor gönderim kuyruğunda" })).toBeDisabled();
  });

  it("server kapılarını anlaşılır hata metinlerine çevirir", () => {
    expect(reportErrorMessage(new Error("rl_report_location_required"))).toBe(
      "Rapor için profilde ülke ve şehir bilgisi gerekli.",
    );
    expect(reportErrorMessage(new Error("rl_report_verified_email_required"))).toBe(
      "Rapor için doğrulanmış bir e-posta adresi gerekli.",
    );
    expect(reportErrorMessage(new Error("rl_report_rate_limited"))).toBe(
      "24 saatlik rapor gönderim sınırına ulaştın.",
    );
  });
});
