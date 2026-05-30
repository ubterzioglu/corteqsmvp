# Cleanup Archive - 2026-05-30

## Kapsam

Bu arşiv, `Phase 0: Safe Cleanup and Documentation Organization` calismasi sirasinda dogrudan silinmeyen fakat aktif root agacinda kalmasi gerekmeyen dosyalari saklar.

## Neden Dogrudan Silinmedi

- Scriptler manuel operasyon baglamina ait olabilir.
- Geri alma ihtiyaci olursa dosyalar tek adimda eski konumuna tasinabilir.
- Bu cleanup pasinda amac agresif silme degil, izlenebilir duzenleme yapmaktir.

## Manifest Konumu

- `docs/cleanup/2026-05-30/MOVE_MANIFEST.md`

## Bu Passta Arsivlenenler

- `obsolete-scripts/check-existing.ts`
- `obsolete-scripts/truncate-and-import.ts`

## Geri Alma Yontemi

- Dosyayi eski konumuna tasiyin ve ilgili manifest satirini kontrol edin.
- Ardindan `npm run lint`, `npm run test`, `npm run build` ile dogrulayin.

## Manuel Kontrol Gerektiren Alanlar

- `import-resources.ts`
- `docu/info-*.html/**`
- `public/sharedx/maillogo.png`
- `public/placeholder.svg`
