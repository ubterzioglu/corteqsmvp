// Public directory semantic-search gateway.
// Query embeddings stay server-side; browser code never receives GEMINI_API_KEY.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";
import { z } from "https://esm.sh/zod@3.25.76";
import {
  buildAssistantCorsHeaders,
  isAssistantOriginAllowed,
  readJsonWithLimit,
} from "../_shared/edge-security.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

const MAX_BODY_BYTES = 4_096;
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_SECONDS = 600;
const EMBEDDING_MODEL = Deno.env.get("GEMINI_EMBEDDING_MODEL") ?? "models/gemini-embedding-001";

const RequestSchema = z.object({
  p_search_text: z.string().trim().min(1).max(200),
  p_role_key: z.string().trim().max(120).nullable(),
  p_country_code: z.string().trim().max(8).nullable(),
  p_city: z.string().trim().max(160).nullable(),
  p_featured_only: z.boolean(),
  p_limit: z.number().int().min(1).max(100),
  p_offset: z.number().int().min(0).max(10_000),
}).strict();

function jsonResponse(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

async function embedQuery(searchText: string, apiKey: string | undefined): Promise<number[] | null> {
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          content: { parts: [{ text: searchText }] },
          taskType: "RETRIEVAL_QUERY",
          outputDimensionality: 1_536,
        }),
      },
    );

    if (!response.ok) {
      console.error("directory-search embed error", response.status);
      return null;
    }

    const payload = await response.json();
    const values = payload?.embedding?.values;
    return Array.isArray(values) && values.length === 1_536 ? values : null;
  } catch (error) {
    console.error("directory-search embed exception", error);
    return null;
  }
}

Deno.serve(async (req) => {
  const corsHeaders = buildAssistantCorsHeaders(req);
  const origin = req.headers.get("Origin");

  // Bu fonksiyon anonime acik ve Gemini kotasi tuketir; Origin eksikligi de red.
  if (!isAssistantOriginAllowed(origin)) {
    return jsonResponse({ error: "Origin not allowed" }, 403, corsHeaders);
  }

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("Missing Supabase configuration");

    const supabase = createClient(supabaseUrl, serviceKey);
    await enforceRateLimit(supabase, req, "directory-search", RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SECONDS);

    const payload = RequestSchema.parse(await readJsonWithLimit(req, MAX_BODY_BYTES));
    const embedding = await embedQuery(payload.p_search_text, Deno.env.get("GEMINI_API_KEY"));

    const { data, error } = await supabase.rpc("search_directory_catalog", {
      ...payload,
      p_query_embedding: embedding ? JSON.stringify(embedding) : null,
    });
    if (error) throw error;

    return jsonResponse({ rows: data ?? [], semantic: embedding !== null }, 200, corsHeaders);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ error: "Gecersiz istek." }, 400, corsHeaders);
    }
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      return jsonResponse({ error: "Istek govdesi cok buyuk." }, 413, corsHeaders);
    }
    if (error instanceof Error && error.message === "RATE_LIMITED") {
      return jsonResponse({ error: "Cok fazla istek gonderdiniz." }, 429, corsHeaders);
    }
    console.error("directory-search error", error);
    return jsonResponse({ error: "Beklenmeyen bir hata olustu." }, 500, corsHeaders);
  }
});
