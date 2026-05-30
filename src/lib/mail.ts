import { supabase } from "@/integrations/supabase/client";

export async function notifySubmission(submissionId: string) {
  const { error } = await supabase.functions.invoke("send-submission-email", {
    body: { submissionId },
  });

  if (error) throw error;
}
