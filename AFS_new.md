# AFS_new — Catalog Item Role Sistemi Yeniden Mimarisi

**Tarih:** 2026-06-05  
**Durum:** PLAN — Onay bekleniyor  
**Konu:** Katalog itemlerinin rol/kural motoruna dahil edilmesi + Claim'in sadece "düzenleme yetkisi" transferine dönüştürülmesi

---

## Mevcut Durum (AS-IS)

```
catalog_item  (sahipsiz vitrin)
  └── attributes.platform_role_key = "Healthcare_Doctor"  (gizli damga)
  └── Kural motoru ÇALIŞMAZ

  [Kullanıcı "Sahiplen" der]
  [Admin onaylar]
       ↓
  user_profiles_v2.role = "Healthcare_Doctor"  (kural motoru AÇILIR)
  catalog_item_memberships (owner bağlantısı)
```

**Problem:** Katalog öğelerinin kural motoru (Feature, Attribute, Section) kullanabilmesi için mutlaka bir `auth user`'a bağlı olması gerekiyor. Sahipsiz itemler kural motorundan tamamen kopuk.

---

## İstenen Durum (TO-BE)

```
catalog_item  (her zaman bir role sahip)
  └── catalog_items.platform_role_key = "Healthcare_Doctor"  (açık kolon)
  └── Kural motoru ÇALIŞIR (item bazlı)

  Claim = "Bu item'i kim düzenleyebilir?" sorusunun yanıtı
  [Kullanıcı claim eder] → [Admin onaylar] → [editing_user_id atanır]
       ↓
  Kullanıcı item'i düzenleyebilir (kendi user profile rolü DEĞİŞMEZ)
```

**Fark:** Rol ataması item'e aittir, kullanıcıya değil. Claim sadece düzenleme yetkisi transferidir.

---

## Gereksinimler

1. Her `catalog_item` bir `platform_role_key` alabilmeli (mevcut tüm roller: `roles` tablosundan)
2. `catalog_items` için rol bazlı kural motoru çalışmalı (attribute, feature, section)
3. Claim işlemi yalnızca `catalog_item_memberships` üzerinde `editor` rolü atamak anlamına gelmeli
4. Admin panelden herhangi bir kullanıcıya herhangi bir item için düzenleme yetkisi verilebilmeli
5. Bir item birden fazla düzenleyiciye sahip olabilmeli
6. Kullanıcının kendi `user_profiles_v2` rolü claim işleminden etkilenmemeli

---

## Mimari Karar: Item-Level Role System

### Temel Prensip

`catalog_items` tablosu artık kendi rolünü taşır. Kural motoru `item_id` bazında çalışır, `user_id` bazında değil.

```
catalog_items
  ├── platform_role_key: "Healthcare_Doctor"   ← AÇIK KOLON (ekliyoruz)
  └── [attribute/feature/section kuralları bu role'e göre uygulanır]

catalog_item_memberships
  ├── item_id
  ├── user_id
  ├── role: "owner" | "editor" | "viewer"
  └── [bu bağlantı = düzenleme yetkisi, rol transferi DEĞİL]
```

---

## Uygulama Planı

### PHASE 1 — Veritabanı Şema Değişiklikleri

#### 1.1 `catalog_items` tablosuna `platform_role_key` kolonu ekleme

**Yeni migration:** `20260606010000_catalog_item_role_column.sql`

```sql
-- catalog_items tablosuna açık rol kolonu ekle
alter table public.catalog_items
  add column if not exists platform_role_key text
    references public.roles(key) on delete set null;

-- Mevcut attributes.platform_role_key verilerini migrasyona al
update public.catalog_items
set platform_role_key = (attributes->>'platform_role_key')
where attributes ? 'platform_role_key'
  and platform_role_key is null;

-- Index
create index if not exists idx_catalog_items_platform_role_key
  on public.catalog_items (platform_role_key)
  where platform_role_key is not null;
```

