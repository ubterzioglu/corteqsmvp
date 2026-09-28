import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";

/**
 * Bir `running` koşusunun "hâlâ yaşıyor" sayılacağı en uzun süre.
 *
 * ⚠️ Bu eşik olmadan Radar KALICI olarak kilitlenir ve bu gerçekten yaşandı:
 * 2026-09-14 05:02'de başlayan koşu `closeScanRun`'a hiç varmadı. Satır `running`
 * kaldı; sonraki 14 gün boyunca her sabahki cron 409 aldı, hiçbir koşu kaydı
 * açılmadı ve tek haber üretilmedi.
 *
 * ⚠️ Koşuyu öldüren şeyin NE olduğu kanıtlanamadı ve "GDELT zaman aşımı öldürdü"
 * demek YANLIŞ olur: kaynak döngüsü (`index.ts`) zaten try/catch ile sarılıdır ve
 * o hatayı yakalayıp `radar_news_sources.last_error_message`'a yazmıştır — yani
 * koşu onu atlatıp devam etti. Ölüm döngüden SONRA oldu; muhtemel sebep isolate'in
 * öldürülmesi ya da o gün Nano compute'ta (~426 MB RAM, sürekli swap) kapanış
 * update'inin düşmesi. **Bu yüzden `index.ts`'i genel try/catch ile sarmak bu olayı
 * önlemezdi** — doğru çözüm, sebebi ne olursa olsun kilidin kendi kendini
 * çözmesidir.
 *
 * ⚠️ Pano bunu GÖSTERMEZ: pg_cron yalnız `net.http_post`'un kuyruğa alınmasını
 * ölçer, fonksiyonun yanıtını değil — `cron.job_run_details` 409'a rağmen her gün
 * `succeeded` yazar. Yani "cron yeşil" Radar'ın çalıştığını KANITLAMAZ.
 *
 * 30 dk bilinçli olarak geniş: ölçülen gerçek koşular ~1–3 dk sürüyor ve edge
 * function'ın kendi duvar saati sınırı bunun çok altında. Yani bu eşiğe takılan bir
 * koşu kesinlikle ölmüştür, yavaş değildir.
 */
export const SCAN_LOCK_STALE_MS = 30 * 60 * 1000;

/**
 * Kilidi almayı dener. Dönen değer true ise tarama başlayabilir.
 *
 * Bayat (ölü) bir `running` satırı bulunursa kilit ENGELLENMEZ: satır `failed`
 * olarak kapatılır ve kilit verilir. Böylece çöken bir koşu sistemi en fazla
 * `SCAN_LOCK_STALE_MS` kadar durdurur, süresiz değil.
 */
export async function acquireScanLock(
  supabase: SupabaseClient,
  now: Date = new Date(),
): Promise<boolean> {
  // radar_news_scan_runs'ta 'running' durumunda kayıt varsa kilitleme
  const { data, error } = await supabase
    .from("radar_news_scan_runs")
    .select("id, started_at")
    .eq("status", "running")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Lock kontrolü başarısız: ${error.message}`);
  if (data === null) return true; // çalışan yok → kilit alındı

  const startedAt = Date.parse(data.started_at ?? "");
  // ⚠️ Tarih okunamıyorsa koşu YAŞIYOR sayılır. Bilinmeyeni "ölü" kabul etmek,
  // gerçekten çalışan bir taramanın üzerine ikinci tarama başlatır.
  if (!Number.isFinite(startedAt)) return false;

  if (now.getTime() - startedAt < SCAN_LOCK_STALE_MS) return false;

  // Bayat kilit: koşu öldü ama kaydı kapanmamış. Kapat ve devam et.
  const { error: closeError } = await supabase
    .from("radar_news_scan_runs")
    .update({
      status: "failed",
      completed_at: now.toISOString(),
      error_message:
        "Bayat kilit otomatik kapatıldı: koşu kaydı açık kaldı (fonksiyon kapanmadan sonlandı).",
    })
    .eq("id", data.id)
    .eq("status", "running"); // yarış durumu: başkası kapattıysa dokunma

  if (closeError) throw new Error(`Bayat kilit kapatılamadı: ${closeError.message}`);
  return true;
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
