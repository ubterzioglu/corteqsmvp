// Herkese açık katalog profili (/directory/catalog/:slug) için schema.org JSON-LD.
//
// Eskiden her profil `Person` olarak işaretleniyordu. Katalogda ayrıca konsolosluk/dernek/işletme
// gibi KURUMSAL kayıtlar var (bkz. view-model `claim.isOrganization`); onları `Person` + `jobTitle`
// ile yayınlamak hem yanlış varlık türü hem de geçersiz bir alan (`jobTitle` Organization'a ait
// değildir) demektir ve cevap motorlarının kurumu kişi sanmasına yol açar.

import { SEO_CANONICAL_ORIGIN } from "@/lib/seo";

export interface PublicProfileJsonLdInput {
  title: string;
  description: string;
  avatarUrl: string | null;
  roleLabel: string | null;
  locationLabel: string | null;
  /** Site içi yol, örn. `/directory/catalog/<slug>` (mutlak URL burada kurulur). */
  path: string;
  /** Kurumsal kayıt mı: itemType='organization' ya da `Organization%` rolü. */
  isOrganization: boolean;
}

export function buildPublicProfileJsonLd(input: PublicProfileJsonLdInput): Record<string, unknown> {
  const common = {
    "@context": "https://schema.org",
    name: input.title,
    description: input.description,
    url: `${SEO_CANONICAL_ORIGIN}${input.path}`,
    ...(input.locationLabel
      ? { address: { "@type": "PostalAddress", addressLocality: input.locationLabel } }
      : {}),
  };

  if (input.isOrganization) {
    return {
      ...common,
      "@type": "Organization",
      ...(input.avatarUrl ? { image: input.avatarUrl, logo: input.avatarUrl } : {}),
    };
  }

  return {
    ...common,
    "@type": "Person",
    ...(input.avatarUrl ? { image: input.avatarUrl } : {}),
    ...(input.roleLabel ? { jobTitle: input.roleLabel } : {}),
  };
}
