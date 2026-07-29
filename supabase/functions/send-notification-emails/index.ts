// send-notification-emails — notification_email_outbox kuyruğunun drenajı.
//
// İki bildirim türünü de gönderir:
//   new_member    → siteye yeni üye kaydolduğunda (auth.users trigger'ı kuyruğa yazar)
//   admin_update  → admin-updates.ts'e yeni kayıt girildiğinde (sync:admin-updates yazar)
//
// Tetikleyiciler (üçü de aynı kuyruğu okur, claim_notification_emails `for update skip
// locked` ile çift göndermeyi imkânsız kılar):
//   1. DB trigger'ından pg_net poke (anlık)  → x-dispatch-secret header'ı
//   2. Admin panelindeki "Şimdi gönder" butonu → admin JWT'si
//   3. pg_cron (varsa, 15 dk'da bir emniyet ağı) → x-dispatch-secret header'ı
//
// send-submission-email deseni: Deno + esm.sh + CORS allowlist + service_role + Resend.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const ALLOWED_ORIGINS = new Set([
  "https://corteqs.net",
  "https://www.corteqs.net",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:8080",
]);

const CLAIM_LIMIT = 50;
const MAX_ATTEMPTS = 5;

const SETTING_KEY_BY_EVENT: Record<string, string> = {
  new_member: "email.new_member.enabled",
  admin_update: "email.admin_update.enabled",
};

type OutboxRow = {
  id: string;
  event_type: "new_member" | "admin_update";
  dedupe_key: string;
  payload: Record<string, unknown>;
  attempts: number;
};

type Subscriber = { user_id: string; email: string };

