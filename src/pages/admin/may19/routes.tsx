// src/pages/admin/may19/routes.tsx
// 19 Mayıs kampanyası admin alt ağacı (may19/kelime, may19/ani) — Faz 3 modülerleştirmesi.
// Path'ler kökteki eski satırlarla BİREBİR aynı; düz path'ler olduğu için sarmalayan
// <Route> YOK, fragment döner (URL değişmez). Yönlendirme (Navigate) satırları kökte kalır.

import { lazyWithReload } from "@/lib/lazy-with-reload";
import { Route } from "react-router-dom";

const AdminMay19IdeaPage = lazyWithReload(() => import("@/pages/admin/may19/AdminMay19IdeaPage"));
const AdminMay19MomentPage = lazyWithReload(() => import("@/pages/admin/may19/AdminMay19MomentPage"));

export const adminMay19Routes = (
  <>
    <Route path="may19/kelime" element={<AdminMay19IdeaPage />} />
    <Route path="may19/ani" element={<AdminMay19MomentPage />} />
  </>
);
