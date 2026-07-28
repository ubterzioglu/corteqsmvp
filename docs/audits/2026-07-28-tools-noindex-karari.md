# /tools/:slug sayfaları neden "noindex" — kök neden ve karar kaydı

**Tarih:** 2026-07-28
**Durum:** Karar verildi — mevcut davranış korunuyor, kod değişikliği yok
**İlgili:** `scripts/generate-sitemap.mjs`, `src/App.tsx`, `src/components/auth/RequireAuth.tsx`,
`src/pages/LoginPage.tsx`, `docs/10tool/00-ortak-mimari-ve-agent-talimatlari.md`

---

## 1. Bulgu

Google Search Console, **25.07.2026**'dan itibaren 16 URL'yi
**"Durch 'noindex'-Tag ausgeschlossen"** (noindex etiketiyle hariç tutuldu) kategorisinde
raporluyor. Hepsi taşınma araçları alt sayfası:

```
/tools/expat-yasam-tarzi-persona      /tools/sehir-eslestirme
/tools/vatandaslik-testi-almanya      /tools/is-bulma-olasiligi
/tools/para-transferi-almanya         /tools/ilk-90-gun-planlayici
/tools/stepstone-karsilastirma-almanya /tools/meslek-maas-karsilastirma
/tools/yurtdisi-kariyer-yolu          /tools/sigorta-secim-almanya
/tools/diaspora-ag-eslestirme         /tools/tasinma-hazirlik-skoru
/tools/oncelikli-tasinma-sorunu       /tools/vize-secim-almanya
/tools/ulke-secimi                    /tools/maas-hesaplama-almanya
```

Bu 16 URL, `/tools` hub'ında listelenen 17 aracın 16'sı. Listede olmayan tek slug
`banka-secimi-almanya` — o da yalnızca henüz taranmamış durumda.
Yani **tekil bir sayfa hatası değil; istisnasız tüm araç alt sayfaları aynı durumda.**

## 2. Kök neden (doğrulandı)

Dört adımlı zincir:

1. **Rota korumalı** — `src/App.tsx:168-175`
   `/tools/:toolSlug` (ve `/session/:sessionId`, `/result/:resultId` varyantları)
   `<RequireAuth>` ile sarılı.

2. **Anonim ziyaretçi login'e yönlendirilir** — `src/components/auth/RequireAuth.tsx:13-19`
   ```tsx
   const next = `${location.pathname}${location.search}`;
   return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
   ```
   Bu bir HTTP redirect değil, **client-side** yönlendirmedir.

3. **Login sayfası noindex basar** — `src/pages/LoginPage.tsx:46-59`
   ```ts
   metaRobots.setAttribute("content", "noindex, nofollow");
   ```
   Login ekranının noindex olması doğru ve istenen davranıştır.

4. **Prerender bu DOM'u araç URL'inde dondurur** — `server.mjs`
   Prerender proxy'si yalnızca `/api` ve `/admin` yollarını hariç tutuyor. `/tools/<slug>` isteği
   HTTP **200** + login DOM'u (dolayısıyla `noindex, nofollow`) ile yanıtlanıyor.
   Googlebot araç URL'inde noindex görüyor.

## 3. Canlı doğrulama (2026-07-28)

