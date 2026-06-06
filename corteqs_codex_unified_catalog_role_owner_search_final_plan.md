# CorteQS — Tek Kaynaklı Profil Kataloğu, Rol Atama, Sahiplik ve AFS Yönetimi

## Codex İçin Nihai Uygulama Planı

**Durum:** Nihai plan  
**Amaç:** CorteQS içerisinde bireysel kullanıcı, doktor, avukat, danışman, işletme, bakkal, dernek, konsolosluk ve ileride eklenecek diğer tüm profil türlerini tek bir katalog modeli altında yönetmek; tek kaynaktan aratmak; login olmuş son kullanıcıya aynı directory üzerinden göstermek; admin tarafında tek rol atama ekranı ve tüm roller için tek Attribute / Feature / Profile Section yönetim ekranı oluşturmak.

---

# 0. Görselden Gelen Kesin Gereksinimler

Bu çalışma aşağıdaki gereksinimleri eksiksiz karşılamalıdır:

1. **Tüm profiller tek kaynaktan aranabilmelidir.**
   - Bireysel kullanıcı profili,
   - doktor,
   - avukat,
   - danışman,
   - bakkal,
   - restoran,
   - işletme,
   - kuruluş,
   - dernek,
   - konsolosluk,
   - sağlık kuruluşu,
   - dijital topluluk ve ileride eklenecek diğer profil türleri aynı katalog kaynağında bulunmalıdır.

2. **Login olmuş son kullanıcı tüm yayınlanmış profil rollerini görebilmelidir.**
   - Directory tek arama ekranı olmalıdır.
   - Son kullanıcı doktor, avukat, bireysel üye veya işletme gibi farklı kayıt türlerini aynı aramada görebilmelidir.
   - Rol, lokasyon, kategori ve metin bazlı filtreler aynı directory üzerinde çalışmalıdır.

3. **Admin için tek rol atama ekranı olmalıdır.**
   - Admin farklı ekranlarda kullanıcı, işletme veya kuruluş aramak zorunda kalmamalıdır.
   - Her profil kayıt satırında atanmış rol görülmeli ve değiştirilebilmelidir.
   - Rol değişikliği profil görünümünü, aktif alanları ve izinleri dinamik biçimde etkilemelidir.

4. **Tüm roller tek bir merkezi tabloda yönetilmelidir.**
   - Örnek roller: `User_Bireysel`, `Healthcare_Doktor`, `Consultant_Avukat`, `Business_Market_Bakkal`.
   - Roller tek `roles` tablosunda tutulmalıdır.
   - Admin rol tanımlarını ayrı modüllerde dağınık biçimde yönetmemelidir.

5. **Her profil için sahipler ve editörler yönetilebilmelidir.**
   - Admin tüm profilleri düzenleyebilmelidir.
   - Login olmuş kullanıcı kendi bireysel profilini düzenleyebilmelidir.
   - Bakkal sahibi örneğinde aynı kullanıcı hem bireysel profilini hem de bakkal profilini düzenleyebilmelidir.
   - Bir profil birden fazla sahip veya editör tarafından yönetilebilmelidir.

6. **Tüm roller için tek Attribute / Feature / Profile Section atama ekranı olmalıdır.**
   - Attribute, Feature ve Profile Section üç farklı teknik kavram olarak korunmalıdır.
   - Ancak admin bunları tüm roller için tek bir birleşik rol matrisi ekranından ayarlayabilmelidir.

---

# 1. Önce Mevcut Repository Durumunu Analiz Et

Kod yazmaya başlamadan önce mevcut sistemi çıkar. Yeni paralel bir yapı üretme. Repository içerisinde katalog ve birleşik directory geçişi başlamış durumda; bunu tamamla.

## 1.1 Frontend dosyaları

Aşağıdaki dosyaları oku:

```txt
src/pages/DirectoryPage.tsx
src/pages/DirectoryCatalogItemPage.tsx
src/pages/DirectoryProfilePage.tsx
src/lib/catalog-directory.ts
src/lib/catalog-entity-api.ts
src/lib/member-catalog.ts
src/lib/profile-view-model.ts
src/pages/admin/AdminLoginUsersRolesPage.tsx
src/pages/admin/AdminRoleManagementPage.tsx
src/components/admin/role-management/UnifiedRulesTable.tsx
src/pages/admin/AdminRolesFeaturesPage.tsx
src/pages/admin/AdminAttributesPage.tsx
src/pages/admin/AdminProfileSectionsPage.tsx
src/pages/admin/AdminTaxonomyPage.tsx
src/pages/admin/AdminUserOverridesPage.tsx
src/pages/admin/AdminRolesPreviewPage.tsx
src/pages/admin/AdminEntityPreviewPage.tsx
src/lib/admin.ts
src/lib/role-catalog.ts
src/hooks/useFeatureFlags.ts
src/App.tsx
src/components/admin/AdminLayout.tsx
src/components/admin/admin-navigation.ts
```

## 1.2 Veritabanı tabloları

Aşağıdaki tabloları ve migration dosyalarını bul:

```txt
catalog_items
catalog_item_editors veya katalog öğesi erişimini tutan mevcut tablo
catalog_item_contacts
catalog_item_locations
catalog_item_services
catalog_item_languages
catalog_item_categories
catalog_categories
catalog_claim_requests veya claim akışını tutan mevcut tablo

roles
user_profiles
user_role_assignments
feature_catalog
role_feature_flags
role_feature_defaults
user_feature_overrides
attribute_catalog
role_attribute_rules
profile_section_catalog
role_profile_section_rules
taxonomy_groups
taxonomy_options
role_taxonomy_rules
approval_requests
admin_audit_logs
entity_metadata
```

Katalog öğesi attributelarını ve taxonomy seçimlerini tutan normalize tablolar varsa onları da bul. JSONB cache veya compatibility alanları varsa kaynak ve cache ayrımını çıkar.

## 1.3 RPC fonksiyonları

Aşağıdaki RPC fonksiyonlarını incele:

```txt
search_catalog
list_public_directory_profiles
admin_list_member_catalog_profiles
admin_set_member_catalog_role
get_current_member_catalog_profile
get_catalog_item_profile
update_catalog_item_attribute
admin_set_catalog_item_attribute
admin_set_catalog_item_feature_override
admin_set_catalog_item_editor
submit_catalog_claim_request
get_current_user_features
get_public_profile_sections
get_role_management_bundle
admin_set_user_role
admin_set_role_feature_flag
admin_set_attribute_rule
admin_upsert_role_profile_section_rule
admin_upsert_role_taxonomy_rule
```

## 1.4 Mevcut geçiş sorununu açıkça tespit et

Mevcut frontend directory akışında iki ayrı kaynak birleştiriliyor olabilir:

```txt
legacy user profile kayıtları
+
catalog_items kayıtları
```

Bu geçici yaklaşım nihai çözüm değildir. Frontend tarafında iki listeyi birleştirmek yerine tüm aranabilir profilleri `catalog_items` kaynağına taşı.

### Nihai karar

```txt
Tüm aranabilir ve gösterilebilir profil kayıtlarının canonical kaynağı = public.catalog_items
```

`user_profiles`, `user_role_assignments` ve eski profil tabloları geçiş sürecinde compatibility amacıyla tutulabilir; ancak directory ve profil yönetimi için yeni kaynak olarak kullanılmamalıdır.

---

# 2. Domain Modelini Doğru Ayır

Bu projede üç farklı kavram birbirine karıştırılmamalıdır:

## 2.1 Auth kullanıcı hesabı

Supabase `auth.users` kaydıdır.

Bu kayıt şunu temsil eder:

```txt
Sisteme login olan gerçek kişi veya hesap
```

Auth kullanıcısı doğrudan doktor, avukat veya bakkal değildir. Bir veya daha fazla profili yönetebilen hesaptır.

## 2.2 Profil / katalog öğesi

`public.catalog_items` kaydıdır.

Bu kayıt şunu temsil eder:

