// "Dökümanlarım" sekmesi — taşınma dosyasına kaydedilmiş rapor/checklist/sohbet.
//
// Referansta bu liste localStorage'daydı; burada relocation_move_documents'tan gelir,
// yani cihaz değişince kaybolmaz.

import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  RelocationMoveDocumentRow,
  RelocationMoveDocumentType,
} from "@/lib/relocation-content-types";

const TYPE_LABELS: Record<RelocationMoveDocumentType, string> = {
  checklist: "Checklist",
  chat: "Sohbet",
  report: "Rapor",
  costs: "Masraflar",
};

const TYPE_ICONS: Record<RelocationMoveDocumentType, string> = {
  checklist: "📋",
  chat: "💬",
  report: "📊",
  costs: "💰",
};

interface SavedDocumentsPanelProps {
  documents: RelocationMoveDocumentRow[];
  onDelete: (documentId: string) => void;
  isLoading?: boolean;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(
    date,
  );
}

export function SavedDocumentsPanel({
  documents,
  onDelete,
  isLoading,
}: SavedDocumentsPanelProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Dökümanlar yükleniyor…</p>;
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Henüz kaydedilmiş döküman yok.
          <br />
          Sohbet ve masraf özetlerini buraya kaydedebilirsiniz.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <Card key={doc.id}>
          <CardContent className="py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span aria-hidden>{TYPE_ICONS[doc.doc_type] ?? "📄"}</span>
                  <span className="truncate text-sm font-semibold">{doc.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {TYPE_LABELS[doc.doc_type] ?? doc.doc_type}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(doc.created_at)}</p>
                <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-2 text-xs text-foreground">
                  {doc.content}
                </pre>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`${doc.title} dökümanını sil`}
                onClick={() => onDelete(doc.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
