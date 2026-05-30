# Cleanup Report

## 1. Yonetici Ozeti

Bu cleanup pasinda repo yeniden tasarlanmadi; dokumantasyon yapisi normalize edildi, root'taki daginik belgeler `docs/` altina tasindi, onceki cleanup raporlari `history` altina toplandi ve iki eski root scripti guvenli sekilde arşivlendi.

- Tasinan dokuman / bilgi dosyasi: `32`
- Arsivlenen script: `2`
- Kucuk source clean-code duzeltmesi: `0`
- Manuel inceleme listesine dusen aday: `8`
- Build: `OK`
- Verify release: `OK`
- Lint: mevcut hata birikimi suruyor
- Test: mevcut kirik senaryolar suruyor

## 2. Dokumantasyon Duzenleme Sonuclari

- Yeni klasorler olusturuldu: `architecture`, `modules`, `operations`, `guides`, `history`, `inbox-review`, `cleanup/2026-05-30`.
- Root'taki aktif modul belgeleri `docs/modules/**` altina tasindi.
- Tarihli notlar ve tamamlanmis planlar `docs/history/**` altina ayrildi.
- Onceki cleanup raporlari `docs/history/cleanup-reports/` altina normalize edildi.
- Root'ta bilerek birakilan dokumanlar: `README.md`, `cleancode.md`.
- `revizyon.pdf` guncelligi teyit edilemedigi icin `docs/inbox-review/` altina alindi.

## 3. Kod Temizligi Sonuclari

- Runtime source koduna davranis degisikligi getiren bir cleanup uygulanmadi.
- `src/` icinde acik debug `console.log` bulunmadi.
- Root'taki iki tek-amacli script temizlenerek arşive tasindi:
  - `check-existing.ts`
  - `truncate-and-import.ts`
- Kalan root script `import-resources.ts` belirsiz kullanim nedeniyle raporlanip yerinde birakildi.

## 4. Arsiv Sonuclari

- Yeni arşiv klasoru: `_archive/cleanup-2026-05-30/`
- Arşive alinan dosyalar:
  - `_archive/cleanup-2026-05-30/obsolete-scripts/check-existing.ts`
  - `_archive/cleanup-2026-05-30/obsolete-scripts/truncate-and-import.ts`
- Dosyalarin neden dogrudan silinmedigi: manuel operasyon/script baglamlari daha sonra geri cekilebilsin diye izlenebilir sekilde saklandi.

## 5. Riskler ve Dokunulmayan Alanlar

- `server.mjs`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`, `src/components/auth/AuthProvider.tsx`, `src/integrations/supabase/client.ts` degistirilmedi.
- `supabase/migrations/**` ve `src/components/ui/**` manuel duzenleme disinda tutuldu.
- `docu/info-*.html/**` ve `docu/reference/images/**` kullanim baglami net olmadigi icin oldugu yerde birakildi.
- `public/sharedx/maillogo.png`, `public/placeholder.svg`, `public/fav.png`, `src/assets/ataturk-marker.png` icin kesin kullanim karari verilmedi; tasinmadi.
- `ref/global-network-bridge/**` bu passta harici referans/agac kabul edilerek reorganizasyon kapsami disinda tutuldu.

## 6. Validation Sonuclari

- `npm run build`: gecti
- `npm run verify:release`: gecti
- `npm run lint`: baseline'daki mevcut hata birikimi nedeniyle basarisiz
- `npm run test`: baseline'daki mevcut test kiriklari nedeniyle basarisiz
- Yeni bir build/test/lint regresyonu tespit edilmedi

## 7. Sonraki Onerilen PR'lar

1. Failing test stabilization: `FooterSection`, `May19*`, `AdminHomePage`
2. `import-resources.ts` icin kanonik import script karari
3. `ref/global-network-bridge/**` icin repo-scope veya archive-scope karari
4. `docs/decisions/` altina auth/runtime/profile ADR cikarma
5. `src/App.tsx` route modulasyon plani
6. Supabase access strategy ve query-key standardi
7. `no-explicit-any` azaltma paketi
8. Legacy `docu/info-*.html/**` sahiplik ve yayin akisinin netlestirilmesi
