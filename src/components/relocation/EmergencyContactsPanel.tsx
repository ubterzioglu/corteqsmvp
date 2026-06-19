// Acil iletişim paneli — ülke/şehir bazlı acil numara ve kurumlar.
import { Card, CardContent } from "@/components/ui/card";
import { Phone, ExternalLink } from "lucide-react";
import type { RelocationEmergencyContactRow } from "@/lib/relocation-types";

interface EmergencyContactsPanelProps {
  contacts: RelocationEmergencyContactRow[];
  emptyLabel: string;
}

export function EmergencyContactsPanel({ contacts, emptyLabel }: EmergencyContactsPanelProps) {
  if (contacts.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">{emptyLabel}</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {contacts.map((contact) => (
        <Card key={contact.id}>
          <CardContent className="flex items-center justify-between gap-3 pt-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{contact.label}</p>
              <p className="text-xs text-muted-foreground">{contact.country_code}</p>
            </div>
            {contact.phone ? (
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                <Phone className="h-4 w-4" /> {contact.phone}
              </a>
            ) : contact.url ? (
              <a
                href={contact.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Bağlantı <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