```txt
Directory içinde aranabilen ve görüntülenebilen profil
```

Örnekler:

```txt
Umut Barış Terzioğlu bireysel profili
Dr. X doktor profili
Y Avukatlık Bürosu profili
Z Mahallesi Bakkalı profili
Bir restoran profili
Bir dernek profili
Bir konsolosluk profili
Bir dijital topluluk profili
```

## 2.3 Rol şablonu

`public.roles` kaydıdır.

Bu kayıt şunu temsil eder:

```txt
Profilin hangi alanlara, yetkilere ve görünüm bölümlerine sahip olacağını belirleyen şablon
```

Örnek:

```txt
User_Bireysel
Healthcare_Doktor
Consultant_Avukat
Business_Market_Bakkal
Organization_Dernek_Vakif
```

## 2.4 Sahiplik ve editörlük ilişkisi

Auth kullanıcı ile katalog öğesi arasında many-to-many ilişki olmalıdır.

Örnek:

```txt
Auth user: Ahmet Yılmaz
  -> owner: Ahmet Yılmaz bireysel profili
  -> owner: Yılmaz Bakkal profili
  -> editor: Dortmund Türk Esnafları Derneği profili
```

Bu nedenle `catalog_items.linked_user_id` tek başına yeterli değildir. Bu alan compatibility veya primary owner referansı olarak korunabilir; fakat yetki kontrolünün tek kaynağı yapılmamalıdır.

---

# 3. Nihai Mimari Karar

## 3.1 Tek SQL tablosuna flatten etme

Kullanıcı, rol, sahip, attribute, feature ve section kayıtlarını tek fiziksel SQL tablosuna doldurma.

Bunun yerine:

```txt
catalog_items                     -> tüm aranabilir profil kayıtları
roles                             -> tüm profil rol şablonları
catalog_item_user_access          -> hangi login hesabı hangi profili düzenleyebilir
attribute_catalog                 -> tanımlı veri alanları
role_attribute_rules              -> role göre attribute davranışı
feature_catalog                   -> tanımlı izinler ve yetenekler
role_feature_flags                -> role göre feature davranışı
profile_section_catalog           -> tanımlı görünüm parçaları
role_profile_section_rules        -> role göre görünüm davranışı
taxonomy_groups / taxonomy_options -> sınıflandırma seçenekleri
role_taxonomy_rules               -> role göre taxonomy davranışı
```

## 3.2 Admin tarafında iki birleşik ekran oluştur

### Ekran A — Profil ve Rol Atama Merkezi

```txt
/admin/new-member/profile-role-assignment
```

Bu ekranda tüm katalog profilleri tek tabloda listelensin. Her satır bir profil kaydıdır.

### Ekran B — Tüm Roller AFS Matrisi

```txt
/admin/new-member/role-matrix
```

Bu ekranda tüm roller sütunlarda; Attribute, Feature ve Profile Section kayıtları satırlarda gösterilsin.

## 3.3 Son kullanıcı tarafında tek directory oluştur

```txt
/directory
```

Bu sayfa yalnızca login olmuş kullanıcılara tam directory sonuçlarını göstermelidir.

Tüm sonuçlar tek canonical kaynaktan gelmelidir:

```txt
catalog_items
```

Frontend içerisinde legacy profile listesi ile catalog item listesini birleştirme.

---

# 4. Katalog Modeli: Tüm Profiller Tek Kaynakta

## 4.1 `catalog_items` canonical kaynak olsun

Mevcut tabloyu incele ve eksik kolonları kontrollü migration ile ekle.

Önerilen minimum alanlar:

```sql
id uuid primary key default gen_random_uuid(),
item_type text not null,
platform_role_key text not null references public.roles(key) on delete restrict,
slug text not null unique,
title text not null,
headline text,
short_description text,
long_description text,
status text not null default 'draft',
visibility text not null default 'authenticated',
verification_status text not null default 'unverified',
primary_owner_user_id uuid,
attributes jsonb not null default '{}'::jsonb,
search_document tsvector,
metadata jsonb not null default '{}'::jsonb,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

### Önemli not

Mevcut kolon isimleri farklıysa gereksiz rename yapma. Existing schema ile uyumlu ilerle. Eksik davranışı migration ile tamamla.

## 4.2 Profil türleri aynı tabloda yaşasın

Örnek satırlar:

| title | item_type | platform_role_key |
|---|---|---|
| Umut Barış Terzioğlu | `individual_profile` | `User_Bireysel` |
| Dr. Ayşe Örnek | `advisor` | `Healthcare_Doktor` |
| Mehmet Kaya Avukatlık | `advisor` | `Consultant_Avukat` |
| Yılmaz Bakkal | `business` | `Business_Market_Bakkal` |
| Dortmund Türk Derneği | `organization` | `Organization_Dernek_Vakif` |

## 4.3 Personal profile kaydı zorunlu olsun

Her login hesabının en az bir bireysel profil katalog öğesi bulunmalıdır.

Yeni kullanıcı ilk kez login olduğunda veya onboarding tamamlandığında:

```txt
ensure_personal_catalog_item_for_current_user()
```

akışı çalışsın.

Oluşacak kayıt:

```txt
item_type = individual_profile
platform_role_key = User_Bireysel
owner = login olan auth user
visibility = authenticated veya kullanıcının seçimine göre public
```

## 4.4 Eski kullanıcı profillerini backfill et

Migration veya idempotent script:

1. `user_profiles` içindeki her login kullanıcı için kişisel `catalog_items` kaydı var mı kontrol et.
2. Yoksa `individual_profile` kaydı oluştur.
3. Mevcut isim, şehir, ülke, profil görseli ve uygun alanları aktar.
4. Auth kullanıcıya `owner` erişimi ver.
5. Legacy route için eşleme oluştur.
6. Aynı kullanıcı için birden fazla personal profile oluşturma.

Unique garanti:

```sql
unique index on catalog_items(primary_owner_user_id)
where item_type = 'individual_profile';
```

Eğer mevcut şema farklı ownership modeli kullanıyorsa aynı garanti access tablosu üzerinden kurulabilir.

---

# 5. Sahipler ve Editörler

## 5.1 Yetki ilişkisi many-to-many olmalı

Mevcut editor tablosunu bul. Varsa onu genişlet; yoksa aşağıdaki tabloyu oluştur:

```sql
create table if not exists public.catalog_item_user_access (
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  access_level text not null check (access_level in ('owner', 'manager', 'editor', 'viewer')),
  is_primary_owner boolean not null default false,
  status text not null default 'active',
  granted_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (item_id, user_id)
);
```

### Mevcut tablo varsa

Yeni bir duplicate tablo oluşturma. Existing tabloya eksik kolonları ekle ve aynı semantiği sağla.

## 5.2 Erişim seviyeleri

| access_level | Profil verisini görüntüle | Profil verisini düzenle | Editor ekle / kaldır | Rol değiştir | Profili arşivle |
|---|---:|---:|---:|---:|---:|
| `owner` | Evet | Evet | Evet veya admin onaylı | Hayır | Hayır |
| `manager` | Evet | Evet | İsteğe bağlı | Hayır | Hayır |
| `editor` | Evet | Evet | Hayır | Hayır | Hayır |
| `viewer` | Evet | Hayır | Hayır | Hayır | Hayır |
| `admin` | Evet | Evet | Evet | Evet | Evet |

`admin` satırı access tablosunda saklanmamalıdır. Admin yetkisi mevcut `public.is_admin(auth.uid())` kontrolü ile global bypass olarak uygulanmalıdır.

## 5.3 Yetki helper fonksiyonları

Aşağıdaki helper RPC veya SQL fonksiyonlarını oluştur:

```sql
public.can_view_catalog_item(p_item_id uuid, p_user_id uuid default auth.uid()) returns boolean
public.can_edit_catalog_item(p_item_id uuid, p_user_id uuid default auth.uid()) returns boolean
public.can_manage_catalog_item_editors(p_item_id uuid, p_user_id uuid default auth.uid()) returns boolean
public.can_administer_catalog_item(p_item_id uuid, p_user_id uuid default auth.uid()) returns boolean
```

Kurallar:

```txt
Admin -> her zaman düzenleyebilir
Owner -> kendi bağlı profillerini düzenleyebilir
Manager / editor -> yetkisi olan profilleri düzenleyebilir
Viewer -> yalnızca yetkili önizleme görebilir
Normal login user -> yalnızca kendi bireysel profilini düzenleyebilir
```

## 5.4 Bakkal sahibi kabul senaryosu

Aşağıdaki senaryo mutlaka çalışmalıdır:

```txt
Auth user: ali@example.com

