# CorteQS Premium Profile Experience — `Experimental_2` Pilot Prompt

Bu repoda doğrudan kod değişikliklerini uygula:

```text
https://github.com/ubterzioglu/corteqsmvp
```

---

# 1. Görevin Amacı

CorteQS platformundaki profil deneyimini daha profesyonel, premium, modern, mobil öncelikli ve Gen-Z uyumlu hale getir.

Bu çalışma canlı rollere doğrudan uygulanmayacak. İlk aşamada yalnızca kontrollü test amacıyla aşağıdaki flat rol üzerinde çalış:

```text
Experimental_2
```

Pilot kullanıcı:

| Alan | Değer |
|---|---|
| E-posta | `experimental2@corteqs.net` |
| Görünen ad | `Experimental Kullanıcı 2` |
| Atanan flat rol | `Experimental_2` |

Bu kullanıcı yalnızca test amacıyla kullanılacak. Yeni profil deneyimini önce bu kullanıcı ve bu flat rol üzerinde kanıtla. Kalan roller bu aşamada etkilenmemeli.

Ana hedef:

1. Dışarıdan görünen public profil layoutunu premium hale getirmek.
2. Kullanıcı giriş yaptığında kendi profilini düzenlediği layoutu premium hale getirmek.
3. Public profil ve authenticated profil ekranlarını aynı görsel sistem altında birleştirmek.
4. Yeni sistemi `Experimental_2` rolüyle izole test etmek.
5. Daha sonra kalan rollere config tabanlı biçimde genişletilebilecek bir temel oluşturmak.
6. Mevcut AFS, catalog, claim, auth, feature flag ve RPC sözleşmelerini bozmamak.

Bu çalışma yalnızca renk değişikliği veya kart gölgesi güncellemesi değildir. Kullanıcı deneyimini, bilgi mimarisini, responsive davranışı ve component yapısını birlikte iyileştir.

Plan yazıp uygulamayı erteleme. Önce ilgili dosyaları incele, ardından kod değişikliklerini uygula, testleri çalıştır ve sonunda ayrıntılı rapor ver.

---

# 2. Pilotun İzolasyon Kuralı

Bu görevin en kritik kuralı:

```text
Yeni tasarım yalnızca Experimental_2 flat rolünde aktif olmalı.
```

Aşağıdaki roller ve kullanıcılar bu pilot değişikliklerden etkilenmemeli:

```text
Experimental_1
User_DiasporaMember
Healthcare_Doctor
Business_*
Consultant_*
Organization_*
Community_*
Job_*
Marketplace_*
Admin_*
```

Yeni görünümü aktive ederken yalnızca legacy UI kategori segmentine güvenme.

Yanlış yaklaşım:

```ts
type === "bireysel"
```

Doğru yaklaşım:

```ts
profile?.roleKey === "Experimental_2"
```

Public profil tarafında mümkün olduğunda gerçek catalog payload içindeki rol anahtarını kullan:

```ts
item.roleKey === "Experimental_2"
```

Generic fallback her zaman çalışmaya devam etmeli.

---

# 3. Önce İncelenecek Dosyalar

Öncelikle aşağıdaki dosyaları oku:

```text
CLAUDE.md
AGENT_CONTEXT.md
ARCHITECTURE.md
src/App.tsx
src/lib/profile-types.ts
src/pages/ProfileResolverPage.tsx
src/pages/ProfilePage.tsx
src/pages/DirectoryCatalogItemPage.tsx
src/pages/DirectoryProfilePage.tsx
src/pages/CatalogItemEditorPage.tsx
src/hooks/useCurrentUserProfile.ts
src/hooks/usePublicCatalogProfile.ts
src/lib/member-profile.ts
src/lib/member-profile-api.ts
src/lib/member-catalog.ts
src/lib/public-catalog-profile-api.ts
src/lib/public-catalog-profile-schemas.ts
src/lib/public-catalog-profile-view-model.ts
src/components/profile/EditableProfilesSelector.tsx
src/components/directory/public-profile/PublicProfileShell.tsx
src/components/directory/public-profile/PublicProfileHero.tsx
src/components/directory/public-profile/PublicProfileQuickActions.tsx
src/components/directory/public-profile/PublicProfileSectionList.tsx
src/components/directory/public-profile/PublicProfileSectionFrame.tsx
src/components/directory/public-profile/PublicProfileSkeleton.tsx
src/components/directory/public-profile/PublicProfileEmptyState.tsx
src/components/directory/public-profile/PublicProfileNotFound.tsx
src/components/directory/public-profile/public-profile-utils.ts
src/components/directory/public-profile/edit/PublicProfileInlineEditor.tsx
src/components/directory/public-profile/edit/InlineAttributeField.tsx
src/components/directory/public-profile/section-renderers/renderer-registry.ts
src/index.css
tailwind.config.ts
```

