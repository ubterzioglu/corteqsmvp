# CorteQS - AI Clean Code, Refactoring ve Debugging Talimatları

**Senin Rolün:** Sen kıdemli bir React (v18), TypeScript (v5), Supabase ve Clean Code mimarısın. 
**Görevin:** Ekteki/referans olarak verilen `PROJECT_OVERVIEW.md` dosyasındaki kısıtlamalara, mimari desenlere ve alan (domain) terminolojisine **%100 sadık kalarak** projede kapsamlı bir temizlik, refactoring ve dokümantasyon güncellemesi yapmaktır.

Aşağıdaki fazları sırasıyla ve her adımda bana detaylı bilgi/kod blokları vererek ilerletmelisin. Bir fazı bitirmeden diğerine geçme.

---

## 🚦 SIKIYÖNETİM KURALLARI (ASLA İHLAL EDİLEMEZ)

1. **İsimlendirme ve Dil:** `muhasebe`, `gelirler`, `giderler`, `cadde`, `lansman`, `oda` gibi Türkçe domain terimleri **ASLA** İngilizceye çevrilmeyecek. Kullanıcıya gösterilen metinlerde `toUpperCase/toLowerCase` kullanmak yasaktır; bunun yerine `trUpper/trLower` kullanılacaktır. DB verilerinden Türkçe karakterler silinmeyecektir.
2. **Mimari Kısıtlar:** Component (Bileşen) içinden `supabase.from()` çağırmak **KESİNLİKLE YASAKTIR**. Sadece `*-api.ts` modülleri ve React Query kullanılabilir. State yönetiminde `loading` yerine her zaman `isLoading` kullanılmalıdır.
3. **TypeScript:** Yeni kodlar `strict: true` standartlarında yazılacaktır. `as any` kullanımı (mevcut 3 istisna dışındaki yerlerde) ve `as TablesInsert<...>` / `as TablesUpdate<...>` gibi cast işlemleri yasaktır. Cast yerine daima `satisfies` kullanılmalıdır.
4. **Altyapı & Routing:** Bir yönlendirme (route) eklenir veya değiştirilirse `src/lib/redirects.ts`, `nginx.conf.template` ve `App.tsx` üçlüsü eşzamanlı olarak güncellenmelidir.
5. **Dokunulmaz Dosyalar:** `src/components/ui/*` (shadcn/ui), `src/integrations/supabase/types.ts` ve diğer `.generated.ts` dosyaları ile `supabase/migrations/` altındaki hiçbir sql dosyası (özellikle `archive` klasörü) elle değiştirilemez, silinemez veya sıralaması bozulamaz.

---

## 🛠️ FAZ 1: Karakterizasyon Testleri ve Dev Dosyaların Parçalanması

Önceliğimiz projedeki en büyük teknik borç olan `cadde` modülünü ayrıştırmaktır.

### Görev 1.1: `cadde-api.ts` (986 satır) Ayrıştırması
Bu dosyanın 25 importer'ı (bağımlılığı) var ancak testi yok.
1. **Önce Test:** Bana `cadde-api.test.ts` için mevcut fonksiyonların davranışını kilitleyecek (characterization test) Vitest ve Testing Library tabanlı test blokları yaz. Testleri yazmadan refactor işlemine başlama.
2. **Ayrıştırma Stratejisi:** Dosyayı `Muhasebe` modülündeki referans mimariye (bkz: `PROJECT_OVERVIEW.md` Madde 5.1) uygun olarak şu alt parçalara bölmek için kodları hazırla:
   - `cadde-feed-api.ts`
   - `cadde-cafe-api.ts`
   - `cadde-carsi-api.ts`
   - `cadde-promotion-api.ts`
   - `cadde-moderation-api.ts`
3. **Güncelleme Planı:** 25 importer'ın bu yeni dosyalara nasıl yönlendirileceğinin (import statement) haritasını çıkar.

### Görev 1.2: `CaddePage.tsx` (1716 satır) Refactoring'i
1. Sayfayı mantıksal container ve presentational (görsel) bileşenlere böl (Örn: `CaddeFeedView.tsx`, `CaddeCafeIntegration.tsx`, `CaddeCarsiIntegration.tsx`).
2. Bu yeni bileşenleri `src/components/cadde/` dizini altına yerleştirecek şekilde React (Functional Component) kodlarını oluştur.

---

## 🐛 FAZ 2: Anti-Pattern Temizliği ve Debugging

### Görev 2.1: Supabase Direct Call Temizliği
`src/components/auth/AuthProvider.tsx` dosyasının 14-20. satırları arasında kaldığı belirtilen 2 adet doğrudan `supabase.from()` çağrısını tespit et.
1. Bu çağrıları `src/lib/auth-api.ts` (veya uygun API modülü) içine taşı.
2. `AuthProvider` içinde bu verileri çekmek için TanStack React Query (`useQuery`) veya custom hook yapısını nasıl kuracağımı gösteren kodu yaz.

### Görev 2.2: TypeScript "as any" Cast Onarımı
Projede kalan 3 kritik `as any` kullanımını düzelt:
1. `src/lib/cadde-internal.ts`
2. `src/lib/relocation-api.ts`
3. `src/lib/relocation-tools-api.ts`
*Talimat:* Bu dosyalardaki query builder özyinelemesi kaynaklı type hatalarını, `as any` kullanmadan, Type Narrowing işlemleriyle veya projede var olan `supabase-json.ts` araçlarıyla çözecek type-safe kod bloklarını üret.

---

## 📝 FAZ 3: Kalite Kontrol ve Dokümantasyon

### Görev 3.1: Doğrulama Adımları (Verification)
Yaptığın değişikliklerin mevcut sistemi bozmadığını doğrulamak için benim terminalde sırasıyla hangi komutları çalıştırmam gerektiğini yaz. (Örn: `npm run verify:quality`, `npm run test` vs. - `PROJECT_OVERVIEW.md` Madde 13'ü baz al). Özellikle sözleşme testlerinin (redirects, seo, sitemap) bozulmadığından emin olmak için kontrol listesi ver.

### Görev 3.2: Mimari Dokümantasyon Güncellemesi
Yaptığın bu refactoring işlemleri sonucunda `docs/ARCHITECTURE.md` veya ilgili tasarım belgesine eklenecek kısa, net ve markdown formatında bir "Cadde Modülü Yeni Mimari Özeti" metni hazırla.

---

## 🎯 Çıktı Beklentim (Nasıl Yanıt Vermelisin)

Lütfen yanıtlarına **"FAZ 1 - Görev 1.1: Karakterizasyon Testleri"** başlığıyla doğrudan başla. Kod bloklarının başına mutlaka dosya yolunu ve adını (Örn: `// src/lib/cadde-feed-api.ts`) ekle. Açıklamalarını kısa, teknik ve doğrudan çözüme odaklı yap. Hazırsan başlayalım.