/**
 * G14b sözleşmesi — şikayet karar süresi (15 gün).
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. **Karar süresinin değişmesi.** groups.report_decision_deadline_days
 *      migration'da kilitli; kodda sabit varsayılan 15. Ayar değişirse
 *      moderatör SLA'si sessizce bozulur.
 *   2. **Fonksiyonun kaldırılması.** group_reports_expire_unreviewed()
 *      pg_cron job tarafından çağrılır; fonksiyon düşerse cron job hata verir.
 *   3. **Cron job'un kaldırılması.** group_report_decision_deadline job'ı
 *      migration'da tanımlanır; silinirse 15 gün kontrolü durur.
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const MIGRATION = "20261007090000_report_decision_deadline.sql";

const migrationSql = () => {
  const candidates = [`supabase/migrations/applied/${MIGRATION}`, `supabase/migrations/${MIGRATION}`];
  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) throw new Error(`${MIGRATION} bulunamadı (applied/ altında yaşamalı).`);
  return readFileSync(path, "utf8");
};

const code = () =>
  migrationSql()
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

const flat = () => code().replace(/\s+/g, " ");

describe("G14b · salt ekleme güvencesi", () => {
  it("hiçbir kolon/tablo DÜŞÜRÜLMEZ", () => {
    const sql = code();

    expect(sql).not.toMatch(/drop\s+column/i);
    expect(sql).not.toMatch(/drop\s+table/i);
  });
});

describe("G14b · karar süresi ayarı", () => {
  it("groups.report_decision_deadline_days = 15 seed edilir", () => {
    const sql = flat();

    expect(sql).toContain("'groups.report_decision_deadline_days', '15'::jsonb");
  });
});

describe("G14b · group_reports_expire_unreviewed fonksiyonu", () => {
  const fn = () =>
    code().includes("create or replace function public.group_reports_expire_unreviewed")
      ? code().split("create or replace function public.group_reports_expire_unreviewed")[1]
      : "";

  it("fonksiyon tanımlı", () => {
    expect(fn()).not.toBe("");
  });

  it("15 günü geçmiş açık şikayetleri bulur", () => {
    expect(fn()).toContain("r.status = 'open'");
    expect(fn()).toContain("r.created_at < now() - make_interval(days => v_deadline_days)");
  });

  it("grupları suspended yapar (set_group_status_v1)", () => {
    expect(fn()).toContain("public.set_group_status_v1(");
    expect(fn()).toContain("'suspended'");
    expect(fn()).toContain("'reports_deadline'");
  });

  it("şikayetleri rejected yapar", () => {
    expect(fn()).toContain("status = 'rejected'");
    expect(fn()).toContain("Karar süresi doldu");
  });

  it("yetki: service_role (pg_cron)", () => {
    expect(flat()).toContain(
      "grant execute on function public.group_reports_expire_unreviewed() to service_role;",
    );
  });
});

describe("G14b · pg_cron job", () => {
  it("group_report_decision_deadline job'ı tanımlı", () => {
    const sql = flat();

    expect(sql).toContain("cron.schedule('group_report_decision_deadline'");
    expect(sql).toContain("'47 4 * * *'"); // günlük 04:47 UTC
    expect(sql).toContain("select public.group_reports_expire_unreviewed()");
  });
});