function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-dispatch-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function jsonResponse(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

/** Uzunluk sızdırmayan sabit zamanlı karşılaştırma. */
function secretsMatch(provided: string | null, expected: string | undefined): boolean {
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

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function formatDateTime(value: unknown): string {
  const raw = typeof value === "string" ? value : null;
  if (!raw) return "-";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleString("tr-TR", { timeZone: "Europe/Berlin" });
}

const PROVIDER_LABELS: Record<string, string> = {
  email: "E-posta + şifre",
  google: "Google",
  linkedin_oidc: "LinkedIn",
  apple: "Apple",
};

function buildNewMemberEmail(payload: Record<string, unknown>) {
  const email = String(payload.email ?? "-");
  const provider = String(payload.provider ?? "email");
  const providerLabel = PROVIDER_LABELS[provider] ?? provider;

  return {
    subject: `CorteQS'e yeni üye kaydoldu: ${email}`,
    html: `
      <h2>CorteQS'e yeni üye kaydoldu</h2>
      <table cellpadding="8" cellspacing="0" border="1" style="border-collapse: collapse; border-color: #d4d4d8;">
        <tr><td><strong>E-posta</strong></td><td>${escapeHtml(email)}</td></tr>
        <tr><td><strong>Kayıt yöntemi</strong></td><td>${escapeHtml(providerLabel)}</td></tr>
        <tr><td><strong>Kayıt zamanı</strong></td><td>${escapeHtml(formatDateTime(payload.created_at))}</td></tr>
      </table>
      <p style="color:#71717a;font-size:12px;margin-top:16px;">
        Bu bildirimi admin panelindeki Bildirim Ayarları sayfasından kapatabilirsin.
      </p>
    `,
  };
}

function buildAdminUpdateEmail(payload: Record<string, unknown>) {
  const title = String(payload.title ?? "Yeni güncelleme");
  const date = String(payload.date ?? "");
  const items = Array.isArray(payload.items) ? payload.items : [];
  const itemsHtml = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  return {
    subject: `CorteQS admin güncellemesi: ${title}`,
    html: `
      <h2>${escapeHtml(title)}</h2>
      <p><strong>${escapeHtml(date)}</strong></p>
      <ul>${itemsHtml}</ul>
      <p style="color:#71717a;font-size:12px;margin-top:16px;">
        Bu bildirimi admin panelindeki Bildirim Ayarları sayfasından kapatabilirsin.
      </p>
    `,
  };
}

function buildEmail(row: OutboxRow) {
  return row.event_type === "new_member"
    ? buildNewMemberEmail(row.payload)
    : buildAdminUpdateEmail(row.payload);
}

async function sendWithResend(apiKey: string, payload: Record<string, unknown>) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Resend request failed: ${response.status} ${responseText}`);
  }
}

/** Header secret'i VEYA admin JWT'si. İkisi de yoksa 401. */
async function isAuthorized(
  request: Request,
  admin: ReturnType<typeof createClient>,
): Promise<boolean> {
  if (secretsMatch(request.headers.get("x-dispatch-secret"), Deno.env.get("NOTIFY_DISPATCH_SECRET"))) {
    return true;
  }

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return false;

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user) return false;

  const { data: adminFlag, error: adminError } = await admin.rpc("is_admin", { uid: userData.user.id });
  return !adminError && adminFlag === true;
}

Deno.serve(async (request) => {
  const corsHeaders = buildCorsHeaders(request);
  const origin = request.headers.get("Origin");

  if (request.method === "OPTIONS") {
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return jsonResponse({ error: "Origin not allowed" }, 403, corsHeaders);
    }
    return new Response(null, { headers: corsHeaders });
  }

  // pg_net/cron çağrılarında Origin header'ı yoktur; yalnız tarayıcı kaynaklı istekler süzülür.
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return jsonResponse({ error: "Origin not allowed" }, 403, corsHeaders);
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const mailFrom = Deno.env.get("MAIL_FROM");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("send-notification-emails: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY eksik.");
    return jsonResponse({ error: "config_missing" }, 500, corsHeaders);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (!(await isAuthorized(request, admin))) {
    return jsonResponse({ error: "unauthorized" }, 401, corsHeaders);
  }

  if (!resendApiKey || !mailFrom) {
    console.warn("send-notification-emails: RESEND_API_KEY/MAIL_FROM eksik, gonderim atlandi.");
    return jsonResponse({ skipped: true, reason: "mail_config_missing" }, 200, corsHeaders);
  }

  try {
    const { data: claimed, error: claimError } = await admin.rpc("claim_notification_emails", {
      p_limit: CLAIM_LIMIT,
    });
    if (claimError) throw claimError;

    const rows = (claimed ?? []) as OutboxRow[];
    if (rows.length === 0) {
      return jsonResponse({ processed: 0, sent: 0, skipped: 0, failed: 0 }, 200, corsHeaders);
    }

    // Global anahtarlar ve abone listeleri tür başına bir kez çözülür.
    const enabledCache = new Map<string, boolean>();
    const subscriberCache = new Map<string, Subscriber[]>();

    const isEventEnabled = async (eventType: string): Promise<boolean> => {
      const cached = enabledCache.get(eventType);
      if (cached !== undefined) return cached;

      const { data, error } = await admin.rpc("notification_setting_enabled", {
        p_key: SETTING_KEY_BY_EVENT[eventType],
      });
      if (error) throw error;

      const enabled = data === true;
      enabledCache.set(eventType, enabled);
      return enabled;
    };

    const getSubscribers = async (eventType: string): Promise<Subscriber[]> => {
      const cached = subscriberCache.get(eventType);
      if (cached) return cached;

      const { data, error } = await admin.rpc("admin_get_notification_subscribers", {
        p_event_type: eventType,
      });
      if (error) throw error;

      const subscribers = (data ?? []) as Subscriber[];
      subscriberCache.set(eventType, subscribers);
      return subscribers;
    };

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const row of rows) {
      try {
        if (!(await isEventEnabled(row.event_type))) {
          await admin
            .from("notification_email_outbox")
            .update({ status: "skipped", last_error: "global_switch_off", sent_at: new Date().toISOString() })
            .eq("id", row.id);
          skipped += 1;
          continue;
        }

        const subscribers = await getSubscribers(row.event_type);
        if (subscribers.length === 0) {
          await admin
            .from("notification_email_outbox")
            .update({ status: "skipped", last_error: "no_subscribers", recipient_count: 0, sent_at: new Date().toISOString() })
            .eq("id", row.id);
          skipped += 1;
          continue;
        }

        const { subject, html } = buildEmail(row);

        // Aboneler birbirinin adresini görmesin diye tek tek gönderilir.
        for (const subscriber of subscribers) {
          await sendWithResend(resendApiKey, {
            from: mailFrom,
            to: [subscriber.email],
            subject,
            html,
          });
        }

        await admin
          .from("notification_email_outbox")
          .update({
            status: "sent",
            recipient_count: subscribers.length,
            last_error: null,
            sent_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        sent += 1;
      } catch (rowError: unknown) {
        const message = rowError instanceof Error ? rowError.message : "unexpected_error";
        console.error(`send-notification-emails: ${row.dedupe_key} basarisiz:`, message);

        // Deneme hakkı bittiyse kalıcı 'failed'; değilse 'pending' kalır ve
        // claimed_at 5 dakika sonra yeniden devralınabilir hale gelir.
        await admin
          .from("notification_email_outbox")
          .update({
            status: row.attempts + 1 >= MAX_ATTEMPTS ? "failed" : "pending",
            last_error: message.slice(0, 2000),
          })
          .eq("id", row.id);
        failed += 1;
      }
    }

    return jsonResponse({ processed: rows.length, sent, skipped, failed }, 200, corsHeaders);
  } catch (error: unknown) {
    console.error("send-notification-emails error:", error);
    return jsonResponse({ error: "internal_server_error" }, 500, corsHeaders);
  }
});
