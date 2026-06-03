# CorteQS Roles / Attributes / Features Sistemi — MVP Teknik Döküman

## 1. Amaç

Bu dokümanın amacı, CorteQS projesinde MVP seviyesinde kullanılacak **role / attribute / feature / permission** sistemini netleştirmek ve geliştirilebilir bir teknik altyapı tanımlamaktır.

Sistem şu prensiple kurulacaktır:

- Her kullanıcı sisteme ilk etapta **Bireysel** olarak girer.
- Kullanıcı daha sonra profilinden farklı role geçiş için başvuru yapabilir.
- MVP’de her kullanıcıda **tek aktif rol** olur.
- Buna rağmen admin, kullanıcı bazlı **feature override** verebilir.
- Attribute yapısı sabit kolonlara gömülmez; **attribute catalog** yaklaşımıyla genişletilebilir kurulur.
- Public directory yalnızca **admin onaylı profilleri** gösterir.
- Role, feature, approval ve visibility kararları admin panelinden yönetilebilir hale getirilir.
- Güvenlik sadece frontend’e bırakılmaz; **Frontend Guard + Supabase RLS + RPC kontrollü yazma işlemleri** birlikte kullanılır.

---

## 2. Karar Özeti

| Konu | Karar |
|---|---|
| İlk kayıt rolü | Herkes önce `individual / Bireysel` başlar |
| Rol değiştirme | Kullanıcı profilinden role başvurusu açabilir |
| MVP rol sayısı | Kullanıcı başına 1 aktif rol |
| Çoklu rol | MVP sonrası değerlendirilecek |
| User-specific feature override | MVP’de admin panelinde görünecek |
| Attribute yapısı | Attribute katalog sistemi |
| Ortak attribute sayısı | İlk etapta 5 ortak attribute |
| Role özel attribute sayısı | İlk etapta her rol için 1 özel attribute |
| Public directory | Evet |
| Directory kapsamı | Tüm roller listelenebilir |
| Directory görünürlüğü | Sadece admin onaylı profiller |
| Admin approval queue | Ayrı `approval_requests` tablosu |
| Admin değişiklik logları | Loglanacak |
| Permission enforcement | Frontend Guard + Supabase RLS + RPC |
| MVP kapsamı | Hepsi, fakat küçük fazlara bölünerek |

---

## 3. Roller

## 3.1 Role Key ve Label Standardı

| Role Key | Türkçe Label | Açıklama |
|---|---|---|
| `individual` | Bireysel | Normal diaspora üyesi |
| `consultant` | Consultant | Uzman / ücretli hizmet sunan kişi |
| `business` | İşletme | Fiziksel veya dijital ticari yapı |
| `organization` | Kuruluş | Dernek, STK, mezun grubu, topluluk veya resmi yapı |
| `influencer` | Influencer | İçerik, tanıtım, referral ve kampanya odaklı profil |
| `ambassador` | Elçi | Şehir veya bölge bazlı temsilci; ileride daha fazla yetki alabilir |

---

## 3.2 Rol Tanımları

### Bireysel

Bireysel kullanıcı, CorteQS içinde kendisini temsil eden normal diaspora üyesidir.

Örnekler:

- Yeni bir şehirde yaşayan kişi
- Topluluk üyesi
- Etkinlik arayan kullanıcı
- Bağlantı kurmak isteyen birey
- Daha sonra ek feature alabilecek temel kullanıcı tipi

---

### Consultant

Consultant, bireysel kullanıcıdan farklı olarak uzmanlık veya ücretli hizmet sunan kişidir.

Örnekler:

- Avukat
- Vergi danışmanı
- Relocation danışmanı
- Kariyer danışmanı
- Doktor
- Eğitim danışmanı

İleride alt kırılımlar eklenebilir.

---

### İşletme

İşletme, fiziksel veya dijital ticari yapıyı temsil eder.

Örnekler:

- Restoran
- Kafe
- Market
- Klinik
- Ajans
- Online servis
- Mağaza

İleride sektör ve kategori alt kırılımları eklenebilir.

---

### Kuruluş

Kuruluş; dernek, STK, okul mezun topluluğu, resmi kurum veya topluluk yapılarını temsil eder.

Örnekler:

- Dernek
- Vakıf
- Mezun grubu
- Öğrenci topluluğu
- Resmi kurum
- Gönüllü organizasyon

---

### Influencer

Influencer, içerik üretimi, tanıtım, referral, kampanya ve özel görünürlük odaklı profildir.

MVP’de basic yapı kurulacak; kampanya ve gelişmiş referral yetkileri daha sonra genişletilecektir.

---

### Elçi

Elçi, bireysel kullanıcıdan daha fazla yetkiye sahip olacak şehir / bölge temsilcisidir.

MVP’de sadece temel temsilci profili kurulacaktır. Şehir bazlı moderasyon, öneri onayı ve yerel yönetim yetkileri sonraki faza bırakılacaktır.

---

## 4. Kayıt ve Rol Akışı

## 4.1 İlk Kayıt

Yeni kullanıcı Google OAuth ile sisteme giriş yaptıktan sonra otomatik olarak `individual` rolüyle başlar.

Akış:

1. Kullanıcı Google ile giriş yapar.
2. `user_profiles` kaydı oluşturulur.
3. `user_role_assignments` içinde kullanıcıya `individual` rolü atanır.
4. Kullanıcı `/profile` sayfasına yönlendirilir.
5. Kullanıcı profilini tamamlar.
6. Kullanıcı isterse profilinden rol başvurusu açar.

