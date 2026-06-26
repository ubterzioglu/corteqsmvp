// Relocation Tools — typed araç config kayıt defteri (docs/10tool/00 §"Zod ve TS sınırları").
// Her araç fazı kendi config'ini buraya ekler; DB seed (relocation_tools +
// relocation_tool_questions) bu config'ten üretilebilir. Engine fazında kayıt boştur.

import type {
  ToolAnswerType,
  ToolQuestionOption,
  ToolResultKind,
} from "@/lib/relocation-tools-types";
import type { DimensionWeights, ScoreBucket } from "@/lib/relocation-tools-ranking";

export interface ToolQuestionConfig {
  questionKey: string;
  mode: "quick" | "detailed" | "both";
  sectionKey: string;
  promptTr: string;
  helpTr?: string;
  answerType: ToolAnswerType;
  options?: ToolQuestionOption[];
  isRequired?: boolean;
  sortOrder: number;
}

export interface ToolConfig {
  key: string;
  slug: string;
  titleTr: string;
  summaryTr: string;
  category: string;
  resultKind: ToolResultKind;
  quickQuestionCount: number;
  detailedQuestionCount: number;
  weights: DimensionWeights;
  buckets: ScoreBucket[];
  questions: ToolQuestionConfig[];
}

/**
 * Araç config kayıt defteri. Her araç fazı kendi ToolConfig'ini ekler.
 * (Örn: TOOL_CONFIGS.country_match = { ... } — docs/10tool/01.)
 */
export const TOOL_CONFIGS: Record<string, ToolConfig> = {};
