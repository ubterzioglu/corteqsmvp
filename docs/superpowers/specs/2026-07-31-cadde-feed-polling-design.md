# Cadde Feed "Yeni Post" Adaptif Polling — Tasarım

Tarih: 2026-07-31 · Durum: Onaylandı (yaklaşım seçimi: akıllı polling)

## Problem

CaddePage'de "yeni post" chip'i için sayım sorgusu sabit 60 sn'de bir atılıyordu —
sonuç ne olursa olsun, chip göründükten sonra bile. Sayfayı açık tutan her kullanıcı
saatte ~60 count sorgusu üretiyordu.

## Karar

Spec §17.3 korunur: stream yok, chip + tıklayınca invalidate. Alternatifler reddedildi:

- **Supabase Realtime** — §17.3 "stream yok" kararına ters; istemci başına kalıcı
  websocket bağlantısı + realtime publication kurulumu gerekir.
- **Sadece odakta kontrol** — sistem için en hafif, ama sekmeyi sürekli açık tutan
  kullanıcı chip'i hiç görmez.

Seçilen: **frontend-only adaptif polling** —

1. **Chip görünürken polling durur.** `count > 0` bilgisi ekrandayken tekrar sormak
   gereksiz. Kullanıcı chip'e tıklayınca feed invalidate olur, `newestLoadedAt`
   (queryKey) değişir, döngü sıfırdan başlar.
2. **Kademeli geri çekilme.** Ard arda 0 sonuçta aralık 60 sn → 2 dk (3 kontrolden
   sonra) → 5 dk (6 kontrolden sonra, tavan).
3. **Odak tazelemesi.** `refetchOnWindowFocus: "always"` ile pencereye dönüşte anında
   tek kontrol; focus event'i streak'i sıfırlayıp taban aralığa döndürür.
4. **Arka plan sekmesinde sorgu yok.** React Query v5 varsayılanı
   (`refetchIntervalInBackground: false`) korunur.

## Bileşenler

- `src/lib/cadde-feed-polling.ts` — saf aralık/streak fonksiyonları + sabitler (birim testli)
- `src/pages/cadde/CaddePage.tsx` — `useQuery` entegrasyonu (ref tabanlı streak)

## Etki

- Tipik boşta oturum: eski ~60 sorgu/saat → yeni ~12 sorgu/saat (kararlı durum);
  chip göründüğünde 0.
- Kullanıcı deneyimi değişmez: feed zıplamaz, chip aynı; sekmeye dönüşte kontrol
  anında yapıldığı için algılanan tazelik artar.
- DB tarafında değişiklik yok (HEAD count, indeksli filtreler, migration yok).