Mevcut testleri de incele:

```text
src/lib/public-catalog-profile-view-model.test.ts
```

Repo içinde profil, catalog, AFS veya route davranışıyla ilgili ek testleri ara ve oku.

---

# 4. Mevcut Mimariyi Koru

## 4.1 Public profil route sözleşmesi

Canonical public profil route:

```text
/directory/catalog/:slug
```

Legacy route:

```text
/directory/profile/:userId
```

Legacy route canonical katalog slug adresine yönlenmeye devam etmeli.

## 4.2 Authenticated profil route sözleşmesi

Kullanıcının profil editörü:

```text
/profile
/profile/:type
```

`/profile` route'u düzenlenebilir profilleri çözümler ve uygun editöre yönlendirir.

`Experimental_2` rolünün hangi UI segmentine yönlendiğini mevcut resolver davranışıyla doğrula.

Mevcut sistemde bilinmeyen flat roller fallback olarak varsayılan UI kategorisine gidebilir. Bu nedenle aşağıdaki davranışı kontrol et:

```text
Experimental_2 -> /profile/bireysel
```

Bu davranış zaten çalışıyorsa gereksiz değişiklik yapma.

Ancak okunabilirlik ve kontrollü pilot izolasyonu için explicit mapping gerekiyorsa yalnızca şu override eklenebilir:

```ts
Experimental_2: "bireysel"
```

Bu override diğer flat rolleri etkilememeli.

## 4.3 Flat rol ve UI kategori ayrımı

DB tarafında çok sayıda flat rol bulunuyor. UI tarafında bunlar sınırlı sayıda kategori üzerinden render ediliyor.

Pilot tasarımın kaynağı UI segmenti değil, gerçek flat rol anahtarı olmalı:

```text
Experimental_2
```

## 4.4 Canonical veri sistemi

Legacy tabloları geri getirme veya yeniden kullanma:

```text
profiles
user_profiles
admin_users
role_feature_defaults
```

Canonical yapı:

```text
user_role_assignments
user_profile_attributes
user_feature_overrides
roles
afs_attributes
role_attributes
role_features
role_sections
catalog_items
catalog_item_attribute_values
```

## 4.5 Veri yazma yöntemi

Mevcut API ve RPC katmanlarını koru.

Yeni component içine doğrudan Supabase sorgusu ekleme.

Yanlış:

```ts
supabase.from(...)
supabase.rpc(...)
```

Doğru yaklaşım:

```text
src/lib/*-api.ts
React Query hook
```

Yeni auth kodunda yalnızca canonical import kullan:

```ts
import { useAuth } from "@/components/auth/useAuth";
```

## 4.6 Güvenlik

Aşağıdaki yardımcıları koru:

```text
toSafeExternalUrl
toSafePhoneHref
toSafeMailHref
toMapHref
```

Public profilde:

- Private attribute gösterme.
- Admin-only attribute gösterme.
- Unsafe URL gösterme.
- `javascript:` URL kabul etme.
- Owner olmayan kullanıcıya edit yetkisi verme.
- Claim state mantığını zayıflatma.
- Rol bazlı pilot görünümünü yanlış role uygulama.

## 4.7 Veritabanı değişikliği

Bu pilot için mümkün olduğunca migration yazma.

Önce mevcut payload, catalog ve AFS yapısını kullan.

Migration yalnızca gerçekten zorunluysa eklenebilir. Böyle bir durumda:

1. Neden gerektiğini raporda açıkla.
2. Eski migrationları silme veya yeniden sıralama.
3. Yalnızca yeni timestamp migration ekle.
4. Değişikliğin sadece pilot için gerekli olup olmadığını sorgula.
5. Frontend config ile çözülebilecek bir sorunu DB migration ile çözme.

---

# 5. Tasarım Yönü

Ortaya çıkan ekran klasik admin paneli gibi görünmemeli.

Aynı zamanda aşırı renkli, çocukça veya oyuncak gibi bir sosyal medya ekranına da dönüşmemeli.

Aranan denge:

```text
premium digital identity
+
modern diaspora networking platform
+
Gen-Z friendly visual language
+
mobile-first usability
+
professional trust
```

## 5.1 Görsel karakter

Kullan:

- Ferah yüzeyler
- Yumuşak gradient
- Kontrollü ambient glow
- Net tipografi
- Güçlü ama sade hero
- Yeterli beyaz alan
- Büyük ama dengeli radius
- İnce border
- Hafif shadow
- Lucide ikonlar
- Mikro hover animasyonları
- Net focus state
- Mobilde en az 44px dokunma alanı
- Light ve dark mode uyumu

Kaçın:

- Her kartta farklı parlak renk
- Aşırı neon
- Sürekli glassmorphism
- Her yerde yoğun blur
- Çok küçük yazılar
- Teknik attribute key gösterimi
- Fazla kart kalabalığı
- Public profilde admin panel hissi
- Gereksiz placeholder içerik
- Sahte production verisi
- Aşırı animasyon

## 5.2 Tipografi

Ana metinleri sürekli `text-[10px]` veya `text-[11px]` seviyesinde bırakma.

Genel hedef:

```text
Page title: text-2xl / md:text-3xl
Hero name: text-2xl / md:text-4xl
Section title: text-base veya text-lg
Body: text-sm veya text-base
Metadata: text-xs
Button text: text-sm
```

## 5.3 Dark mode

Light mode öncelikli olsa da dark mode kırılmamalı.

Mümkün olduğunca mevcut tema tokenlarını kullan:

```text
background
foreground
card
muted
border
primary
accent
```

Hardcoded renk kullanırsan dark mode karşılığını ekle.

## 5.4 Reduced motion

Dekoratif animasyonlar için mümkünse:

```css
@media (prefers-reduced-motion: reduce)
```

desteği ekle.

---

# 6. Presentation Config Katmanı Oluştur

Public ve authenticated profil sayfalarında aynı rolün görsel dili tutarlı olmalı.

Yeni bir presentation config katmanı oluştur.

Örnek dosya:

```text
src/lib/profile-presentation.ts
```

Örnek yaklaşım:

```ts
export type ProfilePresentationConfig = {
  key: string;
  supportedRoleKeys: string[];
  accent: ProfileAccent;
  heroVariant: "member" | "professional" | "business" | "organization" | "experimental";
  eyebrow?: string;
  primaryActionPriority: string[];
  preferredSectionOrder: string[];
  attributeGroups: Array<{
    key: string;
    title: string;
    description?: string;
    attributeKeys: string[];
  }>;
};
```

Bunu birebir kopyalamak zorunda değilsin. Daha iyi model oluşturabilirsin.

Ancak şu kurallar geçerli:

1. Flat rol anahtarına göre config çözümlenmeli.
2. `Experimental_2` için özel pilot config bulunmalı.
3. Tanımlanmamış roller generic fallback almalı.
4. `Experimental_1` pilot config almamalı.
5. Component içine dağılmış rol bazlı uzun `if` blokları oluşmamalı.
6. Config yalnızca presentation kararlarını içermeli.
7. Yetki, visibility ve backend kuralları config içine taşınmamalı.
8. Attribute yoksa boş kart render edilmemeli.
9. Production içine sahte kullanıcı verisi eklenmemeli.

Örnek resolver:

```ts
resolveProfilePresentation(roleKey?: string | null)
```

Örnek pilot kontrolü:

```ts
const presentation = resolveProfilePresentation(profile?.roleKey);
const isExperimental2Pilot = presentation.key === "experimental-2-premium";
```

Public tarafta da aynı resolver kullanılmalı.

---

# 7. Experimental_2 Pilot Deneyimi

`Experimental_2`, gerçek production rolü gibi davranmak zorunda değil. Bu rol tasarım doğrulama laboratuvarıdır.

Bu nedenle yeni sistemin aşağıdaki özelliklerini gösterecek kadar esnek olmalı:

```text
Premium hero
Profil fotoğrafı
Initials fallback
Kısa biyografi
Şehir ve ülke
Role badge
Verified / managed / claimable badge
Sosyal bağlantılar
Hızlı aksiyonlar
Profil tamamlanma göstergesi
Visibility kontrolü
Owner preview
Public preview
Inline edit
Empty state
Skeleton
Mobile action bar
Dark mode
```

Ancak production koduna sahte içerik ekleme.

Test fixture veya unit test içinde örnek veri kullanılabilir.

Gerçek kullanıcı ekranında yalnızca RPC veya catalog payload içinden gelen bilgiler render edilmeli.

---

# 8. Public Profil Yenilemesi

Ana route:

```text
/directory/catalog/:slug
```

Ana orchestrator:

```text
src/components/directory/public-profile/PublicProfileShell.tsx
```

## 8.1 Yeni public profil yapısı

Desktop:

