export type ProfileSectionArea = "preview_card" | "detail_card";

export type ProfileSectionSeed = {
  key: string;
  label: string;
  sectionArea: ProfileSectionArea;
  description: string;
  componentName: string;
  sortOrder: number;
};

export type TaxonomyGroupSeed = {
  key: string;
  label: string;
  description: string;
  roleKey: string;
  selectionMode: "single" | "multiple";
  sortOrder: number;
};

export type TaxonomyOptionSeed = {
  groupKey: string;
  key: string;
  label: string;
  description: string;
  sortOrder: number;
};

export const PROFILE_SECTION_SEEDS: ProfileSectionSeed[] = [
  {
    key: "preview.isim_kurulus_adi",
    label: "İsim / Kuruluş Adı",
    sectionArea: "preview_card",
    description: "Public profil ön kartında görünen ana isim alanı",
    componentName: "title",
    sortOrder: 10,
  },
  {
    key: "preview.konum",
    label: "Konum",
    sectionArea: "preview_card",
    description: "Şehir ve ülke konumu",
    componentName: "location",
    sortOrder: 20,
  },
  {
    key: "preview.profil_logo_gorseli",
    label: "Profil / Logo Görseli",
    sectionArea: "preview_card",
    description: "Profil veya işletme logosu görseli",
    componentName: "image",
    sortOrder: 30,
  },
  {
    key: "preview.kategori_sektor_etiketi",
    label: "Kategori / Sektör Etiketi",
    sectionArea: "preview_card",
    description: "Rol özel alanı veya taxonomy etiketleri",
    componentName: "badges",
    sortOrder: 40,
  },
  {
    key: "detail.hakkinda_bio",
    label: "Hakkında",
    sectionArea: "detail_card",
    description: "Kullanıcının public kısa açıklaması",
    componentName: "rich_text",
    sortOrder: 110,
  },
  {
    key: "detail.taxonomy_etiketleri",
    label: "Uzmanlık / Alt Tip Etiketleri",
    sectionArea: "detail_card",
    description: "Consultant alt kategorileri ve business alt tipleri",
    componentName: "badges",
    sortOrder: 120,
  },
  {
    key: "detail.iletisim_linkleri",
    label: "İletişim Linkleri",
    sectionArea: "detail_card",
    description: "Website ve LinkedIn gibi public linkler",
    componentName: "links",
    sortOrder: 130,
  },
];

export const TAXONOMY_GROUP_SEEDS: TaxonomyGroupSeed[] = [
  {
    key: "consultant_subcategory",
    label: "Consultant Alt Kategorileri",
    description: "Consultant rolü için bir veya daha fazla uzmanlık seçimi",
    roleKey: "danisman",
    selectionMode: "multiple",
    sortOrder: 10,
  },
  {
    key: "business_subtype",
    label: "Business Alt Tipi",
    description: "İşletme rolü için tek alt tip seçimi",
    roleKey: "isletme",
    selectionMode: "single",
    sortOrder: 20,
  },
];

export const TAXONOMY_OPTION_SEEDS: TaxonomyOptionSeed[] = [
  {
    groupKey: "consultant_subcategory",
    key: "consultant_category.egitim",
    label: "Eğitim",
    description: "Üniversite, burs, denklik ve eğitim danışmanlığı",
    sortOrder: 10,
  },
  {
    groupKey: "consultant_subcategory",
    key: "consultant_category.finansal",
    label: "Finansal",
    description: "Banka, yatırım ve finansal danışmanlık",
    sortOrder: 20,
  },
  {
    groupKey: "consultant_subcategory",
    key: "consultant_category.gayrimenkul",
    label: "Gayrimenkul",
    description: "Emlak ve yerleşim odaklı danışmanlık",
    sortOrder: 30,
  },
  {
    groupKey: "consultant_subcategory",
    key: "consultant_category.hukuk",
    label: "Hukuk",
    description: "Avukatlık ve hukuki danışmanlık",
    sortOrder: 40,
  },
  {
    groupKey: "consultant_subcategory",
    key: "consultant_category.marka_and_patent",
    label: "Marka & Patent",
    description: "Marka tescili ve patent süreçleri",
    sortOrder: 50,
  },
  {
    groupKey: "consultant_subcategory",
    key: "consultant_category.mentor",
    label: "Mentör",
    description: "Gönüllü mentörlük ve yönlendirme",
    sortOrder: 60,
  },
  {
    groupKey: "consultant_subcategory",
    key: "consultant_category.saglik",
    label: "Sağlık",
    description: "Doktor, klinik ve sağlık danışmanlığı",
    sortOrder: 70,
  },
  {
    groupKey: "consultant_subcategory",
    key: "consultant_category.wellbeing",
    label: "Wellbeing",
    description: "Psikolog, koç ve wellbeing odaklı hizmetler",
    sortOrder: 80,
  },
  {
    groupKey: "business_subtype",
    key: "business_subtype.classic",
    label: "Classic",
    description: "Fiziksel adres odaklı klasik işletme",
    sortOrder: 10,
  },
  {
    groupKey: "business_subtype",
    key: "business_subtype.online",
    label: "Online",
    description: "Website ve servis bölgesi odaklı dijital işletme",
    sortOrder: 20,
  },
  {
    groupKey: "business_subtype",
    key: "business_subtype.startup",
    label: "Startup",
    description: "Kuruluş yılı ve girişim anlatısı odaklı startup",
    sortOrder: 30,
  },
];

export const DASHBOARD_FEATURE_KEYS = [
  "dashboard.tab_profil_ayarlari",
  "dashboard.tab_mesaj_kutusu",
  "dashboard.tab_takip_ettiklerim",
  "dashboard.tab_etkinlikler",
  "dashboard.tab_whatsapp",
  "dashboard.tab_analitik",
  "dashboard.admin_onizleme_modu",
] as const;

