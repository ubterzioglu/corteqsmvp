// Relocation Tools — React Query anahtar fabrikası (relocation-query-keys.ts kalıbı).

export const relocationToolsKeys = {
  all: ["relocation-tools"] as const,
  list: () => [...relocationToolsKeys.all, "list"] as const,
  tool: (slug: string) => [...relocationToolsKeys.all, "tool", slug] as const,
  session: (sessionId: string) => [...relocationToolsKeys.all, "session", sessionId] as const,
  answers: (sessionId: string) => [...relocationToolsKeys.all, "answers", sessionId] as const,
  result: (resultId: string) => [...relocationToolsKeys.all, "result", resultId] as const,
} as const;