**Not:** `attributes` JSON'dan `platform_role_key` kaldırılmaz — geriye dönük uyumluluk için bırakılır, yeni kod açık kolonu kullanır.

#### 1.2 Item-Level Kural Motoru için Yeni Tablolar

**Yeni migration:** `20260606020000_catalog_item_rule_engine.sql`

```sql
-- Bir item için hangi attribute'ların geçerli olduğu (role'den miras veya override)
create table if not exists public.catalog_item_attribute_overrides (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  attribute_key text not null references public.attribute_catalog(key) on delete cascade,
  is_enabled boolean not null default true,
  display_order integer,
  override_label text,         -- item'e özel etiket
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, attribute_key)
);

-- Bir item için hangi feature'ların aktif olduğu
create table if not exists public.catalog_item_feature_overrides (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  feature_key text not null references public.feature_catalog(key) on delete cascade,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, feature_key)
);

-- Bir item için hangi profile section'ların göründüğü
create table if not exists public.catalog_item_section_overrides (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  section_key text not null references public.profile_section_catalog(key) on delete cascade,
  is_visible boolean not null default true,
  display_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, section_key)
);
```

#### 1.3 Claim Sisteminin Sadeleştirilmesi

Mevcut `catalog_claim_requests` tablosu korunur, ancak onay sonucundaki davranış değişir:

**Yeni migration:** `20260606030000_catalog_claim_editor_only.sql`

```sql
-- Claim onaylandığında role ataması YAPILMAZ, sadece membership eklenir
create or replace function public.admin_approve_catalog_claim(
  p_claim_id uuid,
  p_admin_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim record;
begin
  -- Yetki kontrolü
  if not public.is_moderator(p_admin_user_id) then
    raise exception 'Yetkisiz erişim';
  end if;

  select * into v_claim
  from public.catalog_claim_requests
  where id = p_claim_id and status = 'pending';

  if not found then
    raise exception 'Claim bulunamadı veya zaten işlendi';
  end if;

  -- Sadece editor membership ekle (owner rolü değil, user role değişmez)
  insert into public.catalog_item_memberships (item_id, user_id, role, status)
  values (v_claim.item_id, v_claim.requested_by_user_id, 'editor', 'active')
  on conflict (item_id, user_id, role) do update set status = 'active';

  -- Claim'i onayla
  update public.catalog_claim_requests
  set status = 'approved',
      reviewed_by_user_id = p_admin_user_id,
      reviewed_at = now()
  where id = p_claim_id;
end;
$$;

-- Admin'in doğrudan editor yetkisi vermesi için RPC
create or replace function public.admin_grant_catalog_editor(
  p_item_id uuid,
  p_target_user_id uuid,
  p_admin_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_moderator(p_admin_user_id) then
    raise exception 'Yetkisiz erişim';
  end if;

  insert into public.catalog_item_memberships (item_id, user_id, role, status)
  values (p_item_id, p_target_user_id, 'editor', 'active')
  on conflict (item_id, user_id, role) do update set status = 'active';
end;
$$;

-- Admin'in editor yetkisini kaldırması
create or replace function public.admin_revoke_catalog_editor(
  p_item_id uuid,
  p_target_user_id uuid,
  p_admin_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_moderator(p_admin_user_id) then
    raise exception 'Yetkisiz erişim';
  end if;

  update public.catalog_item_memberships
  set status = 'revoked'
  where item_id = p_item_id
    and user_id = p_target_user_id
    and role = 'editor';
end;
$$;
```

---

### PHASE 2 — Kural Motoru RPC'leri (Item Bazlı)

**Yeni migration:** `20260606040000_catalog_item_rule_engine_rpcs.sql`

#### 2.1 Item için Etkin Kuralları Getir (role'den miras + override)

