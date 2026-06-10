// Admin Panel V2 — React Query key standardı (masterplan §13.2).
// Yeni admin sorguları key'lerini buradan türetmelidir.
// Not: Approvals/audit/overrides listeleri bugün client-side filtrelenir; server-side
// filtre geldiğinde ilgili key'e filters parametresi eklenir (§13.2 örneği).

export const adminQueryKeys = {
  all: ["admin"] as const,
  dashboard: () => [...adminQueryKeys.all, "dashboard"] as const,
  approvals: () => [...adminQueryKeys.all, "approvals"] as const,
  auditLogs: () => [...adminQueryKeys.all, "audit-logs"] as const,
  overrides: () => [...adminQueryKeys.all, "overrides"] as const,
  roleMatrixRoles: () => [...adminQueryKeys.all, "role-matrix", "roles"] as const,
  roleMatrixCatalog: () => [...adminQueryKeys.all, "role-matrix", "catalog"] as const,
  roleMatrixBundle: (roleKey: string) =>
    [...adminQueryKeys.all, "role-matrix", "bundle", roleKey] as const,
};