```text
Breadcrumb

Premium Hero Card

Ana alan:
- Sol kolon: yaklaşık 8 kolon
- Sağ kolon: yaklaşık 4 kolon
- Sağ kolon desktop üzerinde sticky olabilir

Mobil:
- Tek kolon
- CTA alanları kolay erişilebilir
- Gerekirse alt sticky action bar
```

Şu an main ve sidebar sectionlar aynı diziye flatten ediliyorsa bunu iyileştir.

Gerçek iki kolonlu layout oluştur:

```text
mainSections
sidebarSections
```

Main ve sidebar ayrımı görsel olarak gerçek anlamda kullanılmalı.

## 8.2 Hero alanı

Hero içinde veri varsa göster:

- Avatar veya initials fallback
- Görünen ad
- Flat role bağlı presentation etiketi
- Backend role label
- Kısa biyografi
- Şehir ve ülke
- Kategori badge
- Verified badge
- Managed badge
- Claimable badge
- Sosyal link pill alanı
- Primary ve secondary aksiyonlar

Mevcut `coverImageUrl` varsa kullan.

Yoksa premium ama sade gradient fallback göster.

Yeni cover upload özelliği ekleme.

## 8.3 Quick actions

Mevcut aksiyonları koru:

```text
Web Sitesi
E-posta Gönder
Telefon Et
Haritada Aç
Paylaş
```

Mevcut payload izin veriyorsa destekle:

```text
WhatsApp
Randevu Al
```

Kurallar:

- Veri yoksa gösterme.
- URL sanitize et.
- Mobilde primary CTA net olsun.
- En fazla 1 veya 2 aksiyon primary olsun.
- Diğerleri compact veya outline olsun.
- Çok sayıda aksiyon responsive layoutu bozmamalı.
- `navigator.share` çalışmaya devam etmeli.
- Clipboard fallback korunmalı.

Gerekirse güncelle:

```text
src/lib/public-catalog-profile-view-model.ts
src/components/directory/public-profile/PublicProfileQuickActions.tsx
```

## 8.4 Güven kartı

Public profil için kompakt bir trust card oluştur.

Yalnızca mevcut veriyi kullan:

```text
Doğrulanmış Profil
Yönetilen Profil
Sahiplenilebilir Profil
```

Teknik enum değerlerini kullanıcıya gösterme.

Claim akışını koru:

```text
Düzenleme Yetkisi Talep Et
Talep Gönderildi
Talep Gönderiliyor...
```

## 8.5 Section renderer sistemi

Mevcut registry yaklaşımını koru:

```text
rich_text
attributes
services
contact_list
languages
links
badges
generic fallback
```

Görsel componentleri iyileştir:

```text
PublicProfileSectionList
PublicProfileSectionFrame
AttributesGridSection
ServicesSection
ContactListSection
LanguagesSection
LinksSection
BadgesSection
GenericPublicSection
```

Kurallar:

- Empty section render edilmemeli.
- Public profil teknik görünmemeli.
- Rich text ana kolonda olmalı.
- Contact ve languages sidebar için uygun olmalı.
- Unknown renderer generic fallback ile çalışmalı.
- DB section sırası korunmalı.
- Presentation config varsa kontrollü şekilde tercih edilen sıralama uygulanabilir.
- Generic roller geriye dönük uyumlu kalmalı.

## 8.6 Owner inline edit

Owner kullanıcı public profilde mevcut akışı kullanmaya devam etmeli:

```text
Profili Düzenle
Önizlemeye Dön
```

Inline editor yeni tasarım sistemiyle uyumlu olmalı.

Korunması gereken davranışlar:

- AFS attribute listesi
- `editor_can_edit`
- visibility
- tekil save state
- React Query invalidation
- toast mesajları
- responsive yapı

## 8.7 Loading, empty ve not-found

Güncelle:

```text
PublicProfileSkeleton
PublicProfileEmptyState
PublicProfileNotFound
```

Skeleton final layouta benzemeli.

Layout shift azaltılmalı.

---

# 9. Giriş Yapmış Experimental_2 Kullanıcısının Profil Editörünü Yenile

Ana hedef:

```text
experimental2@corteqs.net
```

Beklenen rol:

```text
Experimental_2
```

Muhtemel route:

```text
/profile/bireysel
```

Önce mevcut resolver davranışıyla doğrula.

Ana dosya:

```text
src/pages/ProfilePage.tsx
```

## 9.1 Kritik refactor yaklaşımı

`ProfilePage.tsx` mevcut haliyle çok fazla görsel sorumluluk taşıyor.

Çalışan handler ve veri sözleşmelerini kaybetmeden UI bloklarını componentlere ayır.

Korunması gereken özellikler:

