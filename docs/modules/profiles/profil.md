# CorteQS Profil Sistemi, Rol ve Feature İzinleri - E2E Uygulama Dokümanı

**Proje:** CorteQS Landing  
**Kapsam:** Profil sistemi + kullanıcı rolleri + feature bazlı yetki matrisi + admin yönetimi + RLS + frontend guard sistemi  
**Tarih:** 19 Mayıs 2026  
**Hedef:** Mevcut React + Vite + Supabase + RLS mimarisini bozmadan, kullanıcıya özel profil, rol ve feature izin sistemi eklemek.  
**Uygulama tarzı:** Küçük TODO paketleri, güvenli migration, geriye uyumluluk, adım adım doğrulama.

---

## 0. Kısa Özet

Bu doküman, CorteQS Landing projesine uçtan uca profil ve yetki sistemi eklemek için hazırlanmıştır.

Mevcut durumda projede:

- Supabase Auth kullanılmaktadır.
- RLS aktif durumdadır.
- Admin erişimleri `admin_users` tablosu ve/veya `public.is_admin(auth.uid())` fonksiyonu üzerinden kontrol edilmektedir.
- Admin panelde members, lansman, referral, surveys, WhatsApp landings, workspace ve May19 moderasyon alanları vardır.
- Public form ve anket gibi bazı akışlarda `anon` veya `authenticated` insert politikaları bulunmaktadır.
- Frontend React 18 + TypeScript + Vite + Tailwind + shadcn/Radix yapısıyla ilerlemektedir.

Bu yeni sistemde:

- Her auth kullanıcısı için `profiles` kaydı olacak.
- Roller `roles` tablosunda tanımlanacak.
- Kullanıcı-rol ilişkisi `user_roles` tablosunda tutulacak.
- Feature/modül izinleri `features` ve `role_feature_permissions` tablolarında tutulacak.
- İleride kullanıcı bazlı özel izin override sistemi için `user_feature_overrides` eklenecek.
- Mevcut `admin_users` yapısı hemen silinmeyecek; ilk fazda geriye uyumluluk için desteklenecek.
- `public.is_admin(auth.uid())` fonksiyonu yeni role sistemini de anlayacak şekilde güncellenecek.
- Frontend tarafında `RequirePermission`, `RequireRole`, `useCurrentProfile`, `usePermissions` gibi merkezi guard yapıları oluşturulacak.
- Admin panelde rol/izin matrisi yönetimi eklenecek.

---

## 1. Ana Hedefler

### 1.1 Ürün Hedefleri

- Kullanıcıya ait profil sayfası oluşturmak.
- Her kullanıcıya bir veya birden fazla rol atanabilmesini sağlamak.
- Admin panelde kullanıcının hangi featurelara erişebileceğini yönetebilmek.
- Feature bazlı esnek izin matrisi kurmak.
- Sistemi önce basit tutmak, sonra büyütülebilir hale getirmek.
- Mevcut public formları, anketleri ve admin paneli bozmadan ilerlemek.

### 1.2 Teknik Hedefler

- Supabase RLS ile backend seviyesinde gerçek güvenlik sağlamak.
- Frontend guardlarını sadece UX kolaylığı olarak kullanmak.
- Service role keyin frontend tarafına sızmasını engellemek.
- Existing `admin_users` yapısını kırmadan yeni sisteme geçmek.
- Migrationların rollback edilebilir ve test edilebilir olmasını sağlamak.
- Admin panelde permission matrix UI oluşturmak.
- Test coverage eklemek.

### 1.3 Bu Fazda Yapılmayacaklar

İlk fazda aşağıdakiler yapılmayacak:

- Karmaşık organizasyon/tenant yapısı.
- Ücretli abonelik bazlı yetki.
- Çok detaylı audit/event streaming.
- Nested role inheritance.
- Department/team bazlı yetki.
- Tam sosyal profil sistemi.
- Public profil discovery sistemi.

Bunlar sonraki fazlara bırakılacak.

---

## 2. Kavramlar

### 2.1 Profile

`profiles`, auth kullanıcısının uygulama içindeki görünen ve yönetilebilir profil kaydıdır.

Örnek alanlar:

- ad soyad
- email
- avatar
- şehir/ülke
- headline
- bio
- profil durumu
- onboarding tamamlandı mı
- public görünür mü

### 2.2 Role

Rol, kullanıcıya verilen genel yetki grubudur.

İlk roller:

- `super_admin`
- `admin`
- `moderator`
- `editor`
- `contributor`
- `member`
- `guest`

### 2.3 Feature

Feature, sistemde erişim kontrolü uygulanacak modül veya aksiyondur.

Örnek featurelar:

- `admin.dashboard`
- `admin.members`
- `admin.surveys`
- `admin.referrals`
- `admin.workspace`
- `profile.self`
- `roles.manage`
- `permissions.manage`

### 2.4 Permission

Permission, bir feature üzerinde hangi aksiyonların yapılabileceğini belirtir.

İlk aksiyonlar:

- `view`
- `create`
- `update`
- `delete`
- `manage`
- `export`

### 2.5 Role Feature Permission

Bir rolün, bir feature üzerinde hangi aksiyonlara sahip olduğunu tutar.

Örnek:

`admin` rolü `admin.surveys` featureı üzerinde `view`, `create`, `update`, `delete`, `export` yetkilerine sahip olabilir.

### 2.6 User Feature Override

İleride ihtiyaç olursa kullanıcının rolünden bağımsız özel izin verilebilir veya yasaklanabilir.

İlk MVPde tablo eklenebilir ama UI aktif edilmeyebilir.

---

## 3. Yetki Modeli Kararı

### 3.1 Önerilen Model

Bu proje için önerilen model:

**RBAC + Feature Permission Matrix**

Yani:

- Temel yetkiler rollerden gelir.
- Roller featurelara bağlanır.
- Feature üzerinde aksiyon bazlı izin verilir.
- RLS helper functionları bu izinleri DB seviyesinde kontrol eder.

### 3.2 Neden Bu Model?

Çünkü proje zaten admin panel, public formlar, anketler, referral, workspace ve kampanya moderasyonu gibi farklı modüllere sahip. Sadece `is_admin` ile devam etmek kısa vadede kolay olsa da, ileride şu sorunları doğurur:

- Her admin her şeyi görür.
- Moderatör ile süper admin ayrımı yapılamaz.
- Survey yöneten kişiye referral yönetimi kapatılamaz.
- Workspace okuyabilen ama silemeyen rol tanımlanamaz.
- Kullanıcı bazlı özel erişim verilemez.
- Frontend route guardları karmaşıklaşır.

Bu yüzden role + feature matrisi daha doğru yoldur.

---

## 4. MVP Rol Listesi

İlk fazda roller şu şekilde tanımlansın:

| Role Key | Açıklama | Amaç |
|---|---|---|
| `super_admin` | Sistemin tam sahibi | Her şeyi görür ve yönetir |
| `admin` | Genel yönetici | Çoğu admin modülünü yönetir ama sistem ayarlarını sınırlı görür |
| `moderator` | İçerik ve kayıt moderatörü | Submissions, May19 ve bazı içerik akışlarını inceler |
| `editor` | İçerik yöneticisi | Landing, içerik, anket ve kampanya içerikleriyle ilgilenir |
| `contributor` | Katkı sağlayan kullanıcı | Sınırlı admin benzeri içerik katkısı yapabilir |
| `member` | Normal giriş yapmış kullanıcı | Kendi profilini görür/düzenler |
| `guest` | Giriş yapmamış/public kullanıcı | Sadece public alanları görür |

---

## 5. MVP Feature Listesi

İlk fazda featurelar şunlar olsun:

| Feature Key | Modül | Açıklama |
|---|---|---|
| `profile.self` | Profile | Kullanıcının kendi profilini görmesi/düzenlemesi |
| `profile.public` | Profile | Public profil görüntüleme |
| `admin.dashboard` | Admin | Admin ana panel |
| `admin.members` | Admin | Submissions/members yönetimi |
| `admin.lansman` | Admin | Lansman kayıt yönetimi |
| `admin.referrals` | Admin | Referral kaynak/tip/grup/kod yönetimi |
| `admin.surveys` | Admin | Anket yönetimi |
| `admin.survey_responses` | Admin | Anket cevapları |
| `admin.whatsapp_landings` | Admin | WhatsApp landing yönetimi |
| `admin.workspace` | Admin | Workspace/resource/todo/mvp/notes yönetimi |
| `admin.may19` | Admin | 19 Mayıs kampanya moderasyonu |
| `roles.manage` | System | Rol oluşturma/güncelleme |
| `permissions.manage` | System | Feature izin matrisi yönetimi |
| `users.manage` | System | Kullanıcı yönetimi |
| `users.roles.manage` | System | Kullanıcıya rol atama |
| `audit.logs.view` | Security | Audit log görüntüleme |
| `system.settings` | System | Sistem ayarları |

---

## 6. Permission Kısaltmaları

Dokümanda ve UIda şu kısa kodlar kullanılabilir:

| Kod | Anlam |
|---|---|
| `V` | View |
| `C` | Create |
| `U` | Update |
| `D` | Delete |
| `M` | Manage |
| `E` | Export |

Öneri:

- `manage` varsa ilgili feature üzerinde tüm alt aksiyonları kapsar.
- RLS tarafında `manage` genel admin yetkisi gibi kullanılabilir.
- UI tarafında buton gösterimi için spesifik aksiyon kontrol edilir.

---

## 7. Başlangıç İzin Matrisi

| Feature | super_admin | admin | moderator | editor | contributor | member | guest |
|---|---:|---:|---:|---:|---:|---:|---:|
| `profile.self` | VCU | VCU | VCU | VCU | VCU | VCU | - |
| `profile.public` | V | V | V | V | V | V | V |
| `admin.dashboard` | VM | V | V | V | - | - | - |
| `admin.members` | VCUDME | VUEM | VU | V | - | - | - |
| `admin.lansman` | VCUDME | VCUME | VU | VU | - | - | - |
| `admin.referrals` | VCUDME | VCUDME | V | V | - | - | - |
| `admin.surveys` | VCUDME | VCUDME | VU | VCUD | - | - | - |
| `admin.survey_responses` | VME | VME | V | VE | - | - | - |
| `admin.whatsapp_landings` | VCUDME | VCUD | V | VU | - | - | - |
| `admin.workspace` | VCUDME | VCUDM | VU | VU | VC | - | - |
| `admin.may19` | VCUDME | VCUDME | VU | VU | - | - | - |
| `users.manage` | VCUDM | VU | - | - | - | - | - |
| `users.roles.manage` | VCUDM | VU | - | - | - | - | - |
| `roles.manage` | VCUDM | V | - | - | - | - | - |
| `permissions.manage` | VCUDM | V | - | - | - | - | - |
| `audit.logs.view` | VE | VE | - | - | - | - | - |
| `system.settings` | VM | V | - | - | - | - | - |

Not:

- Bu başlangıç matrisi konservatif tutulmuştur.
- İlk canlı kullanımda `super_admin` ve `admin` dışında çok fazla kullanıcıya admin route açılmamalıdır.
- `contributor` sadece ileride içerik katkısı için düşünülmüştür.

