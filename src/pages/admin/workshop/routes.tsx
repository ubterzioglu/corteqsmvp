// /admin/workshop alt ağacı — muhasebe/cadde routes.tsx deseni.
// Her workshop kendi sayfasını alır (workshop_items.workshop_key ile eşleşir);
// yeni workshop eklerken: (1) buraya route, (2) ADMIN_ROUTE_PATTERNS,
// (3) admin-navigation-registry "workshop" grubuna item ekle.

import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";

const AdminWorkshopCaddePage = lazy(() => import("@/pages/admin/workshop/AdminWorkshopCaddePage"));
const AdminWorkshopProfilPage = lazy(() => import("@/pages/admin/workshop/AdminWorkshopProfilPage"));

export const adminWorkshopRoutes = (
  <Route path="workshop">
    <Route index element={<Navigate to="/admin/workshop/cadde" replace />} />
    <Route path="cadde" element={<AdminWorkshopCaddePage />} />
    <Route path="profil" element={<AdminWorkshopProfilPage />} />
  </Route>
);