Editable profiles:
1. Ali Veli — User_Bireysel
2. Ali Veli Bakkal — Business_Market_Bakkal
```

Ali login olduğunda profil yönetim alanında iki profili de görmeli ve ayrı ayrı düzenleyebilmelidir.

## 5.5 Sahip / editör RPC fonksiyonları

Mevcut `admin_set_catalog_item_editor` fonksiyonunu compatibility amacıyla koru. Nihai API aşağıdakileri içersin:

```sql
admin_list_catalog_item_access(p_item_id uuid)
admin_grant_catalog_item_access(p_item_id uuid, p_user_id uuid, p_access_level text, p_is_primary_owner boolean default false)
admin_update_catalog_item_access(p_item_id uuid, p_user_id uuid, p_access_level text)
admin_revoke_catalog_item_access(p_item_id uuid, p_user_id uuid)
get_my_editable_catalog_items()
```

Owner kullanıcı için kontrollü self-service editor ekleme gerekiyorsa ikinci fazda eklenebilir. İlk fazda admin yönetimi yeterlidir.

## 5.6 Claim akışını ownership ile bağla

Mevcut `submit_catalog_claim_request` akışını koru.

Admin claim talebini onayladığında:

1. İlgili auth kullanıcı için access kaydı oluştur.
2. Varsayılan access level `owner` veya iş kuralına göre `editor` olsun.
3. `verification_status` güncellensin.
4. Audit log yazılsın.
5. Aynı profile duplicate aktif claim oluşturulmasın.

---

# 6. Roller: Tek Tablo, Tek Şablon Sistemi

## 6.1 `roles` canonical rol tablosu olsun

Tüm profil rolleri tek `public.roles` tablosunda tutulmalıdır.

Eksik kolonları ekle:

```sql
alter table public.roles
  add column if not exists family_key text,
  add column if not exists parent_role_id uuid references public.roles(id) on delete restrict,
  add column if not exists is_assignable boolean not null default true,
  add column if not exists is_directory_visible boolean not null default true,
  add column if not exists default_item_type text,
  add column if not exists is_system boolean not null default false,
  add column if not exists metadata jsonb not null default '{}'::jsonb;
