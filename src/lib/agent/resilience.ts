// Dayanıklılık yardımcıları (Faz 6) — retry + circuit breaker.
// Kaynak tasarım: newtools.md §"Ajan orkestrasyonu" Azure/Google retry pattern.
//
// İlkeler:
//  - Transient hatalarda (429/5xx/network) retry; kalıcı/semantik (4xx) hatada hemen fail.
//  - Yalnız idempotent operasyonlarda otomatik retry.
//  - Exponential backoff + jitter, retry limiti, circuit breaker.

export type RetryOptions = {
  maxAttempts?: number; // toplam deneme (varsayılan 3)
  baseDelayMs?: number; // ilk gecikme (varsayılan 200)
  maxDelayMs?: number; // tavan (varsayılan 5000)
  idempotent?: boolean; // değilse retry yapılmaz (varsayılan false)
  /** Deterministik test için jitter [0..1) üretici. */
  random?: () => number;
  /** Test için sleep enjeksiyonu. */
  sleep?: (ms: number) => Promise<void>;
};

/** Bir HTTP status'un transient (retry edilebilir) olup olmadığı. */
export function isTransientStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

/** Exponential backoff + full jitter gecikmesi (ms). */
export function backoffDelay(
  attempt: number,
  baseDelayMs = 200,
  maxDelayMs = 5000,
  random: () => number = Math.random,
): number {
  const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
  return Math.floor(exp * random()); // full jitter: [0, exp)
}

export type AttemptResult = { httpStatus: number; body?: unknown };

/**
 * Bir async operasyonu transient hatalarda retry'lar.
 * idempotent=false ise tek deneme yapılır (yan etki riski).
 * Transient olmayan status veya throw → hemen döner/yükselir.
 */
export async function withRetry(
  op: () => Promise<AttemptResult>,
  options: RetryOptions = {},
): Promise<AttemptResult> {
  const {
    maxAttempts = 3,
    baseDelayMs = 200,
    maxDelayMs = 5000,
    idempotent = false,
    random = Math.random,
    sleep = (ms: number) => new Promise((r) => setTimeout(r, ms)),
  } = options;

  const attempts = idempotent ? Math.max(1, maxAttempts) : 1;
  let last: AttemptResult | undefined;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    last = await op();
    if (!isTransientStatus(last.httpStatus)) return last; // başarı veya kalıcı hata
    if (attempt < attempts) {
      await sleep(backoffDelay(attempt, baseDelayMs, maxDelayMs, random));
    }
  }
  return last as AttemptResult;
}

/**
 * Basit circuit breaker. Ardışık hata eşiğine ulaşınca "open" olur ve
 * cooldown süresince çağrıları engeller (hızlı-fail).
 */
export class CircuitBreaker {
  private failures = 0;
  private openedAt: number | null = null;

  constructor(
    private readonly threshold = 5,
    private readonly cooldownMs = 30_000,
    private readonly now: () => number = () => Date.now(),
  ) {}

  /** Çağrıya izin var mı? (open + cooldown dolmadıysa hayır.) */
  canRequest(): boolean {
    if (this.openedAt === null) return true;
    if (this.now() - this.openedAt >= this.cooldownMs) {
      // half-open: bir deneme için izin ver
      return true;
    }
    return false;
  }

  recordSuccess(): void {
    this.failures = 0;
    this.openedAt = null;
  }

  recordFailure(): void {
    this.failures += 1;
    if (this.failures >= this.threshold) {
      this.openedAt = this.now();
    }
  }

  get state(): "closed" | "open" | "half-open" {
    if (this.openedAt === null) return "closed";
    if (this.now() - this.openedAt >= this.cooldownMs) return "half-open";
    return "open";
  }
}
