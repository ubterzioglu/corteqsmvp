// Admin Panel V2 — aktif path'ten breadcrumb zinciri.

import { useMemo } from "react";
import { useLocation } from "react-router-dom";

import { buildAdminBreadcrumbs } from "@/lib/admin-shell/admin-navigation-utils";
import type { AdminBreadcrumb } from "@/lib/admin-shell/admin-shell-types";

export function useAdminBreadcrumbs(): AdminBreadcrumb[] {
  const location = useLocation();
  return useMemo(() => buildAdminBreadcrumbs(location.pathname), [location.pathname]);
}