```text
Avatar yükleme
Avatar kaldırma
İsim düzenleme
Ülke seçimi
Şehir seçimi
Kısa biyografi
Visibility kontrolü
Sosyal medya hesapları
LinkedIn kartı
Web sitesi kartı
CV yükleme
Sunum yükleme
Rol özel alanları
Badge toggle alanları
Cadde ilgi alanları
Cadde içeriklerim
Cadde tanıtım paneli
Rol başvurusu
Feature talepleri
Dashboard erişimleri
Bekleyen talepler
Yardım ve kılavuzlar
Çıkış yapma
```

Bunlardan herhangi birini silme.

## 9.2 Yeni component klasörü

Örnek:

```text
src/components/profile/premium/
```

Mantıksal componentler:

```text
PremiumProfileHero.tsx
ProfileCompletionCard.tsx
ProfilePublicPreviewCard.tsx
ProfileEditorSection.tsx
ProfileVisibilityControl.tsx
ProfileSocialLinksEditor.tsx
ProfileDocumentsPanel.tsx
ProfileRoleSpecificFields.tsx
ProfileAccessRequestsPanel.tsx
ProfileHelpPanel.tsx
ProfileMobileActionBar.tsx
ProfileSectionHeading.tsx
```

Bunların tamamını oluşturmak zorunda değilsin.

Gereksiz mikro-component üretme.

`ProfilePage.tsx` veri orchestration ve handler koordinasyonunda kalabilir.

## 9.3 Yeni authenticated layout

Desktop:

```text
Premium Owner Hero
- Avatar
- İsim
- Experimental_2 badge veya backend role label
- Şehir / ülke
- Kısa biyografi
- Profil tamamlanma skoru
- Public profili görüntüle CTA
- Fotoğraf değiştir CTA
- Secondary actions

Ana içerik:
- Sol kolon: profil düzenleme alanları
- Sağ kolon: profil skoru, public preview, visibility özeti, hızlı aksiyonlar
- Altta: operasyonel accordion veya tabs
```

Mobil:

```text
Tek kolon
Avatar ve başlık sıkışmamalı
Butonlar en az 44px olmalı
Primary save veya preview görünür olmalı
Horizontal overflow oluşmamalı
Sticky mobile action bar yalnız gerçekten faydalıysa kullanılmalı
```

## 9.4 Public preview CTA

Authenticated profil ekranına ekle:

```text
Public Profili Görüntüle
```

Bu CTA yalnızca gerçek catalog slug varsa görünmeli.

Mevcut `member-catalog` API katmanını kullan.

Yeni component içinde doğrudan Supabase sorgusu yazma.

Slug yoksa:

- Butonu gizle veya
- kullanıcı dostu pasif durum göster.

Sahte slug üretme.

## 9.5 Profil tamamlanma kartı

Mevcut veriyi kullan:

```text
profileCompletion.requiredTotal
profileCompletion.requiredCompleted
profileCompletion.percentage
```

Premium ama sade progress card oluştur.

Yüzde göstergesi erişilebilir olmalı.

Sadece renk ile anlam aktarma.

Eksik alanları yalnızca mevcut attribute durumlarından türet.

Örnek mesaj:

```text
Profilini güçlendirmek için eksik alanları tamamla.
```

## 9.6 Alan grupları

`Experimental_2` için mevcut attribute payloadına göre anlamlı görsel gruplar oluştur.

Örnek gruplar:

```text
Temel Bilgiler
Konum
Kısa Tanıtım
Sosyal Bağlantılar
Belgeler
Görünürlük
Rolüne Özel Alanlar
Başvurular ve Erişimler
```

Attribute yoksa satır veya boş kart gösterme.

Yeni attribute key uydurma.

## 9.7 Operasyonel alanları geri plana al

Şu alanlar önemli ama hero seviyesinde olmamalı:

```text
Rol Başvurusu
Feature Talepleri
Açık Dashboard Erişimleri
Bekleyen Talepler
Yardım & Kılavuzlar
```

Bunları temiz accordion veya tabs yapısında göster.

Kullanıcı ilk ekranda profilini anlamalı ve düzenleyebilmeli.

---

# 10. Experimental_1 Kontrolü

Aşağıdaki kullanıcı negatif kontrol olarak kullanılmalı:

| Alan | Değer |
|---|---|
| E-posta | `experimental1@corteqs.net` |
| Görünen ad | `Experimental Kullanıcı 1` |
| Atanan flat rol | `Experimental_1` |

`Experimental_1` kullanıcısı yeni pilot layoutu almamalı.

Bu hesap generic fallback deneyimini göstermeli.

