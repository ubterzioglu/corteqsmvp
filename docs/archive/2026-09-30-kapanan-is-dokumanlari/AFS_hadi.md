# AFS — Unified Entity Architecture Planı

> **AFS** = "All From Single" — tüm varlıkları (kullanıcı profilleri, katalog öğeleri) tek bir tablo ve tek bir attribute/feature sistemi üzerinden yönetme hedefi.

---

## 1. Mevcut Durumun Özeti

### Şu An Kaç "Entity Katmanı" Var?

Sistem şu anda 4 ayrı katmanda varlık tutuyor:

| Katman | Tablo | Ne İçin? |
|--------|-------|-----------|
| Auth kimliği | `auth.users` | Supabase auth kaydı |
| Platform profili | `public.profiles` | platform_role, avatar, directory_opt_in |
| Rol profili | `public.user_profiles` | profile_type (bireysel/danisman/…), feature/attribute motoru |
| Katalog varlıkları | `public.catalog_items` | Danışman, işletme, dernek, etkinlik, iş ilanı… |

### Attribute/Feature Sistemleri

| Tablo | Amaç |
|-------|------|
| `attribute_catalog` | Attribute tanımları (text, url, select…) |
| `role_attribute_rules` | Role göre hangi attribute aktif/zorunlu |
| `user_profile_attributes` | Kullanıcının attribute değerleri (EAV) |
| `feature_catalog` | Feature tanımları |
| `role_feature_flags` | Role göre feature on/off |
| `user_feature_overrides` | Kullanıcı bazında feature override |
| `item_type_features` | Katalog item tiplerine göre feature |
| `catalog_item_memberships` | Katalog item'a kimin hangi rolde erişimi var |

### Mevcut Katalog Item Tipleri
`catalog_item_types` tablosundan üretilen tipler; danışman, işletme, kuruluş-dernek, topluluk grubu, etkinlik, iş ilanı, marketplace listing, kişi profili + Konsolosluk/Türk misyonları (legacy).

### Kritik Gözlem
`20260606122000_catalog_admin_unified_records_rpc.sql` migration'ında `admin_list_unified_records` fonksiyonu zaten `catalog_item` ve `profile` kayıtlarını `UNION ALL` ile birleştiriyor. Yani sistem **zaten unified görünüm yolunda** — sadece depolama katmanı henüz birleştirilmemiş.

---

## 2. İstenen Hedef: AFS Mimarisi

### Temel Fikir
```
catalog_items  ←  tek evrensel entity tablosu
    │
    ├── item_type: 'person' | 'business' | 'advisor' | 'event' | ...
    │   (YENİ: 'member' tipi — yeni kayıt olan kullanıcılar buraya eklenir)
    │
    ├── attributes: catalog_item_attributes (EAV, şu anki user_profile_attributes yerine)
    │   role/type bazında kural: item_type_attribute_rules
    │
    ├── features: item_feature_overrides (şu anki user_feature_overrides yerine)
    │   varsayılanlar: item_type_feature_defaults
    │
    └── erişim/edit yetkisi: catalog_item_memberships
        role: 'owner' | 'manager' | 'editor' | 'viewer'
        (admin her item'ı edit edebilir; ek editor'lar membership ile verilir)
```

### Yeni Üye Akışı
```
auth.users INSERT
  → trigger: upsert_profile_from_auth_identity() (mevcut, korunur)
      → public.profiles (platform_role, avatar)
      → public.user_profiles (profile_type = 'bireysel')
      → YENİ: catalog_items INSERT (item_type = 'member', slug = user-{uuid})
              + catalog_item_memberships INSERT (role = 'owner')
```

---

## 3. Yapılabilirlik Analizi

### ✅ Güçlü Yönler — Neden Yapılabilir

1. **Altyapı zaten çok olgun**: `catalog_items` tablosu JSONB `attributes`, tip sistemi, membership, RLS, audit log — hepsi hazır.
2. **EAV katmanı mevcut**: `user_profile_attributes` mantığı `catalog_item_attributes` olarak taşınabilir; veri modeli aynı.
3. **Feature sistemi genelleştirilebilir**: `feature_catalog` + `role_feature_flags` → `item_type_feature_defaults` olarak yeniden adlandırılabilir; mantık değişmez.
4. **`catalog_item_memberships` zaten var**: Admin + ek editör senaryosu bu tablo üzerinden çözülür.
5. **Unified admin view zaten yazılmış**: `admin_list_unified_records` RPC'si birleşik listeyi döndürüyor.
6. **Migration stratejisi net**: Additive migrations — eski tablolar silinmez, bridge function'larla uyum sağlanır.

