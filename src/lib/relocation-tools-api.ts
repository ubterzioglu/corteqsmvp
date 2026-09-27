// src/lib/relocation-tools-api.ts
// Supabase RPC + okuma çağrıları — relocation-api.ts deseni.
// Mutasyonlar generic security-definer RPC üzerinden (docs/10tool/00 §RPC); araç/soru listeleri RLS'li SELECT.
// 27.09.2026: `const db = supabase as any` şimi KALDIRILDI. Eski gerekçe
// ("types.ts relocation_tool_* için regenerate edilmedi") ölçümle çürüdü — bu
// tablolar zaten tipliydi. Gerçek sebep `jsonb` sütunlarıydı:
//   - YAZMA yönü (`p_answer`, `p_context`) → `toJson` (src/lib/supabase-json.ts)
//   - OKUMA yönü (`options`/`validation`/`scoring`, `answer`) → `fromJson` ya da
//     aşağıdaki `asToolQuestionRow` dar dönüşümü
// RPC dönüşleri tiplenirken hâlâ `as unknown as T` kullanılır.

import { supabase } from "@/integrations/supabase/client";
import { fromJson, toJson } from "@/lib/supabase-json";
import type {
  RelocationToolQuestionRow,
  RelocationToolReportRequest,
  RelocationToolResultPayload,
  RelocationToolRow,
  RelocationToolWithQuestions,
  ToolAnswerValue,
  ToolEventType,
  ToolMode,
  ToolSessionStart,
  ToolSessionResume,
} from "@/lib/relocation-tools-types";


// `options` / `validation` / `scoring` sütunları üretilen tipte `Json`, alan
// tipinde ise yapılandırılmış (`ToolQuestionOption[]`, `Record<string, unknown>`).
// İkisi örtüşmediği için satırı daraltmak açık dönüşüm ister. Çalışma zamanında
// HİÇBİR ŞEY yapmaz — kaldırılan modül geneli `supabase as any` şiminin yaptığının
// aynısı, ama tek noktada ve gerekçeli. DOĞRULAMA DEĞİLDİR: sütunda eski şemalı
// bir nesne varsa burada yakalanmaz.
const asToolQuestionRow = (row: unknown) => row as RelocationToolQuestionRow;

// ---------------------------------------------------------------------------
// Araç + soru bankası (referans — RLS authenticated read)
// ---------------------------------------------------------------------------

export async function listTools(): Promise<RelocationToolRow[]> {
  const { data, error } = await supabase
    .from("relocation_tools")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as RelocationToolRow[];
}

export async function getToolBySlug(slug: string): Promise<RelocationToolWithQuestions | null> {
  const { data: tool, error: toolError } = await supabase
    .from("relocation_tools")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (toolError) throw toolError;
  if (!tool) return null;

  const { data: questions, error: qError } = await supabase
    .from("relocation_tool_questions")
    .select("*")
    .eq("tool_key", (tool as RelocationToolRow).key)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (qError) throw qError;

  return {
    ...(tool as RelocationToolRow),
    questions: (questions ?? []).map(asToolQuestionRow),
  };
}

// ---------------------------------------------------------------------------
// Oturum yaşam döngüsü (mutasyon = generic RPC)
// ---------------------------------------------------------------------------

export async function startSession(
  toolKey: string,
  mode: ToolMode,
  sourceMoveId?: string,
): Promise<ToolSessionStart> {
  const { data, error } = await supabase.rpc("relocation_tool_start_session", {
    p_tool_key: toolKey,
    p_mode: mode,
    p_source_move_id: sourceMoveId ?? null,
  });
  if (error) throw error;
  return data as unknown as ToolSessionStart;
}

export async function saveAnswer(
  sessionId: string,
  questionKey: string,
  answer: ToolAnswerValue,
): Promise<void> {
  const { error } = await supabase.rpc("relocation_tool_save_answer", {
    p_session_id: sessionId,
    p_question_key: questionKey,
    p_answer: toJson(answer),
  });
  if (error) throw error;
}

