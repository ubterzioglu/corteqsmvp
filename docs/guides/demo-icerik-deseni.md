# DEMO içerik deseni

**Karar tarihi:** 2026-09-20 · **Tek kaynak:** `src/lib/demo-pages.ts`

## Sorun

Bazı sayfalar canlıda yayında ama içeriği gerçek değil — örnek ödüller, örnek
takvim, örnek başvuru akışı. Ziyaretçi bunu anlamazsa **gerçek bir yarışmaya
başvurduğunu sanar**. İlk iki örnek: `/campaign/vlogger` ve `/campaign/blogger`.

Bu sınıfın her seferinde elle çözülmesi (bir sayfaya uyarı yazmak, ötekini
unutmak) kaçınılmaz olarak ayrışma üretir. Desen bu yüzden yazıldı.

## Desen — iki görünür işaret, tek kaynak

Her ikisi de `src/lib/demo-pages.ts` içindeki `DEMO_ROUTES` listesinden beslenir.

| İşaret | Bileşen | Nerede görünür |
|---|---|---|
| **Rozet** | `src/components/common/DemoBadge.tsx` | Demo sayfaya **götüren** düğme / kartın sağ üst köşesinde minik `DEMO` etiketi |
| **Bant** | `src/components/common/DemoBanner.tsx` | Demo sayfaya **girince**, açık beta bandının hemen altında |

## Yeni bir demo sayfası nasıl eklenir

`src/lib/demo-pages.ts` içindeki `DEMO_ROUTES` dizisine **bir satır**:

```ts
{
  path: "/campaign/yeni-yarisma",   // App.tsx'teki path ile BİREBİR aynı
  label: "Yeni Yarışma",            // bantta görünen ad
  note: "Ödüller ve takvim örnektir; yarışma henüz başlamadı.",
}
```

Bu kadar. Bant `SiteHeader` tarafından **rotadan türetilir** — demo sayfanın
kendisine hiçbir kod eklenmez. Hub kartları da `isDemoRoute(c.to)` ile kendi
rozetlerini otomatik alır (`CampaignHubPage.tsx`).

Ana sayfa düğmesine rozet gerekiyorsa katalogda tek alan:
`src/components/home-trial/action-buttons-data.ts` → ilgili girdiye `demo: true`.

## Bir sayfa gerçek içeriğe kavuşunca

`DEMO_ROUTES`'tan satırı **sil**. Rozet ve bant aynı anda kaybolur. Düğme
kataloğundaki `demo: true` alanını da kaldır — `demo-pages.test.ts` ikisinin
ayrışmasını yakalar.

## Kurallar (bozma)

1. **Bant kapatılamaz.** Beta bandı kapatılabilir çünkü tüm siteye dair genel
   bir duyurudur. Demo bandı *bu sayfadaki içeriğin gerçek olmadığını* söyler;
   kapatılabilseydi ziyaretçi örnek ödülleri gerçek sanabilirdi.
2. **Bandın rengi beta bandından farklı** (arduvaz ↔ kehribar). İkisi üst üste
   geldiğinde tek bir blok gibi görünmemeli.
3. **Rozet `aria-hidden` değildir.** Süs değil bilgi taşır; ekran okuyucu
   düğmenin adından sonra "DEMO" demeli.
4. **Rozet ile bandı elle eşleştirme.** İkisi de `DEMO_ROUTES` okur. Elle
   yazılan bir uyarı, liste değiştiğinde sessizce yanlış kalır.
5. **`path` App.tsx ile birebir aynı olmalı.** Aksi halde bant hiç çizilmez ve
   hata hiçbir yerde görünmez — `demo-pages.test.ts` tam bunu kilitler.

## Test

`src/lib/demo-pages.test.ts` (8 test): rotaların App.tsx'te var olduğunu, yolun
tekrarlanmadığını, sorgu/eğik çizgi normalizasyonunu, "Yarışmalar" düğmesinin
`demo: true` kaldığını ve bandın SiteHeader'da rotadan türetildiğini doğrular.
Sözleşme testidir — gevşetme, dosyayı düzelt.
