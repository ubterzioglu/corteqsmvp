import { useState } from "react";
import { ExternalLink, CheckCircle, XCircle, Copy, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { RadarCandidate, RelevanceReason } from "@/lib/radarNewsPipeline";

type Props = {
  candidate: RadarCandidate;
  onApprovePool: (id: string, note?: string) => Promise<void>;
  onApprovePublish: (id: string, note?: string) => Promise<void>;
  onReject: (id: string, note?: string) => Promise<void>;
  onMarkDuplicate: (id: string) => void;
};

const CATEGORY_LABELS: Record<string, string> = {
  diaspora: "Diaspora",
  almanya: "Almanya",
  turkiye: "Türkiye",
  avrupa: "Avrupa",
  dunya: "Dünya",
  gocmenlik_oturum: "Göçmenlik / Oturum",
  vatandaslik: "Vatandaşlık",
  is_kariyer: "İş / Kariyer",
  ekonomi_girisimcilik: "Ekonomi / Girişim",
  egitim: "Eğitim",
  topluluk_etkinlik: "Topluluk / Etkinlik",
  yasam: "Yaşam",
  teknoloji: "Teknoloji",
  duyuru: "Duyuru",
  diger: "Diğer",
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 50 ? "bg-green-500" : score >= 25 ? "bg-amber-400" : "bg-muted";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
      <span className="text-xs font-medium tabular-nums">{score.toFixed(0)}</span>
    </div>
  );
}

function ReasonTags({ reasons }: { reasons: RelevanceReason[] }) {
  if (!reasons.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {reasons.map((r, i) => (
        <span
          key={i}
          className={`rounded px-1.5 py-0.5 text-xs ${r.score < 0 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}
        >
          {r.rule}{r.value ? `: ${r.value}` : ""} ({r.score > 0 ? "+" : ""}{r.score})
        </span>
      ))}
    </div>
  );
}

function formatDate(val: string | null) {
  if (!val) return "—";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(val));
}

export function RadarCandidateCard({ candidate, onApprovePool, onApprovePublish, onReject, onMarkDuplicate }: Props) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"pool" | "publish" | "reject" | null>(null);

  const handle = async (action: "pool" | "publish" | "reject") => {
    setBusy(action);
    try {
      if (action === "pool") await onApprovePool(candidate.id, note || undefined);
      else if (action === "publish") await onApprovePublish(candidate.id, note || undefined);
      else await onReject(candidate.id, note || undefined);
    } finally {
      setBusy(null);
    }
  };

  const categoryLabel = candidate.category ? (CATEGORY_LABELS[candidate.category] ?? candidate.category) : null;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1">
            <p className="font-semibold leading-snug text-foreground">{candidate.title}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{candidate.source_name}</span>
              {candidate.language && <Badge variant="outline" className="h-4 px-1 text-[10px]">{candidate.language.toUpperCase()}</Badge>}
              {categoryLabel && <Badge variant="secondary" className="h-4 px-1 text-[10px]">{categoryLabel}</Badge>}
              {candidate.country && <span>{candidate.country}</span>}
              {candidate.city && <span>• {candidate.city}</span>}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <ScoreBar score={candidate.relevance_score} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {candidate.summary && (
          <p className="text-sm text-muted-foreground line-clamp-3">{candidate.summary}</p>
        )}

        <ReasonTags reasons={candidate.relevance_reasons} />

        {candidate.image_source_url && (
          <div className="overflow-hidden rounded-md border border-border">
            <img
              src={candidate.image_source_url}
              alt={candidate.title}
              className="h-32 w-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <p className="px-2 py-1 text-[10px] text-muted-foreground">
              Yalnızca admin önizleme — harici URL, public'e açılmaz
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>Yayın: {formatDate(candidate.published_at)}</span>
          <span>Sisteme giriş: {formatDate(candidate.created_at)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <a href={candidate.original_url} target="_blank" rel="noreferrer noopener">
              <ExternalLink className="mr-1 h-3 w-3" />
              Kaynağa git
            </a>
          </Button>
        </div>

        {candidate.review_status === "pending" && (
          <>
            <Textarea
              placeholder="Not (opsiyonel)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => void handle("publish")}
                disabled={busy !== null}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {busy === "publish" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle className="mr-1 h-3 w-3" />}
                Onayla ve Radar'a Yayınla
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handle("pool")}
                disabled={busy !== null}
              >
                {busy === "pool" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                Sadece Haber Havuzuna Onayla
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onMarkDuplicate(candidate.id)}
                disabled={busy !== null}
              >
                <Copy className="mr-1 h-3 w-3" />
                Duplicate
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => void handle("reject")}
                disabled={busy !== null}
              >
                {busy === "reject" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <XCircle className="mr-1 h-3 w-3" />}
                Reddet
              </Button>
            </div>
          </>
        )}

        {candidate.review_status !== "pending" && (
          <Badge
            variant={candidate.review_status === "approved" ? "outline" : "secondary"}
            className="capitalize"
          >
            {candidate.review_status}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
