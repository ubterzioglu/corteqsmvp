# RolesGo MVP Kullanım Kılavuzu

Bu doküman, `docs/modules/rolesgo/rolesgo.md` uyumlu yeni üye sistemi MVP'sinin günlük kullanımını ve operasyon adımlarını özetler.

## 1. Ne Deploy Edildi

Supabase tarafında aşağıdaki migration'lar remote ortama uygulanmış durumda:

- `20260524213000_add_individual_profile_details.sql`
- `20260524220000_backfill_individual_profile_details_payload.sql`
- `20260524223500_enable_self_edit_individual_profile_details.sql`
- `20260525000000_rolesgo_role_attribute_approval_mvp.sql`

Bu paketle birlikte aktif olan ana parçalar:

- Rol bazlı feature yönetimi
- Dinamik attribute katalogu
- Kullanıcı profil attribute kayıtları
- Approval queue
- Admin audit logs
- Role request ve feature request RPC'leri
- Public directory listeleme ve detay RPC'leri

## 2. Route Haritası

Kullanıcı tarafı:

- `/profile`
- `/profile/:type`
- `/directory`
- `/directory/profile/:userId`

Admin tarafı:

- `/admin/new-member/users-roles`
- `/admin/new-member/roles-features`
- `/admin/new-member/attributes`
- `/admin/new-member/overrides`
- `/admin/approvals`
- `/admin/audit-logs`

## 3. Kullanıcı Akışı

### 3.1 Profil Sayfası

Kullanıcı giriş yaptıktan sonra profil akışı `/profile` üzerinden çalışır. Sistem aktif role göre doğru tipe yönlendirir.

Profil ekranındaki ana bloklar:

- Ortak profil alanları
- Role özel alanlar
- Rol başvurusu
- Feature talep kartları
- Bekleyen approval listesi

### 3.2 Ortak Alanlar

Ortak alanlar:

- `full_name`
- `country`
- `city`
- `profile_photo_url`
- `bio_short`

Bu alanlar profil kartı ve directory görünümü için kullanılır.

### 3.3 Role Özel Alanlar

Role göre açılan ilk özel alanlar:

- `bireysel` -> `interests`
- `danisman` -> `expertise_area`
- `isletme` -> `business_category`
- `kurulus-dernek` -> `organization_type`
- `blogger-vlogger-youtuber` -> `main_platform`
- `sehir-elcisi` -> `ambassador_city`

### 3.4 Alan Güncelleme

Kullanıcı bir alanı güncellediğinde:

- Alan admin onayı gerektirmiyorsa direkt kaydolur
- Alan admin onayı gerektiriyorsa `pending` statüsüne düşer
- Public görünümde eski onaylı değer kalmaya devam eder

### 3.5 Görünürlük Yönetimi

Her alan için görünürlük seviyesi bulunur:

- `public`
- `private`
- `admin_only`

Kullanıcı sadece `user_can_hide = true` olan alanların görünürlüğünü değiştirebilir.

### 3.6 Rol Başvurusu

Kullanıcı profil ekranındaki rol başvurusu bölümünden aktif olmayan bir role başvurabilir.

Akış:

1. Hedef rol seçilir
2. İsteğe bağlı not yazılır
3. Başvuru gönderilir
4. Kayıt `approval_requests` tablosuna `role_change` olarak düşer
5. Admin onaylarsa aktif rol güncellenir

Aynı hedef role ikinci pending başvuru açılamaz.

### 3.7 Feature Talebi

Kullanıcı profil ekranından şu akışlar için talep bırakabilir:

- Directory görünürlüğü
- Featured profil
- WhatsApp görünürlüğü
- Etkinlik oluşturma
- Teklif oluşturma
- Referral oluşturma

Talep gönderildiğinde kayıt `approval_requests` içine yazılır ve admin kuyruğuna düşer.

## 4. Admin Akışı

### 4.1 Loginli Kullanıcılar ve Roller

Sayfa: `/admin/new-member/users-roles`

Bu ekranda admin şunları yapabilir:

- Kullanıcının aktif rolünü değiştirmek
- Effective feature özetini görmek
- Bekleyen approval sayısını görmek
- Son talep durumlarını görmek
- Role özel kısa attribute önizlemesini görmek

### 4.2 Roller ve Featurelar

Sayfa: `/admin/new-member/roles-features`

Bu ekran matrix mantığında çalışır:

- Satırlar feature'ları gösterir
- Sütunlar rolleri gösterir
- Global açık/kapalı durumu yönetilir
- Rol bazlı enable/disable yapılır

Önemli nokta:

- Global durum `feature_catalog.is_active_globally` üstünden yönetilir
- Rol bazlı durum `role_feature_flags` üstünden yönetilir
- Kullanıcı override'ı varsa en son o kazanır

Öncelik sırası:

1. `user_feature_overrides`
2. `role_feature_flags`
3. `role_feature_defaults`
4. fallback

### 4.3 Attribute Yönetimi

Sayfa: `/admin/new-member/attributes`

Bu ekranda admin:

- Attribute katalogunu görür
- Alan label ve açıklamalarını takip eder
- Role bazlı rule'ları düzenler
- `is_required`, `is_public_default`, `user_can_edit`, `user_can_hide`, `requires_admin_approval_on_change` alanlarını yönetir

### 4.4 User Feature Override

Sayfa: `/admin/new-member/overrides`

Bu ekran kullanıcı bazlı özel yetki açıp kapatmak için kullanılır.

Kullanım senaryoları:

- Rolünde kapalı olan bir feature'ı tek kullanıcıya açmak
- Geçici erişim vermek
- İstisna kullanıcı tanımlamak

Override verirken mümkünse neden alanı doldurulmalıdır. Bu bilgi audit tarafında da faydalı olur.

