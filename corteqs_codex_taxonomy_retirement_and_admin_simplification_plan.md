# CorteQS MVP — Taxonomy Katmanını Kaldırma ve Admin Sistemini Sadeleştirme Planı

## 0. Görev özeti

Bu çalışma, mevcut CorteQS MVP admin ve profil sistemini daha anlaşılır hale getirmek için yapılacaktır.

Yeni sade model aşağıdaki beş kurala dayanır:

1. Sistemde **tek bir `roles` tablosu** bulunacaktır. Tanımlanmış yaklaşık 82 rol bu tabloda satır olarak tutulacaktır.
2. Her rol için Attribute, Feature ve Profile Section kuralları **tek bir AFS Matrisi ekranından** yönetilecektir.
3. Tüm aranabilir ve düzenlenebilir profil/katalog kayıtları admin tarafında **tek bir Veritabanı ekranında** listelenecektir. Canonical ana kayıt kaynağı `catalog_items` olacaktır.
4. Çok özel durumlar için yalnızca **kullanıcı bazlı Feature Override** mekanizması korunacaktır.
5. Taxonomy katmanı şimdilik ürün akışından kaldırılacaktır. İleride basit bir label sistemiyle arama ve filtreleme geliştirilebilir.

Bu görev bir yeniden yazım değildir. Mevcut doğru omurga korunacak; gereksiz paralel yönetim yolları kapatılacaktır.

---

# 1. Ürün kararı

## 1.1. Korunacak ana model

```text
roles
  └── role_attribute_rules
  └── role_feature_flags
  └── role_profile_section_rules

catalog_items
  └── catalog item attribute values
  └── owner/editor access ilişkileri

user_feature_overrides
  └── yalnızca çok özel kullanıcı istisnaları
```

## 1.2. Kaldırılacak veya pasifleştirilecek katmanlar

```text
taxonomy_groups
taxonomy_options
role_taxonomy_rules
taxonomy seçim ekranları
taxonomy tabanlı profil kartları
taxonomy tabanlı role-specific koşullu davranışlar

catalog item seviyesinde AFS override ekranları
catalog item seviyesinde rol değiştirme ekranı
catalog item seviyesinde feature override ekranı
catalog item seviyesinde section override ekranı
```

## 1.3. Temel ilke

Bir profil farklı davranacaksa önce doğru rol seçilmelidir.

Örnek:

```text
Healthcare_Doktor
Consultant_Avukat
Business_Market_Bakkal
Business_Restoran_Cafe
Organization_Dernek_Vakif
```

Bir kayıt yalnızca tek bir özellik bakımından istisnai davranacaksa, yalnızca gerekli durumda **kullanıcı bazlı Feature Override** kullanılmalıdır.

Taxonomy artık rol sistemine paralel ikinci bir karar mekanizması olmayacaktır.

---

# 2. Neden bu sadeleştirme doğru?

Projede yaklaşık 82 rol önceden tanımlanmıştır. Bu roller zaten gerekli davranış farklılıklarını ifade edebilir:

- hangi attribute alanlarının görünmesi gerektiği,
- hangi alanların zorunlu olduğu,
- hangi feature erişimlerinin açık olduğu,
- public profilde hangi sectionların gösterileceği.

Bu durumda taxonomy üzerinden ayrıca alt tip seçtirerek AFS davranışı değiştirmek gereksiz karmaşa üretir.

Yeni ürün dili:

```text
Rol = davranış şablonu
Attribute = profil alanı
Feature = yetki / özellik
Profile Section = public görünüm parçası
Feature Override = tek kullanıcı için istisna
Label = ileride yalnızca arama / filtreleme etiketi
```

Taxonomy ürün ekranlarından kaldırılacaktır. Label sistemi bugün uygulanmak zorunda değildir.

---

# 3. Kritik mimari uyarı: Veritabanı sağ panelinden rol değiştirme kaldırılabilir, fakat rol tamamen kaldırılamaz

Mevcut sağ panelde `CatalogItemRolePanel` bileşeni katalog kaydının rolünü değiştirebiliyor:

```text
Catalog item rolü seç
Rolü Kaydet
```

Bu standart admin deneyiminden kaldırılmalıdır.

Ancak AFS matrisi ve Feature Override ekranı **bir kayda rol atamaz**:

- AFS matrisi, seçilmiş rolün şablonunu değiştirir.
- Feature Override, tek kullanıcıdaki istisnai feature durumunu değiştirir.
- Katalog kaydının hangi role ait olduğu yine `catalog_items.platform_role_key` alanında saklanmalıdır.

Bu nedenle güvenli çözüm:

1. Rol, kayıt oluşturulurken veya import edilirken zorunlu atanır.
2. Veritabanı sağ panelinde rol yalnızca read-only gösterilir.
3. Normal admin arayüzünde rol değiştirme butonu bulunmaz.
4. Hatalı import veya veri düzeltme için yalnızca admin bakım amaçlı, görünmeyen ve audit log yazan RPC korunabilir.
5. Bu bakım RPC'si normal UI tarafından çağrılmaz.

