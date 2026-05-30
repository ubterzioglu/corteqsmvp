# New Member System - Login Kullanıcıları, Roller ve Featurelar

Tarih: 24 Mayıs 2026  
Kapsam: `c:\temp_private\corteqs\corteqs_landing`

## 1) Kapsam ve Kapsam Dışı

Bu doküman yalnızca Google/login kullanıcıları için New Member System yönetimini kapsar:

1. Loginli kullanıcı listesi ve kullanıcıya rol atama
2. Roller ve role bağlı feature matrisi yönetimi
3. Kullanıcı override + role default + global switch ile effective feature hesaplama

Kapsam dışı:

- Form üyeleri ve submission tarafı (`/admin/members`, `submissions`)
- Referral, survey, muhasebe, workspace ve diğer admin modülleri

## 2) Admin Navigasyon ve Route Yapısı

`/admin` altında `New Member System` dropdown iki alt menü içerir:

1. `Loginli Kullanıcılar & Roller` -> `/admin/new-member/users-roles`
2. `Roller & Featurelar` -> `/admin/new-member/roles-features`

Geriye uyumluluk:

- Eski `/admin/roller-taslak` route’u korunur ve `/admin/new-member/users-roles` adresine redirect eder.

## 3) Veri Modeli

## 3.1 Korunan Tablolar

- `public.user_profiles`
- `public.feature_catalog`
- `public.role_feature_defaults` (eski default/template kaynağı olarak korunur)
- `public.user_feature_overrides`

## 3.2 Yeni Tablolar (Split Model)

Migration: `supabase/migrations/20260524162000_split_new_member_system_roles_and_features.sql`

1. `public.roles`
   - `id`, `key`, `label`, `description`, `sort_order`, `is_active`
   - Seed: 6 mevcut profile type değeri

2. `public.user_role_assignments`
   - `user_id` (PK, kullanıcı başına tek aktif rol)
   - `role_id` (FK -> roles.id)
   - `updated_by`, `created_at`, `updated_at`

3. `public.role_feature_flags`
   - `(role_id, feature_key)` PK
   - `is_enabled`
   - `updated_by`, `created_at`, `updated_at`

## 3.3 Backfill ve Senkron

Backfill:

- `user_profiles.profile_type` -> `user_role_assignments`
- `role_feature_defaults(profile_type, feature_key)` -> `role_feature_flags`

Senkron:

- `user_profiles.profile_type` değişirse `user_role_assignments` güncellenir
- `user_role_assignments.role_id` değişirse `user_profiles.profile_type` güncellenir

Bu sayede eski akışlarla uyumluluk korunur.

## 4) RPC Katmanı

Admin RPC’ler:

1. `public.admin_set_user_role(target_user_id uuid, role_key text)`
2. `public.admin_set_role_feature_flag(role_key text, feature_key text, is_enabled boolean)`
3. Mevcut override RPC’leri korunur:
   - `public.admin_set_user_feature_override(...)`
   - `public.admin_clear_user_feature_override(...)`

Feature çözümleme RPC:

- `public.get_current_user_features()`

Öncelik:

1. `user_feature_overrides`
2. `role_feature_flags`
3. `role_feature_defaults` (fallback uyumluluk)
4. `false`

Global switch kuralı:

- `feature_catalog.is_active_globally = false` ise effective her durumda `false`.

Yetki:

- Tüm admin RPC’ler `public.is_admin(auth.uid())` kontrolü ile çalışır.

## 5) Frontend Ekran Ayrımı

## 5.1 Ekran 1: Loginli Kullanıcılar & Roller

Dosya: `src/pages/admin/AdminLoginUsersRolesPage.tsx`

İçerik:

- Login kullanıcılarını `user_profiles` üzerinden listeler
- Provider filtresi (Google varsayılan), tarih, arama, sıralama
- Kullanıcı bazında tek rol atama/değiştirme
- Kaydetme RPC: `admin_set_user_role`

Not:

- Bu ekranda feature toggle gösterilmez.

## 5.2 Ekran 2: Roller & Featurelar

Dosya: `src/pages/admin/AdminRolesFeaturesPage.tsx`

İçerik:

- Aktif roller listesi (`roles`)
- Seçili role ait feature listesi (`feature_catalog.scope_role = role.key`)
- Rol-feature açık/kapalı yönetimi (`role_feature_flags`)
- Global durum etiketi (`is_active_globally`) sadece görünür; bu ekranda global switch değiştirilmez.

## 5.3 Compatibility Route

Dosya: `src/pages/admin/AdminRolesDraftPage.tsx`

- Artık yalnızca redirect görevi yapar:
  - `/admin/roller-taslak` -> `/admin/new-member/users-roles`

## 6) Profilde Feature Gating (Kullanıcı Tarafı)

- `src/hooks/useFeatureFlags.ts` `get_current_user_features()` çağırır.
- `src/pages/ProfilePage.tsx` bireysel modülleri effective feature map ile gösterir/gizler.
- Veri alınamazsa güvenli fallback: kapalı davranış.

## 7) Form Üyeleri ile Net Ayrım

Bu çalışma login kullanıcı alanına aittir:

1. Login kullanıcılar: `user_profiles`, `roles`, `user_role_assignments`, `role_feature_flags`
2. Form üyeleri: `submissions`, `/admin/members`

Form üyeleri tarafına değişiklik yapılmamıştır.

## 8) Operasyonel Doğrulama

## 8.1 DB

1. `supabase migration list` çıktısında `20260524162000` local/remote eşleşir.
2. Yeni tablolar ve RPC’ler erişilebilir olmalıdır:
   - `roles`
   - `user_role_assignments`
   - `role_feature_flags`
   - `admin_set_user_role`
   - `admin_set_role_feature_flag`
   - `get_current_user_features`

## 8.2 UI Smoke

1. `/admin/new-member/users-roles` ekranında kullanıcı rolü değiştir.
2. `/admin/new-member/roles-features` ekranında aynı role 2 feature aç/kapat.
3. İlgili kullanıcıyla `/profile/bireysel` tarafında effective görünümü doğrula.

## 9) Referans Kod Dosyaları

- `src/App.tsx`
- `src/components/admin/AdminLayout.tsx`
- `src/components/admin/admin-navigation.ts`
- `src/pages/admin/AdminLoginUsersRolesPage.tsx`
- `src/pages/admin/AdminRolesFeaturesPage.tsx`
- `src/pages/admin/AdminRolesDraftPage.tsx`
- `src/lib/admin.ts`
- `src/integrations/supabase/types.ts`
- `supabase/migrations/20260524162000_split_new_member_system_roles_and_features.sql`
