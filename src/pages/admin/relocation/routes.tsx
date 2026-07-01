// src/pages/admin/relocation/routes.tsx
// Relocation ingestion admin route ağacı (service-finder/routes.tsx kalıbı).
/* eslint-disable react-refresh/only-export-components */
//
// Kullanım (src/pages/admin/routes.tsx):
//   import { relocationAdminRoutes } from "./relocation/routes";
//   ...
//   {relocationAdminRoutes}
//
// Yeni route eklerken admin-route-meta.ts ADMIN_ROUTE_PATTERNS ve
// admin-navigation-registry.ts kayıtları da güncellenmelidir (testler doğrular).

import { Route } from "react-router-dom";
import { lazy, Suspense } from "react";

const RelocationJobsPage = lazy(() => import("./RelocationJobsPage"));
const RelocationCandidatesPage = lazy(() => import("./RelocationCandidatesPage"));
const RelocationToolsQuestionCountsPage = lazy(
  () => import("./RelocationToolsQuestionCountsPage"),
);

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
      Yükleniyor...
    </div>
  );
}

export const relocationAdminRoutes = (
  <>
    <Route path="relocation-ingestion">
      <Route
        index
        element={
          <Suspense fallback={<PageFallback />}>
            <RelocationJobsPage />
          </Suspense>
        }
      />
      <Route
        path="candidates"
        element={
          <Suspense fallback={<PageFallback />}>
            <RelocationCandidatesPage />
          </Suspense>
        }
      />
    </Route>
    <Route path="relocation-tools">
      <Route
        path="soru-sayilari"
        element={
          <Suspense fallback={<PageFallback />}>
            <RelocationToolsQuestionCountsPage />
          </Suspense>
        }
      />
    </Route>
  </>
);