Testlerde ve manuel kontrolde özellikle karşılaştır:

```text
Experimental_2 -> premium pilot
Experimental_1 -> generic mevcut veya generic iyileştirilmiş fallback
```

Generic fallback kırılmamalı.

---

# 11. Çoklu Profil Seçim Ekranı

İncele:

```text
src/components/profile/EditableProfilesSelector.tsx
```

Bu ekranı yeni tasarım sistemiyle uyumlu hale getir.

Özellikle:

- Türkçe karakterleri düzelt.
- `Duzenlemek istedigin profili sec.` gibi metinleri düzgün Türkçe yaz.
- Kartları daha premium hale getir.
- Mobil görünümü koru.
- Pilot rol için gerekirse kontrollü badge göster.
- Generic roller kırılmasın.

---

# 12. Catalog Item Editor

İncele:

```text
src/pages/CatalogItemEditorPage.tsx
```

Tamamen yeniden yazmak zorunda değilsin.

Ancak yeni ortak field veya visibility wrapper componentleri güvenli biçimde yeniden kullanılabiliyorsa tekrar eden kodu azalt.

Şunları bozma:

```text
/profile/catalog/:itemId
updateCatalogItemAttribute
editor_can_edit
editor_can_hide
visibility
parseDraftValue
readDraftValue
```

Ana pilot görevini riske atacak büyük refactor yapma.

---

# 13. Kod Kalitesi Kuralları

## 13.1 shadcn primitive dosyaları

Şu klasörü doğrudan değiştirme:

```text
src/components/ui/*
```

Gerekirse wrapper component oluştur.

## 13.2 Yeni veri erişimi

Yeni component içinde doğrudan Supabase sorgusu ekleme.

API katmanı ve hook kullan.

## 13.3 Yeni bağımlılık

Yeni büyük dependency ekleme.

Animation library ekleme.

Mevcut stack yeterli:

```text
React
Tailwind
shadcn/ui
Lucide
React Query
```

## 13.4 Erişilebilirlik

Kontrol et:

```text
Keyboard navigation
Visible focus
aria-label
Alt text
Semantic headings
Contrast
Reduced motion
Touch target
Responsive overflow
```

## 13.5 Performans

- Public first paint ağırlaşmamalı.
- Gereksiz render azalt.
- Büyük görsel dependency ekleme.
- Skeleton final layouta benzemeli.
- Layout shift azalt.
- `useMemo` ve view-model sınırlarını gerektiğinde koru.

---

# 14. Önerilen Dosya Yapısı

Bu bir öneridir. Repo gerçekliğine göre uyarlayabilirsin.

```text
src/lib/profile-presentation.ts
src/lib/profile-presentation.test.ts

src/components/profile/premium/
  PremiumProfileHero.tsx
  ProfileCompletionCard.tsx
  ProfilePublicPreviewCard.tsx
  ProfileEditorSection.tsx
  ProfileVisibilityControl.tsx
  ProfileSocialLinksEditor.tsx
  ProfileDocumentsPanel.tsx
  ProfileAccessRequestsPanel.tsx
  ProfileHelpPanel.tsx
  ProfileMobileActionBar.tsx

src/components/directory/public-profile/
  PublicProfileShell.tsx
  PublicProfileHero.tsx
  PublicProfileQuickActions.tsx
  PublicProfileSectionList.tsx
  PublicProfileSectionFrame.tsx
  PublicProfileTrustCard.tsx
  PublicProfileMobileActionBar.tsx
```

Yeni componentlerin gerçekten gerekli olanlarını oluştur.

Körü körüne tamamını ekleme.

---

# 15. View-Model Geliştirmeleri

Dikkatli değiştir:

```text
src/lib/public-catalog-profile-view-model.ts
```

Korunması gereken mevcut davranışlar:

```text
Safe URL normalization
Hero badge üretimi
Derived attribute section
Derived services section
Derived contact section
Derived language section
Hero duplicate attribute filtreleme
DB section önceliği
Unknown renderer generic fallback
Claim state
Deterministic accent fallback
```

Gerekirse ekle:

1. Primary ve secondary action ayrımı.
2. WhatsApp quick action desteği.
3. Appointment quick action desteği.
4. Presentation config entegrasyonu.
5. Trust card view-modeli.
6. Main ve sidebar layout ayrımı.
7. `Experimental_2` için presentation override.
8. Generic fallback uyumluluğu.

---

# 16. Testler

Önce mevcut testleri çalıştır.

Sonra yeni testleri ekle.

## 16.1 Çalıştırılacak komutlar

Windows PowerShell kullan:

```powershell
npm run verify:text
npm run test -- src/lib/public-catalog-profile-view-model.test.ts
npm run test -- src/lib/profile-presentation.test.ts
npm run build
```

Yeni dosyalar için hedefli ESLint:

```powershell
npx eslint src/lib/profile-presentation.ts src/components/profile/premium src/components/directory/public-profile
```

Repo genel lint sonucu legacy hatalar nedeniyle başarısız olabilir.

Böyle bir durumda:

- Legacy hataları raporla.
- Kendi değiştirdiğin dosyalarda yeni lint hatası bırakma.

## 16.2 Yeni unit testler

En az şu senaryoları ekle:

```text
Experimental_2 presentation config doğru çözülüyor.
Experimental_1 generic fallback alıyor.
Tanımsız rol generic fallback alıyor.
Pilot config başka role yanlışlıkla uygulanmıyor.
Public quick actions yalnızca veri varsa gösteriliyor.
Unsafe URL aksiyona dönüşmüyor.
WhatsApp varsa doğru sanitize ediliyor.
Appointment URL varsa CTA oluşuyor.
Empty section render edilmiyor.
Main ve sidebar placement korunuyor.
Claimable state çalışıyor.
Managed state çalışıyor.
Verified state çalışıyor.
```

## 16.3 Component veya smoke testler

Test altyapısı uygunsa ekle:

```text
Public Experimental_2 hero render oluyor.
Public mobile action alanı boş veriyle kırılmıyor.
Authenticated Experimental_2 layout render oluyor.
Experimental_1 premium pilot layout almıyor.
Generic bireysel profil kırılmıyor.
Owner inline edit toggle çalışıyor.
```

---

# 17. Manuel Test Matrisi

Aşağıdaki kullanıcılarla manuel kontrol yap:

## 17.1 Pozitif pilot

```text
experimental2@corteqs.net
Experimental Kullanıcı 2
Experimental_2
```

Kontrol et:

```text
Authenticated premium layout açılıyor.
Public profile premium layout açılıyor.
Avatar varsa düzgün görünüyor.
Avatar yoksa initials fallback çalışıyor.
Profil score düzgün görünüyor.
Public preview CTA doğru çalışıyor.
Visibility toggle çalışıyor.
Social link save çalışıyor.
Dark mode kırılmıyor.
Mobile overflow oluşmuyor.
```

## 17.2 Negatif kontrol

```text
experimental1@corteqs.net
Experimental Kullanıcı 1
Experimental_1
```

Kontrol et:

```text
Premium pilot layout yanlışlıkla açılmıyor.
Generic fallback çalışıyor.
Route resolver kırılmıyor.
Public profile açılıyorsa generic profil render oluyor.
```

## 17.3 Genel manuel kontrol

```text
Desktop light mode
Desktop dark mode
Mobile light mode
Mobile dark mode
Public giriş yapmamış ziyaretçi
Public owner olmayan ziyaretçi
Public owner kullanıcı
Claimable profil
Managed profil
Verified profil
Fotoğrafsız profil
Eksik iletişim bilgili profil
Birden fazla yönetilen profili olan kullanıcı
```

---

# 18. Acceptance Criteria

## 18.1 Pilot izolasyonu

- Yalnızca `Experimental_2` premium pilot görünümünü alıyor.
- `Experimental_1` premium pilot görünümünü almıyor.
- Production roller etkilenmiyor.
- Generic fallback korunuyor.

## 18.2 Public profil

- `/directory/catalog/:slug` çalışıyor.
- Premium hero render oluyor.
- Main ve sidebar ayrımı gerçek layoutta uygulanıyor.
- Empty alanlar gösterilmiyor.
- Share çalışıyor.
- Claim akışı çalışıyor.
- Owner inline edit çalışıyor.
- Unsafe URL engelleniyor.
- Mobil görünüm kullanılabilir.
- Dark mode bozulmuyor.

## 18.3 Authenticated profil

- `/profile` resolver çalışıyor.
- `Experimental_2` doğru route üzerinden açılıyor.
- Premium owner hero gösteriliyor.
- Avatar yükleme ve kaldırma çalışıyor.
- İsim düzenleme çalışıyor.
- Ülke ve şehir alanları çalışıyor.
- Kısa biyografi çalışıyor.
- Visibility kontrolü çalışıyor.
- Social linkler çalışıyor.
- LinkedIn ve website kartları çalışıyor.
- CV ve sunum akışı çalışıyor.
- Rol özel alanları çalışıyor.
- Cadde panelleri kaybolmuyor.
- Başvuru ve erişim panelleri kaybolmuyor.
- Yardım alanı kaybolmuyor.
- Public preview CTA yalnız gerçek slug varsa görünüyor.
- Mobil overflow oluşmuyor.

