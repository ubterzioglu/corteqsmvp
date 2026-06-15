# CorteQS MVP Düzeltmeleri — E2E AI Agent Prompt

Sen kıdemli bir **React + TypeScript Frontend Engineer**, **Supabase/Postgres Engineer**, **UX/Product Designer**, **QA Lead** ve **Startup MVP Polish Specialist** gibi çalışacaksın.

Bu görevde amaç yeni büyük özellik icat etmek değil; mevcut CorteQS MVP arayüzünü **beta kullanıcılarına güven veren, hatasız, modern, sosyal platform hissi veren ve yarım kalmış modülleri kontrollü şekilde donduran** bir hale getirmektir.

Repo: `ubterzioglu/corteqsmvp`

Canlı site bağlamı: `corteqs.net`

Ana hedef: Excelde verilen MVP düzeltme notlarını ve repodaki mevcut yapıyı dikkate alarak, CorteQS MVP için **UI/UX polish + bugfix + feature freeze + search/filter düzeltmeleri + Cadde/Radar iyileştirmeleri** yap.

---

## 0. Önce Oku, Sonra Kodla

Kod yazmaya başlamadan önce şu dosyaları incele:

```txt
package.json
src/App.tsx
src/pages/Index.tsx
src/components/HeroSection.tsx
src/components/DiasporaSearchBar.tsx
src/pages/DirectoryPage.tsx
src/components/directory/DirectoryFilters.tsx
src/lib/catalog-directory.ts
src/pages/cadde/CaddePage.tsx
src/components/cadde/CaddeGeoFilter.tsx
src/lib/cadde-api.ts
src/lib/cadde-types.ts
src/lib/cadde-demo-data.ts
src/pages/RadarPage.tsx
src/components/MarqueeItemCard.tsx
src/lib/marquee.ts
src/pages/RelocationEngine.tsx
src/components/WelcomePackOrderForm.tsx
src/components/profiles/WelcomePack.tsx
supabase/migrations/20260612120000_add_experimental_roles.sql
```

Önce mevcut davranışı anlamadan dosya değiştirme. Gerekiyorsa ek dosyaları ara.

---

## 1. Proje Teknik Bağlamı

Bu repo Vite + React + TypeScript tabanlı. `package.json` içinde temel scriptler şunlar:

```bash
npm run verify:text
npm run lint
npm run build
npm run test
npm run test:e2e
```

Kullanılan ana teknolojiler:

- React 18
- React Router DOM 7
- TypeScript
- Tailwind CSS
- shadcn/radix UI component yapısı
- Supabase JS
- TanStack Query
- Vitest
- Playwright

Komut çalıştırırken önce mevcut package manager düzenini bozma. `package-lock.json` varsa npm kullan. Başka package manager ekleme.

---

## 2. Kullanıcıdan Gelen MVP Düzeltme Notları

Exceldeki notların normalize edilmiş hali:

| Alan | Problem / Not | İstenen Yön |
|---|---|---|
| HERO | “ekonomik ve sosyal” ifadesi ters/klişe yazılmış | Hero copy daha doğal ve doğru sırada olmalı |
| Arama sonrası filtre ekranı | Searchte super admin, yönetici vb. roller çıkıyor | Public searchte iç/admin/system roller görünmemeli |
| Profil | Açıklama ve metinlerde yazım hataları var | Profil metinleri ve UI copy denetlenmeli |
| Search | Ana sayfadaki Şehir Elçisi aramasından sonra tüm directory geliyor | Quick search niyeti korunmalı, doğru role/filter uygulanmalı |
| Relokasyon Motoru | Form gösterilsin ama üzerine “Yakında” bandı mı çeksek? | Yarım feature hata vermesin, kontrollü dondurulsun |
| Radar | Item metinleri kısa/mock gibi duruyor | Daha uzun, gerçek ürün hissi veren içerikler ve kart tasarımı |
| Cadde | Bireysel kullanıcıya default ilan verme iyi olur | Bireysel kullanıcı Caddeye ilan/paylaşım açabilmeli |
| Genel | Experimental kalmış | Experimental roller/etiketler public UI’dan temizlenmeli |
| Cadde | Like/destek vb. hover/popover olsun | Reaksiyon alanı daha modern ve az kalabalık olmalı |
| Filtreler | Ülke/şehir filtreleri fazla daralıyor; ABD sadece New York gösteriyor | Ülke/şehir deneyimi genişlemeli, boş sonuç daha iyi yönetilmeli |
| Cadde UI | User Manual gibi; alan üstü açıklamalar gereksiz; “Paylaşım Oluştur” mekanik duruyor | Sosyal medya / web platform estetiği güçlendirilmeli |
| Cadde layout | Sol menü, orta feed, sağ billboard için maskot ekran görüntüsü düşünülebilir | Sağ rail billboard/topluluk paneli gibi canlı kullanılmalı |
| Cadde UI | Macro ile yazılmış Excel gibi duruyor | Daha newage, colorful, sosyal web app tasarımı |
| AI search/filter | Aramadan filtre ekranına geçiliyor ama filtreleri uygulayacak buton yok | “Sonuçları Göster” / “Filtreleri Uygula” akışı net olmalı |
| Taşınma Motoru | Tıklanınca `https://corteqs.net/cadde` geliyor | Yanlış yönlendirme düzeltilmeli veya feature dondurulmalı |
| Hoşgeldin Paketi | Hata veriyor; butonlar dondurulsun mu? | Hata veren butonlar ya çalışmalı ya kontrollü pasif olmalı |

