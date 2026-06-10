# CorteQS Dışarıdan Açılan Public Profil Sayfası
## Uçtan Uca Geliştirme Planı ve Claude Code Master Prompt

**Repo:** `corteqssocial-web/corfin-mvp`  
**Ana amaç:** `/directory/catalog/:slug` üzerinden açılan dış profil sayfasını; sade bir veri dökümü olmaktan çıkarıp renkli, modern, düzenli, responsive ve gelecekte yeni section eklenmesine dayanıklı bir public profil deneyimine dönüştürmek.

---

# 1. Mevcut Durumun Kısa Analizi

Repo içinde dışarıdan açılan profil akışı şu şekildedir:

1. `/directory/profile/:userId`
   - Bu route gerçek profil sayfasını render etmiyor.
   - UUID veya slug parametresini çözüp `/directory/catalog/:slug` sayfasına yönlendiriyor.

2. `/directory/catalog/:slug`
   - Gerçek dış profil sayfası burada oluşuyor.
   - `get_catalog_item_public_profile` RPC çağrısı yapılıyor.
   - Ardından ikinci bir çağrı ile `getCatalogItemProfile(data.id)` çalıştırılıyor.
   - Ekranda `ProfileHeroCard` ve `CatalogProfileLayout` kullanılıyor.

3. Mevcut public layout
   - Temel bir hero kartı bulunuyor.
   - Profil bilgileri tek bir uzun liste halinde gösteriliyor.
   - İletişim, hizmetler ve diller sabit kodlanmış sidebar kartları olarak render ediliyor.
   - Mevcut AFS section sistemi public profil sayfasında gerçek anlamda kullanılmıyor.
   - Hero tarafına `imageUrl={null}` gönderildiği için public detay sayfasında avatar veya logo gösterilemiyor.
   - Bazı metinlerde Türkçe karakterler kullanılmıyor.
   - Ülke adları yalnızca sınırlı bir hardcoded sözlük üzerinden çözülüyor.

4. Veritabanı altyapısı
   - AFS yapısı zaten canlıda bulunuyor:
     - `afs_attributes`
     - `afs_features`
     - `afs_sections`
     - `role_attributes`
     - `role_features`
     - `role_sections`
   - Roller flat yapıdadır. Rol ailesi veya inheritance kullanılmamalıdır.
   - Tüm aktif roller için explicit AFS satırları vardır.
   - İlk etapta matris tüm 76 rol için uniform yapıdadır. Bu, ilk versiyonda tüm rollerin aynı layout ve sectionları kullanması hedefiyle uyumludur.

---

# 2. Ana Mimari Karar

## Tek bir public profil composer oluştur

Her rol için ayrı ayrı profil sayfası üretme.

Şunları yapma:

```tsx
if (role === "doctor") return <DoctorProfile />;
if (role === "business") return <BusinessProfile />;
if (role === "organization") return <OrganizationProfile />;
```

Bunun yerine tek bir public profil composer kullanılmalı:

```tsx
<PublicCatalogProfilePage>
  <PublicProfileHero />
  <PublicProfileSectionList />
  <PublicProfileSidebar />
  <PublicProfileQuickActions />
</PublicCatalogProfilePage>
```

Public profil sayfası veritabanından gelen resolved section listesini render etmeli.

Her section şu mantıkla çizilmeli:

```ts
componentKey -> renderer registry -> section component
```

Örnek:

```ts
const rendererRegistry = {
  rich_text: RichTextSection,
  attributes: AttributesGridSection,
  contact_list: ContactListSection,
  services: ServicesSection,
  languages: LanguagesSection,
  links: LinksSection,
  badges: BadgesSection,
};
```

Tanımsız bir `componentKey` geldiğinde sayfa hata vermemeli. Genel fallback kartı çalışmalı:

```tsx
<GenericPublicSection />
```

Bu yaklaşım sayesinde yeni bir section:
- Admin panelinden aktive edildiğinde sıralamaya uygun şekilde görünür.
- Özel renderer yazılmamışsa generic kart olarak çalışır.
- Özel UI gerekiyorsa yalnızca registry içine yeni renderer eklenir.
- Layout tüm roller için aynı ana omurgayı korur.
- Gelecekte rol bazında section farklılaştırması frontend kodunu çatallandırmadan yapılabilir.

---

# 3. Hedef Kullanıcı Deneyimi

## 3.1 Görsel kimlik

Profil sayfası CorteQS dizin ekranındaki renkli ve modern atmosferi devam ettirmeli.

Kullan:
- Açık pastel ve transparan yüzeyler
- Yumuşak gradientler
- Arka planda kontrollü ambient orb efektleri
- Turuncu, mavi, yeşil, kırmızı ve mor vurgular
- `rounded-[28px]` ve `rounded-[32px]` kartlar
- İnce border
- Soft shadow
- Az miktarda blur
- Lucide ikonlar
- Dark mode uyumu

Kaçın:
- Her kartta farklı ve aşırı güçlü neon renk
- Okunabilirliği bozan yoğun desenler
- Rastgele rainbow kullanımı
- Profil bilgilerini uzun bir form çıktısı gibi göstermek
- Masaüstünde çok geniş ve boş alanlı tek kolon tasarım

## 3.2 Masaüstü düzeni

```text
┌─────────────────────────────────────────────────────────────┐
│ Geri dönüş breadcrumb / Dizine Dön                          │
├─────────────────────────────────────────────────────────────┤
│ Renkli Hero                                                 │
│ [Avatar/Logo] İsim - Rol - Verified - Konum - Kısa açıklama│
│ [Website] [İletişim] [Paylaş] [Düzenleme Talep Et]          │
├─────────────────────────────────────────────────────────────┤
│ 8 kolon ana içerik                  │ 4 kolon sticky sidebar│
│ Hakkında                            │ İletişim              │
│ Profil Bilgileri                    │ Hızlı Aksiyonlar       │
│ Hizmetler                           │ Diller                │
│ Dinamik yeni sectionlar             │ Claim durumu          │
└─────────────────────────────────────────────────────────────┘
```

## 3.3 Mobil düzen

- Tek kolon kullan.
- Hero içeriğini kompakt hale getir.
- Avatar veya logo üstte görünür olmalı.
- Ana aksiyonları 2 sütunlu grid veya alt alta göster.
- Sidebar kartları ana section listesinin içine akmalı.
- Uzun URL değerlerini kır.
- Hedef dokunma alanları en az 44px olmalı.
- Horizontal scroll oluşmamalı.

## 3.4 Hero bölümü

Hero aşağıdaki verileri kontrollü biçimde göstermeli:

- Profil fotoğrafı veya kurum logosu
- Görünen isim
- Rol etiketi
- Doğrulanmış profil etiketi
- Sahiplenilebilir profil etiketi
- Şehir ve ülke
- Headline veya kısa açıklama
- Kategori rozetleri
- Güvenli hızlı aksiyonlar
- Sahiplik durumuna uygun CTA

İsim baş harfleri yalnızca görsel yoksa fallback olmalı.

Rol sadece renk vurgusunu etkileyebilir. Layout yapısını değiştirmemeli.

Örnek deterministic vurgu yaklaşımı:

```ts
const accent = getAccentByStableHash(roleKey ?? itemType);
```

Rol bazında `switch` ile ayrı layout üretme.

## 3.5 Section kartları

Her section:
- Başlık
- İkon
- İsteğe bağlı açıklama
- İçerik
- Boş durum davranışı
- Slot bilgisi
- Sıra bilgisi

ile render edilmeli.

Kart tipleri:

1. `RichTextSection`
   - Hakkında, açıklama, duyuru metni

2. `AttributesGridSection`
   - Label-value grid
   - Uzun tek liste yerine responsive 2 kolon
   - URL, telefon, e-posta tipleri semantik link olmalı

3. `ContactListSection`
   - Telefon: `tel:`
   - E-posta: `mailto:`
   - Web sitesi: yalnızca güvenli `http` veya `https`
   - Adres: varsa harita linki

4. `ServicesSection`
   - Kart veya chip listesi
   - Açıklama varsa küçük metin

5. `LanguagesSection`
   - Badge listesi
   - Seviye varsa göster

6. `LinksSection`
   - LinkedIn, Instagram, web sitesi, randevu linki vb.
   - Güvenli URL doğrulaması

7. `BadgesSection`
   - Kategori, doğrulanmış, featured gibi rozetler

8. `GenericPublicSection`
   - Yeni bir section frontend renderer yazılmadan geldiğinde kullanılır
   - Profil sayfasını kırmaz
   - Bilinmeyen JSON verisini doğrudan ham biçimde dökmez
   - Güvenli, okunabilir label-value yaklaşımı kullanır

---

# 4. Public Veri Kontratı

## 4.1 Amaç

`DirectoryCatalogItemPage.tsx` içinden birden fazla veri kaynağını parçalı şekilde yönetme.

Yeni bir public-safe RPC veya tek API fonksiyonu oluştur:

```sql
get_catalog_item_public_page_v2(p_slug text)
```

Mevcut RPC geriye uyumluluk amacıyla korunabilir. Yeni sayfa V2 RPC'ye geçirilebilir.

## 4.2 Önerilen response

Gerçek kolonları migration ve mevcut RPC tanımlarından doğrula. Aşağıdaki yapı hedef kontrattır:

```ts
type PublicCatalogProfilePagePayload = {
  item: {
    id: string;
    slug: string;
    title: string;
    itemType: string;
    roleKey: string | null;
    roleLabel: string;
    headline: string | null;
    shortDescription: string | null;
    longDescription: string | null;
    avatarUrl: string | null;
    coverImageUrl: string | null;
    verificationStatus: string;
    isVerified: boolean;
    isClaimable: boolean;
    city: string | null;
    countryCode: string | null;
    countryLabel: string | null;
    addressLine: string | null;
    categories: Array<{
      slug: string;
      name: string;
      isPrimary: boolean;
    }>;
  };

  sections: Array<{
    sectionKey: string;
    label: string;
    description: string | null;
    sectionArea: "preview_card" | "detail_card";
    componentKey: string | null;
    sortOrder: number;
    content: Record<string, unknown>;
  }>;

  contacts: Array<{
    type: string;
    value: string;
    label: string | null;
    isPrimary: boolean;
  }>;

  links: Array<{
    type: string;
    label: string | null;
    url: string;
    isPrimary: boolean;
  }>;

  services: Array<{
    name: string;
    description: string | null;
  }>;

  languages: Array<{
    code: string;
    proficiency: string | null;
  }>;

  media: Array<{
    type: string;
    url: string;
    altText: string | null;
    isPrimary: boolean;
  }>;

  claim: {
    canClaim: boolean;
    verificationStatus: string;
  };
};
```

