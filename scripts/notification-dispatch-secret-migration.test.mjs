import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationPath = path.join(
  projectRoot,
  "supabase/migrations/applied/20260907103000_move_notification_dispatch_secret_to_vault.sql",
);

describe("notification dispatch secret storage", () => {
  it("moves the DB-side dispatch secret to Vault and removes the plaintext setting", async () => {
    const sql = await readFile(migrationPath, "utf8");

    expect(sql).toContain("vault.decrypted_secrets");
    expect(sql).toContain("name = 'notification_dispatch_secret'");
    expect(sql).toContain("delete from public.notification_settings");
    expect(sql).toContain("key = 'dispatch.secret'");
    const functionStart = sql.indexOf("create or replace function");
    const functionEnd = sql.indexOf("\n$$;", functionStart);
    const dispatcherFunction = sql.slice(functionStart, functionEnd);
    expect(dispatcherFunction).not.toMatch(
      /select\s+value\s+#>>\s+'\{\}'[\s\S]*key\s*=\s*'dispatch\.secret'/i,
    );
  });

  it("keeps future setup runs from restoring the plaintext DB row", async () => {
    const [setupScript, configSql] = await Promise.all([
      readFile(path.join(projectRoot, "scripts/setup-notification-dispatch.ps1"), "utf8"),
      readFile(
        path.join(projectRoot, "supabase/manual/2026-07-29_notification_dispatch_config.sql"),
        "utf8",
      ),
    ]);

    expect(setupScript).toContain("notification_dispatch_secret");
    expect(configSql).toContain("vault.create_secret");
    expect(configSql).toContain("vault.update_secret");
    expect(configSql).not.toMatch(/\('dispatch\.secret',\s*to_jsonb/i);
  });
});
