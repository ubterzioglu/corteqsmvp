import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { z } from "https://esm.sh/zod@3.25.76";

const ALLOWED_ORIGINS = new Set([
  "https://corteqs.net",
  "https://www.corteqs.net",
  "http://localhost:5173",
  "http://localhost:4173",
]);
const MAX_BODY_BYTES = 1_024;
const RATE_LIMIT_MAX = 4;
const RATE_LIMIT_WINDOW_SECONDS = 3_600;

const RequestSchema = z.object({
  submissionId: z.string().uuid(),
});

const SubmissionSchema = z.object({
  id: z.string().uuid(),
  form_type: z.string(),
  category: z.string().nullable(),
  fullname: z.string(),
  country: z.string(),
  city: z.string(),
  business: z.string().nullable(),
  field: z.string(),
  email: z.string().email(),
  phone: z.string(),
  referral_code: z.string().nullable(),
  referral_detail: z.string().nullable(),
  referral_source: z.string().nullable(),
  description: z.string().nullable(),
  contest_interest: z.boolean().nullable(),
  linkedin: z.string().nullable(),
  instagram: z.string().nullable(),
  tiktok: z.string().nullable(),
  facebook: z.string().nullable(),
  twitter: z.string().nullable(),
  website: z.string().nullable(),
  created_at: z.string(),
});

function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function getClientKey(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return req.headers.get("cf-connecting-ip")
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
}

async function readJsonWithLimit(req: Request, maxBytes: number) {
  const text = await req.text();
  if (new TextEncoder().encode(text).length > maxBytes) {
    throw new Error("PAYLOAD_TOO_LARGE");
  }

  return JSON.parse(text);
}