## 4.3 Public-safe filtreleme

RPC sadece dışarıdan gösterilebilecek verileri döndürmeli.

Zorunlu koşullar:

- Yalnızca yayınlanmış ve public katalog itemları
- `deleted_at is null`
- Yalnızca aktif primary role
- Yalnızca aktif ve public `role_sections`
- Yalnızca görünürlüğü public olan değerler
- Onay gerektiren alanlarda yalnızca onaylanmış değerler
- `private_storage` attribute değerleri dışarı çıkmamalı
- CV, presentation document, private phone, referral code, referral source gibi özel alanlar public response içinde yer almamalı
- Admin-only içerik döndürülmemeli
- RLS veya SECURITY DEFINER davranışı açıkça test edilmeli
- SECURITY DEFINER kullanılırsa `SET search_path TO 'public'` korunmalı
- Ham private JSON public tarafa sızmamalı

## 4.4 Section resolution

Backend sectionları şu sırayla çözmeli:

```text
catalog item
→ primary flat role
→ role_sections
→ afs_sections
→ enabled + public olanlar
→ sort_order
→ section payload
```

İlk etapta tüm roller aynı AFS matrisini kullandığı için aynı sectionlar görünür. Gelecekte admin rol bazında section kapattığında veya sırasını değiştirdiğinde frontend kodu değiştirilmeden sayfa adapte olmalı.

## 4.5 `component_key` standardı

Yeni migrationlarda canonical alan olarak `component_key` kullanılmalı.

Eski view-model tarafında `component_name` görülürse:
- RPC alias kullanımını kontrol et.
- Boundary seviyesinde geriye uyumluluk gerekiyorsa normalize et.
- Yeni frontend componentlerinde yalnızca `componentKey` kullan.
- Yeni schema tasarımında tekrar `component_name` üretme.

---

# 5. Frontend Veri Katmanı

Yeni feature için component içinden doğrudan Supabase çağrısı ekleme.

Önerilen dosyalar:

```text
src/lib/public-catalog-profile-schemas.ts
src/lib/public-catalog-profile-api.ts
src/lib/public-catalog-profile-view-model.ts
src/hooks/usePublicCatalogProfile.ts
```

## 5.1 Zod schema

`public-catalog-profile-schemas.ts`:
- RPC response'u Zod ile doğrula.
- Beklenmeyen veya eksik alanları güvenli fallback ile normalize et.
- Public page componentine ham `unknown` data gönderme.
- URL alanlarını doğrula.
- Arrays için default `[]` kullan.
- Optional metinler için `null` normalize et.

## 5.2 API katmanı

`public-catalog-profile-api.ts`:

```ts
export async function getPublicCatalogProfilePage(slug: string) {
  const { data, error } = await supabase.rpc(
    "get_catalog_item_public_page_v2",
    { p_slug: slug },
  );

  if (error) throw error;

  return publicCatalogProfilePageSchema.parse(data);
}
```

## 5.3 React Query hook

`usePublicCatalogProfile.ts`:

```ts
export const publicCatalogProfileKeys = {
  all: ["public-catalog-profile"] as const,
  detail: (slug: string) => [...publicCatalogProfileKeys.all, slug] as const,
};

export function usePublicCatalogProfile(slug?: string) {
  return useQuery({
    queryKey: publicCatalogProfileKeys.detail(slug ?? ""),
    queryFn: () => getPublicCatalogProfilePage(slug!),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
}
```

## 5.4 View-model

UI bileşenlerinde backend isimleriyle dağınık koşullar yazma.

`public-catalog-profile-view-model.ts` içinde:
- Hero view-model
- Badge view-model
- Contact link view-model
- Section view-model
- Slot mapping
- Empty state resolution
- Güvenli URL resolution
- Telefon ve e-posta semantic href resolution
- Deterministic accent resolution

oluştur.

Örnek:

```ts
type PublicProfileSectionViewModel = {
  key: string;
  label: string;
  description: string | null;
  componentKey: string;
  placement: "main" | "sidebar" | "footer";
  sortOrder: number;
  content: Record<string, unknown>;
};
```

Backendde ilk etapta `preview_card` ve `detail_card` alanları korunabilir.

Frontend registry metadata ile placement çözebilir:

```ts
const rendererMeta = {
  contact_list: { placement: "sidebar" },
  languages: { placement: "sidebar" },
  links: { placement: "sidebar" },
  rich_text: { placement: "main" },
  attributes: { placement: "main" },
  services: { placement: "main" },
};
```

Bilinmeyen sectionlar için placement fallback:

```ts
"main"
```

Yeni bir DB kolonunu hemen eklemek zorunda kalma. İleride admin tarafından placement yönetimi gerekecekse ayrı, additive migration ile `layout_slot` metadata eklenebilir.

---

# 6. Frontend UI Dosya Yapısı

Önerilen klasör:

```text
src/components/directory/public-profile/
├── PublicProfileShell.tsx
├── PublicProfileHero.tsx
├── PublicProfileBreadcrumb.tsx
├── PublicProfileQuickActions.tsx
├── PublicProfileSidebar.tsx
├── PublicProfileSectionList.tsx
├── PublicProfileSectionFrame.tsx
├── PublicProfileSkeleton.tsx
├── PublicProfileEmptyState.tsx
├── PublicProfileNotFound.tsx
├── section-renderers/
│   ├── renderer-registry.ts
│   ├── RichTextSection.tsx
│   ├── AttributesGridSection.tsx
│   ├── ContactListSection.tsx
│   ├── ServicesSection.tsx
│   ├── LanguagesSection.tsx
│   ├── LinksSection.tsx
│   ├── BadgesSection.tsx
│   └── GenericPublicSection.tsx
└── public-profile-utils.ts
```

## 6.1 İnce page container

`src/pages/DirectoryCatalogItemPage.tsx` mümkün olduğunca sade hale gelmeli:

```tsx
const DirectoryCatalogItemPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const profileQuery = usePublicCatalogProfile(slug);

  if (!slug) return <Navigate to="/directory" replace />;
  if (profileQuery.isLoading) return <PublicProfileSkeleton />;
  if (profileQuery.isError) return <PublicProfileNotFound />;
  if (!profileQuery.data) return <PublicProfileNotFound />;

  return <PublicProfileShell profile={profileQuery.data} />;
};
```

Claim mutation ayrı hook veya API modülünde kalmalı.

## 6.2 Compatibility redirect

`src/pages/DirectoryProfilePage.tsx` route'u korunmalı.

Bu route:
- UUID geldiğinde katalog slug'ını çözmeye devam etmeli.
- Slug geldiyse doğrudan `/directory/catalog/:slug` adresine yönlendirmeli.
- SEO ve eski link uyumluluğunu korumalı.
- Mümkünse direct query component dışına API fonksiyonuna taşınmalı.
- Yeni profil layout kodu burada çoğaltılmamalı.

## 6.3 Hero avatar düzeltmesi

Mevcut sayfada `imageUrl={null}` kullanılmamalı.

RPC ve view-model:
- Öncelikle primary public media
- Sonra `profile_photo_url`
- Sonra `avatar_url`
- Sonra initials fallback

sırasını uygulamalı.

Kurumlarda avatar alanı logo gibi davranabilir.

## 6.4 Ülke etiketi

Hardcoded ülke sözlüğünü büyütme.

Kullan:
- `geo_countries`
- Public RPC join
- Veya mevcut geo helper

Amaç:
- Bütün ülkeler desteklensin.
- Dil etiketi tek yerde çözülsün.
- UI componenti ülke kodu sözlüğü taşımak zorunda kalmasın.

## 6.5 Claim akışı

Claim mantığı layouttan ayrılmalı.

Durumlar:

```text
anonim ziyaretçi + claimable
→ Düzenleme Yetkisi Talep Et
→ login?mode=signup&next=<profile-url>

login kullanıcı + claimable
→ Düzenleme Yetkisi Talep Et
→ submit_catalog_claim_request
→ başarı bildirimi

claimed profil
→ Doğrulanmış / Yönetilen Profil etiketi
→ claim CTA gösterme
```

Metinlerde İngilizce `Claimable` veya `Claimed` yerine kullanıcı odaklı Türkçe etiket kullan:
- `Sahiplenilebilir Profil`
- `Yönetilen Profil`
- `Doğrulanmış Profil`
- `Talep Gönderildi`

---

# 7. Admin ve Gelecekte Yeni Section Ekleme Akışı

Mevcut admin paneli section aktiflik ve sıra bilgisini zaten yönetiyor. Bu davranışı public profile bağla.

## 7.1 İlk etap

- Tüm roller aynı AFS matrix kullanmaya devam etsin.
- Public UI tek layout kullansın.
- DB'ye rol bazında özel section farkı ekleme.
- Önce composer ve renderer altyapısını sağlamlaştır.

## 7.2 Yeni section eklendiğinde

Yeni section eklendiğinde aşağıdaki süreç yeterli olmalı:

1. Yeni migration ile `afs_sections` içine section ekle.
2. İlgili `role_sections` mappinglerini explicit olarak ekle.
3. Public RPC yeni sectionı döndürsün.
4. Renderer yoksa generic fallback ile sayfa çalışmaya devam etsin.
5. Özel UI isteniyorsa registry içine yeni renderer ekle.
6. Unit ve E2E test ekle.
7. Admin panelinde section görünürlük ve sıralama kontrolünü doğrula.

## 7.3 Opsiyonel admin geliştirmesi

İlk teslimat sonrasında küçük bir iyileştirme olarak:
- Admin rol yönetimi ekranına section preview ikonu
- `component_key`
- `section_area`
- Public profilde hangi renderer ile çizileceği
- Generic fallback uyarısı

