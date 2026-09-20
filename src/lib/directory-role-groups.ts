/**
 * Public liste sayfalarının (İşletmeler / Uzmanlar / Şehir Elçileri) rol taksonomisi.
 *
 * ⚠️ NEDEN ETİKETLER BURADA, VERİTABANINDA DEĞİL — ölçüldü 2026-09-20:
 * `roles` tablosunun SELECT politikası YALNIZ `authenticated` rolüne açıktır
 * (`set role anon; select count(*) from roles` → **0**). `catalog_items` ise
 * `anon`a açıktır (`catalog_items_public_or_manager_read`). Yani anonim ziyaretçi
 * KAYITLARI görebilir ama rol ETİKETLERİNİ göremez. Etiketi DB'den çekmeye
 * kalkışan bir public sayfa, giriş yapmamış herkese boş rozet gösterir.
 *
 * Aynı ölçümün ikinci sonucu: `search_directory_catalog` RPC'si anonim çağrıda
 * `authentication required` (42501) ile PATLAR — bu yüzden bu sayfalar o RPC'yi
 * KULLANMAZ, `public-catalog-api.ts` üzerinden doğrudan tablo okur.
 *
 * ⚠️ DB'ye yeni bir `Business_*` / `Consultant_*` / `Healthcare_*` rolü eklenirse
 * buraya da bir satır eklenmelidir. Yoksa o roldeki kayıtlar liste sayfasında
 * HİÇ görünmez ve hiçbir yerde hata çıkmaz — sessiz kusur sınıfı.
 * `directory-role-groups.test.ts` yapıyı kilitler ama canlıyla eşleşmeyi
 * DOĞRULAYAMAZ (test DB'ye bağlanmaz); rol eklerken bu eşlemeyi elle güncelle.
 *
 * Etiketler canlı `roles.label` değerlerinden birebir kopyalanmıştır (2026-09-20).
 * Türkçe karakterleri ASCII'ye düşürme — bunlar kullanıcıya görünen metinlerdir.
 */

/** Bir rolün liste sayfasındaki yeri. */
export interface RoleGroupEntry {
  /** `catalog_items.platform_role_key` ile birebir aynı olmalı. */
  readonly key: string;
  /** Kartta rozet olarak görünen Türkçe etiket (canlı `roles.label`). */
  readonly label: string;
}

/** Filtre sekmesi — bir başlık ve altındaki rol anahtarları. */
export interface RoleGroup {
  /** Filtre durumunda tutulan teknik anahtar (ASCII, URL'e de konulabilir). */
  readonly key: string;
  /** Sekmede görünen Türkçe başlık. */
  readonly label: string;
  readonly roles: readonly RoleGroupEntry[];
}

/**
 * İŞLETMELER — 25 `Business_*` rolü dokuz gruba ayrıldı.
 * Gruplama ürün kararıdır; rol anahtarları ve etiketler canlıdan gelir.
 */
export const BUSINESS_ROLE_GROUPS: readonly RoleGroup[] = [
  {
    key: "gastronomi",
    label: "🍽️ Gastronomi",
    roles: [
      { key: "Business_RestaurantCafe", label: "Restoran / Cafe" },
      { key: "Business_BakeryPatisserie", label: "Fırın / Pastane" },
    ],
  },
  {
    key: "saglik-bakim",
    label: "💆 Sağlık & Bakım",
    roles: [
      { key: "Business_HealthcareClinic", label: "Sağlık Merkezi / Klinik" },
      { key: "Business_Pharmacy", label: "Eczane" },
      { key: "Business_HairdresserBeauty", label: "Kuaför / Güzellik Merkezi" },
      { key: "Business_Barber", label: "Berber" },
      { key: "Business_Gym", label: "Spor Salonu" },
    ],
  },
  {
    key: "gayrimenkul-insaat",
    label: "🏠 Gayrimenkul & İnşaat",
    roles: [
      { key: "Business_RealEstateOffice", label: "Gayrimenkul Ofisi" },
      { key: "Business_ConstructionRenovation", label: "İnşaat / Tadilat Firması" },
    ],
  },
  {
    key: "profesyonel-hizmet",
    label: "💼 Profesyonel Hizmetler",
    roles: [
      { key: "Business_LawOffice", label: "Hukuk Bürosu" },
      { key: "Business_AccountingFinance", label: "Muhasebe / Finans Ofisi" },
      { key: "Business_Insurance", label: "Sigorta Şirketi / Acentesi" },
      { key: "Business_DesignAdvertising", label: "Tasarım / Reklam Ajansı" },
      { key: "Business_ITSoftware", label: "IT / Yazılım Şirketi" },
    ],
  },
  {
    key: "egitim",
    label: "🎓 Eğitim",
    roles: [
      { key: "Business_EducationInstitution", label: "Eğitim Kurumu" },
      { key: "Business_LanguageSchool", label: "Dil Okulu" },
    ],
  },
  {
    key: "ticaret-perakende",
    label: "🛍️ Ticaret & Perakende",
    roles: [
      { key: "Business_RetailStore", label: "Perakende / Mağaza" },
      { key: "Business_MarketGrocery", label: "Market / Bakkal" },
      { key: "Business_Wholesale", label: "Toptan Ticaret İşletmesi" },
      { key: "Business_ECommerce", label: "E-Ticaret İşletmesi" },
    ],
  },
  {
    key: "seyahat-konaklama",
    label: "✈️ Seyahat & Konaklama",
    roles: [
      { key: "Business_TravelAgency", label: "Seyahat Acentesi" },
      { key: "Business_HotelAccommodation", label: "Otel / Konaklama" },
    ],
  },
  {
    key: "ulasim-lojistik",
    label: "🚚 Ulaşım & Lojistik",
    roles: [
      { key: "Business_TransportLogistics", label: "Nakliye / Lojistik Firması" },
      { key: "Business_Automotive", label: "Otomotiv İşletmesi" },
    ],
  },
  {
    key: "cocuk-aile",
    label: "👶 Çocuk & Aile",
    roles: [{ key: "Business_ChildrenFamily", label: "Çocuk / Aile İşletmesi" }],
  },
];

