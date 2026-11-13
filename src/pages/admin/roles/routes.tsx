// src/pages/admin/roles/routes.tsx
// Rol/yetki yönetimi admin alt ağacı (role-matrix, roles-overview, overrides, roller-taslak) — Faz 3 modülerleştirmesi.
// Path'ler kökteki eski satırlarla BİREBİR aynı; düz path'ler olduğu için sarmalayan
// <Route> YOK, fragment döner (URL değişmez). Yönlendirme (Navigate) satırları kökte kalır.

import { lazyWithReload } from "@/lib/lazy-with-reload";
import { Route } from "react-router-dom";

const AdminRoleManagementPage = lazyWithReload(() => import("@/pages/admin/roles/AdminRoleManagementPage"));
const AdminRolesOverviewPage = lazyWithReload(() => import("@/pages/admin/roles/AdminRolesOverviewPage"));
const AdminUserOverridesPage = lazyWithReload(() => import("@/pages/admin/roles/AdminUserOverridesPage"));
const AdminRolesDraftPage = lazyWithReload(() => import("@/pages/admin/roles/AdminRolesDraftPage"));

export const adminRolesRoutes = (
  <>
    <Route path="new-member/role-matrix" element={<AdminRoleManagementPage />} />
    <Route path="new-member/roles-overview" element={<AdminRolesOverviewPage />} />
    <Route path="new-member/overrides" element={<AdminUserOverridesPage />} />
    <Route path="roller-taslak" element={<AdminRolesDraftPage />} />
  </>
);