---

## 8. Veri Modeli

### 8.1 Tablolar

Yeni tablolar:

1. `public.profiles`
2. `public.roles`
3. `public.user_roles`
4. `public.features`
5. `public.role_feature_permissions`
6. `public.user_feature_overrides`
7. `public.profile_audit_logs`

Mevcut tablo:

- `public.admin_users`

Bu tablo ilk fazda korunacak.

### 8.2 İlişki Özeti

```text
auth.users
  1 ─── 1 profiles

auth.users
  1 ─── n user_roles
              n ─── 1 roles

roles
  1 ─── n role_feature_permissions
              n ─── 1 features

auth.users
  1 ─── n user_feature_overrides
              n ─── 1 features
```

---

## 9. Migration Stratejisi

### 9.1 Migration Dosya Sırası

Önerilen migration dosyaları:

```text
supabase/migrations/20260519110000_create_profiles_roles_permissions.sql
supabase/migrations/20260519111000_seed_roles_features_permissions.sql
supabase/migrations/20260519112000_profile_auth_trigger.sql
supabase/migrations/20260519113000_profiles_rls_policies.sql
supabase/migrations/20260519114000_update_is_admin_compatibility.sql
```

Tek dosyada da yapılabilir ama agent için küçük migrationlar daha güvenlidir.

### 9.2 Genel Kurallar

- Her migration tek sorumluluğa sahip olmalı.
- Önce tablo/fonksiyon oluşturulmalı.
- Sonra seed yapılmalı.
- Sonra RLS açılmalı.
- Son olarak eski `is_admin` uyumluluğu güncellenmeli.
- Productionda uygulanmadan önce local veya stagingde test edilmeli.
- `drop policy if exists` ve `create policy` desenleri kullanılmalı.
- RLS helper functionlarında `security definer` ve `set search_path = public` kullanılmalı.

---

## 10. SQL Migration - 1: Tablolar

Dosya:

```text
supabase/migrations/20260519110000_create_profiles_roles_permissions.sql
```

İçerik:

```sql
begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  display_name text,
  avatar_url text,
  headline text,
  bio text,
  country text,
  city text,
  locale text default 'tr',
  timezone text,
  profile_status text not null default 'active'
    check (profile_status in ('pending', 'active', 'suspended', 'deleted')),
  onboarding_completed boolean not null default false,
  is_public boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  priority integer not null default 100,
  is_system boolean not null default true,
  status text not null default 'active'
    check (status in ('active', 'disabled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  expires_at timestamptz,
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, role_id)
);

create table if not exists public.features (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  module text not null,
  name text not null,
  description text,
  status text not null default 'active'
    check (status in ('active', 'disabled')),
  is_system boolean not null default true,
  sort_order integer not null default 100,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.role_feature_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles(id) on delete cascade,
  feature_id uuid not null references public.features(id) on delete cascade,
  can_view boolean not null default false,
  can_create boolean not null default false,
  can_update boolean not null default false,
  can_delete boolean not null default false,
  can_manage boolean not null default false,
  can_export boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (role_id, feature_id)
);

create table if not exists public.user_feature_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature_id uuid not null references public.features(id) on delete cascade,
  can_view boolean,
  can_create boolean,
  can_update boolean,
  can_delete boolean,
  can_manage boolean,
  can_export boolean,
  reason text,
  assigned_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, feature_id)
);

create table if not exists public.profile_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_status on public.profiles(profile_status);
create index if not exists idx_roles_key on public.roles(key);
create index if not exists idx_user_roles_user_id on public.user_roles(user_id);
create index if not exists idx_user_roles_role_id on public.user_roles(role_id);
create index if not exists idx_features_key on public.features(key);
create index if not exists idx_features_module on public.features(module);
create index if not exists idx_role_feature_permissions_role_id on public.role_feature_permissions(role_id);
create index if not exists idx_role_feature_permissions_feature_id on public.role_feature_permissions(feature_id);
create index if not exists idx_user_feature_overrides_user_id on public.user_feature_overrides(user_id);
create index if not exists idx_profile_audit_logs_actor_id on public.profile_audit_logs(actor_id);
create index if not exists idx_profile_audit_logs_target_user_id on public.profile_audit_logs(target_user_id);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_roles_updated_at on public.roles;
create trigger trg_roles_updated_at
before update on public.roles
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_roles_updated_at on public.user_roles;
create trigger trg_user_roles_updated_at
before update on public.user_roles
for each row execute function public.set_updated_at();

drop trigger if exists trg_features_updated_at on public.features;
create trigger trg_features_updated_at
before update on public.features
for each row execute function public.set_updated_at();

drop trigger if exists trg_role_feature_permissions_updated_at on public.role_feature_permissions;
create trigger trg_role_feature_permissions_updated_at
before update on public.role_feature_permissions
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_feature_overrides_updated_at on public.user_feature_overrides;
create trigger trg_user_feature_overrides_updated_at
before update on public.user_feature_overrides
for each row execute function public.set_updated_at();

commit;
```

---

## 11. SQL Migration - 2: Seed Roller ve Featurelar

Dosya:

```text
supabase/migrations/20260519111000_seed_roles_features_permissions.sql
```

İçerik:

```sql
begin;

insert into public.roles (key, name, description, priority, is_system)
values
  ('super_admin', 'Super Admin', 'Full system owner with all permissions', 1, true),
  ('admin', 'Admin', 'General admin user', 10, true),
  ('moderator', 'Moderator', 'Moderates submissions and campaign content', 30, true),
  ('editor', 'Editor', 'Manages editable content and surveys', 40, true),
  ('contributor', 'Contributor', 'Limited content contributor', 60, true),
  ('member', 'Member', 'Authenticated standard user', 100, true),
  ('guest', 'Guest', 'Public/unauthenticated user placeholder', 999, true)
on conflict (key) do update
set
  name = excluded.name,
  description = excluded.description,
  priority = excluded.priority,
  updated_at = now();

insert into public.features (key, module, name, description, sort_order, is_system)
values
  ('profile.self', 'profile', 'Own Profile', 'View and update own profile', 10, true),
  ('profile.public', 'profile', 'Public Profiles', 'View public profiles', 20, true),

  ('admin.dashboard', 'admin', 'Admin Dashboard', 'Access admin dashboard', 100, true),
  ('admin.members', 'admin', 'Members/Submissions', 'Manage submissions and member records', 110, true),
  ('admin.lansman', 'admin', 'Lansman Registrations', 'Manage launch registrations', 120, true),
  ('admin.referrals', 'admin', 'Referrals', 'Manage referral sources, groups, types and codes', 130, true),
  ('admin.surveys', 'admin', 'Surveys', 'Manage surveys and questions', 140, true),
  ('admin.survey_responses', 'admin', 'Survey Responses', 'View and export survey responses', 145, true),
  ('admin.whatsapp_landings', 'admin', 'WhatsApp Landings', 'Manage WhatsApp landing pages', 150, true),
  ('admin.workspace', 'admin', 'Workspace', 'Manage command center, resources, todos and notes', 160, true),
  ('admin.may19', 'admin', 'May19 Campaign', 'Moderate May19 campaign submissions', 170, true),

  ('users.manage', 'system', 'User Management', 'View and manage users', 200, true),
  ('users.roles.manage', 'system', 'User Role Management', 'Assign and remove user roles', 210, true),
  ('roles.manage', 'system', 'Role Management', 'Create, update and disable roles', 220, true),
  ('permissions.manage', 'system', 'Permission Matrix', 'Manage feature permission matrix', 230, true),
  ('audit.logs.view', 'security', 'Audit Logs', 'View profile and permission audit logs', 300, true),
  ('system.settings', 'system', 'System Settings', 'Manage global system settings', 400, true)
on conflict (key) do update
set
  module = excluded.module,
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Helper temp function for seed readability.
create or replace function public.seed_role_feature_permission(
  p_role_key text,
  p_feature_key text,
  p_view boolean default false,
  p_create boolean default false,
  p_update boolean default false,
  p_delete boolean default false,
  p_manage boolean default false,
  p_export boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_id uuid;
  v_feature_id uuid;
begin
  select id into v_role_id from public.roles where key = p_role_key;
  select id into v_feature_id from public.features where key = p_feature_key;

  if v_role_id is null or v_feature_id is null then
    raise exception 'Missing role or feature: %, %', p_role_key, p_feature_key;
  end if;

  insert into public.role_feature_permissions (
    role_id,
    feature_id,
    can_view,
    can_create,
    can_update,
    can_delete,
    can_manage,
    can_export
  )
  values (
    v_role_id,
    v_feature_id,
    p_view,
    p_create,
    p_update,
    p_delete,
    p_manage,
    p_export
  )
  on conflict (role_id, feature_id) do update
  set
    can_view = excluded.can_view,
    can_create = excluded.can_create,
    can_update = excluded.can_update,
    can_delete = excluded.can_delete,
    can_manage = excluded.can_manage,
    can_export = excluded.can_export,
    updated_at = now();
end;
$$;

-- Super admin: all permissions for all features.
insert into public.role_feature_permissions (
  role_id,
  feature_id,
  can_view,
  can_create,
  can_update,
  can_delete,
  can_manage,
  can_export
)
select
  r.id,
  f.id,
  true,
  true,
  true,
  true,
  true,
  true
from public.roles r
cross join public.features f
where r.key = 'super_admin'
on conflict (role_id, feature_id) do update
set
  can_view = true,
  can_create = true,
  can_update = true,
  can_delete = true,
  can_manage = true,
  can_export = true,
  updated_at = now();

-- Admin.
select public.seed_role_feature_permission('admin', 'profile.self', true, true, true, false, false, false);
select public.seed_role_feature_permission('admin', 'profile.public', true, false, false, false, false, false);
select public.seed_role_feature_permission('admin', 'admin.dashboard', true, false, false, false, false, false);
select public.seed_role_feature_permission('admin', 'admin.members', true, false, true, false, true, true);
select public.seed_role_feature_permission('admin', 'admin.lansman', true, true, true, false, true, true);
select public.seed_role_feature_permission('admin', 'admin.referrals', true, true, true, true, true, true);
select public.seed_role_feature_permission('admin', 'admin.surveys', true, true, true, true, true, true);
select public.seed_role_feature_permission('admin', 'admin.survey_responses', true, false, false, false, true, true);
select public.seed_role_feature_permission('admin', 'admin.whatsapp_landings', true, true, true, true, false, false);
select public.seed_role_feature_permission('admin', 'admin.workspace', true, true, true, true, true, false);
select public.seed_role_feature_permission('admin', 'admin.may19', true, true, true, true, true, true);
select public.seed_role_feature_permission('admin', 'users.manage', true, false, true, false, false, false);
select public.seed_role_feature_permission('admin', 'users.roles.manage', true, false, true, false, false, false);
select public.seed_role_feature_permission('admin', 'roles.manage', true, false, false, false, false, false);
select public.seed_role_feature_permission('admin', 'permissions.manage', true, false, false, false, false, false);
select public.seed_role_feature_permission('admin', 'audit.logs.view', true, false, false, false, false, true);
select public.seed_role_feature_permission('admin', 'system.settings', true, false, false, false, false, false);

-- Moderator.
select public.seed_role_feature_permission('moderator', 'profile.self', true, true, true, false, false, false);
select public.seed_role_feature_permission('moderator', 'profile.public', true, false, false, false, false, false);
select public.seed_role_feature_permission('moderator', 'admin.dashboard', true, false, false, false, false, false);
select public.seed_role_feature_permission('moderator', 'admin.members', true, false, true, false, false, false);
select public.seed_role_feature_permission('moderator', 'admin.lansman', true, false, true, false, false, false);
select public.seed_role_feature_permission('moderator', 'admin.referrals', true, false, false, false, false, false);
select public.seed_role_feature_permission('moderator', 'admin.surveys', true, false, true, false, false, false);
select public.seed_role_feature_permission('moderator', 'admin.survey_responses', true, false, false, false, false, false);
select public.seed_role_feature_permission('moderator', 'admin.whatsapp_landings', true, false, false, false, false, false);
select public.seed_role_feature_permission('moderator', 'admin.workspace', true, false, true, false, false, false);
select public.seed_role_feature_permission('moderator', 'admin.may19', true, false, true, false, false, false);

-- Editor.
select public.seed_role_feature_permission('editor', 'profile.self', true, true, true, false, false, false);
select public.seed_role_feature_permission('editor', 'profile.public', true, false, false, false, false, false);
select public.seed_role_feature_permission('editor', 'admin.dashboard', true, false, false, false, false, false);
select public.seed_role_feature_permission('editor', 'admin.members', true, false, false, false, false, false);
select public.seed_role_feature_permission('editor', 'admin.lansman', true, false, true, false, false, false);
select public.seed_role_feature_permission('editor', 'admin.referrals', true, false, false, false, false, false);
select public.seed_role_feature_permission('editor', 'admin.surveys', true, true, true, true, false, false);
select public.seed_role_feature_permission('editor', 'admin.survey_responses', true, false, false, false, false, true);
select public.seed_role_feature_permission('editor', 'admin.whatsapp_landings', true, false, true, false, false, false);
select public.seed_role_feature_permission('editor', 'admin.workspace', true, false, true, false, false, false);
select public.seed_role_feature_permission('editor', 'admin.may19', true, false, true, false, false, false);

-- Contributor.
select public.seed_role_feature_permission('contributor', 'profile.self', true, true, true, false, false, false);
select public.seed_role_feature_permission('contributor', 'profile.public', true, false, false, false, false, false);
select public.seed_role_feature_permission('contributor', 'admin.workspace', true, true, false, false, false, false);

-- Member.
select public.seed_role_feature_permission('member', 'profile.self', true, true, true, false, false, false);
select public.seed_role_feature_permission('member', 'profile.public', true, false, false, false, false, false);

-- Guest placeholder.
select public.seed_role_feature_permission('guest', 'profile.public', true, false, false, false, false, false);

drop function if exists public.seed_role_feature_permission(
  text,
  text,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean
);

commit;
```

