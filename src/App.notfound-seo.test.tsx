// 404 (soft-404) SEO davranışı.
//
// SPA gerçek HTTP 404 döndüremez: nginx olmayan yolu da 200 + index.html olarak
// servis eder. 2026-08-04 denetiminde canlıda /bu-sayfa-yok-12345 → 200 dönüyordu
// ve NotFound hiçbir robots meta'sı yazmadığı için index.html'in global
// "index, follow" değeri geçerli kalıyordu — yani uydurma her URL indekslenebilir
// görünüyordu. Bu test o regresyonu kilitler.

import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";

import NotFound from "@/pages/NotFound";

function robotsContent(): string | null {
  return document.head.querySelector('meta[name="robots"]')?.getAttribute("content") ?? null;
}

beforeEach(() => {
  document.head.innerHTML = "";
});

describe("NotFound SEO", () => {
  it("robots meta'sını noindex olarak yazar", async () => {
    render(
      <MemoryRouter initialEntries={["/bu-sayfa-yok-12345"]}>
        <NotFound />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(robotsContent()).toBe("noindex, follow");
    });
  });

  it("follow bırakır — sayfadaki iç bağlantılar taranmaya devam etsin", async () => {
    render(
      <MemoryRouter initialEntries={["/yok"]}>
        <NotFound />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(robotsContent()).toContain("follow");
    });
    expect(robotsContent()).not.toContain("nofollow");
  });

  it("index.html'in global robots değeri hâlâ index, follow — override sayfa seviyesinde olmalı", () => {
    // Global değer değişirse tüm site noindex olur; bu testin amacı o kazayı yakalamak.
    const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

    expect(html).toMatch(/<meta\s+name="robots"\s+content="index,\s*follow"\s*\/?>/);
  });
});

describe("App route tablosu", () => {
  it("catch-all route NotFound'a bağlıdır", () => {
    const appSource = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");

    expect(appSource).toMatch(/path="\*"\s+element=\{<NotFound\s*\/>\}/);
  });
});
