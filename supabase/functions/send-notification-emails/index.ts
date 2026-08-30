// send-notification-emails — notification_email_outbox kuyruğunun drenajı.
//
// Altı bildirim türünü gönderir:
//   new_member       → siteye yeni üye kaydolduğunda        → alıcı: abone admin/moderator'lar
//   admin_update     → admin-updates.ts'e kayıt girildiğinde → alıcı: abone admin/moderator'lar
//   member_welcome   → üye e-postasını doğruladığında        → alıcı: ÜYENİN KENDİSİ
//   revision_request → yeni revizyon isteği açıldığında      → alıcı: abone admin/moderator'lar
//   relocation_tool_report → kullanıcının istediği araç raporu → alıcı: ÜYENİN KENDİSİ
//   relocation_tool_abandonment → yarım kalan araç hatırlatması → alıcı: ÜYENİN KENDİSİ
//
// member_welcome'ın alıcısı payload'dan gelir; abone listesine hiç bakılmaz. Bu ayrım
// resolveRecipients() içinde tek yerde yapılır.
//
// admin_update GÜNLÜK ÖZETTİR (karar 2026-07-30, mig 20260730230000): satırlar kuyruğa
// deliver_after = bir sonraki 18:00 Europe/Berlin ile düşer, 15 dk'lık cron vadesi gelince
// claim eder ve aynı claim'deki TÜM admin_update satırları TEK mailde birleşir. Panel
// butonu `{"force": true}` gövdesiyle vadesi gelmemiş satırları da erken boşaltabilir
// (yine tek özet mail olarak).
//
// Tetikleyiciler (hepsi aynı kuyruğu okur, claim_notification_emails `for update skip
// locked` ile çift göndermeyi imkânsız kılar):
//   1. DB trigger'ından pg_net poke (anlık)  → x-dispatch-secret header'ı
//   2. Admin panelindeki "Şimdi gönder" butonu → admin JWT'si
//   3. pg_cron (varsa, 15 dk'da bir emniyet ağı) → x-dispatch-secret header'ı
//
// Ayrıca `{"action":"preview"}` gövdesi: admin'in KENDİ adresine örnek hoş geldin maili
// atar (kuyruğa dokunmaz). Gmail/Outlook'ta gerçek görünümü doğrulamanın tek yolu budur.
//
// send-submission-email deseni: Deno + esm.sh + CORS allowlist + service_role + Zoho SMTP.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";

import { buildAdminUpdateEmail } from "../_shared/emails/admin-update-digest.ts";
import { escapeHtml } from "../_shared/emails/html.ts";
import { buildMemberWelcomeEmail } from "../_shared/emails/member-welcome.ts";
import { buildRelocationToolAbandonmentEmail } from "../_shared/emails/relocation-tool-abandonment.ts";
import { buildRelocationToolReportEmail } from "../_shared/emails/relocation-tool-report.ts";
import { buildRevisionRequestEmail } from "../_shared/emails/revision-request.ts";
import { resolveZohoSmtpConfig, sendMailViaZohoSmtp } from "../_shared/emails/smtp.ts";

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
  member_welcome: "email.member_welcome.enabled",
  revision_request: "email.revision_request.enabled",
  relocation_tool_abandonment: "email.relocation_tool_abandonment.enabled",
};

type EventType =
  | "new_member"
  | "admin_update"
  | "member_welcome"
  | "revision_request"
  | "relocation_tool_report"
  | "relocation_tool_abandonment";

type OutboxRow = {
  id: string;
  event_type: EventType;
  dedupe_key: string;
  payload: Record<string, unknown>;
  attempts: number;
};

type Subscriber = { user_id: string; email: string };

type BuiltEmail = { subject: string; html: string; text?: string };

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

/** Site adresi mail içindeki tüm bağlantıların kökü; ortamdan gelmezse canlıya düşer. */
function resolveSiteUrl(): string {
  return Deno.env.get("PUBLIC_SITE_URL") || "https://corteqs.net";
}

/** Üyenin kendisine giden hoş geldin maili — şablon _shared/emails altında. */
function buildWelcomeEmail(payload: Record<string, unknown>): BuiltEmail {
  const fullName = typeof payload.full_name === "string" ? payload.full_name : null;

  return buildMemberWelcomeEmail({
    fullName,
    email: String(payload.email ?? ""),
    siteUrl: resolveSiteUrl(),
    replyTo: Deno.env.get("MAIL_REPLY_TO") ?? null,
  });
}

// admin_update bu fonksiyona GELMEZ — o satırlar aşağıdaki toplu özet yolunda birleşir.
function buildEmail(row: OutboxRow): BuiltEmail {
  switch (row.event_type) {
    case "member_welcome":
      return buildWelcomeEmail(row.payload);
    case "revision_request":
      return buildRevisionRequestEmail(row.payload, resolveSiteUrl());
    case "relocation_tool_report":
      return buildRelocationToolReportEmail(row.payload, resolveSiteUrl());
    case "relocation_tool_abandonment":
      return buildRelocationToolAbandonmentEmail(row.payload, resolveSiteUrl());
    default:
      return buildNewMemberEmail(row.payload);
  }
}

