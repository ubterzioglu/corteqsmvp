export type AssistantFunctionName = "site-assistant" | "relocation-assistant";
export type AssistantUsageStatus = "success" | "quota_exceeded" | "error";

export type UsageWriter = {
  from: (table: "ai_assistant_usage") => {
    insert: (row: Record<string, unknown>) => PromiseLike<{ error: { message: string } | null }>;
  };
};

type RecordAssistantUsageInput = {
  userId: string;
  functionName: AssistantFunctionName;
  provider: string;
  usage: unknown;
  status: AssistantUsageStatus;
  httpStatus: number;
};

const tokenCount = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.trunc(value)
    : 0;

export function normalizeAssistantUsage(usage: unknown) {
  const value = usage && typeof usage === "object"
    ? usage as Record<string, unknown>
    : {};
  const inputTokens = tokenCount(value.promptTokenCount ?? value.prompt_tokens);
  const outputTokens = tokenCount(value.candidatesTokenCount ?? value.completion_tokens);
  const reportedTotal = tokenCount(value.totalTokenCount ?? value.total_tokens);

  return {
    inputTokens,
    outputTokens,
    totalTokens: reportedTotal || inputTokens + outputTokens,
  };
}

/** Telemetry is best-effort: a write failure must never fail an assistant response. */
export async function recordAssistantUsage(
  client: UsageWriter,
  input: RecordAssistantUsageInput,
): Promise<void> {
  try {
    const tokens = normalizeAssistantUsage(input.usage);
    const { error } = await client.from("ai_assistant_usage").insert({
      user_id: input.userId,
      function_name: input.functionName,
      provider: input.provider,
      input_tokens: tokens.inputTokens,
      output_tokens: tokens.outputTokens,
      total_tokens: tokens.totalTokens,
      status: input.status,
      http_status: input.httpStatus,
    });
    if (error) console.error("assistant usage write error", error.message);
  } catch (error) {
    console.error("assistant usage write error", error);
  }
}
