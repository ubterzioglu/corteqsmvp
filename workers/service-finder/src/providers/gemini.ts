import { estimateGeminiCost } from "../costs.js";
import {
  AuthOrConfigError,
  ProviderRateLimitError,
  ProviderTemporaryError,
} from "../errors.js";
import { CLASSIFIER_RESPONSE_SCHEMA } from "../prompts.js";
import type { ClassifierProvider, ClassifyUsage } from "./types.js";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 60_000;
const DEFAULT_MODEL = "gemini-2.5-flash-lite";

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
  error?: { message?: string; status?: string };
}

/**
 * Gemini structured output sınıflandırıcısı.
 * find-matches edge function ile aynı API ailesi; responseSchema ile
 * JSON zorlanır, sonuç yine de Zod ile ikinci kez doğrulanır.
 */
export function createGeminiClassifier(apiKey: string): ClassifierProvider {
  return {
    key: "gemini",
    async classify(input): Promise<{ parsed: unknown; usage: ClassifyUsage }> {
      const model = input.model ?? DEFAULT_MODEL;
      const url = `${GEMINI_BASE_URL}/${encodeURIComponent(model)}:generateContent`;

      let response: Response;
      try {
        response = await fetch(url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: input.systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: input.userPrompt }] }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
              responseSchema: CLASSIFIER_RESPONSE_SCHEMA,
            },
          }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch (error: unknown) {
        throw new ProviderTemporaryError("gemini", error instanceof Error ? error.message : "network error");
      }

      if (response.status === 401 || response.status === 403) {
        throw new AuthOrConfigError("Gemini API anahtarı geçersiz veya yetkisiz");
      }
      if (response.status === 429) {
        throw new ProviderRateLimitError("gemini");
      }
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new ProviderTemporaryError("gemini", `HTTP ${response.status}: ${detail.slice(0, 300)}`);
      }

      const payload = (await response.json()) as GeminiResponse;
      if (payload.error) {
        throw new ProviderTemporaryError("gemini", payload.error.message ?? "unknown error");
      }

      const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new ProviderTemporaryError("gemini", `Geçersiz JSON yanıtı: ${text.slice(0, 200)}`);
      }

      const inputTokens = payload.usageMetadata?.promptTokenCount ?? 0;
      const outputTokens = payload.usageMetadata?.candidatesTokenCount ?? 0;
      const { amountUsd } = estimateGeminiCost(model, inputTokens, outputTokens);

      return {
        parsed,
        usage: { inputTokens, outputTokens, estimatedCostUsd: amountUsd, model },
      };
    },
  };
}
