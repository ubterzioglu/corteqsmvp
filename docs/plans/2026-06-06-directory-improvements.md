# Directory Page İyileştirme Planı

**Tarih:** 2026-06-06  
**Kapsam:** Directory arama UI'ı, filtre refaktörü, şehir/ülke verisi, bireysel kullanıcı arama

---

## Gereksinimler (Özet)

1. **Label dropdown'a taşınacak** — Mevcut chip/pill listesi kaldırılacak, "Ne arıyorsun?" dropdown'una dönüştürülecek
2. **Search bar tam genişlik** — `max-w-2xl` kısıtlaması kaldırılacak
3. **Tek satır 3 eşit dropdown** — "Ne arıyorsun?" + "Ülke" + "Şehir" yan yana, aynı genişlikte
4. **Ülke/şehir verisi tamamlanacak** — `geo_cities` tablosu eksik; Almanya için yalnızca B harfine kadar şehirler görünüyor; tüm ülkeler için kapsamlı şehir verisi eklenecek
5. **Bireysel kullanıcı araması** — AFS (`user_profiles_v2` / `rolesgo_*`) ile tanımlanan bireysel kullanıcılar directory'de çıkmıyor; RPC düzeltilecek

---

## Mevcut Durum Analizi

### UI Katmanı

| Dosya | Rol |
|-------|-----|
| `src/pages/DirectoryPage.tsx` | Ana sayfa; arama state'i, URL parametreleri |
| `src/components/directory/DirectoryFilters.tsx` | Chip listesi + ülke/şehir dropdown |
| `src/components/directory/DirectorySearchBar.tsx` | Arama kutusu (şu an `max-w-2xl` ile sınırlı) |
| `src/lib/catalog-directory.ts` | `listUnifiedDirectoryRows()` + `listDirectoryRoleOptions()` |

### Veri Katmanı

| Dosya / Tablo | Rol |
|---------------|-----|
| `supabase/migrations/20260606133000_global_geo_reference.sql` | `geo_countries` + `geo_cities` tabloları; ülkeler tam seeded, **şehirler eksik** |
| `src/lib/geo.ts` | `listGeoCountries()`, `listGeoCities()` — DB önce, fallback olarak `countryCities.ts` |
| `src/data/countryCities.ts` | Statik fallback; Almanya için ~13 şehir var ama DB boşsa bu da kullanılmıyor olabilir |
| `supabase/migrations/20260606150000_unified_catalog_directory_and_access.sql` | `search_directory_catalog` RPC — sadece `catalog_items` sorgular |

### Kritik Bulgular

**Sorun 1 — Şehir verisi eksik:**  
`geo_cities` tablosu için migration'da seed verisi yok. `geo.ts` önce DB'yi dener; DB boş dönünce fallback `countryCities.ts`'e düşer. Fallback Almanya için 13 şehir içeriyor (hepsi B harfinden önce değil, alfabetik sırada B ile başlayanlar ortada). Ama eğer fallback devreye girmiyorsa (Supabase configured = true iken DB boş) sıfır şehir dönüyor.

**Sorun 2 — Bireysel kullanıcı araması çalışmıyor:**  
`search_directory_catalog` RPC yalnızca `public.catalog_items` tablosunu sorguluyor. AFS sistemiyle `user_profiles_v2` / `individual_profile_details` view'ında tanımlanan bireysel üyeler buraya hiç dahil edilmiyor. `useIndividualDirectory` hook'u ayrı bir tabloya bakıyor ama Directory sayfası onu kullanmıyor — `listUnifiedDirectoryRows` kullanıyor.

---

## İmplementasyon Planı

### Faz 1 — UI Refaktörü (DirectoryFilters + DirectorySearchBar)

**Etkilenen dosyalar:**
- `src/components/directory/DirectoryFilters.tsx`
- `src/components/directory/DirectorySearchBar.tsx`
- `src/pages/DirectoryPage.tsx`

**Adımlar:**

1. **SearchBar tam genişlik:**  
   `DirectoryPage.tsx` içindeki `<div className="mb-4 max-w-2xl">` wrapper'ından `max-w-2xl` kaldır. SearchBar tam genişliğe geçer.

2. **Chip listesini dropdown'a dönüştür:**  
   `DirectoryFilters.tsx`'teki `flex flex-wrap gap-2` içindeki buton listesini sil.  
   Yerine shadcn `<Select>` bileşeni koy (aranabilir olması için `<Command>` veya `<Combobox>` pattern kullanılabilir).  
   Placeholder: `"Ne arıyorsun?"`. "Tümü" seçeneği `value="all"` ile başa eklenecek.

