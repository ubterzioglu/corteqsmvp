# CorteQS Main Plan
## Birleşik Auth, Profil Onboarding, Rol, Feature ve Attribute Yönetimi Uygulama Planı

**Proje:** CorteQS Landing  
**Belge tipi:** AI-agent ve geliştirici için uygulanabilir ana plan  
**Kaynak teknik doküman:** `0406techdet(1).md`  
**Birleştirilen planlar:** `1PLAN.md`, `2plan.md`, `3plan.md`  
**Temel yaklaşım:** Mevcut çalışan sistemi bozmadan, yalnızca ileri yönlü migration dosyalarıyla, kontrollü ve test edilebilir geliştirme

---

## 1. Amaç

Bu çalışma üç bağlantılı ihtiyacı tek bir mimari altında çözmelidir:

1. Bundan sonra `/form` üzerinden kayıt oluşturan kullanıcıların form verilerini Supabase Auth kimliğiyle güvenli şekilde ilişkilendirmek.
2. Daha önce form doldurmuş fakat henüz auth olmamış yaklaşık 100 kişi için güvenli toplu profil taslağı oluşturma, davet gönderme ve kullanıcı onayıyla aktivasyon akışı geliştirmek.
3. Kullanıcı rollerini taxonomy yapısını kapsayacak şekilde genişletmek; rol bazlı feature yönetimi, kullanıcıya özel feature override, esnek attribute yönetimi ve merkezi admin ekranlarını oluşturmak.

Bu üç ihtiyaç aynı sistemin parçalarıdır ancak tek bir büyük değişiklik olarak uygulanmamalıdır. Geliştirme bağımlılık sırasına göre ayrı workstream ve fazlar halinde ilerlemelidir.

---

## 2. Proje İçin Bağlayıcı Teknik Referanslar

Kod değişikliğine başlamadan önce aşağıdaki mevcut mimari kuralları bağlayıcı kabul et:

- Uygulama React 18 + Vite SPA yapısındadır.
- Supabase PostgreSQL ve Supabase Auth kullanılmaktadır.
- RLS aktif durumdadır ve convenience amacıyla kapatılmamalıdır.
- Production ortamında 60+ migration vardır. Mevcut migration dosyaları değiştirilemez, silinemez, squash edilemez ve yeniden sıralanamaz.
- Yeni migration dosyaları yalnızca ileri yönlü ve append-only olmalıdır.
- Frontend için tercih edilen Supabase client kaynağı `src/lib/supabase.ts` dosyasıdır.
- `src/integrations/supabase/client.ts` Lovable-generated kaynaktır; zorunlu olmadıkça manuel düzenlenmemelidir.
- `src/App.tsx` monolitik ve riskli bir routing hub dosyasıdır. Bu çalışma kapsamında yalnızca gerekli route eklemeleri yapılmalıdır; genel refactor yapılmamalıdır.
- Yeni frontend kodu API module + Zod schema + React Query yaklaşımını takip etmelidir.
- TypeScript strict modu global olarak kapalıdır; yeni kodlar yine de strict mode açıkmış gibi yazılmalıdır.
- `muhasebe` modülü kod organizasyonu ve test edilebilirlik açısından örnek alınmalıdır.
- Legacy `public.admin_users` yapısı genişletilmemelidir.

---

## 3. Nihai Mimari Yön

### 3.1 Kimlik ve Profil İçin Kanonik Kaynaklar

Aşağıdaki kaynaklar temel alınmalıdır:

```text
auth.users.id                  → kanonik authenticated kullanıcı kimliği
user_profiles_v2.user_id       → profil sahibinin auth.users bağlantısı
rolesgo_roles                  → fiziksel rol kataloğu
rolesgo_features               → fiziksel feature kataloğu
rolesgo_role_features          → rol bazlı varsayılan feature eşleştirmeleri
profile_onboarding_imports     → geçmiş submission import, davet ve aktivasyon takibi
```

### 3.2 “roles + features” Hedefinin Yorumu

Nihai yetkilendirme modeli kavramsal olarak yalnızca aşağıdaki yapılar üzerinden çalışmalıdır:

```text
roles
features
feature overrides
attributes
```

Ancak mevcut projede yeni sistemin fiziksel tablo adları `rolesgo_*` olarak tanımlanmıştır. Bu nedenle:

- Yeni ve mevcut kodda `rolesgo_roles`, `rolesgo_features`, `rolesgo_role_features` yapıları kanonik kabul edilmelidir.
- Yalnızca isim sadeleştirmek amacıyla tablo rename migrasyonu yapılmamalıdır.
- Admin panelinde kullanıcıya gösterilen menüler sade biçimde `Roller`, `Features`, `Attributes` olarak adlandırılmalıdır.
- Legacy `public.admin_users` yeni geliştirmeler için kullanılmamalıdır.

### 3.3 İki Farklı Onboarding Akışı

Sistem iki onboarding senaryosunu ayrı fakat uyumlu biçimde yönetmelidir:

#### A. Yeni `/form` kayıtları

- Form verisi önce tarayıcıda versioned pending payload olarak saklanır.
- Kullanıcı Google OAuth veya Supabase email/password auth ile kimlik doğrular.
- Authenticated session oluştuktan sonra submission kaydı ve bireysel profil senkronu finalize edilir.
- Yeni submission kayıtları `auth.users.id` ile ilişkilendirilir.

#### B. Geçmişte auth olmadan form doldurmuş kullanıcılar

- Güvenilir server-side script mevcut submission kayıtlarını analiz eder.
- E-posta adresleri normalize edilir, deduplicate edilir ve çakışmalar raporlanır.
- Yeni auth kullanıcıları için Supabase davet e-postası gönderilir.
- Profil taslağı oluşturulur ancak kullanıcı açıkça inceleyip aktive edene kadar public yapılmaz.
- Kullanıcı `/welcome/activate` sayfasında profilini inceleyerek aktive eder.

---

## 4. Kapsam ve Çakışma Çözüm Kuralları