```sql
-- Bir item için efektif attribute listesi döner
-- Önce platform_role_key'e ait role_attribute_rules'a bakar,
-- sonra catalog_item_attribute_overrides ile override eder
create or replace function public.get_catalog_item_rules(p_item_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with item_role as (
    select platform_role_key from public.catalog_items where id = p_item_id
  ),
  role_attributes as (
    select
      ac.key,
      ac.label,
      ac.data_type,
      rar.visibility,
      rar.is_required,
      rar.display_order,
      false as is_override
    from item_role ir
    join public.role_attribute_rules rar on rar.role_key = ir.platform_role_key
    join public.attribute_catalog ac on ac.key = rar.attribute_key
  ),
  item_overrides as (
    select
      ac.key,
      ac.label,
      ac.data_type,
      null::text as visibility,
      null::boolean as is_required,
      ciao.display_order,
      true as is_override
    from public.catalog_item_attribute_overrides ciao
    join public.attribute_catalog ac on ac.key = ciao.attribute_key
    where ciao.item_id = p_item_id and ciao.is_enabled = true
  )
  select jsonb_build_object(
    'attributes', coalesce(jsonb_agg(distinct ra), '[]'::jsonb),
    'overrides', coalesce(jsonb_agg(distinct io), '[]'::jsonb)
  )
  from role_attributes ra, item_overrides io
$$;
```

#### 2.2 Admin: Item'e Rol Ata

```sql
create or replace function public.admin_set_catalog_item_role(
  p_item_id uuid,
  p_role_key text,
  p_admin_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_moderator(p_admin_user_id) then
    raise exception 'Yetkisiz erişim';
  end if;

  update public.catalog_items
  set platform_role_key = p_role_key,
      updated_at = now()
  where id = p_item_id;
end;
$$;
```

---

### PHASE 3 — Backend (TypeScript) Değişiklikleri

#### 3.1 `src/lib/admin-catalog.ts` Güncellemeleri

Eklenecek fonksiyonlar:

```typescript
// Item'e rol ata
export async function setCatalogItemRole(
  itemId: string,
  roleKey: string
): Promise<void>

// Item'in kural motorunu getir (attribute + feature + section)
export async function getCatalogItemRules(
  itemId: string
): Promise<CatalogItemRules>

// Item için attribute override ekle/güncelle
export async function upsertCatalogItemAttributeOverride(
  itemId: string,
  attributeKey: string,
  config: AttributeOverrideConfig
): Promise<void>

// Item'e doğrudan editor yetkisi ver (claim olmadan)
export async function grantCatalogItemEditor(
  itemId: string,
  targetUserId: string
): Promise<void>

// Item'den editor yetkisini kaldır
export async function revokeCatalogItemEditor(
  itemId: string,
  targetUserId: string
): Promise<void>

// Claim'i onayla (sadece editor yetkisi verir, rol transferi yapmaz)
export async function approveCatalogClaim(
  claimId: string
): Promise<void>
```

#### 3.2 Yeni Tip Tanımları

```typescript
// src/lib/catalog-types.ts (yeni dosya)

export interface CatalogItemRules {
  platformRoleKey: string | null;
  attributes: CatalogItemAttribute[];
  features: CatalogItemFeature[];
  sections: CatalogItemSection[];
  overrides: CatalogItemOverrides;
}

export interface CatalogItemAttribute {
  key: string;
  label: string;
  dataType: string;
  visibility: 'public' | 'private' | 'admin_only';
  isRequired: boolean;
  displayOrder: number;
  isOverride: boolean;
}

export interface CatalogItemFeature {
  key: string;
  isEnabled: boolean;
  isOverride: boolean;
}

export interface CatalogItemSection {
  key: string;
  isVisible: boolean;
  displayOrder: number;
  isOverride: boolean;
}

export interface CatalogItemOverrides {
  attributes: Record<string, Partial<CatalogItemAttribute>>;
  features: Record<string, { isEnabled: boolean }>;
  sections: Record<string, { isVisible: boolean; displayOrder?: number }>;
}

export interface CatalogItemEditor {
  userId: string;
  fullName: string;
  email: string;
  membershipRole: 'owner' | 'editor' | 'manager';
  status: 'active' | 'revoked';
  grantedAt: string;
}
```

