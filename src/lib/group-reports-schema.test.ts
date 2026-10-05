/**
 * G14 sözleşmesi — şikayet sistemi migration'ı (`20261005200000_group_reports.sql`).
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. **İstemciden doğrudan yazma.** Tabloya INSERT/UPDATE/DELETE politikası ya da
 *      grant'ı sızarsa uygunluk kuralları (telefon · hesap yaşı · cooldown) RPC'yi
 *      atlayarak delinir — Cadde'deki "RPC-only" kuralı.
 *   2. **Şikayetçi kimliğinin sahibe açılması.** RLS "kendi satırı + admin" dışına
 *      genişlerse grup sahibi kendisini şikayet edeni görür.
 *   3. **Uygunsuz şikayetin sayılması.** Telefon/yaş/cooldown kontrolü düşerse eşik
 *      sahte hesaplarla doldurulur (kabul #6'nın asıl hedefi).
 *   4. **Yükseltilmiş yetkinin sızması.** Geçici service claim'i geri yüklenmezse
 *      aynı işlemdeki sonraki ifadeler service_role olarak koşar.
 *   5. **Eşiğin kayması** (`>=` → `>`): 3 şikayette gizlenmesi gereken grup gizlenmez.
 *   6. **Sebep listesinin politikadan kopması** (DB CHECK ⇄ TS listesi ⇄ kırmızı
 *      çizgi numarası).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { GROUP_REPORT_ERROR_MESSAGES, GROUP_REPORT_REASONS } from "@/lib/group-reports-api";
import { sliceBetween } from "@/test/source-slice";

const MIGRATION = "20261005200000_group_reports.sql";
const APPLIED = "supabase/migrations/applied/";

const migrationSql = () => {
  const candidates = [`${APPLIED}${MIGRATION}`, `supabase/migrations/${MIGRATION}`];
  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) throw new Error(`${MIGRATION} bulunamadı (applied/ altında yaşamalı).`);
  return readFileSync(path, "utf8");
};

/** Yorum satırları atılmış kod (anlatım metni iddiaları yanıltmasın). */
const code = () =>
  migrationSql()
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

const flat = () => code().replace(/\s+/g, " ");

const fn = (name: string) =>
  sliceBetween(code(), `create or replace function public.${name}`, `comment on function public.${name}`, name);

describe("G14 · tablo — RPC-only yazma + RLS", () => {
  it("RLS açık; anon/authenticated'dan her şey geri alınır, yalnız SELECT verilir", () => {
    const sql = flat();

    expect(sql).toContain("alter table public.group_reports enable row level security;");
    expect(sql).toContain("revoke all on table public.group_reports from public, anon, authenticated;");
    expect(sql).toContain("grant select on table public.group_reports to authenticated;");
    expect(sql).not.toMatch(/grant (insert|update|delete|all)[^;]*on table public\.group_reports/i);
  });

  it("kullanıcıya INSERT/UPDATE/DELETE politikası YOK; tek SELECT politikası kendi satırı + admin", () => {
    const sql = flat();
    const policies = [...sql.matchAll(/create policy (\w+) on public\.group_reports ([^;]+);/g)];

    expect(policies).toHaveLength(1);
    expect(policies[0][2]).toContain("for select to authenticated");
    expect(policies[0][2]).toContain("using (reporter_id = auth.uid() or public.is_admin(auth.uid()))");
  });

  it("grup FK'si cascade DEĞİL (şikayet kaydı sessizce kaybolmaz)", () => {
    expect(flat()).toContain("references public.whatsapp_landings(id) on delete restrict");
  });

  it("diger için not zorunlu + not üst sınırı DB'de de var", () => {
    const sql = flat();

    expect(sql).toContain("check (reason <> 'diger' or (note is not null and btrim(note) <> ''))");
    expect(sql).toContain("check (note is null or char_length(note) <= 1000)");
  });
});

describe("G14 · sebepler politika §4 ⇄ DB CHECK ⇄ TS ⇄ kırmızı çizgi", () => {
  it("CHECK listesi TS listesiyle BİREBİR ve sıralı (7 kırmızı çizgi + diger)", () => {
    const check = sliceBetween(code(), "reason text not null check (reason in (", "))", "reason CHECK");
    const keys = [...check.matchAll(/'([a-z_]+)'/g)].map((match) => match[1]);

    expect(keys).toEqual(GROUP_REPORT_REASONS.map((reason) => reason.key));
    expect(keys).toHaveLength(8);
  });

  it("sebep → kırmızı çizgi numarası eşlemesi TS ile aynı; diger → NULL", () => {
    const body = fn("group_report_redline_number");
    for (const reason of GROUP_REPORT_REASONS) {
      if (reason.redline === null) {
        expect(body).not.toContain(`'${reason.key}'`);
      } else {
        expect(body).toContain(`when '${reason.key}' then ${reason.redline}`);
      }
    }
    expect(body).toContain("else null");
  });
});