---

## 4.2 Rol Başvurusu

Kullanıcı profilinden şu roller için başvuru yapabilir:

- Consultant
- İşletme
- Kuruluş
- Influencer
- Elçi

Başvuru akışı:

1. Kullanıcı profilinden “Rol Başvurusu” alanına girer.
2. Başvurmak istediği rolü seçer.
3. Gerekli açıklama / ek bilgi girer.
4. Sistem `approval_requests` tablosuna kayıt açar.
5. Admin başvuruyu inceler.
6. Admin onaylarsa kullanıcının aktif rolü değişir.
7. Admin reddederse kullanıcıya durum gösterilir.

---

## 4.3 Tek Rol + Feature Override Mantığı

MVP’de kullanıcıda tek aktif rol olacaktır.

Ancak admin, bir kullanıcıya rolünden bağımsız olarak özel feature açabilir veya kapatabilir.

Örnek:

- Normalde Bireysel kullanıcı etkinlik oluşturamaz.
- Admin belirli bir Bireysel kullanıcıya `events.create = true` override verebilir.
- Bu durumda kullanıcı rolü değişmeden ekstra yetki kazanır.

Bu yapı için mevcut `user_feature_overrides` yaklaşımı kullanılmalıdır.

---

## 5. Attribute Sistemi

## 5.1 Ana Prensip

Attribute sistemi esnek ve genişletilebilir olmalıdır.

Bu nedenle role özel alanlar doğrudan `user_profiles` tablosuna kolon olarak eklenmemelidir.

Önerilen yaklaşım:

- Temel ve çok sık kullanılan alanlar `user_profiles` içinde tutulabilir.
- Role özel alanlar `attribute_catalog` ve `user_profile_attributes` benzeri katalog yapısıyla yönetilmelidir.
- Hangi attribute’un hangi rolde görüneceği admin panelinden yönetilebilir olmalıdır.
- Attribute görünürlüğü ve approval gereksinimi ayarlanabilir olmalıdır.

---

## 5.2 Ortak 5 Attribute

MVP’de tüm rollerde ortak olacak attribute’lar:

| Attribute Key | Label | Açıklama | Önerilen DB Yeri |
|---|---|---|---|
| `full_name` | Ad Soyad / Görünen İsim | Kullanıcının veya profilin görünen adı | `user_profiles` |
| `country` | Ülke | Kullanıcının / profilin bulunduğu ülke | `user_profiles` veya attribute |
| `city` | Şehir | Kullanıcının / profilin bulunduğu şehir | `user_profiles` veya attribute |
| `profile_photo_url` | Profil Görseli | Profil fotoğrafı veya logo | `user_profiles` |
| `bio_short` | Kısa Açıklama | Kısa profil açıklaması | `user_profiles` |

Not:

`full_name` alanı UI tarafında role göre farklı label ile gösterilebilir:

| Rol | UI Label |
|---|---|
| Bireysel | Ad Soyad |
| Consultant | Ad Soyad / Uzman Adı |
| İşletme | İşletme Adı |
| Kuruluş | Kuruluş Adı |
| Influencer | Görünen İsim |
| Elçi | Ad Soyad |

Bu sayede MVP’de gereksiz kolon karmaşası oluşmaz.

---

## 5.3 İlk Role Özel Attribute Seti

Kullanıcının tercihine göre MVP’de her rol için sadece 1 özel attribute tanımlanacaktır.

| Role Key | Attribute Key | Label | Açıklama |
|---|---|---|---|
| `individual` | `interests` | İlgi Alanları | Bireysel kullanıcının ilgi alanları |
| `consultant` | `expertise_area` | Uzmanlık Alanı | Consultant’ın ana uzmanlık alanı |
| `business` | `business_category` | İşletme Kategorisi | İşletmenin faaliyet kategorisi |
| `organization` | `organization_type` | Kuruluş Türü | Dernek, vakıf, mezun grubu vb. |
| `influencer` | `main_platform` | Ana Platform | Instagram, YouTube, TikTok, LinkedIn vb. |
| `ambassador` | `ambassador_city` | Sorumlu Şehir | Elçinin temsil ettiği şehir |

---

## 5.4 Gelecekte Eklenebilecek Attribute Örnekleri

Bu alanlar MVP sonrasında attribute catalog üzerinden eklenebilir.

### Bireysel

- `profession`
- `languages`
- `relocation_status`
- `community_goal`
- `open_to_connect`

### Consultant

- `service_cities`
- `service_languages`
- `booking_url`
- `price_info`
- `verification_status`

### İşletme

- `address`
- `opening_hours`
- `business_phone`
- `business_website`
- `google_maps_url`

### Kuruluş

- `mission_statement`
- `target_audience`
- `contact_person`
- `official_website`
- `organization_city`

### Influencer

- `follower_range`
- `content_categories`
- `media_kit_url`
- `referral_code`
- `campaign_status`

### Elçi

- `ambassador_region`
- `local_groups`
- `event_support_status`
- `moderation_scope`
- `ambassador_level`

---

## 6. Attribute Veri Modeli Önerisi

## 6.1 `attribute_catalog`

Attribute tanımlarını tutar.

Önerilen kolonlar:

