// admin-todos sözleşme testleri — kart çizimi ve buton hedefleri bu değişmezlere dayanır.
import { describe, expect, it } from "vitest";

import { ADMIN_TODOS } from "@/lib/admin-shell/admin-todos";
import { ADMIN_ROUTE_PATTERNS } from "@/lib/admin-shell/admin-route-meta";

describe("ADMIN_TODOS", () => {
  it("id'ler benzersiz ve YYYYMMDD-slug biçiminde", () => {
    const ids = ADMIN_TODOS.map((todo) => todo.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^\d{8}-[a-z0-9-]+$/);
  });

  it("her madde başlık + açıklama + en az bir aksiyon taşır", () => {
    for (const todo of ADMIN_TODOS) {
      expect(todo.title.trim().length).toBeGreaterThan(0);
      expect(todo.description.trim().length).toBeGreaterThan(0);
      expect(todo.actions.length).toBeGreaterThan(0);
    }
  });

  it("aksiyonlar to XOR href taşır; to '/' ile başlar", () => {
    for (const todo of ADMIN_TODOS) {
      for (const action of todo.actions) {
        expect(Boolean(action.to) !== Boolean(action.href)).toBe(true);
        if (action.to) expect(action.to.startsWith("/")).toBe(true);
      }
    }
  });

  it("admin içi rotalar ADMIN_ROUTE_PATTERNS'ta gerçekten var", () => {
    // /admin/* hedefi kayıtlı bir rota olmalı — kırık buton bir daha yaşanmasın (B21 dersi).
    for (const todo of ADMIN_TODOS) {
      for (const action of todo.actions) {
        if (action.to?.startsWith("/admin/")) {
          expect(ADMIN_ROUTE_PATTERNS, `bilinmeyen admin rotası: ${action.to}`).toContain(action.to);
        }
      }
    }
  });

  it("tamamlanmış migration runner işini açık iş olarak göstermiyor", () => {
    expect(ADMIN_TODOS.map((todo) => todo.id)).not.toContain(
      "20260805-migration-surum-kaydi-unutuluyor",
    );
  });
});
