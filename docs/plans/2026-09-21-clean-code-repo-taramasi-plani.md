# CorteQS Clean Code Repo Taraması ve Uygulama Planı

## Özet

Repo genel olarak sağlıklı; ESLint, uygulama TypeScript’i, worker typecheck’i, build ve bundle kontrolü geçiyor. Öncelikli sorunlar:

- ⛔ **KAPANDI (21.09) — bkz. [master](../kalanlar/2026-09-21-KALANLAR.md).** `verify:text`, `text-extract.mjs` içindeki meşru bir Latin-1 harfinde (U+00C4, HTML `&Auml;` karşılığı) false-positive üretiyordu. ⚠️ **O harf hiçbir dosyaya birebir alıntılanmaz** — alıntının kendisi denetime takılır ve alıntılayan dosyayı kırar; bu satırın ilk hâli tam olarak bunu yaptı.
- Vitest’te 1 suite, migration dosyasını eski kök dizinden okumaya çalıştığı için kırılıyor.
- `tsconfig.node.json` içinde `vite.config.ts` plugin tipi hatalı.
- `check-dead` erişilemeyen `src/lib/ragApi.ts` dosyasını bildiriyor.
- `cadde-api.ts` ve `CaddePage.tsx` hâlâ yüksek karmaşıklıkta.
- UI katmanında bazı doğrudan Supabase erişimleri ve sınırlı `as any` kullanımı mevcut.
- Migration envanterinde canlı kayıtla uyuşmayan bir sürüm ve iki bilinen zaman damgası çakışması var.

Mevcut kirli çalışma ağacındaki AI/site-assistant değişiklikleri ayrı baseline olarak ele alınacak; mevcut kullanıcı değişiklikleri ezilmeyecek.

## Faz 0 — Çalışma ağacı baseline’ını yeşile alma

1. ⛔ **ZATEN YAPILMIŞ (ölçüldü 21.09).** `scripts/ai-knowledge/text-extract.mjs` o değeri `String.fromCharCode(0xc4)` ile üretiyor (satır 31) ve `decodeHtmlEntities` davranış testi `text-extract.test.mjs:92-105`'te duruyor. Bu madde açık sanıldığı sürece ödenmiş borç yeniden ödenir.
2. `src/lib/catalog-directory.test.ts` içindeki migration yolunu canonical konuma, `supabase/migrations/applied/20260921090000_directory_search_anon_normalized.sql`, taşı.
3. `src/lib/ragApi.ts` için gerçek importer bulunmadığını doğrula; ardından dosyayı kaldır ve agent araç kataloglarını `ingest:tools:check` ile yeniden üret.
4. `20260920100000` migration kaydının canlı veritabanındaki durumunu ayrıca doğrula; kayıt eksikliği kod değişikliğiyle sessizce bastırılmayacak.
5. Bu faz sonunda çalışma ağacındaki AI değişiklikleri için aşağıdaki kontroller tamamen yeşil olmalı:

   - `npm run verify:text`
   - `npm test`
   - `npm run check:dead`
   - `npm run ingest:tools:check`

## Faz 1 — Kalite kapılarını kalıcılaştırma

- `package.json` içine `typecheck`, `typecheck:node`, `typecheck:workers` ve `verify:quality` komutlarını ekle.
- `vite.config.ts` içindeki özel Rollup plugin’ini `Plugin` tipiyle açıkça tanımla; `tsconfig.node.json` hataları sıfırlansın.
- Yeni bir `.github/workflows/quality.yml` kalite workflow’u ekle. Root ve worker typecheck, lint, unit test, build, bundle, dead-code, drift ve tool-catalog kontrollerini çalıştırsın.
- Playwright E2E testleri Supabase/env bağımlılığı nedeniyle varsayılan hızlı kalite kapısına eklenmesin; kritik akışlar ayrı manuel veya nightly job olarak çalıştırılsın.

Başarı ölçütü:

```text
verify:text       0
typecheck         0
typecheck:node    0
worker checks     0
lint              0
unit tests        0 failed
check:dead        0 new dead files
check:drift       clean
check:bundle      pass
build             pass
```

## Faz 2 — Katman sınırlarını güçlendirme