Önerilen bakım RPC adı:

```sql
admin_repair_catalog_item_role(
  p_item_id uuid,
  p_role_key text,
  p_reason text
)
```

Bu RPC:

- yalnızca admin tarafından çalıştırılmalı,
- `p_reason` zorunlu olmalı,
- önceki ve sonraki değeri `admin_audit_logs` içine yazmalı,
- standart frontend ekranında görünmemelidir.

---

# 4. Mevcut kodda sadeleştirilecek alanlar

## 4.1. Admin navigation

Dosya:

```text
src/components/admin/admin-navigation.ts
```

Mevcut menüde:

```text
Taxonomy Yönetimi
```

satırı bulunmaktadır.

Yapılacak değişiklik:

```diff
- { to: "/admin/new-member/taxonomy", label: "Taxonomy Yönetimi", icon: Database },
```

Yeni sade menü:

```text
Veritabanı
Tüm Roller AFS Matrisi
Feature Override
Kullanım Kılavuzu
```

## 4.2. App route

Dosya:

```text
src/App.tsx
```

Kaldırılacak import:

```diff
- import AdminTaxonomyPage from "@/pages/admin/AdminTaxonomyPage";
```

Kaldırılacak route:

```diff
- <Route path="new-member/taxonomy" element={<AdminTaxonomyPage />} />
```

Eski bookmark kullanan kullanıcılar için tercih edilen geçiş:

```tsx
<Route
  path="new-member/taxonomy"
  element={<Navigate to="/admin/new-member/guide?notice=taxonomy-retired" replace />}
/>
```

Bu redirect en az bir sürüm tutulabilir.

## 4.3. Taxonomy sayfası

Dosya:

```text
src/pages/admin/AdminTaxonomyPage.tsx
```

Yapılacak işlem:

- Aktif ürün route'undan çıkar.
- Import edilmediğini doğrula.
- Dosyayı doğrudan silmek yerine ilk aşamada arşivleyebilirsin:

```text
docs/archive/taxonomy/AdminTaxonomyPage.retired.md
```

veya Git geçmişine güveniliyorsa frontend dosyasını kaldır.

## 4.4. Legacy profile payload

Dosya:

```text
src/lib/member-profile.ts
```

Mevcut payload taxonomy gruplarını map ediyor:

```ts
taxonomyGroups: TaxonomyGroupState[];
```

Yapılacak işlem:

- Yeni runtime payload içinden `taxonomyGroups` kaldır.
- Mapping kodunu kaldır.
- Eski backend payload taxonomy alanı gönderse bile frontend bunu kullanmasın.
- Geçiş sırasında backward compatibility gerekiyorsa alan opsiyonel kabul edilebilir; ancak UI'da gösterilmemelidir.

Yeni sade payload:

```ts
export type CurrentUserProfilePayload = {
  userId: string;
  email: string | null;
  fullName: string | null;
  profileType: LegacyRoleKey;
  roleKey: LegacyRoleKey;
  roleLabel: string;
  roleDescription: string | null;
  roleSlug: CanonicalRoleSlug;
  features: ProfileFeatureState[];
  attributes: ProfileAttributeState[];
  pendingRequests: PendingApprovalSummary[];
  profileCompletion: {
    requiredTotal: number;
    requiredCompleted: number;
    percentage: number;
  };
};
```

## 4.5. Legacy hardcoded profile sections

Dosya:

```text
src/lib/profile-types.ts
```

Mevcut bazı section listelerinde:

```ts
"taxonomy"
```

yer alıyor.

Yapılacak işlem:

- `selfSectionKeys` içinden `"taxonomy"` kaldır.
- `publicSectionKeys` içinden `"taxonomy"` kaldır.
- Rol davranışını DB tabanlı AFS matrisine taşı.
- Hardcoded role meta yapısını yalnızca compatibility katmanı olarak tut.
- Yeni 82 rol için canonical kaynak `roles` tablosu olmalıdır.

## 4.6. Public profile view model

Dosya:

```text
src/lib/profile-view-model.ts
```

Mevcut kod taxonomy etiketlerini public badge veya section üretiminde kullanabiliyor.

Yapılacak işlem:

- `buildTaxonomyLabels()` ve taxonomy tabanlı badge üretimini kaldır.
- Şimdilik badge için yalnızca:
  - role label,
  - doğrulama durumu,
  - isteğe bağlı mevcut catalog category label değerleri
  kullanılabilir.
- İleride label sistemi eklendiğinde `labels` ayrı bir alan olarak eklenebilir.
- AFS davranışı label üzerinden hesaplanmamalıdır.

## 4.7. Profil düzenleme ekranı

Dosya:

```text
src/pages/ProfilePage.tsx
```

Yapılacak işlem:

