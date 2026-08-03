// Relocation Tools — araç slug'ı → hero görseli eşlemesi (statik, public/ altında servis edilir).
// Görseller public/relocation-tools/<slug>.jpg; runtime'da "/relocation-tools/<slug>.jpg" yolundan
// servis edilir. Yeni araç eklenince buraya bir satır ekle. Bilinmeyen slug → undefined (görselsiz fallback).
// Aynı görsel hem araç ilk ekranında (hero) hem hub kartında (thumbnail) kullanılır.

const TOOL_HERO_BY_SLUG: Record<string, string> = {
  "ulke-secimi": "/relocation-tools/ulke-secimi.jpg",
  "meslek-maas-karsilastirma": "/relocation-tools/meslek-maas-karsilastirma.jpg",
  "tasinma-hazirlik-skoru": "/relocation-tools/tasinma-hazirlik-skoru.jpg",
  "sehir-eslestirme": "/relocation-tools/sehir-eslestirme.jpg",
  "diaspora-ag-eslestirme": "/relocation-tools/diaspora-ag-eslestirme.jpg",
  "yurtdisi-kariyer-yolu": "/relocation-tools/yurtdisi-kariyer-yolu.jpg",
  "expat-yasam-tarzi-persona": "/relocation-tools/expat-yasam-tarzi-persona.jpg",
  "ilk-90-gun-planlayici": "/relocation-tools/ilk-90-gun-planlayici.jpg",
  "oncelikli-tasinma-sorunu": "/relocation-tools/oncelikli-tasinma-sorunu.jpg",
  "is-bulma-olasiligi": "/relocation-tools/is-bulma-olasiligi.jpg",
  "banka-secim-almanya": "/relocation-tools/banka-secim-almanya.jpg",
  "sigorta-secim-almanya": "/relocation-tools/sigorta-secim-almanya.jpg",
  "maas-hesaplama-almanya": "/relocation-tools/maas-hesaplama-almanya.jpg",
  "vize-secim-almanya": "/relocation-tools/vize-secim-almanya.jpg",
  "vatandaslik-testi-almanya": "/relocation-tools/vatandaslik-testi-almanya.jpg",
  "para-transferi-almanya": "/relocation-tools/para-transferi-almanya.jpg",
  "stepstone-karsilastirma-almanya": "/relocation-tools/stepstone-karsilastirma-almanya.jpg",
  "zgen-nesil-bulucu": "/relocation-tools/zgen/gen_genz_f.jpg",
};

/** Araç slug'ı için hero görsel yolunu döndürür; tanımsızsa undefined (görselsiz fallback). */
export function toolHeroImage(slug: string | null | undefined): string | undefined {
  if (!slug) return undefined;
  return TOOL_HERO_BY_SLUG[slug];
}
