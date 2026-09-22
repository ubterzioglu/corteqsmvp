import { supabase } from "@/integrations/supabase/client";

export type AssistantUsageRow = {
  id: string;
  user_id: string | null;
  function_name: string;
  provider: string;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  status: string;
  http_status: number | null;
  created_at: string;
};

export type AssistantUsageSummary = {
  totalRequests: number;
  totalTokens: number;
  siteRequests: number;
  relocationRequests: number;
  quotaEvents: number;
};

export type GeminiQuotaAlert = {
  active: boolean;
  eventCount: number;
};

export const GEMINI_QUOTA_WARNING_THRESHOLD = 1;
const QUOTA_LOOKBACK_MS = 24 * 60 * 60 * 1_000;

type UsageQueryResult = PromiseLike<{
  data: AssistantUsageRow[] | null;
  error: { message: string } | null;
}>;

export type AssistantUsageClient = {
  from: (table: "ai_assistant_usage") => {
    select: (columns: string) => {
      gte: (column: "created_at", value: string) => {
        order: (
          column: "created_at",
          options: { ascending: boolean },
        ) => {
          limit: (count: number) => UsageQueryResult;
        };
      };
    };
  };
};

const USAGE_COLUMNS =
  "id, user_id, function_name, provider, input_tokens, output_tokens, total_tokens, status, http_status, created_at";

function normalizeLookbackDays(days: number): number {
  if (!Number.isFinite(days)) return 30;
  return Math.min(90, Math.max(1, Math.trunc(days)));
}

export async function fetchAssistantUsage(
  lookbackDays = 30,
  client: AssistantUsageClient = supabase as unknown as AssistantUsageClient,
): Promise<AssistantUsageRow[]> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - normalizeLookbackDays(lookbackDays));

  const { data, error } = await client
    .from("ai_assistant_usage")
    .select(USAGE_COLUMNS)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export function summarizeAssistantUsage(rows: AssistantUsageRow[]): AssistantUsageSummary {
  return rows.reduce<AssistantUsageSummary>(
    (summary, row) => {
      summary.totalRequests += 1;
      summary.totalTokens += row.total_tokens ?? 0;
      if (row.function_name === "site-assistant") summary.siteRequests += 1;
      if (row.function_name === "relocation-assistant") summary.relocationRequests += 1;
      if (row.status === "quota_exceeded" || row.http_status === 429) summary.quotaEvents += 1;
      return summary;
    },
    {
      totalRequests: 0,
      totalTokens: 0,
      siteRequests: 0,
      relocationRequests: 0,
      quotaEvents: 0,
    },
  );
}

export function getGeminiQuotaAlert(
  rows: AssistantUsageRow[],
  now = new Date(),
): GeminiQuotaAlert {
  const cutoff = now.getTime() - QUOTA_LOOKBACK_MS;
  const eventCount = rows.filter((row) => {
    const createdAt = Date.parse(row.created_at);
    return row.provider.toLocaleLowerCase("en-US") === "gemini"
      && (row.status === "quota_exceeded" || row.http_status === 429)
      && Number.isFinite(createdAt)
      && createdAt >= cutoff
      && createdAt <= now.getTime();
  }).length;

  return {
    active: eventCount >= GEMINI_QUOTA_WARNING_THRESHOLD,
    eventCount,
  };
}