- Taxonomy kartı veya taxonomy seçim UI'sı varsa kaldır.
- Formda yalnızca seçili role göre çözümlenmiş attribute alanlarını göster.
- Kullanıcıya rol veya taxonomy seçtirerek davranış değiştirme.
- Form davranışı yalnızca role ait attribute kurallarından gelmeli.

## 4.8. Backend profile RPC'leri

Aşağıdaki RPC'leri incele:

```text
get_current_user_profile
get_public_profile_sections
get_catalog_item_profile
```

Yapılacak işlem:

- taxonomy gruplarını response içine ekleyen join ve JSON üretimini kaldır veya devre dışı bırak.
- Public profile section üretiminde taxonomy zorunluluğunu kaldır.
- `preview.kategori_sektor_etiketi` gibi eski sectionlar taxonomy'ye bağlıysa:
  - role label ile doldur,
  - label sistemi gelene kadar boş array kullan,
  - ekranı kırmadan graceful fallback sağla.

---

# 5. Veritabanı ekranını sadeleştirme

## 5.1. Hedef ekran

Ana ekran:

```text
/admin/data
```

Bu ekranın amacı:

> Sistemdeki tüm kayıtları tek listede görmek, filtrelemek ve seçilen kaydın attribute değerlerini düzenlemek.

Bu ekran artık rol tasarım veya AFS override ekranı değildir.

## 5.2. Başlık değişikliği

Dosya:

```text
src/pages/admin/AdminCatalogPage.tsx
```

Mevcut üst başlık:

```text
Profile Rol Atama
```

Yeni başlık:

```text
Veritabanı
```

Alt açıklama önerisi:

```text
Tüm profil ve katalog kayıtlarını tek tabloda görüntüle. Bir kayıt seçerek attribute değerlerini düzenle.
```

## 5.3. Sağ drawer sadeleştirmesi

Mevcut drawer içinde aşağıdaki parçalar bulunabilir:

```text
CatalogItemRolePanel
CatalogItemRuleManager
CatalogEntityProfilePanel
CatalogItemEditorsPanel
CatalogClaimRequestsPanel
```

Yeni standart drawer davranışı:

```text
Özet
Attributes
Sahipler / Editörler (gerekiyorsa ayrı sekme)
Claim talepleri (gerekiyorsa ayrı sekme)
```

Kaldırılacak standart drawer bölümleri:

```text
Rol değiştirme dropdown
Rolü Kaydet butonu
Item-level attribute rule override
Item-level feature override
Item-level section override
Item-level AFS özet kartları
```

Rol read-only metadata olarak gösterilebilir:

```text
Rol: Healthcare_Doktor
```

## 5.4. Kaldırılacak bileşen

Dosya:

```text
src/components/admin/catalog/CatalogItemRolePanel.tsx
```

Bu bileşen şu anda:

- rol dropdown gösteriyor,
- `setCatalogItemRole()` çağırıyor,
- `CatalogItemRuleManager` render ediyor,
- item-level AFS override yönetiyor.

Standart UI'dan tamamen çıkarılmalıdır.

İlk aşamada dosya silinmek zorunda değildir; fakat hiçbir aktif route veya parent component tarafından render edilmemelidir.

## 5.5. Kaldırılacak item-level rule manager

Dosya:

```text
src/components/admin/catalog/CatalogItemRuleManager.tsx
```

Bu bileşen şu anda item seviyesinde:

- attribute override,
- feature override,
- section override

yönetiyor.

Yeni sade modelde standart ürün akışından çıkarılmalıdır.

Gerekçe:

```text
Attribute davranışı → rol AFS matrisinden gelir
Feature davranışı   → rol AFS matrisinden gelir
Section davranışı   → rol AFS matrisinden gelir
Tek kullanıcı istisnası → Feature Override ekranından gelir
```

## 5.6. CatalogEntityProfilePanel sadeleştirmesi

Dosya:

```text
src/components/admin/catalog/CatalogEntityProfilePanel.tsx
```

Bu panel şu anda Attributes ve Features kartlarını birlikte gösteriyor.

Yeni davranış:

- Attributes kartı korunacak.
- Feature override kartı kaldırılacak.
- Metadata kartında rol read-only gösterilebilir.
- Attribute değerleri ve visibility düzenlenebilir.
- Attribute rule'ları düzenlenemez.
- Feature değerleri burada değiştirilemez.
- Section görünürlüğü burada değiştirilemez.

Yeni panel adı önerisi:

```text
CatalogItemAttributeEditorPanel
```

veya mevcut isim korunabilir.

## 5.7. AdminCatalogPage temizliği

Dosya:

```text
src/pages/admin/AdminCatalogPage.tsx
```

Yapılacak değişiklikler:

- `CatalogItemRolePanel` import'unu kaldır.
- Role edit callback kaldır:

```ts
handleSelectedItemRoleChanged
```