- Yeni UI kodunda doğrudan `supabase.from/rpc/storage` kullanımını yasakla.
- Mevcut erişimleri domain bazında taşı: relocation, profile/auth yardımcıları, messaging/service requests ve admin/cadde ekranları.
- Veri erişimi `src/lib/*-api.ts` veya domain hook’larında, UI ise yalnızca query/mutation sonucu ve görünüm durumuyla ilgilensin.
- AuthProvider içindeki oturum kurulumuna bağlı doğrudan sorgular geçici olarak izinli istisna olarak kalsın.
- `as any` yalnızca Supabase’in karmaşık query-builder sınırlarında, açıklanmış adapter dosyalarında kullanılabilsin. Yeni kodda `any` eklenmesin; mümkün olduğunda `unknown`, daraltma ve açık payload tipleri kullanılsın.
- Bu kuralı önce mevcut ihlalleri baseline ederek, göç tamamlanan domain’lerde ESLint sınırıyla zorunlu hâle getir.

## Faz 3 — Büyük modülleri test eşliğinde ayırma

İlk hedef Cadde modülüdür:

- `cadde-api.ts` için önce karakterizasyon testleri yaz: feed filtreleri ve cursor pagination, diaspora/country/city eşleşmesi, hata normalizasyonu, yorum/reaksiyon/paylaşım ve Cafe mutation sözleşmeleri.
- Mevcut export’ları bozmadan facade bırak; feed/location, post engagement, cafe, promotion/billboard ve search/interests sorumluluklarını ayrı modüllere çıkar.
- `CaddePage.tsx` içinden veri yükleme, feed state, composer, comment/reaction ve layout bloklarını ayrı hook/component’lere çıkar.
- Her bölme sonrasında mevcut importer’lar değişmeden kalmalı veya barrel üzerinden aynı API’yi kullanmalı.
- `zgen-data.ts`, generated Supabase types ve generated tool catalog elle refactor edilmeyecek.

Kural: 800+ satırlık üretim dosyası yalnızca dokunulduğunda ve önce davranış testi eklendiğinde bölünecek. Toptan dosya bölme kampanyası yapılmayacak.

## Faz 4 — Strict TypeScript ve test kapsamını kademeli artırma

- Mevcut uygulamada `strict: true` bir kerede açılmayacak.
- Yeni veya refactor edilen domain modülleri için strict pilot tsconfig kullanılacak.
- İlk strict pilotlar yeni site-assistant modülleri, Cadde’den ayrılan saf domain fonksiyonları ve yeni API adapter’ları olacak.
- Critical-flow Playwright kapsamı login/logout, public directory araması, profil görüntüleme, Cadde feed ve admin erişim kapısını kapsayacak.
- API modülleri için component testinden bağımsız saf fonksiyon testleri artırılacak.

## Dokümantasyon ve metrikler

- `CLAUDE.md`, `README.md`, `docs/ARCHITECTURE.md` ve `docs/AGENT_CONTEXT.md` içindeki değişken dosya/test/migration sayılarını tek bir ölçüm kaynağına bağla veya tarihli ölçüm olarak açıkça işaretle.
- Aktif dokümanlarda kök migration yolu yerine `supabase/migrations/applied` canonical yolu kullanılmalı; arşiv dokümanları değiştirilmeyecek.
- Her clean-code batch’i sonunda kırmızı kalite kapısı sayısı, yeni dead file sayısı, doğrudan UI Supabase erişimi, gerçek `any` kullanımı, 800+ satırlık üretim dosyası sayısı ve kritik akış test sayısı ölçülecek.

## Varsayımlar

- Çalışma ağacındaki mevcut değişiklikler korunacak ve ayrı baseline olarak stabilize edilecek.
- İlk öncelik kalite kapılarıdır; strict TypeScript ve geniş refactor ikinci dalgadır.
- Migration’lar silinmeyecek, yeniden adlandırılmayacak veya yeniden sıralanmayacak.
- Generated dosyalar kaynak generator üzerinden güncellenecek.
- İlk fazlarda dış Supabase RPC/API sözleşmelerinde davranış değişikliği yapılmayacak.
