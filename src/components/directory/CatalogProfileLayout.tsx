import type { ReactNode } from "react";
import { Globe, Mail, MapPin, Phone, Briefcase, User, Star, Link as LinkIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CatalogEntityProfileAttribute } from "@/lib/catalog-entity-api";

type ContactRow = {
  contact_type: string;
  contact_value: string;
  label: string | null;
  is_primary: boolean;
};

type ServiceRow = {
  service_name: string;
  description: string | null;
};

type LanguageRow = {
  language_code: string;
  proficiency: string | null;
};

export interface CatalogProfileLayoutProps {
  shortDescription: string | null;
  longDescription: string | null;
  canClaim: boolean;
  locationLabel: string | null;
  addressLine: string | null;
  publicAttributes: CatalogEntityProfileAttribute[];
  contacts: ContactRow[];
  services: ServiceRow[];
  languages?: LanguageRow[];
  claimNotice?: ReactNode;
  statusNotice?: ReactNode;
}

const contactIcon = (type: string) => {
  if (type === "phone") return <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />;
  if (type === "email") return <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />;
  if (type === "website" || type === "appointment_url") return <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />;
  return <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />;
};

const renderAttributeValue = (attr: CatalogEntityProfileAttribute): string | null => {
  if (attr.data_type === "boolean") return attr.value_json === true ? "Evet" : "Hayır";
  if (Array.isArray(attr.value_json)) return (attr.value_json as string[]).join(", ");
  if (typeof attr.value_json === "string" && attr.value_json.trim()) return attr.value_json;
  return attr.value_text ?? null;
};

const SectionCard = ({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) => (
  <Card className="overflow-hidden border-border/60 shadow-sm">
    <CardHeader className="border-b border-border/40 bg-muted/30 px-5 py-3">
      <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-5">{children}</CardContent>
  </Card>
);

const CatalogProfileLayout = ({
  shortDescription,
  longDescription,
  canClaim,
  locationLabel,
  addressLine,
  publicAttributes,
  contacts,
  services,
  languages,
  claimNotice,
  statusNotice,
}: CatalogProfileLayoutProps) => {
  const description = shortDescription ?? longDescription;
  const hasSidebar = contacts.length > 0 || services.length > 0 || (languages && languages.length > 0);

  return (
    <div className="space-y-4">
      {statusNotice}
      {claimNotice}

      {/* Description / location notice */}
      {description || (canClaim && locationLabel) || addressLine ? (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground">
            {description ? <p className="leading-relaxed">{description}</p> : null}
            {canClaim ? (
              <p className="text-xs">
                Bu katalog kaydının sahibi ya da yetkili temsilcisiyseniz içeriği düzenleyebilmek için başvurabilirsiniz.
              </p>
            ) : null}
            {locationLabel ? (
              <p className="flex items-center gap-1.5 text-xs">
                <MapPin className="h-3.5 w-3.5" /> {locationLabel}
              </p>
            ) : null}
            {addressLine ? <p className="text-xs">{addressLine}</p> : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Main content: 2/3 left + 1/3 right sidebar */}
      <div className={`grid gap-4 ${hasSidebar ? "lg:grid-cols-3" : ""}`}>
        {/* Left: Profil Bilgileri (2/3) */}
        <div className={`space-y-4 ${hasSidebar ? "lg:col-span-2" : ""}`}>
          <SectionCard icon={<User className="h-4 w-4 text-primary" />} title="Profil Bilgileri">
            <dl className="divide-y divide-border/40">
              {publicAttributes.length > 0 ? (
                publicAttributes.map((attr) => {
                  const val = renderAttributeValue(attr);
                  return (
                    <div
                      key={attr.attribute_key}
                      className="flex items-start gap-4 py-2.5 first:pt-0 last:pb-0"
                    >
                      <dt className="w-36 shrink-0 text-xs font-medium text-muted-foreground pt-0.5">
                        {attr.label}
                      </dt>
                      <dd className="min-w-0 flex-1 text-sm font-medium text-foreground">
                        {val ? (
                          attr.data_type === "url" ? (
                            <a
                              className="break-all text-primary underline-offset-4 hover:underline"
                              href={val}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {val}
                            </a>
                          ) : (
                            val
                          )
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </dd>
                    </div>
                  );
                })
              ) : (
                <p className="py-2 text-sm text-muted-foreground/50">Henüz profil bilgisi eklenmemiş.</p>
              )}
            </dl>
          </SectionCard>
        </div>

        {/* Right sidebar (1/3) */}
        {hasSidebar ? (
          <div className="space-y-4">
            {contacts.length > 0 ? (
              <SectionCard icon={<Phone className="h-4 w-4 text-primary" />} title="İletişim">
                <ul className="space-y-3 text-sm">
                  {contacts.map((contact) => (
                    <li
                      key={`${contact.contact_type}-${contact.contact_value}`}
                      className="flex items-start gap-2.5"
                    >
                      {contactIcon(contact.contact_type)}
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs text-muted-foreground">
                          {contact.label ?? contact.contact_type}
                        </span>
                        {contact.contact_type === "website" || contact.contact_type === "appointment_url" ? (
                          <a
                            className="break-all text-primary underline-offset-4 hover:underline"
                            href={contact.contact_value}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {contact.contact_value}
                          </a>
                        ) : (
                          <span className="text-foreground">{contact.contact_value}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            ) : null}

            {services.length > 0 ? (
              <SectionCard icon={<Briefcase className="h-4 w-4 text-primary" />} title="Hizmetler">
                <div className="flex flex-wrap gap-2">
                  {services.map((service) => (
                    <Badge key={service.service_name} variant="outline" className="text-xs">
                      {service.service_name}
                    </Badge>
                  ))}
                </div>
              </SectionCard>
            ) : null}

            {languages && languages.length > 0 ? (
              <SectionCard icon={<Star className="h-4 w-4 text-primary" />} title="Diller">
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang) => (
                    <Badge key={lang.language_code} variant="secondary" className="text-xs">
                      {lang.language_code}
                      {lang.proficiency ? ` · ${lang.proficiency}` : ""}
                    </Badge>
                  ))}
                </div>
              </SectionCard>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CatalogProfileLayout;
