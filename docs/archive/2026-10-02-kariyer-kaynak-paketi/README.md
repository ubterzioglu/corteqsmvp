# Kariyer sayfası kaynak paketi (ekipten gelen, 28 Eylül 2026)

> **Arşivdir — buradan geliştirme yapılmaz.** Canlı kaynak repoda:
> ilan verisi [`src/lib/careers/careers-data.ts`](../../../src/lib/careers/careers-data.ts),
> sayfa metinleri [`src/components/career/career-content.ts`](../../../src/components/career/career-content.ts),
> sayfa [`src/pages/Career.tsx`](../../../src/pages/Career.tsx).

Bu klasör depo **kökünde** duruyordu (`EKİP WEB SAYFASI 28 EYLÜL VERS.-…` klasörü +
aynı içerikli zip). Kökte yalnız `CLAUDE.md` ve `README.md` kalır kuralı gereği
KR10'da buraya taşındı; zip birebir aynı üç dosyayı taşıdığı için (ölçüldü:
246.320 + 2.319 + 3.611 bayt) ayrıca saklanmadı.

## Dosyalar

| Dosya | Ne oldu |
|---|---|
| `kariyer.html` | 582 satır tek dosya. `AREAS`/`JOBS`/`INTERN` sabitleri (satır 404–406) **makineyle** çıkarılıp `src/lib/careers/careers-data.ts`'e taşındı (KR01); anlatı metinleri `career-content.ts`'e (KR04). Gömülü base64 kurucu fotoğrafları `public/career/` altına **gerçek dosya** olarak yazıldı. |
| `kariyer_supabase_setup.sql` | **Olduğu gibi çalıştırılamazdı.** Düzeltilmiş hâli migration `20261001130000_career_applications.sql`. |
| `kariyer_BENIOKU.md` | Kurulum önerisi (`public/kariyer.html` koy) **canlıda çalışmazdı** — dosya jsdelivr'dan script yüklüyor, CSP `script-src` listesinde jsdelivr yok; ayrıca `/kariyer` zaten bir SPA rotası. |

## ⚠️ Gelen paketin üç hatası (düzeltilmeden kullanılamazdı)

1. **`public.has_role(auth.uid(),'admin')` çağırıyordu — bu projede o fonksiyon YOK.**
   Doğrusu `public.is_admin(uid uuid)` ve **argüman alır**. Olduğu gibi
   çalıştırılsaydı `function has_role does not exist` ile düşerdi.
2. **Anon'a doğrudan tabloya INSERT veriyordu**, hız sınırı yoktu →
   security-definer RPC arkasına alındı.
3. **Kovaya yüklenen dosya adını hiç denetlemiyordu** → anahtar deseni zorunlu
   kılındı (`<uuid>/<cv|cover-letter|presentation>-<ad>`).

Ayrıca `application/octet-stream` MIME listesinden çıkarıldı: her şeyi kabul eden
bir değerdir ve kovanın tür sınırını fiilen kaldırıyordu.

Tam gerekçe: [`docs/plans/2026-09-30-kariyer-sayfasi-yenileme-plani.md`](../../plans/2026-09-30-kariyer-sayfasi-yenileme-plani.md).
