// Admin Panel V2 — React Query key standardı (masterplan §13.2).
// Yeni admin sorguları key'lerini buradan türetmelidir.

export const adminQueryKeys = {
  all: ["admin"] as const,
  dashboard: () => [...adminQueryKeys.all, "dashboard"] as const,
};
