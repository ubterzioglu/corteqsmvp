// AdminCaddePage form durumlari ve varsayilanlari (C03).
//
// Sayfa 773 satirdi, tek bilesen icinde DORT ayri form durumu tutuyordu ve HIC TESTI
// YOKTU. Repo kurali testsiz ayristirmayi yasakliyor, bu yuzden React'tan bagimsiz
// calisabilen parcalar once buraya tasindi: burada test yazmak render kurmayi
// gerektirmiyor.
//
// Buraya yalniz SAF sey girer: tip, varsayilan uretici, kucuk donusturucu.
// State, veri cagrisi ve `toast` sayfada kalir.

import type {
  CaddeAdminBillboardInput,
  CaddeAdminCafeInput,
  CaddeAdminPostInput,
  CaddeAdminSponsoredInput,
} from "@/lib/cadde-types";

export type PostFormState = Omit<CaddeAdminPostInput, "country_id" | "city_id"> & { countryName: string; cityName: string };
export type CafeFormState = Omit<CaddeAdminCafeInput, "country_id" | "city_id"> & { countryName: string; cityName: string };
export type BillboardFormState = Omit<CaddeAdminBillboardInput, "country_id" | "city_id"> & { countryName: string; cityName: string };
export type SponsoredFormState = Omit<CaddeAdminSponsoredInput, "country_id" | "city_id"> & { countryName: string; cityName: string };

export const postDefaults = (): PostFormState => ({
  content_mode: "demo",
  status: "published",
  post_type: "text",
  title: null,
  body: "",
  countryName: "",
  cityName: "",
  is_bridge: false,
  pinned: false,
  author_name_override: null,
  author_role: null,
});

export const cafeDefaults = (): CafeFormState => ({
  content_mode: "demo",
  status: "published",
  title: "",
  summary: "",
  countryName: "",
  cityName: "",
  is_bridge: false,
  is_free: true,
  starts_at: new Date().toISOString().slice(0, 16),
  ends_at: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
  is_active: true,
  host_name_override: null,
});

export const billboardDefaults = (): BillboardFormState => ({
  card_type: "consultant",
  title: "",
  subtitle: null,
  description: "",
  badge_text: null,
  cta_label: "",
  cta_url: "",
  image_url: null,
  content_mode: "demo",
  status: "published",
  countryName: "",
  cityName: "",
  is_featured: false,
  sort_order: 0,
});

export const sponsoredDefaults = (): SponsoredFormState => ({
  placement_key: "feed-inline",
  title: "",
  description: "",
  badge_text: null,
  cta_label: "",
  cta_url: "",
  image_url: null,
  content_mode: "demo",
  status: "published",
  countryName: "",
  cityName: "",
  sort_order: 0,
});


/**
 * Bos metni `null`a cevirir (form alani -> DB kolonu).
 *
 * ⚠️ Bos dize ile `null` AYNI SEY DEGILDIR: bos dize "deger var ama bos" demektir
 * ve bu kolonlarda "deger yok"tan farkli davranir (ornegin baslik alani bos dize
 * kaydedilirse listede bos bir satir gorunur, `null` ise varsayilan metin cizilir).
 * Sayfada 18 yerde kullaniliyor; tek kaynak olmasi sart.
 */
export const normalizeFormText = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};