---

### PHASE 4 — Admin UI Bileşenleri

#### 4.1 `AdminCatalogItemDetailPage.tsx` (güncelleme)

Yeni sekmeler eklenir:

```
[Genel Bilgiler] [Rol & Kurallar] [Düzenleyiciler] [Claim Talepleri]
```

**"Rol & Kurallar" Sekmesi:**
- Rol seçici dropdown (mevcut `RoleSearchSelect` bileşeni kullanılır)
- Seçilen role ait attribute/feature/section listesi (salt okunur önizleme)
- Item bazlı override ekle/kaldır paneli

**"Düzenleyiciler" Sekmesi:**
- Mevcut düzenleyiciler listesi (kullanıcı adı, e-posta, yetki tarihi)
- "Düzenleyici Ekle" butonu → kullanıcı ara + yetki ver
- Her satırda "Yetkiyi Kaldır" butonu

**"Claim Talepleri" Sekmesi:**
- Bekleyen claim talepleri listesi
- "Onayla" → sadece editor membership ekler (kullanıcı rolü değişmez)
- "Reddet" → claim reddedilir

#### 4.2 `CatalogItemRolePanel.tsx` (yeni bileşen)

```
src/components/admin/catalog/CatalogItemRolePanel.tsx
```

- Catalog item için rol seçimi
- Seçilen role'e ait kuralların önizlemesi
- Override yönetimi

#### 4.3 `CatalogItemEditorsPanel.tsx` (yeni bileşen)

```
src/components/admin/catalog/CatalogItemEditorsPanel.tsx
```

- Düzenleyici listesi
- Kullanıcı arama + yetki verme formu
- Yetki iptal kontrolü

---

### PHASE 5 — Importer Script Güncellemesi

`scripts/catalog-role-importer.mjs` güncellenmesi:

**Mevcut davranış:**
```javascript
attributes: { platform_role_key: "Healthcare_Doctor" }
```

**Yeni davranış:**
```javascript
platform_role_key: "Healthcare_Doctor",  // açık kolon
attributes: { /* platform_role_key artık burada saklanmaz */ }
```

Geriye dönük uyumluluk: `catalog_upsert_source_item()` fonksiyonu her iki yolu da destekleyecek şekilde güncellenir.

---

### PHASE 6 — Claim Akışı Sadeleştirmesi (Frontend)

#### 6.1 `DirectoryCatalogItemPage.tsx` (güncelleme)

**Mevcut:** "Bu Profili Sahiplen" → kullanıcı rolü değişir  
**Yeni:** "Bu Sayfayı Düzenlemek İstiyorum" → sadece düzenleme yetkisi talep edilir

Claim formu metni güncellenir:
- Başlık: "Düzenleme Yetkisi Talep Et"
- Açıklama: "Bu katalog kaydının sahibi ya da yetkili temsilcisiyseniz içeriği düzenleyebilmek için başvurabilirsiniz."
- Form alanları: kanıt (evidence) zorunlu olmaktan çıkarılabilir veya opsiyonel olur

#### 6.2 Onay Sonrası Davranış

**Mevcut:** Kullanıcının `user_profiles_v2.role` alanı güncellenir  
**Yeni:** `catalog_item_memberships` tablosuna `editor` kaydı eklenir, kullanıcı rolü değişmez

---

## Tablo İlişki Özeti (Yeni Mimari)

