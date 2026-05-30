import { supabase } from "@/integrations/supabase/client";

export type SubmitSurveyResponsePayload = {
  surveySlug: string;
  respondent?: {
    name?: string;
    email?: string;
    contactOptIn?: boolean;
  };
  answers: Array<{
    questionId: string;
    value: unknown;
  }>;
  meta: {
    startedAt: string;
    honeypot: string;
  };
};

export async function submitSurveyResponse(payload: SubmitSurveyResponsePayload) {
  const { data, error } = await supabase.functions.invoke("submit-survey-response", {
    body: payload,
  });

  if (error) {
    try {
      const context = (error as { context?: Response }).context;
      const status = context?.status;
      const body = context ? ((await context.json()) as { error?: string }) : null;
      const backendMessage = body?.error?.trim();

      if (backendMessage) {
        if (backendMessage === "Multiple submissions are disabled") {
          throw new Error("Bu ankete daha önce yanıt vermiş görünüyorsunuz. Aynı kişi için tekrar gönderim kapalı.");
        }
        if (backendMessage === "Too many requests") {
          throw new Error("Çok hızlı tekrar deneme yapıldı. Lütfen kısa bir süre sonra tekrar deneyin.");
        }
        throw new Error(backendMessage);
      }

      if (status === 429) {
        throw new Error("İstek sınırına ulaşıldı. Lütfen kısa bir süre sonra tekrar deneyin.");
      }
    } catch {
      // Fall back to generic function error below.
    }

    throw error;
  }
  return data as { ok: boolean; responseId: string };
}

export async function getSurveyResponses(surveyId: string) {
  const { data, error } = await supabase
    .from("survey_responses")
    .select("*, survey_answers(*, survey_questions(*))")
    .eq("survey_id", surveyId)
    .order("submitted_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updateResponseStatus(id: string, status: "reviewed" | "archived") {
  const { error } = await supabase
    .from("survey_responses")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}
