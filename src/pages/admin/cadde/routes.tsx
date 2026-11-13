// /admin/cadde alt ağacı — muhasebe routes.tsx deseni (Cadde 3.0 Faz 7 modülerleştirmesi).
// Yeni admin Cadde sayfaları buraya eklenir; admin kökündeki routes.tsx yalnız bu
// fragment'i mount eder. Sayfalar lazy yüklenir (App.tsx code-split düzeniyle uyumlu).

import { lazyWithReload } from "@/lib/lazy-with-reload";
import { Route } from "react-router-dom";

const AdminCaddePage = lazyWithReload(() => import("@/pages/admin/cadde/AdminCaddePage"));
const AdminCaddePromotionsPage = lazyWithReload(() => import("@/pages/admin/cadde/AdminCaddePromotionsPage"));
const AdminCaddeModerationPage = lazyWithReload(() => import("@/pages/admin/cadde/AdminCaddeModerationPage"));
const AdminCaddeCarsiPage = lazyWithReload(() => import("@/pages/admin/cadde/AdminCaddeCarsiPage"));
const AdminCaddeBrandsPage = lazyWithReload(() => import("@/pages/admin/cadde/AdminCaddeBrandsPage"));
const AdminCaddeGuidePage = lazyWithReload(() => import("@/pages/admin/cadde/AdminCaddeGuidePage"));

export const adminCaddeRoutes = (
  <Route path="cadde">
    <Route index element={<AdminCaddePage />} />
    <Route path="promotions" element={<AdminCaddePromotionsPage />} />
    <Route path="moderation" element={<AdminCaddeModerationPage />} />
    <Route path="carsi" element={<AdminCaddeCarsiPage />} />
    <Route path="markalar" element={<AdminCaddeBrandsPage />} />
    <Route path="rehber" element={<AdminCaddeGuidePage />} />
  </Route>
);