describe("G14 · submit_group_report_v1 — uygunluk kuralları SUNUCUDA", () => {
  it("girişsiz reddi + grup satırı kilitli (yarış kapalı)", () => {
    const body = fn("submit_group_report_v1");

    expect(body).toContain("if v_uid is null then");
    expect(body).toContain("raise exception 'group_report_auth_required'");
    expect(body).toMatch(/from public\.whatsapp_landings\s+where id = p_landing_id\s+for update;/);
  });

  it("yalnız yayındaki gruba; kendi grubuna (ekleyen VEYA sahip) şikayet yok", () => {
    const body = fn("submit_group_report_v1");

    expect(body).toContain("if v_landing.listing_status <> 'published' then");
    expect(body).toContain(
      "if v_uid = v_landing.user_id or v_uid = v_landing.submitted_by or v_uid = v_landing.owner_user_id then",
    );
    expect(body).toContain("raise exception 'group_report_own_group'");
  });

  it("telefon kuralı ayardan + is_phone_verified (koşul + hata ikilisi)", () => {
    const body = fn("submit_group_report_v1").replace(/\s+/g, " ");

    expect(body).toContain(
      "if public.group_setting_bool('groups.report_require_phone', true) and not public.is_phone_verified(v_uid) then raise exception 'group_report_phone_required';",
    );
  });

  it("hesap yaşı ayardan (kodda sabit 7 yok) + koşul", () => {
    const body = fn("submit_group_report_v1").replace(/\s+/g, " ");

    expect(body).toContain("v_min_age := public.group_setting_int('groups.report_min_account_age_days', 7);");
    expect(body).toContain(
      "if v_created is null or v_created > now() - make_interval(days => v_min_age) then raise exception 'group_report_account_too_new';",
    );
  });

  it("aynı kişi aynı gruba cooldown içinde 2. şikayet veremez", () => {
    const body = fn("submit_group_report_v1").replace(/\s+/g, " ");

    expect(body).toContain("v_cooldown := public.group_setting_int('groups.report_same_group_cooldown_days', 30);");
    expect(body).toContain(
      "where reporter_id = v_uid and landing_id = p_landing_id and created_at > now() - make_interval(days => v_cooldown) ) then raise exception 'group_report_cooldown';",
    );
  });

  it("eşik: AÇIK şikayetlerden FARKLI şikayetçi ≥ ayar → hidden(reports) TEK kapıdan", () => {
    const body = fn("submit_group_report_v1").replace(/\s+/g, " ");

    expect(body).toContain("v_threshold := public.group_setting_int('groups.report_threshold', 3);");
    expect(body).toContain("select count(distinct reporter_id) into v_reporters");
    expect(body).toContain("where landing_id = p_landing_id and status = 'open';");
    expect(body).toContain("if v_reporters >= v_threshold then");
    expect(body).toContain("perform public.set_group_status_v1( p_landing_id, 'hidden', 'reports',");
    // listing_status'e doğrudan yazım YOK (G12 guard + tek kapı)
    expect(code()).not.toMatch(/set\s+listing_status/i);
  });

  it("geçici service claim GERİ YÜKLENİR — alt-işlem DIŞINDA (hata yolunda da)", () => {
    const body = fn("submit_group_report_v1");
    const afterBlock = sliceBetween(body, "v_err := sqlerrm;", "if v_err is not null", "claim geri yükleme");

    expect(body).toContain("v_prev_claims := current_setting('request.jwt.claims', true);");
    expect(body).toContain("perform set_config('request.jwt.claims', '{\"role\":\"service_role\"}', true);");
    expect(afterBlock).toContain("end;");
    expect(afterBlock).toContain("perform set_config('request.jwt.claims', coalesce(v_prev_claims, ''), true);");
    expect(afterBlock).toContain("perform set_config('request.jwt.claim.role', coalesce(v_prev_role, ''), true);");
    expect(afterBlock).toContain("perform set_config('request.jwt.claim.sub', coalesce(v_prev_sub, ''), true);");
  });

  it("matris izin vermezse şikayet KAYBOLMAZ (yalnız group_illegal_transition yutulur)", () => {
    expect(fn("submit_group_report_v1")).toContain("if v_err is not null and v_err <> 'group_illegal_transition' then");
  });
});

describe("G14 · review_group_report_v1 — is_admin tek kapı", () => {
  it("admin kapısı + çifte karar reddi", () => {
    const body = fn("review_group_report_v1");

    expect(body).toContain("if not public.is_admin(v_uid) then");
    expect(body).toContain("raise exception 'group_report_review_forbidden'");
    expect(body).toContain("if v_report.status <> 'open' then");
    expect(body).toContain("raise exception 'group_report_already_reviewed'");
  });

  it("upheld → G15 strike kapısı, kırmızı çizgi eşlemesiyle; tek karar = tek ihlal", () => {
    const body = fn("review_group_report_v1").replace(/\s+/g, " ");

    expect(body).toContain("v_strike := public.admin_record_group_strike( v_report.landing_id,");
    expect(body).toContain("public.group_report_redline_number(v_report.reason),");
    expect(body).toContain("where landing_id = v_report.landing_id and status = 'open';");
  });

  it("rejected → yalnız başka açık şikayet yoksa ve sebep reports ise yayına döner", () => {
    const body = fn("review_group_report_v1").replace(/\s+/g, " ");

    expect(body).toContain("if v_listing = 'hidden' and v_hidden_reason = 'reports' and not exists (");
    expect(body).toContain("perform public.set_group_status_v1( v_report.landing_id, 'published', 'reports_rejected',");
  });
});