- Drawer içinde `CatalogItemRolePanel` render'ını kaldır.
- Rol listesini yalnızca filtre göstermek için gerekiyorsa yüklemeye devam et.
- Sağ panelde rol edit aksiyonu gösterme.
- Seçilen kaydın role label bilgisini read-only göster.
- Drawer'ın ana editörü attribute değerleri olsun.

---

# 6. AFS matrisi tek kaynak olacak

## 6.1. Korunacak ekran

Route:

```text
/admin/new-member/role-matrix
```

Sayfa:

```text
src/pages/admin/AdminRoleManagementPage.tsx
```

Bu ekran sistemdeki tek rol davranış yönetim ekranı olacaktır.

## 6.2. AFS kapsamı

Matris yalnızca üç varlık türünü içermelidir:

```text
A = Attribute
F = Feature
S = Profile Section
```

Taxonomy matrise eklenmemelidir.

## 6.3. Roller

Canonical rol kaynağı:

```text
public.roles
```

Bu tabloda yaklaşık 82 rol satırı bulunacaktır.

Örnek:

```text
User_Bireysel
Healthcare_Doktor
Healthcare_Dentist
Consultant_Avukat
Consultant_Egitim
Business_Market_Bakkal
Business_Restoran_Cafe
Organization_Dernek_Vakif
Organization_Konsolosluk
```

## 6.4. AFS çözümleme sırası

Yeni sade runtime çözümleme:

```text
catalog_items.platform_role_key
        ↓
roles.key
        ↓
role_attribute_rules
role_feature_flags
role_profile_section_rules
        ↓
catalog item attribute values
        ↓
public / private profile renderer
```

Item-level AFS override katmanı bu akışta kullanılmamalıdır.

## 6.5. Eksik rol davranışı

Bir kayıt rolsüzse:

```text
status = draft
visibility = private
```

olarak kabul edilmelidir.

Public directory içine rolü olmayan kayıt düşmemelidir.

---

# 7. Feature Override sadeleştirmesi

## 7.1. Korunacak ekran

Route:

```text
/admin/new-member/overrides
```

Bu ekran yalnızca gerçekten istisnai durumlar için kullanılacaktır.

## 7.2. Canonical override tablosu

Tercih edilen tablo:

```text
public.user_feature_overrides
```

Bu override, login olmuş kullanıcı için geçerli olmalıdır.

Alanlar:

```sql
user_id uuid
feature_key text
is_enabled boolean
reason text
created_at timestamptz
updated_at timestamptz
updated_by uuid
```

## 7.3. Zorunlu kurallar

- Override nedeni zorunlu olmalı.
- Override oluşturan admin saklanmalı.
- Override tarihi saklanmalı.
- Override kaldırılabilmeli.
- Override listesi arama desteklemeli.
- Her override audit log içine yazılmalı.
- Boş reason ile kayıt oluşturulmamalı.

## 7.4. Item-level override kaldırma

Aşağıdaki item-level override RPC'leri standart UI ve runtime'dan çıkar:

```text
admin_upsert_catalog_item_attribute_override
admin_delete_catalog_item_attribute_override
admin_upsert_catalog_item_feature_override
admin_delete_catalog_item_feature_override
admin_upsert_catalog_item_section_override
admin_delete_catalog_item_section_override
```

İlk aşamada fonksiyonları fiziksel olarak drop etme. Önce veri envanteri çıkar.

---

# 8. Taxonomy katmanını güvenli şekilde pasifleştirme

## 8.1. Fiziksel drop yapma

İlk deployment'ta aşağıdaki tabloları drop etme:

```text
taxonomy_groups
taxonomy_options
role_taxonomy_rules
user/profile taxonomy selection tabloları
```

Sebep:

- eski veriyi kaybetmemek,
- rollback yapabilmek,
- mevcut migration zincirini kırmamak,
- label sistemine geçişte eski değerleri dönüştürebilmek.

## 8.2. Soft-decommission migration

Yeni migration oluştur:

```text
supabase/migrations/YYYYMMDDHHMMSS_retire_taxonomy_runtime_and_item_overrides.sql
```

Bu migration:

1. Taxonomy tablolarını drop etmez.
2. Taxonomy tablolarına açıklama ekler:

```sql
comment on table public.taxonomy_groups is
'DEPRECATED: retired from active product flow. Keep temporarily for rollback and future label migration.';
```

3. Mevcut taxonomy veri sayılarını audit amaçlı kaydeder.
4. Aktif RPC'lerde taxonomy join kullanımını kaldırır.
5. Item-level override kayıt sayılarını raporlar.
6. Mevcut item-level override tablolarını drop etmez.
7. Gerekirse `deprecated_at` veya açıklama comment ekler.

## 8.3. Veri envanteri SQL raporu

Codex migration öncesi aşağıdaki raporu üretmelidir:

```sql
select 'taxonomy_groups' as source, count(*) from public.taxonomy_groups
union all
select 'taxonomy_options', count(*) from public.taxonomy_options
union all
select 'role_taxonomy_rules', count(*) from public.role_taxonomy_rules;
```

