import { supabase } from "@/integrations/supabase/client";

export type RelocationReminderPreference = {
  opted_out: boolean;
  global_enabled: boolean;
};

export async function getRelocationReminderPreference(): Promise<RelocationReminderPreference> {
  const { data, error } = await supabase.rpc("get_relocation_tool_reminder_preference");
  if (error) throw error;
  return data as unknown as RelocationReminderPreference;
}

export async function setRelocationReminderOptOut(
  optedOut: boolean,
): Promise<RelocationReminderPreference> {
  const { data, error } = await supabase.rpc("set_relocation_tool_reminder_opt_out", {
    p_opted_out: optedOut,
  });
  if (error) throw error;
  return data as unknown as RelocationReminderPreference;
}
