import { lazyWithReload } from "@/lib/lazy-with-reload";
import { Route } from "react-router-dom";

const AdminKadroPage = lazyWithReload(() => import("@/pages/admin/kadro/AdminKadroPage"));
const AdminKadroMatrisPage = lazyWithReload(() => import("@/pages/admin/kadro/AdminKadroMatrisPage"));
const AdminKadroRutinlerPage = lazyWithReload(() => import("@/pages/admin/kadro/AdminKadroRutinlerPage"));
const AdminKadroIlanlarPage = lazyWithReload(() => import("@/pages/admin/kadro/AdminKadroIlanlarPage"));

export const adminKadroRoutes = (
  <Route path="kadro">
    <Route index element={<AdminKadroPage />} />
    <Route path="matris" element={<AdminKadroMatrisPage />} />
    <Route path="rutinler" element={<AdminKadroRutinlerPage />} />
    <Route path="ilanlar" element={<AdminKadroIlanlarPage />} />
  </Route>
);
