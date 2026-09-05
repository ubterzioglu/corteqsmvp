// `Json` sütunlarına tipli nesne yazarken kullanılan tek geçiş noktası.
//
// SORUN: `supabase/types.ts` üretilen bir dosyadır ve `jsonb` sütunlarını `Json` diye
// tipler (string | number | boolean | null | {…} | Json[]). Uygulama tarafında ise o
// sütuna DAR bir tip yazarız (ör. `ButceYearState`). TypeScript bu ikisini birbirine
// atayamaz: `Json`, `undefined` taşıyan alanlara ve indeks imzasına sahip; bizim
// arayüzlerimiz değil. Sonuç, aslında tamamen doğru olan yazma çağrılarında TS2322 /
// TS2352 hatalarıydı.
//
// NEDEN MERKEZİ BİR YARDIMCI: alternatif, her çağrı yerine ayrı bir `as unknown as Json`
// serpiştirmekti. O zaman "burada neden cast var" sorusunun cevabı beş ayrı yerde
// kaybolur ve cast'ler zamanla gerçek tip hatalarını da gizlemeye başlar. Tek fonksiyon
// hem greplenebilir hem gerekçesi burada yazılı.
//
// NE ZAMAN KULLANILMAZ: gelen veriyi OKURKEN. Bu yardımcı yalnız YAZMA yönü içindir.
// Okurken `data as SatirTipi` yapmak, doğrulanmamış veriyi tiplemek demektir; orada
// şema doğrulaması (zod) ya da açık bir dar tip kullan.

import type { Json } from "@/integrations/supabase/types";

/**
 * Tipli bir değeri `jsonb` sütununa yazılabilir hâle getirir.
 *
 * Çalışma zamanında HİÇBİR ŞEY yapmaz — yalnızca derleyiciye "bu nesne JSON olarak
 * serileştirilebilir" der. Bu yüzden yalnızca gerçekten JSON-güvenli değerlerle
 * çağrılmalıdır: `Date`, `Map`, `Set`, `undefined` alanlar ve fonksiyonlar sessizce
 * kaybolur ya da bozulur.
 */
export function toJson<T>(value: T): Json {
  return value as unknown as Json;
}

/**
 * `jsonb` sütunundan okunan değeri uygulama tipine daraltır.
 *
 * ⚠️ **Bu bir DOĞRULAMA DEĞİLDİR.** Yalnızca derleyiciyi susturur; sütunda bozuk ya da
 * eski şemalı bir nesne varsa burada yakalanmaz ve hata çok sonra, alanı kullanan
 * yerde patlar. Gerçek güvence gerekiyorsa ilgili zod şemasıyla `parse` et ve bu
 * yardımcıyı hiç kullanma.
 *
 * Ayrı bir fonksiyon olmasının sebebi `toJson` ile simetri değil, **greplenebilirlik**:
 * "hangi jsonb okumaları doğrulanmadan tipleniyor" sorusunun tek bir cevabı olsun.
 */
export function fromJson<T>(value: Json | null | undefined): T | null {
  if (value === null || value === undefined) return null;
  return value as unknown as T;
}
