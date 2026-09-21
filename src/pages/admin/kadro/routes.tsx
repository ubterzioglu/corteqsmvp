import { lazy } from "react";
import { Route } from "react-router-dom";

const AdminKadroPage = lazy(() => import("@/pages/admin/kadro/AdminKadroPage"));
const AdminKadroMatrisPage = lazy(() => import("@/pages/admin/kadro/AdminKadroMatrisPage"));
const AdminKadroRutinlerPage = lazy(() => import("@/pages/admin/kadro/AdminKadroRutinlerPage"));
const AdminKadroIlanlarPage = lazy(() => import("@/pages/admin/kadro/AdminKadroIlanlarPage"));

export const adminKadroRoutes = (
  <Route path="kadro">
    <Route index element={<AdminKadroPage />} />
    <Route path="matris" element={<AdminKadroMatrisPage />} />
    <Route path="rutinler" element={<AdminKadroRutinlerPage />} />
    <Route path="ilanlar" element={<AdminKadroIlanlarPage />} />
  </Route>
);