Ayrıca item-level override tablolarının gerçek isimlerini şemadan tespit ederek count raporu üretmelidir.

## 8.4. Label sistemine hazırlık

Bugün label sistemi zorunlu değildir.

Ancak gelecekte basit yapı yeterlidir:

```text
labels
catalog_item_labels
```

Önerilen gelecek şema:

```sql
create table public.labels (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.catalog_item_labels (
  catalog_item_id uuid not null references public.catalog_items(id) on delete cascade,
  label_id uuid not null references public.labels(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (catalog_item_id, label_id)
);
```

Bu label sistemi:

- AFS davranışı değiştirmez,
- yalnızca arama ve filtreleme içindir,
- role bağlı değildir,
- zorunlu seçim mantığı taşımaz,
- admin kafa karışıklığı yaratmaz.

Bu çalışma sırasında bu tabloları oluşturmak opsiyoneldir. Kullanılmayacaksa şimdi oluşturma.

---

# 9. `catalog_categories` için geçiş kararı

Projede katalog kayıtları için şu ilişkiler bulunabilir:

```text
catalog_categories
catalog_item_categories
```

Bunları taxonomy engine ile karıştırma.

Karar:

1. Bu tablolar şu anda mevcut katalog verilerinde kullanılıyorsa hemen drop etme.
2. Rol davranışı hesaplamak için kullanma.
3. Admin taxonomy ekranına bağlama.
4. Şimdilik yalnızca legacy metadata veya read-only kategori etiketi olarak kalabilir.
5. İleride `labels` sistemine migrate edilebilir.

Geçici ürün dili:

```text
catalog_categories = legacy read-only labels
taxonomy_*          = retired
roles + AFS         = aktif davranış sistemi
```

---

# 10. Canonical veri tablosu

## 10.1. Ana kayıt tablosu

Tüm aranabilir ve yönetilebilir profil/katalog kayıtları için canonical ana tablo:

```text
public.catalog_items
```

Örnek kayıtlar:

```text
Umut Barış Terzioğlu          → User_Bireysel
Dr. Ayşe Yılmaz               → Healthcare_Doktor
Mehmet Kaya Hukuk             → Consultant_Avukat
Yıldız Bakkal                 → Business_Market_Bakkal
Berlin Türk Derneği           → Organization_Dernek_Vakif
T.C. Berlin Başkonsolosluğu   → Organization_Konsolosluk
```

## 10.2. Tek tablo ifadesinin sınırı

“Tüm verilerin olduğu tek tablo” ürün ve admin ekranı açısından doğrudur:

```text
/admin/data
→ tek kayıt listesi
→ catalog_items canonical kaynak
```

Ancak SQL tasarımında her şeyi aynı fiziksel kolona doldurma.

Aşağıdaki yardımcı tablolar korunmalıdır:

```text
roles
attribute_catalog
role_attribute_rules
feature_catalog
role_feature_flags
profile_section_catalog
role_profile_section_rules
catalog item attribute value tabloları
catalog item owners/editors tabloları
user_feature_overrides
admin_audit_logs
```

Bu yardımcı tablolar, tek kayıt tablosunu destekleyen normalize yapılardır.

## 10.3. Legacy profile bridge

Mevcut kullanıcı auth profilleri için `user_profiles` gibi legacy bridge tabloları kalabilir.

Ancak hedef:

```text
auth user
  ↓
personal catalog item
  ↓
catalog_items
```

Public directory ve admin veritabanı mümkün olduğunca `catalog_items` üzerinden çalışmalıdır.

---

# 11. Veritabanı ekranı UX hedefi

## 11.1. Liste kolonları

Önerilen kolonlar:

| Kolon | Açıklama |
|---|---|
| Kayıt | Profil veya katalog başlığı |
| Rol | Read-only role label |
| Durum | draft / published / archived |
| Görünürlük | public / private |
| Doğrulama | verified / claimed / vb. |
| Şehir | primary city |
| Ülke | primary country |
| Kaynak | import / manuel / official source |
| Güncelleme | updated_at |

## 11.2. Filtreler

Korunacak filtreler:

```text
Arama
Rol
Durum
Görünürlük
Doğrulama
Şehir
Ülke
Kaynak
```

Kaldırılacak filtreler:

```text
Taxonomy grup
Taxonomy option
Taxonomy required
```

## 11.3. Sağ drawer

Önerilen sekmeler:

### Özet

```text
Başlık
Read-only rol
Durum
Görünürlük
Kaynak
Doğrulama
Oluşturulma tarihi
Güncelleme tarihi
```

### Attribute Değerleri

```text
Alan adı
Alan tipi
Değer
Public / private visibility
Kaydet
```

### Sahipler / Editörler

Bu özellik mevcut ürün akışında gerçekten kullanılıyorsa korunabilir.