---

## 3. Ürün Kararı

Bu işi şu prensiple yap:

> Beta kullanıcı hata, kırık buton, ham mock, admin paneli dili veya Excel hissi görmemeli. Çalışmayan özellikler silinmek zorunda değil; görünür olabilir ama güvenli, şık ve “Yakında” durumunda olmalı.

Yani:

- Bozuk feature kullanıcıyı hata ekranına düşürmemeli.
- Hazır olmayan feature “Yakında” / “Beta sonrası aktif” moduna alınmalı.
- Public aramada admin, super admin, experimental, internal role görünmemeli.
- Cadde sosyal medya + dijital çarşı hissi vermeli.
- Radar gerçek haber/duyuru ürünü gibi görünmeli.
- Açıklama kalabalığı azaltılmalı.
- CTA metinleri daha doğal, Türkçe ve sıcak olmalı.

---

## 4. Öncelik Seviyeleri

### P0 — Mutlaka Yapılacaklar

Bunlar MVP güveni için kritik:

1. Public searchte admin/super admin/yönetici/experimental rollerini gizle.
2. Ana sayfa “Şehir Elçine Ulaş” quick search sonucunda tüm directory gelmesini engelle.
3. Taşınma Motoru butonunun `/cadde`ye gitmesini düzelt.
4. Hoşgeldin Paketi hata veriyorsa kullanıcıya raw hata göstermesini engelle; feature freeze uygula.
5. Filtre ekranına net “Sonuçları Göster” veya “Filtreleri Uygula” butonu ekle.
6. CaddeGeoFilter içindeki undefined callback kullanımını düzelt.
7. “Experimental” metin/rollerinin public UI’da görünmesini engelle.
8. Build, lint ve text verification hatasız geçsin.

### P1 — Güçlü UX Polish

1. Cadde UI’daki “User Manual / Excel / Admin panel” hissini azalt.
2. “Paylaşım Oluştur” yerine daha sosyal CTA kullan.
3. Bireysel kullanıcı için ilan/paylaşım açma deneyimini netleştir.
4. Cadde sağ rail/billboard alanını maskot/topluluk panosu gibi daha canlı yap.
5. Like/Destek/Fikir aksiyonlarını daha modern popover/hover/compact interaction ile düzenle.
6. Ülke/şehir filtrelerinde boş sonuç ve dar liste durumlarını daha iyi yönet.
7. Radar kart metinlerini uzat, mock hissini azalt.

### P2 — Ek Kalite

1. Profil ve public profile copy audit.
2. Küçük Playwright smoke testleri.
3. Screenshot checklist.
4. Kısa changelog.

---

## 5. Uygulama Planı

### Phase 0 — Preflight

1. Yeni branch aç:

```bash
git checkout -b mvp-polish-2026-06-12
```

2. Bağımlılıkları kur veya doğrula:

```bash
npm install
```

3. Başlangıç kontrollerini çalıştır:

```bash
npm run verify:text
npm run lint
npm run build
```

Başlangıçta hata varsa not al. Fakat bu görev kapsamındaki değişikliklerden sonra build/lint temiz olmalı.

---

## 6. HERO Copy Düzeltmesi

Hedef dosya:

```txt
src/components/HeroSection.tsx
```

Mevcut copy mantığı:

```txt
Dünyanın farklı yerlerinde yaşayan Türkleri sosyal ve ekonomik olarak birbirine bağlıyoruz.
```

İstenen:

- “ekonomik ve sosyal” sırası kullanılmalı veya cümle daha doğal hale getirilmeli.
- Klişe hissi azaltılmalı.
- Hero claim kısa, net ve Gen Z’ye de ağır gelmeyecek şekilde olmalı.

Önerilen yeni metinlerden birini kullanabilirsin:

```txt
Dünyanın farklı yerlerinde yaşayan Türkleri ekonomik ve sosyal fırsatlarla birbirine bağlıyoruz.
```

veya daha sıcak:

```txt
Nerede yaşarsan yaşa; doğru kişiye, topluluğa, işletmeye ve fırsata daha hızlı ulaşmanı sağlıyoruz.
```

Hero CTA hiyerarşisini bozma. Video alanını bozmadan yalnızca copy ve gerekirse küçük spacing düzeltmesi yap.

Acceptance:

- Hero metni doğal Türkçe olmalı.
- “sosyal ve ekonomik” tersliği düzelmiş olmalı.
- Mobile ve desktop layout bozulmamalı.

---

## 7. Public Search / Directory Role Hygiene

Hedef dosyalar:

```txt
src/lib/catalog-directory.ts
src/pages/DirectoryPage.tsx
src/components/directory/DirectoryFilters.tsx
supabase/migrations/* yeni migration
```

Mevcut risk:

- `listDirectoryRoleOptions()` sadece `is_directory_visible !== false` filtresi uyguluyor.
- Eğer DB’de admin, super admin, experimental veya internal roller `is_directory_visible=true/null` kaldıysa public filtreye düşebilir.
- `listUnifiedDirectoryRows()` RPC’den gelen satırları role bazında ekstra filtrelemiyor.

