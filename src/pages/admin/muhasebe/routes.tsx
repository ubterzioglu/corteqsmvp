// src/pages/admin/muhasebe/routes.tsx
// Muhasebe modülünün route ağacı.
/* eslint-disable react-refresh/only-export-components */
// Mevcut App.tsx içindeki /admin route'u altına Route element'i olarak eklenir.
//
// Örnek kullanım App.tsx içinde:
//
//   import { muhasebeRoutes } from "@/pages/admin/muhasebe/routes";
//   ...
//   <Route path="/admin" element={<AdminLayout />}>
//     <Route index element={<AdminHome />} />
//     <Route path="submissions" element={<SubmissionsPage />} />
//     {muhasebeRoutes}                     {/* <-- buraya ekle */}
//   </Route>

import { Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Code-splitting: muhasebe sayfaları ihtiyaç anında yüklensin
const MuhasebeLayout    = lazy(() => import('./MuhasebeLayout'));
const MuhasebeDashboard = lazy(() => import('./MuhasebeDashboard'));
const GiderlerPage      = lazy(() => import('./GiderlerPage'));
const GelirlerPage      = lazy(() => import('./GelirlerPage'));
const NakitAkisiPage    = lazy(() => import('./NakitAkisiPage'));

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
      Yükleniyor...
    </div>
  );
}

// Re-usable route subtree. Parent route (AdminLayout) must also guard via auth.
export const muhasebeRoutes = (
  <Route
    path="muhasebe"
    element={
      <Suspense fallback={<PageFallback />}>
        <MuhasebeLayout />
      </Suspense>
    }
  >
    <Route
      index
      element={
        <Suspense fallback={<PageFallback />}>
          <MuhasebeDashboard />
        </Suspense>
      }
    />
    <Route
      path="giderler"
      element={
        <Suspense fallback={<PageFallback />}>
          <GiderlerPage />
        </Suspense>
      }
    />
    <Route
      path="gelirler"
      element={
        <Suspense fallback={<PageFallback />}>
          <GelirlerPage />
        </Suspense>
      }
    />
    <Route
      path="nakit-akisi"
      element={
        <Suspense fallback={<PageFallback />}>
          <NakitAkisiPage />
        </Suspense>
      }
    />
  </Route>
);
