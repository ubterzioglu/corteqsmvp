// Daraltılmış Cadde akışı boş kaldığında bir üst kapsamı hesaplar (B1/B2, m157-m158).
//
// NEDEN GEREKLİ — ölçüldü 09.09.2026, canlı DB:
// 58 Cadde şehrinin yalnız 10'unda paylaşım var (21 yayınlanmış public gönderi).
// Yani elle şehir seçen üyenin %83 ihtimalle karşısına boş akış çıkıyor ve bugün
// ona söylenen tek şey "ilk paylaşımı sen yapabilirsin" oluyor. Kullanıcı ilk
// paylaşımı yapmaz; dolu bir alternatif gösterilmelidir.
//
// ⚠️ BU MODÜL YALNIZ DARALTILMIŞ AKIŞ İÇİNDİR.
// Filtresiz `/cadde` (scope="all", geo seçimi yok) için yapılacak bir iş YOKTUR:
// global eşik kapısı canlıda 0/0/0 + enabled=true (teyit edildi 09.09.2026), yani
// `p.reaction_count >= 0` her satırda doğru ve akış ancak tüm diasporada hiç
// paylaşım yoksa boş döner. O durumda `widenCaddeFilters` null döner ve çağıran
// taraf HİÇ ek sorgu açmamalıdır.
//
// ⚠️ DARALTMA İKİ BAĞIMSIZ MEKANİZMADIR (plan yalnız birincisini anlatıyordu):
//   1. Geo filtresi (`?city=` / `?country=`) — SQL'de sert AND
//      (20260805120000_cadde_viewer_geo_bridge.sql:241-245).
//   2. Kapsam çipi (`?akis=city|country`) — ayrı ve sert bir filtre (a.g.e. 220-233).
//      İzleyicinin şehri Cadde kataloğunda çözülemiyorsa (`v_viewer_city_id is null`)
//      ifade HER satırda false döner: içerik olsa bile akış GARANTİ boş kalır.
// İkisi de bu merdivenin girdisidir.

import type { CaddeCity, CaddeCountry, CaddeFilterState } from "./cadde-types";

/** Bir üst kapsam için hesaplanan hedef; null değilse "genişletilecek yer var" demektir. */
export type CaddeWidenTarget = {
  /** Genişletilmiş filtre durumu — URL'e ancak KULLANICI tıklayınca yazılır. */
  next: CaddeFilterState;
  /** Hangi daraltma gevşetildi. */
  kind: "scope" | "city" | "country";
  /** Kullanıcıya söylenecek hedef adı: "Almanya" | "tüm akış". */
  label: string;
};

const GLOBAL_LABEL = "tüm akış";

/**
 * Daraltılmış akış boşken denenecek BİR ÜST kapsamı döndürür; genişletilecek bir şey
 * yoksa null.
 *
 * Tek seferde YALNIZ BİR adım gevşetir. Maliyet tavanı bilinçlidir: en fazla 1 ek RPC.
 * İkinci adım ancak kullanıcı tıkladıktan ve akış yine boş kaldıktan sonra devreye girer.
 * SQL'in sıralama bantları (aynı şehir → aynı ülke → etkileşim) "genişledik ama
 * alakasızlaştık" etkisini zaten önlüyor.
 */
export function widenCaddeFilters(
  filters: CaddeFilterState,
  cities: CaddeCity[],
  countries: CaddeCountry[],
): CaddeWidenTarget | null {
  // Demo akışta bu iş yok — boş durum kartı zaten yalnız mode==="real" iken çiziliyor.
  if (filters.mode !== "real") return null;

  // 1) Kapsam çipi en sert daraltmadır: tek hopta "all"a düşülür.
  //    ARA "country" ADIMI BİLİNÇLİ OLARAK YOK. `v_viewer_city_id` çözülemeyen üyede
  //    `v_viewer_country_id` de büyük olasılıkla çözülemez (CLAUDE.md ölçümü: 126
  //    profilde 20 şehir + 17 ülke karşılıksız, ağır örtüşme) — ara adım ölü bir
  //    yoklama harcardı.
  if (filters.scope === "city" || filters.scope === "country") {
    return {
      next: { ...filters, scope: "all" },
      kind: "scope",
      label: GLOBAL_LABEL,
    };
  }

  // Diğer kapsamlar (cafes/events/…) başka şeylerdir; boş cafe akışının kendi paneli var.
  if (filters.scope !== "all") return null;

  // 2) Şehir seçimi → şehri bırak, ülkeye çık.
  if (filters.cities.length > 0) {
    const countryName = resolveCountryName(filters, cities, countries);
    return {
      next: {
        ...filters,
        cities: [],
        countries: countryName ? [countryName] : [],
      },
      kind: "city",
      label: countryName ?? GLOBAL_LABEL,
    };
  }

  // 3) Ülke seçimi → global.
  if (filters.countries.length > 0) {
    return {
      next: { ...filters, countries: [] },
      kind: "country",
      label: GLOBAL_LABEL,
    };
  }

  // Daraltan bir şey yok → genişletilecek bir şey de yok.
  return null;
}

/**
 * Şehirden ülkeye çıkarken kullanılacak ülke ADINI çözer.
 *
 * ⚠️ KAYNAK YALNIZ `cadde_countries` OLMALI (listCaddeCountries). SQL ülke adlarını
 * FOLD ETMEDEN birebir eşitlikle çözüyor:
 *   `where c.is_active = true and c.name = any(v_filter_countries)`
 *   (20260805120000_cadde_viewer_geo_bridge.sql:168-176)
 * Ad `geo_countries`ten, profil metninden veya post içeriğinden türetilirse eşleşmez,
 * dizi boş kalır, filtre SESSİZCE hiç uygulanmaz ve kullanıcı "Almanya akışı" yazısına
 * tıklayıp GLOBAL akış görür. Çözülemezse ad UYDURULMAZ — global'e düşülür.
 */
function resolveCountryName(
  filters: CaddeFilterState,
  cities: CaddeCity[],
  countries: CaddeCountry[],
): string | null {
  // Kullanıcı ülkeyi zaten seçmişse o ad korunur (katalogdan geldiği garanti).
  if (filters.countries.length > 0) return filters.countries[0];

  const cityName = filters.cities[0];
  if (!cityName) return null;

  const city = cities.find((entry) => entry.name === cityName);
  if (!city) return null;

  return countries.find((entry) => entry.id === city.countryId)?.name ?? null;
}

/**
 * Genişletilmiş akışın büyüklüğünü DÜRÜSTÇE anlatır.
 *
 * Yoklama tek sayfa çeker ve sayfa boyu tavanlıdır (CADDE_PAGE_SIZE = 20), bu yüzden
 * sayfa dolmuşsa toplam BİLİNMEZ. "20 paylaşım" yazmak yanlış olurdu — sayı tavanın
 * kendisi, gerçek toplam değil.
 */
export function describeCaddeWidenCount(count: number, hasMore: boolean): string {
  return hasMore ? `${count}+ paylaşım` : `${count} paylaşım`;
}