Yapılacaklar:

### 7.1 Internal role guard ekle

`catalog-directory.ts` içine merkezi bir guard ekle:

```ts
const HIDDEN_DIRECTORY_ROLE_KEYS = new Set([
  "admin",
  "Admin",
  "SUPER_ADMIN",
  "Super_Admin",
  "super_admin",
  "Platform_Admin",
  "Owner",
  "Experimental_1",
  "Experimental_2",
]);

const HIDDEN_DIRECTORY_ROLE_LABEL_PATTERNS = [
  /admin/i,
  /super\s*admin/i,
  /yönetici/i,
  /yonetici/i,
  /experimental/i,
  /deneysel/i,
];
```

Daha temiz isimlendirme kullanabilirsin. Ama amaç açık olmalı:

- Public role dropdown içinde bu roller görünmemeli.
- RPC sonucunda yanlışlıkla gelirse sonuç listesinde de filtrelenmeli.

### 7.2 Role options filtrele

`listDirectoryRoleOptions()` içinde:

- `is_directory_visible === true` olanları tercih et.
- `is_directory_visible !== false` fazla gevşek kalıyorsa `true` şartına çekmeyi düşün.
- Admin/experimental label/key guard ile kesin ele.

Örnek mantık:

```ts
.filter((role) => role.is_directory_visible === true)
.filter((role) => isPublicDirectoryRole(role.key, role.label))
```

Eğer `is_directory_visible` null mevcut rolleri kıracaksa:

- Önce migration ile gerçek public roller için `true`, internal roller için `false` set et.
- Kod tarafında yine safety guard bırak.

### 7.3 Directory result filtrele

`listUnifiedDirectoryRows()` içinde RPC sonucunu map etmeden veya map ettikten sonra hidden role guard uygula.

Amaç:

- Rol dropdown temiz olsa bile search sonucu admin/super admin/experimental getirmemeli.

### 7.4 Idempotent migration ekle

Yeni migration oluştur:

```txt
supabase/migrations/YYYYMMDDHHMMSS_hide_internal_roles_from_directory.sql
```

İçerik mantığı:

```sql
update public.roles
set is_directory_visible = false
where lower(key) in (...)
   or lower(label) like '%admin%'
   or lower(label) like '%experimental%'
   or lower(label) like '%deneysel%'
   or lower(label) like '%yönetici%'
   or lower(label) like '%yonetici%';
```

Dikkat:

- Admin panel rol yönetimini bozma.
- `is_active` veya `is_assignable` alanlarını bilinçsizce değiştirme.
- Sadece public directory görünürlüğünü kapat.

Acceptance:

- Search ve filtrelerde super admin/yönetici/experimental görünmez.
- Rol seçeneği dropdown temizdir.
- Search sonucunda internal role kartı görünmez.
- Build temizdir.

---

## 8. Ana Sayfa Quick Search Niyeti Korunsun

Hedef dosya:

```txt
src/components/DiasporaSearchBar.tsx
```

Mevcut davranış:

```ts
handleQuickSearch("Şehir Elçisi")
```

Bu sadece `q=Şehir%20Elçisi` olarak `/directory`ye gidiyor. Eğer backend search bu ifadeyi net karşılamazsa tüm directory veya alakasız sonuçlar gelebilir.

Yapılacak:

### 8.1 Quick searchleri semantic linke çevir

Şu quick pilller için mümkünse role/filter paramı oluştur:

- Konsolosluk
- Şehir Elçisi
- Vize & Göçmenlik
- İş İlanları

Özellikle “Şehir Elçine Ulaş” için:

- Eğer role key varsa `role=City_Ambassador` veya repodaki gerçek role key kullanılmalı.
- Gerçek role key’i repo/DB/migrationlardan bul.
- Bulamazsan `q=Şehir Elçisi&intent=city_ambassador` gibi geçici ama deterministik bir intent kullan ve Directory tarafında mapping yap.

Örnek yapı:

```ts
const QUICK_DIRECTORY_LINKS = {
  cityAmbassador: {
    label: "🏅 Şehir Elçine Ulaş",
    params: { role: "City_Ambassador" },
    fallbackQ: "Şehir Elçisi",
  },
};
```

### 8.2 Boş / tüm sonuç fallbackini engelle

Directory sayfası q/role geldiğinde:

- Eğer search/role intent varsa tüm directory sonucuna dönmemeli.
- Role bulunamadıysa kullanıcıya şık empty state göster:

```txt
Bu kategoride henüz görünür profil yok. İlk şehir elçisi başvurularını yakında burada göreceksin.
```

Acceptance:

- “Şehir Elçine Ulaş” tüm directory’i dökmez.
- Ya doğru şehir elçisi sonuçlarını gösterir ya da net empty state verir.
- Kullanıcının arama niyeti URL’de korunur.

---

## 9. Directory Filtre Akışı — Sonuçları Göster Butonu

Hedef dosyalar:

```txt
src/pages/DirectoryPage.tsx
src/components/directory/DirectoryFilters.tsx
src/components/directory/DirectorySearchBar.tsx
```