type Caller = {
  authorized: boolean;
  /** Yalnız admin JWT'si ile gelen çağrılarda dolu; pg_net/cron çağrılarında null. */
  adminEmail: string | null;
};

const DENIED: Caller = { authorized: false, adminEmail: null };

/**
 * Header secret'i VEYA admin JWT'si. İkisi de yoksa 401.
 * Örnek mail gönderimi adminEmail gerektirir — secret'la gelen makine çağrılarının
 * "kendi adresi" olmadığı için o yol preview isteğinde kullanılamaz.
 */
async function resolveCaller(
  request: Request,
  admin: ReturnType<typeof createClient>,
): Promise<Caller> {
  if (secretsMatch(request.headers.get("x-dispatch-secret"), Deno.env.get("NOTIFY_DISPATCH_SECRET"))) {
    return { authorized: true, adminEmail: null };
  }

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return DENIED;

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user) return DENIED;

  const { data: adminFlag, error: adminError } = await admin.rpc("is_admin", { uid: userData.user.id });
  if (adminError || adminFlag !== true) return DENIED;

  return { authorized: true, adminEmail: userData.user.email ?? null };
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
  const smtpConfig = resolveZohoSmtpConfig();
  const mailFrom = Deno.env.get("MAIL_FROM");
  const mailReplyTo = Deno.env.get("MAIL_REPLY_TO");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("send-notification-emails: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY eksik.");
    return jsonResponse({ error: "config_missing" }, 500, corsHeaders);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const caller = await resolveCaller(request, admin);
  if (!caller.authorized) {
    return jsonResponse({ error: "unauthorized" }, 401, corsHeaders);
  }

  if (!smtpConfig || !mailFrom) {
    console.warn("send-notification-emails: ZOHO_SMTP_*/MAIL_FROM eksik, gonderim atlandi.");
    return jsonResponse({ skipped: true, reason: "mail_config_missing" }, 200, corsHeaders);
  }

  // Gövde opsiyoneldir: pg_net/cron `{"source":"db"}` yollar, panel butonu gövdesiz de
  // çağırabilir. Bozuk JSON kuyruk drenajını engellememeli.
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  // ── Örnek mail: kuyruğa DOKUNMAZ, yalnız çağıran admin'in kendi adresine gider ──
  // Genel anahtar kapalıyken de çalışır; amacı zaten yayına almadan önce görsel kontrol.
  if (body.action === "preview") {
    if (!caller.adminEmail) {
      return jsonResponse({ error: "preview_requires_admin_session" }, 403, corsHeaders);
    }

    const sample = buildMemberWelcomeEmail({
      fullName: typeof body.full_name === "string" ? body.full_name : "Örnek Üye",
      email: caller.adminEmail,
      siteUrl: resolveSiteUrl(),
      replyTo: mailReplyTo ?? null,
    });

    try {
      await sendMailViaZohoSmtp(smtpConfig, {
        from: mailFrom,
        to: [caller.adminEmail],
        replyTo: mailReplyTo || undefined,
        subject: `[ÖRNEK] ${sample.subject}`,
        html: sample.html,
        text: sample.text,
      });
    } catch (previewError: unknown) {
      const message = previewError instanceof Error ? previewError.message : "unexpected_error";
      console.error("send-notification-emails: ornek mail basarisiz:", message);
      return jsonResponse({ error: "preview_failed", detail: message.slice(0, 500) }, 502, corsHeaders);
    }

    return jsonResponse({ preview: true, sentTo: caller.adminEmail }, 200, corsHeaders);
  }

  try {
    // force: panel "Şimdi gönder" butonu — vadesi gelmemiş (deliver_after gelecekte)
    // admin_update özet satırlarını da devralır. pg_net/cron çağrıları force göndermez.
    const { data: claimed, error: claimError } = await admin.rpc("claim_notification_emails", {
      p_limit: CLAIM_LIMIT,
      p_force: body.force === true,
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
      // Kullanıcının sonuç ekranında açıkça istediği transactional rapor;
      // admin pazarlama/bildirim aboneliklerinden bağımsızdır.
      if (eventType === "relocation_tool_report") return true;

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

    /**
     * Alıcı listesi. member_welcome üyenin KENDİSİNE gider — abone RPC'sine hiç uğramaz,
     * dolayısıyla admin aboneliklerinden bağımsızdır. Diğer iki tip abone listesini kullanır.
     */
    const resolveRecipients = async (row: OutboxRow): Promise<string[]> => {
      if (
        row.event_type !== "member_welcome"
        && row.event_type !== "relocation_tool_report"
        && row.event_type !== "relocation_tool_abandonment"
      ) {
        return (await getSubscribers(row.event_type)).map((subscriber) => subscriber.email);
      }

      const email = typeof row.payload.email === "string" ? row.payload.email.trim() : "";
      return email === "" ? [] : [email];
    };

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    // admin_update satırları TEK özet mailde birleşir (aşağıdaki blok); kalan tipler
    // satır başına ayrı mail olarak gider.
    const digestRows = rows.filter((row) => row.event_type === "admin_update");
    const singleRows = rows.filter((row) => row.event_type !== "admin_update");

    for (const row of singleRows) {
      try {
        if (!(await isEventEnabled(row.event_type))) {
          await admin
            .from("notification_email_outbox")
            .update({ status: "skipped", last_error: "global_switch_off", sent_at: new Date().toISOString() })
            .eq("id", row.id);
          skipped += 1;
          continue;
        }

        const recipients = await resolveRecipients(row);
        if (recipients.length === 0) {
          // member_welcome'da bu payload'da adres yok demektir (beklenmez);
          // diğer tiplerde kimse abone olmamış demektir.
          const directRecipient = row.event_type === "member_welcome"
            || row.event_type === "relocation_tool_report"
            || row.event_type === "relocation_tool_abandonment";
          const reason = directRecipient ? "no_recipient_email" : "no_subscribers";
          await admin
            .from("notification_email_outbox")
            .update({ status: "skipped", last_error: reason, recipient_count: 0, sent_at: new Date().toISOString() })
            .eq("id", row.id);
          skipped += 1;
          continue;
        }

        const { subject, html, text } = buildEmail(row);

        // Alıcılar birbirinin adresini görmesin diye tek tek gönderilir.
        for (const recipient of recipients) {
          await sendMailViaZohoSmtp(smtpConfig, {
            from: mailFrom,
            to: [recipient],
            replyTo: mailReplyTo || undefined,
            subject,
            html,
            text,
          });
        }

        await admin
          .from("notification_email_outbox")
          .update({
            status: "sent",
            recipient_count: recipients.length,
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

    // ── admin_update günlük özeti: claim'deki tüm satırlar tek mail ────────────
    // Alıcı başına yine ayrı gönderim yapılır (adres gizliliği); birleşen şey kayıtlardır.
    // Sayaçlar satır bazlı tutulur ki panel logu ("processed/sent") kuyruk gerçeğini yansıtsın.
    if (digestRows.length > 0) {
      const digestIds = digestRows.map((row) => row.id);
      try {
        if (!(await isEventEnabled("admin_update"))) {
          await admin
            .from("notification_email_outbox")
            .update({ status: "skipped", last_error: "global_switch_off", sent_at: new Date().toISOString() })
            .in("id", digestIds);
          skipped += digestRows.length;
        } else {
          const recipients = (await getSubscribers("admin_update")).map((subscriber) => subscriber.email);
          if (recipients.length === 0) {
            await admin
              .from("notification_email_outbox")
              .update({ status: "skipped", last_error: "no_subscribers", recipient_count: 0, sent_at: new Date().toISOString() })
              .in("id", digestIds);
            skipped += digestRows.length;
          } else {
            const { subject, html, text } = buildAdminUpdateEmail(digestRows.map((row) => row.payload));

            for (const recipient of recipients) {
              await sendMailViaZohoSmtp(smtpConfig, {
                from: mailFrom,
                to: [recipient],
                replyTo: mailReplyTo || undefined,
                subject,
                html,
                text,
              });
            }

            await admin
              .from("notification_email_outbox")
              .update({
                status: "sent",
                recipient_count: recipients.length,
                last_error: null,
                sent_at: new Date().toISOString(),
              })
              .in("id", digestIds);
            sent += digestRows.length;
          }
        }
      } catch (digestError: unknown) {
        const message = digestError instanceof Error ? digestError.message : "unexpected_error";
        console.error("send-notification-emails: admin_update ozeti basarisiz:", message);

        // Toplu gönderim çöktüyse satırlar TEK TEK geri bırakılır: attempts sınırı satır
        // bazlıdır ve bir sonraki claim yeniden birleştirip dener.
        for (const row of digestRows) {
          await admin
            .from("notification_email_outbox")
            .update({
              status: row.attempts + 1 >= MAX_ATTEMPTS ? "failed" : "pending",
              last_error: message.slice(0, 2000),
            })
            .eq("id", row.id);
        }
        failed += digestRows.length;
      }
    }

    return jsonResponse({ processed: rows.length, sent, skipped, failed }, 200, corsHeaders);
  } catch (error: unknown) {
    console.error("send-notification-emails error:", error);
    return jsonResponse({ error: "internal_server_error" }, 500, corsHeaders);
  }
});