---

## 12. SQL Migration - 3: Auth Profile Trigger

Dosya:

```text
supabase/migrations/20260519112000_profile_auth_trigger.sql
```

İçerik:

```sql
begin;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_role_id uuid;
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    display_name,
    avatar_url,
    profile_status,
    onboarding_completed,
    is_public,
    metadata
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'active',
    false,
    false,
    coalesce(new.raw_user_meta_data, '{}'::jsonb)
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    updated_at = now();

  select id into v_member_role_id
  from public.roles
  where key = 'member';

  if v_member_role_id is not null then
    insert into public.user_roles (user_id, role_id, assigned_by, note)
    values (new.id, v_member_role_id, null, 'Auto-assigned on signup')
    on conflict (user_id, role_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;

create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

-- Backfill profiles for existing auth users.
insert into public.profiles (
  id,
  email,
  full_name,
  display_name,
  avatar_url,
  profile_status,
  onboarding_completed,
  is_public,
  metadata
)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  coalesce(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  u.raw_user_meta_data->>'avatar_url',
  'active',
  false,
  false,
  coalesce(u.raw_user_meta_data, '{}'::jsonb)
from auth.users u
on conflict (id) do nothing;

-- Backfill member role for all existing users that do not have any role.
insert into public.user_roles (user_id, role_id, assigned_by, note)
select
  u.id,
  r.id,
  null,
  'Backfilled default member role'
from auth.users u
cross join public.roles r
where r.key = 'member'
  and not exists (
    select 1
    from public.user_roles ur
    where ur.user_id = u.id
      and ur.is_active = true
  )
on conflict (user_id, role_id) do nothing;

commit;
```

---

## 13. SQL Migration - 4: Helper Functions

Bu helperlar RLS ve frontend RPC için kullanılacak.

Dosya:

```text
supabase/migrations/20260519113000_profiles_rls_policies.sql
```

İlk bölüm:

```sql
begin;

create or replace function public.has_role(p_user_id uuid, p_role_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = p_user_id
      and r.key = p_role_key
      and r.status = 'active'
      and ur.is_active = true
      and (ur.expires_at is null or ur.expires_at > now())
  );
$$;

create or replace function public.has_any_role(p_user_id uuid, p_role_keys text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = p_user_id
      and r.key = any(p_role_keys)
      and r.status = 'active'
      and ur.is_active = true
      and (ur.expires_at is null or ur.expires_at > now())
  );
$$;

create or replace function public.has_permission(
  p_user_id uuid,
  p_feature_key text,
  p_action text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_allowed boolean := false;
begin
  if p_user_id is null then
    return false;
  end if;

  -- Super admin fast path.
  if public.has_role(p_user_id, 'super_admin') then
    return true;
  end if;

  -- User-level overrides first.
  select
    case p_action
      when 'view' then ufo.can_view
      when 'create' then ufo.can_create
      when 'update' then ufo.can_update
      when 'delete' then ufo.can_delete
      when 'manage' then ufo.can_manage
      when 'export' then ufo.can_export
      else false
    end
  into v_allowed
  from public.user_feature_overrides ufo
  join public.features f on f.id = ufo.feature_id
  where ufo.user_id = p_user_id
    and f.key = p_feature_key
    and f.status = 'active'
    and ufo.is_active = true
    and (ufo.expires_at is null or ufo.expires_at > now())
  limit 1;

  if v_allowed is not null then
    return v_allowed;
  end if;

  -- Role-level permissions.
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.role_feature_permissions rfp on rfp.role_id = r.id
    join public.features f on f.id = rfp.feature_id
    where ur.user_id = p_user_id
      and ur.is_active = true
      and (ur.expires_at is null or ur.expires_at > now())
      and r.status = 'active'
      and f.status = 'active'
      and f.key = p_feature_key
      and (
        rfp.can_manage = true
        or case p_action
          when 'view' then rfp.can_view
          when 'create' then rfp.can_create
          when 'update' then rfp.can_update
          when 'delete' then rfp.can_delete
          when 'manage' then rfp.can_manage
          when 'export' then rfp.can_export
          else false
        end = true
      )
  )
  into v_allowed;

  return coalesce(v_allowed, false);
end;
$$;

create or replace function public.get_my_permissions()
returns table (
  feature_key text,
  module text,
  can_view boolean,
  can_create boolean,
  can_update boolean,
  can_delete boolean,
  can_manage boolean,
  can_export boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with role_permissions as (
    select
      f.key as feature_key,
      f.module,
      bool_or(rfp.can_view or rfp.can_manage) as can_view,
      bool_or(rfp.can_create or rfp.can_manage) as can_create,
      bool_or(rfp.can_update or rfp.can_manage) as can_update,
      bool_or(rfp.can_delete or rfp.can_manage) as can_delete,
      bool_or(rfp.can_manage) as can_manage,
      bool_or(rfp.can_export or rfp.can_manage) as can_export
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.role_feature_permissions rfp on rfp.role_id = r.id
    join public.features f on f.id = rfp.feature_id
    where ur.user_id = auth.uid()
      and ur.is_active = true
      and (ur.expires_at is null or ur.expires_at > now())
      and r.status = 'active'
      and f.status = 'active'
    group by f.key, f.module
  )
  select
    rp.feature_key,
    rp.module,
    coalesce(ufo.can_view, rp.can_view) as can_view,
    coalesce(ufo.can_create, rp.can_create) as can_create,
    coalesce(ufo.can_update, rp.can_update) as can_update,
    coalesce(ufo.can_delete, rp.can_delete) as can_delete,
    coalesce(ufo.can_manage, rp.can_manage) as can_manage,
    coalesce(ufo.can_export, rp.can_export) as can_export
  from role_permissions rp
  left join public.features f on f.key = rp.feature_key
  left join public.user_feature_overrides ufo
    on ufo.feature_id = f.id
   and ufo.user_id = auth.uid()
   and ufo.is_active = true
   and (ufo.expires_at is null or ufo.expires_at > now());
$$;

commit;
```

---

## 14. SQL Migration - 5: RLS Policyleri

Aynı dosyanın ikinci bölümü veya ayrı dosya olabilir.

