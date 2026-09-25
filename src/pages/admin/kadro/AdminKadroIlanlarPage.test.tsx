import { describe, it, expect, beforeAll, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import AdminKadroIlanlarPage from "./AdminKadroIlanlarPage";
import { KADRO_ROLES } from "@/lib/kadro/roles";
import { KADRO_DEPTS } from "@/lib/kadro/kadro-taxonomy";

// Radix Select jsdom'da pointer capture ve scrollIntoView ister.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.releasePointerCapture = vi.fn();
});

const rolesWithAd = KADRO_ROLES.filter((r) => r.ad !== null);

function renderedTitles(): string[] {
  return screen.queryAllByRole("button", { name: /Kopyala/ }).map((btn) => btn.textContent ?? "");
}

function openDeptSelect() {
  const trigger = screen.getByRole("combobox");
  fireEvent.keyDown(trigger, { key: "Enter" });
  return screen.getByRole("listbox");
}

describe("AdminKadroIlanlarPage — departman filtresi", () => {
  it("kaynakta boş string değerli SelectItem yoktur (Radix hata fırlatır)", () => {
    const source = readFileSync(resolve(__dirname, "AdminKadroIlanlarPage.tsx"), "utf-8");
    expect(source).not.toMatch(/<SelectItem[^>]*value=""/);
  });

  it("render çökmez ve başlangıçta 'all' ile tüm ilanlar listelenir", () => {
    render(<AdminKadroIlanlarPage />);
    expect(rolesWithAd.length).toBeGreaterThan(0);
    expect(renderedTitles()).toHaveLength(rolesWithAd.length);
    expect(screen.getByRole("combobox")).toHaveTextContent("Tüm Departmanlar");
  });

  it("açılan listede 'Tüm Departmanlar' seçeneği render olur", () => {
    render(<AdminKadroIlanlarPage />);
    const listbox = openDeptSelect();
    expect(within(listbox).getByRole("option", { name: "Tüm Departmanlar" })).toBeInTheDocument();
  });

  it("departman seçip tekrar 'Tüm Departmanlar'a dönünce tüm ilanlar geri gelir", () => {
    const dept = KADRO_DEPTS.find((d) => rolesWithAd.some((r) => r.dept === d.id));
    expect(dept).toBeDefined();
    const expectedInDept = rolesWithAd.filter((r) => r.dept === dept!.id).length;

    render(<AdminKadroIlanlarPage />);

    fireEvent.click(within(openDeptSelect()).getByRole("option", { name: dept!.name }));
    expect(renderedTitles()).toHaveLength(expectedInDept);

    fireEvent.click(within(openDeptSelect()).getByRole("option", { name: "Tüm Departmanlar" }));
    expect(renderedTitles()).toHaveLength(rolesWithAd.length);
  });
});
