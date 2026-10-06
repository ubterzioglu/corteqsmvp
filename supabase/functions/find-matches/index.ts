import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";
import { z } from "https://esm.sh/zod@3.25.76";

import { enforceRateLimit } from "../_shared/rate-limit.ts";
import { jsonResponse } from "../_shared/http.ts";

const ALLOWED_ORIGINS = new Set([
  "https://corteqs.net",
  "https://www.corteqs.net",
  "http://localhost:5173",
  "http://localhost:4173",
]);
const MAX_BODY_BYTES = 16_000;
const RATE_LIMIT_MAX = 8;
const RATE_LIMIT_WINDOW_SECONDS = 600;
const GEMINI_MODEL = "models/gemini-2.5-flash";

const RequestSchema = z.object({
  sourceSubmissionId: z.string().uuid().optional(),
  offers_needs: z.string().trim().min(5).max(2_000),
  field: z.string().trim().max(160).optional(),
  city: z.string().trim().max(120).optional(),
  country: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  persist: z.boolean().optional(),
});

const AiMatchSchema = z.object({
  id: z.string().uuid(),
  score: z.number().min(0).max(100),
  reason: z.string().trim().min(1).max(500),
});

const RankMatchesFunctionSchema = {
  name: "rank_matches",
  description: "En uygun 5 eslesmeyi dondur.",
  parameters: {
    type: "OBJECT",
    properties: {
      matches: {
        type: "ARRAY",
        maxItems: 5,
        items: {
          type: "OBJECT",
          properties: {
            id: { type: "STRING" },
            score: { type: "NUMBER" },
            reason: { type: "STRING" },
          },
          required: ["id", "score", "reason"],
        },
      },
    },
    required: ["matches"],
  },
};

type Candidate = {
  id: string;
  field: string;
  category: string | null;
  offers_needs: string | null;
};

const STOPWORDS = new Set([
  "ve", "ile", "bir", "bu", "su", "de", "da", "mi", "mi", "mu", "mu", "ben", "sen", "biz",
  "icin", "ama", "veya", "ya", "ki", "den", "dan", "cok", "az", "the", "a",
  "an", "and", "or", "of", "to", "in", "on", "at", "is", "are", "with", "for", "my", "i",
]);

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

async function readJsonWithLimit(req: Request, maxBytes: number) {
  const text = await req.text();
  if (new TextEncoder().encode(text).length > maxBytes) {
    throw new Error("PAYLOAD_TOO_LARGE");
  }

  return JSON.parse(text);
}

