// src/pages/admin/service-finder/routes.tsx
// Service Finder modülünün route ağacı (muhasebe deseni).
/* eslint-disable react-refresh/only-export-components */
//
// Kullanım (src/pages/admin/routes.tsx):
//   import { serviceFinderRoutes } from "./service-finder/routes";
//   ...
//   <Route path="/admin" element={<AdminLayout />}>
//     {serviceFinderRoutes}
//   </Route>
//
// Yeni route eklerken admin-route-meta.ts ADMIN_ROUTE_PATTERNS ve
// admin-navigation-registry.ts kayıtları da güncellenmelidir (testler doğrular).

import { Route } from "react-router-dom";
import { lazy, Suspense } from "react";

const ServiceFinderDashboardPage = lazy(() => import("./ServiceFinderDashboardPage"));
const ServiceFinderJobsPage = lazy(() => import("./ServiceFinderJobsPage"));
const ServiceFinderJobDetailPage = lazy(() => import("./ServiceFinderJobDetailPage"));
const ServiceFinderProvidersPage = lazy(() => import("./ServiceFinderProvidersPage"));
const ServiceFinderTemplatesPage = lazy(() => import("./ServiceFinderTemplatesPage"));
const ServiceFinderCostsPage = lazy(() => import("./ServiceFinderCostsPage"));
const ServiceFinderGuidePage = lazy(() => import("./ServiceFinderGuidePage"));

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
      Yükleniyor...
    </div>
  );
}

export const serviceFinderRoutes = (
  <Route path="service-finder">
    <Route
      index
      element={
        <Suspense fallback={<PageFallback />}>
          <ServiceFinderDashboardPage />
        </Suspense>
      }
    />
    <Route
      path="jobs"
      element={
        <Suspense fallback={<PageFallback />}>
          <ServiceFinderJobsPage />
        </Suspense>
      }
    />
    <Route
      path="jobs/:jobId"
      element={
        <Suspense fallback={<PageFallback />}>
          <ServiceFinderJobDetailPage />
        </Suspense>
      }
    />
    <Route
      path="providers"
      element={
        <Suspense fallback={<PageFallback />}>
          <ServiceFinderProvidersPage />
        </Suspense>
      }
    />
    <Route
      path="templates"
      element={
        <Suspense fallback={<PageFallback />}>
          <ServiceFinderTemplatesPage />
        </Suspense>
      }
    />
    <Route
      path="costs"
      element={
        <Suspense fallback={<PageFallback />}>
          <ServiceFinderCostsPage />
        </Suspense>
      }
    />
    <Route
      path="guide"
      element={
        <Suspense fallback={<PageFallback />}>
          <ServiceFinderGuidePage />
        </Suspense>
      }
    />
  </Route>
);