eklenebilir.

Bu geliştirme ana public profil teslimatını bloklamamalı.

---

# 8. Güvenlik ve Veri Gizliliği

## Zorunlu kontroller

- Public response içinde `private_storage` attribute yok.
- `admin_only` değer yok.
- `private` visibility değer yok.
- Onaysız değişiklik public görünmüyor.
- CV ve doküman bucket linkleri public response'a sızmıyor.
- `referral_code`, `referral_source`, doğrulama gibi hassas alanlar görünmüyor.
- Linklerde yalnızca `http:`, `https:`, gerektiğinde `mailto:` ve `tel:` kabul ediliyor.
- `javascript:`, `data:` ve benzeri scheme reddediliyor.
- `dangerouslySetInnerHTML` kullanma.
- Ziyaretçiye ham JSON gösterme.
- Claim RPC giriş gerektiriyor.
- Public detail RPC anonim erişimde yalnızca gerçekten yayınlanabilir veriyi döndürüyor.
- Private veya unpublished item için bilgi sızdırmayan not-found davranışı kullan.

---

# 9. Test Stratejisi

## 9.1 Unit test

Aşağıdakiler için test yaz:

```text
public-catalog-profile-schemas.test.ts
public-catalog-profile-view-model.test.ts
renderer-registry.test.ts
public-profile-utils.test.ts
```

Senaryolar:
- Null ve eksik alanlar
- Avatar fallback sırası
- Ülke etiketi fallback
- URL sanitization
- Telefon ve e-posta href
- Section sıralaması
- Main ve sidebar placement
- Bilinmeyen componentKey generic renderer
- Boş sectionların gizlenmesi
- Private içeriğin view-modele girmemesi
- Aynı attribute'un iki bölümde yinelenmemesi

## 9.2 Component test

Senaryolar:
- Hero doğru isim, rol, badge ve avatarı gösteriyor
- Avatar yoksa initials gösteriyor
- Claim CTA anonim kullanıcı için login linki üretiyor
- Claim CTA yönetilen profilde görünmüyor
- Sidebar desktop görünümü
- Mobile tek kolon görünüm mantığı
- Unknown section generic kart oluyor
- Empty state kullanıcı dostu
- Türkçe karakterler doğru

## 9.3 SQL / RPC test

Senaryolar:
- Public item anonim görüntülenebilir
- Private item anonim kullanıcıya görünmez
- Unpublished item görünmez
- `private_storage` attribute response içinde yok
- `private` visibility attribute response içinde yok
- `admin_only` content yok
- `role_sections.is_enabled=false` sectionı response dışı bırakır
- `sort_order` değişince response sırası değişir
- Primary role çözümlemesi doğru
- Yeni, tanımsız section response içinde kaybolmaz
- Claim akışı ayrı RPC üzerinden korunur

## 9.4 Playwright E2E

Playwright senaryoları:

```text
e2e/public-profile.spec.ts
```

Test et:

1. Anonim kullanıcı doğrudan `/directory/catalog/:slug` açar.
2. Renkli hero, isim, rol, konum ve sectionlar görünür.
3. Avatar veya fallback görünür.
4. Public website linki güvenli yeni sekmede açılır.
5. Mobil viewportta horizontal overflow oluşmaz.
6. `/directory/profile/:userId` canonical profile URL'ye yönlenir.
7. `/directory/profile/:slug` canonical profile URL'ye yönlenir.
8. Claimable profil anonim kullanıcıyı login sayfasına yönlendirir.
9. Login kullanıcı claim talebi gönderir ve başarı mesajı görür.
10. Private profil detay sızdırmadan not-found gösterir.
11. Bilinmeyen renderer sectionı generic kart halinde görünür.
12. Bir üye, bir işletme ve bir kuruluş örneği aynı layout composer ile çalışır.

## 9.5 Mevcut test borcu

Repo içindeki pre-existing test arızalarını yeni regressionlardan ayır.

Rapor formatı:

```text
PASS:
- ...

PRE-EXISTING FAILURE:
- test adı
- neden bu çalışmayla ilgili değil

NEW FAILURE:
- ...
```

---

# 10. File-by-File Yapılacaklar

## Yeni dosyalar

```text
supabase/migrations/<timestamp>_public_catalog_profile_page_v2.sql
src/lib/public-catalog-profile-schemas.ts
src/lib/public-catalog-profile-api.ts
src/lib/public-catalog-profile-view-model.ts
src/hooks/usePublicCatalogProfile.ts

src/components/directory/public-profile/PublicProfileShell.tsx
src/components/directory/public-profile/PublicProfileHero.tsx
src/components/directory/public-profile/PublicProfileBreadcrumb.tsx
src/components/directory/public-profile/PublicProfileQuickActions.tsx
src/components/directory/public-profile/PublicProfileSidebar.tsx
src/components/directory/public-profile/PublicProfileSectionList.tsx
src/components/directory/public-profile/PublicProfileSectionFrame.tsx
src/components/directory/public-profile/PublicProfileSkeleton.tsx
src/components/directory/public-profile/PublicProfileEmptyState.tsx
src/components/directory/public-profile/PublicProfileNotFound.tsx
src/components/directory/public-profile/public-profile-utils.ts

src/components/directory/public-profile/section-renderers/renderer-registry.ts
src/components/directory/public-profile/section-renderers/RichTextSection.tsx
src/components/directory/public-profile/section-renderers/AttributesGridSection.tsx
src/components/directory/public-profile/section-renderers/ContactListSection.tsx
src/components/directory/public-profile/section-renderers/ServicesSection.tsx
src/components/directory/public-profile/section-renderers/LanguagesSection.tsx
src/components/directory/public-profile/section-renderers/LinksSection.tsx
src/components/directory/public-profile/section-renderers/BadgesSection.tsx
src/components/directory/public-profile/section-renderers/GenericPublicSection.tsx

src/lib/public-catalog-profile-schemas.test.ts
src/lib/public-catalog-profile-view-model.test.ts
src/components/directory/public-profile/section-renderers/renderer-registry.test.tsx
src/components/directory/public-profile/PublicProfileShell.test.tsx
e2e/public-profile.spec.ts

docs/modules/directory/public-profile-layout.md
```

## Güncellenecek dosyalar

```text
src/pages/DirectoryCatalogItemPage.tsx
src/pages/DirectoryProfilePage.tsx
src/lib/profile-view-model.ts
```

`src/lib/profile-view-model.ts` içinde mevcut section yaklaşımını değerlendirmeden paralel ve üçüncü bir model oluşturma. Uygunsa mevcut section normalizerını yeniden kullan veya public catalog modelini ortak yardımcı fonksiyonlarla besle.

## Audit edilecek dosyalar

```text
src/components/directory/ProfileHeroCard.tsx
src/components/directory/CatalogProfileLayout.tsx
src/components/profile/IndividualPublicView.tsx
src/hooks/usePublicIndividualProfile.ts
src/lib/profile-types.ts
src/lib/catalog-entity-api.ts
```

Karar:
- Eski componentler başka yerde kullanılıyorsa koru.
- Yeni public sayfa tamamlandıktan sonra orphan olup olmadıklarını grep ile doğrula.
- Kullanılmayanları ayrı cleanup commitinde kaldır.
- Public profil işini gereksiz cleanup ile riske atma.

---

# 11. Dokunulmayacak Alanlar

Aşağıdakileri değiştirme:

```text
src/integrations/supabase/client.ts
src/components/ui/*
server.mjs
vite.config.ts
mevcut production migration dosyaları
SEO kilitli route pathleri
Türkçe domain terimleri
```

Yeni schema değişikliği gerekiyorsa yalnızca yeni migration ekle.

Eski tablo adlarını kullanma:

```text
attribute_catalog
feature_catalog
profile_section_catalog
role_attribute_rules
role_feature_flags
role_profile_section_rules
catalog_item_attributes
catalog_claim_requests
catalog_item_memberships
profiles
user_profiles
admin_users
```

Canonical adları kullan:

```text
afs_attributes
afs_features
afs_sections
role_attributes
role_features
role_sections
catalog_item_attribute_values
catalog_item_claims
catalog_item_managers
user_role_assignments
user_profile_attributes
```

Rol ailesi, parent role veya inheritance geri getirme.

---

# 12. Kabul Kriterleri

Teslimat ancak aşağıdaki koşullarda tamamlanmış sayılır:

1. `/directory/catalog/:slug` anonim kullanıcı tarafından doğrudan açılabiliyor.
2. Yayınlanmamış veya private profil detay sızdırmadan not-found gösteriyor.
3. Hero gerçek avatar veya logoyu gösteriyor; yoksa initials fallback var.
4. Sayfa masaüstünde iki kolon, mobilde tek kolon çalışıyor.
5. Tasarım renkli, modern ve CorteQS dizin ekranıyla görsel olarak uyumlu.
6. Tüm roller aynı public layout composer ile çalışıyor.
7. Rol bazlı ayrı JSX layout dallanması yok.
8. Public page sectionları backendden resolved biçimde alıyor.
9. Section sıralaması `role_sections.sort_order` değişikliklerine uyuyor.
10. Section aktiflik değişikliği frontend kod değişikliği olmadan yansıyor.
11. Tanımsız yeni `componentKey` sayfayı kırmıyor; generic fallback kartı görünüyor.
12. Private, admin-only veya `private_storage` içerik network response'a girmiyor.
13. URL sanitization uygulanıyor.
14. Claim akışı anonim ve login kullanıcı için doğru çalışıyor.
15. Eski `/directory/profile/:userId` linkleri çalışmaya devam ediyor.
16. İngilizce `Claimable`, `Claimed` ve hatalı Türkçe karakter içermeyen kullanıcı metinleri düzeltiliyor.
17. Eski tablo adlarına yeni referans eklenmiyor.
18. Var olan migrationlar değiştirilmeden yalnızca additive migration kullanılıyor.
19. Unit, component ve E2E testleri ekleniyor.
20. Build, lint ve test sonuçları açık biçimde raporlanıyor.

---

# 13. Uygulama Sırası

## Faz 0 — Baseline ve gerçeklik kontrolü