```sql
begin;

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.features enable row level security;
alter table public.role_feature_permissions enable row level security;
alter table public.user_feature_overrides enable row level security;
alter table public.profile_audit_logs enable row level security;

-- profiles
drop policy if exists "profiles_select_own_or_public_or_admin" on public.profiles;
create policy "profiles_select_own_or_public_or_admin"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or is_public = true
  or public.has_permission(auth.uid(), 'users.manage', 'view')
);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or public.has_permission(auth.uid(), 'users.manage', 'update')
)
with check (
  id = auth.uid()
  or public.has_permission(auth.uid(), 'users.manage', 'update')
);

drop policy if exists "profiles_insert_system_or_self" on public.profiles;
create policy "profiles_insert_system_or_self"
on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
  or public.has_permission(auth.uid(), 'users.manage', 'create')
);

-- roles
drop policy if exists "roles_select_with_permission" on public.roles;
create policy "roles_select_with_permission"
on public.roles
for select
to authenticated
using (
  public.has_permission(auth.uid(), 'roles.manage', 'view')
  or public.has_permission(auth.uid(), 'users.roles.manage', 'view')
);

drop policy if exists "roles_write_with_permission" on public.roles;
create policy "roles_write_with_permission"
on public.roles
for all
to authenticated
using (public.has_permission(auth.uid(), 'roles.manage', 'manage'))
with check (public.has_permission(auth.uid(), 'roles.manage', 'manage'));

-- user_roles
drop policy if exists "user_roles_select_self_or_manager" on public.user_roles;
create policy "user_roles_select_self_or_manager"
on public.user_roles
for select
to authenticated
using (
  user_id = auth.uid()
  or public.has_permission(auth.uid(), 'users.roles.manage', 'view')
);

drop policy if exists "user_roles_write_manager" on public.user_roles;
create policy "user_roles_write_manager"
on public.user_roles
for all
to authenticated
using (public.has_permission(auth.uid(), 'users.roles.manage', 'update'))
with check (public.has_permission(auth.uid(), 'users.roles.manage', 'update'));

-- features
drop policy if exists "features_select_authenticated" on public.features;
create policy "features_select_authenticated"
on public.features
for select
to authenticated
using (true);

drop policy if exists "features_write_permission_manager" on public.features;
create policy "features_write_permission_manager"
on public.features
for all
to authenticated
using (public.has_permission(auth.uid(), 'permissions.manage', 'manage'))
with check (public.has_permission(auth.uid(), 'permissions.manage', 'manage'));

-- role_feature_permissions
drop policy if exists "role_feature_permissions_select_manager" on public.role_feature_permissions;
create policy "role_feature_permissions_select_manager"
on public.role_feature_permissions
for select
to authenticated
using (
  public.has_permission(auth.uid(), 'permissions.manage', 'view')
  or public.has_permission(auth.uid(), 'roles.manage', 'view')
);

drop policy if exists "role_feature_permissions_write_manager" on public.role_feature_permissions;
create policy "role_feature_permissions_write_manager"
on public.role_feature_permissions
for all
to authenticated
using (public.has_permission(auth.uid(), 'permissions.manage', 'manage'))
with check (public.has_permission(auth.uid(), 'permissions.manage', 'manage'));

-- user_feature_overrides
drop policy if exists "user_feature_overrides_select_manager" on public.user_feature_overrides;
create policy "user_feature_overrides_select_manager"
on public.user_feature_overrides
for select
to authenticated
using (
  user_id = auth.uid()
  or public.has_permission(auth.uid(), 'permissions.manage', 'view')
);

drop policy if exists "user_feature_overrides_write_manager" on public.user_feature_overrides;
create policy "user_feature_overrides_write_manager"
on public.user_feature_overrides
for all
to authenticated
using (public.has_permission(auth.uid(), 'permissions.manage', 'manage'))
with check (public.has_permission(auth.uid(), 'permissions.manage', 'manage'));

-- audit logs
drop policy if exists "profile_audit_logs_select_security" on public.profile_audit_logs;
create policy "profile_audit_logs_select_security"
on public.profile_audit_logs
for select
to authenticated
using (public.has_permission(auth.uid(), 'audit.logs.view', 'view'));

drop policy if exists "profile_audit_logs_insert_authenticated" on public.profile_audit_logs;
create policy "profile_audit_logs_insert_authenticated"
on public.profile_audit_logs
for insert
to authenticated
with check (actor_id = auth.uid());

commit;
```

---

## 15. SQL Migration - 6: Mevcut `is_admin` Uyumluluğu

Dosya:

```text
supabase/migrations/20260519114000_update_is_admin_compatibility.sql
```

Amaç:

- Eski admin kontrolleri bozulmasın.
- Yeni sistemde `super_admin` veya `admin` rolü olanlar da admin sayılsın.
- Mevcut `admin_users` kayıtları varsa destek devam etsin.

```sql
begin;

create or replace function public.is_admin(user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_is_admin boolean := false;
begin
  if user_id is null then
    return false;
  end if;

  -- New RBAC system.
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = is_admin.user_id
      and r.key in ('super_admin', 'admin')
      and r.status = 'active'
      and ur.is_active = true
      and (ur.expires_at is null or ur.expires_at > now())
  )
  into v_is_admin;

  if v_is_admin then
    return true;
  end if;

  -- Legacy compatibility with admin_users.
  -- If admin_users schema differs, agent must inspect existing columns before modifying this block.
  if to_regclass('public.admin_users') is not null then
    execute '
      select exists (
        select 1
        from public.admin_users
        where user_id = $1
      )
    '
    into v_is_admin
    using user_id;

    if v_is_admin then
      return true;
    end if;
  end if;

  return false;
exception
  when undefined_column then
    -- Fallback for admin_users schemas that do not have user_id.
    return v_is_admin;
end;
$$;

commit;
```

Önemli not:

- Agent önce `admin_users` tablo kolonlarını kontrol etsin.
- Eğer `admin_users` içinde `email` bazlı yapı varsa bu fonksiyon ona göre uyarlansın.
- Bu fonksiyon bozulursa mevcut admin panel tamamen kilitlenebilir. Bu yüzden staging test şarttır.

---

## 16. Mevcut Admin Kullanıcılarını Yeni Role Sistemine Taşıma

### 16.1 Amaç

Eski `admin_users` içinde bulunan kullanıcıları `admin` veya `super_admin` rolüne taşımak.

### 16.2 Önce Kolon Kontrolü

PowerShell:

```powershell
supabase db remote commit --help
```

SQL editor veya psql üzerinden:

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'admin_users'
order by ordinal_position;
```

### 16.3 Eğer `admin_users.user_id` Varsa

```sql
insert into public.user_roles (user_id, role_id, assigned_by, note)
select
  au.user_id,
  r.id,
  null,
  'Backfilled from legacy admin_users'
from public.admin_users au
cross join public.roles r
where r.key = 'admin'
  and au.user_id is not null
on conflict (user_id, role_id) do nothing;
```

### 16.4 Eğer `admin_users.email` Varsa

```sql
insert into public.user_roles (user_id, role_id, assigned_by, note)
select
  u.id,
  r.id,
  null,
  'Backfilled from legacy admin_users by email'
from public.admin_users au
join auth.users u on lower(u.email) = lower(au.email)
cross join public.roles r
where r.key = 'admin'
on conflict (user_id, role_id) do nothing;
```

### 16.5 İlk Super Admin Atama

Aşağıdaki email değiştirilmelidir:

```sql
insert into public.user_roles (user_id, role_id, assigned_by, note)
select
  u.id,
  r.id,
  null,
  'Initial super admin assignment'
from auth.users u
cross join public.roles r
where lower(u.email) = lower('OWNER_EMAIL_HERE')
  and r.key = 'super_admin'
on conflict (user_id, role_id) do update
set
  is_active = true,
  updated_at = now();
```

---

## 17. Frontend Dosya Yapısı

Yeni dosyalar:

```text
src/lib/auth/permissionTypes.ts
src/lib/auth/permissionKeys.ts
src/lib/auth/permissionClient.ts
src/hooks/useCurrentProfile.ts
src/hooks/useMyPermissions.ts
src/hooks/useHasPermission.ts
src/components/auth/RequirePermission.tsx
src/components/auth/RequireRole.tsx
src/components/auth/AuthLoadingState.tsx
src/components/auth/UnauthorizedState.tsx
src/pages/ProfilePage.tsx
src/pages/admin/UserRolesPage.tsx
src/pages/admin/RoleMatrixPage.tsx
src/pages/admin/ProfileAdminPage.tsx
src/pages/admin/AuditLogsPage.tsx
```

Güncellenecek dosyalar:

```text
src/App.tsx
src/components/admin/AdminLayout.tsx
src/integrations/supabase/types.ts
src/integrations/supabase/client.ts
```

Opsiyonel:

```text
src/lib/admin/navigation.ts
src/lib/admin/adminRoutePermissions.ts
```

---

## 18. TypeScript Tipleri

Dosya:

```text
src/lib/auth/permissionTypes.ts
```

```ts
export type PermissionAction =
  | "view"
  | "create"
  | "update"
  | "delete"
  | "manage"
  | "export";

export type RoleKey =
  | "super_admin"
  | "admin"
  | "moderator"
  | "editor"
  | "contributor"
  | "member"
  | "guest";

export type FeatureKey =
  | "profile.self"
  | "profile.public"
  | "admin.dashboard"
  | "admin.members"
  | "admin.lansman"
  | "admin.referrals"
  | "admin.surveys"
  | "admin.survey_responses"
  | "admin.whatsapp_landings"
  | "admin.workspace"
  | "admin.may19"
  | "users.manage"
  | "users.roles.manage"
  | "roles.manage"
  | "permissions.manage"
  | "audit.logs.view"
  | "system.settings";

export type PermissionRecord = {
  feature_key: FeatureKey | string;
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_manage: boolean;
  can_export: boolean;
};

export type PermissionMap = Record<string, PermissionRecord>;
```

---

## 19. Permission Key Sabitleri

Dosya:

```text
src/lib/auth/permissionKeys.ts
```

```ts
import type { FeatureKey } from "./permissionTypes";

export const FEATURE_KEYS = {
  PROFILE_SELF: "profile.self",
  PROFILE_PUBLIC: "profile.public",

  ADMIN_DASHBOARD: "admin.dashboard",
  ADMIN_MEMBERS: "admin.members",
  ADMIN_LANSMAN: "admin.lansman",
  ADMIN_REFERRALS: "admin.referrals",
  ADMIN_SURVEYS: "admin.surveys",
  ADMIN_SURVEY_RESPONSES: "admin.survey_responses",
  ADMIN_WHATSAPP_LANDINGS: "admin.whatsapp_landings",
  ADMIN_WORKSPACE: "admin.workspace",
  ADMIN_MAY19: "admin.may19",

  USERS_MANAGE: "users.manage",
  USERS_ROLES_MANAGE: "users.roles.manage",
  ROLES_MANAGE: "roles.manage",
  PERMISSIONS_MANAGE: "permissions.manage",
  AUDIT_LOGS_VIEW: "audit.logs.view",
  SYSTEM_SETTINGS: "system.settings",
} as const satisfies Record<string, FeatureKey>;
```

---

## 20. Permission Client

Dosya:

```text
src/lib/auth/permissionClient.ts
```

```ts
import { supabase } from "@/integrations/supabase/client";
import type {
  PermissionAction,
  FeatureKey,
  PermissionMap,
  PermissionRecord,
} from "./permissionTypes";

export function buildPermissionMap(records: PermissionRecord[]): PermissionMap {
  return records.reduce<PermissionMap>((acc, record) => {
    acc[record.feature_key] = record;
    return acc;
  }, {});
}

export function hasPermissionInMap(
  permissions: PermissionMap | undefined,
  featureKey: FeatureKey | string,
  action: PermissionAction,
): boolean {
  if (!permissions) return false;

  const item = permissions[featureKey];
  if (!item) return false;

  if (item.can_manage) return true;

  switch (action) {
    case "view":
      return item.can_view;
    case "create":
      return item.can_create;
    case "update":
      return item.can_update;
    case "delete":
      return item.can_delete;
    case "manage":
      return item.can_manage;
    case "export":
      return item.can_export;
    default:
      return false;
  }
}

export async function fetchMyPermissions(): Promise<PermissionRecord[]> {
  const { data, error } = await supabase.rpc("get_my_permissions");

  if (error) {
    throw error;
  }

  return (data ?? []) as PermissionRecord[];
}
```

---

## 21. Hook: `useMyPermissions`

Dosya:

```text
src/hooks/useMyPermissions.ts
```

```ts
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  buildPermissionMap,
  fetchMyPermissions,
  hasPermissionInMap,
} from "@/lib/auth/permissionClient";
import type { FeatureKey, PermissionAction } from "@/lib/auth/permissionTypes";

