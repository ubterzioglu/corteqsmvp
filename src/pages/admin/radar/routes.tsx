// src/pages/admin/radar/routes.tsx
// Radar News Pipeline modülünün route ağacı (service-finder deseni).

import { Route } from "react-router-dom";
import { Suspense } from "react";
import { lazyWithReload } from "@/lib/lazy-with-reload";
import { AdminLoadingState } from "@/components/admin/page/AdminLoadingState";

const AdminRadarQueuePage = lazyWithReload(() => import("./AdminRadarQueuePage"));
const AdminRadarSourcesPage = lazyWithReload(() => import("./AdminRadarSourcesPage"));
const AdminRadarRunsPage = lazyWithReload(() => import("./AdminRadarRunsPage"));
const AdminRadarGuidePage = lazyWithReload(() => import("./AdminRadarGuidePage"));

export const radarRoutes = (
  <Route path="radar">
    <Route
      index
      element={
        <Suspense fallback={<AdminLoadingState />}>
          <AdminRadarQueuePage />
        </Suspense>
      }
    />
    <Route
      path="queue"
      element={
        <Suspense fallback={<AdminLoadingState />}>
          <AdminRadarQueuePage />
        </Suspense>
      }
    />
    <Route
      path="sources"
      element={
        <Suspense fallback={<AdminLoadingState />}>
          <AdminRadarSourcesPage />
        </Suspense>
      }
    />
    <Route
      path="runs"
      element={
        <Suspense fallback={<AdminLoadingState />}>
          <AdminRadarRunsPage />
        </Suspense>
      }
    />
    <Route
      path="rehber"
      element={
        <Suspense fallback={<AdminLoadingState />}>
          <AdminRadarGuidePage />
        </Suspense>
      }
    />
  </Route>
);
