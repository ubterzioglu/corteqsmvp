# Premium Profil Deneyimi — Experimental_2 Pilotu

> Durum: **UYGULANDI** (branch: `feat/premium-profile-experimental-2-pilot`, 2026-06-12)

## Amaç

Profil deneyimini (public profil + giriş yapmış kullanıcının profil editörü) premium,
mobil öncelikli ve Gen-Z uyumlu bir görsel dile taşımak; bunu canlı rollere dokunmadan
yalnızca `Experimental_2` flat rolü üzerinde izole biçimde kanıtlamak ve kalan rollere
config tabanlı genişletilebilecek bir temel oluşturmak.

## Pilot kullanıcı / rol

| Alan | Değer |
|---|---|
| Pilot e-posta | `experimental2@corteqs.net` |
| Pilot görünen ad | `Experimental Kullanıcı 2` |
| Pilot flat rol | `Experimental_2` |
| Negatif kontrol e-posta | `experimental1@corteqs.net` |
| Negatif kontrol rolü | `Experimental_1` (generic fallback almalı) |

Roller canlıda mevcut (mig `20260612120000_add_experimental_roles.sql`,
User_DiasporaMember klonu). **Bu pilot için yeni migration eklenmedi.**

## Presentation config yaklaşımı

Yeni katman: `src/lib/profile-presentation.ts`

- `resolveProfilePresentation(roleKey)` flat rol anahtarından **yalnızca görsel** kararları
  çözer (accent, heroVariant, eyebrow, primary aksiyon önceliği, tercih edilen section
  sırası, mobile action bar bayrağı).
- Eşleşme **exact match**: `Experimental_2` → `experimental-2-premium`; diğer her şey
  (Experimental_1 dahil) → `generic`.
- `generic` config görsel davranışı değiştirmez (accent/eyebrow null, primary listesi boş,
  section sırası DB sırası). Yetki/visibility/backend kuralları config'e taşınmadı.
- Rollout: yeni role premium görünüm vermek = `PRESENTATION_CONFIGS`'e bir entry eklemek.

## Public profil yapısı (`/directory/catalog/:slug`)

- View-model (`public-catalog-profile-view-model.ts`) artık presentation'ı çözer ve
  `presentation`, `trustSignals`, aksiyonlarda `variant: primary|secondary` alanlarını üretir.
- Yeni quick action'lar: **WhatsApp** (`wa.me` normalizasyonu / chat URL sanitizasyonu) ve
  **Randevu Al** (`appointment_url` contact, yalnızca güvenli http(s) URL).
- **Gerçek iki kolonlu layout**: `PublicProfileSectionList` main (lg 8 kolon) + sidebar
  (lg 4 kolon, sticky) ayrımını fiziksel olarak uygular; mobilde tek kolon.
- **Trust card** (`PublicProfileTrustCard`): Doğrulanmış / Yönetilen / Sahiplenilebilir
  sinyalleri açıklamalarıyla sidebar'ın tepesinde; yalnızca mevcut payload state'i kullanır.
- **Hero**: pilot için `experimental` varyantı — eyebrow ("Premium Profil"), daha büyük
  isim tipografisi (md:text-4xl), iki köşeli yumuşak gradient fallback, avatar ring.
  Generic roller eski hero yüzeyini aynen korur.
- **Mobile action bar** (`PublicProfileMobileActionBar`): yalnızca pilot config'te
  (`showMobileActionBar`), <md ekranda en fazla 2 primary aksiyon + paylaş; safe-area destekli.
- Skeleton yeni 8/4 layout'u yansıtır (layout shift azaltma). Claim akışı, owner inline
  edit, `navigator.share` + clipboard fallback aynen korundu.

## Authenticated profil yapısı (`/profile` → `/profile/bireysel`)

- `Experimental_2`, `getUiProfileType` fallback'i ile zaten `bireysel` segmentine düşer;
  **explicit override eklenmedi** (prompt §4.2: çalışıyorsa dokunma). İzolasyon
  `profile.roleKey === "Experimental_2"` (presentation key) üzerinden.
