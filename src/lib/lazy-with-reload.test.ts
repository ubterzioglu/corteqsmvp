import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { withReloadGuard, type LazyModule } from "@/lib/lazy-with-reload";
import {
  __resetRecoveryReloadStateForTests,
  isRecoveryReloadInProgress,
  recoverFromWhiteScreen,
} from "@/lib/recoveryReload";

const COOLDOWN_KEY = "corteqs:recovery-reload-at";
const Page = () => null;

const chunkError = () => new TypeError("Failed to fetch dynamically imported module: /assets/X-abc.js");

/** Promise belirli süre içinde çözülmez/reddedilmezse "pending" döner. */
const settleState = async (promise: Promise<unknown>): Promise<"pending" | "resolved" | "rejected"> => {
  let state: "pending" | "resolved" | "rejected" = "pending";
  promise.then(
    () => {
      state = "resolved";
    },
    () => {
      state = "rejected";
    },
  );
  await new Promise((resolve) => setTimeout(resolve, 20));
  return state;
};

describe("withReloadGuard / lazyWithReload", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    __resetRecoveryReloadStateForTests();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    __resetRecoveryReloadStateForTests();
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("normal modülü olduğu gibi döndürür", async () => {
    const mod = { default: Page };
    await expect(withReloadGuard(async () => mod)()).resolves.toBe(mod);
  });

  it("isimli export'u .then ile default'a çeviren factory'yi destekler", async () => {
    const named = { NamedPage: Page };
    const load = withReloadGuard(() => Promise.resolve(named).then((m) => ({ default: m.NamedPage })));
    await expect(load()).resolves.toEqual({ default: Page });
  });

  it("yenileme sürerken import undefined dönerse BEKLER (.default okunmaz)", async () => {
    expect(recoverFromWhiteScreen()).toBe(true);
    const load = withReloadGuard(
      async () => undefined as unknown as LazyModule<typeof Page>,
    );
    expect(await settleState(load())).toBe("pending");
  });

  it("yenileme sürerken import reddedilirse BEKLER", async () => {
    expect(recoverFromWhiteScreen()).toBe(true);
    const load = withReloadGuard<typeof Page>(() => Promise.reject(new Error("boom")));
    expect(await settleState(load())).toBe("pending");
  });

  it("chunk hatası + yenileme serbest → yenilemeyi başlatır ve bekler", async () => {
    const load = withReloadGuard<typeof Page>(() => Promise.reject(chunkError()));
    expect(await settleState(load())).toBe("pending");
    expect(isRecoveryReloadInProgress()).toBe(true);
  });

  it("cooldown'da chunk hatası NORMAL akar (hata sınırına ulaşır)", async () => {
    window.sessionStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    const error = chunkError();
    const load = withReloadGuard<typeof Page>(() => Promise.reject(error));
    await expect(load()).rejects.toBe(error);
    expect(isRecoveryReloadInProgress()).toBe(false);
  });

  it("cooldown'da undefined modül anlamlı bir hatayla reddeder", async () => {
    window.sessionStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    const load = withReloadGuard(async () => undefined as unknown as LazyModule<typeof Page>);
    await expect(load()).rejects.toThrow(/without a default export/);
  });

  it("chunk hatası olmayan reddi yenileme denemeden iletir", async () => {
    const error = new Error("render-time bug");
    const load = withReloadGuard<typeof Page>(() => Promise.reject(error));
    await expect(load()).rejects.toBe(error);
    expect(isRecoveryReloadInProgress()).toBe(false);
  });
});
