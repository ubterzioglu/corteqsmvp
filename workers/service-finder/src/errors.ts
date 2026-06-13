/**
 * Hata sınıfları ve retry davranışı (scrapper_plan.md §Worker pseudocode):
 *
 * | Hata                    | Retry | Davranış                                   |
 * |-------------------------|-------|--------------------------------------------|
 * | BudgetExceededError     | hayır | iş budget_stopped, event yazılır           |
 * | RobotsBlockedError      | hayır | kaynak blocked_robots, işleme devam        |
 * | ProviderRateLimitError  | evet  | exponential backoff, run_after ötelenir    |
 * | ProviderTemporaryError  | evet  | jitter'lı retry                            |
 * | ValidationError (Zod)   | hayır | kaynak failed, işleme devam                |
 * | AuthOrConfigError       | hayır | iş hemen failed                            |
 * | LeaseLostError          | hayır | işleme durdurulur, iş başka worker'da      |
 */

export class BudgetExceededError extends Error {
  readonly code = "budget_exceeded";
  constructor(message = "Hard cap aşıldı") {
    super(message);
    this.name = "BudgetExceededError";
  }
}

export class RobotsBlockedError extends Error {
  readonly code = "robots_blocked";
  constructor(url: string) {
    super(`robots.txt engelledi: ${url}`);
    this.name = "RobotsBlockedError";
  }
}

export class ProviderRateLimitError extends Error {
  readonly code = "provider_rate_limited";
  readonly retryable = true;
  constructor(provider: string, public readonly retryAfterSeconds = 60) {
    super(`Sağlayıcı rate limit: ${provider}`);
    this.name = "ProviderRateLimitError";
  }
}

export class ProviderTemporaryError extends Error {
  readonly code = "provider_temporary";
  readonly retryable = true;
  constructor(provider: string, detail: string) {
    super(`Geçici sağlayıcı hatası (${provider}): ${detail}`);
    this.name = "ProviderTemporaryError";
  }
}

export class AuthOrConfigError extends Error {
  readonly code = "auth_or_config";
  constructor(detail: string) {
    super(`Yapılandırma/yetki hatası: ${detail}`);
    this.name = "AuthOrConfigError";
  }
}

export class LeaseLostError extends Error {
  readonly code = "lease_lost";
  constructor(jobId: string) {
    super(`Lease kaybedildi: ${jobId}`);
    this.name = "LeaseLostError";
  }
}

export function isRetryable(error: unknown): boolean {
  return (
    error instanceof ProviderRateLimitError ||
    error instanceof ProviderTemporaryError
  );
}

export function errorCode(error: unknown): string {
  if (
    error instanceof BudgetExceededError ||
    error instanceof RobotsBlockedError ||
    error instanceof ProviderRateLimitError ||
    error instanceof ProviderTemporaryError ||
    error instanceof AuthOrConfigError ||
    error instanceof LeaseLostError
  ) {
    return error.code;
  }
  return "unexpected_error";
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Beklenmeyen hata";
}
