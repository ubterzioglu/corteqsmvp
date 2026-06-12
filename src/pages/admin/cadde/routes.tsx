// /admin/cadde alt ağacı — muhasebe routes.tsx deseni (Cadde 3.0 Faz 7 modülerleştirmesi).
// Yeni admin Cadde sayfaları buraya eklenir; admin kökündeki routes.tsx yalnız bu
// fragment'i mount eder. Sayfalar lazy yüklenir (App.tsx code-split düzeniyle uyumlu).

import { lazy } from "react";
import { Route } from "react-router-dom";

const AdminCaddePage = lazy(() => import("@/pages/admin/AdminCaddePage"));
const AdminCaddePromotionsPage = lazy(() => import("@/pages/admin/AdminCaddePromotionsPage"));
const AdminCaddeModerationPage = lazy(() => import("@/pages/admin/AdminCaddeModerationPage"));
const AdminCaddeCarsiPage = lazy(() => import("@/pages/admin/AdminCaddeCarsiPage"));
const AdminCaddeGuidePage = lazy(() => import("@/pages/admin/AdminCaddeGuidePage"));

export const adminCaddeRoutes = (
  <Route path="cadde">
    <Route index element={<AdminCaddePage />} />
    <Route path="promotions" element={<AdminCaddePromotionsPage />} />
    <Route path="moderation" element={<AdminCaddeModerationPage />} />
    <Route path="carsi" element={<AdminCaddeCarsiPage />} />
    <Route path="rehber" element={<AdminCaddeGuidePage />} />
  </Route>
);
