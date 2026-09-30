# Bundle ve route yükleme raporu — 30 Ağustos 2026

## Kabul sonucu

- Kök `Suspense` artık boş ekran üretmiyor; erişilebilir `Sayfa yükleniyor…` durumu gösteriyor.
- Social Vault sayfa kodu ve dört statik içerik kaynağı ayrı chunk'lara bölündü.
- React, Supabase, Radix, grafik, form, Markdown ve diğer ağır bağımlılıklar ölçülebilir vendor chunk'larına ayrıldı.
- `npm run check:bundle`, build sonrasında tüm JavaScript chunk'larının 500 KB altında olduğunu zorunlu kılıyor.

## Ölçüm

| Chunk | Önce | Sonra |
|---|---:|---:|
| `main` | 1.095 KB | 319 KB |
| `AdminSocialShareVaultPage` | 1.018 KB | 32 KB |
| En büyük Social Vault veri chunk'ı | Sayfaya gömülü | 459 KB |
| Grafik vendor chunk'ı | 406 KB | 396 KB |

Son build'de 500 KB üzeri JavaScript chunk yoktur. Ölçümlü istisna tanımlanmamıştır.

## Doğrulama

```text
npx vitest run src/components/RouteLoadingFallback.test.tsx
npx tsc --noEmit
npm run build
npm run check:bundle
```