### Claim Talepleri

Bu özellik mevcut ürün akışında gerçekten kullanılıyorsa korunabilir.

Drawer içinde yer almaması gerekenler:

```text
Rol değiştirme
Item-level Attribute override
Item-level Feature override
Item-level Profile Section override
Taxonomy yönetimi
```

---

# 12. Backend temizlik sırası

## Faz 0 — Envanter ve güvenlik

Codex önce schema envanteri çıkarsın:

- `roles` toplam satır sayısı
- aktif roller
- taxonomy tablo satır sayıları
- item-level override tablo satır sayıları
- `catalog_items` içinde rolü null olan kayıtlar
- bilinmeyen role key kullanan kayıtlar
- `user_feature_overrides` toplam satır sayısı
- taxonomy kullanan RPC, view, trigger ve function listesi
- item-level override kullanan RPC, view, trigger ve function listesi

Rapor dosyası:

```text
docs/architecture/simplification-inventory-report.md
```

## Faz 1 — UI sadeleştirme

- Navigation taxonomy linkini kaldır.
- Taxonomy route'u redirect yap.
- AdminCatalogPage başlığını `Veritabanı` yap.
- Sağ drawer'dan `CatalogItemRolePanel` kaldır.
- Sağ drawer'dan `CatalogItemRuleManager` kaldır.
- `CatalogEntityProfilePanel` feature bölümünü kaldır.
- Drawer'ı attribute değer düzenleme odaklı hale getir.

## Faz 2 — Runtime taxonomy bağımlılığını kaldırma

- Legacy profile payload taxonomy mapping kaldır.
- ProfilePage taxonomy kartını kaldır.
- Public profile taxonomy badges kaldır.
- Profile type section listelerinden taxonomy çıkar.
- RPC response taxonomy payload kaldır veya ignore et.
- Public renderer boş taxonomy durumunda kırılmamalı.

## Faz 3 — Runtime item-level override bağımlılığını kaldırma

- `get_catalog_item_rules` çözümlemesinde item-level AFS override uygulamasını kapat.
- Runtime yalnızca rol AFS kurallarını kullansın.
- User-level feature override korunmalı.
- Eski item-level override kayıtları raporlanmalı.
- Eski kayıtları doğrudan drop etme.

## Faz 4 — Rol atama standardı

- `catalog_items.platform_role_key` zorunlu hale getirilmeye hazırlanmalı.
- Null roller için migration raporu üret.
- Yeni importlar role key olmadan kabul edilmemeli.
- Yeni manuel kayıtlar role key olmadan kaydedilmemeli.
- Standart admin UI rol değiştirmemeli.
- Hatalı veri düzeltmeleri maintenance RPC ile yapılmalı.

## Faz 5 — Dokümantasyon

Güncellenecek belgeler:

```text
docs/architecture/role-afs-simplified-model.md
docs/architecture/taxonomy-retired.md
docs/architecture/admin-database-screen.md
docs/architecture/feature-override-policy.md
docs/architecture/simplification-inventory-report.md
```

---

# 13. Dosya bazlı görev listesi

## Zorunlu frontend görevleri

```text
src/components/admin/admin-navigation.ts
  - Taxonomy menü satırını kaldır.

src/App.tsx
  - AdminTaxonomyPage import'unu kaldır.
  - taxonomy route'unu guide redirect'e çevir.

src/pages/admin/AdminCatalogPage.tsx
  - Başlığı Veritabanı olarak değiştir.
  - CatalogItemRolePanel import ve render kullanımını kaldır.
  - handleSelectedItemRoleChanged callback'ini kaldır.
  - Drawer'ı attribute düzenleme odaklı sadeleştir.

src/components/admin/catalog/CatalogEntityProfilePanel.tsx
  - Feature override kartını kaldır.
  - Yalnızca metadata + attributes bırak.
  - Rol bilgisini read-only göster.

src/components/admin/catalog/CatalogItemRolePanel.tsx
  - Standart UI kullanımından çıkar.
  - Kullanım yoksa sil veya archive et.

src/components/admin/catalog/CatalogItemRuleManager.tsx
  - Standart UI kullanımından çıkar.
  - Kullanım yoksa sil veya archive et.

src/pages/admin/AdminTaxonomyPage.tsx
  - Aktif ürün akışından çıkar.
  - Kullanım yoksa sil veya archive et.

src/lib/member-profile.ts
  - taxonomyGroups type ve mapping kullanımını kaldır.

src/lib/profile-types.ts
  - taxonomy section key'lerini kaldır.

src/lib/profile-view-model.ts
  - taxonomy badge ve section üretimini kaldır.
  - empty labels fallback ekle.

src/pages/ProfilePage.tsx
  - taxonomy kartlarını ve seçim UI'larını kaldır.
```

## Zorunlu backend görevleri

