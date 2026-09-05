// İstemci hata kayıtları — tarayıcıda yakalanan hatayı canlı DB'ye yazar
// (public.client_error_reports, RPC report_client_error; mig 20260904210000).
//
// Neden: Cadde WS1 m134 ("yorum yazınca sayfa hataya geçiyor") tekrar üretilemedi
// çünkü yazma hataları yalnız console.error'a gidiyor, kalıcı iz bırakmıyordu
// (devir notu 2026-09-04 §4). Bu modül `caddeWriteError` / `caddeReadError` ve
// hata sınırlarından (AppErrorBoundary, SectionErrorBoundary) çağrılır.
//
// Sözleşme:
//   * ASLA fırlatmaz, ASLA bekletmez (fire-and-forget) — hata yolunu bozamaz.
//   * Payload göndermez: yalnız hata nesnesinin message/code/details/hint alanları,
//     rota (yalnız pathname — query/hash yok) ve user-agent gider.
//   * Aynı (source, context, message) 60 sn içinde ikinci kez gönderilmez;
//     sayfa yaşamı boyunca en fazla 20 kayıt (RPC'nin saatlik 30 tavanına ek fren).
//   * Oturumsuz kullanıcıda RPC 42501 döner; sessizce yutulur.
//
// supabase-js RPC hataları Error DEĞİL düz nesnedir (CLAUDE.md Cadde kuralları) —
// `describeError` bu yüzden `instanceof Error`a daraltmaz.

import { supabase } from "@/integrations/supabase/client";

export type ClientErrorSource = "cadde_write" | "cadde_read" | "render" | "unhandled";

export interface ClientErrorReportInput {
  source: ClientErrorSource;
  /** Hatanın çıktığı yer: "createCaddeComment", "AppErrorBoundary" gibi. */
  context: string;
  error: unknown;
  componentStack?: string | null;
  extra?: Record<string, unknown> | null;
}

export interface DescribedError {
  message: string;
  code: string | null;
  details: string | null;
  hint: string | null;
}

const DEDUPE_WINDOW_MS = 60_000;
const MAX_REPORTS_PER_PAGE_LIFE = 20;

// types.ts bu RPC'yi henüz içermiyor (migration 20260904210000 canlıya uygulanınca
// `supabase gen types` ile yenilenir ve bu köprü SİLİNİR — bkz. tip borcu dersi:
// bayat köprü, tablo adını kaybedip tüm birleşime düşürür).
type ReportClientErrorRpc = {
  rpc: (
    fn: "report_client_error",
    args: {
      p_source: ClientErrorSource;
      p_context: string;
      p_message: string;
      p_error_code: string | null;
      p_details: string | null;
      p_hint: string | null;
      p_route: string | null;
      p_user_agent: string | null;
      p_component_stack: string | null;
      p_extra: Record<string, unknown> | null;
    },
  ) => PromiseLike<{ error: { message?: string } | null }>;
};

const rpcClient = (): ReportClientErrorRpc => supabase as unknown as ReportClientErrorRpc;

let recentKeys = new Map<string, number>();
let sentCount = 0;

/** Testler için: dedupe penceresini ve sayacı sıfırlar. */
export function __resetClientErrorReportsForTests(): void {
  recentKeys = new Map<string, number>();
  sentCount = 0;
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

function safeStringify(value: unknown): string {
  try {
    const text = JSON.stringify(value);
    return typeof text === "string" && text !== "{}" ? text : "Bilinmeyen hata";
  } catch {
    return "Bilinmeyen hata";
  }
}

/** Error, supabase-js düz nesnesi, string ya da bilinmeyen değeri tek biçime indirger. */
export function describeError(error: unknown): DescribedError {
  if (error instanceof Error) {
    const record = error as unknown as Record<string, unknown>;
    return {
      message: error.message || error.name || "Bilinmeyen hata",
      code: readString(record, "code"),
      details: readString(record, "details"),
      hint: readString(record, "hint"),
    };
  }
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    return {
      message: readString(record, "message") ?? safeStringify(record),
      code: readString(record, "code"),
      details: readString(record, "details"),
      hint: readString(record, "hint"),
    };
  }
  if (typeof error === "string") {
    return { message: error.trim() || "Bilinmeyen hata", code: null, details: null, hint: null };
  }
  return { message: error === undefined ? "Bilinmeyen hata" : String(error), code: null, details: null, hint: null };
}

function currentRoute(): string | null {
  if (typeof window === "undefined" || !window.location) return null;
  return window.location.pathname || null;
}

function currentUserAgent(): string | null {
  if (typeof navigator === "undefined") return null;
  return navigator.userAgent || null;
}

/**
 * Hata kaydını gönderir. Dönüş yok; hiçbir koşulda fırlatmaz.
 * `true` = gönderim başlatıldı, `false` = dedupe/tavan nedeniyle atlandı.
 */
export function reportClientError(input: ClientErrorReportInput): boolean {
  const described = describeError(input.error);
  const key = `${input.source}|${input.context}|${described.message}`;
  const now = Date.now();

  const lastSeen = recentKeys.get(key);
  if (lastSeen !== undefined && now - lastSeen < DEDUPE_WINDOW_MS) return false;
  if (sentCount >= MAX_REPORTS_PER_PAGE_LIFE) return false;

  recentKeys.set(key, now);
  sentCount += 1;

  try {
    const pending = rpcClient().rpc("report_client_error", {
      p_source: input.source,
      p_context: input.context,
      p_message: described.message,
      p_error_code: described.code,
      p_details: described.details,
      p_hint: described.hint,
      p_route: currentRoute(),
      p_user_agent: currentUserAgent(),
      p_component_stack: input.componentStack ?? null,
      p_extra: input.extra ?? null,
    });
    void Promise.resolve(pending).then(
      (result) => {
        if (result?.error) {
          console.debug("[client_error_report] kayıt yazılamadı", result.error.message ?? result.error);
        }
      },
      (reason: unknown) => {
        console.debug("[client_error_report] kayıt yazılamadı", reason);
      },
    );
  } catch (reason: unknown) {
    console.debug("[client_error_report] kayıt yazılamadı", reason);
  }

  return true;
}