Problem:

- Kullanıcı ana sayfadaki AI/search bar’dan filtre ekranına geçiyor.
- Filtreleri seçiyor ama aramayı tetikleyecek net buton yok.
- Mevcut yapı URL paramlarını anlık güncelliyor olabilir, fakat kullanıcı bunu “buton yok” olarak algılıyor.

Yapılacak:

### 9.1 Görünür CTA ekle

Filtre alanının altına veya sağına büyük ve net bir buton ekle:

```txt
Sonuçları Göster
```

İkincil buton:

```txt
Filtreleri Temizle
```

### 9.2 Draft filter state önerisi

Mevcut filtreler URL’ye anında yazılıyorsa bile buton eklemek ilk MVP için yeterli olabilir. Fakat daha iyi çözüm:

- `DirectoryPage` içinde `appliedFilters` ve `draftFilters` ayrımı yap.
- Kullanıcı dropdown değiştirince draft güncellensin.
- `Sonuçları Göster` tıklanınca URL/search params güncellensin ve query tetiklensin.

Ama bu büyük refactor riskliyse şu MVP çözümünü uygula:

- Filtreler yine URL’ye yazabilir.
- Buton kullanıcıyı sonuç listesine scroll eder ve loading state varsa net gösterir.
- Buton üzerinde seçili filtre özeti görünür.

Önerilen UX:

```txt
[Ne arıyorsun?] [Ülke] [Şehir]
[Sonuçları Göster] [Temizle]
```

Acceptance:

- Kullanıcı filtre seçtikten sonra net bir “Sonuçları Göster” butonu görür.
- Button mobile’da tam genişlik çalışır.
- Filtre temizleme kolaydır.
- Boş sonuç mesajı insan gibi yazılmıştır.

---

## 10. Ülke / Şehir Filtreleri Çok Daralıyor

Hedef dosyalar:

```txt
src/components/directory/DirectoryFilters.tsx
src/components/SearchableCitySelect.tsx
src/components/cadde/CaddeGeoFilter.tsx
src/lib/cadde-api.ts
src/data/countryCities.ts
```

Problem örneği:

- ABD seçilince sadece New York çıkıyor.
- Şehir listesi azsa kullanıcı sistemde sadece bir şehir var sanıyor.

Yapılacak:

### 10.1 Directory city select davranışı

- Ülke seçildiğinde şehir alanında mutlaka “Tüm Şehirler - Ülke” seçeneği görünmeli.
- Eğer şehir datası azsa kullanıcıya küçük not göster:

```txt
Şehrini göremiyorsan ülke geneli arayabilir veya arama kutusuna şehir adını yazabilirsin.
```

### 10.2 ABD / büyük ülke fallback

`countryCities.ts` veya canlı `geo_cities` datası incelenmeli.

- Eğer ABD/US mapping sadece New York içeriyorsa major city fallback ekle.
- En azından şu şehirler fallbackte olmalı:
  - New York
  - Los Angeles
  - Chicago
  - Houston
  - Dallas
  - San Francisco
  - Miami
  - Boston
  - Seattle
  - Washington DC

Aynı şekilde Almanya, İngiltere, Kanada gibi büyük diaspora ülkeleri için major city fallback varsa koru/geliştir.

### 10.3 CaddeGeoFilter compile bug düzelt

`src/components/cadde/CaddeGeoFilter.tsx` içinde eski callback isimleri kalmış görünüyor:

```ts
onCountriesChange([])
onCitiesChange([])
```

Bu props yok. Bunları birleşik callback ile düzelt:

```ts
onChange({ countries: [], cities: [] })
```

ve

```ts
onChange({ countries: selectedCountries, cities: [] })
```

Acceptance:

- CaddeGeoFilter build hatası vermez.
- Ülke temizle ve şehir temizle butonları çalışır.
- ABD gibi ülkelerde tek şehir hissi oluşmaz.
- Şehir yoksa şık empty/help state vardır.

---

## 11. Taşınma Motoru / Relokasyon Motoru

Hedef dosyalar:

```txt
src/components/DiasporaSearchBar.tsx
src/pages/RelocationEngine.tsx
src/App.tsx
```

Mevcut durum:

- `src/pages/RelocationEngine.tsx` dosyası var.
- `src/App.tsx` içinde bu sayfaya route bağlı görünmüyor.
- Ana sayfadaki “Taşınma Motoru” butonu `/cadde`ye gidiyor.

Ürün kararı:

- Eğer RelocationEngine production ready değilse tamamen silme.
- Formu veya teaserı göster, ama üzerine şık “Yakında” bandı/overlay koy.
- Kullanıcının submit edip hata almasını engelle.

Yapılacak seçeneklerden birini seç:

### Seçenek A — Route + Coming Soon Overlay

1. `App.tsx` içine lazy import ekle:

```ts
const RelocationEngine = lazy(() => import("./pages/RelocationEngine.tsx"));
```

2. Public/auth kararını netleştir:

- Eğer sadece giriş yapan kullanıcılara gösterilecekse `RequireAuth` kullan.
- Eğer teaser public olacaksa route public olabilir ama submit disabled olmalı.

3. Route önerileri:

```txt
/relocation
/relokasyon
/tasinma-motoru
```