```

## 6.2 Rol örnekleri

```txt
User_Bireysel
Consultant
Consultant_Avukat
Consultant_Egitim
Consultant_Gayrimenkul
Consultant_Vize_Gocmenlik
Healthcare
Healthcare_Doktor
Healthcare_Dis_Hekimi
Healthcare_Psikolog
Business
Business_Market_Bakkal
Business_Restoran_Cafe
Business_Kuafor_Guzellik
Organization
Organization_Dernek_Vakif
Organization_Konsolosluk
Organization_Egitim_Kurulusu
Community_Whatsapp
Community_Telegram
```

## 6.3 Backend key standardı

Role key değerleri stabil olmalıdır:

```txt
ASCII uyumlu
İngilizce veya teknik olarak anlaşılır prefix
Alt türler underscore ile ayrılır
Label değişebilir ama key değişmez
```

Regex:

```txt
^[A-Za-z][A-Za-z0-9_]*$
```

## 6.4 Parent-child inheritance

Örnek:

```txt
Consultant
├── Consultant_Avukat
├── Consultant_Egitim
└── Consultant_Gayrimenkul
```

Parent rol şablon olarak kullanılabilir ve `is_assignable = false` olabilir.

Child role yalnızca farklı olan rule satırlarını explicit olarak tutmalıdır. Kayıt yoksa parent rolden miras alınmalıdır.

Inheritance şu tablolarda uygulanmalıdır:

```txt
role_feature_flags
role_attribute_rules
role_profile_section_rules
role_taxonomy_rules
```

Basit MVP için tek seviye parent-child yeterlidir. Daha derin hiyerarşi kullanılacaksa cycle koruması ekle.

## 6.5 Rol ve item type eşleşmesini hardcode etme

Frontend içinde prefix kontrolü ile aşağıdaki tarz map üretme:

```txt
Consultant_* -> advisor
Business_* -> business
Organization_* -> organization
```

Bunun yerine DB tabanlı eşleşme kullan.

Basit çözüm:

```txt
roles.default_item_type
```

Daha esnek çözüm gerekiyorsa:

```sql
role_allowed_item_types (
  role_id uuid references roles(id),
  item_type text,
  primary key (role_id, item_type)
)
```

Directory filtreleri ve role assignment validation bu metadata üzerinden çalışmalıdır.

## 6.6 Admin rolünü profil rolü yapma

Admin authorization ayrı kalmalıdır:

```txt
public.is_admin(auth.uid())
```

`Admin` normal directory profili veya kullanıcı rolü olarak atanmayacaktır.

---

# 7. Attribute, Feature ve Profile Section Ayrımı

## 7.1 Attribute

Kullanıcıdan veya editörden veri alınan alandır.

Örnek:

```txt
full_name
bio_short
country
city
profile_photo_url
business_whatsapp
license_number
specialty_summary
opening_hours
```

Role göre şu davranışlar ayarlanır:

```txt
aktif mi
zorunlu mu
public varsayılan mı
owner / editor düzenleyebilir mi
owner gizleyebilir mi
admin onayı gerekir mi
sıra
```

## 7.2 Feature

Bir capability veya erişim iznidir.

Örnek:

```txt
directory.visible
contact.receive
contact.show_whatsapp
content.create
events.create
offers.create
profile.website_card
profile.linkedin_card
```

## 7.3 Profile Section

Public veya authenticated profil görünümündeki UI parçasıdır.

Örnek:

```txt
preview.isim_kurulus_adi
preview.konum
preview.profil_logo_gorseli
preview.kategori_sektor_etiketi
detail.hakkinda_bio
detail.iletisim
detail.hizmetler
detail.sosyal_medya
```

## 7.4 Taxonomy

Kategori, uzmanlık ve alt tip seçimidir. Feature değildir.

Örnek:

```txt
consultant_subcategory
business_subtype
organization_type
healthcare_specialty
community_platform
```

---

# 8. Tek Rol Atama Ekranı

## 8.1 Yeni route

```txt
/admin/new-member/profile-role-assignment
```

Yeni sayfa:

```txt
src/pages/admin/AdminProfileRoleAssignmentPage.tsx
```

Sayfa başlığı:

```txt
Profil ve Rol Atama Merkezi
```

## 8.2 Tek ana tablo

Her satır `catalog_items` kaydıdır. Auth user satırı değildir.

Kolonlar:

```txt
Profil adı
Profil tipi
Mevcut rol
Rol ailesi
Sahipler
Editör sayısı
Şehir / ülke
Durum
Görünürlük
Doğrulama durumu
Effective A/F/S özeti
Eksik zorunlu alan sayısı
Warning badge
Güncelleme tarihi
Aksiyonlar
```

Örnek satırlar:

| Profil | Tip | Rol | Sahip |
|---|---|---|---|
| Umut Barış Terzioğlu | Bireysel | `User_Bireysel` | Umut Barış |
| Dr. Ayşe Örnek | Danışman | `Healthcare_Doktor` | Ayşe Örnek |
| Yılmaz Bakkal | İşletme | `Business_Market_Bakkal` | Ali Yılmaz |
| Mehmet Kaya Hukuk | Danışman | `Consultant_Avukat` | Mehmet Kaya |

## 8.3 Filtreler

```txt
Arama
Profil tipi
Rol ailesi
Rol
Şehir
Ülke
Sahibi var / yok
Claim bekliyor
Doğrulama durumu
Durum
Görünürlük
Eksik alanı olanlar
Sıralama
```

## 8.4 Satır aksiyonları

```txt
Rol değiştir
Sahipleri / editörleri yönet
Profil verisini düzenle
Public / authenticated önizleme
Audit geçmişi
Arşivle
```

## 8.5 Rol değişim confirmation dialog

Rol dropdown değiştiğinde doğrudan kayıt yapma.

Dialog içinde göster:

```txt
Profil adı
Eski rol
Yeni rol
Yeni role göre aktif attribute sayısı
Yeni role göre aktif feature sayısı
Yeni role göre aktif section sayısı
Eksik zorunlu alanlar
Etkisiz hale gelecek taxonomy seçimleri
Etkisiz hale gelecek profile override kayıtları
Verilerin silinmeyeceği bilgisi
Değişiklik sebebi
```

Admin onaylayınca atomic RPC çağır.

## 8.6 Tek profil — tek rol kuralı

Her `catalog_items` kaydı için tek aktif profil rolü olmalıdır.

Canonical alan:

```txt
catalog_items.platform_role_key
```

Mevcut schema role id tutuyorsa onu canonical kullan; ancak tek kaynak seç.

Kullanıcı bazlı legacy alanlar gerekiyorsa trigger veya compatibility RPC ile senkronize edilebilir:

```txt
user_profiles.profile_type
user_role_assignments
```

Ancak yeni admin ekranı yalnızca katalog öğesi canonical kaynağını güncellemelidir.

---

# 9. Atomic Profil Rolü Değiştirme RPC

Yeni RPC veya genişletilmiş mevcut RPC:

```sql
public.admin_change_catalog_item_role(
  p_item_id uuid,
  p_role_key text,
  p_reason text default null,
  p_dry_run boolean default false
)
returns jsonb
```

## 9.1 İşlem adımları

Tek transaction içinde:

1. Admin kontrolü yap.
2. Katalog öğesini bul.
3. Yeni rolü bul.
4. Rol aktif mi doğrula.
5. Rol atanabilir mi doğrula.
6. Rol ilgili `item_type` için kullanılabilir mi doğrula.
7. Eski rolü oku.
8. Yeni effective A/F/S snapshot hesapla.
9. Eksik zorunlu attribute listesini oluştur.
10. Geçersiz veya etkisiz taxonomy seçimlerini oluştur.
11. Etkisiz profile override kayıtlarını oluştur.
12. `p_dry_run = true` ise güncelleme yapmadan preview response dön.
13. `p_dry_run = false` ise canonical role alanını güncelle.
14. Personal profile ise legacy `user_profiles` ve `user_role_assignments` compatibility sync uygula.
15. Eski attribute değerlerini silme.
16. Eski taxonomy seçimlerini silme.
17. Profile bazlı override kayıtlarını silme.
18. Audit log yaz.
19. Yeni snapshot ve warning listesini dön.

## 9.2 Role değişiminde veri silme

Örnek:

```txt
Business_Market_Bakkal -> Business_Restoran_Cafe
```

Bakkal profiline ait eski alanlar DB içinde kalır. Restoran rolünde görünmüyorsa UI üzerinden gösterilmez. Daha sonra rol geri alınırsa eski değerler yeniden kullanılabilir.

## 9.3 Personal profile sync

`User_Bireysel` gibi auth user kişisel profilleri için compatibility gerekiyorsa:

```txt
catalog_items.platform_role_key
-> user_role_assignments
-> user_profiles.profile_type
```

tek yönlü veya kontrollü çift yönlü sync uygula. Sonsuz trigger döngüsü oluşmamalıdır.

---

# 10. Tüm Roller İçin Tek AFS Atama Ekranı

## 10.1 Yeni route

```txt
/admin/new-member/role-matrix
```

Yeni sayfa:

```txt
src/pages/admin/AdminAllRolesMatrixPage.tsx
```

Mevcut `AdminRoleManagementPage` ve `UnifiedRulesTable` bileşenlerini refactor ederek tekrar kullan.

## 10.2 Tablo yapısı

Satırlar:

```txt
attribute_catalog kayıtları
feature_catalog kayıtları
profile_section_catalog kayıtları
```

Sütunlar:

```txt
Tür
Label
Key
Açıklama
sonra her aktif rol için bir sütun
```

Örnek:

| Tür | Kayıt | User_Bireysel | Healthcare_Doktor | Consultant_Avukat | Business_Market_Bakkal |
|---|---|---|---|---|---|
| A | `bio_short` | Aktif | Aktif | Aktif | Aktif |
| A | `license_number` | Kapalı | Zorunlu | Zorunlu | Kapalı |
| F | `directory.visible` | Açık | Açık | Açık | Açık |
| S | `detail.hizmetler` | Kapalı | Açık | Açık | Açık |

## 10.3 Attribute hücresi

Popover içerisinde:

```txt
A = aktif
Z = zorunlu
P = public varsayılan
D = owner / editor düzenleyebilir
G = owner gizleyebilir
O = admin onayı gerekir
S = sıra
```

## 10.4 Feature hücresi

Popover içerisinde:

```txt
Global açık / kapalı
Role açık / kapalı
Source
Reset to parent
```

## 10.5 Section hücresi

Popover içerisinde:

```txt
Aktif
Onay gerekir
Sıra
Source
Reset to parent
```

## 10.6 Parent inheritance badge

Child rolün kendi explicit kaydı yoksa göster:

```txt
Miras: Consultant
```

Admin hücrede değişiklik yaptığında explicit child override kaydı oluştur.

Admin `Varsayılana dön` dediğinde child rule satırını sil ve parent davranışına geri dön.

## 10.7 Taxonomy ayrı sekmede kalsın

AFS matrisi içine taxonomy option kayıtlarını sıkıştırma.

Aynı sayfada ikinci sekme:

```txt
Taxonomy Kuralları
```

Bu sekmede rol sütunları veya seçili rol paneli üzerinden:

```txt
Grup aktif mi
Zorunlu mu
single / multiple
Option listesi
source
reset to parent
```

yönetilsin.

---

# 11. Rol CRUD Yönetimi

Tüm roller tek `roles` tablosunda yönetilmelidir.

Yeni RPC fonksiyonları:

```sql
admin_create_role(...)
admin_update_role_metadata(...)
admin_clone_role(...)
admin_archive_role(...)
admin_restore_role(...)
admin_reset_role_rule_to_parent(...)
```

## 11.1 Yeni rol oluşturma alanları

```txt
key
label
description
family_key
parent_role_key
is_assignable
is_directory_visible
default_item_type
sort_order
```

## 11.2 Validation

```txt
key benzersiz olmalı
key regex uygun olmalı
parent aktif olmalı
role kendisini parent seçemez
cycle oluşamaz
atanmış profile sahip role hard delete uygulanamaz
key atanmış kayıt varsa değiştirilemez
```

## 11.3 Clone modları

```txt
inherit_from_source
copy_effective_rules_as_explicit
```

Varsayılan:

```txt
inherit_from_source
```

## 11.4 Arşivleme

Hard delete yapma.

Atanmış profil varsa:

```txt
arşivlemeyi engelle
veya hedef replacement role iste
```

MVP için güvenli varsayılan:

```txt
atanmış profil varsa arşivlemeyi engelle
```

---

# 12. Tek Kaynaklı Son Kullanıcı Directory

## 12.1 Yeni directory veri akışı

Mevcut frontend birleştirmesini kaldır:

```txt
list_public_directory_profiles
+
search_catalog
```

Nihai akış:

```txt
search_directory_catalog
-> catalog_items kaynaklı tek response
-> DirectoryPage
```

Yeni veya genişletilmiş RPC:

```sql
public.search_directory_catalog(
  p_query text default null,
  p_role_keys text[] default null,
  p_family_keys text[] default null,
  p_item_types text[] default null,
  p_category_slugs text[] default null,
  p_country_code text default null,
  p_city text default null,
  p_language_codes text[] default null,
  p_verified_only boolean default false,
  p_featured_only boolean default false,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (...)
```

## 12.2 Search source

RPC yalnızca canonical katalog kaynağından çalışmalıdır:

```txt
catalog_items
+
normalize ilişkili tablolar
+
gerekirse derived search index veya materialized view
```

`catalog_items` source of truth olarak kalmalıdır. Performans için `catalog_search_index` view veya derived tablo kullanılabilir; ancak frontend iki ayrı domain listesini birleştirmemelidir.

## 12.3 Login zorunluluğu

Görsel gereksinimine göre tüm kapsamlı directory sonuçları login olmuş son kullanıcıya açılmalıdır.

Uygulanacak kural:

```txt
auth.uid() null ise full directory sonuçları dönme
```

Frontend:

```txt
/directory
/directory/catalog/:slug
```

route'larını `RequireAuth` ile sar veya RPC seviyesinde login zorunluluğu uygula. En güvenli yaklaşım her ikisini birden uygulamaktır.

Anonim kullanıcıya:

```txt
Directory içeriğini görmek için giriş yap
```

CTA gösterilebilir.

## 12.4 Legacy profile route

Mevcut:

```txt
/directory/profile/:userId
```

route'u compatibility amacıyla korunabilir.

Yeni davranış:

1. User ID için personal catalog item slug çöz.
2. `/directory/catalog/:slug` adresine redirect et.

Yeni link üretiminde yalnızca catalog item route kullan.

## 12.5 Directory rol filtresi

Rol filtresi DB metadata üzerinden gelmelidir:

```sql
select key, label
from roles
where is_active = true
  and is_directory_visible = true
order by sort_order;
```

Frontend prefix kontrolü ile rol -> item type map çıkarmamalıdır.

## 12.6 Arama kapsamı

Search RPC aşağıdakileri tek sorguda arayabilmelidir:

```txt
profil title
headline
short description
long description
role label
role key
şehir
ülke
kategori
uzmanlık taxonomy seçenekleri
hizmetler
diller
normalize edilmiş public attribute değerleri
```

Hassas alanlar search document içine yazılmamalıdır:

```txt
private telefon
private e-posta
private WhatsApp
admin notları
approval bekleyen veriler
```

---

# 13. Profil Düzenleme Deneyimi

## 13.1 Kullanıcıya ait düzenlenebilir profiller ekranı

Yeni route:

```txt
/profile
```

veya mevcut profile resolver genişletmesi.

Login user için önce:

```sql
get_my_editable_catalog_items()
```

çağrılmalıdır.

### Tek profil varsa

Doğrudan profil edit sayfasına yönlendir.

### Birden fazla profil varsa

Profil seçme ekranı göster:

```txt
Hangi profili düzenlemek istiyorsun?
```

Örnek:

```txt
Ali Veli — Bireysel Profil
Yılmaz Bakkal — İşletme Profili
```

## 13.2 Profil edit route

Öneri:

```txt
/profile/catalog/:itemId
```

Mevcut route yapısı korunacaksa compatibility redirect uygula.

## 13.3 Edit form effective role kurallarından üretilsin

Edit ekranı hardcoded role componentleriyle büyütülmemelidir.

Akış:

```txt
get_catalog_item_profile(itemId)
-> canonical platform_role_key
-> effective role attribute rules
-> taxonomy rules
-> owner/editor permission
-> dinamik form renderer
```

## 13.4 Public / authenticated profil renderer

Akış:

```txt
get_catalog_item_public_profile(slug)
-> role sections
-> public veya authenticated görünür attribute değerleri
-> taxonomy
-> related contact / location / service kayıtları
-> section renderer
```

`DirectoryCatalogItemPage` kademeli biçimde bu RPC üzerinden çalışmalıdır. Direct tablo sorgusu azaltılmalıdır.

---

# 14. Effective Rule Resolution

## 14.1 Feature çözümleme

```txt
feature global kapalıysa false
aksi halde:
  profile item override
  > child role explicit rule
  > parent role rule
  > compatibility default
  > false
```

Not: Kullanıcı auth hesabına değil, profil katalog öğesine bağlı override tercih edilmelidir. Böylece bakkal profili ile bireysel profil aynı account tarafından yönetilse bile farklı feature davranışı gösterebilir.

## 14.2 Attribute çözümleme

```txt
child role explicit attribute rule
> parent role attribute rule
> catalog default
```

Attribute değeri profil katalog öğesinde tutulur. Rol değişince değer silinmez.

## 14.3 Section çözümleme

```txt
child role explicit section rule
> parent role section rule
> catalog default
```

Renderer yalnızca şu koşullarda section döndürür:

```txt
section aktif
AND kaynak veri mevcut
AND görünürlük izin veriyor
AND gerekiyorsa approval approved
```

## 14.4 Taxonomy çözümleme

```txt
child role explicit taxonomy rule
> parent role taxonomy rule
> taxonomy default
```

Rol değişince eski taxonomy seçimlerini silme. Yeni role uygun değilse etkisiz olarak koru ve admin warning göster.

---

# 15. Yeni veya Genişletilecek RPC Listesi

## 15.1 Directory ve profil okuma

```sql
search_directory_catalog(...)
list_directory_role_options()
get_catalog_item_public_profile(p_slug text)
get_my_editable_catalog_items()
get_catalog_item_profile(p_item_id uuid)
ensure_personal_catalog_item_for_current_user()
```

## 15.2 Admin profil yönetimi

```sql
admin_list_catalog_profiles(...)
admin_get_catalog_profile_snapshot(p_item_id uuid)
admin_change_catalog_item_role(p_item_id uuid, p_role_key text, p_reason text, p_dry_run boolean)
admin_set_catalog_item_attribute(...)
admin_set_catalog_item_feature_override(...)
admin_clear_catalog_item_feature_override(...)
```

## 15.3 Sahiplik

```sql
admin_list_catalog_item_access(p_item_id uuid)
admin_grant_catalog_item_access(...)
admin_update_catalog_item_access(...)
admin_revoke_catalog_item_access(...)
can_view_catalog_item(...)
can_edit_catalog_item(...)
can_manage_catalog_item_editors(...)
```

## 15.4 Rol yönetimi

```sql
get_role_management_bundle(...)
admin_get_role_matrix(...)
admin_create_role(...)
admin_update_role_metadata(...)
admin_clone_role(...)
admin_archive_role(...)
admin_restore_role(...)
admin_set_role_feature_flag(...)
admin_set_attribute_rule(...)
admin_upsert_role_profile_section_rule(...)
admin_upsert_role_taxonomy_rule(...)
admin_reset_role_rule_to_parent(...)
```

## 15.5 Compatibility

Aşağıdaki eski RPC fonksiyonları transition sürecinde korunabilir:

```txt
admin_set_member_catalog_role
admin_set_user_role
list_public_directory_profiles
admin_set_catalog_item_editor
```

Yeni fonksiyonlara wrapper olarak çalışabilirler. Yeni frontend kodu compatibility RPC kullanmamalıdır.

---

# 16. Admin Profil ve Rol Atama Merkezi Data Layer

Yeni dosya:

```txt
src/lib/admin-profile-role-assignment.ts
```

Exportlar:

```ts
listCatalogProfiles(filters)
getCatalogProfileSnapshot(itemId)
previewCatalogItemRoleChange(params)
changeCatalogItemRole(params)
listCatalogItemAccess(itemId)
grantCatalogItemAccess(params)
updateCatalogItemAccess(params)
revokeCatalogItemAccess(params)
archiveCatalogItem(itemId)
```

Tipler:

```ts
type CatalogProfileRow = {
  itemId: string;
  itemType: string;
  slug: string;
  title: string;
  roleKey: string;
  roleLabel: string;
  familyKey: string | null;
  owners: CatalogItemAccessSummary[];
  editorCount: number;
  city: string | null;
  countryCode: string | null;
  status: string;
  visibility: string;
  verificationStatus: string;
  effectiveAttributeCount: number;
  effectiveFeatureCount: number;
  effectiveSectionCount: number;
  missingRequiredCount: number;
  warningCount: number;
  updatedAt: string;
};
```

UI component içinde dağınık `supabase.from(...)` çağrıları yapma. RPC çağrılarını bu data layer içinde topla.

---

# 17. Rol Matrisi Data Layer

Yeni dosya:

```txt
src/lib/admin-role-matrix.ts
```

Exportlar:

```ts
getAllRolesMatrix(filters)
setRoleAttributeRule(params)
setRoleFeatureRule(params)
setRoleSectionRule(params)
setRoleTaxonomyRule(params)
resetRuleToParent(params)
createRole(params)
cloneRole(params)
archiveRole(params)
restoreRole(params)
```

Response:

```ts
type RuleSource = "self_role" | "parent_role" | "catalog_default" | "fallback";

type RoleMatrixPayload = {
  roles: RoleMatrixColumn[];
  catalogRows: RoleMatrixCatalogRow[];
  cells: RoleMatrixCell[];
};
```

---

# 18. Frontend Component Planı

## 18.1 Profil ve rol atama ekranı

```txt
src/pages/admin/AdminProfileRoleAssignmentPage.tsx
src/components/admin/profile-role-assignment/ProfileRoleAssignmentFilters.tsx
src/components/admin/profile-role-assignment/ProfileRoleAssignmentTable.tsx
src/components/admin/profile-role-assignment/ProfileRoleRow.tsx
src/components/admin/profile-role-assignment/ProfileRoleChangeDialog.tsx
src/components/admin/profile-role-assignment/ProfileDetailsDrawer.tsx
src/components/admin/profile-role-assignment/ProfileOwnersEditorsPanel.tsx
src/components/admin/profile-role-assignment/ProfileWarningsPanel.tsx
src/components/admin/profile-role-assignment/ProfileAuditPanel.tsx
```

## 18.2 Tüm roller matrisi

```txt
src/pages/admin/AdminAllRolesMatrixPage.tsx
src/components/admin/role-management/AllRolesMatrixTable.tsx
src/components/admin/role-management/AttributeRulePopover.tsx
src/components/admin/role-management/FeatureRulePopover.tsx
src/components/admin/role-management/ProfileSectionRulePopover.tsx
src/components/admin/role-management/TaxonomyRulesTab.tsx
src/components/admin/role-management/RuleSourceBadge.tsx
src/components/admin/role-management/RoleCrudDrawer.tsx
```

## 18.3 Kullanıcı profil seçici

```txt
src/pages/ProfileResolverPage.tsx
src/components/profile/EditableProfilesSelector.tsx
src/lib/catalog-entity-api.ts
```

`ProfileResolverPage` birden fazla editable profil varsa seçim ekranı göstermelidir.

---

# 19. Admin Navigasyon Sadeleştirme

Admin menüsünde aşağıdaki ana girişleri göster:

```txt
Profil ve Rol Atama
Tüm Roller AFS Matrisi
Taxonomy Yönetimi
Feature Override
Approval Queue
Audit Logs
```

## 19.1 Yeni route'lar

```txt
/admin/new-member/profile-role-assignment
/admin/new-member/role-matrix
```

## 19.2 Redirect veya compatibility wrapper yapılacak eski route'lar

```txt
/admin/new-member/users-roles
/admin/new-member/roles-features
/admin/new-member/attributes
/admin/new-member/profile-sections
/admin/new-member/role-management
/admin/new-member/roles-preview
/admin/new-member/entity-preview
```

Örnek:

```txt
/admin/new-member/attributes?selectedRoleId=...
-> /admin/new-member/role-matrix?kind=attribute&role=...
```

## 19.3 Ayrı kalabilecek route'lar

```txt
/admin/new-member/taxonomy
/admin/new-member/overrides
/admin/approvals
/admin/audit-logs
```

İkinci fazda drawer içine gömülebilir.

---

# 20. RLS ve Güvenlik

## 20.1 Directory görünürlüğü

Authenticated directory erişimi:

```txt
Login olmuş kullanıcı published + authenticated görünür profilleri arayabilir.
Public görünürlüğü olan profiller ayrıca anonim landinglerde gösterilebilir.
Private profiller yalnızca admin veya yetkili owner/editor tarafından görülebilir.
```

## 20.2 Profil düzenleme

Write işlemleri yalnızca RPC üzerinden veya sıkı RLS ile yapılmalıdır.

Kural:

```txt
admin
OR active owner
OR active manager
OR active editor
```

## 20.3 Rol değiştirme

Yalnızca admin rol değiştirebilir:

```txt
public.is_admin(auth.uid()) = true
```

Owner kendi profil rolünü değiştiremez.

## 20.4 Owner / editor yönetimi

İlk MVP:

```txt
yalnızca admin grant / revoke yapar
```

İkinci faz:

```txt
owner editor daveti oluşturabilir
admin veya owner politikasıyla onaylanabilir
```

## 20.5 Hassas alanlar

Aşağıdaki alanlar yalnızca görünürlük ve approval kuralları uygunsa döndürülmelidir:

```txt
telefon
e-posta
WhatsApp
adres
özel belge
lisans belgesi
```

Search index içine private veri yazma.

---

# 21. Audit Log

Her kritik işlem audit log oluşturmalıdır.

Aksiyonlar:

```txt
catalog_item.created
catalog_item.updated
catalog_item.archived
catalog_item.role_changed
catalog_item.access_granted
catalog_item.access_updated
catalog_item.access_revoked
catalog_item.claim_approved
catalog_item.claim_rejected
role.created
role.updated
role.archived
role.cloned
role.rule_attribute.updated
role.rule_feature.updated
role.rule_section.updated
role.rule_taxonomy.updated
role.rule_reset_to_parent
```

Payload örneği:

```json
{
  "item_id": "...",
  "old_role_key": "Business_Market_Bakkal",
  "new_role_key": "Business_Restoran_Cafe",
  "actor_user_id": "...",
  "reason": "Profil türü düzeltildi",
  "warnings": [
    "missing_required_attribute:opening_hours",
    "inactive_taxonomy_selection:market_type"
  ]
}
```

---

# 22. Migration Planı

Eski migration dosyalarını değiştirme. Yeni timestamp'li migration dosyaları oluştur.

## Faz DB-1 — Envanter migration öncesi rapor

Codex önce rapor çıkarsın:

```txt
catalog_items mevcut kolonlar
existing catalog access tablosu
personal profile catalog item kapsama oranı
legacy user profile sayısı
catalog_items sayısı
roles sayısı
boş platform_role_key sayısı
duplicate personal profile sayısı
owner kaydı olmayan catalog item sayısı
```

## Faz DB-2 — Roles metadata

Yeni migration:

```txt
<timestamp>_extend_roles_for_unified_catalog.sql
```

Ekle:

```txt
family_key
parent_role_id
is_assignable
is_directory_visible
default_item_type
metadata
```

## Faz DB-3 — Access ilişkisi

Yeni migration:

```txt
<timestamp>_catalog_item_access_and_permissions.sql
```

Mevcut tabloyu genişlet veya yeni erişim tablosunu oluştur.

Ek olarak:

```txt
can_view_catalog_item
can_edit_catalog_item
can_manage_catalog_item_editors
```

fonksiyonlarını ekle.

## Faz DB-4 — Personal profile backfill

Yeni migration veya idempotent script:

```txt
<timestamp>_backfill_personal_catalog_items.sql
```

Her auth/login kullanıcıya bireysel katalog öğesi ve owner erişimi oluştur.

## Faz DB-5 — Canonical directory search

Yeni migration:

```txt
<timestamp>_authenticated_unified_directory_search.sql
```

Ekle:

```txt
search_directory_catalog
list_directory_role_options
get_catalog_item_public_profile
```

## Faz DB-6 — Admin role assignment

Yeni migration:

```txt
<timestamp>_admin_catalog_item_role_assignment.sql
```

Ekle:

```txt
admin_list_catalog_profiles
admin_get_catalog_profile_snapshot
admin_change_catalog_item_role
```

## Faz DB-7 — Role inheritance ve matrix

Yeni migration:

```txt
<timestamp>_role_inheritance_and_matrix.sql
```

Ekle:

```txt
effective rule helper fonksiyonları
admin_get_role_matrix
reset rule to parent
role CRUD RPC fonksiyonları
```

---

# 23. Backward Compatibility

## 23.1 Legacy user profile directory satırları

Geçiş tamamlandığında `DirectoryPage` frontend kodu iki ayrı listeyi birleştirmemelidir.

Ancak eski veriler backfill tamamlanana kadar:

```txt
feature flag veya temporary compatibility view
```

kullanılabilir.

Geçiş sonunda canonical test:

```txt
Her görünür user profile için bir personal catalog item var mı?
```

Cevap `evet` olmadan legacy branch kaldırılmamalıdır.

## 23.2 Legacy route

```txt
/directory/profile/:userId
```

personal catalog item slug resolver üzerinden redirect olmalıdır.

## 23.3 Legacy RPC wrapper

Eski RPC isimleri geçici wrapper olarak kalabilir. Yeni frontend yalnızca yeni data layer kullanmalıdır.

---

# 24. Test Planı

## 24.1 Database testleri

1. Login user için personal catalog item otomatik oluşur.
2. Personal catalog item için owner access kaydı oluşur.
3. Aynı login user için ikinci personal catalog item oluşmaz.
4. Bir auth user iki farklı katalog profilinde owner olabilir.
5. Bakkal sahibi hem bireysel profilini hem bakkal profilini düzenleyebilir.
6. Editor yalnızca yetkili olduğu katalog öğesini düzenleyebilir.
7. Viewer düzenleme yapamaz.
8. Admin tüm katalog öğelerini düzenleyebilir.
9. Normal login user başka profile izinsiz update yapamaz.
10. Normal login user başka profile rol atayamaz.
11. Owner kendi profile rol atayamaz.
12. Admin geçerli role atama yapabilir.
13. Pasif role atama yapılamaz.
14. `is_assignable = false` parent role atanamaz.
15. Yanlış item type için role atama yapılamaz.
16. Rol değişiminde attribute değerleri silinmez.
17. Rol değişiminde taxonomy seçimleri silinmez.
18. Rol değişiminde profile override kayıtları silinmez.
19. Child role parent AFS kuralını miras alır.
20. Child explicit rule parent değerini override eder.
21. Reset-to-parent sonrası inheritance geri gelir.
22. Search RPC auth olmadan full sonuç döndürmez.
23. Search RPC login user için bireysel, doktor, avukat ve bakkal profillerini aynı response içinde döndürür.
24. Private attribute search document içine girmez.
25. Claim approval owner access üretir.
26. Tüm kritik işlemler audit log oluşturur.

## 24.2 Frontend component testleri

1. Profil ve rol atama ekranı tek tabloda tüm katalog öğelerini gösterir.
2. Bireysel, doktor, avukat ve bakkal aynı tabloda görülebilir.
3. Filtreler item type, role, city ve owner durumuna göre çalışır.
4. Role dropdown confirmation dialog açar.
5. Dry-run warningler dialog içinde görünür.
6. Başarılı role değişiminde satır snapshot yenilenir.
7. Sahip / editör drawer doğru kayıtları gösterir.
8. Owner ekleme ve kaldırma admin için çalışır.
9. Tüm roller matrisi aktif rollerin tamamını sütunlarda gösterir.
10. A/F/S satır filtresi çalışır.
11. Inherited badge görünür.
12. Reset-to-parent aksiyonu çalışır.
13. Directory anonim kullanıcıda login CTA gösterir.
14. Directory login kullanıcıda tek response listesini gösterir.
15. Profile resolver bir kullanıcıda birden fazla editable profile varsa seçim ekranı gösterir.

## 24.3 E2E Smoke — Bakkal sahibi

1. Admin login ol.
2. Ali kullanıcısını oluştur veya test user kullan.
3. Ali için personal catalog item var mı doğrula.
4. `Yılmaz Bakkal` business catalog item oluştur.
5. Ali'yi bakkal profiline `owner` olarak ata.
6. Ali hesabıyla login ol.
7. `/profile` aç.
8. İki profil seçeneği gör:
   - Ali kişisel profil
   - Yılmaz Bakkal
9. Kişisel profili düzenle.
10. Bakkal profilini düzenle.
11. Yetkisi olmayan üçüncü profile erişemediğini doğrula.

## 24.4 E2E Smoke — Tek kaynaklı arama

1. Test datası ekle:
   - Bireysel kullanıcı
   - Doktor
   - Avukat
   - Bakkal
2. Anonim kullanıcı `/directory` açsın.
3. Login CTA veya sınırlı görünüm doğrulansın.
4. Login user `/directory` açsın.
5. Dört farklı rol tek sonuç listesinde görünsün.
6. Rol filtresiyle yalnızca doktoru filtrele.
7. Şehir filtresiyle sonucu daralt.
8. Sonuç detay route'u `/directory/catalog/:slug` olsun.

## 24.5 E2E Smoke — AFS matrisi

1. Admin `/admin/new-member/role-matrix` açsın.
2. `Healthcare_Doktor` sütununu bulsun.
3. `license_number` attribute'unu zorunlu yapsın.
4. Doktor profiline geçsin.
5. Eksik alan warningini doğrulasın.
6. Alanı doldursun.
7. Warning kaybolsun.
8. Aynı değişikliğin bakkal profiline uygulanmadığını doğrulasın.

---

# 25. Build ve Doğrulama Komutları

Windows PowerShell uyumlu komutlar kullan:

```powershell
npm install
npm run verify:text
npm run lint
npm run test
npm run build
```

Typecheck scripti eklenmişse:

```powershell
npm run typecheck
```

Supabase:

```powershell
supabase migration list
supabase db reset
```

Canlı ortama doğrudan push yapma. Önce local DB reset, test ve build doğrulaması tamamla.

---

# 26. Kod Kalitesi Kuralları

1. Eski migration dosyalarını değiştirme.
2. Yeni paralel katalog tablosu oluşturma; mevcut `catalog_items` kaynağını tamamla.
3. Directory frontend içinde iki ayrı listeyi birleştirmeye devam etme.
4. Personal profil kayıtlarını da canonical catalog modeline taşı.
5. `linked_user_id` alanını tek sahiplik kaynağı olarak kullanma.
6. Sahiplik için many-to-many erişim ilişkisi kullan.
7. Admin yetkisini profile role olarak saklama.
8. Attribute, Feature, Section ve Taxonomy kavramlarını birbirine karıştırma.
9. Rol değişiminde veri silme.
10. Role ait AFS kurallarını profil instanceına fiziksel olarak kopyalama.
11. Frontend guard ile yetinme; RPC ve RLS uygula.
12. Hassas private alanları search index içine yazma.
13. Prefix tabanlı role -> item type mapping mantığını kaldır; DB metadata kullan.
14. Role key stabil olsun; label değişebilir.
15. Yeni UI bileşenlerinde doğrudan Supabase sorgularını azalt; data layer kullan.
16. Yeni `as any` kullanımını artırma.
17. Supabase generated type dosyasını migration sonrası güncelle.
18. Kritik işlemleri audit logla.

---

# 27. Uygulama Sırası

## Faz 0 — Envanter

- Existing `catalog_items` şemasını çıkar.
- Existing access/editor tablosunu bul.
- Legacy user profile ile personal catalog item kapsama oranını ölç.
- Current search flow dependency haritasını çıkar.
- Current role assignment kaynağını çıkar.

## Faz 1 — Canonical katalog kararı

- `catalog_items` source of truth kararını uygula.
- Personal profile backfill yap.
- Personal owner erişimlerini oluştur.
- Duplicate kontrolü ekle.

## Faz 2 — Ownership

- Existing editor tablosunu genişlet veya access tablosu oluştur.
- Permission helperları ekle.
- Claim approval akışını ownership ile bağla.
- `get_my_editable_catalog_items` ekle.

## Faz 3 — Roles metadata

- Role family, parent, assignable, directory visibility ve item type metadata ekle.
- Prefix hardcode kullanımını kaldır.
- Inheritance helperlarını ekle.

## Faz 4 — Tek kaynak directory

- `search_directory_catalog` ekle.
- Directory role option RPC ekle.
- Login zorunluluğunu uygula.
- `DirectoryPage` frontend birleştirmesini kaldır.
- Catalog item route'u canonical yap.
- Legacy profile route'u redirect et.

## Faz 5 — Tek rol atama ekranı

- `admin_list_catalog_profiles` RPC ekle.
- `admin_change_catalog_item_role` dry-run + apply akışını ekle.
- Admin profil ve rol atama UI oluştur.
- Owners / editors drawer ekle.

## Faz 6 — Tüm roller AFS matrisi

- Mevcut birleşik rule bileşenlerini refactor et.
- Tüm roller sütunlu matrix ekle.
- Inheritance ve reset-to-parent ekle.
- Taxonomy sekmesini bağla.

## Faz 7 — Kullanıcı edit experience

- Profile resolver'a editable profile selector ekle.
- One user -> multiple profiles senaryosunu tamamla.
- Dynamic catalog item form renderer doğrula.

## Faz 8 — Compatibility cleanup

- Eski admin route'ları redirect et.
- Legacy search birleşimini kaldır.
- Compatibility wrapper RPC'leri belgele.
- Dokümantasyonu güncelle.

## Faz 9 — Test ve sonuç raporu

- DB testleri.
- Unit testleri.
- E2E smoke.
- Build.
- Sonuç raporu.

---

# 28. Kabul Kriterleri

Çalışma ancak aşağıdaki kriterlerin tamamı sağlanırsa bitmiş kabul edilir:

1. Tüm aranabilir profiller `catalog_items` canonical kaynağında bulunur.
2. Bireysel personal profiller de katalog öğesi olarak temsil edilir.
3. Login user directory üzerinden bireysel, doktor, avukat, bakkal ve diğer yayınlanmış profilleri aynı aramada görebilir.
4. Directory frontend iki ayrı veri listesini birleştirmez.
5. Anonim kullanıcı full directory sonuçlarına erişemez.
6. Admin tüm katalog profil kayıtlarını tek rol atama ekranında görür.
7. Her katalog profilinde tek aktif profil rolü vardır.
8. Admin rolü tek dialog akışıyla değiştirebilir.
9. Rol değişimi attribute değerlerini silmez.
10. Rol değişimi taxonomy seçimlerini silmez.
11. Rol değişimi profile override kayıtlarını silmez.
12. Bir auth user birden fazla profilde owner veya editor olabilir.
13. Login user kendi bireysel profilini düzenleyebilir.
14. Bakkal sahibi hem kişisel hem bakkal profilini düzenleyebilir.
15. Admin tüm profilleri düzenleyebilir.
16. Yetkisiz kullanıcı başka profili düzenleyemez.
17. Tüm roller tek `roles` tablosunda yönetilir.
18. Admin tüm rolleri tek AFS matrix ekranında karşılaştırabilir.
19. Attribute, Feature ve Profile Section ayarları aynı birleşik ekran üzerinden yönetilebilir.
20. Taxonomy ayrı domain olarak korunur.
21. Child role parent AFS kurallarını miras alabilir.
22. Reset-to-parent çalışır.
23. Role -> item type map frontend prefix kontrolüne bağlı değildir.
24. Claim approval owner/editor erişimi üretir.
25. Kritik işlemler audit log oluşturur.
26. Legacy route ve RPC uyumluluğu migration sürecinde korunur.
27. `npm run lint`, `npm run test` ve `npm run build` başarılıdır.

---

# 29. Codex Çalışma Sonu Rapor Formatı

Codex çalışma sonunda aşağıdaki formatta rapor vermelidir:

```md
# Uygulanan Değişiklikler

## 1. Canonical kaynak kararı
- Tüm aranabilir profiller için hangi tablo canonical kabul edildi?
- Personal profile kayıtları nasıl backfill edildi?
- Legacy user profile akışı nasıl korundu?

## 2. Ownership ve editörlük
- Hangi mevcut tablo kullanıldı veya hangi tablo oluşturuldu?
- Admin bypass nasıl uygulandı?
- Bireysel profil sahipliği nasıl üretildi?
- Bakkal sahibi çoklu profil senaryosu nasıl desteklendi?

## 3. Roller
- Eklenen role metadata kolonları
- Parent-child inheritance kararı
- Role -> item type DB mapping kararı

## 4. Directory
- Yeni tek kaynak search RPC
- Login zorunluluğu
- Kaldırılan frontend merge akışı
- Legacy route redirectleri

## 5. Admin ekranları
- Tek profil ve rol atama ekranı
- Tüm roller AFS matrisi
- Owners / editors drawer

## 6. Migrationlar
- Dosya adları
- Eklenen tablolar veya kolonlar
- RPC fonksiyonları
- RLS politikaları

## 7. Test sonuçları
- verify:text
- lint
- test
- typecheck
- build
- Supabase reset
- E2E smoke

## 8. Bilinen sınırlamalar
- İkinci faza bırakılan noktalar
```

---

# 30. Codex'e Verilecek Kısa Görev Özeti

Aşağıdaki paragrafı görevin en üstüne ekle:

```txt
CorteQS içerisinde tüm aranabilir profilleri tek canonical katalog kaynağında birleştir. Canonical kaynak public.catalog_items olmalıdır. Bireysel login kullanıcı profilleri de catalog item olarak temsil edilmelidir. Doktor, avukat, bireysel kullanıcı, bakkal, işletme ve kuruluş profilleri login olmuş son kullanıcı tarafından tek directory ekranında tek arama kaynağından aranabilmelidir. Frontend içerisinde legacy user profile listesi ile catalog_items listesini birleştirme yaklaşımını kaldır.

Auth kullanıcı hesabı ile profil katalog öğesini birbirinden ayır. Bir login hesabı birden fazla profili düzenleyebilsin. Admin tüm profilleri düzenleyebilsin. Login user kendi bireysel profilini düzenleyebilsin. Bir bakkal sahibi hem bireysel profilini hem bakkal profilini düzenleyebilsin. Bunun için mevcut catalog item editor tablosunu genişlet veya many-to-many catalog item user access ilişkisi oluştur. linked_user_id tek yetki kaynağı olmasın.

Tüm profil rolleri public.roles tablosunda tutulmalı. Admin için tek Profil ve Rol Atama Merkezi oluştur. Bu ekranda tüm catalog item profilleri aynı tabloda listelensin ve her profil için tek aktif rol atanabilsin. Rol değişikliği attribute değerlerini, taxonomy seçimlerini ve override kayıtlarını silmeden effective profil görünümünü dinamik olarak değiştirsin.

Tüm roller için tek Attribute / Feature / Profile Section matrix ekranı oluştur. Roller sütunlarda; A/F/S kayıtları satırlarda gösterilsin. Parent-child inheritance ve reset-to-parent davranışını destekle. Taxonomy ayrı domain olarak kalsın. Frontend prefix kontrolüyle role-item type eşleştirme yapma; DB metadata kullan. Tüm write işlemlerinde RPC, RLS ve audit log uygula. Eski migrationları değiştirme; yeni timestamp migrationları ekle. Önce repository envanterini çıkar, sonra fazları sırasıyla uygula ve çalışma sonunda ayrıntılı rapor ver.
```