| Kolon | Tip | Açıklama |
|---|---|---|
| `id` | uuid | Primary key |
| `key` | text | Benzersiz attribute key |
| `label` | text | UI label |
| `description` | text | Açıklama |
| `data_type` | text | `text`, `textarea`, `select`, `multi_select`, `url`, `phone`, `boolean`, `json` |
| `is_active` | boolean | Aktif mi |
| `is_system` | boolean | Sistem attribute’u mu |
| `sort_order` | integer | Sıralama |
| `created_at` | timestamptz | Oluşturulma tarihi |
| `updated_at` | timestamptz | Güncellenme tarihi |

---

## 6.2 `role_attribute_rules`

Hangi attribute’un hangi rolde açık olduğunu belirler.

Önerilen kolonlar:

| Kolon | Tip | Açıklama |
|---|---|---|
| `id` | uuid | Primary key |
| `role_id` | uuid | `roles.id` |
| `attribute_id` | uuid | `attribute_catalog.id` |
| `is_enabled` | boolean | Bu rolde açık mı |
| `is_required` | boolean | Zorunlu mu |
| `is_public_default` | boolean | Varsayılan public mi |
| `user_can_edit` | boolean | Kullanıcı düzenleyebilir mi |
| `user_can_hide` | boolean | Kullanıcı gizleyebilir mi |
| `requires_admin_approval_on_change` | boolean | Değişince admin onayı gerekir mi |
| `sort_order` | integer | Form sıralaması |

---

## 6.3 `user_profile_attributes`

Kullanıcı attribute değerlerini tutar.

Önerilen kolonlar:

| Kolon | Tip | Açıklama |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | `auth.users.id` |
| `attribute_id` | uuid | `attribute_catalog.id` |
| `value_text` | text | Text değer |
| `value_json` | jsonb | Çoklu / karmaşık değer |
| `visibility` | text | `public`, `private` |
| `approval_status` | text | `draft`, `pending`, `approved`, `rejected` |
| `approved_by` | uuid | Admin user id |
| `approved_at` | timestamptz | Onay tarihi |
| `created_at` | timestamptz | Oluşturulma tarihi |
| `updated_at` | timestamptz | Güncellenme tarihi |

---

## 6.4 Attribute Visibility Mantığı

Admin tüm alanları görür.

Kullanıcı, izin verilen alanlarda görünürlüğü kendisi seçebilir.

Önerilen visibility değerleri:

| Değer | Açıklama |
|---|---|
| `public` | Public directory’de görünebilir |
| `private` | Public profilde görünmez; kullanıcı ve admin görebilir |

Varsayılan mantık:

| Alan Tipi | Varsayılan Visibility |
|---|---|
| Ad / görünen isim | `public` |
| Ülke | `public` |
| Şehir | `public` |
| Profil görseli | `public` |
| Bio | `public` |
| Email | `private` |
| Telefon | `private` |
| WhatsApp | `private` |
| LinkedIn | `private` veya `public` kullanıcı seçimine bağlı |
| Website | `public` veya kullanıcı seçimine bağlı |
| Doğrulama durumu | `public` |

---

## 7. Feature Sistemi

## 7.1 Feature Key Standardı

Feature key formatı:

```txt
module.action
```

Örnekler:

```txt
profile.view_own
profile.edit_own
directory.visible
events.create
offers.create
referral.create
city.manage
```

---

## 7.2 MVP Feature Listesi

Kullanıcı tüm feature önerilerini MVP kapsamına almak istemiştir.

| No | Feature Key | Açıklama |
|---:|---|---|
| 1 | `profile.view_own` | Kendi profilini görme |
| 2 | `profile.edit_own` | Kendi profilini düzenleme |
| 3 | `profile.edit_public` | Public profil alanlarını düzenleme |
| 4 | `directory.visible` | Public directory’de görünme |
| 5 | `directory.featured` | Öne çıkarılmış profilde görünme |
| 6 | `contact.receive` | İletişim talebi alma |
| 7 | `contact.show_whatsapp` | WhatsApp bilgisini gösterebilme |
| 8 | `content.create` | İçerik/post oluşturma |
| 9 | `content.edit_own` | Kendi içeriğini düzenleme |
| 10 | `events.create` | Etkinlik oluşturma |
| 11 | `offers.create` | Hizmet/teklif oluşturma |
| 12 | `referral.create` | Referral/davet linki oluşturma |
| 13 | `city.manage` | Şehir bazlı yönetim/moderasyon |
| 14 | `admin.requires_approval` | İşlem admin onayı gerektirir |

Not:

`admin.requires_approval` gerçek bir kullanıcı aksiyonundan çok sistem davranışını belirleyen meta feature gibi düşünülmelidir. Orta vadede bunu ayrı `approval_rules` yapısına taşımak daha temiz olabilir.

---

## 8. İlk Role / Feature Matrisi

Aşağıdaki matris MVP için başlangıç önerisidir.

Değerler:

| Değer | Anlam |
|---|---|
| ✅ | Açık |
| ❌ | Kapalı |
| Sınırlı | Limitli kullanım |
| Admin | Admin onayı / aktivasyonu gerekli |
| Sonra | MVP sonrası |

