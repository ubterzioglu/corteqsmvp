// src/pages/admin/muhasebe/routes.tsx
// Muhasebe modülünün route ağacı.
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

import { Route } from "react-router-dom";
import { Suspense } from "react";
import { lazyWithReload } from "@/lib/lazy-with-reload";
import { AdminLoadingState } from "@/components/admin/page/AdminLoadingState";

// Code-splitting: muhasebe sayfaları ihtiyaç anında yüklensin
const MuhasebeLayout = lazyWithReload(() => import("./MuhasebeLayout"));
const MuhasebeDashboard = lazyWithReload(() => import("./MuhasebeDashboard"));
const GiderlerPage = lazyWithReload(() => import("./GiderlerPage"));
const GelirlerPage = lazyWithReload(() => import("./GelirlerPage"));
const NakitAkisiPage = lazyWithReload(() => import("./NakitAkisiPage"));
const ButcePage = lazyWithReload(() => import("./butce/ButcePage"));

// Re-usable route subtree. Parent route (AdminLayout) must also guard via auth.
export const muhasebeRoutes = (
  <Route
    path="muhasebe"
    element={
      <Suspense fallback={<AdminLoadingState />}>
        <MuhasebeLayout />
      </Suspense>
    }
  >
    <Route
      index
      element={
        <Suspense fallback={<AdminLoadingState />}>
          <MuhasebeDashboard />
        </Suspense>
      }
    />
    <Route
      path="giderler"
      element={
        <Suspense fallback={<AdminLoadingState />}>
          <GiderlerPage />
        </Suspense>
      }
    />
    <Route
      path="gelirler"
      element={
        <Suspense fallback={<AdminLoadingState />}>
          <GelirlerPage />
        </Suspense>
      }
    />
    <Route
      path="nakit-akisi"
      element={
        <Suspense fallback={<AdminLoadingState />}>
          <NakitAkisiPage />
        </Suspense>
      }
    />
    <Route
      path="butce"
      element={
        <Suspense fallback={<AdminLoadingState />}>
          <ButcePage />
        </Suspense>
      }
    />
  </Route>
);
