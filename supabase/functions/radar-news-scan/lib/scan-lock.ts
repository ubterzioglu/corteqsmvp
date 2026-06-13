import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const LOCK_KEY = "radar_news_scan_lock";

export async function acquireScanLock(supabase: SupabaseClient): Promise<boolean> {
  // radar_news_scan_runs'ta 'running' durumunda kayıt varsa kilitleme
  const { data, error } = await supabase
    .from("radar_news_scan_runs")
    .select("id")
    .eq("status", "running")
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Lock kontrolü başarısız: ${error.message}`);
  return data === null; // null ise kilit alındı (çalışan yok)
}

export async function openScanRun(
  supabase: SupabaseClient,
  triggerType: "cron" | "manual" | "retry",
  startedBy: string | null,
): Promise<string> {
  const { data, error } = await supabase
    .from("radar_news_scan_runs")
    .insert({
      trigger_type: triggerType,
      status: "running",
      started_by: startedBy,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Tarama kaydı açılamadı: ${error.message}`);
  return data.id;
}

export async function closeScanRun(
  supabase: SupabaseClient,
  runId: string,
  status: "completed" | "partial" | "failed",
  metrics: {
    source_count: number;
    fetched_count: number;
    inserted_count: number;
    duplicate_count: number;
    filtered_count: number;
    failed_source_count: number;
    error_message?: string;
  },
): Promise<void> {
  const { error } = await supabase
    .from("radar_news_scan_runs")
    .update({
      status,
      completed_at: new Date().toISOString(),
      ...metrics,
    })
    .eq("id", runId);

  if (error) throw new Error(`Tarama kaydı kapatılamadı: ${error.message}`);
}