1. Repo güncel `main` branch üzerinde çalış.
2. `git status` kontrol et.
3. Mevcut migration sırasını incele.
4. Son rebuild migrationlarını oku.
5. AFS table ve RPC isimlerini grep ile doğrula.
6. Eski tablo adı referanslarını grep ile kontrol et.
7. Mevcut build, lint ve test baseline raporu çıkar.
8. En az üç örnek profil belirle:
   - Üye
   - İşletme
   - Kuruluş veya profesyonel kayıt
9. Test kayıtlarının primary flat role bağlantısını doğrula.
10. Bazı gerçek member itemlarda rebuild sonrası rol linki eksik olabileceği için örnek veriyi bilinçli seç.

## Faz 1 — RPC

1. Yeni additive migration oluştur.
2. `get_catalog_item_public_page_v2(p_slug text)` RPC'yi ekle.
3. Gerçek tablo kolonlarını mevcut schema üzerinden doğrula.
4. Public filtreleri uygula.
5. Section resolution ekle.
6. Primary media ve location resolution ekle.
7. Güvenli contacts, links, services, languages, categories değerlerini ekle.
8. Anon ve login testleri yap.
9. Supabase types gerekiyorsa generate et; generated dosyayı manuel düzenleme.

## Faz 2 — Veri katmanı

1. Zod schema yaz.
2. API modülü yaz.
3. React Query hook yaz.
4. View-model ve sanitization helpers yaz.
5. Testlerini ekle.

## Faz 3 — UI composer

1. Shell yaz.
2. Hero yaz.
3. Breadcrumb yaz.
4. Quick actions yaz.
5. Section frame yaz.
6. Registry yaz.
7. Rendererları yaz.
8. Generic fallback yaz.
9. Skeleton, empty ve not-found yaz.
10. Responsive ve dark mode davranışlarını doğrula.

## Faz 4 — Page entegrasyonu

1. `DirectoryCatalogItemPage.tsx` dosyasını ince container haline getir.
2. Claim mutationı API/hook katmanına taşı.
3. `DirectoryProfilePage.tsx` redirect davranışını koru.
4. Hardcoded country label sözlüğünü kaldır.
5. Avatar verisini bağla.
6. Türkçe metinleri düzelt.

## Faz 5 — Test

1. Unit testleri çalıştır.
2. Component testleri çalıştır.
3. RPC SQL testlerini çalıştır.
4. Playwright E2E testlerini çalıştır.
5. Full lint çalıştır.
6. Full test çalıştır.
7. Full build çalıştır.
8. Release verification çalıştır.

## Faz 6 — Dokümantasyon

1. Public profile layout modül dökümanı ekle.
2. Yeni RPC kontratını yaz.
3. Yeni renderer ekleme rehberi yaz.
4. Güvenlik filtrelerini yaz.
5. Bilinen pre-existing failureları ayrı belirt.
6. Sonuç raporu oluştur.

## Faz 7 — Cleanup

Cleanup ayrı commit olmalı.

1. Eski `CatalogProfileLayout` gerçekten orphan mı kontrol et.
2. Eski `ProfileHeroCard` başka yerde kullanılıyor mu kontrol et.
3. `usePublicIndividualProfile.ts` hâlâ import ediliyor mu kontrol et.
4. `individual_profile_details` gibi rebuild sonrası eski detay yapılarına bağlı runtime kodu grep ile değerlendir.
5. Güvenli biçimde kaldırılabilen orphan kod varsa ayrı cleanup commitinde kaldır.
6. Public profile feature commitine gereksiz cleanup karıştırma.

---

# 14. Claude Code İçin Tek Parça Master Prompt

Aşağıdaki metni Claude Code oturumuna doğrudan verebilirsin.

---

## MASTER PROMPT

Sen `corteqssocial-web/corfin-mvp` reposunda çalışan kıdemli bir frontend, Supabase ve ürün mimarısın.

Görevin, dışarıdan açılan public profil sayfasını uçtan uca yeniden geliştirmektir.

### Ana hedef

`/directory/catalog/:slug` sayfası şu anda temel bir katalog veri dökümü gibi görünmektedir. Bunu modern, renkli, new-age, düzenli, responsive, güvenli ve gelecekte yeni profile section eklendiğinde kırılmayacak bir CorteQS public profil deneyimine dönüştür.

Bu çalışmayı yalnızca kozmetik CSS rötuşu olarak ele alma. AFS section altyapısını runtime public profile rendering sürecine gerçekten bağla.

### Kritik repo gerçekliği

- Uygulama React + Vite SPA ve Supabase backend kullanıyor.
- Canonical auth hook:
  ```ts
  import { useAuth } from "@/components/auth/useAuth";
  ```
- Tek Supabase client:
  ```ts
  import { supabase } from "@/integrations/supabase/client";
  ```
- Roller FLAT yapıdadır. Role family, parent role veya inheritance yoktur.
- AFS canonical tablolar:
  ```text
  afs_attributes
  afs_features
  afs_sections
  role_attributes
  role_features
  role_sections
  ```
- Catalog canonical tablolar:
  ```text
  catalog_items
  catalog_item_roles
  catalog_item_attribute_values
  catalog_item_claims
  catalog_item_managers
  ```
- Eski auth/profile tabloları yok:
  ```text
  profiles
  user_profiles
  admin_users
  ```
- Tüm aktif roller için explicit AFS mapping vardır.
- İlk etapta tüm roller uniform attribute-feature-section matrisini kullanmaktadır.
- Public layout ilk versiyonda tüm roller için aynı olmalıdır.
- Gelecekte admin panelinden yeni section eklendiğinde layout buna uyum sağlamalıdır.
- Bilinmeyen section key veya renderer geldiğinde sayfa kırılmamalıdır.
- Mevcut public URL yapısını bozma.
- Mevcut production migration dosyalarını değiştirme veya silme. Yalnızca additive migration ekle.
- `src/components/ui/*`, `src/integrations/supabase/client.ts`, `server.mjs` ve `vite.config.ts` dosyalarına dokunma.
- SEO kilitli route pathlerini değiştirme.
- Türkçe domain terimlerini rename etme.

### Önce gerçekliği doğrula

Herhangi bir kod değişikliğinden önce:

1. `docs/architecture/AI_TECHNICAL_REFERENCE.md`
2. `docs/AGENT_CONTEXT.md`
3. `CLAUDE.md`
4. Son AFS rebuild migrationları
5. `src/App.tsx`
6. `src/pages/DirectoryProfilePage.tsx`
7. `src/pages/DirectoryCatalogItemPage.tsx`
8. `src/components/directory/ProfileHeroCard.tsx`
9. `src/components/directory/CatalogProfileLayout.tsx`
10. `src/lib/catalog-entity-api.ts`
11. `src/lib/profile-view-model.ts`
12. `src/components/admin/role-management/ProfileSectionRulesPanel.tsx`

dosyalarını oku.

Dokümanlar çelişirse:
- Güncel migration
- Güncel runtime code
- `AI_TECHNICAL_REFERENCE.md`

sırasıyla source of truth kabul et.

Aşağıdaki eski tablo adlarını yeni kodda kesinlikle kullanma:

```text
attribute_catalog
feature_catalog
profile_section_catalog
role_attribute_rules
role_feature_flags
role_profile_section_rules
catalog_item_attributes
catalog_claim_requests
catalog_item_memberships
profiles
user_profiles
admin_users
```

### Mevcut akışla ilgili zorunlu tespitler

Koddan doğrula:
- `/directory/profile/:userId` gerçek profil render etmiyor; canonical `/directory/catalog/:slug` URL'ye redirect ediyor.
- `DirectoryCatalogItemPage.tsx` içindeki mevcut public profile fetch akışını tek public-safe kontrata indir.
- Mevcut hero tarafında avatar veya logo verisi bağlı değilse bağla.
- Sabit ülke sözlüğünü kaldır.
- Mevcut layout içindeki hardcoded services, contacts ve languages render mantığını AFS uyumlu renderer sistemine taşı.
- `profile-view-model.ts` içindeki mevcut section modelini değerlendirmeden paralel üçüncü model üretme.
- `component_name` ve canonical `component_key` farkını migration ve RPC tanımlarından doğrula. Yeni kod içinde canonical isim olarak `componentKey` kullan.
- `usePublicIndividualProfile.ts` gibi rebuild sonrası eski detail tablo yapısına bağlı kodların kullanımını grep ile audit et. Ana feature çalışmasını riskli cleanup ile karıştırma; cleanup gerekiyorsa ayrı commit yap.

### Mimari yaklaşım

Tek bir public profile composer oluştur.

Rol bazında ayrı layout yazma.

Yanlış yaklaşım:

```tsx
if (roleKey === "doctor") return <DoctorProfile />;
if (roleKey === "business") return <BusinessProfile />;
```

Doğru yaklaşım:

```tsx
<PublicProfileShell>
  <PublicProfileHero />
  <PublicProfileSectionList />
  <PublicProfileSidebar />
  <PublicProfileQuickActions />
</PublicProfileShell>
```

AFS sectionlar registry ile render edilmeli:

```ts
componentKey -> renderer registry -> section component
```

Renderer bulunamazsa:

```tsx
<GenericPublicSection />
```

çalışmalı.

### RPC

Geriye uyumluluk için mevcut RPC'yi koruyarak yeni additive RPC ekle:

```sql
get_catalog_item_public_page_v2(p_slug text)
```

RPC:
- yalnızca public ve published item döndürmeli
- `deleted_at is null` kontrol etmeli
- primary flat role çözmeli
- `role_sections` + `afs_sections` üzerinden enabled public sectionları sort order ile döndürmeli
- yalnızca public ve izin verilen attribute değerlerini döndürmeli
- `private_storage` alanları kesinlikle dışarı çıkarmamalı
- approval gerektiren alanlarda yalnızca approved veriyi döndürmeli
- güvenli contacts, links, services, languages, categories ve public media değerlerini döndürmeli
- private veya unpublished kayıt için veri sızdırmamalı
- anonim ve login kullanıcı ile test edilmeli
- SECURITY DEFINER gerekiyorsa `SET search_path TO 'public'` kullanmalı

Gerçek kolonları tahmin etme. Mevcut schema, migration ve RPC tanımlarından doğrula.