| Feature | Bireysel | Consultant | İşletme | Kuruluş | Influencer | Elçi |
|---|---:|---:|---:|---:|---:|---:|
| `profile.view_own` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `profile.edit_own` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `profile.edit_public` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `directory.visible` | Admin | Admin | Admin | Admin | Admin | Admin |
| `directory.featured` | ❌ | Admin | Admin | Admin | Admin | Admin |
| `contact.receive` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `contact.show_whatsapp` | Admin | Admin | Admin | Admin | Admin | Admin |
| `content.create` | Sınırlı | ✅ | ✅ | ✅ | ✅ | ✅ |
| `content.edit_own` | Sınırlı | ✅ | ✅ | ✅ | ✅ | ✅ |
| `events.create` | ❌ | Admin | Admin | Admin | Admin | Admin |
| `offers.create` | ❌ | Admin | Admin | Admin | ❌ | ❌ |
| `referral.create` | Sınırlı | Admin | Admin | Admin | Admin | Admin |
| `city.manage` | ❌ | ❌ | ❌ | ❌ | ❌ | Sonra |
| `admin.requires_approval` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 9. Admin Onayı Gereken İşlemler

İlk MVP’de aşağıdaki işlemler admin onayına bağlı olacaktır.

| İşlem | Admin Onayı |
|---|---:|
| Consultant rolüne geçiş | Gerekli |
| İşletme rolüne geçiş | Gerekli |
| Kuruluş rolüne geçiş | Gerekli |
| Influencer rolüne geçiş | Gerekli |
| Elçi rolüne geçiş | Gerekli |
| Public directory’de görünme | Gerekli |
| Telefon / WhatsApp yayınlama | Gerekli |
| Etkinlik oluşturma | Gerekli |
| Hizmet / teklif oluşturma | Gerekli |
| Featured profile olma | Gerekli |
| Referral link oluşturma | Gerekli |
| Şehir bazlı moderasyon | Gerekli, fakat MVP sonrası |

---

## 10. Approval Queue Tasarımı

## 10.1 Ana Yaklaşım

Approval queue ayrı tablo olarak tasarlanmalıdır.

Tablo adı:

```txt
approval_requests
```

Bu tablo, farklı tipte onay taleplerini merkezi şekilde yönetir.

---

## 10.2 Approval Request Tipleri

Önerilen `request_type` değerleri:

| Request Type | Açıklama |
|---|---|
| `role_change` | Rol değişikliği talebi |
| `directory_visibility` | Public directory görünürlük talebi |
| `contact_visibility` | Telefon / WhatsApp / iletişim görünürlüğü talebi |
| `featured_listing` | Öne çıkarılmış profil talebi |
| `event_create` | Etkinlik oluşturma talebi |
| `offer_create` | Hizmet / teklif oluşturma talebi |
| `referral_create` | Referral link talebi |
| `attribute_change` | Onay gerektiren attribute değişikliği |
| `city_manage` | Şehir bazlı moderasyon / yönetim talebi |

---

## 10.3 `approval_requests` Tablosu

Önerilen kolonlar:

| Kolon | Tip | Açıklama |
|---|---|---|
| `id` | uuid | Primary key |
| `request_type` | text | Talep tipi |
| `user_id` | uuid | Talep sahibi |
| `target_role_key` | text | Rol başvurusu için hedef rol |
| `target_feature_key` | text | Feature başvurusu için hedef feature |
| `target_entity_type` | text | `profile`, `event`, `offer`, `attribute` vb. |
| `target_entity_id` | uuid | İlgili kayıt id |
| `payload` | jsonb | Talep detayları |
| `status` | text | `pending`, `approved`, `rejected`, `cancelled` |
| `admin_note` | text | Admin notu |
| `reviewed_by` | uuid | İnceleyen admin |
| `reviewed_at` | timestamptz | İnceleme tarihi |
| `created_at` | timestamptz | Oluşturulma tarihi |
| `updated_at` | timestamptz | Güncellenme tarihi |

---

## 11. Audit Log Tasarımı

Admin role / feature / approval değişiklikleri loglanmalıdır.

Tablo adı:

```txt
admin_audit_logs
```

Önerilen kolonlar:

| Kolon | Tip | Açıklama |
|---|---|---|
| `id` | uuid | Primary key |
| `actor_user_id` | uuid | İşlemi yapan admin |
| `action` | text | İşlem tipi |
| `target_user_id` | uuid | Etkilenen kullanıcı |
| `target_entity_type` | text | Etkilenen varlık tipi |
| `target_entity_id` | uuid | Etkilenen kayıt id |
| `before_value` | jsonb | Önceki değer |
| `after_value` | jsonb | Sonraki değer |
| `created_at` | timestamptz | Log zamanı |

Örnek action değerleri:

```txt
role.assigned
role.changed
feature.enabled
feature.disabled
feature.override_set
feature.override_cleared
approval.approved
approval.rejected
attribute.rule_updated
```

---

## 12. Permission Enforcement Yaklaşımı

## 12.1 Seçilen Model

Seçilen güvenlik modeli:

```txt
Frontend Guard + Supabase RLS + RPC kontrollü yazma işlemleri
```

Neden?

- Sadece frontend guard yeterli değildir.
- Kullanıcı browser tarafında UI kontrollerini bypass edebilir.
- RLS, veri seviyesinde koruma sağlar.
- RPC, kritik yazma işlemlerini kontrollü ve loglanabilir hale getirir.
- Admin işlemleri audit log ile izlenebilir olur.

---

## 12.2 Frontend Guard

Frontend’de route ve component bazlı kontrol yapılmalıdır.

Örnek guard’lar:

```txt
RequireAuth
RequireFeature
RequireAdmin
RequireApprovalStatus
```

Örnek kullanım:

```tsx
<RequireFeature feature="events.create">
  <CreateEventButton />
</RequireFeature>
```

