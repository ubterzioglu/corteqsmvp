import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type QuestionType = "short_text" | "long_text" | "single_choice" | "multiple_choice" | "rating" | "yes_no" | "email";

type SubmitPayload = {
  surveySlug?: string;
  respondent?: {
    name?: string;
    email?: string;
    contactOptIn?: boolean;
  };
  answers?: Array<{ questionId?: string; value?: unknown }>;
  meta?: {
    startedAt?: string;
    honeypot?: string;
  };
};

const MAX_BODY_BYTES = 64_000;
const MIN_SUBMIT_SECONDS = 3;
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_SINGLE_SUBMISSION = 1;
const RATE_LIMIT_MAX_MULTI_SUBMISSION = 10;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}

function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? "unknown";
}

async function readJsonWithLimit(req: Request, limit: number) {
  const text = await req.text();
  if (new TextEncoder().encode(text).length > limit) {
    throw new Error("PAYLOAD_TOO_LARGE");
  }
  return JSON.parse(text) as SubmitPayload;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeYesNo(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "yes" || v === "evet" || v === "true") return true;
    if (v === "no" || v === "hayir" || v === "hayır" || v === "false") return false;
  }
  return null;
}

function validateAnswer(question: { type: QuestionType; options: unknown }, value: unknown): string | null {
  const options = Array.isArray(question.options) ? question.options.map(String) : [];

  switch (question.type) {
    case "short_text": {
      if (typeof value !== "string") return "short_text must be string";
      if (value.trim().length > 300) return "short_text max 300";
      return null;
    }
    case "long_text": {
      if (typeof value !== "string") return "long_text must be string";
      if (value.trim().length > 3000) return "long_text max 3000";
      return null;
    }
    case "single_choice": {
      if (typeof value !== "string") return "single_choice must be string";
      if (!options.includes(value)) return "single_choice must be in options";
      return null;
    }
    case "multiple_choice": {
      if (!Array.isArray(value)) return "multiple_choice must be array";
      const allValid = value.every((item) => typeof item === "string" && options.includes(item));
      if (!allValid) return "multiple_choice contains invalid options";
      return null;
    }
    case "rating": {
      if (typeof value !== "number" || !Number.isFinite(value)) return "rating must be number";
      if (value < 1 || value > 5) return "rating must be 1-5";
      return null;
    }
    case "yes_no": {
      if (normalizeYesNo(value) === null) return "yes_no must be boolean or yes/no";
      return null;
    }
    case "email": {
      if (typeof value !== "string") return "email must be string";
      if (!isEmail(value.trim())) return "email invalid";
      return null;
    }
    default:
      return "unsupported question type";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({}, 200);
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return json({ error: "Service not configured" }, 500);

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const payload = await readJsonWithLimit(req, MAX_BODY_BYTES);

    if ((payload.meta?.honeypot ?? "").trim() !== "") {
      return json({ error: "Invalid request" }, 400);
    }

    const startedAt = payload.meta?.startedAt ? new Date(payload.meta.startedAt).getTime() : NaN;
    if (!Number.isFinite(startedAt)) {
      return json({ error: "Invalid startedAt" }, 400);
    }

    const elapsedSeconds = (Date.now() - startedAt) / 1000;
    if (elapsedSeconds < MIN_SUBMIT_SECONDS) {
      return json({ error: "Submitted too quickly" }, 429);
    }

    const surveySlug = payload.surveySlug?.trim();
    if (!surveySlug) return json({ error: "surveySlug is required" }, 400);

    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .select("id,status,starts_at,ends_at,allow_multiple_submissions")
      .eq("slug", surveySlug)
      .maybeSingle();

    if (surveyError) return json({ error: "Failed to fetch survey" }, 500);
    if (!survey) return json({ error: "Survey not found" }, 404);
    if (survey.status !== "published") return json({ error: "Survey is not active" }, 403);

    const now = Date.now();
    if (survey.starts_at && new Date(survey.starts_at).getTime() > now) {
      return json({ error: "Survey has not started" }, 403);
    }
    if (survey.ends_at && new Date(survey.ends_at).getTime() < now) {
      return json({ error: "Survey is closed" }, 403);
    }

    const ip = getClientIp(req);
    const ipHashInput = `${ip}:${Deno.env.get("SURVEY_IP_HASH_SALT") ?? "default-salt"}`;
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ipHashInput));
    const ipHash = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");

    const windowMs = RATE_LIMIT_WINDOW_SECONDS * 1000;
    const windowStartedAt = new Date(Math.floor(now / windowMs) * windowMs).toISOString();
    const rateLimitMax = survey.allow_multiple_submissions ? RATE_LIMIT_MAX_MULTI_SUBMISSION : RATE_LIMIT_MAX_SINGLE_SUBMISSION;

    const { data: existingRl } = await supabase
      .from("edge_rate_limits")
      .select("id,request_count,window_started_at")
      .eq("scope", `survey-submit:${survey.id}`)
      .eq("client_key", ipHash)
      .maybeSingle();

    if (!existingRl) {
      await supabase.from("edge_rate_limits").insert({
        scope: `survey-submit:${survey.id}`,
        client_key: ipHash,
        request_count: 1,
        window_started_at: windowStartedAt,
      });
    } else {
      const sameWindow = existingRl.window_started_at === windowStartedAt;
      const nextCount = sameWindow ? Number(existingRl.request_count ?? 0) + 1 : 1;
      if (sameWindow && nextCount > rateLimitMax) {
        return json({ error: "Too many requests" }, 429);
      }
      await supabase
        .from("edge_rate_limits")
        .update({ request_count: nextCount, window_started_at: windowStartedAt })
        .eq("id", existingRl.id);
    }

    const { data: questions, error: questionsError } = await supabase
      .from("survey_questions")
      .select("id,type,is_required,options")
      .eq("survey_id", survey.id)
      .order("sort_order", { ascending: true });

    if (questionsError) return json({ error: "Failed to fetch questions" }, 500);

    const answers = Array.isArray(payload.answers) ? payload.answers : [];
    const answerMap = new Map<string, unknown>();
    for (const answer of answers) {
      if (answer?.questionId) answerMap.set(answer.questionId, answer.value);
    }

    for (const question of questions ?? []) {
      const value = answerMap.get(question.id);
      if (question.is_required) {
        const missing = value === undefined || value === null || (typeof value === "string" && value.trim() === "") || (Array.isArray(value) && value.length === 0);
        if (missing) {
          return json({ error: "Required answer missing", questionId: question.id }, 400);
        }
      }
      if (value !== undefined && value !== null && !(typeof value === "string" && value.trim() === "")) {
        const validationError = validateAnswer({ type: question.type as QuestionType, options: question.options }, value);
        if (validationError) return json({ error: validationError, questionId: question.id }, 400);
      }
    }

    if (!survey.allow_multiple_submissions) {
      const { data: recent } = await supabase
        .from("survey_responses")
        .select("id")
        .eq("survey_id", survey.id)
        .eq("ip_hash", ipHash)
        .gte("submitted_at", new Date(now - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (recent && recent.length > 0) {
        return json({ error: "Multiple submissions are disabled" }, 409);
      }
    }

    const respondentName = payload.respondent?.name?.trim() || null;
    const respondentEmail = payload.respondent?.email?.trim() || null;
    if (respondentEmail && !isEmail(respondentEmail)) {
      return json({ error: "Invalid respondent email" }, 400);
    }

    const { data: createdResponse, error: responseError } = await supabase
      .from("survey_responses")
      .insert({
        survey_id: survey.id,
        respondent_name: respondentName,
        respondent_email: respondentEmail,
        contact_opt_in: Boolean(payload.respondent?.contactOptIn),
        ip_hash: ipHash,
        user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
      })
      .select("id")
      .single();

    if (responseError || !createdResponse) {
      return json({ error: "Failed to save response" }, 500);
    }

    const validQuestionIds = new Set((questions ?? []).map((q) => q.id));
    const answerRows = answers
      .filter((a) => a.questionId && validQuestionIds.has(a.questionId))
      .map((a) => ({
        response_id: createdResponse.id,
        question_id: a.questionId as string,
        answer_value: a.value ?? null,
      }));

    if (answerRows.length > 0) {
      const { error: answerInsertError } = await supabase.from("survey_answers").insert(answerRows);
      if (answerInsertError) {
        return json({ error: "Failed to save answers" }, 500);
      }
    }

    return json({ ok: true, responseId: createdResponse.id }, 200);
  } catch (error) {
    console.error("submit-survey-response error", error);
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      return json({ error: "Payload too large" }, 413);
    }
    return json({ error: "Unexpected error" }, 500);
  }
});
