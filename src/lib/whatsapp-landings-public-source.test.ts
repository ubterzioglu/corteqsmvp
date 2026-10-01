// G03b sözleşmesi — halka açık okuma `whatsapp_landings` TABLOSUNDAN yapılmaz.
//
// Dizin (`listLandings`) ve detay (`getLanding`) artık `whatsapp_landings_public`
// view'ından okur. View `whatsapp_link` · `admin_contact` · `user_id` ·
// `rejection_reason` alanlarını `null` döner (migration `20261001110000`).
//
// ⚠️ Biri bu iki çağrıyı tabana geri çevirirse **hiçbir test kırılmaz ve hiçbir
// hata görünmez** — sayfa çalışmaya devam eder, yalnız davet linki ve grup
// yöneticilerinin adı/e-postası/telefonu yeniden anonime açılır. Sessiz
// gerileme sınıfı tam olarak budur; bu test onu kapatır.
//
// Yönetici ve sahip yolları KAPSAM DIŞIDIR — onların `rejection_reason` ve
// `admin_contact` alanlarına ihtiyacı var, tabandan/RPC'den okumaya devam ederler.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { sliceBetween } from "@/test/source-slice";
import {
  LANDING_INVITE_FAILURE_MESSAGES,
  type LandingInviteFailure,
} from "@/lib/whatsapp-landings";

const source = readFileSync(
  resolve(__dirname, "../..", "src/lib/whatsapp-landings.ts"),
  "utf8",
);

describe("G03b · halka açık okuma yüzeyi", () => {
  it("getLanding view'dan okur, tabandan DEĞİL", () => {
    const body = sliceBetween(source, "export async function getLanding(", "\n}", "getLanding gövdesi");
    expect(body).toContain("PUBLIC_LANDINGS_SOURCE");
    expect(body).not.toMatch(/\.from\(\s*["']whatsapp_landings["']\s*\)/);
  });

  it("listLandings view'dan okur, tabandan DEĞİL", () => {
    // ⚠️ Bitiş çıpası "export async function" OLAMAZ — başlangıç çıpasının
    // kendisiyle eşleşir ve dilim boş gelir (sliceBetween bunu açıkça düşürür).
    const body = sliceBetween(
      source,
      "export async function listLandings(",
      "rowToLanding(row as WhatsAppLandingRow)",
      "listLandings gövdesi",
    );
    expect(body).toContain("PUBLIC_LANDINGS_SOURCE");
    expect(body).not.toMatch(/\.from\(\s*["']whatsapp_landings["']\s*\)/);
  });

  it("PUBLIC_LANDINGS_SOURCE view adını gösterir", () => {
    expect(source).toContain('const PUBLIC_LANDINGS_SOURCE = "whatsapp_landings_public" as const;');
  });
});

describe("G03b · davet linki RPC sarmalayıcısı", () => {
  const body = sliceBetween(
    source,
    "export async function fetchLandingInviteUrl(",
    "\n}",
    "fetchLandingInviteUrl gövdesi",
  );

  it("RPC'yi çağırır, tabloya sormaz", () => {
    expect(body).toContain('supabase.rpc("get_whatsapp_landing_invite"');
    expect(body).not.toContain(".from(");
  });

  it("42501 ve P0002 hatalarını AYIRT eder", () => {
    // İkisini tek mesaja indirmek, kullanıcıya giriş yapması gerektiğini
    // söylemeyen bir düğme üretir.
    expect(body).toContain('code === "42501"');
    expect(body).toContain('code === "P0002"');
    expect(body).toContain("auth_required");
    expect(body).toContain("no_link");
  });

  it("⚠️ RPC hatasını `instanceof Error` ile DARALTMAZ", () => {
    // supabase-js RPC hataları düz nesnedir; daraltma `code`'u okunamaz yapar
    // ve kullanıcıya `[object Object]` gösterir (bu repoda canlıda yaşandı).
    expect(body).not.toContain("instanceof Error");
  });

  it("boş string'i geçerli link saymaz", () => {
    expect(body).toContain("data.trim()");
  });

  it("her hata türünün Türkçe bir karşılığı vardır", () => {
    const failures: LandingInviteFailure[] = ["auth_required", "no_link", "unknown"];
    for (const failure of failures) {
      expect(LANDING_INVITE_FAILURE_MESSAGES[failure]?.trim()).toBeTruthy();
    }
  });
});