Türkçe karakterli URL kullanma.

4. `DiasporaSearchBar` içindeki Taşınma Motoru butonu `/cadde` yerine bu route’a gitsin.

5. `RelocationEngine` sayfası üstünde overlay:

```txt
Yakında
Relokasyon Motoru beta sonrası aktif olacak. Şimdilik formu inceleyebilir, ihtiyaçlarını planlayabilirsin.
```

- Submit/send/save butonları disabled olmalı.
- Disabled butonlarda tooltip veya açıklama olmalı.
- Kullanıcı hata ekranına düşmemeli.

### Seçenek B — Modal Teaser

Eğer route bağlamak riskliyse:

- Buton tıklanınca modal aç.
- Modalda mock form preview + Yakında etiketi göster.
- CTA:

```txt
Beta geri bildirimi gönder
```

veya

```txt
Haberdar olmak istiyorum
```

Ama çalışan backend yoksa yine submit etme.

Acceptance:

- “Taşınma Motoru” artık `/cadde`ye gitmez.
- Kullanıcı bozuk/hazır olmayan feature’da hata almaz.
- Feature güzel bir “Yakında” durumuyla görünür.

---

## 12. Hoşgeldin Paketi Hatasını Dondur / Graceful Hale Getir

Hedef dosyalar:

```txt
src/components/WelcomePackOrderForm.tsx
src/components/WelcomePackCTA.tsx
src/components/profiles/WelcomePack.tsx
src/components/DiasporaSearchBar.tsx
```

Mevcut risk:

- `WelcomePackOrderForm` Supabase `welcome_pack_orders` tablosuna insert yapıyor.
- Eğer tablo/RLS/form bağımlılığı hazır değilse kullanıcı raw hata görüyor.

Ürün kararı:

- Eğer feature backend olarak tam çalışmıyorsa “Yakında” moduna al.
- Buton kalsın ama kırık submit olmasın.
- Buton tamamen yok olmasın; roadmap hissi versin.

Yapılacak:

### 12.1 Feature flag / constant

Merkezi bir constant oluştur:

```ts
const WELCOME_PACK_ENABLED = false;
```

Daha iyi yer:

```txt
src/lib/feature-freeze.ts
```

Örnek:

```ts
export const FROZEN_FEATURES = {
  welcomePack: true,
  relocationEngine: true,
} as const;
```

### 12.2 Frozen modal

Eğer `welcomePack` frozen ise:

- Dialog açılsın.
- Form preview veya kısa açıklama görünsün.
- Submit butonu disabled olsun.
- Raw Supabase insert çalışmasın.
- Metin:

```txt
Yakında aktif olacak
Hoşgeldin Paketi ile uçuş, transfer, SIM kart, araç kiralama ve yerel destek ihtiyaçlarını tek yerden toplayabileceksin.
```

### 12.3 Hata handling

Eğer feature enabled kalacaksa:

- Supabase error kullanıcıya teknik detayla gösterilmesin.
- “Şu anda paket oluşturulamıyor. Lütfen daha sonra tekrar deneyin veya geri bildirim gönderin.” gibi mesaj göster.
- Console’da teknik hata kalabilir.

Acceptance:

- Kullanıcı Hoşgeldin Paketi tıklayınca raw hata almaz.
- Hazır değilse buton pasif/frozen ama şık görünür.
- Giriş yapmamış kullanıcı login loop veya hata almaz.

---

## 13. Cadde — Sosyal Akış + Dijital Çarşı Hissi

Hedef dosyalar:

```txt
src/pages/cadde/CaddePage.tsx
src/lib/cadde-types.ts
src/lib/cadde-demo-data.ts
src/components/cadde/*
supabase/migrations/* gerekirse
```

Mevcut UI problemleri:

- “CorteQS Cadde MVP”, “People Discovery”, “Mevcut directory deneyimine...” gibi ifadeler kullanıcıya admin/manual hissi veriyor.
- “Paylaşım Oluştur” mekanik duruyor.
- Sol filtre, orta feed, sağ billboard yapısı iyi ama daha canlı ve sosyal olmalı.
- Bireysel kullanıcı ilan verebilmeli.

### 13.1 Dil / Copy değişiklikleri

Şu ifadeleri kullanıcı dostu yap:

| Mevcut | Önerilen |
|---|---|
| CorteQS Cadde MVP | CorteQS Cadde |
| Şehir bazlı diaspora akışı, aktif kafeler ve sponsorlu keşif alanı | Şehrindeki Türklerle tanış, sor, paylaş ve fırsatları keşfet |
| People Discovery | İnsanları Keşfet |
| Mevcut directory deneyimine Cadde filtreleriyle geç | Seçtiğin şehirdeki kişi ve işletmeleri keşfet |
| Paylaşım Oluştur | Caddeye Çık / Caddede Paylaş |
| Post tipi | Ne paylaşmak istiyorsun? |
| Text | Paylaşım |
| Question | Soru |
| Offer | İlan / Teklif |
| Event | Etkinlik |
| Demo: admin seed içerik | Örnek içerik |
| Gerçek: kullanıcı paylaşımları | Canlı akış |

MVP, admin, seed, demo gibi kelimeler public UI’da mümkün olduğunca görünmemeli.