/**
 * UZMANLAR — 11 `Consultant_*` rolü + KİŞİ niteliğindeki üç `Healthcare_*` rolü.
 *
 * ⚠️ `Healthcare_Hospital` / `Healthcare_Clinic` / `Healthcare_Pharmacy` /
 * `Healthcare_AppointmentProvider` BİLEREK DIŞARIDA bırakıldı: bunlar kişi değil
 * KURUM. Kurumların yeri Kuruluşlar (`Organization_HealthcareInstitution`) ve
 * İşletmeler (`Business_HealthcareClinic`, `Business_Pharmacy`) sayfalarıdır.
 * Kartın kendi tanımı da bunu söylüyor: "güvenilir Türk profesyonellere ve
 * danışmanlara ulaş". Buraya kurum eklersen aynı kurum iki sayfada listelenir.
 */
export const CONSULTANT_ROLE_GROUPS: readonly RoleGroup[] = [
  {
    key: "hukuk-vergi",
    label: "⚖️ Hukuk & Vergi",
    roles: [
      { key: "Consultant_LawTax", label: "Hukuk & Vergi Danışmanı" },
      { key: "Consultant_TrademarkPatent", label: "Marka & Patent Danışmanı" },
    ],
  },
  {
    key: "vize-gocmenlik",
    label: "🛂 Vize & Göçmenlik",
    roles: [{ key: "Consultant_VisaImmigration", label: "Vize & Göçmenlik Danışmanı" }],
  },
  {
    key: "sirket-is",
    label: "💼 Şirket & İş",
    roles: [
      { key: "Consultant_BusinessSetupWork", label: "Şirket Kuruluşu & İş Danışmanı" },
      { key: "Consultant_Financial", label: "Finansal Danışman" },
    ],
  },
  {
    key: "yasam-relocation",
    label: "🏠 Yaşam & Relocation",
    roles: [
      { key: "Consultant_LifeRelocation", label: "Yaşam & Relocation Danışmanı" },
      { key: "Consultant_PracticalLife", label: "Pratik Hayat Danışmanı" },
      { key: "Consultant_RealEstate", label: "Gayrimenkul Danışmanı" },
    ],
  },
  {
    key: "egitim-aile",
    label: "🎓 Eğitim & Aile",
    roles: [
      { key: "Consultant_Education", label: "Eğitim Danışmanı" },
      { key: "Consultant_FamilyChildren", label: "Aile & Çocuk Danışmanı" },
    ],
  },
  {
    key: "saglik-psikoloji",
    label: "🩺 Sağlık & Psikoloji",
    roles: [
      { key: "Healthcare_Doctor", label: "Doktor" },
      { key: "Healthcare_Dentist", label: "Diş Hekimi" },
      { key: "Healthcare_Psychologist", label: "Psikolog" },
      { key: "Consultant_PsychologistCoach", label: "Psikolog & Koç" },
    ],
  },
];

/** ŞEHİR ELÇİLERİ — tek rol, grup filtresi yok (şehir/ülke filtresi yeter). */
export const CITY_AMBASSADOR_ROLE_KEY = "User_CityAmbassador";

/**
 * Şehir Elçileri "taksonomisi" — tek rollü. Ortak liste kabuğu (`PublicListingPage`)
 * rol etiketini taksonomiden çözdüğü için bu sarmalayıcı gerekir; kartta
 * "Şehir Elçisi" rozeti bu sayede çıkar. Grup SEKMESİ çizilmez (sayfa
 * `showGroups={false}` geçer) — tek sekmeli bir filtre çubuğu anlamsız olurdu.
 */
export const CITY_AMBASSADOR_ROLE_GROUPS: readonly RoleGroup[] = [
  {
    key: "sehir-elcileri",
    label: "Şehir Elçileri",
    roles: [{ key: CITY_AMBASSADOR_ROLE_KEY, label: "Şehir Elçisi" }],
  },
];

/** Bir grup listesindeki TÜM rol anahtarları — sorgunun `in(...)` kümesi. */
export function roleKeysOf(groups: readonly RoleGroup[]): string[] {
  return groups.flatMap((group) => group.roles.map((role) => role.key));
}

/** Rol anahtarı → Türkçe etiket. Bilinmeyen anahtar için `null`. */
export function roleLabelOf(
  groups: readonly RoleGroup[],
  key: string | null | undefined,
): string | null {
  if (!key) return null;
  for (const group of groups) {
    const match = group.roles.find((role) => role.key === key);
    if (match) return match.label;
  }
  return null;
}

/** Bir grubun anahtarından rol anahtarlarını bulur; `"all"` → hepsi. */
export function roleKeysForGroup(groups: readonly RoleGroup[], groupKey: string): string[] {
  if (groupKey === "all") return roleKeysOf(groups);
  const group = groups.find((candidate) => candidate.key === groupKey);
  return group ? group.roles.map((role) => role.key) : [];
}
