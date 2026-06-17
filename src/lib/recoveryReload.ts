/**
 * White-screen / stale-chunk recovery.
 *
 * After a deploy, the loaded `index.html` and main bundle may reference lazily
 * imported chunk hashes that no longer exist on the server (or the server is
 * mid-restart and returns 5xx). The browser only fetches those chunks when the
 * user navigates to the matching route, so the failure surfaces as a blank page
 * with "Failed to fetch dynamically imported module" — exactly the symptom seen
 * on logout → /login.
 *
 * Strategy: reload the page once to pull the fresh index.html + asset manifest.
 * A short-lived cooldown flag in sessionStorage prevents an infinite reload loop
 * when the failure is genuine (server truly down, not just stale).
 */

const COOLDOWN_KEY = "corteqs:recovery-reload-at";
const COOLDOWN_MS = 10_000;

const now = () => Date.now();

const readLastReloadAt = (): number => {
  try {
    const raw = window.sessionStorage.getItem(COOLDOWN_KEY);
    if (!raw) return 0;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
};

const markReloaded = () => {
  try {
    window.sessionStorage.setItem(COOLDOWN_KEY, String(now()));
  } catch {
    // sessionStorage may be unavailable (privacy mode); reload still proceeds.
  }
};

const isWithinCooldown = (): boolean => now() - readLastReloadAt() < COOLDOWN_MS;

export interface RecoverOptions {
  /**
   * When true, reload even if a recent reload already happened. Use for explicit
   * user action ("Sayfayı Yenile" button) where the user expects something to happen.
   */
  forceReloadOnCooldown?: boolean;
}

/**
 * Reload the page to recover from a white screen / failed chunk load.
 * Returns true if a reload was triggered, false if suppressed by cooldown.
 */
export const recoverFromWhiteScreen = (options: RecoverOptions = {}): boolean => {
  if (typeof window === "undefined") return false;

  if (!options.forceReloadOnCooldown && isWithinCooldown()) {
    // Already reloaded very recently — the failure is likely genuine, not stale
    // chunks. Avoid an infinite reload loop.
    return false;
  }

  markReloaded();
  window.location.reload();
  return true;
};

const CHUNK_ERROR_PATTERNS = [
  "failed to fetch dynamically imported module",
  "error loading dynamically imported module",
  "importing a module script failed",
];

const looksLikeChunkLoadError = (reason: unknown): boolean => {
  const message =
    reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "";
  const normalized = message.toLowerCase();
  return CHUNK_ERROR_PATTERNS.some((pattern) => normalized.includes(pattern));
};

let listenersInstalled = false;

/**
 * Install global listeners that auto-recover from failed lazy-chunk loads.
 * Idempotent — safe to call once at app startup.
 */
export const installChunkErrorRecovery = (): void => {
  if (typeof window === "undefined" || listenersInstalled) return;
  listenersInstalled = true;

  // Vite's own signal for a failed dynamic import preload.
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    recoverFromWhiteScreen();
  });

  // Lazy import rejections that don't go through vite:preloadError.
  window.addEventListener("unhandledrejection", (event) => {
    if (looksLikeChunkLoadError(event.reason)) {
      recoverFromWhiteScreen();
    }
  });
};