---

## 12.3 Backend / Supabase RLS

Genel RLS prensipleri:

- Kullanıcı kendi profilini okuyabilir.
- Kullanıcı kendi profilini düzenleyebilir, fakat sadece izin verilen alanları.
- Admin tüm profilleri görebilir.
- Public directory sadece `approved` ve `public` kayıtları gösterir.
- Kullanıcı doğrudan rolünü değiştiremez.
- Kullanıcı doğrudan feature flag değiştiremez.
- Kritik işlemler RPC üzerinden yapılır.

---

## 12.4 RPC Yaklaşımı

Önerilen RPC fonksiyonları:

| RPC | Amaç |
|---|---|
| `get_current_user_features()` | Kullanıcının effective feature listesini getirir |
| `get_current_user_profile()` | Kullanıcının profil ve attribute değerlerini getirir |
| `submit_role_change_request(target_role_key, note)` | Rol başvurusu açar |
| `submit_feature_request(feature_key, payload)` | Feature aktivasyon talebi açar |
| `update_profile_attribute(attribute_key, value, visibility)` | Profil attribute günceller |
| `admin_set_user_role(target_user_id, role_key)` | Admin kullanıcı rolünü değiştirir |
| `admin_set_role_feature_flag(role_key, feature_key, is_enabled)` | Role feature aç/kapat |
| `admin_set_user_feature_override(user_id, feature_key, is_enabled)` | Kullanıcı bazlı override verir |
| `admin_clear_user_feature_override(user_id, feature_key)` | Override kaldırır |
| `admin_review_approval_request(request_id, decision, note)` | Approval request onay/red |
| `admin_set_attribute_rule(role_key, attribute_key, rule_payload)` | Role attribute kuralı düzenler |

---

## 13. Route / Feature Haritası

| Route / Alan | Gerekli Feature | Not |
|---|---|---|
| `/profile` | `profile.view_own` | Kullanıcı kendi profilini görür |
| `/profile/edit` | `profile.edit_own` | Kullanıcı profilini düzenler |
| `/profile/public-settings` | `profile.edit_public` | Public görünürlük ayarları |
| `/profile/role-application` | Auth yeterli | Role başvurusu açılır |
| `/directory` | Public | Sadece approved profilleri gösterir |
| `/directory/:role` | Public | Role göre filtrelenmiş liste |
| `/events/new` | `events.create` | Admin onayı gerekebilir |
| `/offers/new` | `offers.create` | Admin onayı gerekebilir |
| `/referral` | `referral.create` | Referral link üretimi |
| `/city/manage` | `city.manage` | MVP sonrası |
| `/admin/users` | `is_admin()` | Admin panel |
| `/admin/roles-features` | `is_admin()` | Role / feature yönetimi |
| `/admin/approvals` | `is_admin()` | Approval queue |
| `/admin/audit-logs` | `is_admin()` | Audit log ekranı |

---

## 14. Admin Panel Modülleri

MVP için admin tarafında aşağıdaki modüller olmalıdır.

## 14.1 Loginli Kullanıcılar & Roller

Fonksiyonlar:

- Kullanıcı listesi
- Kullanıcı rolünü görme
- Kullanıcı rolünü değiştirme
- Kullanıcının başvurularını görme
- Kullanıcı profile status görme
- Kullanıcı feature override görme

---

## 14.2 Roller & Featurelar

Fonksiyonlar:

- Role listesi
- Feature catalog listesi
- Role bazlı feature aç/kapat
- Matrix görünümü
- Feature açıklaması düzenleme
- Aktif / pasif feature yönetimi

---

## 14.3 Attribute Yönetimi

Fonksiyonlar:

- Attribute catalog listesi
- Yeni attribute ekleme
- Attribute label / type düzenleme
- Role göre attribute aç/kapat
- Required ayarı
- Public default ayarı
- Kullanıcı düzenleyebilir mi ayarı
- Admin onayı gerekir mi ayarı

---

## 14.4 User Feature Overrides

Fonksiyonlar:

- Kullanıcı bazlı feature override listesi
- Kullanıcıya özel feature açma
- Kullanıcıya özel feature kapatma
- Override kaldırma
- Override nedeni yazma
- Override loglama

---

## 14.5 Approval Queue

Fonksiyonlar:

- Bekleyen talepler
- Talep tipi filtresi
- Role başvuruları
- Directory görünürlük talepleri
- Featured talepleri
- İletişim görünürlük talepleri
- Event / offer talepleri
- Onayla
- Reddet
- Admin notu ekle
- Talep geçmişi

---

## 14.6 Audit Logs

Fonksiyonlar:

- Admin işlemlerini listeleme
- Tarihe göre filtreleme
- Kullanıcıya göre filtreleme
- Action type filtresi
- Önce / sonra değerlerini görme

---

## 15. Public Directory Tasarımı

## 15.1 Kapsam

Public directory tüm rolleri gösterebilir:

- Bireysel
- Consultant
- İşletme
- Kuruluş
- Influencer
- Elçi

Ancak sadece admin onaylı profiller görünür.

---

## 15.2 Directory Filtreleri

MVP filtre önerileri:

| Filtre | Açıklama |
|---|---|
| Rol | Bireysel, Consultant, İşletme, Kuruluş, Influencer, Elçi |
| Ülke | Kullanıcının / profilin ülkesi |
| Şehir | Kullanıcının / profilin şehri |
| Arama | İsim, bio, role-specific attribute |
| Featured | Öne çıkarılmış profiller |
| Doğrulanmış | Verification status |

