import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Survey = Tables<"surveys">;
export type SurveyQuestion = Tables<"survey_questions">;
export type SurveyResponse = Tables<"survey_responses">;
export type SurveyAnswer = Tables<"survey_answers">;

export type SurveyStatus = Survey["status"];
export type SurveyQuestionType = SurveyQuestion["type"];

export type SurveyWithQuestions = Survey & { survey_questions: SurveyQuestion[] };
export type AdminSurveyWithResponseCount = Survey & { survey_responses: Array<{ id: string }> };

export type CreateSurveyInput = TablesInsert<"surveys">;
export type UpdateSurveyInput = TablesUpdate<"surveys">;

export async function getPublishedSurveys() {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("surveys")
    .select("*")
    .eq("status", "published")
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data ?? [];
}

export async function getPublishedSurveyBySlug(slug: string) {
  const nowIso = new Date().toISOString();
  const { data: survey, error: surveyError } = await supabase
    .from("surveys")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
    .maybeSingle();

  if (surveyError) throw surveyError;
  if (!survey) return null;

  const { data: questions, error: questionError } = await supabase
    .from("survey_questions")
    .select("*")
    .eq("survey_id", survey.id)
    .order("sort_order", { ascending: true });

  if (questionError) throw questionError;

  return {
    ...survey,
    survey_questions: questions ?? [],
  } as SurveyWithQuestions;
}

export async function getAdminSurveys() {
  const { data, error } = await supabase
    .from("surveys")
    .select("*, survey_responses(id)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as AdminSurveyWithResponseCount[];
}

export async function getSurveyById(id: string) {
  const { data: survey, error: surveyError } = await supabase
    .from("surveys")
    .select("*")
    .eq("id", id)
    .single();
  if (surveyError) throw surveyError;

  const { data: questions, error: questionError } = await supabase
    .from("survey_questions")
    .select("*")
    .eq("survey_id", id)
    .order("sort_order", { ascending: true });
  if (questionError) throw questionError;

  return {
    ...survey,
    survey_questions: questions ?? [],
  } as SurveyWithQuestions;
}

export async function createSurvey(input: CreateSurveyInput) {
  const { data, error } = await supabase.from("surveys").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateSurvey(id: string, input: UpdateSurveyInput) {
  const { data, error } = await supabase.from("surveys").update(input).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function upsertSurveyQuestions(surveyId: string, questions: Array<Partial<SurveyQuestion> & { id?: string }>) {
  const existingIds = questions.map((q) => q.id).filter(Boolean) as string[];

  const { data: existingRows, error: existingRowsError } = await supabase
    .from("survey_questions")
    .select("id")
    .eq("survey_id", surveyId);
  if (existingRowsError) throw existingRowsError;

  const toDelete = (existingRows ?? []).map((row) => row.id).filter((id) => !existingIds.includes(id));
  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase.from("survey_questions").delete().in("id", toDelete);
    if (deleteError) throw deleteError;
  }

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    const payload: TablesInsert<"survey_questions"> = {
      survey_id: surveyId,
      type: (question.type as SurveyQuestionType) ?? "short_text",
      question: question.question?.trim() || "",
      description: question.description?.trim() || null,
      placeholder: question.placeholder?.trim() || null,
      options: Array.isArray(question.options) ? question.options : [],
      validation: question.validation ?? {},
      is_required: Boolean(question.is_required),
      sort_order: index,
    };

    if (question.id) {
      const { error } = await supabase
        .from("survey_questions")
        .update(payload)
        .eq("id", question.id)
        .eq("survey_id", surveyId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("survey_questions").insert(payload);
      if (error) throw error;
    }
  }
}

export async function publishSurvey(id: string) {
  return updateSurvey(id, {
    status: "published",
    published_at: new Date().toISOString(),
    closed_at: null,
  });
}

export async function closeSurvey(id: string) {
  return updateSurvey(id, {
    status: "closed",
    closed_at: new Date().toISOString(),
  });
}

export async function archiveSurvey(id: string) {
  return updateSurvey(id, {
    status: "archived",
  });
}

export async function deleteSurvey(id: string) {
  const { error } = await supabase.from("surveys").delete().eq("id", id);
  if (error) throw error;
}