3. **3 eşit dropdown tek satırda:**  
   Mevcut `grid gap-3 md:grid-cols-2` → `grid grid-cols-1 md:grid-cols-3 gap-3` olarak değiştir.  
   İlk kolon: yeni "Ne arıyorsun?" role dropdown'u  
   İkinci kolon: mevcut `SearchableCountrySelect`  
   Üçüncü kolon: mevcut `SearchableCitySelect`

4. **"Featured" toggle:**  
   Chip olarak göstermek yerine filtre satırının sağ köşesine küçük bir `Switch` veya `Checkbox` olarak taşı, ya da geçici olarak role dropdown'ının altına koy.

**Props değişiklikleri:**  
`DirectoryFilters` artık role chip render etmez; `roleFilter` + `onRoleChange` aynı kalır, sadece dropdown olur.

---

### Faz 2 — Ülke/Şehir Verisi Tamamlama

**Etkilenen dosyalar:**
- Yeni migration: `supabase/migrations/20260607000000_geo_cities_seed.sql`
- `src/data/countryCities.ts` (referans olarak kalır, fallback için)

**Adımlar:**

1. **Mevcut durumu doğrula:**  
   Supabase Studio'da `select count(*) from geo_cities;` çalıştır.  
   Sıfır ise problem net: migration şehir seed'i içermiyor.

2. **Yeni migration yaz — kapsamlı şehir verisi:**  
   `geo_countries` tablosundaki her ülke için `geo_cities`'e şehir ekle.  
   Öncelikli ülkeler (Türk diasporası yoğun):
   - **Almanya:** Berlin, Bremen, Bochum, Dortmund, Düsseldorf, Essen, Frankfurt, Hamburg, Hannover, Karlsruhe, Köln, Leipzig, Mannheim, Münih, Nürnberg, Stuttgart, Wiesbaden (17+ şehir)
   - İngiltere, Hollanda, Fransa, Avusturya, İsviçre, ABD, Kanada, Avustralya, BAE, Katar, vb.
   - `countryCities.ts`'deki tüm şehirleri SQL migration olarak dönüştür

3. **Migration şablonu:**
   ```sql
   -- geo_cities_seed: Almanya örneği
   insert into public.geo_cities (country_id, name, sort_order, is_active)
   select gc.id, city.name, city.sort_order, true
   from public.geo_countries gc
   cross join (values
     ('Berlin', 10), ('Münih', 20), ('Frankfurt', 30),
     ('Hamburg', 40), ('Düsseldorf', 50), ('Köln', 60),
     ('Stuttgart', 70), ('Bochum', 80), ('Dortmund', 90),
     ('Essen', 100), ('Hannover', 110), ('Leipzig', 120),
     ('Bremen', 130), ('Mannheim', 140), ('Nürnberg', 150),
     ('Karlsruhe', 160), ('Wiesbaden', 170)
   ) as city(name, sort_order)
   where gc.code = 'DE' and gc.is_active = true
   on conflict (country_id, name) do nothing;
   ```

4. **`geo.ts` fallback kontrolü:**  
   `listGeoCities` içinde DB sıfır sonuç döndüğünde `countryCities.ts` fallback'i devreye giriyor — bu davranış korunacak ama DB dolu olunca fallback gerekmeyecek.

---

### Faz 3 — Bireysel Kullanıcı Araması (AFS Entegrasyonu)

**Etkilenen dosyalar:**
- `supabase/migrations/20260607010000_directory_individual_users.sql` (yeni)
- `src/lib/catalog-directory.ts`
- `src/pages/DirectoryPage.tsx` (gerekirse)

**Kök Neden:**  
`search_directory_catalog` RPC sadece `catalog_items` tablosuna bakıyor. Bireysel üyeler `individual_profile_details` view'ında (`user_profiles_v2` + `rolesgo_*` tabanlı) tutuluyor, catalog_items'e eklenmemiş.

**Çözüm Seçenekleri:**

**A) RPC'ye UNION ekle (Önerilen):**  
`search_directory_catalog` fonksiyonuna ikinci bir `SELECT` bloğu ekle, `individual_profile_details`'dan `visibility_status = 'open'` olan kullanıcıları getir. Filtreleri (arama metni, ülke, şehir) bu blokta da uygula.

