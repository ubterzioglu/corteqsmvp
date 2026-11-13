// src/pages/admin/sistem/routes.tsx
// Sistem/izleme admin alt ağacı (audit-logs, client-errors, veritabani-tablolari, notifications, tools, agent-analytics, new-member/durum-raporu, traction) — Faz 3 modülerleştirmesi.
// Path'ler kökteki eski satırlarla BİREBİR aynı; düz path'ler olduğu için sarmalayan
// <Route> YOK, fragment döner (URL değişmez). Yönlendirme (Navigate) satırları kökte kalır.

import { lazyWithReload } from "@/lib/lazy-with-reload";
import { Route } from "react-router-dom";

const AdminAuditLogsPage = lazyWithReload(() => import("@/pages/admin/sistem/AdminAuditLogsPage"));
const AdminClientErrorsPage = lazyWithReload(() => import("@/pages/admin/sistem/AdminClientErrorsPage"));
const AdminDatabaseTablesPage = lazyWithReload(() => import("@/pages/admin/sistem/AdminDatabaseTablesPage"));
const AdminNotificationSettingsPage = lazyWithReload(
  () => import("@/pages/admin/sistem/AdminNotificationSettingsPage"),
);
const AdminToolRegistryPage = lazyWithReload(() => import("@/pages/admin/sistem/AdminToolRegistryPage"));
const AdminAgentAnalyticsPage = lazyWithReload(() => import("@/pages/admin/sistem/AdminAgentAnalyticsPage"));
const AdminDurumRaporuPage = lazyWithReload(() => import("@/pages/admin/sistem/AdminDurumRaporuPage"));
const AdminTractionPage = lazyWithReload(() => import("@/pages/admin/sistem/AdminTractionPage"));

export const adminSistemRoutes = (
  <>
    <Route path="audit-logs" element={<AdminAuditLogsPage />} />
    <Route path="client-errors" element={<AdminClientErrorsPage />} />
    <Route path="veritabani-tablolari" element={<AdminDatabaseTablesPage />} />
    <Route path="notifications" element={<AdminNotificationSettingsPage />} />
    <Route path="tools" element={<AdminToolRegistryPage />} />
    <Route path="agent-analytics" element={<AdminAgentAnalyticsPage />} />
    <Route path="new-member/durum-raporu" element={<AdminDurumRaporuPage />} />
    <Route path="traction" element={<AdminTractionPage />} />
  </>
);