---

## 15.3 Directory Kart Alanları

Public kartta gösterilecek alanlar:

| Alan | Gösterim |
|---|---|
| Profil görseli / logo | Evet |
| Görünen isim | Evet |
| Rol label | Evet |
| Ülke | Evet |
| Şehir | Evet |
| Kısa bio | Evet |
| Role özel 1 attribute | Evet, public ise |
| WhatsApp | Sadece onaylı ve public ise |
| Website / LinkedIn | Kullanıcı public yaptıysa |
| Featured badge | Varsa |

---

## 16. Fazlara Bölünmüş MVP Planı

## Faz 0 — Hazırlık ve Mevcut Yapı Kontrolü

Amaç: Mevcut DB ve frontend yapısını kırmadan yeni modele hazırlık yapmak.

Todo:

- [ ] Mevcut `roles` tablosundaki role key’leri kontrol et.
- [ ] `individual`, `consultant`, `business`, `organization`, `influencer`, `ambassador` rollerinin seed edildiğini doğrula.
- [ ] Mevcut `feature_catalog` yapısını kontrol et.
- [ ] `user_role_assignments` tek aktif rol kuralını doğrula.
- [ ] `get_current_user_features()` RPC’sinin role + override birleşimini doğru hesapladığını test et.
- [ ] Existing admin role/feature ekranının veri akışını incele.
- [ ] Geriye dönük uyumluluk için mevcut `profile_type` sync trigger’larının bozulmadığını doğrula.

Kabul kriterleri:

- Mevcut login bozulmaz.
- Mevcut admin panel açılır.
- Mevcut kullanıcı rolleri kaybolmaz.
- Mevcut feature RPC çalışır.

---

## Faz 1 — Attribute Catalog Altyapısı

Amaç: Role özel alanları dinamik yönetebilmek.

Todo:

- [ ] `attribute_catalog` tablosunu oluştur.
- [ ] `role_attribute_rules` tablosunu oluştur.
- [ ] `user_profile_attributes` tablosunu oluştur.
- [ ] Ortak 5 attribute için seed hazırla.
- [ ] Her role 1 özel attribute seed et.
- [ ] Attribute type enum/check constraint ekle.
- [ ] Visibility enum/check constraint ekle.
- [ ] Approval status enum/check constraint ekle.
- [ ] RLS policy’leri ekle.
- [ ] Admin RPC ile attribute rule yönetimi ekle.
- [ ] Kullanıcı attribute update RPC’si ekle.

Kabul kriterleri:

- Admin attribute listesi görebilir.
- Kullanıcı kendi attribute değerlerini görebilir.
- Kullanıcı izin verilen attribute’u güncelleyebilir.
- Public visibility ayarı kaydedilir.
- Admin tüm attribute değerlerini görebilir.

---

## Faz 2 — Profil Sayfası

Amaç: Kullanıcının ortak ve role-specific attribute’ları profil ekranından yönetebilmesi.

Todo:

- [ ] `/profile` sayfasında ortak attribute’ları göster.
- [ ] Kullanıcının aktif rolüne göre özel attribute’u göster.
- [ ] Attribute değerleri için form component’i oluştur.
- [ ] `text`, `textarea`, `select`, `multi_select`, `url`, `phone`, `boolean` inputlarını destekle.
- [ ] Kullanıcı visibility seçebilsin.
- [ ] Admin approval gereken değişikliklerde direkt update yerine approval request oluştur.
- [ ] Profil tamamlanma oranı ekle.
- [ ] Profilde “Rol Başvurusu” alanı ekle.

Kabul kriterleri:

- Bireysel kullanıcı profilini düzenler.
- Consultant rolündeki kullanıcı `expertise_area` görür.
- İşletme rolündeki kullanıcı `business_category` görür.
- Kuruluş rolündeki kullanıcı `organization_type` görür.
- Influencer rolündeki kullanıcı `main_platform` görür.
- Elçi rolündeki kullanıcı `ambassador_city` görür.

---

## Faz 3 — Rol Başvurusu ve Approval Queue

Amaç: Kullanıcının role başvurması ve adminin bunu onaylaması.

Todo:

- [ ] `approval_requests` tablosunu oluştur.
- [ ] `submit_role_change_request()` RPC’sini yaz.
- [ ] `/profile/role-application` UI alanını oluştur.
- [ ] Kullanıcı hedef rol seçebilsin.
- [ ] Kullanıcı not yazabilsin.
- [ ] Aynı kullanıcı için aynı role ikinci pending başvuru açılmasını engelle.
- [ ] `/admin/approvals` ekranını oluştur.
- [ ] Admin pending role başvurularını görebilsin.
- [ ] Admin onayladığında `user_role_assignments` güncellensin.
- [ ] Admin reddettiğinde status `rejected` olsun.
- [ ] Admin action audit log’a yazılsın.

Kabul kriterleri:

- Kullanıcı Consultant rolüne başvurabilir.
- Başvuru admin panelde görünür.
- Admin onaylarsa kullanıcı rolü değişir.
- Admin reddederse kullanıcı sonucu görür.
- Tüm işlem audit log’a yazılır.

---

## Faz 4 — Feature Matrix ve User Override UI

Amaç: Adminin role bazlı ve kullanıcı bazlı feature yönetmesi.

Todo:

