// src/pages/admin/gruplar/routes.tsx
// Dijital Gruplar admin alt ağacı (/admin/gruplar, /admin/whatsapp-landings*) — muhasebe/cadde
// routes.tsx deseni (Faz 3 modülerleştirmesi). Path'ler kökteki eski satırlarla BİREBİR aynı;
// düz path'ler olduğu için sarmalayan <Route> YOK, fragment döner (URL değişmez).
// whatsapp-landings/guide → AdminCommunityGuidePage rehber/ modülündedir, kökte kalır.

import { lazyWithReload } from "@/lib/lazy-with-reload";
import { Route } from "react-router-dom";

const AdminWhatsAppLandingsPage = lazyWithReload(() => import("@/pages/admin/gruplar/AdminWhatsAppLandingsPage"));
// G24 · M5 moderatör paneli (tasarım §10 — dört kuyruk tek ekran)
const AdminGruplarPage = lazyWithReload(() => import("@/pages/admin/gruplar/AdminGruplarPage"));
const AdminWhatsAppLandingEditorsPage = lazyWithReload(
  () => import("@/pages/admin/gruplar/AdminWhatsAppLandingEditorsPage"),
);

export const adminGruplarRoutes = (
  <>
    <Route path="whatsapp-landings" element={<AdminWhatsAppLandingsPage />} />
    <Route path="whatsapp-landings/editors" element={<AdminWhatsAppLandingEditorsPage />} />
    <Route path="gruplar" element={<AdminGruplarPage />} />
  </>
);
