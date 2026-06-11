# CorteQS Cadde 3.0 — E2E Yeniden Düzenleme ve Geliştirme Dokümanı

**Proje:** CorteQS / `corteqssocial-web/corfin-mvp`  
**Modül:** Cadde · Köprü · Cafe · Çarşı · Çıfıt / Tanıtım · Bildirim · Moderasyon  
**Doküman türü:** Uygulamaya dönük ürün + mimari + migration + frontend + test + rollout planı  
**Hazırlanma tarihi:** 10 Haziran 2026  
**Hedef okuyucu:** Claude Code, Codex, teknik kurucu, geliştirici, QA ve ürün sorumlusu  
**Durum:** Uygulama öncesi master plan — mevcut repo üzerinde doğrudan değişiklik yapılmamıştır.

---

# 0. Yönetici Özeti

Cadde özelliği sıfırdan kurulacak bir modül değildir. Repoda çalışan ancak kısmi kalan bir **yeni Cadde MVP hattı** ve bunun yanında önceki denemelerden kalmış daha geniş ama farklı veri modeline bağlı bir **legacy Cadde hattı** aynı anda bulunmaktadır.

Bugünkü aktif `/cadde` rotası:

```text
src/App.tsx
→ src/pages/CaddePage.tsx
→ src/lib/cadde.ts
→ cadde_* tabloları
```

Legacy hat ise aşağıdaki yapı etrafında yaşamaktadır:

```text
src/pages/Feed.tsx
→ src/components/feed/CreatePostForm.tsx
→ src/components/feed/CreateCafeForm.tsx
→ src/components/feed/MultiCountryCityFilter.tsx
→ src/hooks/useCafes.ts
→ feed_posts / cafes / cafe_memberships gibi eski tablolar
```

Bu nedenle ilk hedef yeni ekran çizmek değil, **tek bir canonical Cadde domain’i belirlemek** ve bütün fonksiyonları kontrollü biçimde o domain üzerinde tamamlamaktır.

Bu dokümanın ana kararı:

> **Aktif ve canonical temel olarak `src/pages/CaddePage.tsx` + yeni `src/lib/cadde-*` modülleri + `cadde_*` tabloları kullanılacaktır. Legacy `Feed.tsx` hattına yeni özellik eklenmeyecektir. Gerekli UX parçaları legacy hattan seçilerek yeni modüle taşınacak, eski tablolar önce read-only duruma alınacak, veri ihtiyacı varsa backfill yapılacak ve ancak canary doğrulamasından sonra soft-decommission edilecektir.**

Cadde 3.0 yalnızca sosyal feed değildir. Birbiriyle bağlantılı alt ürünlerden oluşur:

| Alt ürün | Amaç |
|---|---|
| **Cadde** | Doğrulanmış diaspora üyelerinin ülke ve şehir bazlı ana sosyal akışı |
| **Köprü** | Türkiye ile diaspora arasındaki kontrollü ortak akış |
| **Cafe** | Tema, şehir veya etkinlik etrafında geçici ve canlı toplanma alanı |
| **Çarşı** | Kullanıcıdan kullanıcıya marketplace |
| **Çıfıt / Tanıtım** | Sponsorlu görünürlük, billboard ve feed içi reklam alanları |
| **İlgi Alanı Hedefleme** | Feed ve reklam sıralamasını kullanıcı ihtiyacına göre iyileştirme |
| **Bildirim & Realtime** | Yorum, reaksiyon, takip, mesaj ve cafe olaylarını canlı iletme |
| **Moderasyon** | Güvenli topluluk için post, cafe, ilan, reklam ve kullanıcı denetimi |

---

# 1. Kaynakların Öncelik Sırası

Yeni geliştirmede çelişki yaşanırsa aşağıdaki sıra izlenmelidir:

1. **Canlı veritabanı migration gerçekliği ve mevcut repo kodu**
2. **`AI_TECHNICAL_REFERENCE.md`**
3. **`CLAUDE.md`**
4. **`AGENT_CONTEXT.md`**
5. **`Cadde Kural Seti (CKS) — v2` ürün kuralları**
6. Eski yorumlar, eski component açıklamaları ve legacy kod davranışları

Burada önemli bir ayrım vardır:

- CKS, **ürün davranışı açısından** ana referanstır.
- Güncel AI teknik referansı ve migrationlar, **uygulama mimarisi ve tablo isimleri açısından** ana referanstır.
- CKS içindeki eski teknik isimler doğrudan kopyalanmamalı; güncel AFS mimarisine çevrilmelidir.

Örnek:

```text
CKS içindeki eski yaklaşım:
user_roles + has_role()

Güncel canonical yaklaşım:
user_role_assignments
+ roles
+ role_features
+ user_feature_overrides
+ get_current_user_features()
+ is_admin()
+ is_moderator()
+ Cadde'ye özel security-definer RPC'ler
```

Yeni paralel rol sistemi veya ikinci bir profil tablosu oluşturulmayacaktır.

---

# 2. Mevcut Repo Durumu — Teknik Audit

## 2.1 Aktif Cadde Rotası

`src/App.tsx` içinde `/cadde` rotası canonical auth ve generic feature flag ile korunmaktadır:

```tsx
<Route
  path="/cadde"
  element={
    <RequireAuth>
      <RequireFeature feature={GENERIC_FEATURE_KEYS.caddeAccess} fallback={<Navigate to="/" replace />}>
        <CaddePage />
      </RequireFeature>
    </RequireAuth>
  }
/>
```

Aktif sayfa `src/pages/CaddePage.tsx` dosyasıdır. Bu ekran:

- React Query kullanır.
- `src/lib/cadde.ts` üzerinden veri çeker.
- Demo / real modu taşır.
- Tek ülke ve tek şehir filtresi taşır.
- Köprü toggle gösterir.
- Aktif cafe kartlarını gösterir.
- Post oluşturur.
- Reaksiyon ve yorum ekler.
- Sağ kolonda billboard kartlarını gösterir.
- Feed içine sponsorlu kart enjekte eder.
- Admin tarafındaki `/admin/cadde` yönetim paneliyle bağlantılıdır.

Bu yapı iyi bir başlangıçtır ancak CKS kapsamının yalnızca bir bölümünü karşılamaktadır.

## 2.2 Aktif Cadde Veri Katmanı

`src/lib/cadde.ts` içinde aşağıdaki tablolar kullanılır:

```text
cadde_countries
cadde_cities
cadde_posts
cadde_post_reactions
cadde_post_comments
cadde_cafes
cadde_cafe_members
cadde_billboard_cards
cadde_sponsored_placements
```

Dosyada demo fallback verileri de vardır. Aktif feed sıralaması şu anda ağırlıklı olarak:

```text
pinned DESC
created_at DESC
```

şeklindedir. CKS-7’de tarif edilen ihtiyaç eşleşmesi, lokal öncelik, günlük ortalama etkileşim oranı ve deterministik kalan içerik sıralaması henüz uygulanmış değildir.

## 2.3 Legacy Cadde Hattı

Repoda daha eski bir sosyal feed yaklaşımı da yaşamaktadır:

```text
src/pages/Feed.tsx
src/components/CaddeProfileGate.tsx
src/components/feed/CreatePostForm.tsx
src/components/feed/CreateCafeForm.tsx
src/components/feed/MultiCountryCityFilter.tsx
src/hooks/useCafes.ts
src/hooks/useFeedSocial.ts
src/hooks/useConnections.ts
src/hooks/useIsPremium.ts
```

Legacy hattın olumlu parçaları:

- Profil tamamlamayan kullanıcı için blur overlay fikri vardır.
- Native share ve clipboard fallback vardır.
- Çoklu ülke / şehir filtresi vardır.
- Cafe açma formunda tema, coğrafya, davet kodu, giriş sorusu ve ambassador süresi gibi değerli UX parçaları vardır.
- Kullanıcı takipleri ve kişi önerileri vardır.
- Connect mekanizması vardır.
- Cafe katılımı için günlük limit, kapasite ve TR telefon kısıtı gibi eski policy denemeleri vardır.
- Sağ kolonda ticari kartların görsel yaklaşımı daha zengindir.

Ancak legacy hat canonical değildir:

- `feed_posts`, `cafes`, `cafe_memberships` gibi farklı tablolar kullanır.
- Component içinden doğrudan Supabase çağrısı yapar.
- Yerleşim ve Köprü kurallarını eksik ve farklı uygular.
- Bazı yorumlar sadece local state içinde kalır.
- Aktif `/cadde` rotası bu hattı kullanmaz.
- Bazı exact import path’leri ana branch üzerinde bulunamamıştır.

**Karar:** Legacy kod örnek ve UX kaynak deposu olarak kullanılabilir; domain kaynağı olarak kullanılmayacaktır.

## 2.4 Canonical AFS Gerçekliği

Repo 9 Haziran 2026 itibarıyla AFS rebuild geçirmiştir:

