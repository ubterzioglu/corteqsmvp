/**
 * M10 sözleşmesi — `feature_interest` migration + istemci aynası.
 *
 * Kilitler:
 *   1. **Kanıt satırı silinmez:** (feature_key,user_id) TEKİL + delete/update
 *      politikası YOK — ilgi birikimi "ücretli taraf ne zaman yapılacak"ın
 *      veri kaynağı; silinebilirse karar zemini kayar.
 *   2. **Beyaz liste iki yönü de kilitli:** migration'daki anahtar kümesi ile
 *      istemcideki FEATURE_INTEREST_KEYS birebir (M20 `pro.inbox` eklerken
 *      İKİSİ birden güncellenmek zorunda).
 *   3. **`interest_registrations` (lead formu) ile karıştırma** — o tabloya
 *      dokunulmaz.
 *   4. Yazma yalnız RPC'den (insert politikası YOK — beyaz liste ancak orada
 *      zorlanır), okuma kendi satırı.
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { FEATURE_INTEREST_KEYS, FEATURE_INTEREST_ERROR_MESSAGES } from "@/lib/feature-interest-api";
import { sliceBetween } from "@/test/source-slice";

const MIGRATION = "20261003040000_feature_interest.sql";
// M22: register_feature_interest GÜNCEL gövdesi burada (beyaz liste pro.inbox
// ile genişledi). Tablo DDL/politika/grant değişmedi — onlar M10 dosyasında.
const MIGRATION_V2 = "20261004110000_recommendation_match_notification.sql";

const readMigrationFile = (name: string) => {
  const candidates = [`supabase/migrations/applied/${name}`, `supabase/migrations/${name}`];
  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) throw new Error(`${name} bulunamadı (applied/ altında yaşamalı).`);
  return readFileSync(path, "utf8");
};

const migrationSql = () => readMigrationFile(MIGRATION);
const migrationV2Sql = () => readMigrationFile(MIGRATION_V2);

const stripComments = (sql: string) =>
  sql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

const code = () => stripComments(migrationSql());
const codeV2 = () => stripComments(migrationV2Sql());

const flat = () => code().replace(/\s+/g, " ");

// GÜNCEL RPC gövdesi M22 dosyasından dilimlenir (create or replace orada).
const rpc = () =>
  sliceBetween(
    codeV2(),
    "create or replace function public.register_feature_interest",
    "comment on function public.register_feature_interest",
    "register_feature_interest",
  );

describe("M10 · tablo — kanıt satırı korunur", () => {
  it("(feature_key,user_id) TEKİL + delete/update politikası YOK", () => {
    const sql = code();

    expect(sql).toContain("unique (feature_key, user_id)");
    expect(sql).toContain("create policy feature_interest_select_own");
    expect(sql).not.toMatch(/create policy[^;]*on public\.feature_interest[^;]*for (insert|update|delete)/i);
  });

  it("okuma kendi satırı + admin; anon tamamen kapalı", () => {
    const sql = code();

    expect(sql).toContain("using (user_id = auth.uid() or public.is_admin(auth.uid()))");
    expect(sql).toContain("revoke all on table public.feature_interest from anon");
  });

  it("interest_registrations (lead formu) DEĞİŞMEZ — ayrı tablo", () => {
    // Yorum/comment metninde uyarı olarak ADI geçebilir; DDL/DML dokunamaz.
    expect(code()).not.toMatch(/(alter table|insert into|update|create table|drop table)[^;]*interest_registrations/i);
  });
});

describe("M10 · beyaz liste İKİ YÖNLÜ birebir (migration ↔ istemci)", () => {
  const migrationKeys = () => {
    const match = rpc().match(/not in \(([^)]+)\)/);
    expect(match, "beyaz liste bulunamadı").not.toBeNull();
    return (match?.[1] ?? "")
      .split(",")
      .map((key) => key.trim().replace(/^'|'$/g, ""))
      .filter(Boolean)
      .sort();
  };

  it("istemci anahtarları migration'la aynı küme", () => {
    expect([...FEATURE_INTEREST_KEYS].sort()).toEqual(migrationKeys());
  });

  it("M22 genişletmesi BİLİNÇLİ yapıldı: TAM OLARAK üç anahtar var (pro.inbox eklendi)", () => {
    // M10 kilidi "iki anahtar" idi ve "M20/M22 pro.inbox eklerken İKİSİ birden
    // güncellenmek zorunda" diyordu — bu satır o bilinçli güncellemedir
    // (mig 20261004110000 + FEATURE_INTEREST_KEYS aynı batch'te).
    expect(migrationKeys()).toEqual(["event.featured", "event.ticketing", "pro.inbox"]);
  });

  it("bilinmeyen anahtar reddedilir + hata haritası kodları karşılar", () => {
    expect(rpc()).toContain("raise exception 'feature_interest_unknown_key'");
    expect(rpc()).toContain("raise exception 'feature_interest_auth_required'");
    for (const code of ["feature_interest_unknown_key", "feature_interest_auth_required"]) {
      expect(code in FEATURE_INTEREST_ERROR_MESSAGES, `haritada eksik: ${code}`).toBe(true);
    }
    const phantom = Object.keys(FEATURE_INTEREST_ERROR_MESSAGES).filter(
      (key) => !migrationSql().includes(`'${key}'`),
    );
    expect(phantom).toEqual([]);
  });
});

describe("M10 · RPC davranışı", () => {
  it("idempotent: aynı ilgi ikinci kez SAYILMAZ (already:true)", () => {
    const fn = rpc();

    // ⚠️ M4 mutasyon dersi (G21/G24/M02 ile aynı sınıf): metin kilidi yetmez,
    // KOŞUL da kilitlenir — `if false then` içine gömülü already dalları
    // bu metinleri taşımaya devam ediyordu.
    expect(fn).toContain("select true into v_existing");
    expect(fn).toContain("if v_existing then");
    expect(fn).toContain("'already', true");
    expect(fn).toContain("'already', false");
    expect(fn.indexOf("if v_existing then")).toBeLessThan(fn.indexOf("insert into public.feature_interest"));
  });

  it("grant yalnız authenticated (anon kayıt açamaz)", () => {
    expect(flat()).toContain(
      "grant execute on function public.register_feature_interest(text) to authenticated;",
    );
  });
});

describe("M10 · istemci — ödeme UI'ı YOK, ikincil yüzey çökmez", () => {
  const api = readFileSync("src/lib/feature-interest-api.ts", "utf8");

  it("fetchMyFeatureInterests hata FIRLATMAZ (boş liste — kart 'kayıtsız' görünür)", () => {
    const fn = sliceBetween(api, "export async function fetchMyFeatureInterests(", "\n}", "fetch");

    expect(fn).toContain("if (error) return [];");
    expect(fn).not.toContain("throw");
  });

  it("bileşen kilitli kart dilinde — fiyat/ödeme öğesi YOK", () => {
    const component = readFileSync("src/components/events/EventFeaturePromo.tsx", "utf8");
    // Başlık yorumları "fiyat/ödeme UYDURULMAZ" uyarısı İÇERİR — tarama
    // yorumlar atılınca yapılır (kural: KOD fiyat/ödeme öğesi taşımasın).
    const componentCode = component
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("//"))
      .join("\n");

    expect(componentCode).toContain("Ücretli yüzey yakında");
    expect(componentCode).not.toMatch(/fiyat|₺|\$\d|EUR \d|stripe/i);
    expect(componentCode).toContain("registerFeatureInterest(key)");
  });

  it("MyEventsPanel yalnız etkinliği olana çizer", () => {
    const panel = readFileSync("src/components/events/MyEventsPanel.tsx", "utf8");

    expect(panel).toContain("events.length > 0 && <EventFeaturePromo />");
  });
});
