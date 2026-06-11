export interface CommercialDocument {
  slug: string;
  title: string;
  summary: string;
  isPublic?: boolean;
}

export const commercialDocuments: CommercialDocument[] = [
  {
    slug: "contributor",
    title: "Contributor",
    summary: "CorteQS contributor yapısının rolü, katkı alanları ve birlikte çalışma biçimi.",
    isPublic: true,
  },
  {
    slug: "influencer-partner",
    title: "Influencer Partner",
    summary: "Influencer partner modeli, referral geliri, etkinlik paylaşımı ve marka iş birlikleri.",
    isPublic: true,
  },
  {
    slug: "strategic-partner",
    title: "Strategic Partner",
    summary: "Strategic partner yapısı, ortak proje alanları, event paylaşımı ve sponsor fırsatları.",
    isPublic: true,
  },
  {
    slug: "community-leader",
    title: "Community Leader",
    summary: "Community leader rolü, şehir bazlı topluluk liderliği ve yerel etki alanları.",
    isPublic: true,
  },
  {
    slug: "ambassador",
    title: "Ambassador",
    summary: "Ambassador rolünün temsil, topluluk büyütme ve lokal network geliştirme beklentileri.",
    isPublic: false,
  },
];

export const commercialDocumentMap = new Map(
  commercialDocuments.map((document) => [document.slug, document]),
);

export const publicCommercialDocuments = commercialDocuments.filter(
  (document) => document.isPublic !== false,
);

export const getCommercialDocumentBySlug = (slug: string) =>
  commercialDocumentMap.get(slug);
