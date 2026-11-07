// src/pages/admin/relocation/routes.tsx
// Relocation ingestion admin route ağacı (service-finder/routes.tsx kalıbı).
//
// Kullanım (src/pages/admin/routes.tsx):
//   import { relocationAdminRoutes } from "./relocation/routes";
//   ...
//   {relocationAdminRoutes}
//
// Yeni route eklerken admin-route-meta.ts ADMIN_ROUTE_PATTERNS ve
// admin-navigation-registry.ts kayıtları da güncellenmelidir (testler doğrular).

import { Route } from "react-router-dom";
import { Suspense } from "react";
import { lazyWithReload } from "@/lib/lazy-with-reload";
import { AdminLoadingState } from "@/components/admin/page/AdminLoadingState";

const RelocationJobsPage = lazyWithReload(() => import("./RelocationJobsPage"));
const RelocationCandidatesPage = lazyWithReload(() => import("./RelocationCandidatesPage"));
const RelocationToolsQuestionCountsPage = lazyWithReload(() => import("./RelocationToolsQuestionCountsPage"));

export const relocationAdminRoutes = (
  <>
    <Route path="relocation-ingestion">
      <Route
        index
        element={
          <Suspense fallback={<AdminLoadingState />}>
            <RelocationJobsPage />
          </Suspense>
        }
      />
      <Route
        path="candidates"
        element={
          <Suspense fallback={<AdminLoadingState />}>
            <RelocationCandidatesPage />
          </Suspense>
        }
      />
    </Route>
    <Route path="relocation-tools">
      <Route
        path="soru-sayilari"
        element={
          <Suspense fallback={<AdminLoadingState />}>
            <RelocationToolsQuestionCountsPage />
          </Suspense>
        }
      />
    </Route>
  </>
);
