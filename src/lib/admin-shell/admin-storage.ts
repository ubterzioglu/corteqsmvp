// Admin Panel V2 — localStorage yardımcıları.
// Tüm admin shell anahtarları burada toplanır; bozuk JSON'da graceful
// fallback garanti edilir (masterplan §19.1 storage testleri).

export const ADMIN_STORAGE_KEYS = {
  sidebarCollapsed: "corteqs.admin.sidebar.collapsed.v1",
  favoritePages: "corteqs.admin.favorite-pages.v1",
  recentPages: "corteqs.admin.recent-pages.v1",
  theme: "corteqs.admin.theme.v1",
} as const;

export function readAdminStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (error: unknown) {
    console.error(`Admin storage okunamadı (${key}):`, error);
    return fallback;
  }
}

export function writeAdminStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error: unknown) {
    console.error(`Admin storage yazılamadı (${key}):`, error);
  }
}