### 13.2 Bireysel kullanıcı ilan açabilmeli

Mevcut post type enum:

```ts
export type CaddePostType = "text" | "question" | "offer" | "event";
```

Büyük DB migration yapmadan ilk etapta:

- `offer` tipini UI’da `İlan / Teklif` olarak göster.
- Placeholderları ikinci el / yardım / hizmet gibi yönlendir.
- Bireysel kullanıcı için varsayılan akışta “İlan / Teklif” seçeneği görünür ve kullanılabilir olmalı.

Örnek placeholder:

```txt
Örn: Dortmund’da ikinci el masa arıyorum / Berlin’de taşınma için destek arıyorum / Münih’te Türkçe bilen muhasebeci önerisi lazım.
```

Daha iyi composer hızlı kategori chipleri:

```txt
İkinci El
Yardım / Destek
Hizmet
Etkinlik
Tavsiye
İş / Fırsat
```

DB’de `need_category` veya `interests` kullanılabiliyorsa bu chipleri oraya map et. Yeni enum ekleme ancak gerçekten gerekli ve migration güvenliyse yap.

### 13.3 Caddeye Çık CTA

Sol raildeki “Caddeye Çık” butonu şu an sadece görsel gibi durabilir. Bunu composer alanına scroll eden gerçek aksiyon yap:

- Composer card’a `id="cadde-composer"` ekle.
- Sol rail butonu click ile oraya scroll etsin.

### 13.4 Sağ rail / Billboard alanı

Sağdaki alanı “Billboard” teknik kelimesinden çıkar.

Önerilen başlıklar:

```txt
CorteQS Panosu
Bugün Caddede
Şehrinden Öne Çıkanlar
```

İçerik önerileri:

- Maskot görseli: `/lmaskot.png` veya mevcut uygun asset.
- “Beta geri bildirimi ver” kartı.
- “Yeni gelen üyeler” placeholderı.
- “Popüler şehirler” kartı.
- “Yakında aktif olacak özellikler” kartı.
- Sponsor/işletme kartları varsa altında göster.

Ama backend olmayan şeyi çalışanmış gibi gösterme. Teaser olabilir.

### 13.5 Reaksiyonlar popover/hover

Mevcut reactionlar ayrı ayrı butonlar:

- Beğendim
- Destek
- Fikir

Bunlar feed içinde kalabalık görünüyorsa:

- Desktop: HoverCard veya Popover ile `Tepki Ver` butonu altında göster.
- Mobile: Popover click ile açılır.
- Reaction count görünür kalmalı.
- Accessibility: keyboard ile açılmalı, aria-label olmalı.

Basit MVP alternatifi:

- Üç butonu daha küçük pill hâline getir.
- İkon + count öncelikli, label tooltipte.

Acceptance:

- Cadde sosyal medya / çarşı hissi verir.
- Excel/admin/manual hissi azalır.
- Bireysel kullanıcı ilan/paylaşım yapabileceğini anlar.
- Sağ rail canlı ve amaçlı görünür.
- Mobile layout bozulmaz.

---

## 14. Cadde Empty State ve Demo/Real Dili

Hedef dosyalar:

```txt
src/pages/cadde/CaddePage.tsx
src/lib/cadde-demo-data.ts
```

Mevcut empty state:

```txt
Bu filtrelerde gerçek Cadde içeriği yok. Demo moda geçerek örnek akış görebilirsin.
```

Daha iyi:

```txt
Bu şehirde henüz paylaşım yok. İlk paylaşımı sen yap veya ülke genelindeki akışı keşfet.
```

Eğer demo/örnek içerik toggle kalacaksa public kullanıcıya “demo” yerine “Örnek akış” de.

Acceptance:

- “Demo”, “seed”, “MVP” gibi geliştirici kelimeleri public UI’da azalır.
- Boş sonuç motivasyon kırmaz.

---

## 15. Radar — Mock Hissini Azalt

Hedef dosyalar:

```txt
src/pages/RadarPage.tsx
src/components/MarqueeItemCard.tsx
src/lib/marquee.ts
src/pages/admin/radar/routes.tsx
src/components/admin/radar/RadarCandidateCard.tsx
```

Mevcut yapı:

- `RadarPage` marquee items gösteriyor.
- `fallbackMarqueeItems` kısa ve biraz placeholder hissi veriyor.
- `MarqueeItemCard` summary alanı `line-clamp-3`.

Yapılacak:

### 15.1 Fallback metinlerini güçlendir

Fallback içerikler kısa mock gibi durmamalı.

Örnek yeni fallback summary:

```txt
CorteQS, yurt dışında yaşayan Türklerin şehir, meslek, topluluk ve ihtiyaç bazlı birbirini bulabilmesi için global bir bağlantı katmanı kuruyor. Radar alanı; haberleri, duyuruları ve öne çıkan topluluk sinyallerini tek yerde toplamak için hazırlanıyor.
```

Her fallback item:

- 2-3 cümlelik summary içersin.
- Ürün vizyonunu anlatsın ama “hazırlanıyor/mock” gibi zayıf durmasın.
- Gerçek haber gibi iddia ortaya atmasın.

### 15.2 Kart tasarımı

`MarqueeItemCard` içinde:

