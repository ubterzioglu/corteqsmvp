# B08 · PublicCard Envanteri

**Tarih:** 5 Ekim 2026
**Durum:** TAMAMLANDI (salt okunur)

---

## Mevcut Kart Bileşenleri

### 1. ListingCard
**Dosya:** `src/components/directory-listing/ListingCard.tsx`
**Kullanım:** `PublicListingPage.tsx` (İşletmeler / Uzmanlar / Şehir Elçileri sayfaları)

**Alanlar:**
| Alan | Kaynak | Açıklama |
|------|--------|----------|
| `title` | `row.title` | Başlık |
| `city` | `row.city` | Şehir |
| `countryName` | `row.countryName` | Ülke adı |
| `href` | `row.href` | Detay linki |
| `isVerified` | `row.isVerified` | Doğrulanmış rozeti |
| `headline` | `row.headline` | Kısa başlık |
| `description` | `row.description` | Açıklama (headline'den farklıysa) |
| `isDemo` | props | Demo rozeti |
| `roleLabel` | props | Rol etiketi (opsiyonel) |

**Görsel:**
- Avatar: `initialsOf(title)` → ilk 2 kelimenin baş harfi (trUpper ile)
- Renk: `bg-secondary text-secondary-foreground`
- Boyut: 56x56px (h-14 w-14)

**Özel davranış:**
- Demo rozeti: `isDemo` varsa `DemoBadge variant="card"` (kart üstü bant)
- Konum: `trTitleCasePlace(city), countryName`
- Başlık: `truncate` + `BadgeCheck` (isVerified varsa)
- Açıklama: `line-clamp-2`

---

### 2. MarqueeItemCard
**Dosya:** `src/components/MarqueeItemCard.tsx`
**Kullanım:** `DiasporaMarqueeSection.tsx`, `RadarHaberlerSection.tsx`

**Alanlar:**
| Alan | Kaynak | Açıklama |
|------|--------|----------|
| `id` | `item.id` | Benzersiz ID |
| `type` | `item.type` | news / stat / announcement |
| `title` | `item.title` | Başlık |
| `summary` | `item.summary` | Özet |
| `published_at` | `item.published_at` | Yayın tarihi |
| `image_url` | `item.image_url` | Görsel URL |
| `image_alt` | `item.image_alt` | Görsel alt metni |
| `metric_value` | `item.metric_value` | Metrik değeri (opsiyonel) |
| `link_enabled` | `item.link_enabled` | Link aktif mi |
| `slug` | `item.slug` | Detay slug'ı |

**Görsel:**
- Yükseklik: sabit 420px
- Görsel alan: 150px yükseklik
- Görsel varsa: `img` + `object-cover`
- Görsel yoksa: tip-bazlı gradient + ikon
  - news: mavi (`from-sky-500 to-blue-600`) + Newspaper
  - stat: yeşil (`from-emerald-500 to-teal-600`) + TrendingUp
  - announcement: turuncu (`from-orange-500 to-amber-600`) + Megaphone
- Metrik: `metric_value` varsa sol üstte badge

**Özel davranış:**
- Tip etiketi: renkli badge + ikon
- Tarih: `formatDate` (tr-TR, gün/ay/yıl)
- Başlık: `line-clamp-2`
- Özet: `line-clamp-5`
- Detay linki: `link_enabled && slug` varsa "Detay" butonu
- Link: `/diaspora/${slug}`

---

### 3. ZgenProfileCard
**Dosya:** `src/components/relocation/tools/zgen/ZgenProfileCard.tsx`
**Kullanım:** `ZgenPanel.tsx` (Taşınma aracı — "senin kuşağın")

**Alanlar:**
| Alan | Kaynak | Açıklama |
|------|--------|----------|
| `gen.id` | props | Kuşak ID |
| `gen.name` | props | Kuşak adı |
| `gen.avatars.m` | props | Erkek avatar URL |
| `gen.avatars.f` | props | Kadın avatar URL |
| `gen.avatarAlt` | props | Avatar alt metni |
| `profile.traits` | `getZgenProfile(gen.id)` | Tipik özellikler (10 adet) |
| `profile.vibes` | `getZgenProfile(gen.id)` | Vibe etiketleri (5 adet) |

**Görsel:**
- Avatar: 2 adet dairesel (erkek + kadın), üst üste binmiş (-space-x-3)
- Boyut: 64x64px (h-16 w-16)
- Renk: `border-brand-indigo/30 ring-1 ring-brand-indigo/20`

**Özel davranış:**
- Başlık: "Senin kuşağın: {gen.name}"
- Özellikler: liste (• ile)
- Vibes: Badge bileşeni

---

### 4. DirectoryResultCard
**Dosya:** `src/components/directory/DirectoryResultCard.tsx`
**Kullanım:** `DirectoryPage.tsx` (Dizin sayfası — kart görünümü)

**Alanlar:**
| Alan | Kaynak | Açıklama |
|------|--------|----------|
| `title` | `row.title` | Başlık |
| `city` | `row.city` | Şehir |
| `country` | `row.country` | Ülke |
| `href` | `row.href` | Detay linki |
| `roleLabel` | `row.roleLabel` | Rol etiketi |
| `isVerified` | `row.isVerified` | Onaylı rozeti |
| `isClaimable` | `row.isClaimable` | Sahiplenilebilir rozeti |
| `isFeatured` | `row.isFeatured` | Öne çıkan yıldızı |
| `description` | `row.description` | Açıklama |
| `imageUrl` | `row.imageUrl` | Görsel URL |
| `specialLabel` | `row.specialLabel` | Özel etiket (örn: "Uzmanlık") |
| `specialValue` | `row.specialValue` | Özel değer |

**Görsel:**
- Avatar: `imageUrl` varsa görsel, yoksa `initials` (trUpper ile)
- Boyut: 56x56px (h-14 w-14)
- Renk: `bg-gradient-to-br from-primary/20 via-primary/10 to-transparent`
- Öne çıkan: `isFeatured` varsa sağ üstte altın yıldız

**Özel davranış:**
- Rol etiketi: `bg-primary/10 text-primary` badge
- Onaylı: `ShieldCheck` ikon + "Onaylı" (sky renkli)
- Sahiplenilebilir: `Badge variant="secondary"`
- Konum: `city • country`
- Özel alan: `specialLabel: specialValue`
- Açıklama: `line-clamp-3`

---

### 5. CaddeRecommendationCard
**Dosya:** `src/components/cadde/CaddeRecommendationCard.tsx`
**Kullanım:** `CaddeFeedView.tsx` (Cadde akışı — tavsiye iste)

**Alanlar:**
| Alan | Kaynak | Açıklama |
|------|--------|----------|
| `title` | `row.title` | Tavsiye başlığı |
| `city` | `row.city` | Şehir (opsiyonel) |
| `id` | `row.id` | Tavsiye ID |

**Görsel:**
- İkon: `HeartHandshake` (turuncu)
- Başlık: "Tavsiye İste"
- Liste: max 3 açık talep

**Özel davranış:**
- **Bu bir kişi kartı DEĞİL** — tavsiye iste kartı
- Yalnız başlık + şehir çizilir (gövde metni çizilmez — iletişim sızıntısı önleme)
- CTA: "Tüm tavsiyelere git" → `/tavsiye`

---

## Cadde Kişi Kartı

**BULGU:** Cadde akışında ayrı bir "kişi kartı" bileşeni YOK.

Cadde akışında post'lar var, her post'un yazar bilgisi `CaddeFeedView.tsx` içinde çiziliyor:
- Avatar: `post.author_avatar_url` veya initials
- İsim: `post.author_display_name`
- Rol: `post.author_role_label`
- Konum: `post.author_city`, `post.author_country`

Bu bilgi post kartının içinde gömülü, ayrı bir bileşen değil.

---

## Ortak Alanlar Tablosu

| Alan | ListingCard | MarqueeItemCard | ZgenProfileCard | DirectoryResultCard |
|------|-------------|-----------------|-----------------|---------------------|
| Başlık | ✅ | ✅ | ✅ (kuşak adı) | ✅ |
| Alt başlık | ✅ (headline) | ✅ (summary) | ❌ | ❌ |
| Avatar/görsel | ✅ (initials) | ✅ (image_url) | ✅ (avatars) | ✅ (imageUrl veya initials) |
| Konum | ✅ (city, country) | ❌ | ❌ | ✅ (city, country) |
| Rol etiketi | ✅ (roleLabel) | ✅ (type) | ❌ | ✅ (roleLabel) |
| Doğrulama | ✅ (isVerified) | ❌ | ❌ | ✅ (isVerified) |
| Link | ✅ (href) | ✅ (slug) | ❌ | ✅ (href) |
| Tarih | ❌ | ✅ (published_at) | ❌ | ❌ |
| Demo rozeti | ✅ (isDemo) | ❌ | ❌ | ❌ |
| Özel rozet | ❌ | ✅ (metric_value) | ✅ (vibes) | ✅ (isFeatured, isClaimable) |

---

## PublicCard Tasarımı İçin Öneriler

**B09 · PublicCard bileşeni** için gözlemler:

1. **Ortak alanlar:** title, avatar (initials veya image), roleLabel, location (city/country), href, isVerified
2. **İki variant:** `person` (bireysel) ve `organization` (kurumsal)
3. **Avatar:** DirectoryResultCard deseni (imageUrl varsa görsel, yoksa initials)
4. **Rozetler:** isVerified (Onaylı), isFeatured (yıldız), isClaimable (Sahiplenilebilir)
5. **Demo rozeti:** ListingCard deseni (isDemo varsa DemoBadge)
6. **Konum:** `city • country` formatı (DirectoryResultCard deseni)
7. **Başlık:** `truncate` + BadgeCheck (isVerified varsa)
8. **Açıklama:** `line-clamp-2` veya `line-clamp-3`

**REV-057 ön kartı** temel alınarak tasarım yapılabilir.

---

## Sonraki Adım

**B09 · PublicCard bileşeni** — bu envantere göre ortak alanları destekleyen, `variant: person|organization` ile iki yüzey sunan yeni bileşen.

**Kod değişmez** — bu batch yalnızca envanter ve karakterizasyon testi.
