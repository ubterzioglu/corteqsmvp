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

## ⚠️ Giriş noktası: master yol haritası

**Buradan başla:** [2026-09-21-KALANLAR.md](2026-09-21-KALANLAR.md) —
*Kalanlar — Tek Yol Haritası*, **11 faz / 95 minik adım** (48 kaba batch'ten bölündü).

Aşağıdaki altı dosya artık **ölçüm/gerekçe arşividir.** Sıra, durum ve öncelik
**yalnız master'da** yaşar; bir batch'e başlamadan önce ayrıntı için arşiv dosyasını
oku, ama neyin sırada olduğunu master'dan öğren.

Bunun sebebi ölçülerek bulundu: altı dosya arasında **sıra yoktu, bağımlılık yoktu ve
çakışan maddeler vardı** (kadro ledger satırı üç dosyada, edge function deploy'u iki
dosyada, `ragApi.ts` silme iki planda farklı zamanlarda). Bir oturum hangisinden
başlayacağını bilemiyor, daha kötüsü aynı işi iki kez yapabiliyordu.

⚠️ Arşiv dosyalarındaki bazı iddialar **çürüdü** (T3, T4, `tsc` 5 hata,
`verify:text`'in sebebi). Master'ın "Bugünkü durum" tablosu bunları tek tek
işaretler — **arşivdeki bir rakama göre iş açmadan önce oraya bak.**

Master'ın `C*` batch'lerinin kaynağı
[`docs/plans/2026-09-21-clean-code-repo-taramasi-plani.md`](../plans/2026-09-21-clean-code-repo-taramasi-plani.md)'dir.
O dosya `docs/plans/` altında kalır: bitmiş bir planın artığı değil, **yeni** bir
plandır; klasör kuralı gereği buraya taşınmaz.

## Açık dosyalar (arşiv — ölçüm ve gerekçe)

| Dosya | Konu | Bekleyen karar |
|---|---|---|
| [2026-09-21-dizin-veri-ve-kapsam-plani.md](2026-09-21-dizin-veri-ve-kapsam-plani.md) | Dizin verisi + arama kapsamı | 61 gerçek kişinin kaydı herkese açık yayına alınsın mı? · Blog araması ayrı yüzey mi dizin içinde mi? · 241 konsolosluk kaydı doğrulanıp yayınlansın mı? |
| [2026-09-21-relocation-kalan-kararlar.md](2026-09-21-relocation-kalan-kararlar.md) | Taşınma Planlayıcı içeriği | Üç demo sekmeyi ne besleyecek? · Maliyet rakamlarını kim tazeleyecek? · Belge listelerine feragat konsun mu? · Şehir kırılımı açılsın mı? |
| [2026-09-21-demo-icerik-ve-katalog-gorunurlugu.md](2026-09-21-demo-icerik-ve-katalog-gorunurlugu.md) | Demo/placeholder içeriğin görünürlüğü | Aramada dönen 69 placeholder kayıt elensin mi, işaretlensin mi, yayından mı kalksın? · `/businesses` ne zaman gerçek veriye geçer? |
| [2026-09-21-public-rotalar-kalan-isler.md](2026-09-21-public-rotalar-kalan-isler.md) | Public rotalar planının artıkları (PR1–PR5) | `AssociationDetail`'deki 18 hareketsiz düğmenin her biri bağlansın mı, kaldırılsın mı, "yakında" mı olsun? · Bekleyen etkinlikler yayına alınsın mı (sitemap'te `etkinlik: 0`)? |
| [2026-09-21-teslim-ve-altyapi-kalanlari.md](2026-09-21-teslim-ve-altyapi-kalanlari.md) | Repo ile canlının ayrışması | Kaynağı repoda olmayan 4 edge function repoya mı alınsın, canlıdan mı silinsin? · `whatsapp-reply`/`whatsapp-webhook` ne zaman deploy edilecek (22 gündür bekliyor)? |
| [2026-09-21-site-geneli-ai-bot-kalan-isler.md](2026-09-21-site-geneli-ai-bot-kalan-isler.md) | AI botun MVP dışında bıraktıkları (K1–K8) | `docs/` korpusu (436 dosya) bota verilsin mi — iç belgeler yalnız admine mi açılsın? · `/api/chat` proxy'si ne zaman sökülsün? · Bot ziyaretçiye açılsın mı? |

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
- `docs/plans/2026-09-20-site-geneli-ai-bot-plani.md` — 21.09'da **sadeleştirildi**
  (kullanıcı kararı: "botu minimum içerikle çıkaralım"). Çıkarılan her madde
  [2026-09-21-site-geneli-ai-bot-kalan-isler.md](2026-09-21-site-geneli-ai-bot-kalan-isler.md)
  içinde gerekçesiyle duruyor.

  ⚠️ **Bu dosya da yukarıdaki ayrımı tam karşılamıyor** — PR2/PR3 ile aynı durum.
  K1 (dokümanların bota açılması) gerçek bir **gizlilik kararı**dır, ama K2–K8'in
  çoğu saf **kod** işidir. Tek dosyada tutulması kullanıcı kararıdır (21.09);
  bölünürse K2–K8 `docs/plans/`'a gider.
- **Hiçbir plandan gelmeyen** tek dosya
  [2026-09-21-teslim-ve-altyapi-kalanlari.md](2026-09-21-teslim-ve-altyapi-kalanlari.md):
  repo ile canlı karşılaştırılarak (Management API + `check:migrations` + `git`)
  çıkarıldı. Bu maddeler bir planın artığı olmadığı için kimsenin işi değildi ve
  aylarca açık kaldılar — klasördeki yerleri bilinçlidir.
