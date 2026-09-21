import { describe, expect, it } from "vitest";
import { buildKadroCsv } from "./kadro-csv";
import { KADRO_ROLES } from "./roles";
import { resolveKadroRoles } from "./kadro-view";

describe("buildKadroCsv", () => {
  it("doğru başlıkları içerir", () => {
    const resolved = resolveKadroRoles(KADRO_ROLES, []);
    const csv = buildKadroCsv(resolved);
    const lines = csv.split("\n");

    expect(lines[0]).toBe(
      "Rol ID,Pozisyon,Departman,Eksen,Çalışma Tipi,Dalga,Durum,Öncelik,Sahip,Rapor Yöneticisi,KPI'lar,Not"
    );
  });

  it("tüm rolleri içerir", () => {
    const resolved = resolveKadroRoles(KADRO_ROLES, []);
    const csv = buildKadroCsv(resolved);
    const lines = csv.split("\n");

    expect(lines.length).toBe(53);
  });

  it("Türkçe karakterler korunur", () => {
    const resolved = resolveKadroRoles(KADRO_ROLES, []);
    const csv = buildKadroCsv(resolved);

    expect(csv).toContain("Çalışma Tipi");
    expect(csv).toContain("Öncelik");
    expect(csv).toContain("Departman");
  });

  it("virgül içeren alanları doğru escape eder", () => {
    const resolved = resolveKadroRoles(KADRO_ROLES, []);
    const modified = resolved.map((r) => ({
      ...r,
      note: "Bu bir not, virgül içeriyor",
    }));
    const csv = buildKadroCsv(modified);

    expect(csv).toContain('"Bu bir not, virgül içeriyor"');
  });

  it("tırnak içeren alanları doğru escape eder", () => {
    const resolved = resolveKadroRoles(KADRO_ROLES, []);
    const modified = resolved.map((r) => ({
      ...r,
      note: 'Bu bir "tırnak" içeriyor',
    }));
    const csv = buildKadroCsv(modified);

    expect(csv).toContain('"Bu bir ""tırnak"" içeriyor"');
  });

  it("yeni satır içeren alanları doğru escape eder", () => {
    const resolved = resolveKadroRoles(KADRO_ROLES, []);
    const modified = resolved.map((r) => ({
      ...r,
      note: "Satır 1\nSatır 2",
    }));
    const csv = buildKadroCsv(modified);

    expect(csv).toContain('"Satır 1\nSatır 2"');
  });

  it("KPI'ları yarı virgülle ayırır", () => {
    const resolved = resolveKadroRoles(KADRO_ROLES, []);
    const cmo = resolved.find((r) => r.id === "ld-cmo")!;
    const csv = buildKadroCsv([cmo]);

    expect(csv).toContain(cmo.kpi.join("; "));
  });

  it("departman adını Türkçe gösterir", () => {
    const resolved = resolveKadroRoles(KADRO_ROLES, []);
    const csv = buildKadroCsv(resolved);

    expect(csv).toContain("Kuruluş & Liderlik");
    expect(csv).toContain("Pazarlama & Büyüme");
  });

  it("eksen adını Türkçe gösterir", () => {
    const resolved = resolveKadroRoles(KADRO_ROLES, []);
    const csv = buildKadroCsv(resolved);

    expect(csv).toContain("Merkez");
    expect(csv).toContain("Ürün hattı");
    expect(csv).toContain("İşlev hattı");
  });

  it("durum etiketini Türkçe gösterir", () => {
    const resolved = resolveKadroRoles(KADRO_ROLES, []);
    const csv = buildKadroCsv(resolved);

    expect(csv).toContain("Dolu");
    expect(csv).toContain("Açık");
  });

  it("öncelik etiketini Türkçe gösterir", () => {
    const resolved = resolveKadroRoles(KADRO_ROLES, []);
    const csv = buildKadroCsv(resolved);

    expect(csv).toContain("Kritik");
    expect(csv).toContain("Yüksek");
    expect(csv).toContain("Orta");
  });

  it("boş alanları doğru işler", () => {
    const resolved = resolveKadroRoles(KADRO_ROLES, []);
    const modified = resolved.map((r) => ({
      ...r,
      currentOwner: "",
      note: "",
    }));
    const csv = buildKadroCsv(modified);

    const lines = csv.split("\n");
    const firstRow = lines[1].split(",");
    expect(firstRow[8]).toBe("");
    expect(firstRow[11]).toBe("");
  });
});