### Frontend veri katmanı

Şu dosyaları ekle:

```text
src/lib/public-catalog-profile-schemas.ts
src/lib/public-catalog-profile-api.ts
src/lib/public-catalog-profile-view-model.ts
src/hooks/usePublicCatalogProfile.ts
```

Kurallar:
- API çağrısı component içine yazılmamalı.
- Zod ile response doğrulanmalı.
- React Query kullanılmalı.
- URL sanitization tek helperda olmalı.
- View-model UI kararlarını backend payloadundan ayırmalı.
- Null alanlar ve eksik arrayler normalize edilmeli.
- Page component ince container olmalı.

### UI bileşenleri

Şu klasörü oluştur:

```text
src/components/directory/public-profile/
```

İçinde en az şu bileşenler olmalı:

```text
PublicProfileShell.tsx
PublicProfileHero.tsx
PublicProfileBreadcrumb.tsx
PublicProfileQuickActions.tsx
PublicProfileSidebar.tsx
PublicProfileSectionList.tsx
PublicProfileSectionFrame.tsx
PublicProfileSkeleton.tsx
PublicProfileEmptyState.tsx
PublicProfileNotFound.tsx
public-profile-utils.ts

section-renderers/renderer-registry.ts
section-renderers/RichTextSection.tsx
section-renderers/AttributesGridSection.tsx
section-renderers/ContactListSection.tsx
section-renderers/ServicesSection.tsx
section-renderers/LanguagesSection.tsx
section-renderers/LinksSection.tsx
section-renderers/BadgesSection.tsx
section-renderers/GenericPublicSection.tsx
```

### Görsel tasarım

Yeni public profil:
- CorteQS directory sayfasındaki ambient ve renkli tasarım diliyle uyumlu olmalı
- pastel gradientler kullanmalı
- dengeli turuncu, mavi, yeşil, kırmızı ve mor vurgu içermeli
- rounded kartlar ve soft shadow kullanmalı
- mobile-first olmalı
- dark mode uyumlu olmalı
- desktopta ana içerik ve sidebar düzeni kullanmalı
- mobilde tek kolona inmeli
- uzun URL ve metinlerde overflow üretmemeli
- keyboard erişilebilir olmalı
- ikonlarda lucide-react kullanmalı
- profil fotoğrafı veya logo varsa göstermeli
- yoksa initials fallback göstermeli

### Kullanıcı metinleri

Şunları Türkçeleştir ve doğru karakterlerle yaz:

```text
Directory'ye Dön        -> Dizine Dön
Claimable               -> Sahiplenilebilir Profil
Claimed                 -> Yönetilen Profil veya Doğrulanmış Profil
Talep Gonderildi        -> Talep Gönderildi
Gonderiliyor            -> Gönderiliyor
Duzenleme Yetkisi       -> Düzenleme Yetkisi
```

### Claim akışı

Claim mutationı layout bileşeninden ayır.

- Anonim + claimable profil:
  ```text
  Düzenleme Yetkisi Talep Et
  -> /login?mode=signup&next=<profile-url>
  ```
- Login kullanıcı + claimable profil:
  ```text
  submit_catalog_claim_request
  -> başarı bildirimi
  ```
- Yönetilen profil:
  ```text
  claim CTA gösterme
  ```

### Güvenlik

Aşağıdaki veriler public response'a veya DOM'a sızmamalı:

```text
private_storage attributes
private visibility values
admin_only values
CV linkleri
presentation dosyaları
referral code
referral source
özel telefon bilgileri
onaysız attribute değişiklikleri
ham private JSON
```

Linkler:
- `http`
- `https`
- gerektiğinde `mailto`
- gerektiğinde `tel`

dışında scheme kabul etmemeli.

`dangerouslySetInnerHTML` kullanma.

### Tests

Unit, component ve Playwright E2E testleri ekle.

Özellikle doğrula:
- public direkt profil URL
- private profil not-found
- avatar fallback
- section sırası
- section disable
- unknown renderer generic fallback
- public-safe filtreleme
- mobile overflow yok
- `/directory/profile/:userId` redirect
- `/directory/profile/:slug` redirect
- claim anonim login yönlendirme
- claim login mutation
- üye, işletme ve kuruluş kayıtlarının aynı composer ile çalışması

### Baseline ve final doğrulama

Başlangıçta ve sonunda çalıştır:

```powershell
npm run verify:text
npm run lint
npm run test
npm run build
BASE_URL=https://corteqs.net npm run verify:release
```

PowerShell kullan.

Yeni schema değişikliği varsa:
- yeni migration ekle
- migration replay kontrolü yap
- gerekiyorsa Supabase type generation çalıştır
- generated type dosyasını manuel düzenleme

### Commit planı

Mümkünse değişiklikleri şu commit gruplarında tut:

```text
feat(db): add public catalog profile page v2 rpc
feat(profile): add public catalog profile data layer
feat(profile): add dynamic colorful public profile composer
test(profile): add public profile unit and e2e coverage
docs(profile): document public profile renderer extension flow
chore(profile): remove verified orphan legacy profile code
```

Cleanup son committe ve yalnızca grep ile doğrulandıktan sonra yapılmalı.

### Teslim raporu

İş bitince şu formatta rapor ver:

```text
1. Özet
2. Eklenen migrationlar
3. Eklenen dosyalar
4. Güncellenen dosyalar
5. Public veri güvenliği kontrolleri
6. UI ve responsive davranış
7. Yeni section ekleme yöntemi
8. Test sonuçları
9. Build sonucu
10. Pre-existing failurelar
11. Bilinçli olarak yapılmayanlar
12. Riskler ve önerilen sonraki adımlar
```

Sadece plan yazıp durma. Kod değişikliklerini uygula, testleri çalıştır ve sonucu raporla.

---

# 15. Son Notlar

Bu geliştirmede en önemli başarı ölçütü güzel bir tek profil sayfası üretmek değildir.

Asıl hedef:
- Tüm rollerin aynı omurgada çalışması
- AFS section yapısının runtime'a gerçekten bağlanması
- Yeni section eklendiğinde sayfanın kırılmaması
- Public verinin güvenli filtrelenmesi
- Profil sayfasının düzenli, modern ve CorteQS markasına uyumlu görünmesi
- Gelecekte farklılaştırmanın kontrollü şekilde yapılabilmesi

olmalıdır.


---

# 16. EK — Claude Code İçin Zorunlu Ayrıntılı Uygulama Runbooku

Bu bölüm, yukarıdaki master promptun ayrılmaz parçasıdır. Claude Code yalnızca görsel düzenleme yapıp işi tamamlanmış saymamalıdır. Her fazda repo gerçekliğini doğrulamalı, küçük ve güvenli adımlarla ilerlemeli, yapılan her değişikliğin gerekçesini final raporunda yazmalıdır.

## 16.1 Çalışma modu

Aşağıdaki prensiplerle ilerle:

1. Önce oku, sonra değiştir.
2. Gerçek tablo, kolon ve RPC isimlerini tahmin etme.
3. Mevcut production migrationlarını düzenleme.
4. Yeni migrationı additive ve mümkün olduğunca idempotent yaz.
5. Public veri sözleşmesini güvenlik sınırı kabul et.
6. Component içinde yeni Supabase sorgusu yazma.
7. API, schema, view-model, hook ve UI katmanlarını ayır.
8. Aynı bilgiyi birden fazla katmanda tekrar hesaplama.
9. Rol bazında UI fork üretme.
10. Bilinmeyen section geldiğinde graceful degradation sağla.
11. Her büyük fazdan sonra build çalıştır.
12. Cleanup işlerini ana feature commitine karıştırma.
13. Repo içinde mevcut davranış bozuluyorsa bunu gizleme.
14. Pre-existing hata ile yeni regressionı final raporunda ayır.
15. İşin sonunda yalnızca dosya listesini değil, çalışan akışı anlat.

## 16.2 Başlangıçta kullanılacak PowerShell komutları

Windows PowerShell kullan. Bash komutları yazma.

```powershell
git status
git branch --show-current
git log --oneline -n 20

Get-ChildItem -Path .\supabase\migrations -File |
  Sort-Object Name |
  Select-Object -Last 30 Name

Get-Content .\docs\architecture\AI_TECHNICAL_REFERENCE.md -TotalCount 260
Get-Content .\docs\AGENT_CONTEXT.md -TotalCount 260
Get-Content .\CLAUDE.md -TotalCount 260

Get-Content .\src\App.tsx
Get-Content .\src\pages\DirectoryProfilePage.tsx
Get-Content .\src\pages\DirectoryCatalogItemPage.tsx
Get-Content .\src\components\directory\ProfileHeroCard.tsx
Get-Content .\src\components\directory\CatalogProfileLayout.tsx
Get-Content .\src\lib\catalog-entity-api.ts
Get-Content .\src\lib\profile-view-model.ts
Get-Content .\src\components\admin\role-management\ProfileSectionRulesPanel.tsx

npm run verify:text
npm run lint
npm run test
npm run build
```

Baseline sonuçlarını kaydet. Başlangıçta hata varsa isimleriyle raporla. Yeni geliştirme sırasında bunları gizlice düzeltme; gerekli değilse ayrı tut.

## 16.3 Repo taraması

Aşağıdaki grep kontrollerini PowerShell ile çalıştır:

```powershell
$oldNames = @(
  "attribute_catalog",
  "feature_catalog",
  "profile_section_catalog",
  "role_attribute_rules",
  "role_feature_flags",
  "role_profile_section_rules",
  "catalog_item_attributes",
  "catalog_claim_requests",
  "catalog_item_memberships",
  "profiles",
  "user_profiles",
  "admin_users"
)

foreach ($name in $oldNames) {
  Write-Host "`n=== Searching: $name ==="
  Get-ChildItem -Path .\src, .\supabase -Recurse -File |
    Select-String -Pattern $name
}
```

Önemli not:
- Auto-generated `src/integrations/supabase/types.ts` sonucu ayrı değerlendir.
- Historical migrationlarda eski isimler doğal olarak bulunabilir. Bunları silme.
- Yeni runtime kod içinde eski isim üretme.
- Eski doküman metinleriyle runtime kodu karıştırma.

Aşağıdaki aramaları da yap:

```powershell
Get-ChildItem -Path .\src -Recurse -File |
  Select-String -Pattern "DirectoryCatalogItemPage|DirectoryProfilePage|CatalogProfileLayout|ProfileHeroCard|IndividualPublicView|usePublicIndividualProfile"