| Konu | Nihai karar |
|---|---|
| Eski `admin_users` sistemi | Genişletme. Yalnızca legacy uyumluluğu gerektiği kadar koru. |
| Yeni rol sistemi | `rolesgo_*` tablolarını kanonik kabul et. |
| Yeni `/form` submission kayıtları | Auth-linked finalize kullan. Auth olmadan kalıcı submission insert etme. |
| Eski submission kayıtları | Server-side toplu onboarding script ile işle. Otomatik ve kontrolsüz backfill yapma. |
| Geçmiş kullanıcıya profil oluşturma | Profil taslağı oluştur; kullanıcı aktivasyonundan önce public yapma. |
| Davet yöntemi | Supabase Invite User veya mevcut uyumlu onboarding mekanizması. Rastgele geçici parola üretme. |
| Magic Link | Aktivasyon linki süresi dolduğunda `signInWithOtp()` ve `shouldCreateUser: false` kullan. |
| Google OAuth | Supabase Auth identity provider olarak kullan. Ayrı Google user tablosu oluşturma. |
| Attribute tabloları | Mevcut `attribute_catalog`, `role_attribute_rules` veya eşdeğer tablolar varsa yeniden oluşturma; mevcut şemaya uyum sağla. |
| User attribute storage | Mevcut yapı varsa reuse et; yoksa migration ile ekle. |
| Feature override | Kullanıcıya özel `true` veya `false` override destekle. |
| Rol değişikliği | User-specific feature override ve attribute kayıtlarını silme. |
| Admin paneli | Onboarding foundation doğrulandıktan sonra merkezi yönetim ekranlarını ekle. |
| Route düzenleme | `src/App.tsx` içinde yalnızca gerekli targeted route eklemeleri yap. Genel refactor yapma. |

---

## 5. Uygulama Öncesi Zorunlu Discovery Fazı

Kod yazmaya başlamadan önce mevcut gerçek şemayı ve kodu incele. Varsayım yapma.

### 5.1 Okunması Gereken Dosyalar

```text
0406techdet.md veya repository içindeki güncel teknik doküman
CLAUDE.md
package.json
src/App.tsx
src/components/auth/AuthProvider.tsx
src/lib/supabase.ts
src/integrations/supabase/client.ts
src/pages/FormPage.tsx
src/pages/ProfilePage.tsx
src/lib/individual-profile.ts
mevcut login sayfaları
mevcut Google OAuth implementasyonu
mevcut public profile sayfaları
mevcut admin kullanıcı yönetimi sayfaları
mevcut taxonomy kaynakları
mevcut Edge Functions
supabase/migrations/* içindeki son ve ilgili migration dosyaları
```

### 5.2 Özellikle İncelenecek Database Konuları

```text
public.submissions
user_profiles_v2
rolesgo_roles
rolesgo_features
rolesgo_role_features
attribute_catalog veya eşdeğer attribute tabloları
role_attribute_rules veya eşdeğer rol-attribute tabloları
user attribute değerlerinin tutulduğu mevcut tablolar
individual_profile_details
RLS policies
RPC functions
trigger functions
```

### 5.3 Discovery Raporunda Cevaplanması Gereken Sorular

1. `public.submissions` tablosundaki gerçek e-posta alanı hangisidir?
2. Hangi submission type kayıtları bireysel profil onboarding kapsamına alınmalıdır?
3. `public.submissions` tablosunda zaten `user_id` veya benzer auth bağlantısı var mıdır?
4. `user_profiles_v2` ile `auth.users` arasındaki gerçek bağlantı nedir?
5. Kullanıcı başına tek profil garantisi mevcut mudur?
6. Profil tablosunda `pending`, `draft`, `active`, `public`, `visibility`, `verification_status` veya benzeri alanlar mevcut mudur?
7. Auth signup sonrasında profil satırı otomatik trigger ile oluşuyor mu?
8. Pre-auth profil oluşturmak mümkün müdür, yoksa profil için `auth.users.id` zorunlu mudur?
9. `attribute_catalog`, `role_attribute_rules`, `update_profile_attribute`, `get_current_user_profile()` veya eşdeğer yapılar mevcut mudur?
10. User attribute değerleri hangi tabloda ve hangi veri tipinde tutulmaktadır?
11. Google OAuth UI içinde mevcut mudur ve redirect URL yapısı nasıldır?
12. Magic Link akışı mevcut mudur?
13. Onboarding için reuse edilebilecek mevcut helper, RPC veya Edge Function var mıdır?
14. `public.submissions` ve profil tabloları için mevcut RLS policy davranışları nelerdir?
15. Taxonomy veri kaynağı nerede tutulmaktadır ve tüm kategori-alt kategori kombinasyonları nelerdir?
16. Admin panelinde mevcut kullanıcı listesi ve kullanıcı detay route yapısı nasıldır?
17. Mevcut audit log altyapısı var mıdır?

### 5.4 Discovery Sonrası Zorunlu Çıktı

İlk kod değişikliğinden önce kısa bir implementation report üret:

```text
- Mevcut gerçek tablo ve kolonlar
- Reuse edilecek mevcut mekanizmalar
- Eklenecek migration değişiklikleri
- Etkilenecek frontend dosyaları
- Etkilenecek backend/script dosyaları
- Riskler
- Açık kararlar
- Uygulama sırası
```

---

## 6. Hedef Veri Modeli

Aşağıdaki model kavramsaldır. Gerçek kolon ve foreign key tanımları discovery sonrasında mevcut şemaya göre uyarlanmalıdır.

### 6.1 `public.submissions`

Yeni `/form` kayıtlarının auth ile bağlanabilmesi için gerekliyse ekle:

```sql
user_id uuid null references auth.users(id)
```

Kurallar:

- Eski submission kayıtları için doğrudan toplu backfill yapma.
- Yeni authenticated finalize akışında `user_id` doldur.
- Mevcut RLS policy davranışını zayıflatma.
- Aynı pending payload birden fazla kez resume edildiğinde duplicate submission insert oluşmasını engelle.

### 6.2 `public.profile_onboarding_imports`

Geçmiş submission kayıtlarının import ve aktivasyon durumunu takip etmek için yeni tablo ekle.

Önerilen kavramsal alanlar:

```text
id
batch_id
source_submission_id
email_normalized
auth_user_id
profile_id
source_type
status
invite_sent_at
activated_at
retry_count
last_error
created_at
updated_at
```

Önerilen status değerleri:

```text
queued
invalid_email
duplicate_submission
existing_auth_user
profile_created
invited
invite_failed
pending_user_review
active
manual_review
opted_out
```

Kurallar:

- E-posta normalize işlemi `trim + lowercase` olmalıdır.
- İlgili import kaynağı kapsamında normalize e-posta benzersizliğini garanti et.
- Raw auth token saklama.
- Geçici parola saklama.
- `email_normalized`, `auth_user_id`, `profile_id`, `status`, `batch_id` için index ekle.
- RLS aktif olmalıdır.
- Kullanıcılar onboarding kayıtlarını browse edememelidir.
- Bulk import yalnızca service-role kullanan trusted server-side script üzerinden yapılmalıdır.
- Kullanıcının kendi aktivasyonunu tamamlaması için gerekiyorsa kontrollü RPC kullan; istemciye onboarding tablosuna serbest erişim verme.