```text
supabase/migrations/YYYYMMDDHHMMSS_retire_taxonomy_runtime_and_item_overrides.sql
  - taxonomy tablolarını drop etme.
  - açıklama / deprecation comment ekle.
  - ilgili RPC output ve runtime çözümlemelerini sadeleştir.
  - item-level AFS override kullanımını runtime'dan çıkar.
  - bakım RPC'si ekle veya mevcut rol RPC'sini maintenance-only yap.
  - audit log yaz.
```

## Kontrol edilecek backend nesneleri

Codex, schema içinden gerçek isimleri keşfetmelidir:

```text
get_current_user_profile
get_public_profile_sections
get_catalog_item_profile
get_catalog_item_rules
admin_set_catalog_item_role
admin_upsert_catalog_item_attribute_override
admin_delete_catalog_item_attribute_override
admin_upsert_catalog_item_feature_override
admin_delete_catalog_item_feature_override
admin_upsert_catalog_item_section_override
admin_delete_catalog_item_section_override
```

---

# 14. Test planı

## 14.1. AFS matrisi testleri

### Test AFS-01

```text
Given Healthcare_Doktor rolü seçilir
When license_number attribute aktif ve zorunlu yapılır
Then bu role bağlı profil düzenleme ekranında alan görünür
And alan zorunlu olur
```

### Test AFS-02

```text
Given Business_Market_Bakkal rolü seçilir
When detail.services section kapatılır
Then bu role bağlı public profilde section görünmez
```

### Test AFS-03

```text
Given bir feature rol matrisinde kapatılır
Then aynı role bağlı kayıtların runtime davranışı değişir
And tek tek kayıt güncellemesi gerekmez
```

## 14.2. Veritabanı drawer testleri

### Test DB-01

```text
Given admin /admin/data ekranındadır
When bir katalog kaydı seçilir
Then sağ drawer açılır
And attribute değerleri düzenlenebilir
And rol read-only görünür
And rol dropdown görünmez
And Rolü Kaydet butonu görünmez
```

### Test DB-02

```text
Given admin bir attribute değerini değiştirir
When Kaydet butonuna basar
Then değer güncellenir
And drawer yeniden açıldığında yeni değer görünür
```

### Test DB-03

```text
Given drawer açıktır
Then item-level feature override kontrolü görünmez
And item-level section override kontrolü görünmez
And item-level attribute rule override kontrolü görünmez
```

## 14.3. Feature Override testleri

### Test FO-01

```text
Given belirli bir login kullanıcısı seçilir
When directory.visible feature override açık yapılır ve reason girilir
Then override kaydedilir
And runtime kaynağı override olarak görünür
And audit log oluşur
```

### Test FO-02

```text
Given reason boş bırakılır
When override kaydedilmeye çalışılır
Then işlem reddedilir
```

### Test FO-03

```text
Given override kaldırılır
Then kullanıcı yeniden role default davranışına döner
```

## 14.4. Taxonomy retirement testleri

### Test TAX-01

```text
Given admin menüsü açılır
Then Taxonomy Yönetimi menü maddesi görünmez
```

### Test TAX-02

```text
Given /admin/new-member/taxonomy URL'si açılır
Then guide veya uygun yeni sayfaya redirect olur
```

### Test TAX-03

```text
Given kullanıcı profil sayfası açılır
Then taxonomy seçim kartı görünmez
And profil sayfası hata vermez
```

### Test TAX-04

```text
Given public profil açılır
Then taxonomy payload boş olsa bile profil render edilir
```

## 14.5. Rol bakım yolu testleri

### Test MAINT-01

```text
Given normal admin drawer açıktır
Then rol değiştirme UI'sı görünmez
```

### Test MAINT-02

```text
Given admin maintenance RPC çağırır
When reason boş ise
Then işlem reddedilir
```

### Test MAINT-03

```text
Given admin maintenance RPC geçerli reason ile çağırır
Then catalog_items.platform_role_key değişir
And before / after değerleri audit log içine yazılır
```

---

# 15. Kabul kriterleri

Çalışma tamamlandığında aşağıdaki koşulların tamamı sağlanmalıdır.

## Admin navigation

- [ ] Taxonomy Yönetimi menüden kaldırılmıştır.
- [ ] Eski taxonomy route yeni uygun sayfaya redirect eder.
- [ ] Menüde Veritabanı, Tüm Roller AFS Matrisi, Feature Override ve Kullanım Kılavuzu bulunur.

## AFS

- [ ] Roller `roles` tablosundan okunur.
- [ ] Attribute, Feature ve Profile Section ayarları tek AFS ekranından yönetilir.
- [ ] Taxonomy AFS matrisine dahil edilmez.
- [ ] Item-level AFS override standart UI'da yoktur.
- [ ] Runtime çözümleme role-level AFS kurallarına dayanır.

## Veritabanı ekranı