### ⚠️ Riskler

| Risk | Seviye | Açıklama |
|------|--------|----------|
| profiles / user_profiles çift-yazma trigger'ları | **YÜKSEK** | Şu an 4 ayrı trigger auth.users'ta. Yeni trigger eklenirse çakışma riski yüksek. |
| feature_catalog.scope_role = kullanıcı rolü varsayımı | **YÜKSEK** | Mevcut RPC'ler `profile_type` = feature scope eşleşmesini bekliyor. Catalog item'lar için bu eşleşme bozulur. |
| RLS policy patlaması | **ORTA** | Katalog item'lara membership-based RLS + admin bypass + edit yetkileri 3 ayrı policy katmanı gerektirir. |
| 60+ migration bağımlılığı | **ORTA** | `user_profiles.user_id → auth.users` FK, `profiles.id → auth.users` FK — bunlar korunmalı, catalog_items.id ek bir kimlik katmanı olacak. |
| `get_current_user_features()` RPC uyumsuzluğu | **ORTA** | Şu an `user_profiles.profile_type` → `roles` JOIN üzerinden çalışıyor. Catalog entity'leri için ayrı RPC gerekir. |
| Slug çakışması | **DÜŞÜK** | Üye slug'ları `member-{uuid}` prefix ile izole edilebilir. |
| legacy advisor_profiles / conslate tabloları | **DÜŞÜK** | Backfill migration zaten yazılmış (`catalog_backfill_from_legacy_tables`). |

### ❌ Yapılmayacaklar (Kapsam Dışı)

- `auth.users` tablosuna dokunmak → Supabase'e ait, değiştirilemez.
- `profiles` ve `user_profiles` tablolarını silmek → migration bağımlılıkları var, kaldırılmaz.
- Mevcut 60+ migration'ı değiştirmek → Üzerine yeni migration eklenir.

---

## 4. Mimari Karar: Hangi Pattern?

### Seçenek A: Tam EAV (Entity-Attribute-Value)
```sql
catalog_item_attributes(item_id, attribute_id, value_text, value_json, visibility)
```
**+** Esnek, sınırsız attribute  
**-** Performans sorunu, JOIN ağırlığı  
**→ Şu anki user_profile_attributes zaten bunu yapıyor — iyi seçenek**

### Seçenek B: JSONB tek sütun
```sql
catalog_items.attributes JSONB  (zaten var!)
```
**+** Sıfır JOIN, basit  
**-** Visibility, approval, audit yetersiz  
**→ Hızlı read için, yazma için yetersiz**

### Seçenek C: Hybrid (ÖNERİLEN) ✅
```sql
-- Core columns: catalog_items (title, slug, status, visibility, item_type)
-- Structured EAV: catalog_item_attributes (visibility, approval, audit destekli)
-- Fast read cache: catalog_items.attributes JSONB (denormalized snapshot)
-- Type-specific: advisor_details, business_details, person_profile_details...
```
**Bu pattern zaten uygulanmış durumda. AFS hedefi bunu kullanıcı profilleriyle birleştirmek.**

**Karar: Mevcut `catalog_items` + `catalog_item_attributes` (yeni tablo) + `catalog_item_memberships` (mevcut) pattern'i ile devam.**

---

## 5. Uygulama Planı — Fazlar

### Faz 0: Hazırlık (1-2 gün) — Risk: DÜŞÜK
**Amaç:** Yeni migration altyapısını kurmak, mevcut sistemi kırmamak.

