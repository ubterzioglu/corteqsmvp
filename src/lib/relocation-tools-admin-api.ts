// src/lib/relocation-tools-admin-api.ts
// Admin — "Araç Soru Sayıları" paneli için canlı sayım sorguları.
// relocation_tool_questions (motor tabanlı 12 araç) + germany_citizenship_questions
// (Vatandaşlık Testi) canlı sayılır; Vize Seçimi kod-kaynaklı düğüm sayısı (VIZE_QUESTIONS.length);
// Maaş Hesaplama/Para Transferi/StepStone sabit form-alanı sayısıdır (bunların "soru" kavramı yok).
// NOT: Hızlı/normal mod ayrımı kaldırıldı (RelocationToolPage artık tek modlu sabit soru akışı
// kullanıyor) — panel tek "Toplam Soru" sayısı gösterir.

import { supabase } from "@/integrations/supabase/client";
import type { RelocationToolRow } from "@/lib/relocation-tools-types";
import { VIZE_QUESTIONS } from "@/lib/germany-vize-data";

 
const db = supabase;

export type ToolCountKind = "question_bank" | "decision_tree" | "calculator";

export interface ToolQuestionCountRow {
  key: string;
  slug: string;
  title_tr: string;
  category: string;
  kind: ToolCountKind;
  total_count: number;
  is_active: boolean;
}

/** Motor kullanmayan standalone araçların sabit sayım kaynağı (form alanı / kod-kaynaklı). */
const STANDALONE_STATIC_COUNTS: Record<string, { kind: ToolCountKind; count: number }> = {
  maas_hesaplama_almanya: { kind: "calculator", count: 9 },
  para_transferi_almanya: { kind: "calculator", count: 1 },
  stepstone_karsilastirma_almanya: { kind: "calculator", count: 5 },
};

const VIZE_TOOL_KEY = "vize_secim_almanya";
const VATANDASLIK_TOOL_KEY = "vatandaslik_testi_almanya";

interface EngineQuestionRow {
  tool_key: string;
}

function countEngineQuestions(rows: EngineQuestionRow[]): Record<string, number> {
  const byTool: Record<string, number> = {};
  for (const row of rows) {
    byTool[row.tool_key] = (byTool[row.tool_key] ?? 0) + 1;
  }
  return byTool;
}

export async function listToolQuestionCounts(): Promise<ToolQuestionCountRow[]> {
  const { data: tools, error: toolsError } = await db
    .from("relocation_tools")
    .select("key, slug, title_tr, category, is_active")
    .order("sort_order", { ascending: true });
  if (toolsError) throw toolsError;

  const { data: engineQuestions, error: engineError } = await db
    .from("relocation_tool_questions")
    .select("tool_key")
    .eq("is_active", true);
  if (engineError) throw engineError;

  const { data: citizenshipRows, error: citizenshipError } = await db
    .from("germany_citizenship_questions")
    .select("id");
  if (citizenshipError) throw citizenshipError;

  const engineCounts = countEngineQuestions((engineQuestions ?? []) as EngineQuestionRow[]);
  const citizenshipCount = (citizenshipRows ?? []).length;
  const vizeNodeCount = VIZE_QUESTIONS.length;

  return ((tools ?? []) as RelocationToolRow[]).map((tool): ToolQuestionCountRow => {
    if (tool.key === VATANDASLIK_TOOL_KEY) {
      return {
        key: tool.key,
        slug: tool.slug,
        title_tr: tool.title_tr,
        category: tool.category,
        kind: "question_bank",
        total_count: citizenshipCount,
        is_active: tool.is_active,
      };
    }

    if (tool.key === VIZE_TOOL_KEY) {
      return {
        key: tool.key,
        slug: tool.slug,
        title_tr: tool.title_tr,
        category: tool.category,
        kind: "decision_tree",
        total_count: vizeNodeCount,
        is_active: tool.is_active,
      };
    }

    const staticEntry = STANDALONE_STATIC_COUNTS[tool.key];
    if (staticEntry) {
      return {
        key: tool.key,
        slug: tool.slug,
        title_tr: tool.title_tr,
        category: tool.category,
        kind: staticEntry.kind,
        total_count: staticEntry.count,
        is_active: tool.is_active,
      };
    }

    return {
      key: tool.key,
      slug: tool.slug,
      title_tr: tool.title_tr,
      category: tool.category,
      kind: "question_bank",
      total_count: engineCounts[tool.key] ?? 0,
      is_active: tool.is_active,
    };
  });
}
