// src/pages/admin/rehber/routes.tsx
// Rehber sayfaları admin alt ağacı (guide, new-member/guide, whatsapp-landings/guide, yenilik-rehberi) — Faz 3 modülerleştirmesi.
// Path'ler kökteki eski satırlarla BİREBİR aynı; düz path'ler olduğu için sarmalayan
// <Route> YOK, fragment döner (URL değişmez). Yönlendirme (Navigate) satırları kökte kalır.

import { lazyWithReload } from "@/lib/lazy-with-reload";
import { Route } from "react-router-dom";

const AdminGuidePage = lazyWithReload(() => import("@/pages/admin/rehber/AdminGuidePage"));
const AdminCommunityGuidePage = lazyWithReload(() => import("@/pages/admin/rehber/AdminCommunityGuidePage"));
const AdminNewMemberGuidePage = lazyWithReload(() => import("@/pages/admin/rehber/AdminNewMemberGuidePage"));
const AdminYenilikRehberiPage = lazyWithReload(() => import("@/pages/admin/rehber/AdminYenilikRehberiPage"));

export const adminRehberRoutes = (
  <>
    <Route path="guide" element={<AdminGuidePage />} />
    <Route path="whatsapp-landings/guide" element={<AdminCommunityGuidePage />} />
    <Route path="new-member/guide" element={<AdminNewMemberGuidePage />} />
    <Route path="yenilik-rehberi" element={<AdminYenilikRehberiPage />} />
  </>
);