```text
roles                     → 76 flat role
afs_attributes            → attribute kataloğu
afs_features              → feature kataloğu
afs_sections              → section kataloğu
role_attributes
role_features
role_sections
user_role_assignments
user_profile_attributes
user_feature_overrides
```

Aşağıdaki eski isimler yeni kodda kullanılmayacaktır:

```text
profiles
user_profiles
user_profiles_v2
admin_users
role_feature_defaults
role_feature_flags
attribute_catalog
feature_catalog
profile_section_catalog
catalog_item_memberships
catalog_claim_requests
catalog_item_attributes
family_key
parent_role_id
```

Rol aileleri tekrar oluşturulmayacaktır. Cadde yetkileri, flat rollerin her biri için açık biçimde `role_features` üzerinden atanacaktır.

## 2.5 Mevcut Gap Matrisi

| Konu | Mevcut durum | Hedef durum | Öncelik |
|---|---|---|---|
| Canonical frontend | `CaddePage.tsx` aktif | Aynı hat modülerize edilecek | P0 |
| Canonical API | Tek büyük `src/lib/cadde.ts` | `cadde-api`, `cadde-rules`, `cadde-ranking`, `cadde-schemas` olarak ayrılacak | P0 |
| Legacy hat | Paralel olarak duruyor | Freeze → backfill gerekiyorsa yap → soft-decommission | P0 |
| Profil kapısı | Legacy component var, aktif sayfada yok | Aktif Cadde’ye entegre edilecek | P0 |
| Profil tamamlanma kriteri | Canonical auth sadece `full_name` üzerinden onboarding tamam sayıyor | Cadde için ülke + şehir + telefon doğrulama ayrı hesaplanacak | P0 |
| Telefon doğrulama | Raw `phone` okunuyor | Doğrulanmış telefon kaynağı kullanılacak | P0 |
| Köprü paylaşım yetkisi | Toggle var, entitlement yok | TR bireysel ve kurumsal aktör kuralları RPC ile enforce edilecek | P0 |
| Ülke/şehir filtresi | Aktif sayfada tek seçim | Çoklu filtre veya CKS uyumlu gelişmiş seçim | P0/P1 |
| Çarşı | CKS’de tanımlı, canonical UI bulunmuyor | Marketplace oluşturulacak | P0/P1 |
| Cafe | Aktif sayfada temel liste + join | Tek form, giriş policy, cafe detail feed, arşiv | P0/P1 |
| Reklam | Basit billboard + inline sponsor | Kampanya, placement, hedefleme, onay, click/impression | P1 |
| Çıfıt adı | Legacy sağ kolonda sponsor yüzeyi olarak kullanılmış | Ürün adı sözleşmesi netleştirilecek | P0 karar |
| İlgi alanları | CKS’de var; mevcut öneriler şehir/meslek/okul bazlı | Normalize ilgi katalogu ve ranking hedeflemesi | P1 |
| Ranking | Pinned + tarih | CKS-7 skor sistemi | P1 |
| Bildirim | CKS’de var; exact component doğrulanamadı | Notification event + bell + Realtime | P1 |
| Çoklu diaspora | `DiasporaContext` var | Cadde sorgularında `diaspora_key` kullanılacak | P1/P2 |
| Premium | Legacy hook admin’i premium sayıyor | Gerçek entitlement / paket çözümleme | P1 |
| Moderasyon | Admin CRUD var | Queue, report, ban, audit, rate-limit | P0/P1 |
| Hata görünürlüğü | Bazı API catch blokları sessizce boş dönüyor | Telemetry + kullanıcı dostu hata + kontrollü fallback | P0 |
| Test | Cadde odaklı kapsam yetersiz | Unit + integration + Playwright E2E persona matrisi | P0/P1 |

---

# 3. Ürün Sözlüğü ve İsimlendirme Kararı

## 3.1 Değiştirilmeyecek Temel Terimler

| Terim | Tanım |
|---|---|
| **Cadde** | Doğrulanmış diasporanın şehir ve ülke bazlı sosyal akışı |
| **Köprü** | Türkiye ile diaspora arasındaki kontrollü ortak akış |
| **Cafe** | Kısa süreli, canlı, tema veya etkinlik bazlı toplanma alanı |
| **Çarşı** | Kullanıcıdan kullanıcıya marketplace |
| **CKS** | Cadde Kural Seti |
| **Tanıtım** | Kullanıcının reklam / sponsorlu görünürlük yönetim alanı |
| **Çıfıt** | Kullanılacaksa, sponsorlu ticari keşif yüzeyinin marka adı |

## 3.2 Çarşı ve Çıfıt Karıştırılmamalı

Repodaki eski `Feed.tsx` sağ kolonu sponsorlu ticari kartlar için “ÇIFIT” ifadesini kullanmaktadır. CKS ise “Çarşı” terimini marketplace olarak tanımlar.

Bu nedenle ürün sözleşmesi:

```text
Çarşı = U2U marketplace
Çıfıt = Ticari sponsorlu görünürlük / billboard alanı
```

Çıfıt adı kullanılmayacaksa bütün görünür metinler “Tanıtım” veya “Sponsorlu Keşif” olarak standardize edilmelidir. Fakat hiçbir durumda Çarşı marketplace ile ticari reklam alanı aynı tablo veya aynı panel altında birleştirilmemelidir.

---

# 4. Hedef Kullanıcı Deneyimi

## 4.1 Ana Layout

