# Implementation Plan: Unified Catalog + Users Admin View with Auto Rule Management & Claim Workflow

## 1. Gereksinimlerin Yeniden İfadesi

Dört birbirine bağlı özellik:

1. **Tek tablo unified view** — Auth'lu kullanıcılar + katalog item'lar tek admin tablosunda görünsün
2. **Rol atayınca otomatik UI** — Item'a rol atandığında o rolün attribute/feature/section kuralları admin panelinde yönetilebilir olsun (şu an sadece sayım var)
3. **Claim butonu + admin görünümü** — Hangi kullanıcının hangi item için claim talebinde bulunduğunu listeleyen, approve/reject edebilen admin paneli
4. **Admin aracılığıyla editing yetkisi** — Claim onaylandığında veya admin istediğinde kullanıcıya item üzerinde editing yetkisi verilebilsin

---

## 2. Mimari Kararlar

**Unified view:** `admin_list_unified_records` RPC ile `catalog_items` + `profiles` `union all` → ortak şema (`id, kind, title, status, platform_role_key, city, created_at...`). View değil RPC — PII koruması için `is_moderator` guard zorunlu.

**Rule override yazma:** 6 yeni `SECURITY DEFINER` RPC (3 upsert + 3 delete). `get_catalog_item_rules` okuma tarafı zaten hazır, sadece yazma tarafı eksik.

**Claim yönetimi:** `admin_list_catalog_claims` yeni RPC + mevcut `admin_approve_catalog_claim` / `review_catalog_claim_request` RPC'lerini UI'a bağlamak yeterli.

---

## 3. Fazlar ve Adımlar

### Faz 1 — Rule Yönetim UI (DB okuma hazır, yazma + UI eksik)

| Adım | Ne yapılacak | Dosya |
|------|-------------|-------|
| 1 | Override yazma/silme RPC'leri (6 adet) | `supabase/migrations/20260606050000_catalog_item_override_rpcs.sql` YENİ |
| 2 | API katmanı genişletme | `src/lib/admin-catalog.ts` |
| 3 | `CatalogItemRuleManager` + `CatalogItemRuleRow` bileşenleri | `src/components/admin/catalog/` YENİ |
| 4 | `CatalogItemRolePanel` entegrasyonu | mevcut dosya güncelle |
| 5 | Testler | `admin-catalog.test.ts` + `CatalogItemRuleManager.test.tsx` |

### Faz 2 — Claim Admin Görünümü + Editor Yetki Yönetimi

| Adım | Ne yapılacak | Dosya |
|------|-------------|-------|
| 6 | `admin_list_catalog_claims` + `admin_search_profiles` RPC | `supabase/migrations/20260606060000_catalog_claim_admin_rpcs.sql` YENİ |
| 7 | API katmanı: `listCatalogClaims`, `rejectCatalogClaim`, `searchAdminProfiles` | `src/lib/admin-catalog.ts` |
| 8 | `CatalogClaimRequestsPanel` bileşeni | `src/components/admin/catalog/` YENİ |
| 9 | Editor panel: UUID input → kullanıcı arama combobox | `CatalogItemEditorsPanel.tsx` |
| 10 | Sheet'e "Talepler" tab'ı ekleme | `AdminCatalogPage.tsx` |
| 11 | Testler | |

### Faz 3 — Unified View (Katalog + Kullanıcılar tek tablo)

| Adım | Ne yapılacak | Dosya |
|------|-------------|-------|
| 12 | `admin_list_unified_records` RPC (union all + server-side sayfalama) | `supabase/migrations/20260606070000_catalog_unified_admin_view.sql` YENİ |
| 13 | API + tip tanımları (`UnifiedRecord`, `UnifiedRecordKind`) | `admin-catalog.ts` + `catalog-types.ts` |
| 14 | Tablo: "Tür" kolonu + `kind` filtresi + koşullu Sheet | `AdminCatalogPage.tsx` |
| 15 | Testler | |

---

## 4. Riskler

| Risk | Önem | Önlem |
|------|------|-------|
| `profiles` PII sızması | Yüksek | Tüm okuma `is_moderator` guard'lı SECURITY DEFINER RPC |
| Migration sırası / çakışma | Orta | Sadece yeni `20260606050000+` dosyalar, mevcut hiçbir migration değiştirilmez |
| Override UX karmaşası | Orta | Inherited satırı değiştirmek → override kaydı oluşturur; "Varsayılana dön" override'ı siler; `isOverride` rozeti gösterilir |
| Claim approval membership karmaşası | Orta | `review_catalog_claim_request` `editor` veriyor — UI metni "düzenleme yetkisi" der, test ortamında doğrulanır |
| Client-side 1000-limit scale riski | Düşük→ | Faz 3'te server-side sayfalamaya geçilir |

---

## 5. Karmaşıklık

| Faz | DB | Yeni dosya | Karmaşıklık | Bağımsız deploy |
|-----|-----|-----------|-------------|-----------------|
| Faz 1 — Rule UI | 1 migration (6 RPC) | 2 bileşen + 2 test | Orta | ✅ |
| Faz 2 — Claim admin | 1 migration (2 RPC) | 1 bileşen + 3 düzenleme | Orta | ✅ |
| Faz 3 — Unified view | 1 migration (1 RPC) | 3 düzenleme + tip | Yüksek | ✅ |

**Toplam:** 3 migration, ~4 yeni bileşen, ~4 düzenlenen dosya, ~6 test dosyası.

**Mevcut altyapıdan hazır olanlar:**
- `get_catalog_item_rules` → okuma hazır ✅
- `admin_approve_catalog_claim` / `admin_grant_catalog_editor` → RPC hazır ✅
- `catalog_item_*_overrides` tabloları → DB hazır ✅
- Claim butonu public sayfada → hazır ✅