function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function keywordScore(query: string, candidate: Candidate): number {
  const queryTokens = new Set(tokenize(query));
  if (!queryTokens.size) return 0;

  const candidateText = [candidate.offers_needs, candidate.field, candidate.category].filter(Boolean).join(" ");
  const candidateTokens = new Set(tokenize(candidateText));

  let overlap = 0;
  for (const token of queryTokens) {
    if (candidateTokens.has(token)) overlap += 1;
  }

  return overlap / queryTokens.size;
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!supabaseUrl || !serviceKey || !geminiApiKey) {
      throw new Error("Missing one of SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or GEMINI_API_KEY");
    }

    // SG7: Kimlik doğrulama zorunlu
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Missing authorization" }, 401, corsHeaders);
    }
    const token = authHeader.slice(7);
    const authClient = createClient(supabaseUrl, supabaseUrl.includes("localhost") ? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" : serviceKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return jsonResponse({ error: "Invalid token" }, 401, corsHeaders);
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    // SG9: kimliği doğrulanmış kullanıcıda sınır user.id'ye göre (IP sahte başlıkla değişebilir).
    await enforceRateLimit(
      supabase,
      req,
      "find-matches",
      RATE_LIMIT_MAX,
      RATE_LIMIT_WINDOW_SECONDS,
      user.id,
    );

    const payload = RequestSchema.parse(await readJsonWithLimit(req, MAX_BODY_BYTES));

    // SG7: persist=true ise yalnız kullanıcının kendi submissions'ına yazabilir
    if (payload.persist && payload.sourceSubmissionId) {
      const { data: ownSubmission } = await supabase
        .from("submissions")
        .select("id")
        .eq("id", payload.sourceSubmissionId)
        .eq("user_id", user.id)
        .single();
      if (!ownSubmission) {
        return jsonResponse({ error: "Cannot persist: not your submission" }, 403, corsHeaders);
      }
    }

    let query = supabase
      .from("submissions")
      .select("id, field, category, offers_needs")
      .not("offers_needs", "is", null)
      .order("created_at", { ascending: false })
      .limit(200);

    if (payload.sourceSubmissionId) {
      query = query.neq("id", payload.sourceSubmissionId);
    }

    const { data: candidates, error } = await query;
    if (error) throw error;

    const queryText = [
      payload.offers_needs,
      payload.field,
      payload.city,
      payload.country,
      payload.category,
    ]
      .filter(Boolean)
      .join(" ");

    const scored = ((candidates ?? []) as Candidate[])
      .map((candidate) => ({ candidate, score: keywordScore(queryText, candidate) }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 20);

    if (!scored.length) {
      return jsonResponse({ matches: [] }, 200, corsHeaders);
    }

    const candidatesForAI = scored.map((entry) => ({
      id: entry.candidate.id,
      category: entry.candidate.category,
      field: entry.candidate.field,
      offers_needs: entry.candidate.offers_needs,
      keyword_score: Math.round(entry.score * 100),
    }));

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent`, {
      method: "POST",
      headers: {
        "x-goog-api-key": geminiApiKey,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: "Sen bir diaspora aginda arz/talep eslestirme asistanisin. Kisisel veri aciklama. En uygun 5 adayi sec ve Turkce kisa gerekce yaz.",
          }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: `Arz/talep:\n${queryText}\n\nAdaylar:\n${JSON.stringify(candidatesForAI, null, 2)}` }],
          },
        ],
        tools: [
          {
            functionDeclarations: [RankMatchesFunctionSchema],
          },
        ],
        toolConfig: {
          functionCallingConfig: {
            mode: "ANY",
            allowedFunctionNames: ["rank_matches"],
          },
        },
      }),
    });

    if (!aiResponse.ok) {
      const text = await aiResponse.text();
      console.error("AI ranking error:", aiResponse.status, text);
      throw new Error("AI ranking failed");
    }

    const aiData = await aiResponse.json();
    const toolCallArgs = extractFunctionArgs(aiData, "rank_matches");
    if (!toolCallArgs) {
      return jsonResponse({ matches: [] }, 200, corsHeaders);
    }

    const args = z.object({ matches: z.array(AiMatchSchema).max(5) }).parse(toolCallArgs);
    const candidateMap = new Map(scored.map((entry) => [entry.candidate.id, entry.candidate]));

    const enriched = args.matches
      .map((match) => {
        const candidate = candidateMap.get(match.id);
        if (!candidate) return null;
        return {
          id: candidate.id,
          fullname: "Potansiyel eslesme",
          city: "",
          country: "",
          field: candidate.field,
          category: candidate.category,
          score: match.score,
          reason: match.reason,
        };
      })
      .filter(Boolean);

    if (payload.persist && payload.sourceSubmissionId) {
      const rows = enriched.map((match) => ({
        source_submission_id: payload.sourceSubmissionId,
        matched_submission_id: match!.id,
        match_score: match!.score,
        match_reason: match!.reason,
      }));

      if (rows.length) {
        const { error: insertError } = await supabase.from("matches").upsert(rows, {
          onConflict: "source_submission_id,matched_submission_id",
          ignoreDuplicates: true,
        });
        if (insertError) console.error("matches insert error:", insertError);
      }
    }

    return jsonResponse({ matches: enriched }, 200, corsHeaders);
  } catch (error) {
    console.error("find-matches error:", error);

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