Get-ChildItem -Path .\src -Recurse -File |
  Select-String -Pattern "component_name|component_key|section_area|role_sections|afs_sections"

Get-ChildItem -Path .\supabase\migrations -Recurse -File |
  Select-String -Pattern "get_catalog_item_public_profile|get_catalog_item_profile|get_role_management_bundle|search_directory_catalog"
```

## 16.4 Branch ve commit disiplini

Doğrudan `main` üzerinde rastgele değişiklik yapma.

Önerilen branch:

```powershell
git checkout -b feat/public-profile-dynamic-layout
```

Her fazdan sonra:

```powershell
git status
git diff --stat
git diff -- .\ilgili\dosya.tsx
```

Önerilen commitler:

```text
feat(db): add public catalog profile page v2 rpc
feat(profile): add public catalog profile schemas api and query hook
feat(profile): add dynamic public profile renderer registry
feat(profile): integrate dynamic public profile page and claim flow
test(profile): add public profile unit component and e2e coverage
docs(profile): document public profile layout and extension workflow
chore(profile): remove verified orphan legacy profile code
```

Her commit öncesinde en az:

```powershell
npm run verify:text
npm run build
```

çalıştır.

Test commitinden sonra:

```powershell
npm run lint
npm run test
npm run build
```

çalıştır.

## 16.5 Gerçek schema doğrulama adımları

Yeni RPC yazmadan önce son migrationları ve generated type dosyasını incele.

PowerShell:

```powershell
Get-ChildItem .\supabase\migrations -File |
  Sort-Object Name |
  Select-Object -Last 35 Name

Get-ChildItem .\supabase\migrations -File |
  Select-String -Pattern "create table public.catalog_items|alter table public.catalog_items|catalog_item_media|catalog_item_contacts|catalog_item_links|catalog_item_locations|catalog_item_services|catalog_item_languages|catalog_item_categories|catalog_item_attribute_values|role_sections|afs_sections"

Get-ChildItem .\supabase\migrations -File |
  Select-String -Pattern "CREATE OR REPLACE FUNCTION public.get_catalog_item_public_profile|CREATE OR REPLACE FUNCTION public.get_catalog_item_profile"

Get-Content .\src\integrations\supabase\types.ts |
  Select-String -Pattern "catalog_items:|catalog_item_media:|catalog_item_contacts:|catalog_item_links:|catalog_item_locations:|catalog_item_services:|catalog_item_languages:|catalog_item_categories:|catalog_item_attribute_values:|afs_sections:|role_sections:"
```

Gerçek kolon isimlerini çıkarmadan RPC yazma.

Özellikle doğrula:
- `catalog_items` içindeki public visibility alanları
- yayın durumu değerleri
- `deleted_at`
- `platform_role_key`
- `catalog_item_roles.is_primary`
- attribute visibility kolonları
- attribute approval status kolonları
- `afs_attributes.storage_strategy`
- `role_sections.visibility`
- `afs_sections.default_visibility`
- `afs_sections.component_key`
- media tablosunun gerçek adı ve primary görsel alanı
- contact tablosunun gerçek kolonları
- link tablosunun gerçek kolonları
- location tablosunun gerçek kolonları
- categories join yapısı

## 16.6 RPC yazarken kullanılacak yaklaşım

Yeni RPC tek bir JSONB payload döndürebilir. Bu, frontend tarafında response normalizasyonunu kolaylaştırır.

Önerilen imza:

```sql
create or replace function public.get_catalog_item_public_page_v2(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_item_id uuid;
  v_payload jsonb;
begin
  -- Validate input.
  -- Resolve public item.
  -- Resolve primary flat role.
  -- Resolve only public-safe sections and values.
  -- Return null if item must not be visible.
  return v_payload;
end;
$$;
```

### RPC içinde uygulanacak filtreler

Public item seçiminde en az:

```sql
where ci.slug = p_slug
  and ci.deleted_at is null
  and ci.visibility = 'public'
  and ci.status = 'published'
```

kullan. Gerçek enum veya check değerlerini schema üzerinden doğrula. Tahmin ederek kullanma.

Primary rol çözümünde:
- Önce `catalog_item_roles` tablosunda primary rolü kullan.
- Mevcut kayıtlar için geçici uyumluluk gerekirse `catalog_items.platform_role_key` fallbackini değerlendir.
- Fallback kullandığında final raporda belirt.
- Rol ailesi veya inheritance üretme.

Section resolution mantığı:

```sql
select
  s.key,
  s.label,
  s.description,
  s.section_area,
  s.component_key,
  rs.sort_order
from public.role_sections rs
join public.afs_sections s on s.id = rs.section_id
where rs.role_id = v_role_id
  and rs.is_enabled = true
  and rs.visibility = 'public'
  and s.default_visibility = 'public'
order by rs.sort_order, s.key;
```

Gerçek kolonları doğrula ve gerekiyorsa adapte et.

### Attribute güvenlik filtresi

Public attribute seçerken:
- item ile attribute value bağlantısını çöz
- `afs_attributes` tablosuna join yap
- `storage_strategy <> 'private_storage'`
- attribute value visibility public
- role attribute visibility public
- yalnızca onaylanmış değerler
- boş değerleri gereksiz yere response'a koyma

Örnek düşünce modeli:

```sql
where aa.storage_strategy <> 'private_storage'
  and coalesce(cav.visibility, ra.visibility, aa.default_visibility) = 'public'
  and coalesce(cav.approval_status, 'approved') = 'approved'
```

Gerçek kolonlar farklıysa gerçek schema'ya göre düzenle.

### Güvenli content üretimi

Section payload oluştururken private veya admin JSON'u doğrudan response'a koyma.

Yanlış:

```sql
jsonb_build_object('raw', to_jsonb(ci))
```

Doğru:

```sql
jsonb_build_object(
  'title', ci.title,
  'headline', ci.headline,
  'shortDescription', ci.short_description
)
```

Her alan whitelist ile seçilmeli.

### Anonim erişim

RPC anonim kullanıcı tarafından çağrılacaksa:
- `grant execute` durumunu doğrula
- RLS bypass veya SECURITY DEFINER riskini analiz et
- response whitelist kullan
- private item için `null` döndür
- kayıt var veya yok farkından private bilgi sızdırma

## 16.7 RPC response sözleşmesini somutlaştır

Zod schema ile frontend arasında mümkün olduğunca stabil bir camelCase kontrat kullan.

Örnek:

```ts
export type PublicCatalogProfilePayload = {
  item: {
    id: string;
    slug: string;
    title: string;
    itemType: string;
    roleKey: string | null;
    roleLabel: string;
    headline: string | null;
    shortDescription: string | null;
    longDescription: string | null;
    avatarUrl: string | null;
    coverImageUrl: string | null;
    verificationStatus: string | null;
    isVerified: boolean;
    isClaimable: boolean;
    city: string | null;
    countryCode: string | null;
    countryLabel: string | null;
    addressLine: string | null;
    categories: PublicProfileCategory[];
  };
  sections: PublicProfileSectionPayload[];
  contacts: PublicProfileContact[];
  links: PublicProfileLink[];
  services: PublicProfileService[];
  languages: PublicProfileLanguage[];
  media: PublicProfileMedia[];
};
```

Section tipi:

```ts
export type PublicProfileSectionPayload = {
  sectionKey: string;
  label: string;
  description: string | null;
  sectionArea: "preview_card" | "detail_card";
  componentKey: string | null;
  sortOrder: number;
  content: Record<string, unknown>;
};
```

RPC snake_case döndürüyorsa schema transform ile camelCase'e geçir. UI bileşenleri snake_case alan taşımamalı.

## 16.8 Zod schema detayları

`src/lib/public-catalog-profile-schemas.ts` içinde:

```ts
import { z } from "zod";
```

kullan.

Dikkat:
- `url` alanını ham `z.string().url()` ile tamamen reddetmek yerine normalize helper ile güvenli hale getir.
- Backendde eksik array varsa `[]` kullan.
- Eksik optional metin varsa `null` kullan.
- Bilinmeyen extra keyler UI'da kullanılmamalı.
- `content` için `z.record(z.unknown()).default({})` kullanabilirsin.
- Backend bir alanı yanlış tipte döndürürse sessizce özel veri gösterme.
- Parse hatasını kullanıcıya teknik JSON dump olarak gösterme.
- Parse hatasını logla; kullanıcıya genel not-found veya yüklenemedi mesajı ver.

Örnek:

```ts
const publicProfileSectionSchema = z.object({
  sectionKey: z.string().min(1),
  label: z.string().min(1),
  description: z.string().nullable().default(null),
  sectionArea: z.enum(["preview_card", "detail_card"]),
  componentKey: z.string().nullable().default(null),
  sortOrder: z.number().int().default(100),
  content: z.record(z.unknown()).default({}),
});
```

## 16.9 Güvenli URL helper

`public-profile-utils.ts` içinde tek helper oluştur.

```ts
export function toSafeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}
```

Telefon:

```ts
export function toSafePhoneHref(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.replace(/[^\d+]/g, "");
  return normalized ? `tel:${normalized}` : null;
}
```

E-posta:

```ts
export function toSafeMailHref(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
    ? `mailto:${trimmed}`
    : null;
}
```

Harita linki:
- Query parametresini `encodeURIComponent` ile üret.
- Adres veya şehir + ülke fallback kullan.
- Ham kullanıcı inputunu encode etmeden URL içine basma.

## 16.10 View-model detayları

`public-catalog-profile-view-model.ts` içinde aşağıdaki sorumlulukları tek yerde topla:

1. Hero verisi
2. Avatar fallback sırası
3. Cover image fallback
4. Badge listesi
5. Claim görünürlüğü
6. Ana ve sidebar section ayrımı
7. Quick action listesi
8. Safe href üretimi
9. Empty section filtreleme
10. Duplicate content filtreleme
11. Role accent üretimi
12. Mobile UI için kısa label üretimi

Örnek avatar sırası:

```text
primary public logo/media
→ profile_photo_url
→ avatar_url
→ initials
```

Accent deterministic olmalı:

```ts
const PROFILE_ACCENTS = [
  "orange",
  "blue",
  "green",
  "red",
  "purple",
] as const;

