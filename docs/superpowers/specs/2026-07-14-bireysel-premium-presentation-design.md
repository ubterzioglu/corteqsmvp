# Bireysel Kullanıcılar İçin Tek Tip (Premium) Profil Sunumu — Tasarım (Spec)

**Tarih:** 2026-07-14
**Durum:** Onaylandı

## Problem

`/profile` (editör) ve `/directory/catalog/:slug` (public profil) sayfaları, profilin görsel
sunumunu `src/lib/profile-presentation.ts` içindeki `resolveProfilePresentation(roleKey)`
fonksiyonundan çözer. Bugün yalnızca `Experimental_2` / `Experimental_3` test rolleri
"premium" (zengin hero, purple accent, öncelikli quick action'lar, özel section sırası,
mobile action bar) sunumu alıyor. "Bireysel" UI kategorisine düşen ~76 flat rolün tamamı
(`User_*`, `Admin_*` prefix'leri, `Job_Candidate`, `Marketplace_IndividualSeller` vb.)
bugün `GENERIC_PRESENTATION`'a düşüyor — sade, farksız bir görünüm.

İstenen: Deneysel pilotun kullandığı premium görsel sunumu, tüm "Bireysel" kategorisindeki
kullanıcılara (gerçek üyeler dahil) doğrudan canlıya yansıt.

## Kapsam

- **Kimler etkilenir:** `getUiProfileType(roleKey) === "bireysel"` olan her flat rol. Bu,
  `profile-types.ts`'deki mevcut eşleme mantığına göre belirlenir: `User_*`/`Admin_*`
  prefix'leri, `FLAT_ROLE_UI_TYPE_OVERRIDES` içindeki `Job_Candidate` /
  `Marketplace_IndividualSeller` override'ları, ve tanımsız/boş rol (varsayılan
  `defaultProfileType = "bireysel"`).
- **Ne değişiyor:** Yalnızca görsel sunum (`ProfilePresentationConfig` — hero variant,
  accent, eyebrow, primary action önceliği, section sırası, mobile action bar). Veri modeli,
  attribute seti, izin/RLS kuralları **değişmiyor**.
- **Deneysel_2/3 ile ilişki:** Pilot config ayrı kalır (kullanıcı tercihi: gelecekte
  ayrışma esnekliği korunsun). Yeni `INDIVIDUAL_PRESENTATION` config'i aynı görsel
  değerlere sahip, ayrı bir config olarak eklenir.
- **Devreye alma:** Feature flag yok — kod değişikliği + deploy sonrası tüm bireysel
  kullanıcılar anında yeni sunumu görür.

## Değişecek Dosya

`src/lib/profile-presentation.ts` — tek dosya.

### Yeni config

```ts
export const INDIVIDUAL_PRESENTATION_KEY = "individual-premium";

const INDIVIDUAL_PRESENTATION: ProfilePresentationConfig = {
  key: INDIVIDUAL_PRESENTATION_KEY,
  supportedRoleKeys: [],       // exact-match listesine girmez, predicate ile çözülür
  accent: "purple",
  heroVariant: "experimental",
  eyebrow: "Premium Profil",   // Experimental_2/3 ile birebir aynı metin
  primaryActionPriority: ["email", "whatsapp", "phone"],
  maxPrimaryActions: 2,
  preferredSectionOrder: ["rich_text", "attributes", "services", "contact_list", "languages", "badges"],
  showMobileActionBar: true,
};
```

### `resolveProfilePresentation` mantığı

1. Önce mevcut exact-match `Map` (`PRESENTATION_BY_ROLE_KEY`) kontrol edilir — Experimental_2/3
   davranışı değişmez.
2. Eşleşme yoksa `getUiProfileType(roleKey) === "bireysel"` kontrol edilir
   (`profile-types.ts`'den import edilen tek doğruluk kaynağı — burada kategori mantığı
   tekrar icat edilmez).
3. Eşleşirse `INDIVIDUAL_PRESENTATION`, aksi halde `GENERIC_PRESENTATION` döner.

Bu, `profile-presentation.ts`'in "pure presentation, no category logic" izolasyonunu bir
noktada gevşetir: `profile-types.ts`'e bağımlılık eklenir. Bu bilinçli bir tercih —
kategori sınıflandırması zaten oradaki tek kaynak, ikinci bir bakım noktası açılmaz.

## Etkilenen Yerler (kod değişikliği gerektirmez — resolver paylaşılıyor)

- **`ProfilePage.tsx`** — `isPremiumPilot` bayrağı artık tüm bireysel roller için de `true`
  olur; `PremiumProfileHero` / `PremiumProfileTabs` bireysel kullanıcılar için render edilir.
- **`PublicProfileHero.tsx` + `public-catalog-profile-view-model.ts`** — public profil
  sayfası bireysel kullanıcılar için `heroVariant="experimental"` alır (büyük avatar ring,
  eyebrow etiketi, radial glow arkaplan, büyük başlık).
- **`EditableProfilesSelector.tsx`** — "Premium Pilot" rozeti artık tüm bireysel profil
  kartlarında da görünür. Bilinçli yan etki; ayrı bir "Bireysel" rozeti istenmedi, aynı
  rozet paylaşılıyor.

## Test Etkisi

`src/lib/profile-presentation.test.ts` içindeki **"production rolleri generic fallback
alır"** testi artık yanlış olur (`User_DiasporaMember`, `Admin_Platform` gibi roller artık
generic değil, `INDIVIDUAL_PRESENTATION` alır). Bu test güncellenir:
- Bireysel kategorideki roller (`User_DiasporaMember`, `Admin_Platform`,
  `Job_Candidate`, `Marketplace_IndividualSeller`) → `INDIVIDUAL_PRESENTATION_KEY` beklenir.
- Bireysel olmayan roller (`Healthcare_Doctor`, `Business_Restaurant`,
  `Consultant_Immigration`, `Organization_Association`) → `GENERIC_PRESENTATION_KEY`
  beklenmeye devam eder (negatif kontrol).
- Yeni bir test: tanımsız/boş rol de `INDIVIDUAL_PRESENTATION_KEY` alır (çünkü
  `getUiProfileType` varsayılan olarak `"bireysel"` döner) — bu, mevcut "tanımsız rol
  generic alır" testiyle çelişir, o test güncellenir.

## Kapsam Dışı (YAGNI)

- Deneysel_2/3 config'ini silmek veya `INDIVIDUAL_PRESENTATION` ile birleştirmek — kullanıcı
  ayrı tutulmasını istedi.
- Feature flag / kademeli devreye alma — kullanıcı direkt canlıya almayı tercih etti.
- Veri modeli / attribute seti değişikliği — yalnızca görsel sunum kapsamı.
- Eyebrow metnini bireysel için özelleştirmek — kullanıcı "Premium Profil" ile aynı
  kalmasını istedi.

## Doğrulama

1. `npm run test -- src/lib/profile-presentation.test.ts` — güncellenen testler yeşil.
2. `npm run test` — tam suite (regresyon kontrolü, özellikle `ProfilePage.test.tsx`,
   `profile-view-model.test.ts`, `EditableProfilesSelector` ile ilgili varsa).
3. `npm run lint` + `tsc` (build) — tip hatası yok.
4. Görsel QA (deploy sonrası): bir "Bireysel" test kullanıcısıyla `/profile` ve public
   profil sayfasının premium hero düzenini aldığını doğrula.
