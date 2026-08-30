// src/lib/relocation-tools-api.ts
// Supabase RPC + okuma çağrıları — relocation-api.ts deseni.
// Mutasyonlar generic security-definer RPC üzerinden (docs/10tool/00 §RPC); araç/soru listeleri RLS'li SELECT.
// NOT: supabase/types.ts relocation_tool_* için henüz regenerate edilmedi (B1 backlog);
// RPC dönüşleri tiplenirken `as unknown as T` kullanılır (relocation-api/geo deseni).

import { supabase } from "@/integrations/supabase/client";
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
} from "@/lib/relocation-tools-types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ---------------------------------------------------------------------------
// Araç + soru bankası (referans — RLS authenticated read)
// ---------------------------------------------------------------------------

export async function listTools(): Promise<RelocationToolRow[]> {
  const { data, error } = await db
    .from("relocation_tools")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as RelocationToolRow[];
}

export async function getToolBySlug(slug: string): Promise<RelocationToolWithQuestions | null> {
  const { data: tool, error: toolError } = await db
    .from("relocation_tools")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (toolError) throw toolError;
  if (!tool) return null;

  const { data: questions, error: qError } = await db
    .from("relocation_tool_questions")
    .select("*")
    .eq("tool_key", (tool as RelocationToolRow).key)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (qError) throw qError;

  return {
    ...(tool as RelocationToolRow),
    questions: (questions ?? []) as RelocationToolQuestionRow[],
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
  const { data, error } = await db.rpc("relocation_tool_start_session", {
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
  const { error } = await db.rpc("relocation_tool_save_answer", {
    p_session_id: sessionId,
    p_question_key: questionKey,
    p_answer: answer,
  });
  if (error) throw error;
}

export async function completeSession(
  sessionId: string,
): Promise<RelocationToolResultPayload> {
  const { data, error } = await db.rpc("relocation_tool_complete_session", {
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
  const { error } = await db.rpc("relocation_tool_record_event", {
    p_session_id: sessionId,
    p_event_type: eventType,
    p_context: context,
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
  const { data, error } = await db.rpc("diaspora_request_intro_v1", {
    p_candidate_id: candidateId,
    p_context: context,
  });
  if (error) throw error;
  return data as unknown as { match_id: string; status: string };
}

// ---------------------------------------------------------------------------
// Sonuç okuma (result sayfası — RLS sahip)
// ---------------------------------------------------------------------------

export async function getResult(resultId: string): Promise<RelocationToolResultPayload | null> {
  const { data, error } = await db
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
  const { data, error } = await db.rpc("request_relocation_tool_report", {
    p_result_id: resultId,
  });
  if (error) throw error;
  return data as unknown as RelocationToolReportRequest;
}