export async function getSessionForResume(sessionId: string): Promise<ToolSessionResume | null> {
  const { data: session, error: sessionError } = await supabase
    .from("relocation_tool_sessions")
    .select("id, tool_key, mode, status")
    .eq("id", sessionId)
    .maybeSingle();
  if (sessionError) throw sessionError;
  if (!session || session.status !== "in_progress") return null;

  const { data: answerRows, error: answersError } = await supabase
    .from("relocation_tool_answers")
    .select("question_key, answer")
    .eq("session_id", sessionId);
  if (answersError) throw answersError;

  // `answer` jsonb'dir; üretilen tip `Json` verir, uygulama `ToolAnswerValue` bekler.
  // `fromJson` bu daraltmanın greplenebilir tek geçiş noktasıdır (doğrulama DEĞİL).
  const answers = Object.fromEntries(
    (answerRows ?? []).map((row) => [
      row.question_key,
      fromJson<ToolAnswerValue>(row.answer) as ToolAnswerValue,
    ]),
  );

  return {
    session_id: session.id as string,
    tool_key: session.tool_key as string,
    mode: session.mode as ToolMode,
    answers,
  };
}

export async function completeSession(
  sessionId: string,
): Promise<RelocationToolResultPayload> {
  const { data, error } = await supabase.rpc("relocation_tool_complete_session", {
    p_session_id: sessionId,
  });
  if (error) throw error;
  return data as unknown as RelocationToolResultPayload;
}

export async function recordEvent(
  sessionId: string | null,
  eventType: ToolEventType,
  context: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await supabase.rpc("relocation_tool_record_event", {
    p_session_id: sessionId,
    p_event_type: eventType,
    p_context: toJson(context),
  });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// #5 Diaspora — tanışma isteği (karşılıklı onay akışını başlatır; iletişim accept'te açılır)
// ---------------------------------------------------------------------------
export async function requestDiasporaIntro(
  candidateId: string,
  context: Record<string, unknown> = {},
): Promise<{ match_id: string; status: string }> {
  const { data, error } = await supabase.rpc("diaspora_request_intro_v1", {
    p_candidate_id: candidateId,
    p_context: toJson(context),
  });
  if (error) throw error;
  return data as unknown as { match_id: string; status: string };
}

// ---------------------------------------------------------------------------
// Sonuç okuma (result sayfası — RLS sahip)
// ---------------------------------------------------------------------------

export async function getResult(resultId: string): Promise<RelocationToolResultPayload | null> {
  const { data, error } = await supabase
    .from("relocation_tool_results")
    .select("*")
    .eq("id", resultId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  // DB satırını payload şekline uyarla (id → result_id).
  const row = data as Record<string, unknown>;
  return {
    result_id: row.id as string,
    tool_key: row.tool_key as string,
    result_kind: row.result_kind as RelocationToolResultPayload["result_kind"],
    total_score: (row.total_score as number | null) ?? null,
    score_bucket: (row.score_bucket as string | null) ?? null,
    primary_result: (row.primary_result as Record<string, unknown>) ?? {},
    sub_scores: (row.sub_scores as Record<string, number>) ?? {},
    recommendations: (row.recommendations as Array<Record<string, unknown>>) ?? [],
    explanations: (row.explanations as string[]) ?? [],
    ctas: (row.ctas as RelocationToolResultPayload["ctas"]) ?? [],
    location_snapshot:
      typeof row.location_country === "string" && typeof row.location_city === "string"
        ? {
            country: row.location_country,
            city: row.location_city,
            source: row.location_source as NonNullable<
              RelocationToolResultPayload["location_snapshot"]
            >["source"],
          }
        : null,
  };
}

/**
 * Sonuç raporunu doğrulanmış kullanıcı e-postasına tek-seferlik kuyruğa alır.
 * Konum/e-posta/sahiplik/rate-limit kontrollerinin tamamı RPC sınırındadır.
 */
export async function requestRelocationToolReport(
  resultId: string,
): Promise<RelocationToolReportRequest> {
  const { data, error } = await supabase.rpc("request_relocation_tool_report", {
    p_result_id: resultId,
  });
  if (error) throw error;
  return data as unknown as RelocationToolReportRequest;
}

