const RECOVERY_FLAG_KEY = "__diaspora_white_screen_recovery__";
const RECOVERY_TS_KEY = "__diaspora_white_screen_recovery_ts__";
const RECOVERY_COOLDOWN_MS = 15_000;

const RECOVERABLE_PATTERNS = [
  "ChunkLoadError",
  "Loading chunk",
  "Failed to fetch dynamically imported module",
  "Importing a module script failed",
  "Failed to import",
];

const toErrorMessage = (value: unknown) => {
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }
  return String(value ?? "");
};

const isRecoverableError = (value: unknown) => {
  const message = toErrorMessage(value).toLowerCase();
  return RECOVERABLE_PATTERNS.some((pattern) => message.includes(pattern.toLowerCase()));
};

const canAttemptRecoveryNow = () => {
  try {
    const attempted = sessionStorage.getItem(RECOVERY_FLAG_KEY) === "1";
    const lastAttempt = Number(sessionStorage.getItem(RECOVERY_TS_KEY) ?? 0);
    const inCooldown = Date.now() - lastAttempt < RECOVERY_COOLDOWN_MS;
    return !(attempted && inCooldown);
  } catch {
    return true;
  }
};

const markRecoveryAttempt = () => {
  try {
    sessionStorage.setItem(RECOVERY_FLAG_KEY, "1");
    sessionStorage.setItem(RECOVERY_TS_KEY, String(Date.now()));
  } catch {
    // Ignore storage failures and fallback to normal reload.
  }
};

const isBootstrapShellVisible = () => {
  const root = document.getElementById("root");
  if (!root) return true;
  const firstElement = root.firstElementChild;
  return firstElement instanceof HTMLElement && firstElement.dataset.bootstrapShell === "true";
};

export const recoverFromWhiteScreen = (options?: { forceReloadOnCooldown?: boolean }) => {
  if (!canAttemptRecoveryNow()) {
    if (options?.forceReloadOnCooldown) {
      window.location.reload();
      return true;
    }
    return false;
  }

  markRecoveryAttempt();

  const url = new URL(window.location.href);
  url.searchParams.set("_recover", String(Date.now()));
  window.location.replace(url.toString());
  return true;
};

declare global {
  interface Window {
    __whiteScreenRecoveryInstalled?: boolean;
    __whiteScreenRecoveryTriggered?: boolean;
  }
}

export const setupWhiteScreenRecovery = () => {
  if (window.__whiteScreenRecoveryInstalled) return;
  window.__whiteScreenRecoveryInstalled = true;

  const triggerRecovery = () => {
    if (window.__whiteScreenRecoveryTriggered) return;
    window.__whiteScreenRecoveryTriggered = true;
    recoverFromWhiteScreen();
  };

  window.addEventListener("error", (event) => {
    if (isRecoverableError(event.error ?? event.message)) {
      triggerRecovery();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (isRecoverableError(event.reason)) {
      triggerRecovery();
    }
  });

  window.setTimeout(() => {
    const root = document.getElementById("root");
    const pageLoaded = document.readyState === "complete";
    if (pageLoaded && (!root || !root.hasChildNodes() || isBootstrapShellVisible())) {
      triggerRecovery();
    }
  }, 8000);
};
