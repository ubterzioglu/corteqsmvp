/**
 * G18 birim testleri — S1 formunun saf mantığı (`group-submit.ts`).
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. **Platform türetmenin gevşemesi.** Tasarım §3.A adım 2: başka alan adı
 *      REDDEDİLİR. Desen şema-çıpalı değilse `evil.com/?x=chat.whatsapp.com/…`
 *      WhatsApp diye geçer (G06/N06 link dersi: çıplak substring aramak yetmez).
 *   2. **Kategori listesinin kayması.** Politika §5'teki 7 anahtar + "Diğer
 *      YOK" kuralı; Aile & Çocuk G06'ya dek kilitli (kabul #10'un bugünkü hâli).
 *   3. **Grup Sözü'nün yeniden yazılması.** Politika §10 metni BİREBİR
 *      gösterilir — kısaltma/özet hukuki metni değiştirir (kaynak dosyaya karşı
 *      kilitli).
 *   4. **Hata haritasının eksilmesi.** RPC'nin fırlattığı bir kod haritada
 *      yoksa kullanıcı ham `group_submit_…` metni görür (KR03 çift yönlü harita
 *      dersi): migration'daki HER raise kodu haritada olmalı.
 */
import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  GROUP_PLEDGE_TEXT,
  GROUP_SUBMIT_ERROR_MESSAGES,
  MOTOR_CATEGORIES,
  detectMotorPlatform,
} from "@/lib/group-submit";

const POLICY = "docs/dijital-gruplar/01_politika_v1.1.md";
const MIGRATION_CANDIDATES = [
  "supabase/migrations/applied/20261002080000_group_submit.sql",
  "supabase/migrations/20261002080000_group_submit.sql",
];

describe("detectMotorPlatform — tasarım §3.A adım 2 (başka alan adı reddedilir)", () => {
  it("üç desteklenen platformu tanır", () => {
    expect(detectMotorPlatform("https://chat.whatsapp.com/ABC123")).toBe("whatsapp");
    expect(detectMotorPlatform("https://t.me/pyhtontr")).toBe("telegram");
    expect(detectMotorPlatform("https://telegram.me/pyhtontr")).toBe("telegram");
    expect(detectMotorPlatform("https://discord.gg/abc123")).toBe("discord");
    expect(detectMotorPlatform("https://discord.com/invite/abc123")).toBe("discord");
  });

  it("desen ŞEMA-ÇIPALI: query/path içine gömülü desteklenen alan adı geçmez", () => {
    // N06 dersi: `//evil.com` ve gömülü hedefler düz substring filtresinden sızar.
    expect(detectMotorPlatform("https://evil.com/?x=https://chat.whatsapp.com/ABC")).toBeNull();
    expect(detectMotorPlatform("https://evil.com/redirect?t.me/joinchat")).toBeNull();
    expect(detectMotorPlatform("https://notchat.whatsapp.com.evil.com/ABC")).toBeNull();
  });

  it("desteklenmeyen platformlar ve bozuk linkler reddedilir", () => {
    expect(detectMotorPlatform("https://facebook.com/groups/123")).toBeNull();
    expect(detectMotorPlatform("https://instagram.com/x")).toBeNull();
    expect(detectMotorPlatform("javascript:alert(1)")).toBeNull();
    expect(detectMotorPlatform("")).toBeNull();
    expect(detectMotorPlatform("chat.whatsapp.com/ABC")).toBeNull(); // şema şart
  });

  it("büyük/küçük harf ve boşluk toleranslı", () => {
    expect(detectMotorPlatform("  HTTPS://Chat.WhatsApp.com/ABC  ")).toBe("whatsapp");
    expect(detectMotorPlatform("https://T.ME/abc")).toBe("telegram");
  });
});