```sql
-- RPC içine UNION eklenecek kısım:
union all
select
  ipd.user_id::text as item_id,
  'member' as item_type,
  -- slug: profil URL'i için user_id veya username kullanılacak
  coalesce(p.username, ipd.user_id::text) as slug,
  coalesce(p.display_name, 'CorteQS Üyesi') as title,
  'bireysel' as role_key,
  'Bireysel Kullanıcı' as role_label,
  ipd.tagline as description,
  ipd.active_city as city,
  -- active_country'yi country_code'a dönüştür
  gc.code as country,
  (ipd.front_card ->> 'profile_image_url') as image_url,
  null as special_label,
  null as special_value,
  false as is_featured,
  false as is_verified,
  false as is_claimable
from public.individual_profile_details ipd
left join public.profiles p on p.id = ipd.user_id
left join public.geo_countries gc on gc.name = ipd.active_country
where ipd.visibility_status = 'open'
  and (v_role_key is null or v_role_key = 'bireysel')
  and (v_country_code is null or upper(coalesce(gc.code, '')) = v_country_code)
  and (v_city is null or lower(coalesce(ipd.active_city, '')) = lower(v_city))
  and (v_search_text is null or ...)
```

**B) Frontend'de ayrı fetch + merge:**  
`DirectoryPage.tsx`'te `useIndividualDirectory` hook'unu da çağır, sonuçları client-side birleştir. Daha kolay ama pagination ve filtreleme tutarsız olur. **Önerilmez.**

**Önerilen: A seçeneği** — tek RPC, tutarlı filtreleme, pagination hazır.

**Dikkat edilecekler:**
- `individual_profile_details` view'ının RPC içinden erişilebilir olması gerekiyor (`security definer` context ile sorun olmaz)
- `active_country` alanı metin (ör. "Almanya"), `geo_countries.name` ile eşleştirilmeli
- `profiles` tablosuna join ile `display_name` / `username` alınabilir
- `href` formatı: `/directory/profile/:userId` (mevcut route var)
- `UnifiedDirectoryRow.recordType` şu an sadece `"catalog_item"` — `"member"` tipi eklenmeli ya da mevcut `DirectoryResultRow` bileşeni member tipini handle etmeli

**Frontend güncellemesi:**  
`catalog-directory.ts`'teki `UnifiedDirectoryRow` tipine `recordType: "catalog_item" | "member"` ekle.  
`DirectoryResultRow.tsx`'te member tipi için farklı render (profil linki `/directory/profile/:userId`).

---

## Risk Değerlendirmesi

| Risk | Seviye | Önlem |
|------|--------|-------|
| geo_cities migration'ı production DB'yi etkiler | DÜŞÜK | `on conflict do nothing` — idempotent |
| RPC UNION bireysel profilleri yanlış filtreler | ORTA | Staging'de test et; `visibility_status = 'open'` kritik |
| `individual_profile_details` view'ı RPC'den erişilemez | ORTA | `security definer` + grant kontrolü gerekli |
| `active_country` → country_code eşleşmesi başarısız | ORTA | Legacy country name mapping eklenebilir (`catalog-directory.ts`'deki `legacyCountryToCode` referans alınabilir) |
| UI 3-kolon layout mobilde bozulur | DÜŞÜK | `grid-cols-1 sm:grid-cols-3` responsive breakpoint |
| Role dropdown'da çok fazla seçenek (50+) | DÜŞÜK | Combobox/arama ile aşılır |

---

## Dosya Değişim Özeti

| Dosya | Değişim Tipi | Açıklama |
|-------|-------------|----------|
| `src/components/directory/DirectoryFilters.tsx` | Değiştir | Chip listesi → Combobox dropdown; grid 2→3 kolon |
| `src/pages/DirectoryPage.tsx` | Küçük değişiklik | `max-w-2xl` wrapper kaldır |
| `src/lib/catalog-directory.ts` | Ekle | `UnifiedDirectoryRow` tipine `"member"` recordType |
| `src/components/directory/DirectoryResultRow.tsx` | Kontrol/ekle | Member tipi için render branch |
| `supabase/migrations/20260607000000_geo_cities_seed.sql` | Yeni | Tüm ülkeler için şehir verisi |
| `supabase/migrations/20260607010000_directory_individual_users.sql` | Yeni | `search_directory_catalog` RPC'ye UNION ekleme |

---

## Uygulama Sırası

1. **Faz 2** (geo_cities seed) — bağımsız, riski en düşük, hemen deploy edilebilir
2. **Faz 1** (UI refaktör) — veri hazır olunca yapılabilir, migration beklemiyor
3. **Faz 3** (bireysel kullanıcı RPC) — en karmaşık, ayrı test gerektiriyor

---

## Onay Bekleniyor

Bu planı onaylıyorsan implementasyona geçebiliriz. Faz sırası veya teknik yaklaşım konusunda değişiklik yapmak istersen belirt.
