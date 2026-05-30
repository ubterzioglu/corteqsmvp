export const INDIVIDUAL_FEATURE_KEYS = {
  about: "individual.about",
  serviceRequests: "individual.service_requests",
  events: "individual.events",
  follows: "individual.follows",
  whatsapp: "individual.whatsapp",
  messages: "individual.messages",
  activity: "individual.activity",
  cvRequest: "individual.cv_request",
} as const;

export type IndividualFeatureKey = (typeof INDIVIDUAL_FEATURE_KEYS)[keyof typeof INDIVIDUAL_FEATURE_KEYS];

export const GENERIC_FEATURE_KEYS = {
  profileViewOwn: "profile.view_own",
  profileEditOwn: "profile.edit_own",
  profileEditPublic: "profile.edit_public",
  directoryVisible: "directory.visible",
  directoryFeatured: "directory.featured",
  contactReceive: "contact.receive",
  contactShowWhatsapp: "contact.show_whatsapp",
  contentCreate: "content.create",
  contentEditOwn: "content.edit_own",
  eventsCreate: "events.create",
  offersCreate: "offers.create",
  referralCreate: "referral.create",
  cityManage: "city.manage",
  adminRequiresApproval: "admin.requires_approval",
} as const;

export type GenericFeatureKey = (typeof GENERIC_FEATURE_KEYS)[keyof typeof GENERIC_FEATURE_KEYS];
export type AppFeatureKey = IndividualFeatureKey | GenericFeatureKey;

export type FeatureSource = "override" | "role_default" | "fallback";

export type FeatureMeta<TFeatureKey extends string = string> = {
  key: TFeatureKey;
  label: string;
  description: string;
  category: "legacy-individual" | "generic";
};

export const INDIVIDUAL_FEATURES: FeatureMeta<IndividualFeatureKey>[] = [
  {
    key: INDIVIDUAL_FEATURE_KEYS.about,
    label: "Hakkında",
    description: "Profil özeti ve tanıtım alanı",
    category: "legacy-individual",
  },
  {
    key: INDIVIDUAL_FEATURE_KEYS.serviceRequests,
    label: "Hizmet Talepleri",
    description: "Kullanıcının hizmet talebi alanı",
    category: "legacy-individual",
  },
  {
    key: INDIVIDUAL_FEATURE_KEYS.events,
    label: "Etkinlikler",
    description: "Etkinlik listesi ve katılım alanı",
    category: "legacy-individual",
  },
  {
    key: INDIVIDUAL_FEATURE_KEYS.follows,
    label: "Takipler",
    description: "Takip edilen kişi ve içerikler",
    category: "legacy-individual",
  },
  {
    key: INDIVIDUAL_FEATURE_KEYS.whatsapp,
    label: "WhatsApp",
    description: "WhatsApp grup/iletişim modülü",
    category: "legacy-individual",
  },
  {
    key: INDIVIDUAL_FEATURE_KEYS.messages,
    label: "Mesajlar",
    description: "Platform içi mesajlaşma",
    category: "legacy-individual",
  },
  {
    key: INDIVIDUAL_FEATURE_KEYS.activity,
    label: "Aktivite",
    description: "Son aktiviteler ve akış",
    category: "legacy-individual",
  },
  {
    key: INDIVIDUAL_FEATURE_KEYS.cvRequest,
    label: "CV Talebi",
    description: "CV/özgeçmiş talep modülü",
    category: "legacy-individual",
  },
];

export const GENERIC_FEATURES: FeatureMeta<GenericFeatureKey>[] = [
  {
    key: GENERIC_FEATURE_KEYS.profileViewOwn,
    label: "Kendi Profilini Gör",
    description: "Kullanıcı kendi profilini görüntüleyebilir",
    category: "generic",
  },
  {
    key: GENERIC_FEATURE_KEYS.profileEditOwn,
    label: "Kendi Profilini Düzenle",
    description: "Kullanıcı kendi profil verilerini güncelleyebilir",
    category: "generic",
  },
  {
    key: GENERIC_FEATURE_KEYS.profileEditPublic,
    label: "Public Alanları Düzenle",
    description: "Kullanıcı public görünür alanlarını yönetebilir",
    category: "generic",
  },
  {
    key: GENERIC_FEATURE_KEYS.directoryVisible,
    label: "Directory Görünürlüğü",
    description: "Public directory içerisinde listelenebilir",
    category: "generic",
  },
  {
    key: GENERIC_FEATURE_KEYS.directoryFeatured,
    label: "Öne Çıkarılmış Profil",
    description: "Directory içinde öne çıkarılmış kart olarak listelenebilir",
    category: "generic",
  },
  {
    key: GENERIC_FEATURE_KEYS.contactReceive,
    label: "İletişim Talebi Al",
    description: "Kullanıcı iletişim talepleri alabilir",
    category: "generic",
  },
  {
    key: GENERIC_FEATURE_KEYS.contactShowWhatsapp,
    label: "WhatsApp Göster",
    description: "Kullanıcı WhatsApp bilgisini public olarak gösterebilir",
    category: "generic",
  },
  {
    key: GENERIC_FEATURE_KEYS.contentCreate,
    label: "İçerik Oluştur",
    description: "Kullanıcı içerik/post oluşturabilir",
    category: "generic",
  },
  {
    key: GENERIC_FEATURE_KEYS.contentEditOwn,
    label: "İçeriğini Düzenle",
    description: "Kullanıcı kendi içeriğini düzenleyebilir",
    category: "generic",
  },
  {
    key: GENERIC_FEATURE_KEYS.eventsCreate,
    label: "Etkinlik Oluştur",
    description: "Kullanıcı etkinlik açma akışına erişebilir",
    category: "generic",
  },
  {
    key: GENERIC_FEATURE_KEYS.offersCreate,
    label: "Teklif Oluştur",
    description: "Kullanıcı teklif/hizmet oluşturma akışına erişebilir",
    category: "generic",
  },
  {
    key: GENERIC_FEATURE_KEYS.referralCreate,
    label: "Referral Oluştur",
    description: "Kullanıcı referral talebi başlatabilir",
    category: "generic",
  },
  {
    key: GENERIC_FEATURE_KEYS.cityManage,
    label: "Şehir Yönetimi",
    description: "Kullanıcı şehir bazlı yönetim alanına erişebilir",
    category: "generic",
  },
  {
    key: GENERIC_FEATURE_KEYS.adminRequiresApproval,
    label: "Admin Onayı Gerekir",
    description: "İlgili akış admin onayı gerektirir",
    category: "generic",
  },
];

export const ALL_FEATURES: FeatureMeta<AppFeatureKey>[] = [...INDIVIDUAL_FEATURES, ...GENERIC_FEATURES];

export const INDIVIDUAL_FEATURE_KEY_LIST = INDIVIDUAL_FEATURES.map((feature) => feature.key);
export const GENERIC_FEATURE_KEY_LIST = GENERIC_FEATURES.map((feature) => feature.key);
export const APP_FEATURE_KEY_LIST = ALL_FEATURES.map((feature) => feature.key);

export const isIndividualFeatureKey = (value: string): value is IndividualFeatureKey => {
  return INDIVIDUAL_FEATURE_KEY_LIST.includes(value as IndividualFeatureKey);
};

export const isGenericFeatureKey = (value: string): value is GenericFeatureKey => {
  return GENERIC_FEATURE_KEY_LIST.includes(value as GenericFeatureKey);
};

export const getFeatureMeta = (featureKey: string): FeatureMeta<AppFeatureKey> | null => {
  return ALL_FEATURES.find((feature) => feature.key === featureKey) ?? null;
};
