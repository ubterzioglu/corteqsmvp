// Güvenli eşleşme kartları — match_list result_kind (#5 diaspora matchmaker).
// İsim/iletişim GÖSTERMEZ; yalnızca anonim özet + uyum skoru + "tanışma isteği" CTA.
// Doğrudan iletişim karşılıklı onay (accept) sonrası açılır — bu kart o akışı başlatır.
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MatchCard {
  key?: string; // candidate user_id (yalnızca intro istemek için)
  title?: string;
  score?: number;
  role?: string | null;
  location?: string | null;
  profession?: string | null;
  languages?: string[];
  intro?: string | null;
  [extra: string]: unknown;
}

interface MatchListProps {
  title: string;
  matches: MatchCard[];
  /** Tanışma isteği gönder (candidate_id ile). */
  onRequestIntro?: (candidateId: string) => void;
}

export function MatchList({ title, matches, onRequestIntro }: MatchListProps) {
  if (matches.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {matches.map((m, idx) => (
          <div key={m.key ?? idx} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground">{m.title ?? "Diaspora üyesi"}</span>
              {typeof m.score === "number" && (
                <Badge variant="secondary">{Math.round(m.score)}/100</Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {m.location && <span>📍 {m.location}</span>}
              {m.profession && <span>💼 {m.profession}</span>}
              {Array.isArray(m.languages) && m.languages.length > 0 && (
                <span>🗣 {m.languages.join(", ")}</span>
              )}
            </div>
            {m.intro && <p className="mt-2 text-sm text-foreground">{m.intro}</p>}
            {onRequestIntro && typeof m.key === "string" && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => onRequestIntro(m.key as string)}
              >
                Tanışma İsteği Gönder
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
