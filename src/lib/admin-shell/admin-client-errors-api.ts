// Admin — İstemci Hataları veri katmanı (client_error_reports, mig 20260904210000).
// Son 200 kayıt + kullanıcı etiketleri. RLS: yalnız admin okur.

import { supabase } from "@/integrations/supabase/client";
import type { ClientErrorSource } from "@/lib/client-error-reports";
import { trIncludes } from "@/lib/text-normalization";

import { fetchAdminUserLabels, type AdminUserLabel } from "./admin-user-labels";

export type ClientErrorReportRow = {
  id: string;
  user_id: string | null;
  source: ClientErrorSource;
  context: string;
  message: string;
  error_code: string | null;
  details: string | null;
  hint: string | null;
  route: string | null;
  user_agent: string | null;
  component_stack: string | null;
  extra: unknown;
  created_at: string;
};

export type ClientErrorReportsBundle = {
  reports: ClientErrorReportRow[];
  users: AdminUserLabel[];
};

const REPORT_SELECT =
  "id, user_id, source, context, message, error_code, details, hint, route, user_agent, component_stack, extra, created_at";

// types.ts bu tabloyu henüz içermiyor (migration canlıya uygulanınca `supabase gen types`
// ile yenilenir ve bu köprü SİLİNİR). Köprü tablo adını sabit tutar: `from: (t: string)`
// imzası tüm tabloların birleşimine düşürür ve alakasız hatalar üretir (tip borcu dersi).
type ClientErrorReportsTable = {
  from: (table: "client_error_reports") => {
    select: (columns: string) => {
      order: (
        column: "created_at",
        options: { ascending: boolean },
      ) => {
        limit: (count: number) => PromiseLike<{
          data: ClientErrorReportRow[] | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

const table = () => (supabase as unknown as ClientErrorReportsTable).from("client_error_reports");

export async function fetchClientErrorReportsBundle(): Promise<ClientErrorReportsBundle> {
  const [reportsResult, users] = await Promise.all([
    table().select(REPORT_SELECT).order("created_at", { ascending: false }).limit(200),
    fetchAdminUserLabels(),
  ]);

  if (reportsResult.error) throw new Error(reportsResult.error.message);

  return {
    reports: reportsResult.data ?? [],
    users,
  };
}

export const CLIENT_ERROR_SOURCE_LABELS: Record<ClientErrorSource, string> = {
  cadde_write: "Cadde yazma",
  cadde_read: "Cadde okuma",
  render: "Render (hata sınırı)",
  unhandled: "Yakalanmamış",
};

export const CLIENT_ERROR_SOURCE_FILTER_ALL = "all";

/**
 * Kaynak + arama filtresi. Sayfa bileşeninden AYRI durur: bir `.tsx` dosyasından
 * bileşen dışı sembol export etmek `react-refresh/only-export-components` uyarısı
 * üretir (lint taban çizgisi 0 problem).
 */
export function filterClientErrorReports(
  reports: ClientErrorReportRow[],
  options: { source?: string; search?: string } = {},
): ClientErrorReportRow[] {
  const source = options.source ?? CLIENT_ERROR_SOURCE_FILTER_ALL;
  const search = options.search?.trim() ?? "";
  return reports.filter((report) => {
    if (source !== CLIENT_ERROR_SOURCE_FILTER_ALL && report.source !== source) return false;
    if (!search) return true;
    const haystack = [report.context, report.message, report.error_code ?? "", report.route ?? ""].join(" ");
    return trIncludes(haystack, search);
  });
}
