# Public Profil Sayfası — Dynamic Layout (2026-06-10)

`/directory/catalog/:slug` public profil sayfasının mimarisi, veri kontratı ve
yeni section ekleme rehberi.

## Mimari Özet

Tek bir **public profil composer** vardır; rol başına ayrı layout YOKTUR.
Tüm roller (üye, işletme, kuruluş, danışman...) aynı omurgayı kullanır:

```
DirectoryCatalogItemPage (ince container)
└── PublicProfileShell
    ├── PublicProfileBreadcrumb        ("Dizine Dön")
    ├── PublicProfileHero              (avatar/initials, rol, konum, rozetler, aksiyonlar)
    │   └── PublicProfileQuickActions  (Web Sitesi / E-posta / Telefon / Harita / Paylaş)
    ├── PublicProfileSectionList       (ana kolon — componentKey -> registry -> renderer)
    └── PublicProfileSidebar           (yan kolon, desktop'ta sticky)
```

Rol yalnızca **deterministic accent** (renk vurgusu) seçer
(`resolveProfileAccent`), layout yapısını asla değiştirmez.

## Veri Akışı

```
get_catalog_item_public_page_v2(p_slug)        -- tek public-safe RPC (camelCase jsonb)
→ public-catalog-profile-api.ts                 -- supabase.rpc çağrısı
→ public-catalog-profile-schemas.ts             -- Zod doğrulama + null/[] normalizasyonu
→ usePublicCatalogProfile.ts                    -- React Query (staleTime 60sn)
→ public-catalog-profile-view-model.ts          -- hero/badge/quick-action/section kararları
→ PublicProfileShell                            -- sadece render
```

- RPC `NULL` döndürürse (kayıt yok / private / unpublished) sayfa **aynı**
  bilgi sızdırmayan `PublicProfileNotFound` ekranını gösterir.
- Zod parse hatası da `null` olarak ele alınır (console.error + not-found);
  ziyaretçiye asla ham JSON veya teknik hata gösterilmez.

## RPC Kontratı (`supabase/migrations/20260610150000_public_catalog_profile_page_v2.sql`)

Payload (camelCase):

```
{ item: { id, slug, title, itemType, roleKey, roleLabel, headline,
          shortDescription, longDescription, avatarUrl, coverImageUrl,
          verificationStatus, isVerified, isClaimable,
          city, countryCode, countryLabel, addressLine, categories[] },
  sections[]:  { sectionKey, label, description, sectionArea,
                 componentKey, sortOrder, content{} },
  attributes[]: { key, label, dataType, sortOrder, valueText, valueJson },
  contacts[], links[], services[], languages[], media[],
  claim: { canClaim, verificationStatus } }
```

### Public-safe filtreler (güvenlik sınırı)

- item: `status='published' and visibility='public' and deleted_at is null`
- section: primary flat role → `role_sections.is_enabled` + `visibility='public'`
  → `afs_sections.is_active` + `default_visibility='public'`, sıralama `rs.sort_order`
- attribute: `afs_attributes.storage_strategy <> 'private_storage'` +
  `role_attributes.is_public` + efektif visibility `public` + `approval_status='approved'`
  (CV, telefon, referral_code vb. `private_storage` olduğu için asla çıkmaz)
- contacts/links/services/media: `is_public = true`; media'da `document` tipi asla dönmez
- ülke etiketi `geo_countries` üzerinden çözülür (hardcoded sözlük yok)
- her alan whitelist ile seçilir; `to_jsonb(row)` dump yoktur
- SECURITY DEFINER + `set search_path = public`; grant: `anon, authenticated`

## Renderer Registry — Yeni Section Ekleme

`src/components/directory/public-profile/section-renderers/renderer-registry.ts`

```
componentKey -> PUBLIC_SECTION_RENDERERS[key] -> section component
                (bulunamazsa)               -> GenericPublicSection
```

Mevcut rendererlar: `rich_text`, `attributes`, `contact_list`, `services`,
`languages`, `links`, `badges`.

**Yeni bir section eklemek için:**

1. Yeni migration ile `afs_sections`'a satır ekle (`component_key` belirle —
   canonical alan `component_key`'dir; yeni şemada `component_name` üretme).
2. İlgili rollere `role_sections` satırlarını explicit ekle (`is_enabled`,
   `sort_order`, `visibility='public'`).
3. RPC'ye dokunma — bilinmeyen `component_key` zaten payload'da akar.
4. Frontend'te HİÇBİR değişiklik yapılmazsa section **GenericPublicSection**
   fallback kartı ile görünür (sayfa kırılmaz, ham JSON dökülmez).
5. Özel UI istiyorsan: yeni renderer component yaz + registry'ye tek satır ekle.
   Placement (`main`/`sidebar`) view-model'deki `SECTION_PLACEMENTS`'ta tanımlanır.
6. Unit + E2E test ekle (`renderer-registry.test.tsx`, `e2e/public-profile.spec.ts`).

**Not — placement/empty tek kaynağı:** Plan dokümanındaki registry kontratından
farklı olarak `placement` ve boş-section filtresi **view-model'de** tutulur
(`SECTION_PLACEMENTS`, `isSectionEmpty`); registry yalnızca görsel component
çözer. Aynı bilginin iki katmanda tekrarlanmaması için bilinçli tercih.

### preview_card / detail_card

Canlıdaki 7 section'dan 4'ü `preview_card` alanındadır (title/location/image/badges)
ve hero zaten bu içerikleri gösterir; view-model bunları kart listesinden çıkarır.
`detail_card` sectionlar ana/yan kolonda kart olarak çizilir.

### Türetilmiş (derived) sectionlar

`attributes`, `services`, `contact_list`, `languages`, `links` verileri payload'da
top-level dizi olarak gelir; DB'de aynı `componentKey`'li bir section yoksa
view-model bunları sortOrder 900+ ile türetir (DB sectionları her zaman önce gelir).
Admin ileride bu sectionları `afs_sections`'a taşırsa DB tanımı otomatik kazanır.

## Claim Akışı

- Anonim + claimable → `Düzenleme Yetkisi Talep Et` →
  `/login?mode=signup&next=/directory/catalog/<slug>`
- Login + claimable → `submit_catalog_claim_request` RPC
  (`useSubmitCatalogClaim` mutation) → "Talep Gönderildi"
- `verification_status='claimed'` → "Yönetilen Profil" rozeti, CTA yok

## Test Haritası

| Katman | Dosya |
|---|---|
| Utils | `src/components/directory/public-profile/public-profile-utils.test.ts` |
| Schema | `src/lib/public-catalog-profile-schemas.test.ts` |
| View-model | `src/lib/public-catalog-profile-view-model.test.ts` |
| Registry | `.../section-renderers/renderer-registry.test.tsx` |
| Shell (component) | `.../PublicProfileShell.test.tsx` |
| Page (container) | `src/pages/DirectoryCatalogItemPage.test.tsx` |
| E2E (Playwright) | `e2e/public-profile.spec.ts` (Supabase REST mock'lu) |

## Eski Bileşenler

`ProfileHeroCard` ve `CatalogProfileLayout` artık yalnız kendi testleri
tarafından referans alınır (runtime kullanım 0); kaldırma ayrı cleanup
commit'ine bırakılmıştır. `IndividualPublicView` / `usePublicIndividualProfile`
de yalnız testlerinden referanslıdır — rebuild sonrası audit backlog'unda.