export function useMyPermissions() {
  const query = useQuery({
    queryKey: ["auth", "my-permissions"],
    queryFn: fetchMyPermissions,
    staleTime: 60_000,
    retry: 1,
  });

  const permissionMap = useMemo(
    () => buildPermissionMap(query.data ?? []),
    [query.data],
  );

  const hasPermission = (
    featureKey: FeatureKey | string,
    action: PermissionAction = "view",
  ) => hasPermissionInMap(permissionMap, featureKey, action);

  return {
    ...query,
    permissions: query.data ?? [],
    permissionMap,
    hasPermission,
  };
}
```

---

## 22. Hook: `useCurrentProfile`

Dosya:

```text
src/hooks/useCurrentProfile.ts
```

```ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCurrentProfile() {
  return useQuery({
    queryKey: ["auth", "current-profile"],
    queryFn: async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      const user = authData.user;

      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    staleTime: 60_000,
    retry: 1,
  });
}
```

---

## 23. Component: `RequirePermission`

Dosya:

```text
src/components/auth/RequirePermission.tsx
```

```tsx
import type { ReactNode } from "react";
import { useMyPermissions } from "@/hooks/useMyPermissions";
import type { FeatureKey, PermissionAction } from "@/lib/auth/permissionTypes";

type RequirePermissionProps = {
  feature: FeatureKey | string;
  action?: PermissionAction;
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
};

