/**
 * Cadde & Köprü erişim kuralları.
 *
 * Cadde paylaşımı:
 *  - TR kullanıcılar (profil ülkesi Türkiye + TR numarası ile doğrulanmış)
 *    sadece @Türkiye caddesine paylaşım yapar.
 *  - Yurt dışında yaşayan + yabancı/yerel numarası doğrulanmış kullanıcılar
 *    profil ülkesinde veya filtreden seçtikleri ülkede paylaşım yapabilir.
 *
 * Köprü paylaşımı:
 *  - TR bireysel kullanıcı + "Taşınıyorum …Ülke" toggle'ı açık (indiv_relocating)
 *  - TR'den kayıtlı işletme / danışman / kuruluş + "Dijital Topluluk" ayarı açık
 *
 * Cafe girişi:
 *  - TR'den açılmış cafe (cafe.country === "Türkiye"): sadece TR-numaralı /
 *    TR-yerleşik kullanıcılar girebilir.
 *  - Köprü cafesi (cafe.country === "Köprü" veya null/Köprü etiketli): herkes.
 *  - Diğer ülke cafeleri: doğrulanmış tüm kullanıcılar.
 */

export type ProfileLite = {
  country?: string | null;
  phone?: string | null;
  phone_verified?: boolean;
  account_type?: string | null;
};

const cleanPhone = (p?: string | null) => (p || "").replace(/\s|-/g, "");

export const isTRPhone = (p?: string | null) => {
  const x = cleanPhone(p);
  return x.startsWith("+90") || x.startsWith("0090");
};

/** TR yerleşik kullanıcı: ülke = Türkiye VE TR numarası doğrulanmış. */
export const isTRResident = (p?: ProfileLite | null) =>
  !!p && p.country === "Türkiye" && !!p.phone_verified && isTRPhone(p.phone);

/** Yurt dışında yaşayan diaspora: yabancı ülke + (TR olmayan) doğrulanmış telefon. */
export const isDiasporaResident = (p?: ProfileLite | null) =>
  !!p && !!p.country && p.country !== "Türkiye" && !!p.phone_verified && !isTRPhone(p.phone);

/**
 * TR işletme / danışman / kuruluş, kontrol panelinden "Dijital Topluluk"
 * ayarı açtığında bu localStorage anahtarını true yapıyor.
 */
const KOPRU_DIGITAL_KEY = "tr_digital_community_kopru";

export const getDigitalCommunityFlag = () => {
  try { return localStorage.getItem(KOPRU_DIGITAL_KEY) === "true"; }
  catch { return false; }
};
export const setDigitalCommunityFlag = (v: boolean) => {
  try { localStorage.setItem(KOPRU_DIGITAL_KEY, String(v)); } catch { /* noop */ }
};

const getRelocatingFlag = () => {
  try { return localStorage.getItem("indiv_relocating") === "true"; }
  catch { return false; }
};

/** Kullanıcı Cadde'de (Türkiye veya bir diaspora ülkesi) paylaşım yapabilir mi? */
export const canPostCadde = (p?: ProfileLite | null) =>
  isTRResident(p) || isDiasporaResident(p);

/** Kullanıcı Köprü'de paylaşım yapabilir mi? */
export const canPostKopru = (p?: ProfileLite | null) => {
  if (!p) return false;
  // Diaspora her zaman Köprü'ye paylaşım yapabilir
  if (isDiasporaResident(p)) return true;
  if (!isTRResident(p)) return false;
  const acc = (p.account_type || "individual").toLowerCase();
  if (acc === "individual" || acc === "user") return getRelocatingFlag();
  if (["business", "consultant", "association", "ambassador"].includes(acc)) {
    return getDigitalCommunityFlag();
  }
  return false;
};

/** Cafe'ye girebilir mi? (cafe.country tabanlı) */
export const canEnterCafe = (p: ProfileLite | null | undefined, cafe: { country?: string | null } | null) => {
  if (!p || !cafe) return false;
  const c = (cafe.country || "").toLowerCase();
  if (c === "köprü" || c === "kopru") return !!p.phone_verified; // herkes
  if (cafe.country === "Türkiye") return isTRResident(p);
  // diğer ülkeler: doğrulanmış tüm kullanıcılar
  return !!p.phone_verified;
};

export const cafeAccessReason = (p: ProfileLite | null | undefined, cafe: { country?: string | null } | null): string | null => {
  if (!p) return "Cafe'ye girmek için giriş yap.";
  if (!p.phone_verified) return "Cafe'ye girmek için telefonunu doğrulaman gerekir.";
  if (!cafe) return null;
  if (cafe.country === "Türkiye" && !isTRResident(p)) {
    return "Türkiye'den açılan cafe'lere sadece Türkiye'de yaşayan ve TR numarası doğrulanmış kullanıcılar girebilir.";
  }
  return null;
};
