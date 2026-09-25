// src/pages/admin/radar/routes.tsx
// Radar News Pipeline modülünün route ağacı (service-finder deseni).
/* eslint-disable react-refresh/only-export-components */

import { Route } from "react-router-dom";
import { Suspense } from "react";
import { lazyWithReload } from "@/lib/lazy-with-reload";

const AdminRadarQueuePage = lazyWithReload(() => import("../AdminRadarQueuePage"));
const AdminRadarSourcesPage = lazyWithReload(() => import("../AdminRadarSourcesPage"));
const AdminRadarRunsPage = lazyWithReload(() => import("../AdminRadarRunsPage"));
const AdminRadarGuidePage = lazyWithReload(() => import("../AdminRadarGuidePage"));

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
      Yükleniyor...
    </div>
  );
}

export const radarRoutes = (
  <Route path="radar">
    <Route
      index
      element={
        <Suspense fallback={<PageFallback />}>
          <AdminRadarQueuePage />
        </Suspense>
      }
    />
    <Route
      path="queue"
      element={
        <Suspense fallback={<PageFallback />}>
          <AdminRadarQueuePage />
        </Suspense>
      }
    />
    <Route
      path="sources"
      element={
        <Suspense fallback={<PageFallback />}>
          <AdminRadarSourcesPage />
        </Suspense>
      }
    />
    <Route
      path="runs"
      element={
        <Suspense fallback={<PageFallback />}>
          <AdminRadarRunsPage />
        </Suspense>
      }
    />
    <Route
      path="rehber"
      element={
        <Suspense fallback={<PageFallback />}>
          <AdminRadarGuidePage />
        </Suspense>
      }
    />
  </Route>
);