- [ ] `/admin/data` tek kayıt tablosudur.
- [ ] Başlık `Veritabanı` olarak görünür.
- [ ] Sağ drawer rol değiştirme UI'sı içermez.
- [ ] Sağ drawer item-level feature veya section override içermez.
- [ ] Sağ drawer attribute değerlerinin düzenlenmesini destekler.
- [ ] Rol bilgisi gerekiyorsa read-only metadata olarak gösterilir.

## Feature Override

- [ ] User Feature Override ekranı korunmuştur.
- [ ] Override yalnızca kullanıcı bazında uygulanır.
- [ ] Reason zorunludur.
- [ ] Override ekleme ve kaldırma audit log üretir.

## Taxonomy

- [ ] Taxonomy admin ekranı aktif akıştan çıkarılmıştır.
- [ ] Taxonomy seçimleri profil UI'da görünmez.
- [ ] Taxonomy runtime payload bağımlılığı kaldırılmıştır.
- [ ] Eski taxonomy tabloları ilk aşamada drop edilmemiştir.
- [ ] Eski taxonomy verisi envanter raporunda kayıt altına alınmıştır.

## Güvenlik ve rollback

- [ ] Hatalı rol düzeltmesi için standart UI dışında bakım yolu vardır.
- [ ] Bakım yolu yalnızca admin erişimine açıktır.
- [ ] Bakım yolu reason zorunlu tutar.
- [ ] Bakım işlemleri audit log üretir.
- [ ] Migration rollback notları dokümante edilmiştir.

---

# 16. Codex çalışma kuralları

Codex aşağıdaki sırayı izlemelidir:

1. Önce kodu ve Supabase schema nesnelerini keşfet.
2. Mevcut taxonomy ve item-level override kullanım noktalarını listele.
3. Envanter raporunu oluştur.
4. Frontend sadeleştirmesini yap.
5. Backend soft-decommission migration ekle.
6. Runtime çözümleme akışını sadeleştir.
7. Testleri ekle ve çalıştır.
8. Build ve typecheck çalıştır.
9. Değişen dosyaları listele.
10. Silinen, arşivlenen ve pasifleştirilen alanları ayrı ayrı raporla.

Codex doğrudan tablo drop etmemelidir.

Codex yeni paralel rol sistemi oluşturmamalıdır.

Codex taxonomy yerine bugün yeni karmaşık bir label yönetim sistemi kurmamalıdır.

Codex standard admin drawer içine gizli veya advanced rol değiştirme aksiyonu koymamalıdır.

Codex item-level AFS override UI'sını başka bir sekmeye taşıyarak korumaya çalışmamalıdır. Standart ürün akışından tamamen çıkarmalıdır.

---

# 17. Codex'e verilecek kısa komut

Aşağıdaki metni Codex görev açıklamasının en üstüne koy:

```text
CorteQS MVP admin ve profil sistemini sadeleştir.

Taxonomy katmanını aktif ürün akışından kaldır. Taxonomy tablolarını ilk aşamada fiziksel olarak drop etme; runtime bağımlılığını, admin menüsünü, route'u ve profil UI kullanımını kaldır. Eski veriyi rollback ve ileride label migration ihtimali için koru.

Tek canonical rol kaynağı public.roles olsun. Yaklaşık 82 rolün Attribute, Feature ve Profile Section kuralları yalnızca /admin/new-member/role-matrix ekranından yönetilsin.

Admin Veritabanı ekranı /admin/data tüm kayıtları tek listede göstersin. Seçilen kaydın sağ drawer'ında rol değiştirme dropdown ve butonunu kaldır. Item-level attribute rule, feature ve profile section override yönetimini de kaldır. Sağ drawer yalnızca read-only özet, attribute değerleri ve gerekiyorsa sahip/editör ve claim bilgilerini içersin.

Çok özel istisnalar için yalnızca user_feature_overrides mekanizmasını koru. Override reason zorunlu olsun ve audit log yazsın.

Rol kayıt oluşturma veya import sırasında zorunlu atansın. Hatalı rol düzeltmesi için standart UI dışında, yalnızca admin erişimli, reason zorunlu ve audit log yazan maintenance RPC bırak.

Yeni paralel sistem oluşturma. Önce schema envanteri çıkar, sonra frontend sadeleştirme, backend soft-decommission migration, testler, build ve typecheck adımlarını tamamla. Sonunda değişen dosyaları ve kabul kriterlerinin durumunu raporla.
```

---

# 18. Beklenen sonuç

Çalışma tamamlandığında admin için zihinsel model yalnızca şu olacaktır:

```text
Veritabanı
→ bütün kayıtları gör
→ kayıt seç
→ attribute değerlerini düzenle

Tüm Roller AFS Matrisi
→ rol seç
→ attribute, feature ve profile section davranışını ayarla

Feature Override
→ sadece çok özel kullanıcı istisnası tanımla
```

Taxonomy ekranı, item-level AFS override ve veritabanı drawer içindeki rol değiştirme aksiyonu artık kafa karışıklığı yaratmayacaktır.
