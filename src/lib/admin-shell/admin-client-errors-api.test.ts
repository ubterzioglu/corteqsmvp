import { describe, expect, it } from "vitest";

import {
  filterClientErrorReports,
  type ClientErrorReportRow,
} from "@/lib/admin-shell/admin-client-errors-api";

function row(overrides: Partial<ClientErrorReportRow> = {}): ClientErrorReportRow {
  return {
    id: overrides.id ?? "r-1",
    user_id: "u-1",
    source: "cadde_write",
    context: "createCaddeComment",
    message: "cadde_rate_limited",
    error_code: "P0001",
    details: null,
    hint: null,
    route: "/cadde",
    user_agent: null,
    component_stack: null,
    extra: null,
    created_at: "2026-09-04T20:00:00Z",
    ...overrides,
  };
}

describe("filterClientErrorReports", () => {
  const reports = [
    row({ id: "a" }),
    row({ id: "b", source: "render", context: "AppErrorBoundary", message: "Cannot read properties of undefined", error_code: null, route: "/cadde/cafe/x" }),
    row({ id: "c", source: "cadde_read", context: "listCaddeFeed", message: "permission denied", error_code: "42501" }),
  ];

  it("varsayılan olarak hepsini döner", () => {
    expect(filterClientErrorReports(reports)).toHaveLength(3);
  });

  it("kaynağa göre süzer", () => {
    expect(filterClientErrorReports(reports, { source: "render" }).map((entry) => entry.id)).toEqual(["b"]);
    expect(filterClientErrorReports(reports, { source: "all" })).toHaveLength(3);
  });

  it("bağlam, mesaj, kod ve rotada Türkçe aksan-toleranslı arar", () => {
    expect(filterClientErrorReports(reports, { search: "42501" }).map((entry) => entry.id)).toEqual(["c"]);
    expect(filterClientErrorReports(reports, { search: "cafe" }).map((entry) => entry.id)).toEqual(["b"]);
    expect(filterClientErrorReports(reports, { search: "YORUM" })).toHaveLength(0);
    expect(filterClientErrorReports(reports, { search: "createcaddecomment" }).map((entry) => entry.id)).toEqual(["a"]);
  });

  it("kaynak ve arama birleşir", () => {
    expect(
      filterClientErrorReports(reports, { source: "cadde_write", search: "permission" }),
    ).toHaveLength(0);
    expect(
      filterClientErrorReports(reports, { source: "cadde_read", search: "permission" }).map((entry) => entry.id),
    ).toEqual(["c"]);
  });
});
