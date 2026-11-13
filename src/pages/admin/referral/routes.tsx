// src/pages/admin/referral/routes.tsx
// /admin/referral* alt ağacı — muhasebe/cadde routes.tsx deseni (Faz 3 modülerleştirmesi).
// Path'ler kökteki eski satırlarla BİREBİR aynı; sayfalar düz path taşıdığı için
// <Route path="referral"> sarmalaması YOK (URL değişmez), fragment döner.

import { lazyWithReload } from "@/lib/lazy-with-reload";
import { Route } from "react-router-dom";

const AdminReferralPage = lazyWithReload(() => import("@/pages/admin/referral/AdminReferralPage"));
const AdminReferralSourcesPage = lazyWithReload(() => import("@/pages/admin/referral/AdminReferralSourcesPage"));
const AdminReferralGroupsPage = lazyWithReload(() => import("@/pages/admin/referral/AdminReferralGroupsPage"));
const AdminReferralTypesPage = lazyWithReload(() => import("@/pages/admin/referral/AdminReferralTypesPage"));

export const adminReferralRoutes = (
  <>
    <Route path="referral" element={<AdminReferralPage />} />
    <Route path="referral/sources" element={<AdminReferralSourcesPage />} />
    <Route path="referral/groups" element={<AdminReferralGroupsPage />} />
    <Route path="referral/types" element={<AdminReferralTypesPage />} />
  </>
);