describe("G14 · yetki matrisi — anon hiçbir kapıyı çağıramaz", () => {
  for (const signature of [
    "submit_group_report_v1(uuid, text, text)",
    "review_group_report_v1(uuid, text, text)",
    "group_report_state_v1(uuid)",
    "admin_list_group_reports()",
  ]) {
    it(`${signature}: public+anon revoke, yalnız authenticated`, () => {
      const sql = flat();

      expect(sql).toContain(`revoke all on function public.${signature} from public, anon;`);
      expect(sql).toContain(`grant execute on function public.${signature} to authenticated;`);
      expect(sql).not.toMatch(new RegExp(`grant execute on function public\\.${signature.replace(/[()]/g, "\\$&")} to [^;]*anon`));
    });
  }

  it("liste kapısı admin'e (şikayetçi kimliği yalnız orada)", () => {
    const body = fn("admin_list_group_reports");

    expect(body).toContain("if not public.is_admin(v_uid) then");
    expect(body).toContain("'reporter_id', r.reporter_id");
  });

  it("durum kapısı başka şikayetçilerin kimliğini DÖNMEZ", () => {
    expect(fn("group_report_state_v1")).not.toContain("reporter_id',");
  });
});

describe("G14 · group_moderator_summary yeniden tanımı (G24 bayatlama kapanı)", () => {
  const definers = () =>
    readdirSync(APPLIED)
      .filter((name) => name.endsWith(".sql"))
      .sort()
      .filter((name) =>
        readFileSync(APPLIED + name, "utf8").includes("create or replace function public.group_moderator_summary"),
      );

  it("en son tanımlayan migration G14'tür (yeni tanım eklenirse bu test bilinçli güncellenir)", () => {
    expect(definers().at(-1)).toBe(MIGRATION);
  });

  it("pending_reports gerçek AÇIK şikayet sayısı; diğer sayaç kaynakları G24 ile birebir", () => {
    const g14 = fn("group_moderator_summary");
    const g24 = sliceBetween(
      readFileSync(`${APPLIED}20261002130000_group_moderator_panel.sql`, "utf8"),
      "create or replace function public.group_moderator_summary",
      "comment on function public.group_moderator_summary",
      "G24 summary",
    );

    expect(g14).toMatch(/from public\.group_reports where status = 'open';/);
    expect(g14).toContain("'pending_reports', v_pending_reports");
    expect(g14).not.toContain("'pending_reports', 0");
    for (const fragment of [
      "group_moderator_forbidden",
      "listing_status = 'pending_review'",
      "status = 'pending' and method = 'screenshot'",
      "post_status = 'pending_platform'",
      "listing_status = 'published'",
      "group_setting_int('groups.fast_lane_suggest_threshold', 100)",
      "group_setting_bool('groups.fast_lane_enabled', false)",
      "from cron.job j",
      "j.jobname like 'group\\_%'",
      "'task_runs', v_runs",
      "security definer",
    ]) {
      expect(g24, `G24'te yok: ${fragment}`).toContain(fragment);
      expect(g14, `G14 tanımından düştü: ${fragment}`).toContain(fragment);
    }
  });
});

describe("G14 · hata haritası çift yönlü", () => {
  const raised = () => new Set([...code().matchAll(/raise exception '(group_report_[a-z_]+)'/g)].map((m) => m[1]));

  it("migration'daki her group_report_* kodu Türkçe haritada", () => {
    for (const codeName of raised()) {
      expect(codeName in GROUP_REPORT_ERROR_MESSAGES, `haritada eksik: ${codeName}`).toBe(true);
    }
  });

  it("haritada migration'da OLMAYAN hayali kod yok", () => {
    const phantom = Object.keys(GROUP_REPORT_ERROR_MESSAGES).filter((codeName) => !raised().has(codeName));
    expect(phantom).toEqual([]);
  });
});

describe("G14 · kapsam kilitleri", () => {
  it("bildirim maili EKLENMEDİ (karar turunda konuşulmadı)", () => {
    expect(code()).not.toContain("enqueue_group_notification");
    expect(code()).not.toContain("notification_email_outbox");
  });

  it("ayarlar yeniden TOHUMLANMAZ (G09'da zaten var)", () => {
    expect(code()).not.toMatch(/insert into public\.group_settings/i);
  });
});
