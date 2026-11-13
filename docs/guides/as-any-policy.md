# `as any` politikası

`as any`, uygulama modeli olarak değil yalnız Supabase istemcisinin henüz üretilmemiş
tablo/RPC tipleri için dar adapter sınırında kullanılabilir.

İzinli konumlar: `src/lib/**/*-api.ts`, `src/lib/cadde-internal.ts` ve bu dosyalara
eşdeğer, veritabanı çağrısını uygulama kodundan ayıran adapter modülleri. Her kullanım,
eksik generated tip veya istemci sınırlamasını açıklayan yan satır yorumuna sahip olmalı.

Yasak konumlar: `src/pages/**`, `src/components/**` ve `src/hooks/**`. Bu katmanlar
yalnız tipli API/hook sonuçlarını tüketir; belirsiz veri `unknown` olarak alınır ve
daraltılır.

21 Eylül 2026 baseline’ı: kaynakta 14 `as any` metin eşleşmesi ölçüldü; bunların
çoğu gerekçe yorumu, yürütülebilir cast’ler ise yukarıdaki adapter sınırlarında.
Yeni otomatik sınır C11.2’de, göçü biten domain’lerden başlayarak eklenecek.