- Summary `line-clamp-3` çok kısa geliyorsa `line-clamp-4` veya `line-clamp-5` yap.
- Card height gerekirse 380’den 420’ye çıkar.
- Kartlar hâlâ eşit yükseklikte kalmalı.
- “Detay” linki varsa altta kalmalı.

### 15.3 Radar page copy

Başlık ve açıklama daha ürün gibi olsun:

```txt
CorteQS Radar
Türk diasporasından haberler, topluluk sinyalleri ve platform duyuruları.
```

Acceptance:

- Radar mock/hazırlanmamış gibi durmaz.
- Kartlar daha dolu ve güvenilir görünür.
- Gerçek olmayan istatistikler uydurulmaz.

---

## 16. Profil ve Public Profile Copy Audit

Hedef dosyalar:

```txt
src/pages/ProfilePage.tsx
src/components/profile/*
src/components/directory/public-profile/*
src/lib/profile-presentation.ts
src/lib/public-catalog-profile-view-model.ts
```

Yapılacak:

- Public kullanıcıya görünen Türkçe metinleri tara.
- Yazım hatalarını düzelt.
- İngilizce kalan public label varsa Türkçeleştir.
- “Directory”, “Featured”, “Claim”, “Owner”, “Experimental” gibi teknik kelimeleri public UI’da sadeleştir.
- Admin ekranlarında teknik kelime kalabilir; public ekranlarda kalmamalı.

Özellikle dikkat:

- “Düzenleme Yetkisi Talep Et” kalabilir ama daha sıcak olabilir:

```txt
Bu profili sahiplen
```

veya

```txt
Bu profili yönetmek istiyorum
```

Ama hukuki/iş akışı açısından mevcut ifade daha güvenliyse koru.

Acceptance:

- Profil metinlerinde bariz yazım hatası kalmaz.
- Public profile daha temiz ve güvenilir görünür.

---

## 17. Experimental Rolleri Public UI’dan Temizle

Hedef dosyalar:

```txt
supabase/migrations/20260612120000_add_experimental_roles.sql
src/lib/catalog-directory.ts
src/pages/ProfilePage.tsx
src/pages/admin/*
```

Mevcut migration experimental rolleri oluşturmuş olabilir:

```txt
Experimental_1
Experimental_2
```

Bunlar admin testleri için kalabilir ama public arama, public profil veya kullanıcıya görünen seçimlerde görünmemeli.

Yapılacak:

- Public directory role dropdown’dan kaldır.
- Search sonuçlarından kaldır.
- Public profile badge olarak görünüyorsa ya gizle ya da gerçek role label’a fallback yap.
- Admin panelde gerekiyorsa kalabilir.
- Migration ile `is_directory_visible=false` yap.

Acceptance:

- Public kullanıcı “Experimental” görmez.
- Admin test rolleri kırılmaz.

---

## 18. Shared Coming Soon / Feature Freeze Component

Hazır olmayan featurelar için tekrar eden düzgün bir UI oluştur.

Önerilen dosya:

```txt
src/components/FeatureComingSoon.tsx
```

veya

```txt
src/components/common/FeatureComingSoon.tsx
```

Özellikler:

- `title`
- `description`
- `badgeText = "Yakında"`
- `children` opsiyonel preview olarak gösterilebilir.
- Overlay modu desteklesin.
- Butonları disabled yapmak için açıklama sağlayabilsin.

Örnek kullanım:

```tsx
<FeatureComingSoon
  title="Relokasyon Motoru yakında"
  description="Taşınma planını, belge listesini ve şehir bazlı destek önerilerini tek yerde toplamak için hazırlanıyor."
  mode="overlay"
>
  <RelocationFormPreview />
</FeatureComingSoon>
```

Kullanılacak yerler:

- RelocationEngine
- WelcomePackOrderForm
- Gerekirse hazır olmayan CTA’lar

Acceptance:

- Feature freeze tasarımı tutarlı olur.
- Kullanıcı kırık buton değil roadmap hissi görür.

---

## 19. Test Planı

Değişiklik sonrası şu kontrolleri çalıştır:

```bash
npm run verify:text
npm run lint
npm run build
npm run test
```

Eğer Playwright altyapısı çalışıyorsa:

```bash
npm run test:e2e
```

En azından manuel/smoke kontrol listesi:

### Homepage

- `/` açılır.
- Hero düzgün görünür.
- “Diasporada Ara” çalışır.
- “Şehir Elçine Ulaş” tüm directory dökmez.
- “Taşınma Motoru” `/cadde`ye gitmez.
- “Hoşgeldin Paketi” raw hata vermez.

### Directory

- `/directory` girişsiz kullanıcıyı doğru şekilde login mesajı ile karşılar.
- Girişli kullanıcı filtreleri görür.
- Role dropdown’da admin/super admin/experimental yoktur.
- Ülke/şehir filtreleri çalışır.
- “Sonuçları Göster” butonu görünür.
- Boş sonuç mesajı anlaşılırdır.

### Cadde

- `/cadde` auth + feature gate davranışını korur.
- CaddeGeoFilter temizleme butonları çalışır.
- Composer daha sosyal görünür.
- İlan/Teklif tipi anlaşılırdır.
- Sağ rail daha canlıdır.
- Reaksiyonlar çalışır ve UI kalabalık değildir.

