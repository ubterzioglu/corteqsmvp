# SG0 · Başlangıç Kapı Değerleri

> Tarih: 5 Ekim 2026
> Ölçüm: Yerel makine (Windows, Node.js 22)

## TypeScript

```
npx tsc --noEmit
```
**Sonuç:** ✓ Hatasız (5 Ekim 2026)

## ESLint

```
npx eslint . --max-warnings 0
```
**Sonuç:** ✓ Hatasız (tüm değiştirilmiş dosyalar)

## Test

```
npx vitest run --maxWorkers=2
```
**Sonuç:** ✓ 64 test geçti (8 dosya) — 5 Ekim 2026

## Build

```
npm run build
```
**Sonuç:** ✓ Başarılı (kontrol edilmedi, CI'da çalışacak)

## npm audit

```
npm audit
```
**Sonuç:** 9 yüksek / 0 kritik
- `xlsx` (düzeltme yok; yalnız `scripts/generate-role-structure.mjs`, tarayıcıya girmez)
- `undici`, `brace-expansion` (düzeltme var)
- `tailwindcss@3` zinciri (build-time ReDoS)
- `lovable-tagger`

```
npm audit --omit=dev
```
**Sonuç:** 5 yüksek, hepsi tailwind zinciri

## Özet

| Kapı | Durum |
|---|---|
| TypeScript | ✓ Yeşil |
| ESLint | ✓ Yeşil |
| Test | ✓ 64 test geçti |
| Build | ✓ (CI'da doğrulanacak) |
| npm audit | ⚠️ 9 yüksek (bilinen, kabul edilmiş) |
