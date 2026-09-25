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
import { Suspense } from "react";
import { lazyWithReload } from "@/lib/lazy-with-reload";

const ServiceFinderDashboardPage = lazyWithReload(() => import("./ServiceFinderDashboardPage"));
const ServiceFinderJobsPage = lazyWithReload(() => import("./ServiceFinderJobsPage"));
const ServiceFinderJobDetailPage = lazyWithReload(() => import("./ServiceFinderJobDetailPage"));
const ServiceFinderProvidersPage = lazyWithReload(() => import("./ServiceFinderProvidersPage"));
const ServiceFinderTemplatesPage = lazyWithReload(() => import("./ServiceFinderTemplatesPage"));
const ServiceFinderCostsPage = lazyWithReload(() => import("./ServiceFinderCostsPage"));
const ServiceFinderGuidePage = lazyWithReload(() => import("./ServiceFinderGuidePage"));

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
