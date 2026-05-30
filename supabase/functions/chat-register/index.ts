import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { z } from "https://esm.sh/zod@3.25.76";

const ALLOWED_ORIGINS = new Set([
  "https://corteqs.net",
  "https://www.corteqs.net",
  "http://localhost:5173",
  "http://localhost:4173",
]);
const MAX_BODY_BYTES = 24_000;
const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW_SECONDS = 600;
const GEMINI_MODEL = "models/gemini-2.5-flash";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2_000),
});

const CollectedSchema = z.object({
  category: z.string().trim().max(80).optional(),
  fullname: z.string().trim().max(160).optional(),
  country: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),
  business: z.string().trim().max(160).optional(),
  field: z.string().trim().max(160).optional(),
  email: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(40).optional(),
  offers_needs: z.string().trim().max(2_000).optional(),
  referral_code: z.string().trim().max(64).optional(),
  contest_interest: z.boolean().optional(),
}).partial();

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(30),
  collected: CollectedSchema.optional(),
});

const ResponseSchema = z.object({
  message: z.string().trim().min(1).max(2_000),
  extracted: CollectedSchema.optional(),
  request_upload: z.boolean().optional(),
  status: z.enum(["in_progress", "ready_to_submit", "submit"]),
});

const ChatResponseFunctionSchema = {
  name: "chat_response",
  description: "Kullaniciya verilecek sohbet cevabi ve cikarilan alanlar.",
  parameters: {
    type: "OBJECT",
    properties: {
      message: { type: "STRING" },
      extracted: {
        type: "OBJECT",
        properties: {
          category: {
            type: "STRING",
            enum: [
              "danisman",
              "isletme",
              "dernek",
              "vakif",
              "radyo-tv",
              "blogger-vlogger",
              "sehir-elcisi",
              "bireysel",
            ],
          },
          fullname: { type: "STRING" },
          country: { type: "STRING" },
          city: { type: "STRING" },
          business: { type: "STRING" },
          field: { type: "STRING" },
          email: { type: "STRING" },
          phone: { type: "STRING" },
          offers_needs: { type: "STRING" },
          referral_code: { type: "STRING" },
          contest_interest: { type: "BOOLEAN" },
        },
      },
      request_upload: { type: "BOOLEAN" },
      status: {
        type: "STRING",
        enum: ["in_progress", "ready_to_submit", "submit"],
      },
    },
    required: ["message", "status"],
  },
};

function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

async function enforceRateLimit(req: Request, scope: string, maxRequests: number, windowSeconds: number) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("RATE_LIMIT_CONFIG_MISSING");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
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

function redactSensitiveText(value: string, fullname?: string): string {
  let nextValue = value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[redacted-phone]");

  if (fullname) {
    nextValue = nextValue.replaceAll(fullname, "[redacted-name]");
  }

  return nextValue;
}

function toGeminiContents(messages: z.infer<typeof MessageSchema>[]) {
  return messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));
}

function extractFunctionArgs(payload: unknown, functionName: string) {
  const functionCall =
    (payload as { candidates?: Array<{ content?: { parts?: Array<{ functionCall?: { name?: string; args?: unknown } }> } }> })
      ?.candidates?.[0]?.content?.parts?.find((part) => part.functionCall?.name === functionName)?.functionCall;

  if (!functionCall) {
    return null;
  }

  return functionCall.args ?? null;
}

const SYSTEM_PROMPT = `Sen CorteQS Diaspora Connect platformunun kayit asistanisin.
Gorevin: kullaniciyla Turkce, kisa ve net bir sohbet kurarak kayit bilgilerini toplamak.

Toplanmasi gereken alanlar:
1. category — danisman | isletme | dernek | vakif | radyo-tv | blogger-vlogger | sehir-elcisi | bireysel
2. fullname
3. country
4. city
5. field
6. email
7. phone
8. offers_needs
9. referral_code

Kurallar:
- Her zaman Turkce konus.
- Kisa ve dogal mesajlar ver.
- Kullanici cevabindan mumkun oldugu kadar cok alan cikar.
- Telefon ulke kodu yoksa duzeltme iste.
- E-posta gecersizse duzeltme iste.
- Tum zorunlu alanlar tamamlandiysa status="ready_to_submit" don.
- Kullanici onay verirse status="submit" don.
- Sadece istenen JSON tool argumanlarini don.`;

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  const origin = req.headers.get("Origin");

  if (req.method === "OPTIONS") {
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return jsonResponse({ error: "Origin not allowed" }, 403, corsHeaders);
    }
    return new Response(null, { headers: corsHeaders });
  }

  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return jsonResponse({ error: "Origin not allowed" }, 403, corsHeaders);
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);
  }

  try {
    await enforceRateLimit(req, "chat-register", RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SECONDS);

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) throw new Error("GEMINI_API_KEY is not configured");

    const parsedRequest = RequestSchema.parse(await readJsonWithLimit(req, MAX_BODY_BYTES));
    const sanitizedCollected = parsedRequest.collected
      ? {
          ...parsedRequest.collected,
          fullname: undefined,
          email: undefined,
          phone: undefined,
        }
      : undefined;
    const sanitizedMessages = parsedRequest.messages.map((message) => ({
      ...message,
      content: redactSensitiveText(message.content, parsedRequest.collected?.fullname),
    }));
    const collectedSummary = sanitizedCollected
      ? `\n\nSu ana kadar toplanan bilgiler: ${JSON.stringify(sanitizedCollected)}`
      : "";

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent`, {
      method: "POST",
      headers: {
        "x-goog-api-key": geminiApiKey,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT + collectedSummary }],
        },
        contents: toGeminiContents(sanitizedMessages),
        tools: [
          {
            functionDeclarations: [ChatResponseFunctionSchema],
          },
        ],
        toolConfig: {
          functionCallingConfig: {
            mode: "ANY",
            allowedFunctionNames: ["chat_response"],
          },
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return jsonResponse({ error: "AI hatasi" }, response.status >= 400 && response.status < 600 ? response.status : 500, corsHeaders);
    }

    const data = await response.json();
    const rawArgs = extractFunctionArgs(data, "chat_response");
    if (!rawArgs) {
      return jsonResponse(
        {
          message: "Bir seyler ters gitti, tekrar dener misiniz?",
          status: "in_progress",
        },
        200,
        corsHeaders,
      );
    }

    const args = ResponseSchema.parse(rawArgs);
    return jsonResponse(args, 200, corsHeaders);
  } catch (error) {
    console.error("chat-register error:", error);

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
