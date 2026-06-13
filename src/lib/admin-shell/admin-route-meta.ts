// Admin Panel V2 — route metadata.
// İki amaç:
// 1) ADMIN_ROUTE_PATTERNS: App.tsx'teki /admin route ağacının snapshot'ı.
//    Registry'deki her internal URL'in gerçek bir route'a denk geldiği
//    testlerle bu listeye karşı doğrulanır (masterplan Risk 1 önlemi).
// 2) adminRouteMeta: navigasyonda görünmeyen sayfalar ve redirect-only
//    path'ler için breadcrumb / dokümantasyon metadata'sı.

import type { AdminRouteMeta } from "./admin-shell-types";

/**
 * App.tsx /admin ağacındaki tüm route pattern'leri (2026-06-10 snapshot).
 * Path değerleri DEĞİŞTİRİLEMEZ; yeni route eklenince buraya da eklenmelidir.
 */
export const ADMIN_ROUTE_PATTERNS: string[] = [
  "/admin",
  "/admin/referral",
  "/admin/referral/sources",
  "/admin/referral/groups",
  "/admin/referral/types",
  "/admin/marquee",
  "/admin/blog",
  "/admin/cadde",
  "/admin/cadde/promotions",
  "/admin/cadde/moderation",
  "/admin/cadde/carsi",
  "/admin/cadde/rehber",
  "/admin/advisors",
  "/admin/advisors/:profile",
  "/admin/social-media",
  "/admin/surveys",
  "/admin/surveys/new",
  "/admin/surveys/:id/edit",
  "/admin/surveys/:id/responses",
  "/admin/new-member/profile-role-assignment",
  "/admin/new-member/role-matrix",
  "/admin/new-member/roles-overview",
  "/admin/new-member/users-roles",
  "/admin/data",
  "/admin/data/:category",
  "/admin/veritabani-tablolari",
  "/admin/new-member/guide",
  "/admin/new-member/durum-raporu",
  "/admin/new-member/roles-list",
  "/admin/new-member/roles-features",
  "/admin/new-member/attributes",
  "/admin/new-member/profile-sections",
  "/admin/new-member/taxonomy",
  "/admin/new-member/overrides",
  "/admin/new-member/role-management",
  "/admin/new-member/roles-preview",
  "/admin/new-member/entity-preview",
  "/admin/approvals",
  "/admin/audit-logs",
  "/admin/roller-taslak",
  "/admin/whatsapp-landings",
  "/admin/whatsapp-landings/editors",
  "/admin/whatsapp-landings/guide",
  "/admin/consulates",
  "/admin/dunya-kupasi",
  "/admin/may19/kelime",
  "/admin/may19/ani",
  "/admin/about",
  "/admin/guide",
  "/admin/workspace",
  "/admin/workspace/command-center",
  "/admin/workspace/resources",
  "/admin/workspace/resources/arge",
  "/admin/workspace/resources/insankaynaklari",
  "/admin/workspace/todos",
  "/admin/workspace/meeting-notes",
  "/admin/workspace/mvp",
  "/admin/workspace/docs/:slug",
  "/admin/muhasebe",
  "/admin/muhasebe/giderler",
  "/admin/muhasebe/gelirler",
  "/admin/muhasebe/nakit-akisi",
  "/admin/service-finder",
  "/admin/service-finder/jobs",
  "/admin/service-finder/jobs/:jobId",
  "/admin/service-finder/providers",
  "/admin/service-finder/templates",
  "/admin/service-finder/costs",
  "/admin/service-finder/guide",
  "/admin/radar/queue",
  "/admin/radar/sources",
  "/admin/radar/runs",
];

/**
 * Navigasyon registry'sinde görünmeyen route'ların metadata'sı.
 * "page": görünür nav item'ı olmayan gerçek ekranlar (breadcrumb için).
 * "redirect": backward-compat redirect'ler (dokümantasyon + test envanteri).
 */
export const adminRouteMeta: AdminRouteMeta[] = [
  // Görünür nav item'ı olmayan gerçek sayfalar
  { pattern: "/admin/referral/sources", label: "Kaynaklar", parentId: "referral", kind: "page" },
  { pattern: "/admin/referral/groups", label: "Gruplar", parentId: "referral", kind: "page" },
  { pattern: "/admin/referral/types", label: "Tipler", parentId: "referral", kind: "page" },
  { pattern: "/admin/surveys/new", label: "Yeni Anket", parentId: "surveys", kind: "page" },
  { pattern: "/admin/surveys/:id/edit", label: "Anket Düzenle", parentId: "surveys", kind: "page" },
  { pattern: "/admin/surveys/:id/responses", label: "Anket Cevapları", parentId: "surveys", kind: "page" },
  { pattern: "/admin/workspace/todos", label: "Todo Listesi", parentId: "workspace-home", kind: "page" },
  { pattern: "/admin/workspace/meeting-notes", label: "Toplantı Notları", parentId: "workspace-home", kind: "page" },

  // Redirect-only route'lar (App.tsx <Navigate /> hedefleri)
  { pattern: "/admin/advisors", kind: "redirect", redirectTo: "/admin/advisors/consultant" },
  { pattern: "/admin/new-member/users-roles", kind: "redirect", redirectTo: "/admin/new-member/profile-role-assignment" },
  { pattern: "/admin/new-member/roles-list", kind: "redirect", redirectTo: "/admin/new-member/guide#rol-listesi" },
  { pattern: "/admin/new-member/roles-features", kind: "redirect", redirectTo: "/admin/new-member/role-matrix?kind=feature" },
  { pattern: "/admin/new-member/attributes", kind: "redirect", redirectTo: "/admin/new-member/role-matrix?kind=attribute" },
  { pattern: "/admin/new-member/profile-sections", kind: "redirect", redirectTo: "/admin/new-member/role-matrix?kind=profile_section" },
  { pattern: "/admin/new-member/taxonomy", kind: "redirect", redirectTo: "/admin/new-member/guide?notice=taxonomy-retired" },
  { pattern: "/admin/new-member/role-management", kind: "redirect", redirectTo: "/admin/new-member/role-matrix" },
  { pattern: "/admin/new-member/roles-preview", kind: "redirect", redirectTo: "/admin/new-member/role-matrix" },
  { pattern: "/admin/new-member/entity-preview", kind: "redirect", redirectTo: "/admin/new-member/role-matrix" },
  { pattern: "/admin/data/:category", kind: "redirect", redirectTo: "/admin/data" },
  { pattern: "/admin/workspace/resources/arge", kind: "redirect", redirectTo: "/admin/workspace/resources?section=arge" },
  { pattern: "/admin/workspace/resources/insankaynaklari", kind: "redirect", redirectTo: "/admin/workspace/resources?section=insankaynaklari" },
];
