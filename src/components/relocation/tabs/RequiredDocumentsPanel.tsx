// Gerekli belgeler sekmesi — kategoriye göre gruplu, kutucuk durumu DB'ye yazılır.
//
// Referans uygulamada kutucuk durumu localStorage'daydı (cihaz değişince kayıp).
// Burada relocation_move_progress tablosuna yazılır.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  completionPercent,
  groupDocumentsByCategory,
} from "@/lib/relocation-content-format";
import type { RelocationRequiredDocumentRow } from "@/lib/relocation-content-types";

interface RequiredDocumentsPanelProps {
  documents: RelocationRequiredDocumentRow[];
  /** Tamamlanmış belge id'leri. */
  doneKeys: Set<string>;
  onToggle: (documentId: string, isDone: boolean) => void;
  isLoading?: boolean;
  isSaving?: boolean;
}

export function RequiredDocumentsPanel({
  documents,
  doneKeys,
  onToggle,
  isLoading,
  isSaving,
}: RequiredDocumentsPanelProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Belge listesi yükleniyor…</p>;
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Hedef ülkeniz için belge listesi henüz girilmedi.
          <br />
          Veri eklendiğinde bu sekme kendiliğinden dolar.
        </CardContent>
      </Card>
    );
  }

  const groups = groupDocumentsByCategory(documents);
  const doneCount = documents.filter((doc) => doneKeys.has(doc.id)).length;
  const percent = completionPercent(doneCount, documents.length);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">📄 Gerekli belgeler</CardTitle>
            <span className="text-sm text-muted-foreground">
              {doneCount} / {documents.length} hazır
            </span>
          </div>
          <Progress value={percent} className="mt-2" aria-label="Belge tamamlanma oranı" />
        </CardHeader>
      </Card>

      {groups.map((group) => (
        <Card key={group.category}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{group.category}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {group.documents.map((doc) => {
              const isDone = doneKeys.has(doc.id);
              return (
                <label
                  key={doc.id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
                >
                  <Checkbox
                    checked={isDone}
                    disabled={isSaving}
                    onCheckedChange={(checked) => onToggle(doc.id, checked === true)}
                    className="mt-0.5"
                  />
                  <span className="flex-1">
                    <span
                      className={`block text-sm ${
                        isDone ? "text-muted-foreground line-through" : "text-foreground"
                      }`}
                    >
                      {doc.doc_name}
                    </span>
                    {doc.note && (
                      <span className="block text-xs text-muted-foreground">{doc.note}</span>
                    )}
                  </span>
                </label>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
