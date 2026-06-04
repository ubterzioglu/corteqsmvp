## Kullanıcı Rol, Feature ve Attribute Yönetim Sisteminin Güncellenmesi

Mevcut kullanıcı yetkilendirme sistemi sadeleştirilecek ve genişletilecek.

### 1. Rol Yapısının Genişletilmesi

Mevcut sistemde tanımlı olan rollere ek olarak, taxonomy içerisinde yer alan tüm kullanıcı türleri ve alt kategoriler de ayrı birer rol olarak sisteme eklenecek.

Yeni roller oluşturulurken, rolün hangi ana kategoriye ve alt kategoriye ait olduğu isimden açıkça anlaşılmalı. Bu nedenle aşağıdaki isimlendirme standardı kullanılacak:

```text
AnaKategori_AltKategori
```

Örnekler:

```text
Consultant_Egitim
Consultant_HukukVergi
Consultant_Gayrimenkul
Consultant_VizeGocmenlik
Consultant_Finansal
Organization_DernekVakıf
Organization_Konsolosluk
Organization_SaglikKurulusu
Community_WhatsApp
Community_Telegram
```

Rol isimleri yalnızca kullanıcı arayüzünde değil, veritabanında, API yanıtlarında, admin panelinde ve layout kontrol mekanizmalarında da anlaşılır olmalı.

Gerekli durumlarda teknik kullanım için ASCII uyumlu değerler tercih edilebilir:

```text
Consultant_Egitim
Consultant_HukukVergi
Consultant_VizeGocmenlik
Organization_DernekVakif
```

Kullanıcıya gösterilen etiketlerde ise Türkçe karakterler kullanılabilir:

```text
Danışman - Eğitim
Danışman - Hukuk ve Vergi
Kuruluş - Dernek ve Vakıf
```

### 2. Nihai Yetkilendirme Modeli

Sistemde yetki yönetimi yalnızca aşağıdaki iki ana yapı üzerinden çalışacak:

```text
roles
features
```

Her rolün varsayılan olarak sahip olduğu feature kayıtları olacak.

Örnek:

```text
Consultant_Egitim
- profile_public
- profile_edit
- service_add
- appointment_receive
- messaging_enabled
```

Bir kullanıcının rolü değiştirildiğinde, ilgili rolün varsayılan feature listesi kullanıcıya uygulanacak.

### 3. Kullanıcıya Özel Feature Override

Rol bazlı standart yetkilere ek olarak kullanıcıya özel feature tanımlanabilmeli.

Bu sistem `feature override` mantığıyla çalışmalı.

Örnek:

```text
Kullanıcının rolü: Consultant_Egitim

Rolün varsayılan feature listesi:
- profile_public
- profile_edit
- service_add

Kullanıcıya özel eklenen feature:
- homepage_featured

Kullanıcıya özel kapatılan feature:
- messaging_enabled
```

Böylece aynı role sahip iki kullanıcıdan biri belirli bir özelliğe erişebilirken diğeri erişemeyebilir.

Override sistemi hem feature eklemeyi hem de mevcut bir featureı kullanıcı bazında devre dışı bırakmayı desteklemeli.

Önerilen yapı:

```text
user_feature_overrides
- user_id
- feature_key
- override_value
- created_at
- updated_at
```

`override_value` alanı aşağıdaki değerleri desteklemeli:

```text
true  = feature kullanıcı için aktif
false = feature kullanıcı için pasif
```

Kullanıcı için efektif feature listesi hesaplanırken aşağıdaki öncelik sırası kullanılmalı:

```text
1. Kullanıcıya özel feature override
2. Kullanıcının rolünden gelen varsayılan feature
3. Feature için sistem varsayılanı
```

### 4. Kullanıcıya Özel Attribute Yönetimi

Bir kullanıcıya standart alanlara ek olarak özel attribute atanabilmeli.

Örnekler:

```text
verified_by_admin
featured_profile
premium_until
languages
service_regions
consultation_type
professional_license
membership_level
```

Attribute değerleri mümkün olduğunca esnek olmalı. Boolean, string, number, date, JSON ve liste türleri desteklenmeli.

Önerilen yapı:

```text
attributes
- id
- key
- label
- data_type
- description
- default_value
- is_active
- created_at
- updated_at
```

Kullanıcıya özel attribute değerleri ayrı tabloda tutulmalı:

```text
user_attributes
- user_id
- attribute_id
- value
- created_at
- updated_at
```

### 5. Admin Paneli Güncellemesi

