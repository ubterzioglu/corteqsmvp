// Single source of truth for organization (kuruluş) categories & subcategories.
// Used by the Associations listing page filters AND by profile signup forms.
// To add a new platform category: add it here — it will appear in profile forms automatically.

export interface OrgSubcategory {
  key: string;
  label: string;
}

export interface OrgCategory {
  key: string;
  label: string;
  icon?: string;
  subcategories: OrgSubcategory[];
}

export const ORGANIZATION_CATEGORIES: OrgCategory[] = [
  {
    key: "dernek",
    label: "Dernekler & Vakıflar",
    icon: "🤝",
    subcategories: [
      { key: "dernek", label: "Dernek" },
      { key: "vakif", label: "Vakıf" },
      { key: "is_orgutu", label: "İş Örgütü" },
      { key: "sosyal_orgut", label: "Sosyal Örgüt" },
      { key: "diger", label: "Diğer" },
    ],
  },
  {
    key: "oda",
    label: "Odalar & Konseyler",
    icon: "🏢",
    subcategories: [
      { key: "ticaret_odasi", label: "Ticaret Odası" },
      { key: "sanayi_odasi", label: "Sanayi Odası" },
      { key: "is_konseyi", label: "İş Konseyi" },
      { key: "meslek_odasi", label: "Meslek Odası" },
    ],
  },
  {
    key: "akademik",
    label: "Akademik Birimler",
    icon: "🎓",
    subcategories: [
      { key: "universite", label: "Üniversite" },
      { key: "arastirma_merkezi", label: "Araştırma Merkezi" },
      { key: "akademik_dernek", label: "Akademik Dernek" },
      { key: "ogrenci_birligi", label: "Öğrenci Birliği" },
    ],
  },
  {
    key: "egitim",
    label: "Eğitim Kuruluşları",
    icon: "📚",
    subcategories: [
      { key: "okul", label: "Okul" },
      { key: "anaokulu", label: "Anaokulu" },
      { key: "kurs_merkezi", label: "Kurs Merkezi" },
      { key: "dil_okulu", label: "Türkçe Dil Okulu" },
    ],
  },
  {
    key: "medya",
    label: "Türk Medya Kuruluşları",
    icon: "📺",
    subcategories: [
      { key: "tv_kanali", label: "TV Kanalı" },
      { key: "radyo", label: "Radyo" },
      { key: "gazete", label: "Gazete / Dergi" },
      { key: "online_medya", label: "Online Medya" },
      { key: "podcast", label: "Podcast" },
    ],
  },
  {
    key: "diplomatik",
    label: "Büyükelçilik & Konsolosluk",
    icon: "🏛️",
    subcategories: [
      { key: "buyukelcilik", label: "Büyükelçilik" },
      { key: "konsolosluk", label: "Konsolosluk" },
      { key: "ataselik", label: "Ataşelik" },
      { key: "kultur_merkezi", label: "Kültür Merkezi" },
    ],
  },
  {
    key: "hastane",
    label: "Sağlık Kuruluşları",
    icon: "🏥",
    subcategories: [
      { key: "hastane", label: "Hastane" },
      { key: "klinik", label: "Klinik" },
      { key: "muayenehane", label: "Muayenehane" },
      { key: "eczane", label: "Eczane" },
    ],
  },
  {
    key: "dijital",
    label: "Dijital Topluluklar",
    icon: "💬",
    subcategories: [
      { key: "whatsapp", label: "WhatsApp Grubu" },
      { key: "telegram", label: "Telegram Grubu" },
      { key: "discord", label: "Discord Topluluğu" },
      { key: "facebook", label: "Facebook Grubu" },
      { key: "online_topluluk", label: "Online Topluluk" },
    ],
  },
];

export const findOrgCategory = (key: string) =>
  ORGANIZATION_CATEGORIES.find((c) => c.key === key);

export const findOrgSubcategory = (catKey: string, subKey: string) =>
  findOrgCategory(catKey)?.subcategories.find((s) => s.key === subKey);
