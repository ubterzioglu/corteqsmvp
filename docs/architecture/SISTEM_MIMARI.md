# CorteQS Platform — Sistem Mimarisi

> Roller, Katalog, Attribute, Feature, Section ve Auth kullanıcı yapısının özeti.

---

## 1. Genel Model: Her Şey Bir "Kayıt"

Platformdaki tüm varlıklar — ister gerçek bir kullanıcı, ister CSV'den içe aktarılmış bir doktor listesi olsun — `catalog_items` veya `profiles` tablosundan birinde bir **kayıt** olarak yaşar. Admin ekranında (`/admin/data`) her iki tablo `admin_list_unified_records` RPC aracılığıyla `kind: 'catalog_item' | 'profile'` ayrımıyla tek bir unified listede gösterilir. Bir katalog kaydı gerçek bir kullanıcıya bağlandığında (`person_profile_details.linked_profile_id`) iki kayıt aynı kişiyi temsil eder ama birleştirilmez — bağlantı takip edilir.

---

## 2. Rol Sistemi: 82 Rol, İki Katman

Platformda toplamda **82 aktif rol** tanımlıdır (`roles` tablosu). Bunlar iki farklı katmanda kullanılır:

**Auth kullanıcıları için (RolesGo sistemi):**
- `user_role_assignments` tablosu — hangi kullanıcı hangi role sahip
- Legacy: `user_profiles.profile_type` alanı (bireysel, danisman, isletme, kurulus-dernek, blogger-vlogger-youtuber, sehir-elcisi)
- İki sistem şu an paralel yürür; kanonikal yön henüz netleşmedi

**Katalog item'lar için:**
- `catalog_items.platform_role_key` kolonu — doğrudan `roles.key`'e referans verir
- Admin `/admin/data` → Rol & Kurallar tab'ından `admin_set_catalog_item_role` RPC ile atanır

Rol aileleri: User (5), Admin (3), Consultant (11), Organization (8), Business (26), Healthcare (7), Event (3), Job (4), Community (5), Marketplace (5) + orijinal 6 legacy rol.

---

## 3. Attribute Sistemi: Üç Katmanlı Form Alanı Modeli

Attribute, bir kullanıcı veya katlog kaydının form alanı davranışını tanımlar (ad, uzmanlık alanı, biyografi vb.).

```
attribute_catalog          → Tüm sistemdeki attribute sözlüğü (key, label, data_type, is_active)
        ↓
role_attribute_rules       → Hangi attribute hangi rolde aktif? (is_enabled, is_required,
                             is_public_default, user_can_edit, user_can_hide,
                             requires_admin_approval_on_change, sort_order)
        ↓
user_profile_attributes    → Auth kullanıcısının gerçek değeri (value_text, value_json,
                             visibility: public/private, approval_status)

catalog_item_attribute_overrides → Katalog item'ın rol kuralının üstüne yazan item-level
                                   istisna (is_enabled, display_order, override_label)
```

**Veri tipleri:** `text`, `textarea`, `json`, `multi_select` (value_json array), `boolean` (value_json)

**approval_status akışı (auth kullanıcısı):** `draft` → `pending` → `approved` | `rejected`

Katalog item'da `isOverride: true` rozeti, o satırın rolden miras değil item'a özel override olduğunu gösterir. "Varsayılana Dön" override kaydını siler, inherited kural geri devreye girer.

---

## 4. Feature Flag Sistemi: Üç Katmanlı Çözümleme

Feature, bir modülün veya yeteneğin açık/kapalı durumunu kontrol eder.

```
feature_catalog            → Tüm feature sözlüğü (key, label, is_active_globally)
        ↓
role_feature_flags         → Hangi feature hangi rolde açık? (is_enabled)
        ↓
user_feature_overrides     → Auth kullanıcısına özel istisna (override — her zaman kazanır)
catalog_item_feature_overrides → Katalog item'a özel istisna
```

**Çözümleme önceliği (yüksekten düşüğe):**
1. `override` — kullanıcı/item bazlı admin müdahalesi
2. `role_default` — rolün varsayılan kuralı
3. `fallback` — hiçbiri yoksa `false` (kapalı)

Runtime'da `get_current_user_features` RPC çağrılır; her feature için `{ isEnabled, source }` döner. `RequireFeature` bileşeni buna göre render eder.

**Feature kategorileri:** profile.*, directory.*, contact.*, content.*, events.create, offers.create, referral.create, cadde.access, city.manage, whatsapp_landing.edit_assigned, admin.requires_approval + legacy individual.* key'leri.

---

## 5. Profile Section Sistemi: Profil Bölümü Görünürlüğü

Section, profil kartında hangi bölümün görüneceğini ve sırasını yönetir.

```
profile_section_catalog         → Mevcut section'lar (key, label, section_area, sort_order, is_active)
        ↓
role_profile_section_rules      → Hangi section hangi rolde görünür? (is_enabled, sort_order)
        ↓
catalog_item_section_overrides  → Katalog item bazında görünürlük istisnası (is_visible, display_order)
```

**İki section alanı:**
- `selfSectionKeys` — kullanıcının kendi düzenleme ekranında gördükleri: summary, common_attributes, role_attributes, taxonomy, requests, dashboard
- `publicSectionKeys` — ziyaretçinin profil sayfasında gördükleri: hero, about, expertise/services/focus/platform/city, taxonomy, contact

---

## 6. Taxonomy Sistemi: Dinamik Kategori Seçimi

Taxonomy, kullanıcının profiline ekleyeceği çoktan seçmeli kategori/uzmanlık bilgisidir.