- [ ] `feature_catalog` içinde MVP feature’larının seed edildiğini doğrula.
- [ ] `role_feature_flags` seed değerlerini oluştur.
- [ ] Admin role-feature matrix ekranını iyileştir.
- [ ] Matrixte satır = feature, kolon = role göster.
- [ ] Feature açıklamaları göster.
- [ ] Role bazlı feature toggle çalışsın.
- [ ] `user_feature_overrides` UI ekranı oluştur.
- [ ] Kullanıcı detayında override listesi göster.
- [ ] Kullanıcıya özel feature aç/kapat.
- [ ] Override kaldırma butonu ekle.
- [ ] Override sebebi alanı ekle.
- [ ] Tüm değişiklikleri audit log’a yaz.

Kabul kriterleri:

- Admin Consultant için `offers.create` açıp kapatabilir.
- Admin tek bir Bireysel kullanıcıya `events.create` override verebilir.
- `get_current_user_features()` override sonucunu doğru döndürür.
- Frontend feature guard doğru davranır.

---

## Faz 5 — Public Directory

Amaç: Onaylı profilleri public listelemek.

Todo:

- [ ] `directory.visible` approval akışını bağla.
- [ ] Public profile status alanı ekle.
- [ ] Directory query’sini sadece approved profillerle sınırla.
- [ ] Role filtresi ekle.
- [ ] Ülke / şehir filtresi ekle.
- [ ] Arama alanı ekle.
- [ ] Featured filtre / sıralama ekle.
- [ ] Directory kart component’i oluştur.
- [ ] Public profile detay sayfası oluştur.
- [ ] Kullanıcının gizlediği alanları public query’den çıkar.
- [ ] Email’i public göstermeme kuralını enforce et.
- [ ] Telefon / WhatsApp için approval + visibility kontrolü uygula.

Kabul kriterleri:

- Onaysız profil directory’de görünmez.
- Onaylı Bireysel profil görünür.
- Onaylı Consultant profil görünür.
- Kullanıcının gizlediği telefon görünmez.
- Admin onaylı WhatsApp görünür.
- Featured profil özel badge ile görünür.

---

## Faz 6 — Modül Placeholderları

Amaç: Tüm modülleri MVP’ye dahil etmek fakat ağır fonksiyonları küçük başlatmak.

Modüller:

- Consultant listesi
- İşletme listesi
- Kuruluş listesi
- Influencer listesi
- Elçi listesi
- Etkinlik oluşturma
- Hizmet / teklif oluşturma
- Referral link

Todo:

- [ ] Role bazlı liste sayfaları oluştur.
- [ ] Her listeyi directory filtresiyle bağla.
- [ ] `events.create` için basit talep formu oluştur.
- [ ] Event talebi approval queue’ya düşsün.
- [ ] `offers.create` için basit talep formu oluştur.
- [ ] Offer talebi approval queue’ya düşsün.
- [ ] `referral.create` için referral request flow oluştur.
- [ ] Admin onaylayınca referral kodu üret.
- [ ] Elçi için sadece temsilci profil alanı göster.
- [ ] `city.manage` UI’ını MVP’de pasif / coming soon tut.

Kabul kriterleri:

- Tüm modüller route olarak var olur.
- Yetkisiz kullanıcı modül aksiyonunu kullanamaz.
- Yetkili ama approval gereken kullanıcı talep oluşturur.
- Admin talepleri approval queue’da yönetir.

---

## Faz 7 — Test, Güvenlik ve Hardening

Amaç: Permission bypass risklerini azaltmak.

Todo:

- [ ] Role assignment testleri yaz.
- [ ] Feature calculation testleri yaz.
- [ ] User override precedence testleri yaz.
- [ ] RLS self-access testleri yaz.
- [ ] Public directory data leak testleri yaz.
- [ ] Email / telefon public leak testleri yaz.
- [ ] Admin RPC authorization testleri yaz.
- [ ] Non-admin kullanıcı admin RPC çağırınca hata almalı.
- [ ] Kullanıcı direkt `user_role_assignments` update edememeli.
- [ ] Kullanıcı direkt `role_feature_flags` update edememeli.
- [ ] Approval status bypass testleri yaz.
- [ ] Audit log oluşum testleri yaz.

Kabul kriterleri:

- Frontend guard bypass edilse bile DB güvenli kalır.
- Non-admin role/feature değiştiremez.
- Public directory hassas veri sızdırmaz.
- Admin değişiklikleri loglanır.

---

## 17. Effective Feature Hesaplama Mantığı

Önerilen precedence:

```txt
1. Global feature aktif mi?
2. Role bazlı feature açık mı?
3. User-specific override var mı?
4. Override varsa role default değerinin üstüne yazar.
5. Approval gerekiyorsa ilgili approval status kontrol edilir.
```

Önerilen davranış:

| Durum | Sonuç |
|---|---|
| Feature catalog pasif | Herkeste kapalı |
| Role feature açık, override yok | Açık |
| Role feature kapalı, override yok | Kapalı |
| Role feature kapalı, user override true | Açık |
| Role feature açık, user override false | Kapalı |
| Feature açık ama approval pending | UI’da talep durumu gösterilir |
| Feature açık ama approval rejected | Aksiyon engellenir |

---

## 18. Önerilen Seed Planı

## 18.1 Role Seed

```txt
individual    | Bireysel
consultant    | Consultant
business      | İşletme
organization  | Kuruluş
influencer    | Influencer
ambassador    | Elçi
```

