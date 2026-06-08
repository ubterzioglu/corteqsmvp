# Eski `user_roles` / `app_role` / `has_role` Sisteminin Tamamen Kaldırılması

**Tarih:** 2026-06-09
**Karar verenler:** Baris/Umut + Claude
**Durum:** Plan onaylandı (rol eşleme + uygula), uygulama aşamasında

## Amaç

Veritabanında yan yana duran iki rol sisteminden **eskisini tamamen kaldırmak**:

| Eski (KALDIRILACAK) | Yeni (CANONICAL) |
|---|---|
| `public.user_roles` tablosu (11 satır, `app_role` enum kolonu) | `public.user_role_assignments` + `public.roles` |
| `public.app_role` enum | `roles.key` (text, prefix'li taksonomi) |
| `public.has_role(uuid, app_role)` | `public.is_admin(uuid)` / `public.is_moderator(uuid)` / prefix sorguları |

## Rol Eşleme (onaylandı)

Eski `app_role` enum **kaba** (`admin`, `consultant`, `business`, `ambassador`, `blogger`, `association`, `user`).
Yeni `roles.key` **ince taneli** (`Admin_*`, `Consultant_*`, `Business_*`, `Organization_*`, `User_CityAmbassador`, ...).

| Eski kontrol | Yeni karşılık |
|---|---|
| `has_role(uid,'admin')` | `public.is_admin(uid)` → `roles.key ilike 'Admin\_%'` |
| `has_role(uid,'consultant')` | `exists(user_role_assignments ⋈ roles where key ilike 'Consultant\_%')` |
| `has_role(uid,'business')` | `... key ilike 'Business\_%'` |
| `has_role(uid,'ambassador')` | `... key = 'User_CityAmbassador'` |
| `has_role(uid,'blogger')` | `... key = 'User_BloggerVlogger'` |
| `has_role(uid,'association')` | `... key ilike 'Organization\_%'` |
| `has_role(uid,'user')` | `... key ilike 'User\_%'` (herhangi standart kullanıcı) |

## Bağımlılık Envanteri (migration tarihçesi)

`has_role()` çağıran CANLI policy'ler (her biri DROP+CREATE ile yeniden yazılmalı):

- `service_requests` (consultant)
- `welcome_pack_orders`, `welcome_pack_proposals` (business/consultant + admin)
- `generated_posts` (+ storage `post-archive`) (admin)
- `may19_submissions` (admin)
- `job_listings` (admin)
- `site_settings` (admin)
- `contact_messages` (admin)
- `founding_1000_signups` (admin)
- `profile_views`, `approval_requests` (admin)
- `ambassador_referral` (admin)
- storage `interest-uploads` (admin)
- Dinamik: `diaspora_city_scan_queue`, `diaspora_scan_runs`, `rag_documents`, `diaspora_instagram_accounts`
  (`20260506223500_harden_internal_tables_rls.sql` — `has_role(...,'admin')`)

Frontend (4 dosya):
- `src/components/ConsultantServiceRequests.tsx` — `.from("user_roles")` okuma
- `src/pages/Onboarding.tsx` — `.from("user_roles")` delete+insert
- `src/pages/PostGenerator.tsx` — `.from("user_roles")` okuma
- `src/pages/admin/AdminDatabaseTablesPage.tsx` — sadece tablo listesi etiketi (rowCount 11)

## ⚠️ KRİTİK BELİRSİZLİK — uygulamadan önce doğrula

`20260609003000_drop_legacy_tables.sql` `profiles/user_profiles/admin_users/role_feature_defaults`
tablolarını drop etti ama `user_roles`/`app_role`/`has_role` ve yukarıdaki **policy'lerin bağlı
olduğu tabloların bir kısmının hâlâ var olup olmadığı migration'dan kesin görülemiyor.**

`service_requests`, `welcome_pack_orders`, `welcome_pack_proposals`, `job_listings`,
`may19_submissions` vb. tablolar canlı DB'de **hâlâ mevcut mu?** Drop edilmiş bir tablonun
policy'sini yeniden yazmaya çalışmak hata verir. Uygulama öncesi şu sorgu çalıştırılmalı:

```sql
select tablename from pg_tables where schemaname='public'
  and tablename in ('service_requests','welcome_pack_orders','welcome_pack_proposals',
    'generated_posts','may19_submissions','job_listings','site_settings',
    'contact_messages','founding_1000_signups','profile_views','approval_requests',
    'ambassador_referral','diaspora_city_scan_queue','diaspora_scan_runs',
    'rag_documents','diaspora_instagram_accounts');

-- has_role'a hâlâ bağlı policy'lerin canlı listesi (KESİN KAYNAK):
select schemaname, tablename, policyname, qual, with_check
from pg_policies
where qual ilike '%has_role%' or with_check ilike '%has_role%';
```

`pg_policies` çıktısı bu planın gerçek "yapılacaklar listesi"dir — migration tarihçesi değil.

## Uygulama Adımları (yeni migration: `20260609020000_remove_legacy_user_roles.sql`)

> Migration silinmez/yeniden sıralanmaz; sadece yeni eklenir (proje kuralı).

1. **Yeni migration `begin;` aç.**
2. **Her canlı `has_role` policy'sini** `DROP POLICY IF EXISTS` + `CREATE POLICY` ile yukarıdaki
   eşlemeye göre yeniden yaz. `admin` → `public.is_admin(auth.uid())`. Diğerleri → prefix `exists`.
3. Dinamik hardening policy'lerini (`diaspora_*`, `rag_documents`) aynı `DO $$ ... $$` desenini
   `is_admin()` ile yeniden üreterek değiştir.
4. Tüm policy'ler `has_role`'dan arındıktan **sonra**:
   - `drop function if exists public.has_role(uuid, public.app_role);`
   - `drop table if exists public.user_roles cascade;`
   - `drop type if exists public.app_role;`
5. `commit;`

## Frontend Değişiklikleri

- `Onboarding.tsx`: `user_roles` delete/insert → `admin_set_user_role` veya
  `submit_role_change_request` RPC akışına geçir (yeni rol key'leriyle). Onboarding'in eski
  enum rol seçimi yeni taksonomiye uyarlanmalı.
- `ConsultantServiceRequests.tsx`, `PostGenerator.tsx`: `.from("user_roles")` okuma →
  `get_current_user_profile()` / `user_role_assignments` üzerinden rol kontrolü.
- `AdminDatabaseTablesPage.tsx`: `user_roles` satırını listeden çıkar.

## Doğrulama

- [ ] `pg_policies` içinde `has_role` geçen 0 policy kaldı.
- [ ] `user_roles`, `app_role`, `has_role` artık yok (`\dt`, `\dT`, `\df`).
- [ ] Etkilenen her tablo için RLS davranışı test (admin görür, non-admin görmez/sınırlı).
- [ ] Frontend: onboarding rol seçimi, consultant/post-generator akışları çalışıyor.
- [ ] `npm run test` + `npm run build` yeşil.

## Risk Notları

- `Consultant_*`/`Business_*` prefix eşlemesi davranışı **genişletmemeli**: eski enum tek bir
  geniş rol idi, yeni sistemde alt-roller var; prefix `ilike` doğru genişlikte tutar.
- Storage policy'leri (`post-archive`, `interest-uploads`) ayrı `storage.objects` üzerindedir;
  bunlar da `pg_policies` taramasında çıkar, atlanmamalı.
- Drop sırası: önce policy'ler, sonra function, sonra table, en son type. `cascade` sadece
  table'da; function/type'ta cascade kullanma (sürpriz drop önlenir).
