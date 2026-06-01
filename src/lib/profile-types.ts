export const canonicalRoleSlugs = [
  "individual",
  "consultant",
  "business",
  "organization",
  "influencer",
  "ambassador",
] as const;

export type CanonicalRoleSlug = (typeof canonicalRoleSlugs)[number];

export const profileTypes = [
  "bireysel",
  "danisman",
  "isletme",
  "kurulus-dernek",
  "blogger-vlogger-youtuber",
  "sehir-elcisi",
] as const;

export type LegacyRoleKey = (typeof profileTypes)[number];
export type ProfileType = LegacyRoleKey;

export type RoleMeta = {
  legacyKey: LegacyRoleKey;
  canonicalSlug: CanonicalRoleSlug;
  adminLabel: string;
  publicLabel: string;
  title: string;
  description: string;
  sortOrder: number;
  defaultAttributeKey:
    | "interests"
    | "expertise_area"
    | "business_category"
    | "organization_type"
    | "main_platform"
    | "ambassador_city";
  displayNameLabel: string;
  selfSectionKeys: readonly string[];
  publicSectionKeys: readonly string[];
  defaultPreviewBehavior: "compact" | "rich";
};

export const roleMetas: RoleMeta[] = [
  {
    legacyKey: "bireysel",
    canonicalSlug: "individual",
    adminLabel: "Bireysel",
    publicLabel: "Bireysel",
    title: "Bireysel Kullanıcı",
    description: "Hizmet almak, etkinliklere katılmak ve diaspora ağınızı keşfetmek için",
    sortOrder: 10,
    defaultAttributeKey: "interests",
    displayNameLabel: "Ad Soyad",
    selfSectionKeys: ["summary", "common_attributes", "role_attributes", "taxonomy", "requests", "dashboard"],
    publicSectionKeys: ["hero", "about", "taxonomy", "contact"],
    defaultPreviewBehavior: "rich",
  },
  {
    legacyKey: "danisman",
    canonicalSlug: "consultant",
    adminLabel: "Consultant",
    publicLabel: "Consultant",
    title: "Consultant",
    description: "Uzmanlığınızı sergilemek, hizmet sunmak ve müşteri portföyünüzü büyütmek için",
    sortOrder: 20,
    defaultAttributeKey: "expertise_area",
    displayNameLabel: "Ad Soyad / Uzman Adı",
    selfSectionKeys: ["summary", "common_attributes", "role_attributes", "taxonomy", "requests", "dashboard"],
    publicSectionKeys: ["hero", "about", "expertise", "taxonomy", "contact"],
    defaultPreviewBehavior: "compact",
  },
  {
    legacyKey: "isletme",
    canonicalSlug: "business",
    adminLabel: "İşletme",
    publicLabel: "İşletme",
    title: "İşletme",
    description: "İşletmenizi tanıtmak, tekliflerinizi yayınlamak ve diaspora müşterilerine ulaşmak için",
    sortOrder: 30,
    defaultAttributeKey: "business_category",
    displayNameLabel: "İşletme Adı",
    selfSectionKeys: ["summary", "common_attributes", "role_attributes", "taxonomy", "requests", "dashboard"],
    publicSectionKeys: ["hero", "about", "services", "taxonomy", "contact"],
    defaultPreviewBehavior: "compact",
  },
  {
    legacyKey: "kurulus-dernek",
    canonicalSlug: "organization",
    adminLabel: "Kuruluş",
    publicLabel: "Kuruluş",
    title: "Kuruluş / Dernek",
    description: "Topluluğunuzu, derneğinizi veya resmi yapınızı yönetmek ve görünür kılmak için",
    sortOrder: 40,
    defaultAttributeKey: "organization_type",
    displayNameLabel: "Kuruluş Adı",
    selfSectionKeys: ["summary", "common_attributes", "role_attributes", "taxonomy", "requests", "dashboard"],
    publicSectionKeys: ["hero", "about", "focus", "taxonomy", "contact"],
    defaultPreviewBehavior: "compact",
  },
  {
    legacyKey: "blogger-vlogger-youtuber",
    canonicalSlug: "influencer",
    adminLabel: "Influencer",
    publicLabel: "Influencer",
    title: "Influencer",
    description: "İçerik üretmek, kampanyalara katılmak ve kitlenizi büyütmek için",
    sortOrder: 50,
    defaultAttributeKey: "main_platform",
    displayNameLabel: "Görünen İsim",
    selfSectionKeys: ["summary", "common_attributes", "role_attributes", "taxonomy", "requests", "dashboard"],
    publicSectionKeys: ["hero", "about", "platform", "taxonomy", "contact"],
    defaultPreviewBehavior: "compact",
  },
  {
    legacyKey: "sehir-elcisi",
    canonicalSlug: "ambassador",
    adminLabel: "Elçi",
    publicLabel: "Elçi",
    title: "Şehir Elçisi",
    description: "Şehrinizde CorteQS ağını temsil etmek ve topluluğu büyütmek için",
    sortOrder: 60,
    defaultAttributeKey: "ambassador_city",
    displayNameLabel: "Ad Soyad",
    selfSectionKeys: ["summary", "common_attributes", "role_attributes", "taxonomy", "requests", "dashboard"],
    publicSectionKeys: ["hero", "about", "city", "taxonomy", "contact"],
    defaultPreviewBehavior: "compact",
  },
] as const;

export const defaultProfileType: ProfileType = "bireysel";

export type ProfileTypeOption = {
  type: ProfileType;
  title: string;
  description: string;
};

export const profileTypeOptions: ProfileTypeOption[] = roleMetas
  .slice()
  .sort((left, right) => left.sortOrder - right.sortOrder)
  .map((meta) => ({
    type: meta.legacyKey,
    title: meta.title,
    description: meta.description,
  }));

export const isProfileType = (value: string): value is ProfileType => {
  return (profileTypes as readonly string[]).includes(value);
};

export const isCanonicalRoleSlug = (value: string): value is CanonicalRoleSlug => {
  return (canonicalRoleSlugs as readonly string[]).includes(value);
};

export const roleMetaByLegacyKey: Record<LegacyRoleKey, RoleMeta> = roleMetas.reduce(
  (accumulator, meta) => {
    accumulator[meta.legacyKey] = meta;
    return accumulator;
  },
  {} as Record<LegacyRoleKey, RoleMeta>,
);

export const roleMetaByCanonicalSlug: Record<CanonicalRoleSlug, RoleMeta> = roleMetas.reduce(
  (accumulator, meta) => {
    accumulator[meta.canonicalSlug] = meta;
    return accumulator;
  },
  {} as Record<CanonicalRoleSlug, RoleMeta>,
);

export const getRoleMeta = (value: string | null | undefined): RoleMeta | null => {
  if (!value) return null;
  if (isProfileType(value)) return roleMetaByLegacyKey[value];
  if (isCanonicalRoleSlug(value)) return roleMetaByCanonicalSlug[value];
  return null;
};

export const getCanonicalRoleSlug = (legacyKey: string | null | undefined): CanonicalRoleSlug | null => {
  const roleMeta = getRoleMeta(legacyKey);
  return roleMeta?.canonicalSlug ?? null;
};