---

## 18.2 Attribute Seed

```txt
full_name
country
city
profile_photo_url
bio_short
interests
expertise_area
business_category
organization_type
main_platform
ambassador_city
```

---

## 18.3 Feature Seed

```txt
profile.view_own
profile.edit_own
profile.edit_public
directory.visible
directory.featured
contact.receive
contact.show_whatsapp
content.create
content.edit_own
events.create
offers.create
referral.create
city.manage
admin.requires_approval
```

---

## 19. Gelecekte Prompt ile Genişletme Standardı

Bu sistem promptlarla geliştirilecekse, her yeni attribute / feature / role değişikliği standart formatla istenmelidir.

## 19.1 Yeni Attribute Ekleme Prompt Formatı

```txt
CorteQS role/attribute sistemine yeni bir attribute ekle.

Role:
Attribute key:
Label:
Data type:
Public default:
User can edit:
User can hide:
Requires admin approval on change:
Required:
Sort order:
Açıklama:

Buna göre:
1. attribute_catalog seed,
2. role_attribute_rules seed,
3. admin UI todo,
4. profile UI todo,
5. RLS/RPC etkisi
hazırla.
```

---

## 19.2 Yeni Feature Ekleme Prompt Formatı

```txt
CorteQS role/feature sistemine yeni bir feature ekle.

Feature key:
Label:
Description:
Scope:
Hangi rollerde açık:
Admin approval gerekir mi:
User override yapılabilir mi:
Route/component etkisi:
DB/RLS/RPC etkisi:

Buna göre:
1. feature_catalog seed,
2. role_feature_flags seed,
3. frontend guard,
4. backend enforcement,
5. test case listesi
hazırla.
```

---

## 19.3 Yeni Rol Davranışı Ekleme Prompt Formatı

```txt
CorteQS sisteminde şu rol için yeni davranış tanımla:

Role key:
Yeni davranış:
Gereken featurelar:
Gereken attributelar:
Approval gerekiyor mu:
Public directory etkisi:
Admin panel etkisi:

Buna göre teknik plan ve küçük implementation todo listesi oluştur.
```

---

## 20. Riskler ve Önlemler

| Risk | Açıklama | Önlem |
|---|---|---|
| Permission bypass | Kullanıcı UI guard’ı bypass edebilir | RLS + RPC zorunlu |
| Attribute karmaşası | Çok fazla role özel alan sistemi karmaşıklaştırır | Attribute catalog + role rules |
| Approval karmaşası | Her işlem approval’a düşünce admin yükü artar | Talep tipi, filtre ve bulk action eklenmeli |
| Sensitive data leak | Email / telefon public görünebilir | Default `private` |
| Çoklu rol ihtiyacı | Kullanıcı ileride birden fazla rol isteyebilir | MVP tek rol + feature override |
| Admin panel karmaşası | Matrix ve override ekranları zorlaşabilir | Fazlı geliştirme |
| Eski `profile_type` bağımlılığı | Mevcut sistem kırılabilir | Sync trigger ve backward compatibility korunmalı |

---

## 21. İlk Hedef

İlk hedef şudur:

```txt
Profil + Rol + Feature Matrix + Public Listing + Approval Queue
```

Ancak bu hedef tek seferde değil, küçük fazlara bölünerek uygulanmalıdır.

Önerilen sıralama:

1. Role ve feature seed kontrolü
2. Attribute catalog altyapısı
3. Profil ekranı
4. Role başvurusu
5. Approval queue
6. Feature matrix
7. User override UI
8. Public directory
9. Role bazlı liste sayfaları
10. Event / offer / referral request placeholderları
11. Audit log ve testler

---

## 22. Kısa Final Tercih Özeti

| Soru | Cevap |
|---|---|
| İlk kayıt rolü | Herkes Bireysel başlar |
| Ortak 5 attribute | `full_name`, `country`, `city`, `profile_photo_url`, `bio_short` |
| Her role özel attribute | MVP’de 1 özel attribute |
| Public directory | Evet |
| Public directory kapsamı | Tüm roller |
| Public directory görünürlüğü | Sadece admin onaylı profiller |
| Admin onayı gereken roller | Consultant, İşletme, Kuruluş, Influencer, Elçi |
| Elçi moderasyon | MVP sonrası |
| User override | MVP’de admin UI’da görünsün |
| İlk MVP kapsamı | Hepsi ama küçük fazlara bölünsün |
| En önemli risk | Permission bypass ve hassas veri sızıntısı |
| En önemli hedef | Esnek, admin kontrollü, güvenli role/feature/attribute matrisi |

---

## 23. Developer / Agent İçin Ana Uygulama Notu

Bu sistemde ana amaç, her yeni ihtiyacı yeni kolon ekleyerek çözmek değildir.

Ana hedef:

```txt
Role → Attribute Rules → Feature Flags → User Overrides → Approval Queue
```

zincirini kurmak ve ileride yeni rol / attribute / feature geldiğinde sistemi küçük seed ve UI değişiklikleriyle genişletebilmektir.

Bu nedenle implementasyon sırasında:

- Hardcoded role check minimumda tutulmalı.
- Feature key bazlı guard kullanılmalı.
- Attribute alanları katalogdan render edilmeli.
- Approval gerektiren işlemler doğrudan tablo update’i yapmamalı.
- Admin işlemleri RPC üzerinden yapılmalı.
- Kritik değişiklikler audit log’a yazılmalı.
