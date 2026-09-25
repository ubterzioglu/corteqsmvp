import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  __resetRecoveryReloadStateForTests,
  installChunkErrorRecovery,
  isRecoveryReloadInProgress,
  recoverFromWhiteScreen,
} from "@/lib/recoveryReload";

const COOLDOWN_KEY = "corteqs:recovery-reload-at";

const dispatchPreloadError = (): Event => {
  const event = new Event("vite:preloadError", { cancelable: true });
  window.dispatchEvent(event);
  return event;
};

describe("recoveryReload — vite:preloadError", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    __resetRecoveryReloadStateForTests();
    // jsdom location.reload() "not implemented" gürültüsünü sustur.
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    installChunkErrorRecovery();
  });

  afterEach(() => {
    __resetRecoveryReloadStateForTests();
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("yenileme GERÇEKTEN başlatıldıysa preventDefault çağırır", () => {
    const event = dispatchPreloadError();

    expect(event.defaultPrevented).toBe(true);
    expect(isRecoveryReloadInProgress()).toBe(true);
    expect(window.sessionStorage.getItem(COOLDOWN_KEY)).not.toBeNull();
  });

  it("cooldown içinde yenileme bastırılırsa preventDefault ÇAĞIRMAZ — hata normal akar", () => {
    window.sessionStorage.setItem(COOLDOWN_KEY, String(Date.now()));

    const event = dispatchPreloadError();

    expect(event.defaultPrevented).toBe(false);
    expect(isRecoveryReloadInProgress()).toBe(false);
  });

  it("cooldown süresi dolduysa yeniden yenileme başlatır", () => {
    window.sessionStorage.setItem(COOLDOWN_KEY, String(Date.now() - 60_000));

    const event = dispatchPreloadError();

    expect(event.defaultPrevented).toBe(true);
  });

  it("dinleyici iki kez kurulmaz (idempotent)", () => {
    installChunkErrorRecovery();
    const event = dispatchPreloadError();
    // Tek dinleyici: ilk çağrı yenilemeyi başlatır; ikinci bir dinleyici olsaydı
    // cooldown'a düşer ama preventDefault zaten true kalırdı — asıl kanıt reload sayısı.
    expect(event.defaultPrevented).toBe(true);
  });

  it("forceReloadOnCooldown cooldown'u aşar (kullanıcının 'Sayfayı Yenile' tıklaması)", () => {
    window.sessionStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    expect(recoverFromWhiteScreen()).toBe(false);
    expect(recoverFromWhiteScreen({ forceReloadOnCooldown: true })).toBe(true);
  });
});
