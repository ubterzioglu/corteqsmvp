/**
 * G10 sözleşmesi — `whatsapp_landings` grup şeması.
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. **Eski kolonların erkenden düşürülmesi.** `status` · `member_approved` ·
 *      `admin_approved` repoda 9 dosyada kullanılıyor ve CANLI PAKET hâlâ eski
 *      koddur; düşürmek siteyi kırar. Migration salt ekleme olmalı.
 *   2. Durum/sahiplik değerlerinin pakette olmayan adlarla uydurulması.
 *   3. Davet kodunun link yerine ham URL'den tekilleştirilmesi — aynı grup
 *      farklı yazımlarla (eğik çizgi, sorgu dizesi, http) iki kez eklenirdi.
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { sliceBetween } from "@/test/source-slice";

const MIGRATION = "20261002020000_whatsapp_landings_group_schema.sql";

const migrationSql = () => {
  const candidates = [`supabase/migrations/applied/${MIGRATION}`, `supabase/migrations/${MIGRATION}`];
  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) throw new Error(`${MIGRATION} bulunamadı (applied/ altında yaşamalı).`);
  return readFileSync(path, "utf8");
};

/** Yorumlar atılır: başlık, yasakladığı işlemleri ANLATIYOR. */
const code = () =>
  migrationSql()
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

describe("G10 · salt ekleme güvencesi", () => {
  it("hiçbir kolon DÜŞÜRÜLMEZ", () => {
    const sql = code();

    expect(sql).not.toMatch(/drop\s+column/i);
    expect(sql).not.toMatch(/drop\s+table/i);
  });

  it("canlı paketin okuduğu kolonlara dokunulmaz", () => {
    // Bu üçü düşerse yayındaki frontend kırılır (G03b deploy edilmedi).
    const sql = code();

    for (const column of ["status", "member_approved", "admin_approved"]) {
      expect(sql, `${column} düşürülmüş`).not.toMatch(new RegExp(`drop column[^;]*${column}`, "i"));
    }
  });

  it("yeni kolonlar `if not exists` ile eklenir (yeniden uygulanabilir)", () => {
    const sql = code();
    const added = [...sql.matchAll(/add column if not exists (\w+)/g)].map((match) => match[1]);

    expect(added.length).toBeGreaterThanOrEqual(20);
    for (const column of [
      "platform",
      "invite_code",
      "listing_status",
      "hidden_reason",
      "ownership",
      "owner_user_id",
      "submitted_by",
      "submitted_as_admin",
      "review_flags",
      "is_global",
      "country_code",
      "city_id",
      "short_description",
      "rules",
      "strike_count",
      "published_at",
      "suspended_until",
      "owner_renewal_due",
      "link_fail_count",
      "link_checked_at",
    ]) {
      expect(added, column).toContain(column);
    }
  });
});

describe("G10 · değerler paketten gelir", () => {
  it("durum makinesi tasarım §2'deki altı adı taşır", () => {
    const values = sliceBetween(
      code(),
      "whatsapp_landings_listing_status_chk",
      "end if;",
      "listing_status CHECK",
    );

    for (const state of ["pending_review", "published", "rejected", "hidden", "suspended", "removed"]) {
      expect(values, state).toContain(`'${state}'`);
    }
  });

  it("sahiplik tasarım §3.B'deki üç adı taşır", () => {
    const values = sliceBetween(code(), "whatsapp_landings_ownership_chk", "end if;", "ownership CHECK");

    for (const state of ["unclaimed", "claim_pending", "verified"]) {
      expect(values, state).toContain(`'${state}'`);
    }
  });

  it("gizleme sebepleri geçiş tablosundaki üç değerdir", () => {
    const values = sliceBetween(code(), "whatsapp_landings_hidden_reason_chk", "end if;", "hidden_reason CHECK");

    for (const reason of ["link_dead", "reports", "owner_request"]) {
      expect(values, reason).toContain(`'${reason}'`);
    }
  });

  it("konum `geo_*` tablolarına bağlanır, `cadde_*`'a DEĞİL", () => {
    // CLAUDE.md → Dijital Gruplar kuralı 3: iki ayrık katalog, karıştırılmaz.
    const sql = code();

    expect(sql).toContain("references public.geo_cities(id)");
    expect(sql).not.toContain("cadde_cities");
    expect(sql).not.toContain("cadde_countries");
  });
});

describe("G10 · davet kodu tekilleştirmesi", () => {
  it("kod URL'den çıkarılır ve tekil indeksle kilitlenir", () => {
    const sql = code();

    expect(sql).toContain("create or replace function public.group_invite_code");
    expect(sql).toContain("create unique index if not exists whatsapp_landings_invite_code_uniq");
    // Kısmi indeks: kodu çıkarılamayan (boş linkli) kayıtlar kapsam dışı.
    expect(sql).toContain("where invite_code is not null");
  });

  it("desteklenen alan adları tasarım §3.A ile aynı", () => {
    const fn = sliceBetween(code(), "create or replace function public.group_invite_code", "$$;", "kod fonksiyonu");

    for (const domain of ["chat\\.whatsapp\\.com", "t\\.me", "telegram\\.me", "discord\\.gg", "discord\\.com/invite"]) {
      expect(fn, domain).toContain(domain);
    }
  });

  it("geri doldurma ekip kararı gerektiren alanlara DOKUNMAZ", () => {
    // Kategori düzeltmesi · Global/Genel konumların eşlenmesi · boş linkli 2
    // grubun akıbeti · açıklamaların 160'a indirilmesi → G11 (U07).
    const backfill = sliceBetween(code(), "update public.whatsapp_landings", "where true;", "geri doldurma");

    expect(backfill).not.toContain("short_description =");
    expect(backfill).not.toContain("category =");
    expect(backfill).not.toContain("country_code =");
    expect(backfill).not.toContain("city_id =");
  });
});