```
taxonomy_groups           → Kategori grupları (örn: "Uzmanlık Alanı", "Sektör")
taxonomy_options          → Grup içindeki seçenekler (örn: "Fintech", "Sağlık")
role_taxonomy_rules       → Hangi grup hangi rolde aktif? Seçim modu (single/multiple)
user_taxonomy_selections  → Kullanıcının seçtiği option'lar
```

Rol değişiminde mevcut seçimler korunur ama yeni rolün aktif grupları farklılaşabilir. `danisman` rolü `expertise_area` grubunu zorunlu görebilirken `bireysel` görmez.

---

## 7. Katalog Item Altyapısı: Unified Veri Modeli

Katalog, auth kullanıcısı olmadan sisteme giren tüm içerikleri (doktor listesi, işletme, etkinlik vb.) barındırır.

**8 item tipi:** `advisor`, `organization`, `business`, `event`, `marketplace_listing`, `job_posting`, `community_group`, `person_profile`

**Her item'a ek detay tablosu:** `advisor_details`, `business_details`, `event_details`, `job_posting_details`, `community_group_details`, `person_profile_details` vb.

**Yan tablolar:** `catalog_item_locations`, `catalog_item_contacts`, `catalog_item_media`, `catalog_item_links`, `catalog_item_categories`, `catalog_item_tags`, `catalog_item_services`, `source_records` (hangi CSV/API'den geldi), `catalog_audit_logs`

**platform_role_key:** Her item bir `roles` tablosu key'iyle eşleştirilir. Bu atama yapılınca o rolün attribute/feature/section kural seti item'a otomatik uygulanır.

---

## 8. Claim (Sahiplenme) Mekanizması

Sahipsiz bir katalog kaydını gerçek sahibi olan kullanıcı talep edebilir.

```
1. Kullanıcı /directory/catalog/:slug sayfasında "Sahiplen" butonuna basar
        ↓
2. submit_catalog_claim_request RPC → catalog_claim_requests tablosuna 'pending' kayıt
        ↓
3. Admin /admin/data → item'ı aç → Talepler tab'ı → bekleyen talebi görür
        ↓
4a. Onayla → admin_approve_catalog_claim RPC → catalog_item_memberships'e 'editor' yetkisi
4b. Reddet → admin_reject_catalog_claim RPC → kayıt değişmez
```

**Membership rolleri:** `owner`, `manager`, `editor`, `contributor`, `viewer`

Admin ayrıca `admin_grant_catalog_editor` ile manuel editör ekleyebilir, `admin_revoke_catalog_editor` ile kaldırabilir. Editörler `/admin/data` → Düzenleyiciler tab'ından yönetilir.

---

## 9. Auth Kullanıcısı Akışı

```
Kayıt (/lansman veya /login)
        ↓
Supabase Auth → profiles tablosuna kayıt (profile_type = 'bireysel' default)
        ↓
Admin → /admin/new-member/users-roles → kullanıcıyı bul → Details
        ↓
Rol ata → admin_set_user_role RPC → user_role_assignments güncellenir
        ↓
Kullanıcının sonraki oturumunda get_current_user_features() yeni role göre döner
        ↓
RequireFeature bileşeni feature durumuna göre UI'ı render eder
```

**Auth katmanı:**
- `AuthProvider` → Supabase session'ı çeker, React context'e yayar
- `RequireAuth` → session yoksa `/login`'e yönlendirir
- `RequireFeature` → feature kapalıysa fallback render eder
- `useFeatureFlags()` → runtime'da `get_current_user_features` RPC çağırır

**Dual sistem uyarısı:** `admin_users` (eski) + `user_profiles_v2` (yeni) eş zamanlı çalışmaya devam ediyor. Profil mantığına dokunmadan önce her ikisini kontrol et.

---

## 10. Admin Operasyon Yüzeyi ve Kritik Kurallar

| Ekran | Adres | Ne yapar |
|-------|-------|----------|
| Loginli Üyeler & Roller | /admin/new-member/users-roles | Auth kullanıcısına rol atar, attribute düzenler |
| Rol Yönetimi | /admin/new-member/role-management | Rol bazında attribute/feature/section kuralı tanımlar |
| Feature Override | /admin/new-member/overrides | Tek kullanıcıya özel feature istisnası |
| Katalog (Unified) | /admin/data | Tüm catalog_item + profile kayıtları; rol ata, override ekle, claim yönet |
| Roller Önizleme | /admin/new-member/roles-preview | Salt okunur rol listesi |
| AFS Önizleme | /admin/new-member/entity-preview | Salt okunur attribute/feature/section kataloğu |
| Onboarding Importları | /admin/new-member/onboarding-imports | CSV import ve mapping yönetimi |

**Kritik kurallar:**
- Override ilk çözüm değil son çaredir; önce rol seviyesinde çözülüp çözülmeyeceğine bak.
- Aynı sorun birden fazla kayıtta varsa Rol Yönetimi'nde genel kuralı düzelt — her item'a tek tek override ekleme.
- Katalog item'a rol atandıktan sonra o rolün `role_attribute_rules` / `role_feature_flags` / `role_profile_section_rules` tablolarında kural tanımlı olması gerekir; yoksa liste boş gelir.
- `catalog_items.platform_role_key` değiştirildiğinde item'daki mevcut override'lar korunur ama yeni rolle uyumsuz olabilir — rol değişimi sonrası override listesini gözden geçir.
- Supabase migration'ları asla silinmez veya yeniden sıralanmaz; sadece yeni dosya eklenir.
- SEO kilitli URL'ler: `/lansman`, `/cadde`, `/19051919`, `/anket` — path değiştirilemez.