### 6.3 Bireysel Profil İçin Yeni Attribute Alanları

Aşağıdaki dört alan bireysel profil tarafında desteklenmelidir:

| Attribute key | UI etiketi | Veri tipi | Görünürlük |
|---|---|---|---|
| `business_or_organization` | İşletme / Kuruluş | text | public veya private seçilebilir |
| `interest_focus` | İştigal / İlgi Sahası | text | public veya private seçilebilir |
| `referral_code` | Referral Kodu | text | zorunlu private |
| `referral_source` | Bizi nereden buldunuz? | select | zorunlu private |

Kurallar:

- Mevcut attribute kataloğu varsa oraya ekle.
- Mevcut rol-attribute kural tablosu varsa bu dört alanı `bireysel` rolü için etkinleştir.
- `referral_code` ve `referral_source` backend seviyesinde her koşulda private olmalıdır.
- UI bu iki private-only alan için visibility kontrolü göstermemelidir.
- `/form` ile profil editörü aynı normalization helper ve aynı `referral_source` option set kaynağını kullanmalıdır.
- `referral_detail` profile taşınmamalıdır; mevcut submissions tarafında kalmalıdır.

### 6.4 Legacy Bireysel Profil Mirror Uyumluluğu

Mevcut public view veya legacy kod gerektiriyorsa aşağıdaki alanları `individual_profile_details.profile_settings` içine mirror et:

```text
business_or_organization
interest_focus
referral_code
referral_source
```

Kurallar:

- Mirror katmanı kanonik auth kimliğinin yerine geçmez.
- Aynı alanlar birden fazla yerde saklanıyorsa write path tek helper veya RPC ile kontrol edilmelidir.
- Public view yalnızca public görünürlüğe sahip alanları göstermelidir.
- Referral alanları hiçbir public görünümde yer almamalıdır.

### 6.5 Feature Override Yapısı

Mevcut eşdeğer tablo yoksa ekle:

```text
user_feature_overrides
- id
- user_id
- feature_id veya feature_key
- override_value boolean
- created_at
- updated_at
```

Kurallar:

- `true`: feature kullanıcı için aktif.
- `false`: feature kullanıcı için pasif.
- Kullanıcıya özel kayıt rol değişikliğinde silinmemelidir.
- User + feature kombinasyonu unique olmalıdır.

Efektif feature öncelik sırası:

```text
1. Kullanıcıya özel feature override
2. Kullanıcının rolünden gelen varsayılan feature
3. Feature için sistem varsayılanı
```

### 6.6 Attribute Kataloğu ve User Attribute Değerleri

Mevcut eşdeğer tablolar yoksa aşağıdaki kavramsal yapıyı ekle:

```text
attributes veya attribute_catalog
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

```text
user_attributes veya mevcut eşdeğeri
- id
- user_id
- attribute_id
- value jsonb veya mevcut esnek tip
- visibility
- created_at
- updated_at
```

Desteklenmesi beklenen değer türleri:

```text
boolean
string
number
date
json
list
```

Kurallar:

- Aynı işlevi sağlayan mevcut tablo varsa yeni duplicate tablo oluşturma.
- Attribute değerleri için validasyon metadata bazlı olmalıdır.
- Private-only attribute kuralları backend tarafında zorlanmalıdır.

### 6.7 Audit Log

Mevcut eşdeğer yapı yoksa ekle:

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
profile_invited
profile_activated
```

Kurallar:

- Admin kaynaklı değişiklikler audit log içine yazılmalıdır.
- Kullanıcının kendi profil aktivasyonu da uygun şekilde kayıt altına alınmalıdır.
- Hassas değerleri gereksiz şekilde loglama.
- Service-role key, token veya parola hiçbir koşulda loglanmamalıdır.

---

## 7. Taxonomy Tabanlı Rol Yapısı

### 7.1 İsimlendirme Standardı

Teknik rol key değeri ASCII uyumlu ve layout/API seviyesinde anlaşılır olmalıdır:

```text
AnaKategori_AltKategori
```

Örnek teknik key değerleri:

```text
Individual_Bireysel
Consultant_Egitim
Consultant_HukukVergi
Consultant_Gayrimenkul
Consultant_VizeGocmenlik
Consultant_Finansal
Consultant_YasamRelocation
Consultant_AileCocuk
Consultant_PsikologKoc
Consultant_PratikHayat
Organization_DernekVakif
Organization_OdaKonsey
Organization_AkademikBirim
Organization_EgitimKurulusu
Organization_TurkMedya
Organization_Konsolosluk
Organization_SaglikKurulusu
Community_WhatsApp
Community_Telegram
Community_Discord
Community_Facebook
Community_Instagram
Community_LinkedIn
```

UI label alanlarında Türkçe karakter kullanılabilir:

```text
Danışman - Eğitim
Danışman - Hukuk ve Vergi
Kuruluş - Dernek ve Vakıf
Kuruluş - Sağlık Kuruluşu
Topluluk - WhatsApp
```

### 7.2 Taxonomy Import Kuralları

- Taxonomy içindeki tüm ana kategori ve alt kategorileri analiz et.
- Her taxonomy leaf için benzersiz ve okunabilir role key üret.
- Teknik key değerlerinde Türkçe karakter kullanma.
- Mevcut role key ile çakışma varsa duplicate oluşturma.
- Seed işlemi idempotent olmalıdır.
- Rol pasife alınabilir olmalı; geçmiş kullanıcı bağlantılarını otomatik silme.
- Layout kararlarında key parsing yerine mümkünse explicit metadata kullan.

### 7.3 Rol-Feature Varsayılanları

Her rol varsayılan feature listesine sahip olmalıdır.

Örnek:

```text
Consultant_Egitim
- profile_public
- profile_edit
- service_add
- appointment_receive
- messaging_enabled
```

Kurallar:

- Rol değiştiğinde efektif feature listesi yeni rol varsayımlarına göre yeniden hesaplanmalıdır.
- User-specific override kayıtları korunmalıdır.
- UI efektif feature kaynağını gösterebilmelidir: `role default`, `user override`, `system default`.

---

## 8. Faz Bazlı Uygulama Planı

## Faz 0 — Discovery ve Mimari Karar Raporu

### Amaç

Gerçek repository ve database yapısını incele; varsayımlar yerine mevcut yapıya göre implementation kararı ver.

### Yapılacaklar

- Bölüm 5 kapsamındaki tüm dosya ve migration incelemelerini yap.
- Mevcut schema, RPC, trigger ve RLS policy yapılarını raporla.
- Reuse edilecek yapıların listesini çıkar.
- Duplicate mekanizma yaratma risklerini belirt.
- İlk migration kapsamını netleştir.

