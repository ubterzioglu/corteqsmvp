// Relocation Tools — domain tipleri.
// Sözleşme: docs/10tool/00-ortak-mimari-ve-agent-talimatlari.md.
// NOT: supabase/types.ts relocation_tool_* için henüz regenerate edilmedi (B1 backlog);
// RPC dönüşleri tiplenirken `as unknown as T` kullanılır (relocation-api.ts deseni).

export type ToolMode = "quick" | "detailed";

export type ToolResultKind =
  | "score"
  | "ranked_list"
  | "persona"
  | "checklist"
  | "match_list"
  | "comparison";

export type ToolAnswerType =
  | "single"
  | "multi"
  | "scale"
  | "number"
  | "currency"
  | "text"
  | "date"
  | "country"
  | "city"
  | "profession"
  | "consent";

export type ToolEventType =
  | "start"
  | "answer"
  | "skip"
  | "complete"
  | "result_view"
  | "cta_click"
  | "save"
  | "share"
  | "abandon";

/** Soru seçeneği (single/multi). score = boyut katkısı (0..1). */
export interface ToolQuestionOption {
  value: string;
  label: string;
  score?: number;
}

export interface RelocationToolRow {
  key: string;
  slug: string;
  title_tr: string;
  title_en: string | null;
  summary_tr: string;
  category: string;
  quick_question_count: number;
  detailed_question_count: number;
  is_active: boolean;
  requires_auth: boolean;
  result_kind: ToolResultKind;
  sort_order: number;
  weights: Record<string, number>;
}

export interface RelocationToolQuestionRow {
  id: string;
  tool_key: string;
  question_key: string;
  mode: "quick" | "detailed" | "both";
  section_key: string;
  prompt_tr: string;
  help_tr: string | null;
  answer_type: ToolAnswerType;
  options: ToolQuestionOption[];
  validation: Record<string, unknown>;
  scoring: Record<string, unknown>;
  sort_order: number;
  is_required: boolean;
  is_active: boolean;
}

export interface RelocationToolWithQuestions extends RelocationToolRow {
  questions: RelocationToolQuestionRow[];
}

/** Cevap değeri — soru tipine göre değişir. */
export type ToolAnswerValue =
  | string
  | number
  | boolean
  | string[]
  | Record<string, unknown>;

/** start_session RPC dönüşü. */
export interface ToolSessionStart {
  session_id: string;
  tool_key: string;
  mode: ToolMode;
}

export interface ToolSessionResume {
  session_id: string;
  tool_key: string;
  mode: ToolMode;
  answers: Record<string, ToolAnswerValue>;
}

/** Bir CTA (result.ctas öğesi). */
export interface ToolCta {
  key: string;
  label: string;
  href: string;
}

/** complete_session / score RPC dönüşü = result payload. */
export interface RelocationToolResultPayload {
  result_id: string;
  tool_key: string;
  result_kind: ToolResultKind;
  total_score: number | null;
  score_bucket: string | null;
  primary_result: Record<string, unknown>;
  sub_scores: Record<string, number>;
  recommendations: Array<Record<string, unknown>>;
  explanations: string[];
  ctas: ToolCta[];
  location_snapshot: {
    country: string;
    city: string;
    source: "approved_attributes" | "profile_core" | "mixed_profile";
  } | null;
}

export interface RelocationToolReportRequest {
  result_id: string;
  status: "pending" | "sent" | "failed" | "skipped";
  location_country: string;
  location_city: string;
}