export function RequirePermission({
  feature,
  action = "view",
  children,
  fallback = null,
  loadingFallback = null,
}: RequirePermissionProps) {
  const { isLoading, hasPermission } = useMyPermissions();

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!hasPermission(feature, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

---

## 24. Component: `UnauthorizedState`

Dosya:

```text
src/components/auth/UnauthorizedState.tsx
```

```tsx
import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function UnauthorizedState() {
  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
        <ShieldAlert className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Yetkin yok</h1>
        <p className="text-sm text-muted-foreground">
          Bu sayfayı görüntülemek için gerekli erişim iznine sahip değilsin.
        </p>
      </CardContent>
    </Card>
  );
}
```

---

## 25. Route Guard Kullanımı

Örnek:

```tsx
import { RequirePermission } from "@/components/auth/RequirePermission";
import { UnauthorizedState } from "@/components/auth/UnauthorizedState";
import { FEATURE_KEYS } from "@/lib/auth/permissionKeys";

export function AdminMembersRoute() {
  return (
    <RequirePermission
      feature={FEATURE_KEYS.ADMIN_MEMBERS}
      action="view"
      fallback={<UnauthorizedState />}
    >
      <AdminMembersPage />
    </RequirePermission>
  );
}
```

---

## 26. `App.tsx` Route Eklemeleri

Eklenecek public route:

```tsx
<Route path="/profile" element={<ProfilePage />} />
```

Eklenecek admin route örnekleri:

```tsx
<Route
  path="/admin/roles"
  element={
    <RequirePermission
      feature={FEATURE_KEYS.ROLES_MANAGE}
      action="view"
      fallback={<UnauthorizedState />}
    >
      <RoleMatrixPage />
    </RequirePermission>
  }
/>

<Route
  path="/admin/users/:userId/roles"
  element={
    <RequirePermission
      feature={FEATURE_KEYS.USERS_ROLES_MANAGE}
      action="view"
      fallback={<UnauthorizedState />}
    >
      <UserRolesPage />
    </RequirePermission>
  }
/>
```

Not:

- Existing admin routes tek seferde değiştirilmemeli.
- Önce yeni route guard komponenti eklenmeli.
- Sonra tek tek admin sayfalarına uygulanmalı.
- İlk geçişte `admin.dashboard` ile başlanmalı.

---

## 27. Admin Navigation Yetki Filtresi

Dosya:

```text
src/lib/admin/navigation.ts
```

```ts
import { FEATURE_KEYS } from "@/lib/auth/permissionKeys";
import type { FeatureKey } from "@/lib/auth/permissionTypes";

export type AdminNavItem = {
  label: string;
  href: string;
  feature: FeatureKey;
  action?: "view" | "manage";
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    feature: FEATURE_KEYS.ADMIN_DASHBOARD,
  },
  {
    label: "Members",
    href: "/admin/members",
    feature: FEATURE_KEYS.ADMIN_MEMBERS,
  },
  {
    label: "Lansman",
    href: "/admin/lansman",
    feature: FEATURE_KEYS.ADMIN_LANSMAN,
  },
  {
    label: "Referrals",
    href: "/admin/referral",
    feature: FEATURE_KEYS.ADMIN_REFERRALS,
  },
  {
    label: "Surveys",
    href: "/admin/surveys",
    feature: FEATURE_KEYS.ADMIN_SURVEYS,
  },
  {
    label: "Workspace",
    href: "/admin/workspace",
    feature: FEATURE_KEYS.ADMIN_WORKSPACE,
  },
  {
    label: "Roles & Permissions",
    href: "/admin/roles",
    feature: FEATURE_KEYS.ROLES_MANAGE,
  },
];
```

AdminLayout içinde:

```tsx
const { hasPermission } = useMyPermissions();

const visibleItems = ADMIN_NAV_ITEMS.filter((item) =>
  hasPermission(item.feature, item.action ?? "view"),
);
```

---

## 28. Profil Sayfası MVP

Dosya:

```text
src/pages/ProfilePage.tsx
```

Sayfada olacak alanlar:

- display name
- full name
- headline
- bio
- country
- city
- avatar_url
- is_public
- onboarding_completed bilgisi
- kaydet butonu

MVP davranışı:

- Kullanıcı sadece kendi profilini düzenler.
- Adminler bu sayfadan başkasının profilini düzenlemez.
- Admin kullanıcı yönetimi ayrı sayfada yapılır.
- Profil fotoğraf uploadu ilk fazda opsiyonel bırakılır; sadece URL alanı olabilir.

Acceptance criteria:

- Giriş yapmış kullanıcı `/profile` sayfasını açar.
- Kendi profil kaydını görür.
- Display name ve city alanını günceller.
- Kaydetten sonra Supabase `profiles` tablosu güncellenir.
- Başkasının profilini update edemez.
- Giriş yapmayan kullanıcı login yönlendirmesi veya erişim engeli görür.

---

## 29. Admin Role Matrix Page

Dosya:

```text
src/pages/admin/RoleMatrixPage.tsx
```

### 29.1 Sayfa Amacı

Adminlerin role-feature permission matrisini görmesini ve yetkisi varsa güncellemesini sağlar.

### 29.2 MVP UI

Tablo kolonları:

- Feature
- Module
- Role
- View
- Create
- Update
- Delete
- Manage
- Export

Daha kullanışlı ikinci seçenek:

- Satır: Feature
- Kolon grubu: Role
- Checkboxlar: V/C/U/D/M/E

Ama ilk MVPde basit satır bazlı tablo daha az risklidir.

### 29.3 Veri Kaynakları

Okunacak tablolar:

- `roles`
- `features`
- `role_feature_permissions`

Güncellenecek tablo:

- `role_feature_permissions`

### 29.4 Güvenlik

- Sayfa görünümü için `permissions.manage:view`
- Güncelleme için `permissions.manage:manage`
- UI checkboxları sadece update yetkisi olan kişiye açık olmalı.
- RLS zaten backend seviyesinde korumalı olmalı.

### 29.5 Acceptance Criteria

- Super admin tüm matrisi görür.
- Admin matrisi okuyabilir ama değiştiremeyebilir.
- Yetkisiz kullanıcı routeu açamaz.
- Checkbox değişikliği DBde karşılık bulur.
- Refresh sonrası değişiklik korunur.
- Super adminin kendi yetkisini yanlışlıkla tamamen kapatması engellenir.

---

## 30. Admin User Roles Page

Dosya:

```text
src/pages/admin/UserRolesPage.tsx
```

### 30.1 Sayfa Amacı

Bir kullanıcıya rol atamak veya rolü pasif yapmak.

### 30.2 MVP Alanları

- Kullanıcı arama
- Kullanıcı listesi
- Kullanıcının mevcut rolleri
- Rol ekle dropdown
- Rolü pasifleştir butonu
- Rol notu
- Opsiyonel bitiş tarihi

### 30.3 Güvenlik

- Görmek için: `users.roles.manage:view`
- Atamak/güncellemek için: `users.roles.manage:update`
- `super_admin` rolünü sadece `super_admin` atayabilmeli.
- Kullanıcı kendi `super_admin` rolünü yanlışlıkla kapatamamalı.

### 30.4 Acceptance Criteria

- Admin kullanıcı listesini görür.
- Kullanıcıya `moderator` rolü atar.
- Moderator kullanıcı admin members sayfasını görebilir ama roles sayfasını göremez.
- Rol pasifleştirilince erişim kapanır.
- Rol expires_at geçince erişim kapanır.

---

## 31. Audit Log MVP

İlk fazda audit log minimum tutulabilir.

Loglanacak olaylar:

- user role assigned
- user role disabled
- role permission updated
- profile updated by admin
- user feature override changed

Örnek insert helper:

```sql
insert into public.profile_audit_logs (
  actor_id,
  target_user_id,
  action,
  entity_type,
  entity_id,
  old_values,
  new_values
)
values (
  auth.uid(),
  target_user_id,
  'user_role_assigned',
  'user_roles',
  inserted_user_role_id,
  null,
  to_jsonb(new_record)
);
```

MVPde audit log manuel frontend mutation sonrası insert edilebilir. Daha sağlam model için triggerlar ikinci faza bırakılabilir.

---

## 32. Existing Admin Pages için Feature Mapping

Mevcut admin route ve feature eşlemesi:

| Route | Feature | Action |
|---|---|---|
| `/admin` | `admin.dashboard` | `view` |
| `/admin/members` | `admin.members` | `view` |
| `/admin/lansman` | `admin.lansman` | `view` |
| `/admin/referral*` | `admin.referrals` | `view` |
| `/admin/surveys*` | `admin.surveys` | `view` |
| `/admin/whatsapp-landings` | `admin.whatsapp_landings` | `view` |
| `/admin/workspace/*` | `admin.workspace` | `view` |
| `/admin/may19/*` | `admin.may19` | `view` |
| `/admin/roles` | `roles.manage` | `view` |
| `/admin/permissions` | `permissions.manage` | `view` |
| `/admin/users/:id/roles` | `users.roles.manage` | `view` |
| `/admin/audit-logs` | `audit.logs.view` | `view` |

---

## 33. Existing Button/Action Mapping

| İşlem | Feature | Action |
|---|---|---|
| Submission listeleme | `admin.members` | `view` |
| Submission status değiştirme | `admin.members` | `update` |
| Submission export | `admin.members` | `export` |
| Lansman kayıt export | `admin.lansman` | `export` |
| Referral code oluşturma | `admin.referrals` | `create` |
| Referral code silme | `admin.referrals` | `delete` |
| Survey oluşturma | `admin.surveys` | `create` |
| Survey güncelleme | `admin.surveys` | `update` |
| Survey silme | `admin.surveys` | `delete` |
| Survey cevap export | `admin.survey_responses` | `export` |
| Workspace note oluşturma | `admin.workspace` | `create` |
| Workspace note güncelleme | `admin.workspace` | `update` |
| May19 submission approve/reject | `admin.may19` | `update` |
| Kullanıcıya rol atama | `users.roles.manage` | `update` |
| Permission matrix değiştirme | `permissions.manage` | `manage` |

---

## 34. RLS Güncelleme Stratejisi - Mevcut Tablolar

İlk fazda tüm mevcut tabloların RLS policylerini değiştirmek risklidir. Bu yüzden şu yaklaşım izlenmeli:

### 34.1 Faz 1

- Yeni tabloların RLS policyleri eklensin.
- Eski `is_admin` fonksiyonu yeni role sistemini tanısın.
- Mevcut admin tablolarında policy değişikliği minimumda kalsın.

### 34.2 Faz 2

Mevcut tablolarda `is_admin(auth.uid())` kullanılan policyler tek tek şu yapıya geçirilsin:

```sql
public.has_permission(auth.uid(), 'admin.members', 'view')
```

veya:

```sql
public.has_permission(auth.uid(), 'admin.surveys', 'manage')
```

### 34.3 Dikkat Edilecek Tablolar

- `submissions`
- `lansman_registrations`
- `referral_sources`
- `referral_types`
- `referral_groups`
- `referral_codes`
- `referral_code_usages`
- `whatsapp_landings`
- `whatsapp_join_requests`
- `may19_campaign_submissions`
- `surveys`
- `survey_questions`
- `survey_responses`
- `survey_answers`

### 34.4 Public Insert Policyleri Bozulmamalı

Aşağıdaki public akışlar korunmalı:

- `/form`
- `/aiform`
- `/lansman`
- `/anket`
- `/anket/:slug`
- campaign form akışları

Özellikle `submissions` public insert policy yeniden bozulmamalı.

---

## 35. E2E Implementation Plan

Aşağıdaki görevler agenta küçük parçalar halinde verilebilir.

---

# FAZ 0 - Hazırlık ve Güvenli Başlangıç

## TODO 0.1 - Yeni Branch Aç

**Amaç:** Ana branchi bozmadan çalışmak.

PowerShell:

```powershell
git status
git checkout -b feat/profile-rbac-permissions
git status
```

Acceptance criteria:

- Yeni branch açıldı.
- Working tree temiz veya mevcut değişiklikler bilinçli şekilde duruyor.

---

## TODO 0.2 - Mevcut Testleri Çalıştır

PowerShell:

```powershell
npm install
npm run lint
npm run test
npm run build
```

Acceptance criteria:

- Mevcut kodun başlangıç durumu biliniyor.
- Hata varsa yeni işle karıştırılmadan not edildi.

---

## TODO 0.3 - Mevcut Admin ve RLS Yapısını İncele

SQL:

```sql
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

SQL:

```sql
select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('is_admin', 'has_role', 'has_permission');
```

Acceptance criteria:

- Mevcut policyler export/not edildi.
- `is_admin` mevcut mu görüldü.
- `admin_users` tablo kolonları not edildi.

---

## TODO 0.4 - Supabase Type Generate Hazırlığı

PowerShell:

```powershell
supabase --version
supabase status
```

Acceptance criteria:

- Supabase CLI çalışıyor.
- Project link durumu biliniyor.
- Remote ile local migration farkı kontrol edildi.

---

# FAZ 1 - Database Foundation

## TODO 1.1 - İlk Migration Dosyasını Oluştur

Dosya:

```text
supabase/migrations/20260519110000_create_profiles_roles_permissions.sql
```

İş:

- Section 10daki SQLi ekle.
- Sadece tablolar, indexler, updated_at triggerları oluştur.
- RLS policy ekleme.

Acceptance criteria:

- Migration dosyası oluştu.
- SQL syntax hatası yok.

---

## TODO 1.2 - Local Migration Test

PowerShell:

```powershell
supabase db reset
```

Alternatif remote/staging için:

```powershell
supabase db push
```

Acceptance criteria:

- Migration sorunsuz uygulanır.
- Yeni tablolar oluşur.

Kontrol SQL:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'profiles',
    'roles',
    'user_roles',
    'features',
    'role_feature_permissions',
    'user_feature_overrides',
    'profile_audit_logs'
  );
```

---

## TODO 1.3 - Seed Migration Oluştur

Dosya:

```text
supabase/migrations/20260519111000_seed_roles_features_permissions.sql
```

İş:

- Section 11deki SQLi ekle.
- Roller seed edilsin.
- Featurelar seed edilsin.
- Permission matrisi seed edilsin.

Acceptance criteria:

- Roller oluşur.
- Featurelar oluşur.
- Role-feature permission kayıtları oluşur.

Kontrol SQL:

```sql
select key, name, priority from public.roles order by priority;
select key, module, name from public.features order by sort_order;
select count(*) from public.role_feature_permissions;
```

---

## TODO 1.4 - Auth Trigger Migration Oluştur

Dosya:

```text
supabase/migrations/20260519112000_profile_auth_trigger.sql
```

İş:

- Auth kullanıcı oluşunca profile oluşsun.
- Yeni kullanıcıya `member` rolü otomatik atansın.
- Existing users backfill edilsin.

Acceptance criteria:

- Existing auth users için profile var.
- Rolesiz kullanıcılar member rolü aldı.
- Yeni signup sonrası otomatik profile oluşuyor.

---

## TODO 1.5 - Helper Functions Migration Oluştur

Dosya:

```text
supabase/migrations/20260519113000_profiles_rls_policies.sql
```

İş:

- `has_role`
- `has_any_role`
- `has_permission`
- `get_my_permissions`

Acceptance criteria:

- Fonksiyonlar oluşur.
- Authenticated kullanıcı `get_my_permissions` çağırabilir.
- `has_permission` super_admin için true döner.

---

## TODO 1.6 - RLS Policyleri Ekle

Aynı migrationa veya ayrı dosyaya ekle:

- profiles policyleri
- roles policyleri
- user_roles policyleri
- features policyleri
- role_feature_permissions policyleri
- user_feature_overrides policyleri
- profile_audit_logs policyleri

Acceptance criteria:

- RLS tüm yeni tablolarda aktif.
- Kullanıcı kendi profilini okuyabilir/güncelleyebilir.
- Normal member rolleri göremez.
- Admin/super_admin role ve permission tablolarını görebilir.

---

## TODO 1.7 - `is_admin` Uyumluluk Migrationı

Dosya:

```text
supabase/migrations/20260519114000_update_is_admin_compatibility.sql
```

İş:

- Mevcut `is_admin` fonksiyonunu kırmadan güncelle.
- Yeni role sistemi + eski `admin_users` desteği kalsın.

Acceptance criteria:

- Eski admin panel erişimi bozulmaz.
- `admin` rolü olan kişi `is_admin(auth.uid()) = true` olur.
- `member` rolü olan kişi false olur.

---

# FAZ 2 - İlk Admin Atama ve Backfill

## TODO 2.1 - Admin Users Kolonlarını Kontrol Et

SQL:

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'admin_users'
order by ordinal_position;
```

Acceptance criteria:

- `admin_users` kolon yapısı netleşti.
- Backfill SQL doğru varyantla seçildi.

---

## TODO 2.2 - Legacy Adminleri Yeni Role Sistemine Taşı

İş:

- Eğer `admin_users.user_id` varsa user_id bazlı taşı.
- Eğer `admin_users.email` varsa email bazlı taşı.
- Emin değilsen migrationa otomatik riskli SQL yazma; ayrı manuel backfill dosyası oluştur.

Acceptance criteria:

- Mevcut admin kullanıcılar yeni sistemde `admin` rolüne sahip.
- Hiçbir admin erişimi kaybolmadı.

---

## TODO 2.3 - İlk Super Admini Ata

SQLde `OWNER_EMAIL_HERE` değiştir:

```sql
select id, email from auth.users order by created_at asc;
```

Sonra super admin atama SQLini çalıştır.

Acceptance criteria:

- En az bir super_admin var.
- Super admin `get_my_permissions` ile tüm featureları full görüyor.

---

# FAZ 3 - Supabase Types ve Client Kontrolü

## TODO 3.1 - Supabase Types Generate

PowerShell örnekleri:

```powershell
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

Remote project için:

```powershell
supabase gen types typescript --project-id injprdrsklkxgnaiixzh > src/integrations/supabase/types.ts
```

Acceptance criteria:

- `profiles`, `roles`, `features` tipleri oluştu.
- TypeScript build bu tiplerle geçiyor.

---

## TODO 3.2 - Import Path Kontrolü

İş:

- `@/integrations/supabase/client`
- `@/integrations/supabase/types`
- `@/lib/auth/*`

Acceptance criteria:

- Alias importlar çalışıyor.
- TS path config uyumlu.

---

# FAZ 4 - Frontend Auth/Permission Foundation

## TODO 4.1 - Permission Types Dosyasını Ekle

Dosya:

```text
src/lib/auth/permissionTypes.ts
```

Acceptance criteria:

- `PermissionAction`, `RoleKey`, `FeatureKey`, `PermissionRecord` tipleri var.
- Build hatası yok.

---

## TODO 4.2 - Permission Keys Dosyasını Ekle

Dosya:

```text
src/lib/auth/permissionKeys.ts
```

Acceptance criteria:

- Feature keyler merkezi sabitlerden okunuyor.
- String dağınıklığı azaltıldı.

---

## TODO 4.3 - Permission Client Dosyasını Ekle

Dosya:

```text
src/lib/auth/permissionClient.ts
```

Acceptance criteria:

- `fetchMyPermissions` RPC çağırıyor.
- `buildPermissionMap` çalışıyor.
- `hasPermissionInMap` manage fallbackini doğru uyguluyor.

---

## TODO 4.4 - `useMyPermissions` Hookunu Ekle

Dosya:

```text
src/hooks/useMyPermissions.ts
```

Acceptance criteria:

- TanStack Query ile permissionlar çekiliyor.
- `hasPermission(feature, action)` çalışıyor.
- Loading ve error durumları yönetiliyor.

---

## TODO 4.5 - `useCurrentProfile` Hookunu Ekle

Dosya:

```text
src/hooks/useCurrentProfile.ts
```

Acceptance criteria:

- Auth user alınır.
- User yoksa null döner.
- User varsa profile çekilir.

---

## TODO 4.6 - Guard Componentlerini Ekle

Dosyalar:

```text
src/components/auth/RequirePermission.tsx
src/components/auth/UnauthorizedState.tsx
src/components/auth/AuthLoadingState.tsx
```

Acceptance criteria:

- Yetki yoksa fallback render olur.
- Loading durumda loading fallback render olur.
- Yetki varsa children render olur.

---

# FAZ 5 - Profile Page MVP

## TODO 5.1 - Profile Page Oluştur

Dosya:

```text
src/pages/ProfilePage.tsx
```

İş:

- Profile formu oluştur.
- Kendi profilini düzenleme.
- Save mutation.
- Toast success/error.

Acceptance criteria:

- `/profile` route çalışır.
- Kullanıcı kendi profilini günceller.
- Kaydet sonrası yeni değer görünür.

---

## TODO 5.2 - Profile Route Ekle

Dosya:

```text
src/App.tsx
```

İş:

- `/profile` routeu ekle.
- Giriş gerektiriyorsa mevcut auth yapısına göre guard ekle.

Acceptance criteria:

- Login olmuş kullanıcı profile gider.
- Login olmayan kullanıcı kontrollü şekilde engellenir/yönlendirilir.

---

## TODO 5.3 - Header veya User Menuye Profile Linki Ekle

Dosya muhtemel:

```text
src/components/SiteHeader.tsx
```

Acceptance criteria:

- Login olmuş kullanıcı profile linkini görür.
- Public nav bozulmaz.
- Mobile/hamburger davranışı bozulmaz.

---

# FAZ 6 - Admin Navigation Guard

## TODO 6.1 - Admin Nav Item Map Oluştur

Dosya:

```text
src/lib/admin/navigation.ts
```

Acceptance criteria:

- Admin menu itemları feature keylerle eşleşir.
- Hardcoded permission logic azaltılır.

---

## TODO 6.2 - AdminLayout Nav Filtrelemesi

Dosya muhtemel:

```text
src/components/admin/AdminLayout.tsx
```

İş:

- `useMyPermissions` kullan.
- Kullanıcının yetkisi olmayan nav itemları gizle.

Acceptance criteria:

- Moderator sadece izinli admin itemlarını görür.
- Super admin tüm itemları görür.
- Loading sırasında menu flicker minimum olur.

---

## TODO 6.3 - Admin Dashboard Route Guard

Dosya:

```text
src/App.tsx
```

İş:

- `/admin` routeunu `admin.dashboard:view` ile sar.

Acceptance criteria:

- Yetkisiz member `/admin` açamaz.
- Admin açabilir.
- Super admin açabilir.

---

# FAZ 7 - Existing Admin Routes Permission Guard

Bu fazda route route ilerle. Her route için ayrı commit önerilir.

## TODO 7.1 - Members Route Guard

Feature:

```text
admin.members:view
```

Acceptance criteria:

- Admin ve moderator görebilir.
- Member göremez.

---

## TODO 7.2 - Lansman Route Guard

Feature:

```text
admin.lansman:view
```

Acceptance criteria:

- Admin görebilir.
- Moderator görebilir.
- Member göremez.

---

## TODO 7.3 - Referrals Route Guard

Feature:

```text
admin.referrals:view
```

Acceptance criteria:

- Admin görebilir.
- Moderator sadece view ise görebilir.
- Member göremez.

---

## TODO 7.4 - Surveys Route Guard

Feature:

```text
admin.surveys:view
```

Acceptance criteria:

- Admin/editor/moderator görebilir.
- Member göremez.

---

## TODO 7.5 - WhatsApp Landings Route Guard

Feature:

```text
admin.whatsapp_landings:view
```

Acceptance criteria:

- Admin/editor/moderator görebilir.
- Member göremez.

---

## TODO 7.6 - Workspace Route Guard

Feature:

```text
admin.workspace:view
```

Acceptance criteria:

- Admin/editor/contributor uygun erişimle görebilir.
- Member göremez.

---

## TODO 7.7 - May19 Route Guard

Feature:

```text
admin.may19:view
```

Acceptance criteria:

- Admin/moderator/editor görebilir.
- Member göremez.

---

# FAZ 8 - Button/Action Level Permission

Routeu görmek ayrı, aksiyon yapmak ayrıdır.

## TODO 8.1 - Export Butonlarını Koru

Feature-action örnekleri:

- `admin.members:export`
- `admin.lansman:export`
- `admin.survey_responses:export`

Acceptance criteria:

- Export yetkisi olmayan kullanıcı export butonu görmez.
- API/DB tarafında da export datasına erişemez.

---

## TODO 8.2 - Create/Edit/Delete Butonlarını Koru

Örnek:

```tsx
const canCreateSurvey = hasPermission(FEATURE_KEYS.ADMIN_SURVEYS, "create");
const canDeleteSurvey = hasPermission(FEATURE_KEYS.ADMIN_SURVEYS, "delete");
```

Acceptance criteria:

- Editor survey create/update/delete yapabilir.
- Moderator sadece view/update yapabilir.
- Member hiçbir admin aksiyonu yapamaz.

---

## TODO 8.3 - Destructive Actions için Ek Kontrol

Silme butonları için:

- Permission check
- Confirmation dialog
- Error toast
- RLS blocked response handling

Acceptance criteria:

- UI gizlese bile doğrudan request atıldığında RLS engeller.
- Kullanıcı anlaşılır hata görür.

---

# FAZ 9 - Role Matrix Admin UI

## TODO 9.1 - RoleMatrixPage Skeleton

Dosya:

```text
src/pages/admin/RoleMatrixPage.tsx
```

İlk hali:

- Page title
- Loading state
- Error state
- Empty state

Acceptance criteria:

- Route açılır.
- Yetkisiz kullanıcı açamaz.

---

## TODO 9.2 - Roles ve Features Queryleri

Queryler:

- `roles`
- `features`
- `role_feature_permissions`

Acceptance criteria:

- Tablo için gerekli data gelir.
- Sort order doğru uygulanır.

---

## TODO 9.3 - Matrix Table Render

İş:

- Feature satırları
- Role bazlı permission checkboxları
- V/C/U/D/M/E ayrımı

Acceptance criteria:

- Mevcut seed matrisi UIda görünür.
- Super admin tüm checkboxları görür.

---

## TODO 9.4 - Permission Update Mutation

İş:

- Checkbox değişince ilgili `role_feature_permissions` satırı update olur.
- Optimistic update opsiyonel; ilk MVPde refetch yeterli.

Acceptance criteria:

- Checkbox update DBye yansır.
- Refresh sonrası korunur.
- Error durumunda toast gösterilir.

---

## TODO 9.5 - Kritik Yetki Koruması

Engellenecek riskler:

- Son super adminin `permissions.manage` yetkisinin kapatılması.
- Son super admin rolünün kaldırılması.
- Super adminin kendi kendini tamamen kilitlemesi.

Acceptance criteria:

- Tehlikeli işlemde UI confirmation ister.
- Backend/RLS mümkünse engeller.
- En az bir super_admin kalır.

---

# FAZ 10 - User Roles Admin UI

## TODO 10.1 - User List Query

Kaynak:

- `profiles`
- `user_roles`
- `roles`

Acceptance criteria:

- Admin kullanıcıları listeler.
- Arama email/display name üzerinden çalışır.

---

## TODO 10.2 - User Role Detail

İş:

- Seçilen kullanıcının rollerini göster.
- Aktif/pasif/expired ayrımı göster.

Acceptance criteria:

- Kullanıcının mevcut rolleri doğru görünür.

---

## TODO 10.3 - Role Assign Mutation

İş:

- Dropdowndan rol seç.
- `user_roles` insert veya existing inactive ise active update.

Acceptance criteria:

- Kullanıcıya rol atanır.
- Permissionlar refresh sonrası değişir.

---

## TODO 10.4 - Role Disable Mutation

İş:

- Rol silmek yerine `is_active = false`.
- Audit log ekle.

Acceptance criteria:

- Rol devre dışı kalır.
- Erişim kapanır.
- Eski kayıt audit için durur.

---

## TODO 10.5 - Expiring Role Support

İş:

- `expires_at` alanı UIda opsiyonel göster.
- Tarih geçince helper function zaten rolü yok sayar.

Acceptance criteria:

- Süreli rol atanabilir.
- Süresi geçen rol yetki vermez.

---

# FAZ 11 - RLS Hardening for Existing Tables

Bu faz dikkatli yapılmalı. Her tablo tek tek ele alınmalı.

## TODO 11.1 - `submissions` Policy Review

Hedef:

- Public insert bozulmasın.
- Admin read/update permission bazlı olsun.

Örnek:

```sql
-- select
using (
  public.has_permission(auth.uid(), 'admin.members', 'view')
)

-- update
using (
  public.has_permission(auth.uid(), 'admin.members', 'update')
)
```

Acceptance criteria:

- Public form submit çalışır.
- Admin members listesi çalışır.
- Member submission datasını okuyamaz.

---

## TODO 11.2 - `lansman_registrations` Policy Review

Feature:

```text
admin.lansman
```

Acceptance criteria:

- Public lansman kayıt akışı çalışır.
- Admin listeleme çalışır.
- Yetkisiz erişim engellenir.

---

## TODO 11.3 - Referral Tables Policy Review

Feature:

```text
admin.referrals
```

Tablolar:

- `referral_sources`
- `referral_types`
- `referral_groups`
- `referral_codes`
- `referral_code_usages`

Acceptance criteria:

- Referral admin ekranları çalışır.
- Yetkisiz kullanıcı referral datayı okuyamaz.

---

## TODO 11.4 - Survey Admin Tables Policy Review

Featurelar:

- `admin.surveys`
- `admin.survey_responses`

Tablolar:

- `surveys`
- `survey_questions`
- `survey_responses`
- `survey_answers`

Acceptance criteria:

- Public survey submit function çalışır.
- Admin survey management çalışır.
- Survey response export sadece yetkili kişide çalışır.

---

## TODO 11.5 - May19 Policy Review

Feature:

```text
admin.may19
```

Acceptance criteria:

- Public campaign submissions çalışır.
- Moderasyon ekranı sadece yetkililere açık.

---

# FAZ 12 - Edge Function Kontrolleri

## TODO 12.1 - `verify_jwt=true` Functionlarda Role Kullanımı

Mevcut functionlar:

- `chat-register`
- `find-matches`
- `send-submission-email`
- `lansman-admin`

İş:

- Function içinde admin kontrolü varsa yeni `has_permission` RPC veya SQL kontrolüyle uyumlandır.

Acceptance criteria:

- Functionlar eski adminle de çalışır.
- Yeni admin rolüyle de çalışır.
- Member yetkisiz işlem yapamaz.

---

## TODO 12.2 - `submit-survey-response` Public Kalmalı

Bu function `verify_jwt=false`.

İş:

- Public survey submit bozulmamalı.
- Admin permission kontrolü bu public submit içine sokulmamalı.
- Rate limit/anti-spam kalmalı.

Acceptance criteria:

- Public kullanıcı anket doldurabilir.
- Admin-only cevap okuma ayrı kalır.

---

# FAZ 13 - Test Planı

## TODO 13.1 - SQL Helper Function Testleri

Test kullanıcıları:

- super_admin
- admin
- moderator
- editor
- member

SQL kontroller:

```sql
select public.has_role('<USER_ID>', 'admin');
select public.has_permission('<USER_ID>', 'admin.members', 'view');
select public.has_permission('<USER_ID>', 'permissions.manage', 'manage');
```

Acceptance criteria:

- Matrixte beklenen true/false sonuçlar alınır.

---

## TODO 13.2 - RLS Manual Test

Senaryolar:

1. Member kendi profilini update eder.
2. Member başka profili update edemez.
3. Moderator members view yapar.
4. Moderator permissions matrix göremez.
5. Admin roles matrixi view eder.
6. Super admin matrix update eder.
7. Public form submit çalışır.

Acceptance criteria:

- Her senaryo beklenen sonucu verir.

---

## TODO 13.3 - Frontend Unit Testler

Test dosyaları:

```text
src/lib/auth/permissionClient.test.ts
src/components/auth/RequirePermission.test.tsx
```

Testler:

- `can_manage` true ise tüm aksiyonlar true sayılır.
- Feature yoksa false.
- Loading fallback çalışır.
- Unauthorized fallback çalışır.
- Children sadece yetkide render olur.

---

## TODO 13.4 - Admin Route Smoke Test

Manual:

- `/admin`
- `/admin/members`
- `/admin/lansman`
- `/admin/referral`
- `/admin/surveys`
- `/admin/workspace`
- `/admin/roles`
- `/profile`

Acceptance criteria:

- Super admin hepsine girer.
- Member sadece profile girer.
- Moderator sadece izinli admin routelara girer.

---

## TODO 13.5 - Build ve Lint

PowerShell:

```powershell
npm run lint
npm run test
npm run build
```

Acceptance criteria:

- Build geçer.
- Testler geçer.
- TypeScript hatası yok.

---

# FAZ 14 - Deployment Plan

## TODO 14.1 - Pre-deploy Checklist

PowerShell:

```powershell
git status
npm run lint
npm run test
npm run build
```

SQL:

```sql
select key from public.roles order by priority;
select key from public.features order by sort_order;
```

Acceptance criteria:

- Kod build oluyor.
- Migrationlar stagingde test edildi.
- En az bir super_admin var.

---

## TODO 14.2 - Migration Deploy

PowerShell:

```powershell
supabase db push
```

Acceptance criteria:

- Migrationlar uygulanır.
- RLS policy hatası yok.
- Helper functions çalışır.

---

## TODO 14.3 - App Deploy

Mevcut deployment akışına göre:

```powershell
npm run build
```

Sonra kullanılan platforma göre deploy.

Acceptance criteria:

- Site açılır.
- `/profile` çalışır.
- `/admin` permission kontrollü açılır.

---

## TODO 14.4 - Post-deploy Smoke Test

Test:

1. Public landing aç.
2. Public form submit dene.
3. Admin login yap.
4. `/profile` aç.
5. `/admin` aç.
6. `/admin/roles` aç.
7. Bir test kullanıcıya moderator rolü ver.
8. Test kullanıcı ile login olup izinleri kontrol et.
9. Public anket submit dene.
10. Admin survey responses görüntüle.

Acceptance criteria:

- Kritik public akışlar bozulmadı.
- Admin erişimleri çalışıyor.
- Yetkisiz erişim engelleniyor.

---

# FAZ 15 - Rollback Plan

## 15.1 Soft Rollback

Eğer frontend route guard sorun çıkarırsa:

- Route guardlar geçici olarak kaldırılır.
- `is_admin` compatibility sayesinde eski admin akışı devam eder.
- Yeni tablolar DBde kalabilir.

## 15.2 Permission Rollback

Eğer permission matrisi yanlışsa:

- Super admin ile matrix seed tekrar çalıştırılır.
- Admin role permissions reset edilir.

## 15.3 Migration Rollback

Supabase migration rollback doğrudan otomatik olmayabilir. Bu yüzden production öncesi backup alınmalı.

Manual rollback SQL sadece acil durumda kullanılmalı:

```sql
-- Dikkat: Productionda veri kaybı oluşturur.
drop table if exists public.profile_audit_logs cascade;
drop table if exists public.user_feature_overrides cascade;
drop table if exists public.role_feature_permissions cascade;
drop table if exists public.features cascade;
drop table if exists public.user_roles cascade;
drop table if exists public.roles cascade;
drop table if exists public.profiles cascade;
```

Öneri:

- Productionda drop rollback yerine compatibility mode tercih edilmeli.
- Yeni system pasif bırakılıp eski `admin_users` ile devam edilebilir.

---

# FAZ 16 - Definition of Done

Bu iş tamamlandı sayılmak için:

- [ ] `profiles` tablosu var.
- [ ] Auth user oluşunca profile otomatik oluşuyor.
- [ ] Her kullanıcı default `member` rolü alıyor.
- [ ] Roller seed edildi.
- [ ] Featurelar seed edildi.
- [ ] Permission matrix seed edildi.
- [ ] `has_role` çalışıyor.
- [ ] `has_permission` çalışıyor.
- [ ] `get_my_permissions` çalışıyor.
- [ ] Yeni RLS policyleri çalışıyor.
- [ ] Eski `is_admin` akışı bozulmadı.
- [ ] En az bir super_admin var.
- [ ] `/profile` sayfası çalışıyor.
- [ ] Admin nav permissiona göre filtreleniyor.
- [ ] Admin routes permission guard ile korunuyor.
- [ ] Role matrix UI çalışıyor.
- [ ] User role assignment UI çalışıyor.
- [ ] Public formlar bozulmadı.
- [ ] Public survey submit bozulmadı.
- [ ] Lint geçiyor.
- [ ] Testler geçiyor.
- [ ] Build geçiyor.
- [ ] Post-deploy smoke test geçti.

---

## 17. Agent İçin Çalışma Kuralları

Agent bu işi yaparken şu kurallara uymalı:

1. Büyük refactor yapma.
2. Her fazı küçük commitlerle ilerlet.
3. Public form insert policylerini bozma.
4. `SUPABASE_SERVICE_ROLE_KEY` frontend tarafına asla ekleme.
5. Mevcut `admin_users` yapısını silme.
6. `is_admin` compatibility koru.
7. Her yeni admin route için hem frontend guard hem RLS kontrolü düşün.
8. UI guardı güvenlik sayma; gerçek güvenlik RLS olmalı.
9. Migrationdan sonra types generate et.
10. Build almadan işi bitmiş sayma.
11. Member rolünün admin dataya erişmediğini test et.
12. En az bir super_admin olduğundan emin ol.
13. Son super_adminin kilitlenmesini engelle.
14. RLS değişikliklerini tablo tablo yap.
15. Public Edge Function akışlarını bozma.
16. Her destructive aksiyon için confirmation ekle.
17. Error toast ve loading state ekle.
18. TypeScriptte `any` kullanımından kaçın.
19. Gereksiz dosya oluşturma.
20. Her TODO sonunda acceptance criteriayı test et.

---

## 18. Codex / GLM5 İçin Hazır Prompt

Aşağıdaki prompt agenta doğrudan verilebilir:

```text
Bu repository CorteQS Landing projesidir. React 18 + TypeScript + Vite + Tailwind + shadcn/Radix frontend ve Supabase Auth/RLS/Edge Functions backend kullanır.

Görev: Projeye profil sistemi, rol sistemi ve feature bazlı permission matrix ekle.

Çok önemli kurallar:
- Mevcut admin_users yapısını silme.
- Mevcut public form, lansman ve survey submit akışlarını bozma.
- SUPABASE_SERVICE_ROLE_KEY frontend tarafına asla ekleme.
- Önce database migrationları küçük dosyalar halinde ekle.
- Sonra Supabase types generate et.
- Sonra frontend permission hookları ve guard componentleri ekle.
- Sonra /profile sayfasını ekle.
- Sonra admin navigationı permissiona göre filtrele.
- Sonra admin route guardlarını tek tek ekle.
- Sonra RoleMatrixPage ve UserRolesPage ekle.
- En az bir super_admin atanmasını sağlayacak manuel SQL notu ekle.
- RLS güvenliğini backendde sağla; frontend guardı sadece UX say.
- Her fazdan sonra npm run lint, npm run test, npm run build çalıştır.

Uygulama fazları:
1. create_profiles_roles_permissions migration
2. seed_roles_features_permissions migration
3. profile_auth_trigger migration
4. helper functions + RLS policies migration
5. is_admin compatibility migration
6. Supabase types generate
7. src/lib/auth permission dosyaları
8. hooks: useCurrentProfile, useMyPermissions
9. components/auth: RequirePermission, UnauthorizedState
10. /profile page
11. admin navigation permission filtering
12. admin route guards
13. RoleMatrixPage
14. UserRolesPage
15. tests
16. final build verification

Acceptance:
- Login olan kullanıcı kendi profilini görüp düzenleyebilmeli.
- Default kullanıcı member rolü almalı.
- Member admin dataya erişememeli.
- Admin eski sistemdeki erişimini kaybetmemeli.
- Super admin tüm yetkilere sahip olmalı.
- Permission matrix değişince UI ve RLS davranışı değişmeli.
- Public form submit ve public survey submit çalışmaya devam etmeli.
```

---

## 19. En Basit İlk Sprint Önerisi

İşi fazla büyütmeden ilk sprintte sadece şunları yap:

1. DB tabloları
2. roles/features seed
3. auth profile trigger
4. `has_permission`
5. `is_admin` compatibility
6. `/profile` sayfası
7. admin nav filtreleme
8. sadece `/admin` ve `/admin/members` route guard
9. build/test

İlk sprintten sonra:

- Role matrix UI
- User role assignment UI
- existing table policy migration
- audit logs
- user-level overrides

---

## 20. Riskler ve Önlemler

| Risk | Etki | Önlem |
|---|---|---|
| Admin kendini kilitler | Yüksek | En az bir super_admin kontrolü |
| Public form bozulur | Yüksek | Public insert policylere dokunmadan ilerle |
| RLS recursion oluşur | Yüksek | Helper functionları security definer yap |
| `admin_users` şeması bilinmez | Orta | Önce kolon inspect et |
| Permission matrix yanlış seed edilir | Orta | Seed SQL idempotent olsun |
| Frontend build type hatası | Orta | Types generate sonrası build al |
| UI guarda fazla güvenilir | Yüksek | DB RLS asıl güvenlik olarak kalsın |
| Edge function auth akışları bozulur | Orta | Public functionları ayrı tut |
| Çok büyük refactor yapılır | Orta | TODO bazlı küçük ilerle |

---

## 21. Önerilen Commit Planı

```text
feat(db): add profile rbac schema
feat(db): seed roles features permissions
feat(db): add profile trigger and backfill
feat(db): add permission helper functions and rls
feat(db): preserve legacy is_admin compatibility
feat(auth): add permission types client and hooks
feat(profile): add profile page
feat(admin): add permission-aware admin navigation
feat(admin): guard admin routes by feature permissions
feat(admin): add role permission matrix page
feat(admin): add user role assignment page
test(auth): add permission helper tests
chore: regenerate supabase types
```

---

## 22. Son Not

Bu sistemin ana avantajı şudur:

- Bugün sadece basit admin/member ayrımıyla başlayabilir.
- Yarın moderator/editor/contributor gibi roller eklenebilir.
- Daha sonra influencer, consultant, business, organization, community manager gibi CorteQS ürün rollerine genişleyebilir.
- Feature bazlı matris sayesinde yeni modül ekledikçe yetki sistemi yeniden yazılmaz.
- RLS sayesinde frontend manipülasyonu ile admin verisine erişim engellenir.

İlk implementationda hedef mükemmel kurumsal IAM sistemi kurmak değil, sağlam ve büyütülebilir bir temel atmaktır.
