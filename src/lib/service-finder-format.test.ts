import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  JOB_STATUS_LABELS,
  REVIEW_STATUS_LABELS,
  SF_ERROR_MESSAGES,
  budgetPercent,
  formatConfidence,
  formatUsd,
  sfErrorMessage,
} from "@/lib/service-finder-format";

describe("sfErrorMessage", () => {
  it("RPC hata kodunu Türkçe mesaja çevirir", () => {
    const error = new Error('Supabase: raise exception "sf_admin_required" at ...');
    expect(sfErrorMessage(error)).toBe(SF_ERROR_MESSAGES.sf_admin_required);
  });

  it("bilinmeyen kodda ham mesajı döndürür", () => {
    expect(sfErrorMessage(new Error("network down"))).toBe("network down");
  });

  it("boş hata için genel mesaj döner", () => {
    expect(sfErrorMessage(null)).toBe("Beklenmeyen bir hata oluştu.");
  });

  it("tüm sf_* kodlarının mesajı dolu", () => {
    for (const [code, message] of Object.entries(SF_ERROR_MESSAGES)) {
      expect(code.startsWith("sf_")).toBe(true);
      expect(message.length).toBeGreaterThan(5);
    }
  });
});

// SQL↔TS sözleşmesi (S05a) — `cadde-error-map.test.ts` deseninin ikizi.
//
// Yukarıdaki testler TEK YÖNLÜYDÜ: yalnız haritadaki kodların mesajı dolu mu diye
// bakıyor, SQL'e hiç dokunmuyorlardı. Bu yüzden SQL'e yeni bir `sf_*` eklenip haritaya
// yazılmadığında hiçbir şey düşmüyordu — ölçüldü (28.09): SQL'de 24 kod vardı, haritada
// 21; `sf_worker_id_required` · `sf_cost_payload_invalid` · `sf_invalid_final_status`
// eksikti ve kullanıcı Türkçe mesaj yerine HAM KODU görüyordu.
//
// Testi susturma, haritaya satır ekle.
describe("service-finder RPC hata kodu ↔ Türkçe mesaj sözleşmesi", () => {
  const MIGRATION_DIRS = ["supabase/migrations/applied", "supabase/migrations/archive"];

  const sqlCodes = (() => {
    const codes = new Map<string, string>();
    for (const dir of MIGRATION_DIRS) {
      let files: string[];
      try {
        files = readdirSync(dir).filter((file) => file.endsWith(".sql"));
      } catch {
        continue; // dizin yoksa (kısmi checkout) atla
      }
      for (const file of files) {
        const sql = readFileSync(join(dir, file), "utf8");
        for (const match of sql.matchAll(/raise\s+exception\s+'(sf_[a-z0-9_]+)'/gi)) {
          if (!codes.has(match[1])) codes.set(match[1], `${dir}/${file}`);
        }
      }
    }
    return codes;
  })();

  it("migration dosyalarından sf_ kodu toplayabiliyor (tarama boşa düşmesin)", () => {
    // Bu kapan olmadan aşağıdaki iddia negatif ve çıpasızdır: regex veya yol bozulunca
    // "hiç eksik yok" der. S04a/S04c'de ölçülen sınıf.
    expect(sqlCodes.size, "SQL'den sf_ kodu toplanamadı").toBeGreaterThan(20);
    expect(Object.keys(SF_ERROR_MESSAGES).length).toBeGreaterThan(20);
  });

  it("her SQL hata kodunun Türkçe karşılığı var", () => {
    const missing = [...sqlCodes.entries()]
      .filter(([code]) => !(code in SF_ERROR_MESSAGES))
      .map(([code, file]) => `${code} (${file})`);

    expect(missing).toEqual([]);
  });

  it("kod yakalayan regex rakam içeren kodları da tanır", () => {
    // Desen `sf_[a-z_]+` idi; `sf_budget_2x` gibi bir kod sessizce eşleşmezdi.
    expect(sfErrorMessage(new Error("... sf_worker_id_required ..."))).toBe(
      SF_ERROR_MESSAGES.sf_worker_id_required,
    );
  });
});

// S05b — eşlenmemiş kod ve düz-nesne hatası davranışı.
describe("sfErrorMessage kullanıcıya ham kod göstermez", () => {
  it("RPC hatası DÜZ NESNE olsa da kodu bulur", () => {
    // ⚠️ CLAUDE.md'de belgelenen sınıf: supabase-js RPC hataları `Error` örneği
    // DEĞİLDİR. Eski kod `instanceof Error` ile daraltıyordu; düz nesne
    // `String(error)` yolundan geçip "[object Object]" oluyordu.
    expect(sfErrorMessage({ message: "sf_job_not_found", code: "P0001" })).toBe(
      SF_ERROR_MESSAGES.sf_job_not_found,
    );
  });

  it("kodu `details`/`hint` alanında taşıyan hatayı da çözer", () => {
    expect(sfErrorMessage({ message: "", details: "sf_admin_required" })).toBe(
      SF_ERROR_MESSAGES.sf_admin_required,
    );
  });

  it("EŞLENMEMİŞ kodu ham göstermez, Türkçe genel mesaja düşer", () => {
    // SQL'de 204 benzersiz hata kodu var; yalnız cadde (81) ve sf (24) eşlenmiş.
    // Geri kalanı ham gösterilirse kullanıcı anlamsız teknik metin görür.
    expect(sfErrorMessage({ message: "rl_budget_exceeded" })).toBe("Beklenmeyen bir hata oluştu.");
    expect(sfErrorMessage(new Error("invalid_payload"))).toBe("Beklenmeyen bir hata oluştu.");
  });

  it("ham Postgres gövdesini kullanıcıya geçirmez", () => {
    expect(sfErrorMessage(new Error("raise exception 'rl_unknown'"))).toBe(
      "Beklenmeyen bir hata oluştu.",
    );
  });

  it("gerçek bir cümleyi ise KORUR (ağ hatası gibi okunabilir metin)", () => {
    // Aşırı düzeltme olmasın: okunabilir bir mesaj kullanıcıya yardımcıdır.
    expect(sfErrorMessage(new Error("network down"))).toBe("network down");
  });
});

describe("durum etiketleri", () => {
  it("tüm iş durumları Türkçe etiketlidir", () => {
    for (const status of [
      "queued",
      "running",
      "review",
      "completed",
      "failed",
      "cancelled",
      "budget_stopped",
    ] as const) {
      expect(JOB_STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it("tüm inceleme durumları Türkçe etiketlidir", () => {
    for (const status of ["pending", "approved", "rejected", "needs_edit", "published"] as const) {
      expect(REVIEW_STATUS_LABELS[status]).toBeTruthy();
    }
  });
});

describe("budgetPercent", () => {
  it("oranı yüzdeye çevirir", () => {
    expect(budgetPercent(1.5, 3)).toBe(50);
  });

  it("taşmada 100'de kalır", () => {
    expect(budgetPercent(5, 3)).toBe(100);
  });

  it("sıfır/geçersiz tavanlarda 0 döner", () => {
    expect(budgetPercent(1, 0)).toBe(0);
  });

  it("string girdileri tolere eder (numeric kolonlar string gelebilir)", () => {
    expect(budgetPercent("0.31", "3.0000")).toBe(10);
  });
});

describe("format yardımcıları", () => {
  it("formatUsd USD para formatı üretir", () => {
    expect(formatUsd(0.31)).toContain("0,31");
  });

  it("formatConfidence yüzde işaretli tam sayı üretir", () => {
    expect(formatConfidence(84.6)).toBe("%85");
  });
});
