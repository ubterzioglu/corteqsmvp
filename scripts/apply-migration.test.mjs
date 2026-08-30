import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildTransactionalSql,
  connectionLabel,
  findForbiddenSql,
  isDryRunRequested,
  parseMigrationFileName,
  validatePendingMigrationPath,
} from "./apply-migration.mjs";

describe("isDryRunRequested", () => {
  it("doğrudan script bayrağını tanır", () => {
    expect(isDryRunRequested(["--dry-run"], {})).toBe(true);
  });

  it("npm'in yuttuğu --dry-run bayrağını npm_config_dry_run üzerinden tanır", () => {
    expect(isDryRunRequested([], { npm_config_dry_run: "true" })).toBe(true);
  });
});

describe("parseMigrationFileName", () => {
  it("14 haneli sürüm ve snake_case adı ayıklar", () => {
    expect(parseMigrationFileName("20260831120000_vip_invitations.sql")).toEqual({
      version: "20260831120000",
      name: "vip_invitations",
    });
  });

  it.each([
    "20260831_bad.sql",
    "20260831120000-Bad.sql",
    "20260831120000_Büyük.sql",
    "20260831120000_.sql",
    "20260831120000_bad.txt",
  ])("yanlış migration adını reddeder: %s", (fileName) => {
    expect(() => parseMigrationFileName(fileName)).toThrow(/dosya adı/i);
  });
});

describe("findForbiddenSql", () => {
  it.each(["BEGIN;", " commit ;", "START TRANSACTION;", "ROLLBACK;"])(
    "transaction komutunu yakalar: %s",
    (sql) => expect(findForbiddenSql(`select 1;\n${sql}\nselect 2;`)).toMatch(/transaction/i),
  );

  it("psql meta komutunu reddeder", () => {
    expect(findForbiddenSql("select 1;\n\\i secrets.sql")).toMatch(/psql/i);
  });

  it("PL/pgSQL begin bloğunu transaction komutu sanmaz", () => {
    const sql = "create function x() returns void language plpgsql as $$\nbegin\n  perform 1;\nend;\n$$;";
    expect(findForbiddenSql(sql)).toBeNull();
  });
});

describe("validatePendingMigrationPath", () => {
  const root = path.resolve("C:/repo");

  it("yalnız supabase/migrations parent dizinindeki yeni dosyayı kabul eder", () => {
    expect(
      validatePendingMigrationPath(
        path.join(root, "supabase/migrations/20260831120000_vip_invitations.sql"),
        root,
      ),
    ).toMatchObject({ version: "20260831120000", name: "vip_invitations" });
  });

  it("applied altındaki geçmiş dosyayı yeniden çalıştırmayı reddeder", () => {
    expect(() =>
      validatePendingMigrationPath(
        path.join(root, "supabase/migrations/applied/20260831120000_vip_invitations.sql"),
        root,
      ),
    ).toThrow(/parent/i);
  });
});

describe("buildTransactionalSql", () => {
  it("migration ve ledger insertini tek transaction içinde üretir", () => {
    const sql = buildTransactionalSql({
      version: "20260831120000",
      name: "vip_invitations",
      body: "create table public.example(id bigint);",
    });

    expect(sql).toMatch(/^begin;/);
    expect(sql).toContain("create table public.example");
    expect(sql).toContain("insert into supabase_migrations.schema_migrations");
    expect(sql).toContain("'20260831120000'");
    expect(sql).toContain("'vip_invitations'");
    expect(sql.trim()).toMatch(/commit;$/);
  });
});

describe("connectionLabel", () => {
  it("parola veya URI üretmeden güvenli hedef etiketi döndürür", () => {
    const label = connectionLabel({ host: "pooler.test", port: "5432", user: "postgres.ref" });
    expect(label).toBe("postgres.ref@pooler.test:5432/postgres");
    expect(label).not.toMatch(/password|secret|:\/\//i);
  });
});