## 18.4 Mimari

- Route değişmedi.
- Canonical auth kullanılıyor.
- shadcn primitive dosyaları değişmedi.
- Yeni componentlerde doğrudan Supabase sorgusu yok.
- Presentation config sistemi genişletilebilir.
- Build başarılı.
- Yeni testler başarılı.
- Migration eklenmediyse raporda açıkça yazıyor.
- Migration eklendiyse gerekçesi açık.

---

# 19. Dokümantasyon

Aşağıdaki aktif plan dokümanını oluştur:

```text
docs/plans/profile-premium-experimental-2-pilot.md
```

İçeriği:

```text
Amaç
Pilot kullanıcı
Pilot rol
Negatif kontrol kullanıcısı
Değiştirilen route ve componentler
Presentation config yaklaşımı
Public profil yapısı
Authenticated profil yapısı
Test matrisi
Migration durumu
Kalan rollere rollout önerisi
Bilinen sınırlamalar
```

Mimari olarak anlamlı yeni config katmanı eklersen:

```text
ARCHITECTURE.md
```

dosyasını kısa biçimde güncelle.

---

# 20. Branch ve Uygulama Sırası

Yeni branch aç:

```powershell
git checkout -b feat/premium-profile-experimental-2-pilot
```

Aşağıdaki sırayla ilerle:

1. Repo durumunu kontrol et.
2. İlgili mimari dokümanları oku.
3. Profil route ve resolver davranışını doğrula.
4. `Experimental_2` kullanıcısının gerçek UI segmentini doğrula.
5. `Experimental_1` negatif kontrolünü doğrula.
6. Public profil veri sözleşmesini çıkar.
7. Authenticated profil veri sözleşmesini çıkar.
8. Presentation config katmanını oluştur.
9. Yalnızca `Experimental_2` için premium config ekle.
10. Public profile hero ve layoutu iyileştir.
11. Main ve sidebar ayrımını gerçek layout haline getir.
12. Quick actions alanını iyileştir.
13. Trust card ekle.
14. Owner inline editor görünümünü hizala.
15. Authenticated profil sayfasını componentlere ayır.
16. Premium owner hero ekle.
17. Completion card ekle.
18. Public preview CTA ekle.
19. Operasyonel alanları accordion veya tabs içinde düzenle.
20. Çoklu profil seçim ekranını hizala.
21. Skeleton, empty ve not-found ekranlarını güncelle.
22. Unit testleri ekle.
23. Component veya smoke testleri ekle.
24. Encoding kontrolünü çalıştır.
25. Hedefli ESLint çalıştır.
26. Testleri çalıştır.
27. Build al.
28. Dokümantasyonu güncelle.
29. Sonuç raporu ver.

---

# 21. Final Rapor Formatı

Çalışma sonunda Türkçe rapor ver.

Başlıklar:

```text
1. Yapılan Değişikliklerin Özeti
2. Experimental_2 Pilot İzolasyonu
3. Public Profil Değişiklikleri
4. Giriş Yapmış Kullanıcı Profil Değişiklikleri
5. Experimental_1 Negatif Kontrol Sonucu
6. Eklenen ve Değiştirilen Dosyalar
7. Veri Sözleşmelerine Etki
8. Migration Durumu
9. Çalıştırılan Testler
10. ESLint Sonucu
11. Build Sonucu
12. Manuel Kontrol Listesi
13. Kalan Rollere Rollout Planı
14. Açık Noktalar ve Riskler
```

Her dosya değişikliği için kısa gerekçe yaz.

Rollout örnekleri ver:

```text
Healthcare_Doctor
Business_Restaurant
Consultant_Immigration
Organization_Association
User_CityAmbassador
```

Ancak bu aşamada bu rollere premium tasarımı aktive etme.

---

# 22. Son Hatırlatma

Bu görev yalnızca tek bir güzel ekran hazırlama işi değildir.

Amaç:

```text
Experimental_2 üzerinde izole biçimde kanıtlanmış,
config tabanlı,
premium,
Gen-Z uyumlu,
erişilebilir,
mobile-first,
güvenli,
generic fallback uyumlu,
diğer rollere kontrollü biçimde genişletilebilir
bir profil deneyimi oluşturmak.
```

Canlı rolleri etkileme.

`Experimental_1` negatif kontrolünü mutlaka kullan.

Yeni tasarımı yalnızca:

```text
Experimental_2
```

flat rolünde aktive et.
