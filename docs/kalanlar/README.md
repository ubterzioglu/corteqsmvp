# Kalanlar

Tamamlanmış bir işten **geriye kalan** ve ayrı karar/çalışma gerektiren maddeler.

Bu klasör `docs/plans/` ile bilinçli olarak ayrıdır:

| `docs/plans/` | `docs/kalanlar/` |
|---|---|
| Yapılacak işin planı | Bir plan bitti, **artakalanı** burada |
| Genelde kod işi | Genelde **veri / ürün / gizlilik kararı** |
| Sahibi: uygulayan oturum | Sahibi: **karar veren kişi** |

Bir madde buraya girdiyse, ana plan "tamamlandı" sayılabilir demektir — kalan
iş kod eksikliği değil, **bekleyen bir karardır**. Karar verilip iş bitince
dosya buradan silinir (ya da ilgili plana geri taşınır), öylece durmaz.

## Açık dosyalar

| Dosya | Konu | Bekleyen karar |
|---|---|---|
| [2026-09-21-dizin-veri-ve-kapsam-plani.md](2026-09-21-dizin-veri-ve-kapsam-plani.md) | Dizin verisi + arama kapsamı | 61 gerçek kişinin kaydı herkese açık yayına alınsın mı? · Blog araması ayrı yüzey mi dizin içinde mi? · 241 konsolosluk kaydı doğrulanıp yayınlansın mı? |
| [2026-09-21-relocation-kalan-kararlar.md](2026-09-21-relocation-kalan-kararlar.md) | Taşınma Planlayıcı içeriği | Üç demo sekmeyi ne besleyecek? · Maliyet rakamlarını kim tazeleyecek? · Belge listelerine feragat konsun mu? · Şehir kırılımı açılsın mı? |
| [2026-09-21-demo-icerik-ve-katalog-gorunurlugu.md](2026-09-21-demo-icerik-ve-katalog-gorunurlugu.md) | Demo/placeholder içeriğin görünürlüğü | Aramada dönen 69 placeholder kayıt elensin mi, işaretlensin mi, yayından mı kalksın? · `/businesses` ne zaman gerçek veriye geçer? |
| [2026-09-21-public-rotalar-kalan-isler.md](2026-09-21-public-rotalar-kalan-isler.md) | Public rotalar planının artıkları (PR1–PR5) | `AssociationDetail`'deki 18 hareketsiz düğmenin her biri bağlansın mı, kaldırılsın mı, "yakında" mı olsun? · Bekleyen etkinlikler yayına alınsın mı (sitemap'te `etkinlik: 0`)? |

## Nereden geldi

- `docs/plans/2026-09-20-dizin-arama-plani.md` — Batch 0–3 canlıda (21.09),
  Batch 4–5 buraya taşındı.
- `docs/plans/2026-09-20-public-rotalar-sitemap-plani.md` — 4 batch tamamlandı
  (`df6236d`); artıkları **PR1–PR5** olarak
  [2026-09-21-public-rotalar-kalan-isler.md](2026-09-21-public-rotalar-kalan-isler.md)
  içinde, bu klasörde.

  ⚠️ **Bu dosya yukarıdaki ayrımı tam karşılamıyor ve bu bilinçlidir** (kullanıcı
  kararı, 21.09): PR1 ve PR4 gerçekten *karar* işidir, ama **PR2** (kırık bağlantı
  sözleşme testi) ve **PR3** (Playwright'ın bu makinede hiç koşmaması) saf **kod**
  işidir. Bölmek yerine tek dosyada tutuldu — beşi de aynı planın artığı ve
  birbirine referans veriyor. Bölmek istersen PR2+PR3 `docs/plans/`'a gider.
