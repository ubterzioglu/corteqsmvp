# Public Asset ve Gizlilik Envanteri

**Tarih:** 30 Ağustos 2026

## Public dağıtımdan çıkarılanlar

| Önceki yol | Boyut | Yeni arşiv yolu | Gerekçe |
|---|---:|---|---|
| `public/burak-stripe-rehberi.html` | 11 KB | `docs/archive/private/` | Kişiye özel dahili demo rehberi; public URL gereksiz |
| `public/videos/footer-community.mp4` | 47,04 MB | `docs/archive/assets/public-unused-2026-08-30/` | Üretim kodunda referans yok |
| `public/landing-assets/hero-people.mp4` | 10,73 MB | aynı arşiv | Üretim kodunda referans yok |
| `public/landing-assets/earth-night.webm` | 2,83 MB | aynı arşiv | Üretim kodunda referans yok |

Dosyalar silinmedi; git geçmişi ve arşivden geri alınabilir. `public/` dışında oldukları için Vite
`dist/` çıktısına ve nginx statik dağıtımına kopyalanmazlar.

## Tutulan büyük varlıklar ve kullanım kanıtı

| Public varlık | Boyut | Kanıt |
|---|---:|---|
| `landing-assets/hero-network.mp4` | 7,71 MB | `HeroNetworkSection.tsx` |
| `whatmaskot.mp4` | 5,31 MB | `CorteqsWhatIsAccordion.tsx` |
| `herovideo.mp4` | 3,40 MB | `HeroSection.tsx`, `LoginPage.tsx` |

Bu dosyaların optimizasyon/CDN kararı B6 yükleme deneyimi ölçümünün parçasıdır; mevcut kullanıcı
akışını görsel onay olmadan değiştirmemek için bu batch'te korunmuştur.

## Doğrulama kapısı

- `scripts/public-asset-boundary.test.mjs` public/arşiv sınırını ve tutulan varlıkların kod
  referansını kilitler.
- Build sonrasında `dist/burak-stripe-rehberi.html` ve arşivlenen videolar bulunmamalıdır.
- Nginx ve Node statik sunucuları dosya uzantılı eksik isteklerde SPA fallback yerine 404 döner.
- Canlı eski URL'nin 404 kontrolü ancak bu commit deploy edildikten sonra tamamlanmış sayılır.

