// src/pages/admin/social/routes.tsx
// Sosyal medya / bağlantı yönetimi admin alt ağacı (advisors/:profile, social-media, social-share-vault, links) — Faz 3 modülerleştirmesi.
// Path'ler kökteki eski satırlarla BİREBİR aynı; fragment döner (URL değişmez). advisors bloğu
// kendi iç içe yapısıyla (index Navigate + :profile) aynen taşındı.

import { lazyWithReload } from "@/lib/lazy-with-reload";
import { Navigate, Route } from "react-router-dom";

const AdminAdvisorLinksPage = lazyWithReload(() => import("@/pages/admin/social/AdminAdvisorLinksPage"));
const AdminSocialMediaLinksPage = lazyWithReload(() => import("@/pages/admin/social/AdminSocialMediaLinksPage"));
const AdminSocialShareVaultPage = lazyWithReload(() => import("@/pages/admin/social/AdminSocialShareVaultPage"));
const AdminLinksPage = lazyWithReload(() => import("@/pages/admin/social/AdminLinksPage"));

export const adminSocialRoutes = (
  <>
    <Route path="advisors">
      <Route index element={<Navigate to="/admin/advisors/consultant" replace />} />
      <Route path=":profile" element={<AdminAdvisorLinksPage />} />
    </Route>
    <Route path="social-media" element={<AdminSocialMediaLinksPage />} />
    <Route path="social-share-vault" element={<AdminSocialShareVaultPage />} />
    <Route path="links" element={<AdminLinksPage />} />
  </>
);
