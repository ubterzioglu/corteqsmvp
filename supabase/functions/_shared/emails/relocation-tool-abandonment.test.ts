import { describe, expect, it } from "vitest";

import { buildRelocationToolAbandonmentEmail } from "./relocation-tool-abandonment.ts";

describe("buildRelocationToolAbandonmentEmail", () => {
  it("devam ve opt-out bağlantılarını ilerlemeyle birlikte üretir", () => {
    const email = buildRelocationToolAbandonmentEmail({
      session_id: "11111111-2222-3333-4444-555555555555",
      tool_slug: "tasinma-hazirlik-skoru",
      tool_title: "Taşınma Hazırlık",
      answered_count: 7,
      question_count: 20,
    });

    expect(email.text).toContain("İlerleme: 7/20 soru");
    expect(email.html).toContain("/tools/tasinma-hazirlik-skoru/session/11111111-2222-3333-4444-555555555555");
    expect(email.text).toContain("/settings/notifications");
  });

  it("serbest metni HTML olarak çalıştırmaz", () => {
    const email = buildRelocationToolAbandonmentEmail({ tool_title: "<script>alert(1)</script>" });
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
  });

  it("eksik oturumda araçlar sayfasına güvenli düşer", () => {
    expect(buildRelocationToolAbandonmentEmail({}).text).toContain("https://corteqs.net/tools");
  });
});
