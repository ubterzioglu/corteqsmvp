import { describe, expect, it } from "vitest";

import {
  backoffDelay,
  CircuitBreaker,
  isTransientStatus,
  withRetry,
} from "./resilience";

describe("isTransientStatus", () => {
  it("429 ve 5xx transient", () => {
    expect(isTransientStatus(429)).toBe(true);
    expect(isTransientStatus(500)).toBe(true);
    expect(isTransientStatus(503)).toBe(true);
  });
  it("2xx/4xx (429 hariç) transient değil", () => {
    expect(isTransientStatus(200)).toBe(false);
    expect(isTransientStatus(400)).toBe(false);
    expect(isTransientStatus(404)).toBe(false);
  });
});

describe("backoffDelay", () => {
  it("exponential artar (jitter=max)", () => {
    const r = () => 0.999999;
    const d1 = backoffDelay(1, 200, 5000, r);
    const d2 = backoffDelay(2, 200, 5000, r);
    expect(d2).toBeGreaterThan(d1);
  });
  it("maxDelay tavanını aşmaz", () => {
    expect(backoffDelay(20, 200, 5000, () => 0.999999)).toBeLessThanOrEqual(5000);
  });
  it("full jitter: random=0 → 0", () => {
    expect(backoffDelay(3, 200, 5000, () => 0)).toBe(0);
  });
});

describe("withRetry", () => {
  it("idempotent: transient hatada retry eder ve sonunda başarır", async () => {
    let calls = 0;
    const res = await withRetry(
      async () => {
        calls += 1;
        return calls < 3 ? { httpStatus: 503 } : { httpStatus: 200 };
      },
      { idempotent: true, maxAttempts: 3, sleep: async () => {} },
    );
    expect(res.httpStatus).toBe(200);
    expect(calls).toBe(3);
  });

  it("idempotent değil: tek deneme (yan etki riski)", async () => {
    let calls = 0;
    const res = await withRetry(
      async () => {
        calls += 1;
        return { httpStatus: 503 };
      },
      { idempotent: false, maxAttempts: 3, sleep: async () => {} },
    );
    expect(calls).toBe(1);
    expect(res.httpStatus).toBe(503);
  });

  it("kalıcı hata (400) retry edilmez", async () => {
    let calls = 0;
    const res = await withRetry(
      async () => {
        calls += 1;
        return { httpStatus: 400 };
      },
      { idempotent: true, maxAttempts: 3, sleep: async () => {} },
    );
    expect(calls).toBe(1);
    expect(res.httpStatus).toBe(400);
  });

  it("maxAttempts'a kadar dener sonra son sonucu döner", async () => {
    let calls = 0;
    const res = await withRetry(
      async () => {
        calls += 1;
        return { httpStatus: 500 };
      },
      { idempotent: true, maxAttempts: 3, sleep: async () => {} },
    );
    expect(calls).toBe(3);
    expect(res.httpStatus).toBe(500);
  });
});

describe("CircuitBreaker", () => {
  it("eşik altında closed kalır", () => {
    const cb = new CircuitBreaker(3, 1000, () => 0);
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.state).toBe("closed");
    expect(cb.canRequest()).toBe(true);
  });

  it("eşiğe ulaşınca open olur ve istekleri engeller", () => {
    const t = 0;
    const cb = new CircuitBreaker(3, 1000, () => t);
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.state).toBe("open");
    expect(cb.canRequest()).toBe(false);
  });

  it("cooldown sonrası half-open olur", () => {
    let t = 0;
    const cb = new CircuitBreaker(1, 1000, () => t);
    cb.recordFailure();
    expect(cb.state).toBe("open");
    t = 1000;
    expect(cb.state).toBe("half-open");
    expect(cb.canRequest()).toBe(true);
  });

  it("başarı sayacı sıfırlar", () => {
    const cb = new CircuitBreaker(2, 1000, () => 0);
    cb.recordFailure();
    cb.recordSuccess();
    cb.recordFailure();
    expect(cb.state).toBe("closed");
  });
});