- [ ] `catalog_item_attributes` tablosunu oluştur (user_profile_attributes'ın catalog versiyonu):
  ```sql
  catalog_item_attributes(
    id uuid pk,
    item_id uuid → catalog_items(id),
    attribute_id uuid → attribute_catalog(id),
    value_text text,
    value_json jsonb,
    visibility text ('public','private','admin_only'),
    approval_status text,
    approved_by uuid,
    created_at, updated_at
  )
  ```
- [ ] `item_type_attribute_rules` tablosunu oluştur (role_attribute_rules'ın catalog versiyonu):
  ```sql
  item_type_attribute_rules(
    id uuid pk,
    item_type text → catalog_item_types(key),
    attribute_id uuid → attribute_catalog(id),
    is_enabled, is_required, is_public_default,
    editor_can_edit, editor_can_hide,
    requires_admin_approval_on_change,
    sort_order
  )
  ```
- [ ] `item_type_feature_defaults` tablosunu oluştur (role_feature_flags'ın catalog versiyonu)
- [ ] `catalog_items` tablosuna `linked_user_id uuid → profiles(id)` kolonu ekle (kişi profilleri için link)

### Faz 1: Üye Tipi & Trigger (2-3 gün) — Risk: ORTA
**Amaç:** Yeni üye kaydında otomatik catalog item oluşturma.

- [ ] `catalog_item_types` tablosuna `'member'` tipi ekle (seed)
- [ ] `attribute_catalog` ve `item_type_attribute_rules`'a member tipi için attribute kuralları ekle (full_name, country, city, bio_short vb.)
- [ ] `item_type_feature_defaults`'a member tipi için feature varsayılanları ekle
- [ ] `upsert_profile_from_auth_identity()` fonksiyonunu genişlet:
  - Mevcut `profiles` + `user_profiles` yazımını koru
  - YENİ: `catalog_items` INSERT (item_type='member', linked_user_id=p_user_id)
  - YENİ: `catalog_item_memberships` INSERT (role='owner')
- [ ] Mevcut kullanıcılar için backfill migration yaz
- [ ] RLS: member item'lar için `linked_user_id = auth.uid()` self-select policy
- [ ] Admin RLS: `is_admin(auth.uid())` → tüm item'lara SELECT + UPDATE

### Faz 2: Feature Sistemi Birleştirme (2-3 gün) — Risk: ORTA
**Amaç:** Feature yönetimini catalog item'lara taşımak.

- [ ] `get_item_features(item_id uuid)` RPC yaz:
  - `item_type_feature_defaults` → `catalog_item_feature_overrides` → sonuç
  - Mevcut `get_current_user_features()` ile paralel çalışsın (kırmadan)
- [ ] `catalog_item_feature_overrides` tablosu (user_feature_overrides'ın catalog versiyonu)
- [ ] `admin_set_item_feature_override(item_id, feature_key, is_enabled)` RPC
- [ ] `admin_set_item_editor(item_id, user_id)` RPC (membership yönetimi)
- [ ] Frontend: `AdminCatalogPage.tsx`'e feature override paneli ekle

### Faz 3: Attribute Sistemi Birleştirme (3-4 gün) — Risk: ORTA
**Amaç:** Attribute yönetimini catalog item'lara taşımak.

- [ ] `update_catalog_item_attribute(item_id, attribute_key, value, visibility)` RPC
  - Editor kontrolü: `catalog_item_memberships` üzerinden yetki kontrolü
  - Admin bypass: `is_admin()` → her zaman geçer
  - Approval flow: `item_type_attribute_rules.requires_admin_approval_on_change`
- [ ] `get_catalog_item_profile(item_id)` RPC (get_current_user_profile'ın catalog versiyonu)
- [ ] `admin_set_item_attribute(item_id, attribute_key, value)` RPC (admin override)
- [ ] Frontend: Katalog item edit sayfasına attribute paneli

### Faz 4: Directory Birleştirme (2-3 gün) — Risk: DÜŞÜK
**Amaç:** Kullanıcı directory opt-in'ini catalog üzerinden yönetmek.

- [ ] `person_profile_details.linked_profile_id` ile `catalog_items.linked_user_id` köprüsü
- [ ] `directory.visible` feature'ını member item'lardan kontrol et
- [ ] `list_public_directory_profiles()` RPC'yi catalog_items'tan besle
  (mevcut user_profiles JOIN'i catalog JOIN'e taşı, geriye uyumlu bırak)
- [ ] Eski `profiles.directory_opt_in` → catalog feature override'a sync trigger

### Faz 5: Temizlik & Konsolidasyon (3-5 gün) — Risk: DÜŞÜK
**Amaç:** Eski katmanları deprecated işaretle, UI'ı tamamen catalog'a taşı.

- [ ] Frontend migration: `member-profile-api.ts` → `catalog-api.ts` kullanımına geç
- [ ] `AdminMembersPage.tsx` → `AdminCatalogPage.tsx` içine entegre et
- [ ] `AdminAttributesPage.tsx` → `item_type_attribute_rules` üzerinden çalışacak şekilde güncelle
- [ ] `get_current_user_profile()` RPC'yi catalog'dan besleyecek şekilde güncelle
  (user_profiles JOIN yerine catalog_items + catalog_item_attributes JOIN)
- [ ] Eski `user_profile_attributes`, `role_attribute_rules` tablolarını `deprecated_*` view'larıyla izole et
- [ ] E2E testler: member kaydı → catalog item oluşumu → feature toggle → attribute edit

---

## 6. Tablo Karşılaştırması: Önce / Sonra

| Eski | Yeni (AFS) | Durum |
|------|-----------|-------|
| `user_profile_attributes` | `catalog_item_attributes` | Yeni tablo, data taşınır |
| `role_attribute_rules` | `item_type_attribute_rules` | Yeni tablo, seed yeniden yazılır |
| `user_feature_overrides` | `catalog_item_feature_overrides` | Yeni tablo, data taşınır |
| `role_feature_flags` | `item_type_feature_defaults` | Yeni tablo |
| `catalog_item_memberships` | Aynen korunur | edit yetki yönetimi için |
| `profiles` | Aynen korunur | platform_role, auth bridge |
| `user_profiles` | Aynen korunur (deprecated yol) | feature engine fallback |
| `catalog_items` | **Ana entity tablosu** | Genişletilir |

---

## 7. Permission Modeli

```
catalog_items için kim ne yapabilir?

SELECT:
  - Public items: anon
  - Private items: linked_user_id = auth.uid() OR membership OR is_admin()

UPDATE:
  - Admin: her zaman
  - Owner/Manager/Editor membership: kendi item'ı
  - Self (member tipi): linked_user_id = auth.uid()

DELETE:
  - Sadece admin
```

### RLS Policy Şablonu
```sql
-- Admin her şeyi görebilir ve güncelleyebilir
create policy "catalog_admin_all" on catalog_items
  for all using (public.is_admin(auth.uid()));

-- Member kendi profilini görebilir
create policy "catalog_self_select" on catalog_items
  for select using (linked_user_id = auth.uid());

-- Editor membership olanlar güncelleyebilir
create policy "catalog_editor_update" on catalog_items
  for update using (
    exists (
      select 1 from catalog_item_memberships
      where item_id = catalog_items.id
        and user_id = auth.uid()
        and role in ('owner','manager','editor')
        and status = 'active'
    )
  );
```

---

## 8. Frontend Etki Analizi

| Sayfa | Etki |
|-------|------|
| `AdminCatalogPage.tsx` | Ana yönetim noktası olacak; member + katalog birleşik |
| `AdminMembersPage.tsx` | Zamanla AdminCatalogPage'e entegre edilir |
| `AdminAttributesPage.tsx` | `item_type_attribute_rules`'a bağlanır |
| `AdminRolesFeaturesPage.tsx` | `item_type_feature_defaults`'a bağlanır |
| `AdminEntityPreviewPage.tsx` | Zaten catalog_items üzerinden — korunur |
| `member-profile-api.ts` | `catalog-api.ts` içine alınır |
| `profile-onboarding-api.ts` | Catalog item create akışına taşınır |

---

## 9. Zaman ve Risk Özeti

| Faz | Süre | Risk | Öncelik |
|-----|------|------|---------|
| Faz 0: Tablo altyapısı | 1-2 gün | Düşük | İlk başla |
| Faz 1: Üye trigger | 2-3 gün | Orta | Kritik yol |
| Faz 2: Feature sistemi | 2-3 gün | Orta | Yüksek |
| Faz 3: Attribute sistemi | 3-4 gün | Orta | Yüksek |
| Faz 4: Directory | 2-3 gün | Düşük | Orta |
| Faz 5: Temizlik | 3-5 gün | Düşük | Son aşama |
| **Toplam** | **13-20 gün** | | |

---

## 10. Onay Bekleyen Kararlar

Plana başlamadan netleştirilmesi gereken 3 karar:

1. **`user_profiles` tablosu ne zaman deprecated olur?**  
   Tüm feature/attribute motoru catalog'a taşındıktan sonra mı, yoksa asla silinmeyecek mi?

2. **Member item slug formatı ne olsun?**  
   `member-{uuid-kısa}` mı, `@username` tarzı mı, yoksa tamamen gizli mi?

3. **Catalog item edit yetkisi yalnızca admin + membership mı, yoksa kullanıcılar kendi member profillerini doğrudan edit edebilecek mi?**  
   (Şu an: `update_profile_attribute` RPC self-edit destekliyor — bu davranış korunmalı mı?)

---

> **Sonraki adım:** Bu planı onaylarsan Faz 0 migration SQL'ini yazabilirim.  
> Önce kararları (Bölüm 10) netleştirelim.