### 4.5 Approval Queue

Sayfa: `/admin/approvals`

Bu ekran tüm bekleyen taleplerin ana kuyruğudur.

Başlıca request type'lar:

- `role_change`
- `directory_visibility`
- `contact_visibility`
- `featured_listing`
- `event_create`
- `offer_create`
- `referral_create`
- `attribute_change`
- `city_manage`

Admin seçenekleri:

- `approve`
- `reject`

Approval sonucu:

- Rol değişikliği ise kullanıcı rolü güncellenir
- Attribute change ise ilgili attribute `approved` veya `rejected` olur
- Feature talebi ise ilgili kullanıcı override veya durum kaydı işlenir

### 4.6 Audit Logs

Sayfa: `/admin/audit-logs`

Bu ekran admin işlemlerinin geçmişini izlemek için kullanılır.

İlk sürümde loglanan başlıca action'lar:

- `role.assigned`
- `role.changed`
- `feature.enabled`
- `feature.disabled`
- `feature.override_set`
- `feature.override_cleared`
- `approval.approved`
- `approval.rejected`
- `attribute.rule_updated`
- `attribute.value_approved`
- `attribute.value_rejected`

## 5. Public Directory

### 5.1 Liste Sayfası

Sayfa: `/directory`

Liste sadece şu profilleri gösterir:

- görünürlük açısından uygun olanlar
- ilgili feature'ı açık olanlar
- public alanları onaylı olanlar

Temel filtreler:

- role
- country
- city
- serbest metin arama
- featured only
- verified only

### 5.2 Profil Detay Sayfası

Sayfa: `/directory/profile/:userId`

Bu sayfada yalnızca public olarak gösterilmesi izinli alanlar görünür.

Özellikle gösterilmez:

- email
- `private` alanlar
- `admin_only` alanlar

## 6. Feature ve Approval Mantığı

Yeni generic feature anahtarları:

- `profile.view_own`
- `profile.edit_own`
- `profile.edit_public`
- `directory.visible`
- `directory.featured`
- `contact.receive`
- `contact.show_whatsapp`
- `content.create`
- `content.edit_own`
- `events.create`
- `offers.create`
- `referral.create`
- `city.manage`
- `admin.requires_approval`

Notlar:

- `individual.*` legacy feature'ları korunur
- Generic feature'lar global katalogda tutulur
- Rol bazlı izinler `role_feature_flags` ile çözülür
- `city.manage` şu anda kapalı bırakılabilir ve "yakında" mantığında kullanılabilir

## 7. Supabase Operasyon Komutları

### 7.1 Migration Durumu Kontrol

```powershell
supabase migration list
```

### 7.2 Remote Veritabanına Migration Push

```powershell
supabase db push
```

### 7.3 Yeni Migration Oluşturma

```powershell
supabase migration new migration_adi
```

### 7.4 Type Güncelleme

Remote schema güncellendikten sonra TypeScript tiplerini yenilemek için:

```powershell
supabase gen types typescript --local
```

veya remote erişim yetkisi uygunsa uygun profile ile:

```powershell
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

### 7.5 Dikkat Edilecek Noktalar

- Prod'da bazı tablolar önceden var olabilir; migration'lar mümkün olduğunca `if not exists` ve uyumluluk mantığıyla yazılmalı
- Özellikle `approval_requests` gibi önceden bulunan tablolarda yeniden yaratma değil, genişletme yaklaşımı tercih edilmeli
- `feature_catalog.key` şu anda global tekil çalışır; generic feature eklemelerinde aynı key'i role başına tekrar üretmeyin

## 8. Sık Yapılacak İşler

### 8.1 Yeni Kullanıcıya Rol Vermek

1. `/admin/new-member/users-roles` sayfasına git
2. Kullanıcıyı bul
3. Hedef rolü seç
4. Kaydet
5. Gerekirse aynı kullanıcı için feature matrix veya override kontrol et

### 8.2 Bir Alanı Onay Gerektirir Hale Getirmek

1. `/admin/new-member/attributes` sayfasına git
2. İlgili attribute ve role rule kaydını bul
3. `requires_admin_approval_on_change` alanını aç
4. Kaydet

### 8.3 Kullanıcıyı Directory'de Görünür Yapmak

1. Kullanıcının ilgili role sahip olduğundan emin ol
2. `/admin/new-member/roles-features` sayfasında `directory.visible` izin durumunu kontrol et
3. Gerekirse `/admin/approvals` içinde pending request'i onayla
4. Profilde public alanların dolu olduğundan emin ol

### 8.4 Tek Kullanıcıya İstisnai Yetki Vermek

1. `/admin/new-member/overrides` sayfasına git
2. Kullanıcıyı seç
3. Feature anahtarını seç
4. Enable veya disable override ver
5. İsteğe bağlı neden yaz

## 9. Teknik Notlar

- RPC tabanlı kritik yazmalar tercih edilir
- Audit log yazımı uygulama tarafında değil DB/RPC tarafında tutulur
- Public directory okuması doğrudan ham tablo okumaz; güvenli yüzeyden ilerler
- Kullanıcı başına tek aktif rol modeli korunur

## 10. Hızlı Kontrol Listesi

Release sonrası kontrol için:

1. `supabase migration list` ile local/remote eşit mi kontrol et
2. `/profile` açılıyor mu kontrol et
3. Rol başvurusu oluşturulabiliyor mu kontrol et
4. `/admin/approvals` içinde talep görünüyor mu kontrol et
5. Admin onay sonrası rol veya feature gerçekten etkinleşiyor mu kontrol et
6. `/directory` içinde sadece beklenen profiller listeleniyor mu kontrol et
7. `/admin/audit-logs` içinde işlem izi düşüyor mu kontrol et