### Faz Çıkışı

```text
DISCOVERY_REPORT.md veya cevap içinde ayrıntılı discovery raporu
```

### Gate

Discovery raporu üretilmeden migration yazma.

---

## Faz 1 — Minimum Onboarding Foundation Migration

### Amaç

Yeni `/form` auth-linked finalize ve geçmiş kullanıcı import akışının minimum database temelini oluştur.

### Migration Kuralı

İlk aşamada tam olarak bir yeni forward-only migration oluştur. Bu migration mevcut şemaya göre minimum gerekli değişiklikleri içermelidir.

### Minimum Kapsam

Discovery sonucuna bağlı olarak:

1. Gerekliyse `public.submissions.user_id` nullable auth reference ekle.
2. `public.profile_onboarding_imports` tablosunu ekle.
3. Index ve unique constraint tanımlarını ekle.
4. Yeni tablo için RLS enable et.
5. Client browse erişimini engelle.
6. Aktivasyon için gerekiyorsa minimal güvenli RPC ekle.
7. Dört bireysel profil attribute key değerini mevcut kataloğa idempotent şekilde ekle.
8. Mevcut rol-attribute kural tablosu varsa `bireysel` rolü için ilgili kayıtları ekle.
9. Private-only referral attribute zorlamasını RPC veya mevcut update mekanizması içinde uygula.

### Bu Fazda Yapılmayacaklar

- Geniş taxonomy rol seed işleminin tümünü aynı migration içine sıkıştırma.
- Admin panelini geliştirme.
- Legacy `admin_users` sistemini genişletme.
- Mevcut migration dosyalarını değiştirme.
- RLS policy zayıflatma.

### Gate

- Local veya staging migration uygulanmalı.
- RLS testleri geçmeli.
- Var olan public form ve profile akışlarında regression olmamalı.

---

## Faz 2 — Shared Onboarding Domain Katmanı

### Amaç

Yeni `/form` ve geçmiş kullanıcı aktivasyonunun ortak validation, normalization ve idempotency kurallarını tek yerde toplamak.

### Önerilen Dosyalar

```text
src/lib/profile-onboarding-schemas.ts
src/lib/profile-onboarding-api.ts
src/lib/profile-onboarding-normalize.ts
src/hooks/use-profile-onboarding.ts
```

### Gerekli Yapılar

```text
PendingOnboardingPayload
PendingOnboardingPayloadVersion
normalizeEmail()
normalizePendingFormPayload()
getReferralSourceOptions()
savePendingOnboardingPayload()
loadPendingOnboardingPayload()
clearPendingOnboardingPayload()
resumePendingOnboarding()
finalizeAuthenticatedSubmission()
```

### Kurallar

- Pending browser payload versioned olmalıdır.
- Payload schema Zod ile validate edilmelidir.
- Invalid veya eski version payload güvenli biçimde temizlenmelidir.
- Finalize idempotent olmalıdır.
- Submission insert ve profil senkronu mümkün olduğunca tek güvenli RPC veya kontrollü transaction mantığı ile yapılmalıdır.
- Client tarafından gönderilen `user_id` güvenilir kabul edilmemelidir; auth session kimliği kullanılmalıdır.
- Client tarafından gönderilen email profil claim amacıyla kullanılmamalıdır.

---

## Faz 3 — Yeni `/form` Auth Entegrasyonu ve Profil Senkronu

### Amaç

Bundan sonraki form doldurma işlemlerini auth-linked finalize modeline geçirmek.

### Etkilenecek Dosyalar

```text
src/pages/FormPage.tsx
src/lib/profile-onboarding-api.ts
src/lib/profile-onboarding-schemas.ts
src/lib/profile-onboarding-normalize.ts
mevcut login/OAuth helper dosyaları
src/pages/ProfilePage.tsx veya auth dönüşünde resume yapılan ilgili sayfalar
```

### Akış

1. Kullanıcı `/form` alanlarını doldurur.
2. Submit öncesinde veri normalize edilir ve versioned pending payload olarak browser storage içine yazılır.
3. Kullanıcı Google OAuth veya email/password auth akışına yönlendirilir.
4. OAuth dönüşünde veya email/password auth tamamlandığında session kontrol edilir.
5. Session varsa pending payload restore edilir.
6. Submission kaydı authenticated user bağlamında finalize edilir.
7. `public.submissions.user_id` doldurulur.
8. Bireysel profil alanları mevcut değerleri yanlışlıkla ezmeden senkron edilir.
9. Pending payload temizlenir.
10. Başarılı sonuç kullanıcıya gösterilir.

### Resume Noktaları

En az aşağıdaki sayfalarda ortak resume helper çalışmalıdır:

```text
/form
/profile/bireysel
```

Gerekirse auth callback sonrası yönlendirme noktasına da ekle.

### Email/Password Senaryoları

- `signUp` anında session dönerse hemen finalize et.
- Email doğrulaması nedeniyle session dönmezse pending payload saklanmaya devam etsin.
- Kullanıcı ilk authenticated dönüşte otomatik resume edilsin.

### Google OAuth Senaryosu

- OAuth yönlendirmesinden önce pending payload korunmalı.
- OAuth dönüşünde session varsa restore + finalize yapılmalı.
- Google ayrı user tablosu olarak ele alınmamalı.

### Duplicate Önleme

- Aynı pending payload birden çok kez finalize edilirse tek submission oluşmalıdır.
- Bunun için payload id, idempotency key veya mevcut submission unique yaklaşımına uyarlanmış güvenli bir yöntem kullanılmalıdır.

---

## Faz 4 — Güvenli Server-Side Toplu Import ve Davet Scripti

### Amaç

Geçmişte form doldurmuş fakat auth olmamış yaklaşık 100 kişiyi kontrollü olarak onboarding sürecine almak.

### Oluşturulacak Dosyalar

```text
scripts/import-profile-invites.ts
scripts/report-profile-onboarding.ts
```

### Environment Değişkenleri

