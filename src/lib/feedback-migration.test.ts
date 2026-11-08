/**
 * L10a sözleşmeleri — "Geri Bildirim" profil sekmesi + admin "REV'e taşı".
 *
 * Kapattığı sessiz başarısızlık sınıfları:
 *   1. SQL'e eklenen `feedback_` kodunun Türkçe karşılığının unutulması (kullanıcı ham
 *      kodu görür) — ve tersi, haritada olup SQL'de olmayan kod.
 *   2. Üye RPC'sinin `auth.uid()` süzgeci / `deleted_at` / limit kalkanını kaybetmesi
 *      (başkasının geri bildirimi sızar). Tabloya üye SELECT policy'si EKLENMEZ.
 *   3. Terfi RPC'sinin admin kapısını ya da idempotency'yi (`promoted_revision_id`) kaybetmesi.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { FEEDBACK_ERROR_MESSAGES, feedbackErrorMessage } from "@/lib/feedback";
import { sliceBetween } from "@/test/source-slice";

const MIGRATION_DIRS = ["supabase/migrations/applied", "supabase/migrations/archive"];
const MIGRATION_FILE = "supabase/migrations/applied/20261108120000_feedback_profile_and_promote.sql";

const sqlCodes = (() => {
  const codes = new Map<string, string>();
  for (const dir of MIGRATION_DIRS) {
    let files: string[];
    try {
      files = readdirSync(dir).filter((file) => file.endsWith(".sql"));
    } catch {
      continue;
    }
    for (const file of files) {
      const sql = readFileSync(join(dir, file), "utf8");
      for (const match of sql.matchAll(/raise\s+exception\s+'(feedback_[a-z0-9_]+)'/gi)) {
        if (!codes.has(match[1])) codes.set(match[1], `${dir}/${file}`);
      }
    }
  }
  return codes;
})();

const sql = readFileSync(MIGRATION_FILE, "utf8");

/** Fonksiyonun gövdesini döndürür; çıpa kaybolursa `sliceBetween` testi AÇIKÇA düşürür. */
function functionBlock(name: string): string {
  return sliceBetween(sql, `create or replace function public.${name}(`, "$$;", `${name} gövdesi`);
}

describe("feedback_ RPC hata kodu ↔ Türkçe mesaj sözleşmesi", () => {
  it("SQL'den kod toplayabiliyor (tarama boşa düşmesin)", () => {
    expect(sqlCodes.size, "SQL'den feedback_ kodu toplanamadı").toBeGreaterThanOrEqual(3);
  });

  it("her SQL kodunun Türkçe karşılığı var", () => {
    const missing = [...sqlCodes.entries()]
      .filter(([code]) => !(code in FEEDBACK_ERROR_MESSAGES))
      .map(([code, file]) => `${code} (${file})`);

    expect(missing).toEqual([]);
  });

  it("haritada SQL'de olmayan kod yok (ters yön)", () => {
    const stale = Object.keys(FEEDBACK_ERROR_MESSAGES).filter((code) => !sqlCodes.has(code));

    expect(stale).toEqual([]);
  });

  it("mesajlar dolu, Türkçe cümle ve ham kod değil", () => {
    for (const [code, message] of Object.entries(FEEDBACK_ERROR_MESSAGES)) {
      expect(message.trim(), code).not.toBe("");
      expect(message, code).not.toMatch(/^feedback_/);
    }
  });

  it("düz nesne hatadan kodu çıkarır (Error örneği DEĞİL)", () => {
    const rpcError = { message: "feedback_already_promoted", code: "P0001", details: null, hint: null };

    expect(feedbackErrorMessage(rpcError, "genel")).toBe(FEEDBACK_ERROR_MESSAGES.feedback_already_promoted);
  });

  it("kodu `details`/`hint` içinde taşıyan hatayı da çözer", () => {
    expect(feedbackErrorMessage({ message: "x", details: "feedback_not_found" }, "genel")).toBe(
      FEEDBACK_ERROR_MESSAGES.feedback_not_found,
    );
  });

  it("bilinmeyen hatada ham metin DEĞİL, verilen genel mesaj döner", () => {
    expect(feedbackErrorMessage({ message: "PGRST204 something broke" }, "genel mesaj")).toBe("genel mesaj");
    expect(feedbackErrorMessage(null, "genel mesaj")).toBe("genel mesaj");
  });
});