async function enforceRateLimit(supabase: ReturnType<typeof createClient>, req: Request, scope: string, maxRequests: number, windowSeconds: number) {
  const clientKey = getClientKey(req);
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStartedAt = new Date(Math.floor(now / windowMs) * windowMs).toISOString();

  const { data: existing, error: fetchError } = await supabase
    .from("edge_rate_limits")
    .select("request_count, window_started_at")
    .eq("scope", scope)
    .eq("client_key", clientKey)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (!existing) {
    const { error: insertError } = await supabase.from("edge_rate_limits").insert({
      scope,
      client_key: clientKey,
      window_started_at: windowStartedAt,
      request_count: 1,
    });
    if (insertError) throw insertError;
    return;
  }

  const sameWindow = existing.window_started_at === windowStartedAt;
  const nextCount = sameWindow ? Number(existing.request_count ?? 0) + 1 : 1;

  if (sameWindow && nextCount > maxRequests) {
    throw new Error("RATE_LIMITED");
  }

  const { error: updateError } = await supabase
    .from("edge_rate_limits")
    .update({
      request_count: nextCount,
      window_started_at: windowStartedAt,
    })
    .eq("scope", scope)
    .eq("client_key", clientKey);

  if (updateError) throw updateError;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function buildAdminHtml(submission: z.infer<typeof SubmissionSchema>) {
  const rows = [
    ["Tur", submission.form_type],
    ["Kategori", submission.category ?? "-"],
    ["Ad Soyad", submission.fullname],
    ["Ulke", submission.country],
    ["Sehir", submission.city],
    ["Isletme", submission.business ?? "-"],
    ["Alan", submission.field],
    ["E-posta", submission.email],
    ["Telefon", submission.phone],
    ["Referral kaynagi", submission.referral_source ?? "-"],
    ["Referral detayi", submission.referral_detail ?? "-"],
    ["Referral kodu", submission.referral_code ?? "-"],
    ["Aciklama", submission.description ?? "-"],
    ["Yarisma ilgisi", submission.contest_interest ? "Evet" : "Hayir"],
    ["LinkedIn", submission.linkedin ?? "-"],
    ["Instagram", submission.instagram ?? "-"],
    ["TikTok", submission.tiktok ?? "-"],
    ["Facebook", submission.facebook ?? "-"],
    ["Twitter", submission.twitter ?? "-"],
    ["Website", submission.website ?? "-"],
    ["Tarih", new Date(submission.created_at).toLocaleString("tr-TR", { timeZone: "Europe/Berlin" })],
  ];

  return `
    <h2>Yeni CorteQS basvurusu</h2>
    <p>Asagidaki form kaydi alindi.</p>
    <table cellpadding="8" cellspacing="0" border="1" style="border-collapse: collapse; border-color: #d4d4d8;">
      ${rows
        .map(([label, value]) => `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>`)
        .join("")}
    </table>
  `;
}

function buildConfirmationHtml(submission: z.infer<typeof SubmissionSchema>) {
  return `
    <h2>Kaydiniz alindi</h2>
    <p>Merhaba ${escapeHtml(submission.fullname)},</p>
    <p>CorteQS uzerinden ilettiginiz basvuru bize ulasti. Gerekli durumlarda sizinle e-posta veya telefon yoluyla iletisime gececegiz.</p>
    <p>Basvuru tipi: <strong>${escapeHtml(submission.form_type)}</strong></p>
    <p>Kayit zamani: <strong>${new Date(submission.created_at).toLocaleString("tr-TR", { timeZone: "Europe/Berlin" })}</strong></p>
  `;
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

Deno.serve(async (request) => {
  const corsHeaders = buildCorsHeaders(request);
  const origin = request.headers.get("Origin");

  if (request.method === "OPTIONS") {
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return jsonResponse({ error: "Origin not allowed" }, 403, corsHeaders);
    }
    return new Response(null, { headers: corsHeaders });
  }

  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return jsonResponse({ error: "Origin not allowed" }, 403, corsHeaders);
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const mailFrom = Deno.env.get("MAIL_FROM");
    const mailToAdmin = Deno.env.get("MAIL_TO_ADMIN");
    const mailReplyTo = Deno.env.get("MAIL_REPLY_TO");
    const sendConfirmation = Deno.env.get("MAIL_SEND_CONFIRMATION") === "true";

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    await enforceRateLimit(supabase, request, "send-submission-email", RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SECONDS);

    const { submissionId } = RequestSchema.parse(await readJsonWithLimit(request, MAX_BODY_BYTES));

    if (!resendApiKey || !mailFrom || !mailToAdmin) {
      console.warn("Mail function skipped because env vars are missing.");
      return jsonResponse({ skipped: true }, 200, corsHeaders);
    }

    const { data: submissionRow, error: submissionError } = await supabase
      .from("submissions")
      .update({ notification_sent_at: new Date().toISOString() })
      .eq("id", submissionId)
      .is("notification_sent_at", null)
      .select("id, form_type, category, fullname, country, city, business, field, email, phone, referral_code, referral_detail, referral_source, description, contest_interest, linkedin, instagram, tiktok, facebook, twitter, website, created_at")
      .single();

    if (submissionError || !submissionRow) {
      return jsonResponse({ skipped: true }, 200, corsHeaders);
    }

    const submission = SubmissionSchema.parse(submissionRow);

    await sendWithResend(resendApiKey, {
      from: mailFrom,
      to: [mailToAdmin],
      reply_to: mailReplyTo || undefined,
      subject: `Yeni CorteQS basvurusu: ${submission.fullname}`,
      html: buildAdminHtml(submission),
    });

    if (sendConfirmation) {
      await sendWithResend(resendApiKey, {
        from: mailFrom,
        to: [submission.email],
        reply_to: mailReplyTo || mailToAdmin,
        subject: "CorteQS basvurunuz alindi",
        html: buildConfirmationHtml(submission),
      });
    }

    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (error) {
    console.error("send-submission-email error:", error);

    if (error instanceof z.ZodError) {
      return jsonResponse({ error: "Invalid request payload" }, 400, corsHeaders);
    }
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      return jsonResponse({ error: "Payload too large" }, 413, corsHeaders);
    }
    if (error instanceof Error && error.message === "RATE_LIMITED") {
      return jsonResponse({ error: "Too many requests" }, 429, corsHeaders);
    }

    return jsonResponse({ error: "Internal server error" }, 500, corsHeaders);
  }
});