Desktop:

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ Cadde Header · aktif kapsam · diaspora anahtarı · bildirim · paylaş CTA    │
├───────────────────────┬────────────────────────────────┬───────────────────┤
│ SOL KOLON             │ MERKEZ AKIŞ                    │ SAĞ KOLON         │
│                       │                                │                   │
│ Çarşı ticker          │ Post oluşturma                 │ Çıfıt / Tanıtım   │
│ Konum filtreleri      │ Feed postları                  │ Billboard kartları│
│ Köprü toggle          │ Sponsorlu inline kart          │ Şehir önerileri   │
│ Aktif cafe özeti      │ Cafe context feed              │ Cafe tema reklamı │
│ İlgi alanları         │ Daha fazla yükle               │                   │
└───────────────────────┴────────────────────────────────┴───────────────────┘
```

Mobile:

```text
Header
→ Çarşı yatay ticker
→ Kapsam chipleri: Global / Köprü / Ülke / Şehir
→ Post oluştur
→ Feed
→ Sponsorlu inline kart
→ Cafe yatay kartları
→ Bottom sheet filtre
```

Mobilde kritik kural:

> Çarşı görünürlüğü desktop sol kolonuna bağımlı kalmamalıdır. Küçük ekranda header altındaki yatay ticker veya sticky kompakt kart olarak görünmelidir.

## 4.2 Görsel Dil

Cadde yeni nesil, canlı ve sosyal görünmelidir; fakat aşırı kalabalıklaşmamalıdır.

- Ortak CorteQS palette uyumlu gradient detayları kullanılabilir.
- Post kartları okunabilir beyaz yüzeylerde tutulmalıdır.
- Sponsorlu içerik açık biçimde etiketlenmelidir.
- Rol badge, şehir badge, ülke badge ve Köprü badge görsel olarak ayrışmalıdır.
- Dark mode korunmalıdır.
- UI primitive dosyaları (`src/components/ui/*`) manuel değiştirilmemelidir.
- Yeni componentler shadcn primitive kompozisyonuyla oluşturulmalıdır.

---

# 5. Persona ve Rol Davranışı

Flat AFS rolleri yeniden ailelere ayrılmayacaktır. Aşağıdaki tablo ürün dili için özet sınıflandırmadır; veritabanında hiyerarşi oluşturmak için kullanılmayacaktır.

| Ürün personası | Cadde | Çarşı | Cafe | Tanıtım | AI Görüşme |
|---|---|---|---|---|---|
| Bireysel | Paylaşım, yorum, reaksiyon, ilgi alanı feed | İlan açabilir | Katılabilir, policy’ye göre cafe açabilir | Yok | Yok |
| Danışman | Profil promosyonu, uzmanlık paylaşımı | Hizmet ilanı | Tema cafe açabilir | Sağ kolon, inline feed, cafe tema | Yakında |
| İşletme | İş, franchise, kupon, etkinlik paylaşımı | Ürün/hizmet ilanı | Etkinlik cafe açabilir | Var | Yakında |
| Kuruluş / Dernek | Etkinlik ve duyuru | Uygunsa ilan | Topluluk cafe açabilir | Var | Yok |
| Blogger / Vlogger | İçerik tanıtımı | Sınırlı | Tema cafe | Var | Yakında |
| Şehir Elçisi | Şehir duyurusu, davet, moderasyon sinyali | Normal kullanıcı kuralları | Daha uzun süreli şehir cafe | Kendi şehrinde ücretsiz öne çıkarma; ücretli paket yok | Yok |
| Admin | Moderasyon, boost, ban, kategori, paket yönetimi | Tüm ilanları yönetir | Tüm cafe kayıtlarını yönetir | Tüm placementleri yönetir | Yok |
| Moderator | Gizleme, rapor çözme, ban önerisi | Moderasyon | Moderasyon | Onay kontrolü | Yok |

## 5.1 AFS Feature Anahtarları

Mevcut `cadde.access` korunmalıdır. Buna ek olarak aşağıdaki anahtarlar `afs_features` içine eklenmelidir:

```text
cadde.access
cadde.post.create
cadde.post.edit_own
cadde.post.comment
cadde.post.react
cadde.bridge.post
cadde.cafe.read
cadde.cafe.join
cadde.cafe.create
cadde.cafe.manage_own
cadde.carsi.read
cadde.carsi.create
cadde.carsi.manage_own
cadde.promotion.create
cadde.promotion.manage_own
cadde.city.highlight_free
cadde.moderate
cadde.admin
cadde.notifications
cadde.diaspora.switch
```

Uygulama kodu ürün persona ismine bakarak yetki vermemelidir:

```ts
// Yanlış
if (accountType === "business") { ... }

// Doğru
if (features["cadde.promotion.create"]) { ... }
```

Flat rollerin her biri için feature mapping açıkça seed edilmelidir. Çok özel istisnalar yalnızca `user_feature_overrides` ile verilmelidir.

---

# 6. Profil Kapısı ve Doğrulama

## 6.1 Cadde Profile Gate

CKS’ye göre Cadde’ye giren ancak profilini tamamlamayan kullanıcı blurlu demo görünümü görmelidir.

Kabul edilen akış:

```text
Anonim kullanıcı
→ /login yönlendirmesi

Login olmuş fakat Cadde profili eksik kullanıcı
→ /cadde sayfasında blur demo
→ zorunlu modal
→ eksik alan listesi
→ profil ayarlarına CTA

Login olmuş, profil tamam, cadde.access kapalı kullanıcı
→ Cadde erişim kilidi ekranı
→ neden kapalı olduğuna dair açıklama

Login olmuş, profil tamam, cadde.access açık kullanıcı
→ gerçek Cadde deneyimi
```

## 6.2 Cadde Profil Tamamlanma Kriteri

Mevcut canonical auth provider onboarding tamamlanmasını yalnızca `full_name` varlığıyla hesaplamaktadır. Bu değer genel onboarding için kalabilir; ancak Cadde erişimi için yetersizdir.

Yeni hook:

```ts
useCaddeActorContext()
```

Örnek dönüş tipi:

```ts
type CaddeActorContext = {
  userId: string;
  roleKey: string | null;
  featureKeys: Set<string>;
  country: string | null;
  city: string | null;
  phoneE164: string | null;
  phoneVerifiedAt: string | null;
  isPhoneVerified: boolean;
  isTRResident: boolean;
  isDiasporaResident: boolean;
  profilePublic: boolean;
  indivRelocating: boolean;
  digitalCommunityEnabled: boolean;
  missingGateFields: Array<"country" | "city" | "phone_verification">;
  canEnterCadde: boolean;
};
```

Bu değer mümkünse tek RPC ile alınmalıdır:

```sql
get_cadde_actor_context()
```

Doğrudan component içinde farklı attribute queryleri yapılmamalıdır.

## 6.3 Telefon Doğrulama Kaynağı

Raw `phone` attribute tek başına doğrulama sayılmamalıdır.

Uygulama öncesi inventory:

1. Mevcut bir doğrulama tablosu veya auth phone confirmation alanı var mı?
2. Telefon E.164 formatında normalize ediliyor mu?
3. `phone_verified_at` için tek bir truth source var mı?
4. Ülke kodu doğrulanmış telefondan güvenli biçimde çıkarılabiliyor mu?

Mevcut doğrulama truth source yoksa yeni bir tablo eklenmelidir:

```sql
create table public.user_verifications (
  user_id uuid primary key references auth.users(id) on delete cascade,
  phone_e164 text,
  phone_verified_at timestamptz,
  phone_country_code text,
  updated_at timestamptz not null default now()
);
```

Bu tablo private olmalı; public profile RPC sadece gereken boolean değeri döndürmelidir.

---

# 7. Cadde, Köprü ve Cafe Erişim Kuralları

## 7.1 Cadde Paylaşımı

| Kullanıcı | Cadde okuma | Cadde paylaşımı |
|---|---:|---|
| Anonim | Ürün kararı: landing/demo olabilir; gerçek akış önerilmez | Hayır |
| Login, telefon doğrulanmamış | Blur demo | Hayır |
| TR yerleşik + doğrulanmış TR telefon | Evet | Yalnızca `@Türkiye` |
| Diaspora yerleşik + doğrulanmış yabancı/lokal telefon | Evet | Profil ülkesi veya izinli filtre ülkesi |
| Admin / moderator | Evet | Yetkiye bağlı override |

## 7.2 Köprü Paylaşımı

| Kullanıcı | Köprü okuma | Köprü paylaşımı |
|---|---:|---|
| Doğrulanmamış | Demo / kilit | Hayır |
| Diaspora yerleşik doğrulanmış | Evet | Her zaman |
| TR bireysel doğrulanmış | Evet | `indiv_relocating = true` ise |
| TR işletme / danışman / kuruluş / elçi | Evet | `digital_community_enabled = true` ise |
| Admin / moderator | Evet | Yetkiye bağlı override |

## 7.3 Cafe Giriş Kuralları

| Cafe kapsamı | Kim girebilir? |
|---|---|
| Köprü cafe | Telefonu doğrulanmış herkes |
| Türkiye cafe | TR yerleşik ve TR telefonu doğrulanmış kullanıcı |
| Diğer ülke cafe | Telefonu doğrulanmış kullanıcılar |
| Approval giriş | Yukarıdaki policy + cafe sahibinin onayı |
| Referral giriş | Yukarıdaki policy + geçerli davet kodu |
| Arşiv cafe | Read-only görünüm; yeni post ve yeni katılım kapalı |

## 7.4 Yetki Uygulama Kuralı

Bu kurallar yalnız frontend’de saklanmamalıdır.

```text
Frontend guard
+ API validation
+ Security-definer RPC
+ RLS
+ Integration testi
```

aynı anda uygulanmalıdır.

---

# 8. Hedef Mimari

## 8.1 Dosya Yapısı

Mevcut tek parça `src/lib/cadde.ts` bölünmelidir:

```text
src/
├── lib/
│   ├── cadde-api.ts
│   ├── cadde-schemas.ts
│   ├── cadde-types.ts
│   ├── cadde-rules.ts
│   ├── cadde-ranking.ts
│   ├── cadde-targeting.ts
│   ├── cadde-format.ts
│   └── cadde-query-keys.ts
├── hooks/
│   └── cadde/
│       ├── useCaddeActorContext.ts
│       ├── useCaddeFeed.ts
│       ├── useCaddeFilters.ts
│       ├── useCaddeCafes.ts
│       ├── useCaddeCarsi.ts
│       ├── useCaddePromotion.ts
│       └── useCaddeNotifications.ts
├── components/
│   └── cadde/
│       ├── CaddeEntryGuard.tsx
│       ├── CaddeProfileGate.tsx
│       ├── CaddeHeader.tsx
│       ├── CaddeDesktopLayout.tsx
│       ├── CaddeMobileLayout.tsx
│       ├── MultiCountryCityFilter.tsx
│       ├── KopruScopeCard.tsx
│       ├── CreatePostComposer.tsx
│       ├── CaddePostCard.tsx
│       ├── CaddeFeed.tsx
│       ├── CafeTicker.tsx
│       ├── CafeCard.tsx
│       ├── CreateCafeForm.tsx
│       ├── CarsiGlobalTicker.tsx
│       ├── CarsiItemCard.tsx
│       ├── CarsiItemsManager.tsx
│       ├── PromotionRail.tsx
│       ├── SponsoredFeedCard.tsx
│       ├── NotificationsBell.tsx
│       └── EmptyState.tsx
├── pages/
│   ├── cadde/
│   │   ├── CaddePage.tsx
│   │   ├── CafeDetailPage.tsx
│   │   ├── CarsiPage.tsx
│   │   └── CarsiItemDetailPage.tsx
│   └── admin/
│       └── cadde/
│           ├── routes.tsx
│           ├── AdminCaddeDashboard.tsx
│           ├── AdminCaddePostsPage.tsx
│           ├── AdminCaddeCafesPage.tsx
│           ├── AdminCaddeCarsiPage.tsx
│           ├── AdminCaddePromotionsPage.tsx
│           ├── AdminCaddeModerationPage.tsx
│           └── AdminCaddeSettingsPage.tsx
```

## 8.2 Uyum Katmanı

CKS’de `src/lib/caddeRules.ts` adı geçmektedir. Repo standardına uygun canonical dosya `src/lib/cadde-rules.ts` olabilir.

Geçici uyum gerekiyorsa:

```ts
// src/lib/caddeRules.ts
export * from "./cadde-rules";
```

Fakat iki ayrı kural implementasyonu oluşturulmayacaktır.

## 8.3 API Yaklaşımı

Yeni component içinde doğrudan:

```ts
supabase.from("cadde_posts")
```

kullanılmayacaktır.

Doğru zincir:

```text
Component
→ hook
→ React Query
→ cadde-api.ts
→ RPC veya RLS-safe read
→ Supabase
```

Örnek:

```ts
export const useCaddeFeed = (filters: CaddeFilterState) =>
  useInfiniteQuery({
    queryKey: caddeQueryKeys.feed(filters),
    queryFn: ({ pageParam }) => listCaddeFeed(filters, pageParam),
    initialPageParam: null,
    getNextPageParam: (page) => page.nextCursor,
  });
```

## 8.4 Zod Şemaları

Yeni public inputların tamamı Zod ile doğrulanmalıdır:

```ts
caddePostCreateSchema
caddeCommentCreateSchema
caddeCafeCreateSchema
caddeCafeJoinSchema
carsiItemCreateSchema
caddePromotionCreateSchema
caddeFilterSchema
```

---

# 9. Veritabanı Hedef Modeli

## 9.1 Migration Stratejisi

Kurallar:

- Eski migration silinmez.
- Eski migration yeniden sıralanmaz.
- Sadece yeni migration eklenir.
- Production branch üzerinde tablo drop ilk fazda yapılmaz.
- Önce inventory, sonra compatibility, sonra backfill, sonra soft-decommission.
- Supabase types yeniden üretilir; auto-generated dosya elle düzenlenmez.

Önerilen migration grupları:

```text
cadde_300_001_inventory_and_guardrails.sql
cadde_300_002_actor_context_and_feature_seed.sql
cadde_300_003_posts_cafes_extension.sql
cadde_300_004_carsi_marketplace.sql
cadde_300_005_promotion_campaigns.sql
cadde_300_006_interest_targeting_and_ranking.sql
cadde_300_007_moderation_and_notifications.sql
cadde_300_008_rls_and_rpc.sql
cadde_300_009_legacy_read_only_and_backfill.sql
cadde_300_010_verification_report.sql
```

Dosya adlarında gerçek migration timestamp standardı kullanılmalıdır.

## 9.2 Mevcut `cadde_posts` Tablosunun Genişletilmesi

Mevcut tablo korunarak aşağıdaki alanlar inventory sonucuna göre eklenmelidir:

```sql
alter table public.cadde_posts
  add column if not exists diaspora_key text not null default 'tr',
  add column if not exists cafe_id uuid null,
  add column if not exists image_urls text[] not null default '{}',
  add column if not exists need_category text null,
  add column if not exists visibility text not null default 'cadde',
  add column if not exists moderation_status text not null default 'approved',
  add column if not exists engagement_score numeric not null default 0,
  add column if not exists published_at timestamptz null,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz null;
```

Kontroller:

```sql
check (visibility in ('cadde', 'bridge', 'cafe'))
check (moderation_status in ('pending', 'approved', 'rejected', 'hidden'))
```

Not: `is_bridge` mevcutsa geçiş boyunca korunabilir. Orta vadede `visibility='bridge'` ile tekilleştirilebilir. Aynı migration içinde gereksiz risk oluşturulmamalıdır.

## 9.3 Post Etkileşimleri

Mevcut tablolar korunabilir:

```text
cadde_post_reactions
cadde_post_comments
```

Ek tablolar:

```sql
create table public.cadde_post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.cadde_posts(id) on delete cascade,
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  unique(post_id, reporter_user_id)
);
```

## 9.4 Cafe

Mevcut `cadde_cafes` genişletilmelidir:

```sql
alter table public.cadde_cafes
  add column if not exists diaspora_key text not null default 'tr',
  add column if not exists slug text,
  add column if not exists theme_key text,
  add column if not exists entry_mode text not null default 'open',
  add column if not exists referral_code_hash text,
  add column if not exists entry_question text,
  add column if not exists capacity int,
  add column if not exists archived_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();
```

Kontroller:

```sql
check (entry_mode in ('open', 'approval', 'referral'))
check (ends_at > starts_at)
check (capacity is null or capacity > 0)
```

Üyelik tablosu genişletmesi:

```sql
alter table public.cadde_cafe_members
  add column if not exists status text not null default 'approved',
  add column if not exists answer text,
  add column if not exists joined_at timestamptz not null default now(),
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id);
```

## 9.5 Çarşı

CKS’ye uygun canonical tablo:

```sql
create table public.carsi_items (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  diaspora_key text not null default 'tr',
  category_key text not null,
  title text not null,
  description text not null,
  price_amount numeric,
  price_currency text,
  country_id uuid,
  city_id uuid,
  image_urls text[] not null default '{}',
  contact_mode text not null default 'platform',
  status text not null default 'published',
  moderation_status text not null default 'approved',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

Kategori kataloğu:

```sql
create table public.carsi_categories (
  key text primary key,
  label_tr text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);
```

Seed:

```text
second_hand        → İkinci El
room_rental        → Oda Kiralama
lesson_education   → Ders / Eğitim
service            → Hizmet
event_ticket       → Etkinlik Bileti
gift_donation      → Hediye / Bağış
other              → Diğer
```

## 9.6 İlgi Alanları

```sql
create table public.cadde_interest_catalog (
  key text primary key,
  label_tr text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table public.user_cadde_interests (
  user_id uuid not null references auth.users(id) on delete cascade,
  interest_key text not null references public.cadde_interest_catalog(key),
  weight smallint not null default 1,
  created_at timestamptz not null default now(),
  primary key(user_id, interest_key)
);

create table public.cadde_post_interests (
  post_id uuid not null references public.cadde_posts(id) on delete cascade,
  interest_key text not null references public.cadde_interest_catalog(key),
  primary key(post_id, interest_key)
);
```

Seed:

```text
networking
new_arrival
family_children
career
entrepreneurship
education
technology
arts_culture
sports
food
travel
volunteering
mentorship
```

## 9.7 Çıfıt / Tanıtım Kampanyaları

Mevcut `cadde_billboard_cards` ve `cadde_sponsored_placements` tabloları ilk aşamada korunabilir. Ancak self-service reklam yönetimi için kampanya katmanı gerekir.

```sql
create table public.cadde_promotion_campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  campaign_type text not null,
  title text not null,
  description text not null,
  target_url text not null,
  image_url text,
  status text not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cadde_promotion_placements (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.cadde_promotion_campaigns(id) on delete cascade,
  placement_key text not null,
  country_id uuid,
  city_id uuid,
  diaspora_key text not null default 'tr',
  theme_keys text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.cadde_promotion_events (
  id bigint generated by default as identity primary key,
  campaign_id uuid not null references public.cadde_promotion_campaigns(id) on delete cascade,
  placement_key text not null,
  event_type text not null,
  viewer_user_id uuid references auth.users(id),
  occurred_at timestamptz not null default now()
);
```

Placement seed:

```text
homepage-ai-bar
category-first-screen
cadde-right-rail
cadde-feed-inline
cafe-theme-right-rail
city-ambassador-highlight
```

## 9.8 Moderasyon

```sql
create table public.cadde_moderation_queue (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  reason text not null,
  status text not null default 'open',
  risk_score numeric,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  resolution_note text
);

create table public.cadde_user_bans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null default 'cadde',
  reason text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
```

## 9.9 Bildirim

Mevcut global `notifications` tablosu varsa tekrar tablo oluşturulmayacaktır. Inventory sonucunda mevcut yapı yetersizse:

```sql
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
```

---

# 10. RPC ve RLS Tasarımı

## 10.1 Ana İlke

Kullanıcı yetkisi gerektiren mutationlar doğrudan tablo insert/update ile yapılmamalıdır.

Önerilen RPC’ler:

```text
get_cadde_actor_context()
list_cadde_feed_v1(filters, cursor)
create_cadde_post_v1(payload)
update_cadde_post_v1(post_id, payload)
delete_cadde_post_v1(post_id)
create_cadde_comment_v1(post_id, body)
toggle_cadde_reaction_v1(post_id, reaction_type)
create_cadde_cafe_v1(payload)
join_cadde_cafe_v1(cafe_id, referral_code, answer)
approve_cadde_cafe_member_v1(member_id)
archive_cadde_cafe_v1(cafe_id)
create_carsi_item_v1(payload)
update_carsi_item_v1(item_id, payload)
delete_carsi_item_v1(item_id)
create_cadde_promotion_campaign_v1(payload)
record_cadde_promotion_event_v1(campaign_id, placement_key, event_type)
report_cadde_entity_v1(entity_type, entity_id, reason, details)
admin_moderate_cadde_entity_v1(entity_type, entity_id, action, reason)
```

## 10.2 SQL Helper Fonksiyonları

```text
is_cadde_profile_complete(uid)
is_tr_resident(uid)
is_diaspora_resident(uid)
can_post_cadde(uid, country_id, city_id)
can_post_kopru(uid)
can_join_cadde_cafe(uid, cafe_id)
can_create_carsi_item(uid)
can_create_cadde_promotion(uid)
is_cadde_moderator(uid)
```

Bunlar:

- `security definer`
- `set search_path = public`
- recursion-free
- minimum veri döndüren
- RLS ile uyumlu
- test edilmiş

olmalıdır.

## 10.3 RLS Özeti

### `cadde_posts`

| İşlem | Kural |
|---|---|
| SELECT | `status='published'`, moderation approved, uygun diaspora/coğrafya görünürlüğü |
| INSERT | Doğrudan kapalı; RPC üzerinden |
| UPDATE | Sahibi veya moderator/admin |
| DELETE | Sahibi veya moderator/admin; mümkünse soft delete |

### `cadde_post_comments`

| İşlem | Kural |
|---|---|
| SELECT | Okunabilir posta bağlıysa okunabilir |
| INSERT | Profil tamam + telefon doğrulanmış + ban yok + rate limit |
| UPDATE/DELETE | Yorum sahibi veya moderator |

### `cadde_cafes`

| İşlem | Kural |
|---|---|
| SELECT | Yayında veya arşiv görünür |
| INSERT | RPC + feature + policy |
| UPDATE | Cafe sahibi veya moderator |
| DELETE | Soft archive tercih edilir |

### `carsi_items`

| İşlem | Kural |
|---|---|
| SELECT | Yayında ve moderasyon onaylı kayıtları herkes okuyabilir |
| INSERT | RPC + login + feature + doğrulanmış profil |
| UPDATE/DELETE | İlan sahibi veya moderator |

### Promotion

| İşlem | Kural |
|---|---|
| SELECT | Yayında ve tarih aralığında |
| INSERT | Uygun role sahip kampanya sahibi |
| Approve / publish | Admin veya moderator |
| Analytics | Sahibi kendi kampanyasını; admin tümünü görür |

---

# 11. Feed Sıralaması

## 11.1 CKS Band Sistemi

Sıralama iki aşamalı olmalıdır:

1. İçeriği doğru banda ayır.
2. Band içinde puanla ve stabil cursor pagination uygula.

Bandlar:

| Band | Açıklama | Öncelik |
|---|---|---:|
| A | Aynı şehir + birincil ihtiyaç eşleşmesi | 1 |
| B | Aynı şehir lokal içerikler | 2 |
| C | Aynı ülke lokal içerikler | 3 |
| D | Günlük ortalamanın %100 üstünde etkileşimli global | 4 |
| E | Günlük ortalamanın %50 üstünde etkileşimli global | 5 |
| F | Geri kalan global içerikler | 6 |

## 11.2 Örnek Skor

```text
score =
  geo_score
+ need_score
+ interest_score
+ engagement_score
+ freshness_score
+ admin_boost
- moderation_penalty
```

Örnek ağırlıklar:

```text
aynı şehir                    +100
aynı ülke                     +60
Köprü filtresine tam uyum     +50
ihtiyaç kategorisi eşleşmesi  +40
ilgi alanı başına             +8  (maks +32)
yüksek engagement bandı       +35
orta engagement bandı         +20
admin pinned                  +120
son 6 saat                    +25
son 24 saat                   +15
son 7 gün                     +5
```

## 11.3 Deterministik Random

Kalan içerikler her refresh’te zıplamamalıdır.

Yanlış:

```sql
order by random()
```

Doğru yaklaşım:

```text
hash(post_id + current_date + viewer_scope)
```

Bu sayede pagination stabil kalır ve kullanıcı aynı gün içinde tutarlı bir feed görür.

## 11.4 Sponsor Enjeksiyonu

Sponsorlar organik score içine karıştırılmamalıdır.

```text
Organik feed RPC
→ organik sonuçlar
→ placement policy
→ sponsor kartını örn. 3–5 organik post sonra enjekte et
→ sponsor badge zorunlu
→ impression kaydet
```

Frequency cap:

```text
Aynı kampanya aynı kullanıcıya aynı oturumda en fazla N kez
Aynı placement arka arkaya gösterilmez
Sponsor kart organik post gibi görünerek yanıltmaz
```

---

# 12. İlgi Alanı Hedefleme

## 12.1 Kullanıcı Profili

Profil ayarlarında “Bireysel İlgi Alanlarım” bölümü oluşturulmalıdır:

```text
Networking
Yeni Geldim
Aile & Çocuk
Kariyer
Girişimcilik
Eğitim
Teknoloji
Sanat & Kültür
Spor
Yemek
Seyahat
Gönüllülük
Mentorluk
```

## 12.2 İçerik Etiketleme

P0:

- Post oluştururken kullanıcı 1–3 etiket seçebilir.
- Admin postları etiketleyebilir.
- Cafe teması katalogla eşleştirilir.

P1:

- Basit kelime eşleme helperı öneri verir.
- Kullanıcı öneriyi düzenleyebilir.

P2:

- AI yalnızca öneri üretir.
- AI etiketi otomatik ve geri döndürülemez karar haline gelmez.
- Cafe reklam eşleşmesi AI + manuel tema listesinin birleşimiyle yapılır.

---

# 13. Cafe Modülü

## 13.1 Tek Form Kuralı

Cafe oluşturma için yalnızca bir component kullanılmalıdır:

```text
CreateCafeForm.tsx
```

Ambassador veya premium farkı yeni form varyantı oluşturmaz. Aynı form policy ve feature bilgisine göre alanları açar.

## 13.2 Form Alanları

```text
Cafe adı *
Tema *
Özet *
Diaspora
Kapsam: Global / Köprü / Ülke / Şehir
Giriş tipi: Açık / Onaylı / Davet kodlu
Davet kodu
Giriş sorusu
Başlangıç
Bitiş
Kapasite
Opsiyonel dış linkler
```

## 13.3 Validasyon

- Cafe adı boş olamaz.
- Küfür, spam, siyasi/dini taciz, marka ihlali sinyalleri moderasyon queue’ya gider.
- Bitiş başlangıçtan önce olamaz.
- Süre paket ve role göre sınırlandırılır.
- Davet kodu plain text saklanmaz; hash saklanır.
- URL alanları validate edilir.
- Cafe sahibi otomatik approved member olur.
- Arşiv cafe read-only olur.

## 13.4 Cafe Detail

Yeni rota:

```text
/cadde/cafe/:cafeId
```

Sayfa:

```text
Cafe header
→ Live badge
→ ülke bayrağı
→ şehir
→ tema
→ kalan süre
→ katılımcı sayısı
→ giriş durumu
→ paylaşım composer
→ cafe feed
→ cafe sahibiyse üye onay paneli
→ kapanınca read-only arşiv
```

## 13.5 Profil Parity

Kullanıcının açık cafeleri public profilde:

```text
Açık Cafe / Etkinlik
```

alanında listelenmelidir. Panelde de aynı alan yönetilebilir olmalıdır.

---

# 14. Çarşı Modülü

## 14.1 Ana Görünürlük

`CarsiGlobalTicker`:

- Desktop sol kolon en üstte.
- Mobil header altında yatay scroll.
- Son ilanlar veya editör seçkisi.
- Şehir filtresine göre daralabilir.
- “Tüm Çarşı” CTA içerir.

## 14.2 Rotalar

```text
/cadde/carsi
/cadde/carsi/:itemId
/profile?tab=carsi
/admin/cadde/carsi
```

## 14.3 İlan Akışı

```text
İlan oluştur
→ kategori seç
→ başlık, açıklama, fiyat, görseller, şehir
→ preview
→ moderasyon policy
→ publish veya queue
→ ticker + liste
→ ilan sahibi düzenle / pasife al
→ süresi dolunca expire
```

## 14.4 Premium

Premium limiti gerçek entitlement üzerinden çözülmelidir:

```text
free kullanıcı      → aktif ilan limiti
premium kullanıcı   → daha yüksek limit
moderator/admin      → limit override
```

Legacy `useIsPremium()` içindeki `accountType === "admin"` demo mantığı üretime taşınmamalıdır.

---

# 15. Çıfıt / Tanıtım Modülü

## 15.1 Uygun Roller

| Persona | Paket görünür mü? |
|---|---:|
| Bireysel | Hayır |
| Şehir Elçisi | Ücretli paket hayır; kendi şehrinde ücretsiz highlight |
| Danışman | Evet |
| İşletme | Evet |
| Kuruluş | Evet |
| Blogger / Vlogger | Evet |
| Admin | Tümü |

Kontrol persona string ile değil `cadde.promotion.create` feature anahtarıyla yapılmalıdır.

## 15.2 Placementler

| Placement | Açıklama |
|---|---|
| `homepage-ai-bar` | Ana sayfa AI bar altı; maksimum 3 ay |
| `category-first-screen` | Rol kategorisi ilk ekran; mobil ilk 6 içinde |
| `cadde-right-rail` | Global, Köprü, ülke veya şehir bazlı sağ kolon |
| `cadde-feed-inline` | Organik postların arasındaki sponsor kartı |
| `cafe-theme-right-rail` | Tema eşleşmeli cafe sağ kolonu |
| `city-ambassador-highlight` | Elçinin kendi şehrindeki ücretsiz öne çıkarma |

## 15.3 Kampanya Paneli

```text
/profile?tab=tanitim
```

Alanlar:

```text
Kampanya tipi
Başlık
Açıklama
Target URL *
Görsel
Placementler
Diaspora
Ülke / şehir
Tema listesi
Başlangıç / bitiş
Önizleme
Tahmini slot ebatları
Durum: taslak / onay bekliyor / aktif / reddedildi / süresi doldu
```

## 15.4 Güvenlik

- `target_url` zorunlu.
- URL allowlist değilse güvenli external link davranışı uygulanmalı.
- React Router `Link` yalnız internal URL için kullanılmalı.
- Absolute URL için `<a target="_blank" rel="noopener noreferrer">`.
- Sponsorlu badge kaldırılamamalı.
- Impression ve click analytics kayıtları abuse’a karşı sınırlandırılmalı.

---

# 16. Çoklu Diaspora

Repoda `DiasporaContext` içinde şu anahtarlar bulunmaktadır:

```text
tr
in
cn
ph
```

Fakat Cadde queryleri buna henüz tam bağlı değildir.

Hedef:

```text
DiasporaContext
→ selected diaspora_key
→ geo seçenekleri
→ UI stringleri
→ post create payload
→ feed filter
→ cafe filter
→ carsi filter
→ promotion filter
```

## 16.1 Kural

- Varsayılan `tr`.
- Seçim local storage veya profil ayarıyla korunabilir.
- Köprü dışındaki normal feedler diaspora anahtarına göre ayrılır.
- Köprü, ürün kararıyla aynı diaspora içindeki TR ilişkisini veya açık cross-diaspora akışını kullanabilir.
- Dil stringleri context üzerinden gelmelidir; component içinde dağınık hardcode azaltılmalıdır.

---

# 17. Bildirim ve Realtime

## 17.1 Eventler

```text
cadde.comment.created
cadde.reaction.created
cadde.follow.created
cadde.connection.requested
cadde.message.received
cadde.cafe.joined
cadde.cafe.member_approved
cadde.cafe.expiring
cadde.carsi.item_contacted
cadde.promotion.approved
cadde.moderation.action
```

## 17.2 UI

```text
NotificationsBell
→ unread badge
→ dropdown
→ entity deep link
→ mark one read
→ mark all read
```

## 17.3 Realtime

Supabase Realtime yalnız ilgili kullanıcının notification satırlarını dinlemelidir:

```text
recipient_user_id = auth.uid()
```

Feed realtime için ilk aşamada tüm post streamini açık tutmak yerine:

- Yeni post bildirimi chipi göster.
- Kullanıcı tıklayınca query invalidate et.
- Scroll pozisyonu bozulmasın.

---

# 18. Moderasyon ve Güvenlik

## 18.1 Moderasyon Katmanları

```text
Client validation
→ server RPC validation
→ otomatik kelime / spam kontrolü
→ riskli içerik için moderation queue
→ kullanıcı report
→ moderator dashboard
→ audit log
```

## 18.2 Kontrol Edilecek İçerikler

```text
Post başlık ve body
Yorum
Cafe adı ve özet
Çarşı ilanı
Reklam başlığı, görseli ve target URL
Profil public alanları
```

## 18.3 Rate Limit

Örnek limitler ürün kararıyla kesinleştirilmelidir:

```text
Post                 → kullanıcı başına saatte X
Yorum                → dakikada X
Reaction             → saniyede X
Cafe oluşturma       → günde X
Cafe katılımı        → günde X community cafe
Çarşı ilanı          → paket limitine göre
Report               → kötüye kullanımı önleyecek limit
```

## 18.4 Admin Panel

```text
/admin/cadde/moderation
```

Filtreler:

```text
Entity tipi
Risk sebebi
Tarih
Kullanıcı
Şehir / ülke
Durum
Reporter sayısı
```

Aksiyonlar:

```text
Gizle
Yayınla
Reddet
Banla
Ban kaldır
Boost ver
Audit notu ekle
```

---

# 19. Admin Cadde Alanı

Mevcut `AdminCaddePage.tsx` temel CRUD içermektedir. Bu ekran route-level modül yapısına ayrılmalıdır.

## 19.1 Dashboard

```text
/admin/cadde
```

KPI:

```text
Aktif post
Son 24 saat post
Aktif cafe
Arşiv cafe
Aktif Çarşı ilanı
Açık moderasyon kaydı
Aktif kampanya
Impression / click
En aktif şehirler
En aktif ilgi alanları
```

## 19.2 Alt Sayfalar

```text
/admin/cadde/posts
/admin/cadde/cafes
/admin/cadde/carsi
/admin/cadde/promotions
/admin/cadde/moderation
/admin/cadde/settings
```

## 19.3 Admin Ayrımı

Admin CRUD, kullanıcı self-service ve public read aynı API fonksiyonunda karışmamalıdır:

```text
cadde-api.ts
cadde-admin-api.ts
```

---

# 20. Legacy Decommission Planı

## 20.1 Önce Inventory

Aşağıdaki exact path ve tablolar grep edilmelidir:

```text
src/pages/Feed.tsx
src/components/feed/*
src/hooks/useCafes.ts
src/hooks/useFeedSocial.ts
src/hooks/useConnections.ts
feed_posts
feed_likes
cafes
cafe_memberships
cadde_posts
cadde_post_reactions
cadde_post_comments
cadde_cafes
cadde_cafe_members
```

## 20.2 Veri Kararı

| Soru | Aksiyon |
|---|---|
| Legacy tablolarda gerçek veri yok mu? | Yazmayı kapat, arşivle, sonra drop için ayrı karar |
| Legacy tablolarda gerçek veri var mı? | Backfill script + checksum + rapor |
| Legacy component başka route tarafından kullanılıyor mu? | Route inventory ve kaldırma planı |
| Legacy UX parçası değerli mi? | Yeni canonical component içine yeniden uygula |
| Legacy trigger CKS ile çelişiyor mu? | Yeni RPC policy’ye geç; triggerı soft-decommission et |

## 20.3 Dual-Write Yasak

Geçiş sırasında iki tabloya eşzamanlı yazma çözümü yalnızca zorunlu ve süreli migration köprüsü olarak kullanılabilir. Kalıcı dual-write kabul edilmez.

## 20.4 Soft-Decommission

Önerilen sıra:

```text
1. Legacy UI route erişimini kapat
2. Legacy mutation policylerini revoke et
3. Legacy tablolara açıklayıcı COMMENT ekle
4. Backfill doğrula
5. En az bir canary sürüm gözlemle
6. Ayrı migration ile drop veya archive view kararı al
```

---

# 21. Uygulama Fazları

## Faz 0 — Karar ve Inventory

**Amaç:** Kod yazmadan önce gerçek tablo ve route envanterini çıkar.

Todo:

```text
[ ] Aktif /cadde route doğrula
[ ] Legacy route ref taraması
[ ] cadde_* ve eski feed/cafe tablo şemalarını çıkar
[ ] RLS policy ve trigger inventory
[ ] Telefon doğrulama truth source belirle
[ ] notifications tablosu var mı kontrol et
[ ] geo_countries/geo_cities ile cadde_countries/cadde_cities ilişkisini kontrol et
[ ] Çarşı ve Çıfıt isim sözleşmesini kayda geçir
[ ] Juke Box / Post-it gibi ek fikirleri P2 backlog’a ayır
```

Çıktı:

```text
docs/cadde-300/00-inventory.md
docs/cadde-300/01-decisions.md
```

## Faz 1 — Canonical Domain Sabitleme

Todo:

```text
[ ] src/lib/cadde.ts modülerleştirme planı
[ ] cadde-types.ts
[ ] cadde-schemas.ts
[ ] cadde-api.ts
[ ] cadde-query-keys.ts
[ ] direct component fetch yasağı
[ ] yeni kod canonical auth importu
[ ] demo default yerine production real default
[ ] sessiz catch bloklarını telemetry ile değiştir
```

Kabul:

```text
[ ] /cadde aynı görünümle açılır
[ ] Mevcut gerçek feed bozulmaz
[ ] npm run build geçer
[ ] Yeni modüllerde any minimuma iner
```

## Faz 2 — Actor Context, Profil Gate, Köprü Policy

Todo:

```text
[ ] get_cadde_actor_context RPC
[ ] doğrulanmış telefon kaynağı
[ ] ülke ve şehir zorunluluğu
[ ] CaddeEntryGuard
[ ] aktif CaddeProfileGate
[ ] can_post_cadde
[ ] can_post_kopru
[ ] create_cadde_post_v1
[ ] role_features seed
[ ] truth-table testleri
```

Kabul:

```text
[ ] Profil eksik kullanıcı blur demo görür
[ ] Doğrulanmamış kullanıcı post atamaz
[ ] TR bireysel toggle kapalıyken Köprü post atamaz
[ ] TR bireysel toggle açıkken Köprü post atabilir
[ ] TR işletme digital community kapalıyken Köprü post atamaz
[ ] Diaspora doğrulanmış kullanıcı Köprü post atabilir
```

## Faz 3 — Filtre ve Feed Ranking

Todo:

```text
[ ] çoklu ülke / şehir filtre UX
[ ] şehir alfabetik sıralama
[ ] URL state
[ ] interest catalog
[ ] kullanıcı ilgi alanları
[ ] post tagleri
[ ] list_cadde_feed_v1 cursor RPC
[ ] band + score sistemi
[ ] stabil pagination
```

Kabul:

```text
[ ] Aynı şehir ihtiyacı üstte çıkar
[ ] Engagement bandları ölçülebilir
[ ] Pagination tekrar ve kayıp üretmez
[ ] Gün içindeki random sıra stabil kalır
```

## Faz 4 — Cafe

Todo:

```text
[ ] tek CreateCafeForm
[ ] cafe create RPC
[ ] cafe join RPC
[ ] open / approval / referral
[ ] Köprü / Türkiye / diğer ülke cafe policy
[ ] cafe detail route
[ ] cafe feed
[ ] owner approval panel
[ ] read-only archive
[ ] public profile açık cafe listesi
```

## Faz 5 — Çarşı

Todo:

```text
[ ] carsi_categories
[ ] carsi_items
[ ] RLS
[ ] create/update/delete RPC
[ ] CarsiGlobalTicker
[ ] mobile ticker
[ ] Çarşı liste ve detay rotaları
[ ] profil ilan yönetimi
[ ] admin moderasyon
[ ] premium ilan limiti
```

## Faz 6 — Çıfıt / Tanıtım

Todo:

```text
[ ] promotion campaign schema
[ ] placement seed
[ ] eligible role feature mapping
[ ] /profile?tab=tanitim
[ ] target URL validation
[ ] preview slot dimensions
[ ] admin approval
[ ] feed inline injection
[ ] right rail
[ ] cafe theme matching P1 manuel, P2 AI öneri
[ ] impression / click telemetry
```

## Faz 7 — Realtime, Bildirim ve Moderasyon

Todo:

```text
[ ] notification producer
[ ] NotificationsBell
[ ] unread count
[ ] Realtime channel
[ ] reports
[ ] moderation queue
[ ] ban
[ ] audit log
[ ] rate-limit
```

## Faz 8 — Çoklu Diaspora

Todo:

```text
[ ] diaspora_key kolonları
[ ] DiasporaContext bağlantısı
[ ] dynamic stringler
[ ] feed filtre
[ ] cafe filtre
[ ] Çarşı filtre
[ ] promotion filtre
[ ] TR/IN/CN/PH testleri
```

## Faz 9 — Legacy Decommission

Todo:

```text
[ ] legacy data raporu
[ ] gerekiyorsa backfill
[ ] legacy write revoke
[ ] unused component kaldırma
[ ] unused hook kaldırma
[ ] eski tablo drop için ayrı karar dokümanı
[ ] CKS teknik referanslarını güncelle
```

---

# 22. Test Stratejisi

## 22.1 Unit Test

```text
cadde-rules.test.ts
cadde-ranking.test.ts
cadde-targeting.test.ts
cadde-schemas.test.ts
cadde-format.test.ts
```

Zorunlu truth-table testleri:

```text
TR resident + verified + normal Cadde
TR resident + verified + Köprü + indivRelocating OFF
TR resident + verified + Köprü + indivRelocating ON
TR business + digitalCommunity OFF
TR business + digitalCommunity ON
Diaspora + verified + Cadde
Diaspora + verified + Köprü
Unverified user
Banned user
Admin override
```

## 22.2 Integration Test

Supabase local test:

```text
RLS SELECT
RLS INSERT rejection
RPC post create
RPC Köprü create
RPC cafe join
Cafe country policy
Çarşı owner CRUD
Moderator hide
Promotion eligible role
Promotion ineligible role
Notification trigger
```

## 22.3 Component Test

```text
CaddeProfileGate
CaddeEntryGuard
MultiCountryCityFilter
CreatePostComposer
CreateCafeForm
CarsiGlobalTicker
SponsoredFeedCard
NotificationsBell
```

## 22.4 Playwright E2E Persona Matrisi

| Persona | Senaryo |
|---|---|
| Anonim | `/cadde` → login |
| Profil eksik | Blur demo + eksik alan modal |
| Telefon doğrulanmamış | Post butonu locked |
| TR bireysel | Normal post yalnız Türkiye |
| TR bireysel taşınmıyor | Köprü post reddedilir |
| TR bireysel taşınıyor | Köprü post yayınlanır |
| TR işletme community kapalı | Köprü reddedilir |
| TR işletme community açık | Köprü yayınlanır |
| Diaspora üyesi | Şehir filtresi ve Köprü |
| Cafe sahibi | Cafe aç, approval başvurusu onayla, arşivle |
| Çarşı ilan sahibi | İlan aç, düzenle, expire et |
| Danışman | Tanıtım kampanyası oluştur |
| Bireysel | Tanıtım paketi görünmez |
| Şehir elçisi | Ücretsiz şehir highlight |
| Moderator | Post gizle, report çöz |
| Admin | Placement yayınla, audit gör |
| Diaspora switch | TR → IN → CN → PH filtre ayrımı |
| Realtime | İkinci oturum yorum yapınca bildirim badge |

## 22.5 CI Kontrolü

```bash
npm run lint
npm run test
npm run build
supabase db reset
supabase migrations list
supabase gen types typescript --local > src/integrations/supabase/types.ts
npx playwright test
BASE_URL=https://corteqs.net npm run verify:release
```

Windows PowerShell kullanımında environment satırı:

```powershell
$env:BASE_URL="https://corteqs.net"
npm run verify:release
```

---

# 23. Observability

Minimum event seti:

```text
cadde_page_view
cadde_gate_shown
cadde_gate_completed
cadde_filter_changed
cadde_post_created
cadde_post_reacted
cadde_comment_created
cadde_cafe_created
cadde_cafe_joined
cadde_carsi_item_created
cadde_promotion_impression
cadde_promotion_click
cadde_report_created
cadde_moderation_resolved
cadde_api_error
```

Loglarda:

- Kişisel telefon saklanmamalı.
- Hassas veri maskeleme yapılmalı.
- `user_id` gerekiyorsa güvenli kimlik olarak tutulmalı.
- RPC error code anlamlı olmalı:
  - `cadde_profile_incomplete`
  - `phone_verification_required`
  - `cadde_bridge_permission_denied`
  - `cadde_cafe_country_restricted`
  - `cadde_rate_limit`
  - `cadde_banned`
  - `promotion_not_eligible`

---

# 24. Dosya Bazlı Uygulama Listesi

## Değiştirilecek Ana Dosyalar

```text
src/App.tsx
src/pages/CaddePage.tsx                  → yeni src/pages/cadde/CaddePage.tsx
src/pages/admin/AdminCaddePage.tsx       → admin/cadde alt rotalarına böl
src/lib/cadde.ts                         → modüllere böl
src/lib/features.ts                      → yeni Cadde feature keyleri
src/hooks/useFeatureFlags.ts             → yeni keyleri doğal olarak resolve edecek
src/contexts/DiasporaContext.tsx         → Cadde entegrasyonu için kullanılacak
```

## Yeni Dosyalar

```text
src/lib/cadde-api.ts
src/lib/cadde-admin-api.ts
src/lib/cadde-rules.ts
src/lib/cadde-ranking.ts
src/lib/cadde-targeting.ts
src/lib/cadde-schemas.ts
src/lib/cadde-types.ts
src/lib/cadde-query-keys.ts
src/hooks/cadde/*
src/components/cadde/*
src/pages/cadde/*
src/pages/admin/cadde/*
supabase/migrations/<timestamp>_cadde_300_*.sql
docs/cadde-300/*
```

## Freeze Edilecek Legacy Dosyalar

```text
src/pages/Feed.tsx
src/components/feed/CreatePostForm.tsx
src/components/feed/CreateCafeForm.tsx
src/components/feed/MultiCountryCityFilter.tsx
src/hooks/useCafes.ts
```

Bu dosyalara yalnızca kaldırma, compatibility veya kritik güvenlik düzeltmesi için dokunulmalıdır. Yeni feature geliştirmesi yapılmamalıdır.

## Exact Path Kontrolü Gereken CKS Referansları

Audit sırasında ana branch üzerinde exact path ile doğrulanamayan referanslar:

```text
src/lib/caddeRules.ts
src/components/feed/CarsiGrid.tsx
src/components/feed/CarsiGlobalTicker.tsx
src/components/feed/CarsiItemsManager.tsx
src/lib/interestTargeting.ts
src/components/AIConsultationCTA.tsx
src/components/NotificationsBell.tsx
src/lib/cafeNameModeration.ts
```

Bunlar kayıp kabul edilmeden önce repo genelinde grep ile alternatif konumları aranmalıdır. Bulunmuyorsa canonical yeni modül altında oluşturulmalıdır.

---

# 25. Definition of Done

Cadde 3.0 tamamlanmış sayılmadan önce:

## Mimari

```text
[ ] Aktif tek Cadde frontend hattı var
[ ] Aktif tek Cadde mutation hattı var
[ ] Legacy write path kapalı
[ ] Yeni component içinde doğrudan Supabase mutation yok
[ ] Canonical auth importu kullanılıyor
[ ] profiles / user_profiles / admin_users referansı yok
[ ] Yeni rol ailesi veya ikinci permission sistemi yok
[ ] Flat AFS + role_features + overrides kullanılıyor
```

## Ürün

```text
[ ] Profil kapısı çalışıyor
[ ] Telefon doğrulaması gerçek verification kaynağından geliyor
[ ] TR / diaspora / Köprü kuralları enforce ediliyor
[ ] Cafe policy çalışıyor
[ ] Cafe arşivi read-only
[ ] Çarşı ticker desktop ve mobile görünür
[ ] Çarşı owner CRUD çalışıyor
[ ] Tanıtım yalnız uygun rollerde görünüyor
[ ] Sponsor badge ve target URL zorunlu
[ ] İlgi alanı feed score’a katılıyor
[ ] Ranking CKS bandlarını uyguluyor
[ ] Bildirim badge realtime güncelleniyor
[ ] Moderasyon queue ve audit var
[ ] Diaspora switch querylere yansıyor
```

## Kalite

```text
[ ] npm run lint geçiyor veya yalnız önceden bilinen hata raporlanıyor
[ ] npm run test geçiyor veya yalnız önceden bilinen hata raporlanıyor
[ ] npm run build geçiyor
[ ] Supabase local reset geçiyor
[ ] Types regenerate edildi
[ ] RLS integration testleri geçiyor
[ ] Playwright persona testleri geçiyor
[ ] Release verify geçiyor
[ ] CKS dokümanı aynı PR içinde güncellendi
[ ] docs/cadde-300/change-report.md oluşturuldu
```

---

# 26. Riskler ve Açık Kararlar

| ID | Konu | Öneri |
|---|---|---|
| D-01 | Çıfıt adı kullanılacak mı? | Çarşı’dan kesin ayrıştır; ticari yüzey için marka adı kararı ver |
| D-02 | Anonymous gerçek feed okuyabilir mi? | MVP’de login zorunlu tut; landing için demo ayrı göster |
| D-03 | Telefon verification truth source nedir? | Inventory ile doğrula; raw phone kabul etme |
| D-04 | `cadde_countries/cities` ve `geo_countries/cities` ilişkisi | P0’da mevcut FK’leri bozma; tek truth source için sync veya kontrollü konsolidasyon planı yaz |
| D-05 | Eski `feed_posts` ve `cafes` verisi var mı? | Backfill kararından önce count + sample + owner raporu |
| D-06 | Cafe günlük katılım limiti korunacak mı? | CKS ile ürün kararı netleştir; legacy triggerı otomatik taşımama |
| D-07 | Premium altyapısı hazır mı? | Demo admin premium mantığını kaldır; entitlement service yaz |
| D-08 | AI tema matching hangi fazda? | P1 manuel etiket, P2 AI öneri |
| D-09 | Juke Box ve Post-it | Ayrı CKS maddesi yazılmadan P0 scope’a alma |
| D-10 | Public profile toggle | Global AFS attribute olarak çöz; Cadde post attribution buna uysun |

---

# 27. Uygulama Agent’ına Verilecek Master Prompt

Aşağıdaki prompt Claude Code veya Codex’e doğrudan verilebilir.

```text
CorteQS repository: corteqssocial-web/corfin-mvp

Görev: Cadde 3.0 modülünü kontrollü ve E2E biçimde yeniden düzenle. Önce kod yazma. İlk olarak inventory raporu çıkar ve onaylanabilir implementation plan hazırla.

Zorunlu kaynak sırası:
1. mevcut migrations ve repo gerçekliği
2. docs/architecture/AI_TECHNICAL_REFERENCE.md
3. CLAUDE.md
4. docs/AGENT_CONTEXT.md
5. Cadde Kural Seti CKS v2
Çelişkide ürün davranışında CKS, şema ve tablo isimlerinde güncel migration + AI_TECHNICAL_REFERENCE önceliklidir.

Kritik mimari karar:
- Canonical Cadde hattı src/pages/CaddePage.tsx + src/lib/cadde.ts + cadde_* tablolarıdır.
- src/pages/Feed.tsx ve src/components/feed/* legacy hattına yeni feature ekleme.
- Gerekli UX parçalarını legacy hattan canonical modüle taşı.
- Kalıcı dual-write oluşturma.
- Eski migrationları silme veya sıralama.
- Yeni migration ekle.
- src/integrations/supabase/client.ts ve generated types dosyasını elle düzenleme.
- Yeni kodda @/components/auth/useAuth kullan.
- profiles, user_profiles, admin_users, role_feature_defaults veya eski AFS adlarına referans verme.
- Rol ailesi, parent role veya paralel permission sistemi oluşturma.
- Flat roles + afs_features + role_features + user_feature_overrides kullan.
- Yeni componentlerde direct Supabase mutation yazma; lib/*-api.ts + React Query + RPC yaklaşımı kullan.
- shadcn generated src/components/ui/* dosyalarını elle değiştirme.
- /cadde SEO route’unu değiştirme.
- Türkçe domain terimlerini koru.

İlk teslim:
docs/cadde-300/00-inventory.md
docs/cadde-300/01-decisions.md
docs/cadde-300/02-current-gap-matrix.md
docs/cadde-300/03-implementation-plan.md

Inventory kapsamında:
- /cadde route
- /admin/cadde route
- src/pages/CaddePage.tsx
- src/lib/cadde.ts
- src/pages/Feed.tsx
- src/components/feed/*
- src/hooks/useCafes.ts
- cadde_* tabloları
- feed_posts / cafes / cafe_memberships tabloları
- bütün Cadde RLS policyleri
- Cadde triggerları
- telefon doğrulama truth source
- notifications yapısı
- cadde_countries/cities ile geo_countries/cities ilişkisi
- exact CKS pathlerinin varlığı
- legacy gerçek veri countları
- route ve import kullanımı

Daha sonra faz bazlı ilerle:
Faz 1 canonical domain modülerleştirme
Faz 2 actor context + profile gate + Köprü policy
Faz 3 multi geo filter + interests + ranking
Faz 4 Cafe
Faz 5 Çarşı
Faz 6 Çıfıt/Tanıtım
Faz 7 bildirim + realtime + moderasyon
Faz 8 çoklu diaspora
Faz 9 legacy soft-decommission

Her fazda:
1. önce plan
2. yeni migration
3. backend RPC/RLS
4. api layer
5. React Query hook
6. UI
7. unit test
8. integration test
9. Playwright E2E
10. npm run lint
11. npm run test
12. npm run build
13. değişen dosyalar raporu
14. CKS etkisi raporu

Önemli:
- Telefon doğrulanmadan mutation yapılamaz.
- TR kullanıcı normal Cadde’de yalnız Türkiye’ye post atabilir.
- TR bireysel Köprü’ye yalnız indiv_relocating açıkken post atabilir.
- TR işletme/danışman/kuruluş/elçi Köprü’ye yalnız digital_community_enabled açıkken post atabilir.
- Diaspora doğrulanmış kullanıcı Köprü’ye post atabilir.
- Cafe policy RPC ve RLS ile enforce edilir.
- Çarşı marketplace ile sponsorlu Çıfıt alanını birleştirme.
- Sponsorlu içerik açık etiketli ve target URL zorunlu.
- Feed ranking CKS bandlarını uygular.
- Arşiv cafe read-only olur.
- Public profile toggle Cadde post attribution üzerinde uygulanır.
- Hata catch bloklarını sessiz bırakma; kullanıcı güvenli mesaj + telemetry üret.
```

---

# 28. Sonuç

Cadde 3.0 için doğru yaklaşım “mevcut ekranı büyütmek” değildir. Önce paralel Cadde hatlarını tek canonical domain altında birleştirmek, daha sonra profil kapısı, Köprü policy, Cafe, Çarşı, Çıfıt/Tanıtım, ranking, bildirim ve moderasyon katmanlarını sırayla eklemek gerekir.

En kritik ilk sprint:

```text
1. Inventory
2. Canonical domain sabitleme
3. Actor context
4. Telefon doğrulama
5. Profile Gate
6. Köprü mutation policy
7. RPC + RLS
8. Persona E2E testleri
```

Bu temel tamamlanmadan yeni ticari veya sosyal yüzey eklemek teknik borcu büyütür. Temel sabitlendikten sonra Çarşı ve Çıfıt/Tanıtım kontrollü biçimde üzerine kurulabilir.