- `ProfilePage.tsx` görsel blokları değişkenlere ayrıldı; **tüm handler'lar ve veri
  sözleşmeleri birebir korunarak** iki kompozisyon oluşturuldu:
  - **Pilot layout**: `PremiumProfileHero` (avatar/initials, rol badge'i, tamamlanma %,
    Public Profili Görüntüle CTA, fotoğraf değiştir/kaldır, yardım, çıkış) + lg 8/4 grid
    (sol: mevcut düzenleme kartları; sağ sticky: `ProfileCompletionCard` +
    `ProfilePublicPreviewCard`) + altta mevcut Başvurular & Erişimler / Yardım kartları.
  - **Generic layout**: önceki yapı bire bir (hero kartı, profil durumu, kart listesi).
- Public preview CTA gerçek catalog slug ile çalışır (`useMemberCatalogSlug` →
  `getMyEditableCatalogItems` RPC, React Query). Slug yoksa kullanıcı dostu pasif durum;
  sahte slug üretilmez. Sorgu yalnızca pilot kullanıcıda çalışır (enabled bayrağı).
- Yeni componentler: `src/components/profile/premium/{PremiumProfileHero,
  ProfileCompletionCard, ProfilePublicPreviewCard}.tsx` — hepsi saf presentation,
  Supabase erişimi yok.
- `EditableProfilesSelector`: bozuk Türkçe metinler düzeltildi, kartlar premium hizalandı,
  pilot rol için "Premium Pilot" badge'i eklendi.

## Test matrisi

Otomatik (hepsi geçiyor — 107 dosya / 560 test):

- `profile-presentation.test.ts`: pilot çözümü, Experimental_1 + production + tanımsız
  rollerde generic fallback, kısmi eşleşme sızıntısı yok.
- `public-catalog-profile-view-model.test.ts`: WhatsApp/randevu aksiyonları + unsafe URL,
  pilotta max 2 primary, generic'te hepsi secondary, pilot section sıralaması vs generic
  DB sırası, main/sidebar placement, trust signal senaryoları + mevcut 22 senaryo.
- `PublicProfileShell.test.tsx`: trust card render testi eklendi; managed rozet
  assertion'ı çift görünüme (hero + trust card) uyarlandı.
- `ProfileResolverPage.test.tsx`: selector başlığı düzeltilmiş Türkçe metne güncellendi.

Manuel kontrol listesi: bkz. ana rapor §12 (pilot pozitif, Experimental_1 negatif,
desktop/mobil × light/dark, ziyaretçi/owner/claimable/managed/verified, fotoğrafsız profil).

## Migration durumu

**Migration eklenmedi.** Pilot tamamen frontend presentation config'i ile çözüldü;
roller ve AFS kayıtları 20260612120000 migration'ı ile zaten canlıda.

## Kalan rollere rollout önerisi

1. Pilot QA tamamlandıktan sonra rol başına bir `ProfilePresentationConfig` entry'si ekle
   (örn. `Healthcare_Doctor` → `professional` heroVariant + `appointment` primary;
   `Business_Restaurant` → `business` + `map`/`phone` primary; `Consultant_Immigration` →
   `professional` + `email`/`appointment`; `Organization_Association` → `organization`;
   `User_CityAmbassador` → `member` + şehir vurgusu).
2. Authenticated tarafta pilot layout'u `isPremiumPilot` yerine config bayrağına
   (örn. `premiumEditorLayout: boolean`) bağlayıp rol rol aç.
3. Her rollout adımında Experimental_1 negatif kontrolünü regresyon olarak koru.

## Bilinen sınırlamalar

- Sol kolondaki mevcut düzenleme kartları (Profil Alanları, Sosyal Medya, belgeler...)
  bilinçli olarak dokunulmadı; tipografileri hâlâ eski (text-[10px/11px]) ölçekte.
  Pilot QA sonrası ayrı bir pass ile yeni ölçeğe taşınabilir.
- Public tarafta iki kolonlu layout + trust card "iyileştirilmiş generic fallback"
  kapsamında tüm rollerde aktif (prompt §10'a uygun); premium görsel kimlik (eyebrow,
  gradient, primary CTA, sıralama, mobile bar) yalnızca Experimental_2'de.
- `appointment_url` contact'ı canlı payload'larda henüz yaygın değil; CTA veri geldikçe
  otomatik görünür.
- Repo genel ESLint'i legacy uyarılar içeriyor; değiştirilen dosyalarda 0 hata,
  2 `react-refresh/only-export-components` uyarısı (biri pre-existing pattern).
