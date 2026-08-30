import { describe, expect, it } from "vitest";

import { buildRelocationToolReportEmail } from "./relocation-tool-report.ts";

const PAYLOAD = {
  result_id: "11111111-2222-3333-4444-555555555555",
  tool_slug: "tasınma-hazirlik",
  tool_title: "Taşınma Hazırlık",
  total_score: 72.5,
  score_bucket: "ready",
  location_country: "Almanya",
  location_city: "Berlin",
};

describe("buildRelocationToolReportEmail", () => {
  it("snapshot konumunu, skoru ve sonuç bağlantısını üretir", () => {
    const email = buildRelocationToolReportEmail(PAYLOAD, "https://corteqs.net/");

    expect(email.subject).toBe("CorteQS araç raporu: Taşınma Hazırlık");
    expect(email.text).toContain("Konum: Berlin, Almanya");
    expect(email.text).toContain("Skor: 72.5");
    expect(email.html).toContain("/tools/tas%C4%B1nma-hazirlik/result/11111111-2222-3333-4444-555555555555");
  });

  it("payload metnini HTML olarak çalıştırmaz", () => {
    const email = buildRelocationToolReportEmail({
      ...PAYLOAD,
      tool_title: "<script>alert(1)</script>",
      location_city: "<img src=x onerror=1>",
    });

    expect(email.html).not.toContain("<script>");
    expect(email.html).not.toContain("<img src=x");
    expect(email.html).toContain("&lt;script&gt;");
  });

  it("eksik payload ile güvenli araçlar sayfasına düşer", () => {
    const email = buildRelocationToolReportEmail({});

    expect(email.html).toContain("https://corteqs.net/tools");
    expect(email.text).toContain("Konum: -, -");
  });
});