export function resolveProfileAccent(seed: string): ProfileAccent {
  const total = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return PROFILE_ACCENTS[total % PROFILE_ACCENTS.length];
}
```

Her rol için ayrı JSX yazma. Accent varyantı sadece görsel class seçsin.

## 16.11 Section registry kontratı

Renderer registry sade ve genişletilebilir olmalı.

```ts
export type PublicSectionRendererProps = {
  section: PublicProfileSectionViewModel;
};

export type PublicSectionRendererDefinition = {
  placement: "main" | "sidebar";
  isEmpty: (section: PublicProfileSectionViewModel) => boolean;
  Component: ComponentType<PublicSectionRendererProps>;
};

export const PUBLIC_SECTION_RENDERERS: Record<string, PublicSectionRendererDefinition> = {
  rich_text: {
    placement: "main",
    isEmpty: isRichTextSectionEmpty,
    Component: RichTextSection,
  },
  attributes: {
    placement: "main",
    isEmpty: isAttributesSectionEmpty,
    Component: AttributesGridSection,
  },
  contact_list: {
    placement: "sidebar",
    isEmpty: isContactListSectionEmpty,
    Component: ContactListSection,
  },
  services: {
    placement: "main",
    isEmpty: isServicesSectionEmpty,
    Component: ServicesSection,
  },
  languages: {
    placement: "sidebar",
    isEmpty: isLanguagesSectionEmpty,
    Component: LanguagesSection,
  },
  links: {
    placement: "sidebar",
    isEmpty: isLinksSectionEmpty,
    Component: LinksSection,
  },
  badges: {
    placement: "sidebar",
    isEmpty: isBadgesSectionEmpty,
    Component: BadgesSection,
  },
};
```

Resolver:

```ts
export function resolvePublicSectionRenderer(componentKey: string | null) {
  if (!componentKey) return GENERIC_PUBLIC_SECTION_RENDERER;
  return PUBLIC_SECTION_RENDERERS[componentKey] ?? GENERIC_PUBLIC_SECTION_RENDERER;
}
```

Generic fallback:
- Sayfayı kırma.
- İçeriği okunabilir hale getir.
- Recursive object dump yapma.
- Bilinmeyen private keyleri render etme.
- Array string değerlerini badge veya satır olarak göster.
- Karmaşık object geldiğinde kullanıcıya sade bir fallback mesajı göster.
- Development modunda console warning üretilebilir.
- Production kullanıcıya teknik `componentKey` gösterme.

## 16.12 Section placement kuralları

İlk etapta DB'ye ek `layout_slot` kolonu ekleme zorunlu değil.

Önce renderer metadata ile:
- `main`
- `sidebar`

slotlarını çöz.

Section sırası:
- Aynı slot içindeki `sortOrder`
- Sonra `sectionKey`

ile deterministic olmalı.

Mobilde:
- Önce hero
- Sonra quick actions
- Sonra main sections
- Sonra sidebar sections
- Sonra claim notice
- Sonra footer alanı

gösterilebilir.

Desktopta:
- main sections solda
- sidebar sections sağda
- sidebar `lg:sticky lg:top-24` davranışı kullanabilir
- sticky davranış mobilde olmamalı

## 16.13 Görsel tasarım spesifikasyonu

### Shell

```tsx
<div className="landing-ambient min-h-screen">
  <AmbientOrbs />
  <main className="relative mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
    ...
  </main>
</div>
```

Var olan directory ekranının ambient classlarını yeniden kullanabiliyorsan kullan. Aynı CSS davranışını gereksiz yere ikinci kez üretme.

### Hero

Hero:
- `rounded-[32px]`
- `border`
- transparan beyaz veya dark yüzey
- pastel gradient
- soft shadow
- profile accent
- opsiyonel cover media
- okunabilir kontrast
- avatar overlap
- responsive spacing

Hero içerik sırası:
1. Kategori badge
2. İsim
3. Rol badge
4. Doğrulanmış badge
5. Konum
6. Headline
7. Hızlı aksiyonlar

Avatar:
- desktop 112–128px
- mobile 88–104px
- rounded 24px veya 28px
- kişi için avatar
- kurum için logo
- fallback initials
- `alt` zorunlu

### Quick actionlar

Örnek aksiyonlar:
- Web Sitesi
- E-posta Gönder
- Telefon Et
- Haritada Aç
- Paylaş
- Düzenleme Yetkisi Talep Et

Kurallar:
- Mevcut olmayan veriye ait aksiyon gösterme.
- External linklerde `target="_blank"` + `rel="noreferrer"` kullan.
- Mail ve telefon semantic href kullan.
- Share API yoksa URL kopyalama fallback değerlendir.
- Claim ana CTA olabilir; diğerleri secondary veya outline.

### Kartlar

Kartlar:
- aynı border radius ailesini kullansın
- renkli accent bar veya icon surface içerebilir
- başlıklar sade olsun
- uzun içeriklerde whitespace korunsun
- responsive grid kullansın
- boş kart render edilmesin

## 16.14 Responsive davranış matrisi

| Alan | Mobil | Tablet | Masaüstü |
|---|---|---|---|
| Shell padding | `px-4` | `px-5` | `px-4 max-w-6xl` |
| Hero | tek kolon | avatar + content | avatar + content + aksiyon |
| Avatar | 88–104px | 104–112px | 112–128px |
| Main layout | tek kolon | tek kolon veya erken grid | `lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]` |
| Sidebar | normal flow | normal flow | sticky |
| Attributes | 1 kolon | 2 kolon | 2 kolon |
| Services | 1 kolon | 2 kolon | 2 kolon |
| Quick actions | 1–2 kolon | flex wrap | sidebar veya hero |
| Long URL | break-all | break-all | break-all |
| Badge satırı | wrap | wrap | wrap |

Kontrol et:
- 320px genişlikte overflow yok
- 375px genişlikte hero taşmıyor
- 768px genişlikte kart grid düzgün
- 1280px genişlikte sidebar boş görünmüyor
- uzun isim hero dışına taşmıyor
- uzun URL yatay scroll üretmiyor

## 16.15 Skeleton, empty ve not-found ekranları

### Skeleton

Public sayfa yüklenirken:
- yalnızca düz metin gösterme
- hero skeleton
- 2 main kart skeleton
- sidebar skeleton
- animasyon sade olsun
- CLS düşük olsun

### Not-found

Private, unpublished veya gerçekten olmayan profil için aynı kullanıcı dostu ekranı kullan:

```text
Bu profil şu anda görüntülenemiyor.
Profil kaldırılmış, gizlenmiş veya henüz yayınlanmamış olabilir.
[Dizine Dön]
```

Private profil varlığını ayrıca ifşa etme.

### Empty section

Bir profil public ama içeriği çok azsa:
- hero yine görünür
- boş section kartları render edilmez
- ana alanda kısa boş durum kartı gösterilebilir
- kullanıcıya teknik attribute veya section bilgisi gösterilmez

## 16.16 Claim flow ayrıntısı

Claim API katmanı:

```text
src/lib/public-catalog-claim-api.ts
src/hooks/useSubmitCatalogClaim.ts
```

Opsiyonel olarak ayrı tut.

Örnek API:

```ts
export async function submitCatalogClaim(itemId: string, slug: string) {
  const { data, error } = await supabase.rpc("submit_catalog_claim_request", {
    target_item_id: itemId,
    claim_type: "editor_access",
    evidence: {
      source: "directory_catalog_page",
      slug,
    },
    note: "Directory catalog item editor access request",
  });

  if (error) throw error;
  return data;
}
```

React Query mutation:
- başarılı olunca local state güncelle
- aynı CTA'yı tekrar aktif bırakma
- toast göster
- query invalidation değerlendir
- auth yoksa mutation çalıştırma

CTA metinleri:

```text
Anonim:
Düzenleme Yetkisi Talep Et

Gönderiliyor:
Talep Gönderiliyor...

Başarılı:
Talep Gönderildi