### Radar

- `/radar` açılır.
- Kart metinleri kısa mock gibi durmaz.
- Kart grid mobile/desktop bozulmaz.

### Profile

- Profil sayfalarında bariz yazım hatası yoktur.
- Public profile teknik/admin kelimeler göstermez.

---

## 20. Acceptance Criteria — Final Checklist

Görev bitti sayılması için:

- [ ] `npm run verify:text` geçiyor.
- [ ] `npm run lint` geçiyor veya mevcut legacy lint borcu varsa yeni hatalar açıklanıyor.
- [ ] `npm run build` geçiyor.
- [ ] Public searchte admin/super admin/yönetici görünmüyor.
- [ ] Experimental roller public UI’da görünmüyor.
- [ ] Şehir Elçisi quick search tüm directory’i dökmüyor.
- [ ] Directory filtrelerinde net “Sonuçları Göster” butonu var.
- [ ] Ülke/şehir filtrelerinde “Tüm şehirler” deneyimi net.
- [ ] ABD gibi büyük ülkelerde tek şehir hissi azaltıldı.
- [ ] CaddeGeoFilter undefined callback hatası yok.
- [ ] Taşınma Motoru `/cadde`ye yönlenmiyor.
- [ ] Relokasyon Motoru hazır değilse “Yakında” overlay ile donduruldu.
- [ ] Hoşgeldin Paketi raw hata vermiyor.
- [ ] Cadde composer “Paylaşım Oluştur” yerine sosyal CTA kullanıyor.
- [ ] Bireysel kullanıcı ilan/teklif paylaşımı açabileceğini net görüyor.
- [ ] Cadde sağ rail/billboard daha canlı ve amaçlı.
- [ ] Like/Destek/Fikir aksiyonları daha modern ve az kalabalık.
- [ ] Radar metinleri daha dolu.
- [ ] Hero copy düzeltildi.
- [ ] Profil/public profile metinleri denetlendi.
- [ ] Mobile görünüm bozulmadı.

---

## 21. Kodlama Kuralları

- Büyük rewrite yapma; hedefli refactor yap.
- Mevcut auth/feature gate davranışlarını bilinçsizce kaldırma.
- Supabase tablo ve RLS yapısını bozma.
- Yeni migrationlar idempotent olmalı.
- Demo/real ayrımını bozma; sadece public copy’de “demo” kelimesini daha iyi sun.
- Kullanıcıya teknik hata mesajı gösterme.
- Gizli env/secrets ekleme.
- Yeni dependency ekleme, gerçekten mecbur değilsen.
- TypeScript type safety koru.
- Accessibility: button, aria-label, keyboard access.
- Mobile-first düşün.

---

## 22. Önerilen Dosya Değişiklik Haritası

Muhtemel değişiklikler:

```txt
src/components/HeroSection.tsx
src/components/DiasporaSearchBar.tsx
src/pages/DirectoryPage.tsx
src/components/directory/DirectoryFilters.tsx
src/lib/catalog-directory.ts
src/components/SearchableCitySelect.tsx
src/components/cadde/CaddeGeoFilter.tsx
src/pages/cadde/CaddePage.tsx
src/lib/cadde-demo-data.ts
src/pages/RadarPage.tsx
src/components/MarqueeItemCard.tsx
src/lib/marquee.ts
src/pages/RelocationEngine.tsx
src/components/WelcomePackOrderForm.tsx
src/components/FeatureComingSoon.tsx              # yeni olabilir
src/lib/feature-freeze.ts                         # yeni olabilir
supabase/migrations/*hide_internal_roles*.sql      # yeni migration
```

Test eklenirse:

```txt
tests/e2e/mvp-polish.spec.ts
```

veya mevcut test düzenine uygun konum.

---

## 23. Final Output Format

İşi bitirince bana şu formatta rapor ver:

```md
# CorteQS MVP Polish Sonuç Raporu

## Yapılanlar
- ...

## Değişen Dosyalar
- `src/...` — kısa açıklama

## DB / Migration
- Migration adı
- Ne yaptığı

## Test Sonuçları
- `npm run verify:text`: geçti/kaldı
- `npm run lint`: geçti/kaldı
- `npm run build`: geçti/kaldı
- `npm run test`: geçti/kaldı

## Manuel Kontrol Notları
- Homepage
- Directory
- Cadde
- Radar
- Hoşgeldin Paketi
- Taşınma Motoru

## Bilinen Kalan Riskler
- ...

## Sonraki Öneriler
- ...
```

Eğer bir şeyi yapamadıysan açıkça yaz. Sessiz geçme.

---

## 24. En Kritik Ürün Hissi

Bu projede başarı şu demek:

- Kullanıcı “bu site bozuk” dememeli.
- Kullanıcı “bu Excel gibi” dememeli.
- Kullanıcı “admin paneli görüyorum” dememeli.
- Kullanıcı “burada bir Türk diaspora sosyal ağı kuruluyor” hissini almalı.
- Hazır olmayan featurelar bile güven vermeli.

CorteQS, Türk diasporası için global bir dijital çatı. MVP şu anda beta ama yüzü canlı, sıcak, renkli ve güvenilir olmalı.
