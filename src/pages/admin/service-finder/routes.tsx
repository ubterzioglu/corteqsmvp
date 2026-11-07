// src/pages/admin/service-finder/routes.tsx
// Service Finder modülünün route ağacı (muhasebe deseni).
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
import { AdminLoadingState } from "@/components/admin/page/AdminLoadingState";

const ServiceFinderDashboardPage = lazyWithReload(() => import("./ServiceFinderDashboardPage"));
const ServiceFinderJobsPage = lazyWithReload(() => import("./ServiceFinderJobsPage"));
const ServiceFinderJobDetailPage = lazyWithReload(() => import("./ServiceFinderJobDetailPage"));
const ServiceFinderProvidersPage = lazyWithReload(() => import("./ServiceFinderProvidersPage"));
const ServiceFinderTemplatesPage = lazyWithReload(() => import("./ServiceFinderTemplatesPage"));
const ServiceFinderCostsPage = lazyWithReload(() => import("./ServiceFinderCostsPage"));
const ServiceFinderGuidePage = lazyWithReload(() => import("./ServiceFinderGuidePage"));

export const serviceFinderRoutes = (
  <Route path="service-finder">
    <Route
      index
      element={
        <Suspense fallback={<AdminLoadingState />}>
          <ServiceFinderDashboardPage />
        </Suspense>
      }
    />
    <Route
      path="jobs"
      element={
        <Suspense fallback={<AdminLoadingState />}>
          <ServiceFinderJobsPage />
        </Suspense>
      }
    />
    <Route
      path="jobs/:jobId"
      element={
        <Suspense fallback={<AdminLoadingState />}>
          <ServiceFinderJobDetailPage />
        </Suspense>
      }
    />
    <Route
      path="providers"
      element={
        <Suspense fallback={<AdminLoadingState />}>
          <ServiceFinderProvidersPage />
        </Suspense>
      }
    />
    <Route
      path="templates"
      element={
        <Suspense fallback={<AdminLoadingState />}>
          <ServiceFinderTemplatesPage />
        </Suspense>
      }
    />
    <Route
      path="costs"
      element={
        <Suspense fallback={<AdminLoadingState />}>
          <ServiceFinderCostsPage />
        </Suspense>
      }
    />
    <Route
      path="guide"
      element={
        <Suspense fallback={<AdminLoadingState />}>
          <ServiceFinderGuidePage />
        </Suspense>
      }
    />
  </Route>
);