describe("list_my_feedback_v1 (üyenin kendi geri bildirimleri)", () => {
  const body = functionBlock("list_my_feedback_v1");

  it("security definer + sabit search_path", () => {
    expect(body).toMatch(/security definer/i);
    expect(body).toMatch(/set search_path = public/i);
  });

  it("yalnız çağıranın satırlarını, silinmemiş ve en çok 50 olarak döner", () => {
    // Tam yan tümce kilitli: `... = auth.uid() or true` gibi bir mutasyon bu desene UYMAZ.
    expect(body).toMatch(
      /where f\.created_by = auth\.uid\(\)\s+and f\.deleted_at is null\s+order by f\.created_at desc\s+limit 50;/i,
    );
  });

  it("yalnız authenticated çalıştırabilir; anon/public kapalı", () => {
    expect(sql).toMatch(/revoke all on function public\.list_my_feedback_v1\(\) from public/i);
    expect(sql).toMatch(/revoke all on function public\.list_my_feedback_v1\(\) from anon/i);
    expect(sql).toMatch(/grant execute on function public\.list_my_feedback_v1\(\) to authenticated/i);
    expect(sql).not.toMatch(/grant execute on function public\.list_my_feedback_v1\(\) to (anon|public)/i);
  });

  it("tabloya üye SELECT policy'si EKLEMEZ (okuma RPC üzerinden)", () => {
    expect(sql).not.toMatch(/create policy[^;]*on public\.member_feedback\s+for select/i);
  });

  it("gövdeyi/başkasının kimliğini parametre olarak almaz", () => {
    expect(body).toMatch(/list_my_feedback_v1\(\s*\)/i);
  });
});

describe("admin_promote_feedback_to_revision_v1 (REV'e taşı)", () => {
  const body = functionBlock("admin_promote_feedback_to_revision_v1");

  it("security definer + sabit search_path + is_admin kapısı", () => {
    expect(body).toMatch(/security definer/i);
    expect(body).toMatch(/set search_path = public/i);
    // Tam koşul kilitli: `if false and not ...` ya da `or true` mutasyonu bu desene UYMAZ.
    expect(body).toMatch(
      /if v_uid is null or not public\.is_admin\(v_uid\) then\s+raise exception 'feedback_admin_required' using errcode = '42501';\s+end if;/i,
    );
  });

  it("promoted_revision_id sütunu migration'la eklenir (nullable, FK)", () => {
    expect(sql).toMatch(
      /alter table public\.member_feedback\s+add column if not exists promoted_revision_id uuid references public\.revision_requests/i,
    );
  });

  it("ikinci terfiyi reddeder ve eşzamanlı çifte tıklamaya karşı satırı kilitler", () => {
    expect(body).toMatch(
      /from public\.member_feedback\s+where id = p_feedback_id\s+and deleted_at is null\s+for update;/i,
    );
    expect(body).toMatch(
      /if v_fb\.promoted_revision_id is not null then\s+raise exception 'feedback_already_promoted'/i,
    );
  });

  it("revision_requests'e Geri Bildirim etiketiyle ekler; numarayı tetikleyiciye bırakır", () => {
    expect(body).toMatch(/insert into public\.revision_requests/i);
    expect(body).toMatch(/'Geri Bildirim'/);
    expect(body).toMatch(/'acik'/);
    expect(body).not.toMatch(/nextval\(/i);
    expect(body).not.toMatch(/\brevision_number\s*=/i);
  });

  it("üye e-postasını revizyon detayına YAZMAZ (outbox/moderatör sızıntısı)", () => {
    const code = body.replace(/^\s*--.*$/gm, ""); // açıklama satırları e-postadan söz edebilir
    expect(code).not.toMatch(/auth\.users/i);
    expect(code).not.toMatch(/email/i);
    expect(body).toMatch(/Geri bildirim #/);
  });

  it("başlık boş/boşluktan oluşsa bile boş kalmaz", () => {
    expect(body).toMatch(/nullif\(left\(btrim\(regexp_replace\(v_fb\.body, '\\s\+', ' ', 'g'\)\), 80\), ''\)/);
    expect(body).toMatch(/'Geri bildirim'\s*\)/);
  });

  it("geri bildirimi okundu yapar ve terfi kaydını işler", () => {
    expect(body).toMatch(/update public\.member_feedback/i);
    expect(body).toMatch(/'okundu'/);
    expect(body).toMatch(/promoted_revision_id\s*=/i);
  });

  it("yalnız authenticated çalıştırabilir; anon/public kapalı", () => {
    expect(sql).toMatch(/revoke all on function public\.admin_promote_feedback_to_revision_v1\(uuid\) from public/i);
    expect(sql).toMatch(/revoke all on function public\.admin_promote_feedback_to_revision_v1\(uuid\) from anon/i);
    expect(sql).toMatch(
      /grant execute on function public\.admin_promote_feedback_to_revision_v1\(uuid\) to authenticated/i,
    );
  });
});

describe("member_feedback_reset_admin_fields (üye INSERT'inde yetki alanları)", () => {
  const body = functionBlock("member_feedback_reset_admin_fields");

  it("admin olmayan oturumda status ve promoted_revision_id sıfırlanır", () => {
    expect(body).toMatch(
      /if auth\.uid\(\) is not null and not public\.is_admin\(auth\.uid\(\)\) then\s+new\.status := 'yeni';\s+new\.promoted_revision_id := null;\s+end if;/i,
    );
  });

  it("BEFORE INSERT tetikleyicisi olarak bağlanır", () => {
    expect(sql).toMatch(
      /create trigger member_feedback_reset_admin_fields\s+before insert on public\.member_feedback\s+for each row\s+execute function public\.member_feedback_reset_admin_fields\(\);/i,
    );
  });
});

describe("migration üstbilgisi", () => {
  it("geri alma notunu içerir", () => {
    expect(sql).toMatch(/Rollback/i);
  });
});