| Kontrol | Sonuç |
|---|---|
| `/tools` | ✅ "Taşınma Araçları \| CorteQS" — 17 aracı listeliyor, indekslenebilir |
| `/tools/sehir-eslestirme` | ⛔ "Giriş \| CorteQS" (login DOM'u) |
| `/tools/ulke-secimi` | ⛔ "Giriş \| CorteQS" (login DOM'u) |
| `robots.txt` | ✅ Temiz — yalnızca `/admin` disallow, sitemap bildirilmiş |
| `sitemap.xml` | ✅ 143 URL; `/tools` var, `/tools/<slug>` **yok** (bilinçli) |

## 4. Karar

**Araç alt sayfaları üyeye özel kalır. Giriş duvarı mevcut yerinde (araç girişinde) kalır.
`noindex` kasıtlıdır ve kabul edilmiştir.**

Gerekçe:

- Araçlar üyelik/lead-gen değeri taşıyor; anonim erişim MVP kararı olarak bilinçli şekilde
  kapatılmıştı (bkz. `docs/10tool/00-ortak-mimari-ve-agent-talimatlari.md` §"Önerilen route yapısı").
- Skorlama motoru zaten auth zorunlu kılıyor:
  `rl_tool_require_user()` —
  `supabase/migrations/applied/20260626121000_relocation_tools_scoring_rpcs.sql`.
- Arama görünürlüğü `/tools` hub'ı üzerinden sağlanıyor: hub indeksli, anon'a açık
  (`20260714100000_relocation_tools_hub_anon_read.sql`) ve 17 aracın başlık + özetini gösteriyor.

### Değerlendirilip reddedilen alternatifler

| Alternatif | Neden reddedildi |
|---|---|
| Tüm araçları herkese açmak | `relocation_tool_questions` için anon read migration'ı gerekir; üyelik değeri kaybı |
| Sadece 5 Almanya hesaplayıcısını açmak | Migration gerektirmez (tamamen client-side, `src/lib/germany-standalone-tools.ts`) — **ileride en düşük maliyetli SEO fırsatı olarak masada kalıyor**, ama şimdi kapsam dışı |
| Yalnızca landing'i açmak (soru havuzu kapalı) | İnce içerik → "Crawled – currently not indexed" riski; SEO kazancı sınırlı |

## 5. GSC talimatı

> **"Fehlerbehebung fertig?" / "Doğrulamayı başlat" düğmesine BASMAYIN.**

Bu düğme Google'dan sayfaları yeniden tarayıp `noindex`'in **kalkmış** olmasını doğrulamasını ister.
Sayfalar bilinçli olarak noindex kaldığı için doğrulama **başarısız olur** ve rapor geri döner.

- Bu bir hata değil, **bilgi amaçlı (informational) hariç tutma**dır.
- Rapor **kalıcı olarak kaybolmayacak**: `/tools` hub'ı bu URL'lere link verdiği için Google
  onları taramaya devam edecek ve her taramada aynı kategoride raporlayacak. Beklenen durumdur.
- **robots.txt ile engellemeyin.** `Disallow: /tools/` eklemek Google'ın `noindex` etiketini
  görmesini engeller ve URL'lerin dış linklerden yine de indekslenmesine yol açabilir —
  mevcut durumdan daha kötü bir sonuç.

## 6. Bilinen kırılganlıklar (bugün zarar vermiyor, ileriye not)

1. **noindex zamanlamaya bağımlı.** Araç URL'lerindeki `noindex`, `LoginPage`'in `useEffect`'inin
   prerender snapshot'ından önce çalışmasına bağlı. Prerender zamanlaması değişirse 16 URL,
   login sayfası içeriğiyle indekslenebilir hâle gelebilir. Kalıcı çözüm: `noindex`'i `RequireAuth`
   içinde (veya `useSeo`'nun `robots` alanıyla) doğrudan basmak.
2. **Yanıltıcı canonical.** `RelocationToolPage` hiç mount olmadığı için `useSeo` çalışmıyor;
   snapshot'ta `index.html:13` varsayılanı kalıyor → 16 URL'nin canonical'ı ana sayfayı gösteriyor.
   Sayfalar noindex olduğu için pratik etkisi yok.

## 7. Önceki ilgili kayıtlar

- `scripts/generate-sitemap.mjs` (satır ~309) — 2026-07-14 denetiminde slug'lar sitemap'ten
  çıkarıldı; gerekçe aynı.
- `supabase/migrations/applied/20260714100000_relocation_tools_hub_anon_read.sql` — hub anon'a
  açılırken alt sayfaların korumalı kaldığı not edilmiş.

Eksik olan tek şey bu davranışın **GSC raporuyla ilişkisiydi**; bu doküman onu kapatır.