```
roles
  └── key: "Healthcare_Doctor"
        │
        ▼
catalog_items
  ├── id: uuid
  ├── platform_role_key: "Healthcare_Doctor"  ← YENİ AÇIK KOLON
  └── [kural motoru bu role'e göre çalışır]
        │
        ├── role_attribute_rules (miras)
        ├── role_feature_flags (miras)
        ├── role_profile_section_rules (miras)
        │
        ├── catalog_item_attribute_overrides (item bazlı override)
        ├── catalog_item_feature_overrides (item bazlı override)
        └── catalog_item_section_overrides (item bazlı override)

catalog_claim_requests
  ├── item_id → catalog_items
  ├── requested_by_user_id → profiles
  └── status: pending/approved/rejected
        │
        [onaylanırsa]
        ▼
catalog_item_memberships
  ├── item_id → catalog_items
  ├── user_id → profiles
  └── role: "editor"  ← SADECE BU (user'ın kendi rolü değişmez)
```

---

## Riskler

| Risk | Seviye | Önlem |
|------|--------|-------|
| Mevcut `attributes.platform_role_key` verilerinin migration'da kaybolması | YÜKSEK | Migration'da önce kopyala, sonra null olmayanları kontrol et |
| `catalog_upsert_source_item()` importer fonksiyonunun yeni şemaya uyumsuz kalması | YÜKSEK | Phase 5'te fonksiyon güncellenmeden script çalıştırılmamalı |
| Mevcut claim onay akışının (role transfer) eski kodda kalması | ORTA | Tüm `review_catalog_claim_request` çağrılarını `admin_approve_catalog_claim` ile değiştir |
| RLS politikalarının item-level kural motoruyla çakışması | ORTA | Yeni tablolara RLS eklenirken mevcut helper fonksiyonları (`catalog_user_can_edit_item`) kullanılmalı |
| `user_profiles_v2.role` alanının claim flow'da hâlâ güncelleniyor olması | DÜŞÜK | Arama: `setUserRoleAsAdmin` çağrılarını claim context'inde bulup kaldır |

---

## Etkilenen Dosyalar

```
supabase/migrations/
  └── 20260606010000_catalog_item_role_column.sql         (YENİ)
  └── 20260606020000_catalog_item_rule_engine.sql         (YENİ)
  └── 20260606030000_catalog_claim_editor_only.sql        (YENİ)
  └── 20260606040000_catalog_item_rule_engine_rpcs.sql    (YENİ)

scripts/
  └── catalog-role-importer.mjs                          (GÜNCELLE)

src/lib/
  └── admin-catalog.ts                                   (GÜNCELLE)
  └── catalog-types.ts                                   (YENİ)

src/pages/admin/
  └── AdminCatalogItemDetailPage.tsx                     (GÜNCELLE - yeni sekmeler)

src/components/admin/catalog/
  └── CatalogItemRolePanel.tsx                           (YENİ)
  └── CatalogItemEditorsPanel.tsx                        (YENİ)

src/pages/
  └── DirectoryCatalogItemPage.tsx                       (GÜNCELLE - claim metni)
```

---

## Tahmini Karmaşıklık

| Alan | Süre |
|------|------|
| DB Migration + RPC | 3–4 saat |
| TypeScript lib katmanı | 2–3 saat |
| Admin UI bileşenleri | 4–5 saat |
| Importer script güncellemesi | 1 saat |
| Test + doğrulama | 2–3 saat |
| **Toplam** | **12–16 saat** |

---

## Uygulama Sırası

1. **Phase 1** (migration + şema) — en önce, diğer her şey buna bağlı
2. **Phase 2** (RPC'ler) — Phase 1 tamamlandıktan sonra
3. **Phase 3** (TypeScript lib) — Phase 2 tamamlandıktan sonra
4. **Phase 5** (importer script) — Phase 3 ile paralel
5. **Phase 4** (Admin UI) — Phase 3 tamamlandıktan sonra
6. **Phase 6** (claim frontend) — Phase 4 ile paralel

---

**ONAY BEKLENİYOR:** Bu planla devam edilsin mi? Değiştirmek istediğiniz bir şey varsa belirtin.