Claimed:
CTA yok
```

## 16.17 Directory sonucu ile detay sayfası tutarlılığı

`DirectoryResultRow.tsx` ile detay profil sayfası aynı dil ve badge standardını kullanmalı.

Düzeltilecek olası metinler:
- `Claimable` yerine `Sahiplenilebilir`
- `Onaylı` ile `Doğrulanmış Profil` terimlerini tutarlı kullan
- rol badge renk yaklaşımını ortak helpera taşıma ihtiyacını değerlendir
- directory satırında image varsa detayda da image görünmeli
- directory satırındaki şehir ve ülke detay hero ile uyumlu olmalı

Ana feature sırasında zorunlu olmayan directory row refactorı gerekiyorsa küçük tut. Geniş refactorı ayrı committe yap.

## 16.18 Legacy profil audit

Aşağıdaki kodlar ayrıca audit edilmeli:

```text
src/components/profile/IndividualPublicView.tsx
src/hooks/usePublicIndividualProfile.ts
src/lib/individual-profile.ts
src/lib/profile-view-model.ts
src/pages/IndependentProfilePage.tsx
```

Amaç:
- Hangi route tarafından kullanılıyor?
- Rebuild sonrası hangi kod canlı akışta?
- `individual_profile_details` gibi eski detail tablolarına runtime bağımlılık var mı?
- Katalog public composer ile konsolide edilmesi gereken akış var mı?
- Hemen silmek riskli mi?

Kurallar:
- Kullanımı doğrulanmadan dosya silme.
- Public profile feature commitine büyük legacy temizliği ekleme.
- Cleanup ayrı commit olsun.
- Final raporda “audit edildi ama bilinçli olarak bırakıldı” kalemlerini yaz.

## 16.19 Test fixture stratejisi

E2E test için rastgele production kaydı kullanma.

En az üç fixture tanımla:
1. Bireysel üye
2. İşletme
3. Kuruluş veya danışman

Her fixture:
- public
- published
- deleted değil
- primary role bağlantılı
- en az 1 location
- en az 1 public section
- mümkünse avatar veya logo
- mümkünse contact veya service

olmalı.

Ayrıca bir private fixture:
- görünür olmamalı
- not-found ekranı üretmeli

Bir unknown-renderer fixture:
- test ortamında section `component_key` tanımsız bir değer taşımalı
- sayfa kırılmamalı
- generic fallback görünmeli

Production fixture yazmak istemiyorsan:
- local Supabase seed
- test helper
- mock API
- Playwright test setup

yaklaşımından uygun olanı seç.

## 16.20 Unit test ayrıntıları

### Schema testleri

```text
public-catalog-profile-schemas.test.ts
```

Test et:
- null optional text
- eksik arrays
- yanlış URL
- yanlış content shape
- eksik item id
- section sort order default
- unknown extra fields ignore
- camelCase transform

### Utils testleri

```text
public-profile-utils.test.ts
```

Test et:
- https kabul
- http kabul
- javascript reddet
- data reddet
- tel normalize
- mail validate
- initials
- accent deterministic
- map query encode
- duplicate link filtreleme

### View-model testleri

```text
public-catalog-profile-view-model.test.ts
```

Test et:
- media avatar precedence
- initials fallback
- role badge
- verified badge
- claimable badge
- quick actions
- main/sidebar placement
- sort order
- unknown renderer
- empty section filter
- duplicate section filter
- hidden unsafe link filter

### Registry testleri

```text
renderer-registry.test.tsx
```

Test et:
- known componentKey doğru renderer
- null componentKey generic fallback
- unknown componentKey generic fallback
- fallback crash üretmiyor

## 16.21 Component test ayrıntıları

`PublicProfileShell.test.tsx`:

Test et:
- isim görünür
- rol görünür
- konum görünür
- avatar alt text var
- initials fallback var
- website link doğru
- mail link doğru
- phone link doğru
- sections order doğru
- sidebar sections doğru alanda
- unknown section generic kart
- claim button auth durumuna göre doğru
- Türkçe metinler doğru
- private teknik key DOM'da görünmüyor

## 16.22 Playwright E2E ayrıntıları

Dosya:

```text
e2e/public-profile.spec.ts
```

Önerilen test isimleri:

```ts
test("anonymous visitor can open a published public member profile", async ({ page }) => {});
test("catalog profile renders avatar or initials fallback", async ({ page }) => {});
test("catalog profile is responsive without horizontal overflow", async ({ page }) => {});
test("legacy directory profile uuid route redirects to canonical catalog slug", async ({ page }) => {});
test("legacy directory profile slug route redirects to canonical catalog slug", async ({ page }) => {});
test("anonymous claim action redirects to signup with next url", async ({ page }) => {});
test("signed-in visitor can submit catalog claim request", async ({ page }) => {});
test("private or unpublished profile does not leak details", async ({ page }) => {});
test("unknown component key renders generic public section", async ({ page }) => {});
test("member business and organization records use same profile shell", async ({ page }) => {});
```

Responsive overflow kontrolü:

```ts
const hasHorizontalOverflow = await page.evaluate(() => {
  return document.documentElement.scrollWidth > document.documentElement.clientWidth;
});

expect(hasHorizontalOverflow).toBe(false);
```

## 16.23 SQL test kontrol listesi

Local Supabase veya test DB üzerinde doğrula:

```text
[ ] Public published item RPC response var
[ ] Private item RPC null
[ ] Deleted item RPC null
[ ] Unpublished item RPC null
[ ] private_storage attribute yok
[ ] private value yok
[ ] admin_only value yok
[ ] unapproved value yok
[ ] disabled section yok
[ ] enabled section var
[ ] sort_order doğru
[ ] primary role doğru
[ ] primary media doğru
[ ] country label doğru
[ ] contacts whitelist doğru
[ ] unknown section response içinde var
[ ] claim RPC auth olmadan reddediyor
[ ] claim RPC login kullanıcı ile çalışıyor
```

## 16.24 Build ve release doğrulaması

Her şey tamamlandıktan sonra:

```powershell
npm run verify:text
npm run lint
npm run test
npm run build
$env:BASE_URL = "https://corteqs.net"
npm run verify:release
```

Local production serve gerekiyorsa:

```powershell
npm run build
npm run start
```

Ayrıca tarama yap:

```powershell
Get-ChildItem -Path .\src -Recurse -File |
  Select-String -Pattern "Claimable|Claimed|Gonder|Duzen|Directory'ye"

Get-ChildItem -Path .\src -Recurse -File |
  Select-String -Pattern "attribute_catalog|feature_catalog|profile_section_catalog|role_attribute_rules|role_feature_flags|role_profile_section_rules|catalog_item_attributes|catalog_claim_requests|catalog_item_memberships|public\.profiles|public\.user_profiles|public\.admin_users"
```

Yeni runtime referansı olmamalı.

## 16.25 Manual QA checklist

Tarayıcıda manuel kontrol et:

### Genel
```text
[ ] Public profil doğrudan URL ile açılıyor
[ ] Header ve footer bozulmadı
[ ] Dizine Dön çalışıyor
[ ] Hero okunaklı
[ ] Avatar veya initials doğru
[ ] Uzun isim taşmıyor
[ ] Badge wrap düzgün
[ ] Hakkında bölümü düzgün
[ ] Profil bilgileri düzenli
[ ] Hizmetler düzgün
[ ] Diller düzgün
[ ] Contact linkleri doğru
[ ] External linkler yeni sekmede açılıyor
[ ] Harita linki doğru
[ ] Claim CTA doğru
[ ] Unknown renderer sayfayı kırmıyor
```

### Mobil
```text
[ ] 320px overflow yok
[ ] 375px overflow yok
[ ] Butonlar dokunulabilir
[ ] Sidebar kartları doğru sırada
[ ] Avatar çok büyük değil
[ ] Uzun URL kırılıyor
[ ] Sticky sidebar mobilde devre dışı
```

### Dark mode
```text
[ ] Hero kontrastı yeterli
[ ] Badge metinleri okunuyor
[ ] Kart borderları görünür
[ ] Linkler okunuyor
[ ] Skeleton yüzeyleri okunuyor
```

### Güvenlik
```text
[ ] Private profil bilgi sızdırmıyor
[ ] CV URL DOM'da yok
[ ] Referral değerleri DOM'da yok
[ ] javascript URL render olmuyor
[ ] Ham JSON dump yok
```

## 16.26 Final rapor formatı

Claude Code işi bitirdiğinde yalnızca “tamamlandı” yazmamalı.

Aşağıdaki formatı doldurmalı:

```markdown
# Public Profile Dynamic Layout — Completion Report

## 1. Executive Summary
- Ne değişti?
- Kullanıcı ne görecek?
- Mimari olarak hangi problem çözüldü?

## 2. Baseline
- Başlangıç branch
- Başlangıç lint sonucu
- Başlangıç test sonucu
- Başlangıç build sonucu
- Pre-existing failurelar

## 3. Database Changes
- Eklenen migration
- Eklenen RPC
- Public-safe filtreler
- SECURITY DEFINER gerekçesi
- Grant durumu
- Test edilen örnekler

## 4. Frontend Data Layer
- Schema
- API
- React Query hook
- View-model
- URL sanitization

## 5. UI Architecture
- Shell
- Hero
- Section list
- Sidebar
- Renderer registry
- Generic fallback
- Skeleton
- Not-found

## 6. Responsive Behavior
- Mobil
- Tablet
- Desktop
- Dark mode

## 7. Claim Flow
- Anonim
- Login kullanıcı
- Yönetilen profil

## 8. Compatibility
- `/directory/profile/:userId`
- `/directory/profile/:slug`
- `/directory/catalog/:slug`
- Eski componentlerin durumu

## 9. Security Verification
- Private storage
- Private visibility
- Admin only
- Approval status
- Safe URLs
- Data leakage check

## 10. Test Results
- Unit
- Component
- SQL/RPC
- Playwright
- Lint
- Build
- Release verify

## 11. Changed Files
### Added
- ...

### Updated
- ...

### Deleted
- ...

## 12. Pre-existing Failures
- ...

## 13. Conscious Non-Changes
- Bilinçli olarak dokunulmayan dosyalar
- Ayrı backloga bırakılan cleanup
- Ertelenen geliştirmeler

## 14. Risks and Follow-ups
- ...
```

## 16.27 Tamamlanmış sayılmama koşulları

Aşağıdaki durumlardan biri varsa işi tamamlanmış sayma:

- Sadece CSS değiştiyse
- AFS sectionlar runtime'a bağlanmadıysa
- Yeni section frontend kod değişikliği olmadan generic fallback ile görünemiyorsa
- Hero hâlâ `imageUrl={null}` kullanıyorsa
- Public response private veri taşıyorsa
- Component içinde yeni Supabase sorguları yazıldıysa
- React Query kullanılmadıysa
- Zod validation yoksa
- Rol bazında ayrı layout dalları üretildiyse
- Hardcoded ülke listesi devam ediyorsa
- Claim metinleri İngilizce veya Türkçe karaktersiz kaldıysa
- Mobil overflow test edilmediyse
- Existing migration değiştirildiyse
- Eski canonical olmayan tablo adları yeni koda girdiyse
- Build sonucu raporlanmadıysa
- Pre-existing failurelar saklandıysa

---

# 17. EK — Claude Code’a Verilecek Kısa Başlangıç Mesajı

Aşağıdaki kısa mesajı bu dosyayla birlikte Claude Code’a verebilirsin:

```text
Ekteki CORTEQS_PUBLIC_PROFILE_LAYOUT_E2E_MASTER_PROMPT_V2.md dosyasını baştan sona oku ve uygulamaya başla. Sadece plan üretme. Repo gerçekliğini önce doğrula, additive migration ekle, public-safe RPC oluştur, frontend veri katmanını kur, dynamic renderer registry ile modern ve renkli public profil layoutunu uygula, testleri çalıştır ve completion report üret. Mevcut production migrationlarını değiştirme. Her rol için ayrı profil JSX’i üretme. Tüm roller aynı composerı kullanmalı ve bilinmeyen yeni section generic fallback ile sayfayı kırmadan render edilmelidir.
```

