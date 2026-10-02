// G22 · Link sağlığı zamanlanmış görevi (tasarım §6: haftalık, yayılmış, ÜÇ DEĞERLİ).
//
// pg_cron (saatlik :23) `x-dispatch-secret` ile çağırır (radar/dispatcher deseni —
// verify_jwt KAPALI olmak ZORUNDA: pg_net ham secret taşır, JWT değil; A99-R2 dersi).
// Secret: GROUP_LINK_HEALTH_CRON_SECRET env == vault `radar_news_cron_secret`
// (⚠️ YENİ vault secret'ı SQL'den yaratılamıyor — ölçüldü; yeniden kullanım
// KALANLAR'da kayıtlı, rotasyonda İKİ yer güncellenir).
//
// Akış: `group_link_health_due` (SQL: yayın + link_dead gizliler, saat yuvası,
// parti tavanı) → her grup için `readInvitePage` (G08: okuma SUNUCUDA, üç
// değerli) → `group_link_health_record` (ok → sayaç 0 + geri aç · invalid →
// sayaç++ eşikte gizle · unknown → sayaç DOKUNULMAZ). İstekler arasında
// `link_health_request_delay_ms` beklenir (Meta 200/W04 dersi: dakikada en
// fazla birkaç istek).
//
// G08 kural 8: davet linki yanıta VE log'a YAZILMAZ — yalnız sayılar/sonuçlar.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";
import { readInvitePage } from "../_shared/group-invite-read.ts";

function secretsMatch(provided: string | null, expected: string | undefined): boolean {
  // send-notification-emails deseni: sabit-zamanlı karşılaştırma.
  if (!provided || !expected) return false;
  const a = new TextEncoder().encode(provided);
  const b = new TextEncoder().encode(expected);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

Deno.serve(async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("Missing Supabase configuration");

    // 1) Kimlik: cron secret (ham Bearer ya da x-dispatch-secret header'ı)
    const providedSecret =
      req.headers.get("x-dispatch-secret") ??
      (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!secretsMatch(providedSecret, Deno.env.get("GROUP_LINK_HEALTH_CRON_SECRET"))) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const service = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 2) Parti parametreleri ayarlardan (G09 doktrini — kodda sabit yok)
    const { data: limitRaw } = await service.rpc("group_setting_int", {
      p_key: "groups.link_health_batch_limit",
      p_default: 10,
    });
    const { data: delayRaw } = await service.rpc("group_setting_int", {
      p_key: "groups.link_health_request_delay_ms",
      p_default: 5000,
    });
    const batchLimit = Number.isFinite(limitRaw as number) ? (limitRaw as number) : 10;
    const delayMs = Math.min(Math.max((delayRaw as number) || 5000, 500), 30_000);

    // 3) Sırası gelen gruplar (SQL: yuva + aralık + tavan)
    const { data: dueRows, error: dueError } = await service.rpc("group_link_health_due", {
      p_limit: batchLimit,
      p_hour: null,
    });
    if (dueError) throw dueError;

    const rows = Array.isArray(dueRows) ? (dueRows as Array<{ id: string; platform: string; invite_link: string }>) : [];
    const summary = { checked: 0, ok: 0, invalid: 0, unknown: 0, hidden_now: 0, reopened: 0 };

    // 4) Tek tek oku + işle — aralarında gecikme (rate-limit dersi)
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      if (index > 0) await sleep(delayMs);

      let read;
      try {
        read = await readInvitePage(row.invite_link, row.platform as "whatsapp" | "telegram" | "discord");
      } catch {
        read = { result: "unknown" as const, name: null, description: null, image: null };
      }

      const { data: recordResult, error: recordError } = await service.rpc("group_link_health_record", {
        p_landing_id: row.id,
        p_result: read.result,
      });
      if (recordError) {
        console.error("group-link-health record failed", {
          landing_id: row.id,
          code: (recordError as { code?: string }).code,
        });
        continue;
      }

      summary.checked += 1;
      if (read.result === "ok") summary.ok += 1;
      else if (read.result === "invalid") summary.invalid += 1;
      else summary.unknown += 1;

      const listing = (recordResult as { listing_status?: string } | null)?.listing_status;
      if (read.result === "invalid" && listing === "hidden") summary.hidden_now += 1;
      if (read.result === "ok" && listing === "published") summary.reopened += 1;
    }

    // Log: SAYILAR. Link yok, grup adı yok, kullanıcı girdisi yok (kural 8).
    console.info("group-link-health", summary);
    return jsonResponse(summary, 200);
  } catch (error) {
    console.error("group-link-health error", error);
    return jsonResponse({ error: "Beklenmeyen bir hata olustu." }, 500);
  }
});
