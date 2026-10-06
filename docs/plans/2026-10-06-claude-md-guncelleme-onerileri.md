# CLAUDE.md güncelleme önerileri (6 Ekim 2026)

> **CLAUDE.md doğrudan düzenlenmedi** (yalnız onayla değişir). Bu liste, bugün **ölçülerek** doğrulanan
> bayat satırları ve yeni sözleşmeleri toplar. Onaylanırsa tek commit'te uygulanır.
> Tarihli ölçümler komutla yeniden doğrulanmalıdır; rakam yazmak yerine komut yazmak tercih edilir.

## A · Bayat / yanlış satırlar

| Bölüm | Şu an yazan | Ölçülen gerçek | Öneri |
|---|---|---|---|
| Key Metrics | "275 test · 306 dosya/2.361 test · 1.195 dosya …" (28.09 bloğu dahil) | 6 Ekim tam paket: **474 test dosyası / 4000 test** | Rakamları sil, `npm run test` komutunu yaz |
| `check:dead` | "0 bilinen borç" | **0 yeni · 3 bilinen borç** (`plans.ts`, `role-structure.ts`, `CaddeReactionActorsPopover.tsx`; silecek batch'leri `check-dead-code.mjs`'te adıyla yazılı) | Bilinen borç satırını güncelle |
| `as any` | "3 gerçek cast / 9 / 10 satır" | Üretimde gerçek `as any` **0**; **`as never` 135** (types.ts yeniden üretimi sonrası temizlenecek borç) | `as never` borcunu ekle |
| `providers.ts` ("AI bilgi tabanı" md.7) | "`site-assistant/providers.ts`, `relocation-assistant/providers.ts` ile AYNIDIR, kopya bilinçlidir" | `site-assistant/providers.ts` ve `_shared/providers.ts` **3 satırlık yeniden dışa aktarım**; gerçek kod `relocation-assistant/providers.ts` | Notu güncelle: kopya değil, yeniden dışa aktarım |
| T1 (Topluluk Motoru md.1) | "İlk etkinlik onaydan geçer … kural SQL'de olmalı" | **Karar değişti:** tüm üyelere otomatik yayın (limit 2, SQL'de `event_active_limit`). Nihai davranış: `…5900000` → `…6100000`. Ayrıntı: `2026-10-06-k11-migration-inceleme.md` | T1'i "karar: otomatik yayın; limit SQL'de" diye yeniden yaz. ⚠️ `status='published'` doğrudan INSERT'in RLS'te engellenip engellenmediği **canlıda doğrulanmadı** |
| Edge function sayısı | "repoda 12 · canlıda 12" | `docs/agent/tools.json`: **19 edge kaynağı** kataloglanıyor (`_shared` modülleri dahil değil, sayım kuralı farklı) | `npm run check:functions` çıktısına yönlendir, sayıyı sil |
| `tsc` | "0 hata" | 0 hata **(bugün 4 hataya çıkmıştı, 0'a indirildi)** | Doğru; "elle çalıştır" uyarısı kalsın |

## B · Bugün eklenen sözleşmeler (CLAUDE.md'ye girmeli)

1. **Kaynak-metin sözleşme testleri:** `route-seo-contract.test.ts` — auth dışı her genel rota `useSeo`/`applySeo`
   çağıran sayfaya çıkmalı; sitemap'teki her yol sayfasında kendi `canonicalPath`'iyle durmalı. Yeni genel rota
   eklerken SEO çağrısı yoksa test düşer. Bilinen 2 boşluk `KNOWN_GAPS`'te (`/ilanlar/:id`,
   `/directory/profile/:userId`) — kapanınca satır silinmek ZORUNDA (ratchet).
2. **nginx başlık kalıtımı:** `add_header` içeren HER location 8 güvenlik başlığını tam taşımalı
   (`redirects.test.ts`); `Content-Type`/charset için `add_header` DEĞİL `charset utf-8;` direktifi.
   Yalnız CSP satırını saymak yetmez (CSP'siz yeni location'ı kaçırır).
3. **Sitemap koruması:** yeni URL sayısı mevcut dosyanın %70'inin altına düşerse `generate-sitemap.mjs` yazmaz
   (Supabase env/ağ düşünce sessiz çöküşe karşı); `SITEMAP_ALLOW_SHRINK=1` ile bilinçli küçülme. Bilinmeyen
   `lastmod` için tarih UYDURULMAZ, alan atlanır.
4. **`public/ai/faq.json` elle düzenlenmez:** `npm run ai:faq` (`index.html` FAQPage'inden üretir),
   `npm run ai:faq:check` bayatlığı yakalar.
5. **Edge function tek-kaynak sözleşmeleri:** rate-limit → `_shared/rate-limit.ts`
   (atomik RPC; yerel select+update kopyası yasak, `rate-limit-contract.test.ts`);
   `jsonResponse` → `_shared/http.ts` (`http.test.ts`). Kendi anahtarı olan yerler için
   `enforceRateLimitForKey`.
6. **Vitest `supabase/functions` altını da koşar; `Deno.test` ile yazılan test dosyası SESSİZCE hiç çalışmaz**
   (vitest `https://deno.land` URL'ini yükleyemez; Deno bu makinede kurulu değil). SSRF yardımcısının testi bu
   yüzden aylarca çalışmadı ve "11 test, 5 mutasyon" iddiası doğrulanmamıştı. **Edge testleri vitest ile yazılır.**
7. **`safeFetch`'in `fetchImpl` dikişi yalnız test içindir ve `validateUrl`'i atlayamaz** (doğrulama her zaman
   önce; `safe-invite-fetch.test.ts` kilitler). Üretim çağrıları üçüncü argüman vermez.
8. **Outbox `event_type` CHECK'i yeniden yazılırken TÜM tipler korunmalı.** A15 migration'ı eski bir listeden
   yola çıkıp `weekly_city_digest`'i düşürdü. F13 aynası (`weekly-city-digest.test.ts`) artık constraint'i
   tanımlayan **en son** migration'ı okur (sabit dosya değil). Yeni event tipi = `knownEventTypes` +
   yeni migration'da tam liste.
9. **`src/lib/**` ya da `supabase/functions/**` altına yeni dosya ekleyen HER değişiklik `npm run ingest:tools`
   gerektirir** (ne lint ne test yakalar, yalnız `ingest:tools:check`). Bugün üç kez bayatladı.
10. **Bileşen/sayfa katmanında doğrudan tablo sorgusu kalmadı** (`rg -U 'supabase\s*\n?\s*\.(from|rpc)\('`
    ve `db.from(` sayfa/bileşende 0). Yeni sayfa: `*-api.ts` + React Query. Okunamayan admin listesi
    **boş liste döndürmez, fırlatır** (aksi halde "ilan yok" gibi görünür).
11. **Mutasyon turunda dosyayı `git checkout --` ile geri alma:** commit'siz düzeltme de silinir (bugün yaşandı).
    Önce yedek al, yedekten geri yükle, `cmp` ile doğrula.

## C · Düzeltilen sessiz kusurlar (öğretici)

- `safeHref("   ")` hedefsiz `https://` üretiyordu (boş kontrol trim'den önceydi).
- `readBooleanAttributeValue`'a yanlış argüman (`valueJson`, ikinci `false`) "CV'mi Premium üyeler görebilsin"
  anahtarını kayıtlı değerden bağımsız hep KAPALI çizdi; yakalayan `tsc` hatasıydı (tsc'nin kırmızı kalması bu
  yüzden bir ayrıntı değil, kapıdır).
- GV1, `readInvitePage`'in enjekte edilebilir `fetch` parametresini yok saymıştı → 6 test gerçek ağa düşüp kırmızıydı.
- Rehber taslakları (`docs/guides/`) kaynakta olmayan arayüz öğeleri ve yanlış sınırlar içeriyordu; bot bilgi
  tabanına girmeden yakalandı. **Rehber = koda karşı doğrulanmış metin** (etiketler `rg` ile aranır).
