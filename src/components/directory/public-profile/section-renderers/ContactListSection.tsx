import { Globe, Link as LinkIcon, Mail, Phone } from "lucide-react";

import type { ContactRowViewModel } from "@/lib/public-catalog-profile-view-model";

import type { PublicSectionRendererProps } from "./renderer-registry";

const contactIcon = (type: string) => {
  if (type === "phone" || type === "whatsapp") return <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />;
  if (type === "email") return <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />;
  if (type === "website" || type === "appointment_url") return <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />;
  return <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />;
};

const isContactRow = (row: unknown): row is ContactRowViewModel =>
  typeof row === "object" &&
  row !== null &&
  typeof (row as ContactRowViewModel).value === "string" &&
  typeof (row as ContactRowViewModel).label === "string";

const ContactListSection = ({ section }: PublicSectionRendererProps) => {
  const contacts = Array.isArray(section.content.contacts)
    ? section.content.contacts.filter(isContactRow)
    : [];
  if (contacts.length === 0) return null;

  return (
    <ul className="space-y-3 text-sm">
      {contacts.map((contact) => (
        <li key={contact.key ?? `${contact.type}-${contact.value}`} className="flex items-start gap-2.5">
          {contactIcon(contact.type)}
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-muted-foreground">{contact.label}</span>
            {contact.href ? (
              <a
                href={contact.href}
                {...(contact.external ? { target: "_blank", rel: "noreferrer" } : {})}
                className="break-all font-medium text-primary underline-offset-4 hover:underline"
              >
                {contact.value}
              </a>
            ) : (
              <span className="break-all font-medium text-foreground">{contact.value}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default ContactListSection;
