// Cadde tazelik pencereleri (B4 — "staleTime bütünlüğü").
//
// SORUN: `src/App.tsx` içindeki `new QueryClient()` çağrısının `defaultOptions`'ı YOK,
// yani React Query v5 varsayılanları geçerli: `staleTime: 0` + `refetchOnWindowFocus:
// true`. staleTime'ı olmayan her sorgu HER sekme odağında yeniden çekilir. Cadde'de
// bir sayfada 10+ sorgu var; tek bir alt+tab bunların hepsini tetikliyordu.
//
// NEDEN GLOBAL DEFAULT DEĞİL: `queryClient` 209 sayfa tarafından paylaşılıyor. Global
// bir `staleTime` vermek, Cadde dışındaki her ekranın tazeleme davranışını sessizce
// değiştirir — kapsam dışı ve gözle doğrulanamayan bir risk. Bunun yerine Cadde'nin
// her sorgusu kendi penceresini AÇIKÇA taşır.
//
// SÖZLEŞME (`cadde-query-cache.test.ts`): Cadde yüzeylerindeki her `useQuery` /
// `useInfiniteQuery` ya `staleTime` (açıkça önbelleklenmiş) ya da `refetchInterval`
// (açıkça canlı) taşımalıdır. İkisi de yoksa sorgu "kazara canlı" demektir ve bu
// hâl sessizce maliyet üretir. Yeni bir Cadde sorgusu eklerken birini seç.
//
// Realtime ile beslenen sorgular (bildirim zili) staleTime ALABİLİR: realtime
// `invalidateQueries` çağırır, invalidation staleTime'ı zaten ezer. staleTime orada
// yalnız gereksiz odak-yenilemesini keser, canlılığı bozmaz.

/** Ülke/şehir/ilgi/tema katalogları — pratikte sabit referans verisi. */
export const CADDE_REFERENCE_STALE_MS = 60 * 60_000;

/** Liste ve arama sonuçları (kafe, kişi, bildirim) — dakikalar ölçeğinde değişir. */
export const CADDE_LIST_STALE_MS = 60_000;

/** Yönetici küratörlü tanıtım yüzeyleri (billboard, sponsor, kampanya, çarşı). */
export const CADDE_PROMO_STALE_MS = 5 * 60_000;
