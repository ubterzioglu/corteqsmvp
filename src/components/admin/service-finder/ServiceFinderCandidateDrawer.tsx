// Aday inceleme çekmecesi — kanıtlar, düzenlenebilir projeksiyon,
// onay/ret/yayınlama aksiyonları (scrapper_plan.md §Job detail wireframe).
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  usePublishServiceFinderCandidate,
  useReviewServiceFinderCandidate,
} from "@/hooks/useServiceFinder";
import { formatConfidence, formatUsd } from "@/lib/service-finder-format";
import type {
  CandidatePatch,
  ServiceFinderCandidateRow,
} from "@/lib/service-finder-schemas";
import { ServiceFinderReviewStatusBadge } from "./ServiceFinderBadges";

interface ServiceFinderCandidateDrawerProps {
  candidate: ServiceFinderCandidateRow | null;
  onClose: () => void;
}

function joinList(values: string[] | undefined): string {
  return (values ?? []).join(", ");
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function ServiceFinderCandidateDrawer({ candidate, onClose }: ServiceFinderCandidateDrawerProps) {
  const review = useReviewServiceFinderCandidate();
  const publish = usePublishServiceFinderCandidate();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [services, setServices] = useState("");
  const [languages, setLanguages] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (candidate) {
      setName(candidate.canonical_name);
      setCity(candidate.city ?? "");
      setServices(joinList(candidate.services));
      setLanguages(joinList(candidate.languages));
      setWebsite(candidate.website_url ?? "");
      setNotes(candidate.review_notes ?? "");
    }
  }, [candidate]);

  if (!candidate) return null;

  const buildPatch = (): CandidatePatch => ({
    canonical_name: name || undefined,
    city: city || null,
    services: splitList(services),
    languages: splitList(languages),
    website_url: website || null,
    review_notes: notes || null,
  });

  const isPublished = candidate.review_status === "published";
  const busy = review.isPending || publish.isPending;

  return (
    <Sheet open={Boolean(candidate)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {candidate.canonical_name}
            <ServiceFinderReviewStatusBadge status={candidate.review_status} />
          </SheetTitle>
          <SheetDescription>
            Güven: {formatConfidence(candidate.confidence_score)} · Maliyet:{" "}
            {formatUsd(candidate.cost_total_usd)} · Model: {candidate.classifier_model ?? "—"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 py-4">
          {/* Kanıtlar */}
          <div>
            <h4 className="mb-2 text-sm font-semibold">Kanıt alıntıları</h4>
            {candidate.evidence.length === 0 && (
              <p className="text-sm text-muted-foreground">Kanıt alıntısı yok.</p>
            )}
            <ul className="space-y-2">
              {candidate.evidence.map((entry, index) => (
                <li key={index} className="rounded-md border bg-muted/40 p-2 text-sm italic">
                  “{entry.quote}”
                </li>
              ))}
            </ul>
            <div className="mt-2 space-y-1">
              {(candidate.source_urls ?? []).map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {url}
                </a>
              ))}
            </div>
          </div>

          <Separator />

          {/* Düzenlenebilir alanlar */}
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="sf-cand-name">İsim</Label>
              <Input id="sf-cand-name" value={name} onChange={(event) => setName(event.target.value)} disabled={isPublished} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sf-cand-city">Şehir</Label>
              <Input id="sf-cand-city" value={city} onChange={(event) => setCity(event.target.value)} disabled={isPublished} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sf-cand-services">Hizmetler (virgülle)</Label>
              <Input id="sf-cand-services" value={services} onChange={(event) => setServices(event.target.value)} disabled={isPublished} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sf-cand-langs">Diller (virgülle)</Label>
              <Input id="sf-cand-langs" value={languages} onChange={(event) => setLanguages(event.target.value)} disabled={isPublished} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sf-cand-web">Web sitesi</Label>
              <Input id="sf-cand-web" value={website} onChange={(event) => setWebsite(event.target.value)} disabled={isPublished} />
            </div>
            <div className="grid gap-1.5">
              <Label>İletişim</Label>
              <ul className="space-y-1 text-sm">
                {candidate.contacts.map((contact, index) => (
                  <li key={index} className="text-muted-foreground">
                    <span className="font-medium text-foreground">{contact.type}:</span> {contact.value}
                  </li>
                ))}
                {candidate.contacts.length === 0 && (
                  <li className="text-muted-foreground">İletişim bilgisi yok.</li>
                )}
              </ul>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sf-cand-notes">İnceleme notu</Label>
              <Textarea id="sf-cand-notes" value={notes} onChange={(event) => setNotes(event.target.value)} disabled={isPublished} rows={2} />
            </div>
          </div>
        </div>

        {/* Aksiyonlar */}
        {!isPublished && (
          <div className="sticky bottom-0 flex flex-wrap gap-2 border-t bg-background py-3">
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() =>
                review.mutate({ candidateId: candidate.id, action: "approved", patch: buildPatch() })
              }
            >
              Onayla
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() =>
                review.mutate({ candidateId: candidate.id, action: "needs_edit", patch: buildPatch() })
              }
            >
              Düzenleme Gerekli
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={busy}
              onClick={() => review.mutate({ candidateId: candidate.id, action: "rejected", patch: { review_notes: notes || null } })}
            >
              Reddet
            </Button>
            <Button
              size="sm"
              className="ml-auto"
              disabled={busy || candidate.review_status === "rejected"}
              onClick={() =>
                publish.mutate(
                  { candidateId: candidate.id, patch: buildPatch() },
                  { onSuccess: () => onClose() },
                )
              }
            >
              {publish.isPending ? "Yayınlanıyor..." : "Kataloğa Yayınla"}
            </Button>
          </div>
        )}

        {isPublished && candidate.catalog_item_id && (
          <div className="border-t py-3 text-sm text-muted-foreground">
            Katalog kaydı: <code className="text-xs">{candidate.catalog_item_id}</code>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