describe("MOTOR_CATEGORIES — politika §5 birebir", () => {
  it("7 kategori, doğru anahtar + etiket, sırada", () => {
    expect(MOTOR_CATEGORIES).toEqual([
      { value: "sehir-yasam", label: "Şehir & Yaşam" },
      { value: "meslek-kariyer", label: "Meslek & Kariyer" },
      { value: "is-girisim", label: "İş & Girişim" },
      { value: "alumni-akademik", label: "Alumni & Akademik" },
      { value: "dayanisma-yardim", label: "Dayanışma & Yardım" },
      { value: "aile-cocuk", label: "Aile & Çocuk", locked: true },
      { value: "hobi-kultur", label: "Hobi & Kültür" },
    ]);
  });

  it('"Diğer" kategorisi YOK (politika §5: "Diğer kategorisi yoktur")', () => {
    // `as const` daraltması yüzünden geniş tip üzerinden karşılaştırılır —
    // iddia listenin GERÇEK içeriğinedir, tipine değil.
    const values: readonly string[] = MOTOR_CATEGORIES.map((c) => c.value);
    const labels: readonly string[] = MOTOR_CATEGORIES.map((c) => c.label);

    expect(values.includes("diger")).toBe(false);
    expect(labels.includes("Diğer")).toBe(false);
  });

  it("Aile & Çocuk G06/K09'a kadar kilitli (kabul #10'un bugünkü hâli)", () => {
    const aile = MOTOR_CATEGORIES.find((c) => c.value === "aile-cocuk");
    expect(aile && "locked" in aile && aile.locked).toBe(true);
  });
});

describe("GROUP_PLEDGE_TEXT — politika §10 birebir", () => {
  it("metin kaynak dosyadakiyle AYNI (kısaltma/yeniden yazım yok)", () => {
    const policy = readFileSync(POLICY, "utf8");
    // §10 başlık satırının TAMAMI atılır (başlıkta "(sitede ve formda
    // gösterilir)" notu var — gövdeye sızmasın), sonraki `---`'a dek alınır.
    const section = policy.split(/## 10\. Grup Sözü[^\n]*\n/)[1]?.split("---")[0] ?? "";
    const expected = section
      .split("\n")
      .filter((line) => line.trim() && !line.trim().startsWith("##"))
      // Politika metni blok-alıntı (`> `) içinde — biçim işareti metne dahil değil.
      .map((line) => line.replace(/^\s*>\s?/, ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    expect(expected.length).toBeGreaterThan(100); // bölüm gerçekten bulundu
    expect(GROUP_PLEDGE_TEXT.replace(/\s+/g, " ").trim()).toBe(expected);
  });
});

describe("GROUP_SUBMIT_ERROR_MESSAGES — çift yönlü harita (KR03 dersi)", () => {
  const migrationSql = () => {
    const path = MIGRATION_CANDIDATES.find((candidate) => existsSync(candidate));
    if (!path) throw new Error("20261002080000_group_submit.sql bulunamadı");
    return readFileSync(path, "utf8");
  };

  it("migration'daki HER raise kodu haritada Türkçeleşiyor", () => {
    const codes = new Set<string>();
    for (const match of migrationSql().matchAll(/raise exception '(group_[a-z0-9_]+)'/g)) {
      codes.add(match[1]);
    }
    // G15'ten devralınan yasak kodu da kullanıcıya çevrilmeli
    codes.add("group_submission_banned");

    const missing = [...codes].filter((code) => !(code in GROUP_SUBMIT_ERROR_MESSAGES));
    expect(missing).toEqual([]);
  });

  it("haritada migration'da OLMAYAN hayali kod yok", () => {
    const codes = new Set<string>();
    for (const match of migrationSql().matchAll(/raise exception '(group_[a-z0-9_]+)'/g)) {
      codes.add(match[1]);
    }
    codes.add("group_submission_banned");

    const phantom = Object.keys(GROUP_SUBMIT_ERROR_MESSAGES).filter((code) => !codes.has(code));
    expect(phantom).toEqual([]);
  });
});