Admin panelinde kullanıcı yetkilendirme ve attribute yönetimi için merkezi bir bölüm oluşturulacak.

Admin menüsü altında aşağıdaki bölümler yer almalı:

```text
Kullanıcı Yönetimi
- Kullanıcılar

Yetki ve Tanım Yönetimi
- Roller
- Features
- Attributes
```

`Roller`, `Features` ve `Attributes` aynı ana admin menüsü altında listelenmeli.

Admin panelinde feature ve attribute yönetimi mümkün olduğunca tek bir merkezi sayfa veya aynı bölüm altında sekmeli bir yapı üzerinden yapılmalı.

Önerilen sekmeler:

```text
Roller
Features
Attributes
Rol - Feature Eşleştirmeleri
```

Bu sayfalarda admin aşağıdaki işlemleri yapabilmeli:

```text
- Yeni rol ekleme
- Rol düzenleme
- Rol pasife alma
- Yeni feature ekleme
- Feature düzenleme
- Feature pasife alma
- Yeni attribute ekleme
- Attribute düzenleme
- Attribute pasife alma
- Bir role varsayılan feature atama
- Bir rolden varsayılan feature kaldırma
```

### 6. Kullanıcı Detay Sayfası Güncellemesi

Admin panelindeki kullanıcı detay sayfasında aşağıdaki bölümler bulunmalı:

```text
Genel Bilgiler
Roller
Feature Overrides
Attributes
```

Admin, kullanıcı detay ekranından aşağıdaki işlemleri yapabilmeli:

```text
- Kullanıcının rolünü değiştirme
- Kullanıcıya özel feature ekleme
- Kullanıcı için bir featureı kapatma
- Feature override kaydını kaldırma
- Kullanıcıya özel attribute ekleme
- Attribute değerini güncelleme
- Attribute değerini silme
```

Rol değiştirildiğinde kullanıcıya ait özel feature override ve attribute kayıtları silinmemeli. Çünkü bunlar kullanıcıya özel tanımlardır.

### 7. Kullanıcı Menüsünden Rol Değiştirme

Kullanıcı yönetim ekranında rol değişikliği yapılabilmeli.

Kullanıcı listesinde her kullanıcı için mevcut rol görünür olmalı. Kullanıcı detay sayfasına girildiğinde admin yeni rolü seçerek kaydedebilmeli.

Rol değiştirme işleminde:

```text
- Önce mevcut rol gösterilmeli.
- Yeni rol dropdown veya searchable select üzerinden seçilebilmeli.
- Değişiklik kaydedilmeden önce onay istenmeli.
- Yapılan değişiklik audit log içerisine yazılmalı.
```

### 8. Audit Log

Rol, feature override ve attribute değişiklikleri kayıt altına alınmalı.

Önerilen yapı:

```text
audit_logs
- id
- admin_user_id
- target_user_id
- action_type
- entity_type
- entity_key
- old_value
- new_value
- created_at
```

Örnek action değerleri:

```text
role_changed
feature_override_added
feature_override_updated
feature_override_removed
attribute_added
attribute_updated
attribute_removed
```

### 9. Beklenen Nihai Sonuç

Geliştirme tamamlandığında sistem şu şekilde çalışmalı:

```text
- Tüm taxonomy kategorileri rol olarak tanımlanmış olmalı.
- Roller okunabilir ve standart bir isimlendirmeye sahip olmalı.
- Her rolün varsayılan feature listesi bulunmalı.
- Kullanıcıya özel feature eklenebilmeli veya mevcut feature kapatılabilmeli.
- Kullanıcıya özel attribute eklenebilmeli.
- Roller, features ve attributes admin panelinden merkezi olarak yönetilebilmeli.
- Kullanıcının rolü admin panelindeki kullanıcı detay sayfasından değiştirilebilmeli.
- Tüm değişiklikler audit log içerisinde izlenebilmeli.
```

### 10. Uygulama Öncesi Kontrol

Kod değişikliğine başlamadan önce mevcut veritabanı tablolarını, mevcut rol yapılarını, taxonomy verisini, admin paneli route yapılarını ve kullanıcı detay sayfasını analiz et.

Mevcut çalışan yapıyı bozma. Gerekli migration dosyalarını oluştur. Mevcut kullanıcıları yeni sisteme taşımak için backward-compatible bir migration planı hazırla.

Önce mevcut durum analizini ve önerilen değişiklik listesini çıkar. Ardından migration, backend ve admin paneli geliştirmelerini aşamalı olarak uygula.