Script yalnızca trusted ortamda aşağıdaki environment değişkenlerini kullanmalıdır:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
APP_URL
```

### Admin Client Kuralları

Server-side script içinde ayrı admin Supabase client oluştur:

```typescript
createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
```

Kurallar:

- Bu client browser koduna import edilmemelidir.
- Service-role key hiçbir `VITE_*` değişkenine konulmamalıdır.
- Environment değişkenleri script başlangıcında validate edilmelidir.
- Log çıktısında secret gösterilmemelidir.

### Script Davranışı

Script:

1. Seçilen `public.submissions` kayıtlarını okur.
2. E-posta adreslerini `trim + lowercase` ile normalize eder.
3. Invalid e-postaları belirler.
4. Aynı normalize e-posta için duplicate ve conflicting submission kayıtlarını belirler.
5. Mevcut Supabase Auth user kayıtlarını güvenli server-side yöntemle kontrol eder.
6. Duplicate auth kullanıcı oluşturmaz.
7. Kullanıcının daha önce düzenlediği profil alanlarını ezmez.
8. Yalnızca boş veya açıkça import edilebilir alanları doldurur.
9. Her sonucu `profile_onboarding_imports` tablosuna yazar.
10. Partial failure sonrası resume edilebilir olmalıdır.
11. Okunabilir summary report üretir.
12. Kişisel veriyi gereksiz şekilde loglamaz.
13. `unknown` error handling kullanır.

### Yeni Kullanıcı Akışı

Her geçerli, unique ve yeni e-posta için:

```typescript
supabase.auth.admin.inviteUserByEmail(email, {
  redirectTo: `${APP_URL}/welcome/activate`,
  data: {
    onboarding_source: 'legacy_form_import',
    source_submission_id: sourceSubmissionId,
  },
})
```

Sonrasında:

1. Oluşan `auth.users.id` değerini al.
2. `user_profiles_v2` içinde pending profil taslağı upsert et.
3. Import tracking row oluştur veya güncelle.
4. Status değerini `invited` yap.
5. Profil taslağını active veya public yapma.

### Mevcut Auth Kullanıcısı Akışı

Mevcut auth kullanıcısı bulunduğunda:

1. İkinci auth user oluşturma.
2. Yeni invite işlemi yapma veya discovery sonrasında belirlenen uygun bildirim akışını kullan.
3. Yalnızca eksik ve import edilebilir profil alanlarını doldur.
4. User-edited alanları ezme.
5. Tracking status değerini `existing_auth_user` yap.
6. Ayrı notification report içine dahil et.

### Invalid veya Conflicting Kayıt Akışı

- Invalid e-posta için auth user oluşturma.
- Çakışan submission kayıtları için otomatik karar verme.
- Tracking kaydı ekle.
- Uygun status kullan:

```text
invalid_email
manual_review
duplicate_submission
```

### Package Scripts

`package.json` içine Windows PowerShell kullanımına uygun komutlar ekle:

```powershell
npm run onboarding:import -- --dry-run
npm run onboarding:import -- --limit=5
npm run onboarding:import -- --batch-size=25 --send-invites
npm run onboarding:import -- --resume-failed
npm run onboarding:report
```

### Script Güvenlik Kuralları

- Default çalışma modu dry-run olmalıdır.
- Davet göndermek için açıkça `--send-invites` flag zorunlu olmalıdır.
- `--limit` ve `--batch-size` desteklenmelidir.
- Tamamlanmış kayıtlar tekrar işlenmemelidir.
- Failed kayıtlar `--resume-failed` ile tekrar denenebilmelidir.
- Tüm 100 kişiye kontrolsüz şekilde tek seferde davet gönderilmemelidir.

### Report İçeriği

```text
Total source submissions
Unique normalized emails
Existing auth users
New invited users
Profiles created
Profiles updated
Invalid emails
Duplicate submissions
Manual review records
Failed invitations
Retry candidates
```

---

## Faz 5 — Profil Aktivasyon Sayfası

### Amaç

Davet linkine tıklayan kullanıcının taslak profilini inceleyerek bilinçli şekilde aktive etmesini sağlamak.

### Oluşturulacak Dosyalar

```text
src/pages/onboarding/ActivateProfilePage.tsx
src/lib/profile-onboarding-api.ts
src/lib/profile-onboarding-schemas.ts
```

Gerekirse:

```text
src/hooks/use-profile-onboarding.ts
src/components/onboarding/*
```

### Route

```text
/welcome/activate
```

### Route Ekleme Kuralı

- `src/App.tsx` içinde yalnızca bu route için targeted değişiklik yap.
- Geniş routing refactor yapma.
- SEO-locked route değerlerini değiştirme.

### Aktivasyon Akışı

1. Mevcut Supabase session kontrol edilir.
2. Session varsa authenticated user ID üzerinden pending profil çekilir.
3. Import edilen alanlar düzenlenebilir form alanı olarak gösterilir.
4. Kullanıcı profilini incelediğini onaylar.
5. İzin verilen değişiklikler kaydedilir.
6. Profil ve onboarding tracking kaydı active olarak işaretlenir.
7. `activated_at` doldurulur.
8. Kullanıcı profil sayfasına yönlendirilir.
9. Kullanıcı başka kullanıcıların verisini göremez.

### Expired Link Akışı

Aktivasyon linki geçersiz veya süresi dolmuşsa:

- Kullanıcıya erişim linkini yeniden gönderme seçeneği göster.
- `signInWithOtp()` kullan.
- `shouldCreateUser: false` kullan.
- Redirect URL yeniden `/welcome/activate` olmalıdır.

Örnek davranış:

```typescript
supabase.auth.signInWithOtp({
  email,
  options: {
    shouldCreateUser: false,
    emailRedirectTo: `${APP_URL}/welcome/activate`,
  },
})
```

### Frontend Kuralları

- Mevcut `AuthProvider` kullan.
- `src/lib/supabase.ts` kullan.
- API module yaklaşımını takip et.
- React Query kullan.
- Zod kullan.
- `react-hook-form` kullan.
- Loading, error, success state tanımla.
- `@/` path alias kullan.
- Client-supplied user ID ile işlem yapma.

---

## Faz 6 — Bireysel Profil Editörü ve Public Profil Uyumu

### Amaç

Yeni bireysel alanların kullanıcı tarafından düzenlenmesini ve görünürlük kurallarının doğru uygulanmasını sağlamak.

### Etkilenecek Dosyalar

```text
src/pages/ProfilePage.tsx
src/lib/individual-profile.ts
ilgili hook ve type dosyaları
public bireysel profil görünüm bileşenleri
```

### Profil Editörü

`/profile/bireysel` içinde şu an locked duran `Rolüne Özel Alanlar` kartını gerçek editör haline getir.

Render kaynağı:

```text
groupedAttributes.roleSpecific
```

Alanlar:

```text
business_or_organization → text input
interest_focus            → text input
referral_code             → text input
referral_source           → shared options kullanan select
```

Kaydetme yaklaşımı:

```text
section-level save
```

Tek kart üzerindeki alanlar toplu kaydedilmelidir.

### Görünürlük

- `business_or_organization`: public/private kontrolü göster.
- `interest_focus`: public/private kontrolü göster.
- `referral_code`: visibility kontrolü gösterme; backend private zorlasın.
- `referral_source`: visibility kontrolü gösterme; backend private zorlasın.

### Public Profil

- `interest_focus` public ise uzmanlık veya spotlight satırında göster.
- `business_or_organization` public ise header altı yardımcı bilgi veya bilgi çipi olarak göster.
- `referral_code` hiçbir public görünümde gösterilmemeli.
- `referral_source` hiçbir public görünümde gösterilmemeli.

---

## Faz 7 — Rol, Feature, Attribute Foundation ve Taxonomy Seed

### Amaç

Roller, features, rol-feature eşleştirmeleri, user-specific override ve attribute yapısını genişletmek.

### Migration Yaklaşımı

- Faz 1 doğrulandıktan sonra ayrı forward-only migration dosyaları oluştur.
- Her migration tek bir anlaşılır amaç taşımalıdır.
- Mevcut `rolesgo_*` tablolarını reuse et.
- Duplicate rol, feature veya attribute kataloğu oluşturma.

### Yapılacaklar

1. Taxonomy kaynağını analiz et.
2. Tüm taxonomy leaf değerlerini ASCII uyumlu role key olarak seed et.
3. UI label değerlerini Türkçe oluştur.
4. Gerekli varsayılan feature kayıtlarını oluştur.
5. Role-feature eşleştirmelerini idempotent seed et.
6. Mevcut user feature hesaplama mantığını override destekleyecek şekilde genişlet.
7. Mevcut attribute yapısını flexible data type desteğiyle genişlet.
8. Private-only attribute kuralını backend seviyesinde uygula.
9. RLS policy yapılarını test et.

### Efektif Feature Resolver

Tek bir ortak resolver veya RPC üzerinden efektif feature listesi üret:

```text
user override > role default > system default
```

Resolver çıktısında mümkünse kaynağı da döndür:

```text
feature_key
is_enabled
source: user_override | role_default | system_default
```

### Gate

- Mevcut kullanıcıların feature erişimleri regression yaşamamalı.
- Legacy kod ile gerekli uyumluluk korunmalı.
- Yeni roller admin paneli yapılmadan önce API seviyesinde doğrulanmalı.

---

## Faz 8 — Merkezi Admin Paneli

### Amaç

Rol, feature, attribute ve user-specific override işlemlerini merkezi admin ekranlarından yönetmek.

### Menü Yapısı

```text
Kullanıcı Yönetimi
- Kullanıcılar

Yetki ve Tanım Yönetimi
- Roller
- Features
- Attributes
```

Tercihen aynı admin bölümü altında sekmeli yapı kullan:

```text
Roller
Features
Attributes
Rol - Feature Eşleştirmeleri
```

### Admin CRUD İşlemleri

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

### Kullanıcı Detay Sayfası

Aşağıdaki bölümleri ekle:

```text
Genel Bilgiler
Roller
Feature Overrides
Attributes
```

Admin aşağıdaki işlemleri yapabilmelidir:

```text
- Kullanıcının rolünü değiştirme
- Kullanıcıya özel feature ekleme
- Kullanıcı için feature kapatma
- Feature override kaydını kaldırma
- Kullanıcıya özel attribute ekleme
- Attribute değerini güncelleme
- Attribute değerini silme
```

### Rol Değiştirme Akışı

- Mevcut rolü göster.
- Yeni rol için searchable select veya dropdown kullan.
- Kaydetmeden önce onay iste.
- User-specific feature override kayıtlarını silme.
- User-specific attribute kayıtlarını silme.
- Audit log kaydı oluştur.

### Kod Organizasyonu

Muhasebe modülünü örnek al:

```text
src/pages/admin/access-management/*
src/components/admin/access-management/*
src/lib/access-management-api.ts
src/lib/access-management-schemas.ts
src/hooks/use-access-management.ts
```

React Query kullan. Component içinde doğrudan dağınık Supabase query yazma.

---

## Faz 9 — Google OAuth ve Magic Link Doğrulaması

### Google OAuth Kuralları

- Supabase Auth tek identity hub olmalıdır.
- Google yalnızca OAuth provider olmalıdır.
- Ayrı Google kullanıcı tablosu oluşturma.
- Google password üretme.
- MVP kapsamında manuel `linkIdentity()` ekleme; önce Supabase automatic identity linking davranışını doğrula.
- Aynı doğrulanmış e-posta ile giriş sonrasında aynı `auth.users.id` oluştuğunu test et.

### Redirect URL Kontrolü

Supabase allowed redirect list içinde en az aşağıdaki URL bulunmalıdır:

```text
https://corteqs.net/welcome/activate
```

Gerekli staging ve local URL değerlerini de ekle.

### Magic Link Kuralları

- Kullanıcı daha önce oluşturulmamışsa expired-link resend akışı yanlışlıkla user oluşturmamalıdır.
- Bu nedenle `shouldCreateUser: false` zorunludur.

---

## Faz 10 — E-Posta Teslimatı ve Kontrollü Rollout

### Production Davetlerinden Önce

1. Supabase custom SMTP ayarını doğrula.
2. Sender domain doğrulamasını kontrol et.
3. Supabase Invite User template içeriğini özelleştir.
4. Redirect URL allowlist değerlerini kontrol et.
5. İç kullanıcılarla 5 kişilik test batch çalıştır.
6. Sonuçları incele.
7. 10 kişilik pilot batch çalıştır.
8. Sonuçları incele.
9. Kalan kullanıcıları yaklaşık 20–25 kişilik kontrollü batch halinde işle.
10. Rate limit güvenli biçimde yükseltilmemişse saatte yaklaşık 20–25 daveti aşma.
11. Failed kayıtları retry listesine al.

### E-Posta İçeriği Gereksinimleri

Türkçe branded davet e-postası:

- Profil taslağının daha önce doldurulan CorteQS formundan oluşturulduğunu açıklamalı.
- Profilin kullanıcı incelemesi ve onayı olmadan aktif olmayacağını açıkça belirtmeli.
- Net bir aktivasyon butonu içermeli.
- Daha sonra Google veya e-posta login kullanılabileceğini açıklamalı.
- Opt-out ve silme talebi yöntemi içermeli.
- Ayrı marketing consent yoksa pazarlama dili kullanmamalı.

---

## 9. Güvenlik Gereksinimleri

Aşağıdaki kurallar zorunludur:

- `SUPABASE_SERVICE_ROLE_KEY` frontend koduna konulmamalıdır.
- Secret key hiçbir `VITE_*` environment değişkeninde kullanılmamalıdır.
- Raw invitation token saklanmamalıdır.
- Random temporary password üretilmemelidir.
- Browser üzerinden Supabase Auth Admin API çağrılmamalıdır.
- RLS aktif tutulmalıdır.
- User identity her zaman authenticated session üzerinden alınmalıdır.
- Client-supplied `user_id` güvenilir kabul edilmemelidir.
- Client-supplied e-posta ile profil claim yapılmamalıdır.
- Imported profil kullanıcı incelemesi olmadan public yapılmamalıdır.
- Kullanıcı yalnızca form doldurdu diye `email_confirm: true` yapılmamalıdır.
- Duplicate işlem unique constraint ve idempotent logic ile engellenmelidir.
- Existing user-edited alanlar yanlışlıkla overwrite edilmemelidir.
- Kullanıcıya generic hata göster; server-side log içinde yeterli diagnostic bilgi tut.
- Secret, token, parola ve gereksiz kişisel veri loglama.
- Yeni public tabloların tamamında RLS enable et.
- Existing RLS policy yapılarını convenience amacıyla gevşetme.

---

## 10. Test Planı

## 10.1 Unit ve Integration Testleri

Vitest kullanarak aşağıdaki senaryoları kapsa:

### Yeni `/form` Akışı

1. Google girişine basıldığında pending form state kaybolmamalı.
2. OAuth dönüşünde restore + finalize çalışmalı.
3. Email/password signup session döndürürse finalize hemen çalışmalı.
4. Email/password signup session döndürmezse pending payload korunmalı.
5. İlk authenticated dönüşte resume çalışmalı.
6. Resume birden çok kez çalıştırıldığında duplicate submission oluşmamalı.
7. Submission insert `user_id` ile kaydedilmeli.

### Profil Attribute Testleri

8. Dört bireysel attribute `get_current_user_profile()` veya eşdeğer response içinde dönmeli.
9. `business_or_organization` public/private desteklemeli.
10. `interest_focus` public/private desteklemeli.
11. `referral_code` public visibility gönderilse bile private saklanmalı.
12. `referral_source` public visibility gönderilse bile private saklanmalı.
13. Public profil referral alanlarını göstermemeli.

### Toplu Import Scripti

14. Yeni geçerli e-posta invitation oluşturmalı.
15. Existing auth user için ikinci auth user oluşturulmamalı.
16. Existing completed profile overwrite edilmemeli.
17. Normalize e-postası aynı olan duplicate submission kayıtları duplicate user oluşturmamalı.
18. Conflicting submission manuel review durumuna alınmalı.
19. Invalid e-posta auth user oluşturmamalı.
20. SMTP invitation failure retry adayı olmalı.
21. Script tekrar çalıştırıldığında completed kayıtlar duplicate işlenmemeli.
22. `--resume-failed` yalnızca uygun kayıtları tekrar işlemeli.

### Aktivasyon ve Auth

23. Expired invitation resend flow çalışmalı.
24. Resend flow `shouldCreateUser: false` kullanmalı.
25. Unauthorized kullanıcı onboarding tracking kayıtlarını browse edememeli.
26. Kullanıcı yalnızca kendi pending profilini aktive edebilmeli.
27. Profil aktivasyonunda `activated_at` yazılmalı.
28. Google login aynı e-postada aynı Supabase auth user ID ile sonuçlanmalı.

### Yetki Sistemi

29. Efektif feature resolver user override değerine öncelik vermeli.
30. Override yoksa rol varsayılanı kullanılmalı.
31. Rol varsayılanı yoksa sistem varsayılanı kullanılmalı.
32. Rol değişikliğinde user override silinmemeli.
33. Rol değişikliğinde user attribute silinmemeli.
34. Audit log kaydı oluşmalı.
35. Taxonomy role seed tekrar çalıştırıldığında duplicate üretmemeli.

## 10.2 Playwright E2E Testleri

Aşağıdaki kritik journey test edilmelidir:

```text
Davet linki → /welcome/activate → session kontrolü → profil taslağını görme → alan düzenleme → onay → aktivasyon → profil sayfasına redirect
```

Ek journey:

```text
/form doldurma → Google OAuth yönlendirmesi → callback → pending payload restore → authenticated submission finalize → profil görünümü
```

## 10.3 Security ve RLS Testleri

- Auth olmayan kullanıcı `profile_onboarding_imports` okuyamamalı.
- Başka kullanıcı onboarding kaydını okuyamamalı.
- Başka kullanıcı profilini aktive edememeli.
- Referral alanları backend zorlamasıyla private kalmalı.
- Browser bundle içinde service-role key bulunmamalı.
- Frontend üzerinden Auth Admin API çağrısı bulunmamalı.

## 10.4 Build ve Regression

```powershell
npm run verify:text
npm run test
npm run build
npm run verify:release
```

Production doğrulaması için:

```powershell
$env:BASE_URL = "https://corteqs.net"
npm run verify:release
```

---

## 11. Uygulama Sırası

Aşağıdaki sırayı koru:

1. Discovery yap ve raporla.
2. Minimum onboarding foundation için tek yeni migration oluştur.
3. Migration dosyasını local veya staging ortamında uygula.
4. RLS ve schema testlerini çalıştır.
5. Shared onboarding schema, API ve normalization katmanını geliştir.
6. Yeni `/form` auth-linked finalize akışını geliştir.
7. Bireysel profil editörü ve dört attribute alanını geliştir.
8. Server-side import ve reporting scriptlerini geliştir.
9. Önce yalnızca dry-run çalıştır.
10. Dry-run özetini incele.
11. `/welcome/activate` sayfasını geliştir.
12. Google OAuth ve Magic Link callback akışını doğrula.
13. Custom SMTP ve e-posta template ayarlarını doğrula.
14. Unit, integration ve Playwright testlerini çalıştır.
15. Production build çalıştır.
16. 5 kişilik internal pilot batch gönder.
17. Sonuçları incele.
18. 10 kişilik pilot batch gönder.
19. Sonuçları incele.
20. Kalan kullanıcıları kontrollü batch halinde işle.
21. Final import report üret.
22. Taxonomy rolleri, feature override altyapısı ve attribute foundation geliştirmelerini ayrı ileri yönlü migration dosyalarıyla tamamla.
23. Merkezi admin paneli ekranlarını geliştir.
24. Audit log ve admin user-detail yönetimini tamamla.
25. Regression, RLS, build ve release doğrulamalarını tekrar çalıştır.

---

## 12. Windows PowerShell Rollout Komutları

Aşağıdaki örnekler gerçek environment bilgileri girildikten sonra çalıştırılmalıdır.

### 12.1 Environment Ayarları

```powershell
$env:SUPABASE_URL = "https://<project-ref>.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "<service-role-key>"
$env:APP_URL = "https://corteqs.net"
```

### 12.2 Dry Run

```powershell
npm run onboarding:import -- --dry-run
```

### 12.3 Sınırlı İç Test

```powershell
npm run onboarding:import -- --limit=5 --send-invites
npm run onboarding:report
```

### 12.4 Pilot Batch

```powershell
npm run onboarding:import -- --batch-size=10 --send-invites
npm run onboarding:report
```

### 12.5 Kontrollü Production Batch

```powershell
npm run onboarding:import -- --batch-size=25 --send-invites
npm run onboarding:report
```

### 12.6 Failed Kayıtları Tekrar Deneme

```powershell
npm run onboarding:import -- --resume-failed --send-invites
npm run onboarding:report
```

### 12.7 Güvenlik Notu

Service-role key terminal session sonrasında temizlenmelidir:

```powershell
Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY
```

---

## 13. Rollback ve Retry Yaklaşımı

### 13.1 Rollback Prensibi

Production migration dosyalarını geriye dönük değiştirme. Sorun çıkarsa:

- Yeni forward-only corrective migration yaz.
- Invite gönderimini durdur.
- Frontend aktivasyon route özelliğini gerektiğinde feature flag ile kapat.
- Tracking tablosundaki status değerlerini kullanarak etkilenen batch kayıtlarını belirle.

### 13.2 Retry Prensibi

- `invite_failed` kayıtlarını `--resume-failed` ile tekrar işle.
- `manual_review`, `invalid_email`, `duplicate_submission` kayıtlarını otomatik retry etme.
- `existing_auth_user` kayıtları için ayrı bildirim veya manuel onboarding yaklaşımı kullan.
- `active` ve başarıyla tamamlanmış kayıtları tekrar işleme.

---

## 14. Scope Control

Bu çalışma sırasında aşağıdakileri yapma:

- `src/App.tsx` için geniş refactor yapma.
- Supabase client consolidation işini bu kapsama ekleme.
- `AuthProvider` dosyasını küçük targeted ihtiyaç dışında yeniden yazma.
- İlgisiz RLS policy dosyalarını değiştirme.
- Mevcut migration dosyalarını edit etme.
- Commercial Vite plugin yapısına dokunma.
- `server.mjs` dosyasını zorunlu değilse değiştirme.
- Legacy `admin_users` sistemini genişletme.
- Random temporary password ekleme.
- Tüm yaklaşık 100 daveti tek operasyonda kontrolsüz gönderme.
- Imported profilleri kullanıcı incelemesi olmadan active veya public yapma.
- Yalnızca tablo isimlerini sadeleştirmek için riskli rename migration yapma.

---

## 15. Kabul Kriterleri

Çalışma aşağıdaki koşullar sağlandığında tamamlanmış kabul edilir:

### Auth ve Profil

- Normalize e-posta başına en fazla bir Supabase Auth kullanıcısı vardır.
- Auth user başına en fazla bir kanonik `user_profiles_v2` satırı vardır.
- Yeni `/form` kayıtları auth-linked şekilde finalize edilir.
- Duplicate resume işlemleri duplicate submission oluşturmaz.
- Imported profiller kullanıcı aktivasyonuna kadar pending ve non-public kalır.
- Existing user-edited profil alanları yanlışlıkla overwrite edilmez.
- Magic Link çalışır.
- Google OAuth çalışır.
- Aynı doğrulanmış e-posta için Google OAuth ve e-posta login aynı Supabase identity ile sonuçlanır.

### Güvenlik

- Service-role key frontend bundle içine girmez.
- Browser Auth Admin API çağırmaz.
- Raw invitation token saklanmaz.
- RLS aktif kalır.
- User başka kullanıcıların onboarding veya profil verisini göremez.
- Referral alanları public profile içinde görünmez.

### Toplu Import

- Script default olarak dry-run çalışır.
- Davet gönderimi için explicit `--send-invites` gerekir.
- Script idempotent çalışır.
- Partial failure sonrasında resume mümkündür.
- Invalid ve conflicting kayıtlar raporlanır.
- Final import report okunabilir durumdadır.

### Rol, Feature ve Attribute Sistemi

- Taxonomy leaf kategorileri standart key yapısıyla role kataloğuna eklenmiştir.
- Her rolün varsayılan feature listesi yönetilebilir durumdadır.
- Kullanıcıya özel feature aktif veya pasif override atanabilir.
- Efektif feature çözümleme sırası doğrudur.
- Kullanıcıya özel flexible attribute atanabilir.
- Rol değişikliği user-specific override ve attribute kayıtlarını silmez.
- Roller, features ve attributes admin panelinden merkezi yönetilebilir.
- Değişiklikler audit log içinde izlenebilir.

### Kalite

- Unit ve integration testleri geçer.
- Playwright aktivasyon journey testi geçer.
- Production build geçer.
- Existing SEO-locked route değerleri korunur.
- İlgisiz modüller etkilenmez.

---

## 16. Her Faz Sonunda AI Agent Tarafından Sunulacak Rapor

Her faz sonunda aşağıdaki formatta rapor ver:

```text
1. Tamamlanan işler
2. Değiştirilen dosyalar
3. Eklenen migration dosyaları
4. Database değişiklikleri
5. Güvenlik kontrolü
6. Test çıktıları
7. Build çıktısı
8. Bulunan riskler
9. Açık kalan kararlar
10. Sonraki önerilen adım
```

Toplu onboarding fazı tamamlandığında ayrıca aşağıdakileri sun:

```text
- Dry-run output
- Pilot batch output
- Final import report
- Failed ve retry adayları
- Manual review kayıtları
- Windows PowerShell rollout komutları
- Forward-only rollback yaklaşımı
```

---

## 17. Uygulama İçin Kısa Özet

Bu planın temel sırası şöyledir:

```text
Önce keşfet ve gerçek şemayı doğrula.
Sonra minimum onboarding foundation migration ekle.
Yeni /form kayıtlarını auth-linked finalize modeline geçir.
Geçmiş submission kullanıcıları için güvenli ve dry-run varsayılanlı import scripti oluştur.
Davet alan kullanıcıya /welcome/activate üzerinde profil inceleme ve aktivasyon imkanı ver.
Bireysel profil alanlarını ve görünürlük kurallarını tamamla.
Ardından taxonomy tabanlı role seed, feature override, flexible attribute ve audit log altyapısını genişlet.
Son olarak merkezi admin panelini ekle ve kontrollü rollout yap.
```

---

**END OF MAIN PLAN**
