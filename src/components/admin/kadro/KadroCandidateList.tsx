import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KADRO_CANDIDATE_STAGES } from "@/lib/kadro/kadro-taxonomy";
import type { KadroCandidate, KadroCandidateDraft, KadroCandidateStage } from "@/lib/kadro/kadro-types";
import { Plus, Trash2, Edit2, Check } from "lucide-react";

interface KadroCandidateListProps {
  candidates: KadroCandidate[];
  isLoading: boolean;
  onCreate: (draft: KadroCandidateDraft) => void;
  onUpdate: (candidateId: string, draft: KadroCandidateDraft) => void;
  onDelete: (candidateId: string) => void;
}

export function KadroCandidateList({
  candidates,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
}: KadroCandidateListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<KadroCandidateDraft>({
    fullName: "",
    links: "",
    stage: "aday",
    note: "",
  });

  const handleAdd = () => {
    if (!draft.fullName.trim()) return;
    onCreate(draft);
    setDraft({ fullName: "", links: "", stage: "aday", note: "" });
    setIsAdding(false);
  };

  const handleUpdate = (candidateId: string) => {
    if (!draft.fullName.trim()) return;
    onUpdate(candidateId, draft);
    setEditingId(null);
    setDraft({ fullName: "", links: "", stage: "aday", note: "" });
  };

  const startEdit = (candidate: KadroCandidate) => {
    setEditingId(candidate.id);
    setDraft({
      fullName: candidate.fullName,
      links: candidate.links ?? "",
      stage: candidate.stage,
      note: candidate.note ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({ fullName: "", links: "", stage: "aday", note: "" });
  };

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Adaylar ({candidates.length})
        </h3>
        {!isAdding && (
          <Button size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Aday Ekle
          </Button>
        )}
      </div>

      {isAdding && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Yeni Aday</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Ad Soyad"
              value={draft.fullName}
              onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
            />
            <Input
              placeholder="LinkedIn, GitHub vb. linkler"
              value={draft.links}
              onChange={(e) => setDraft({ ...draft, links: e.target.value })}
            />
            <Select
              value={draft.stage}
              onValueChange={(value) => setDraft({ ...draft, stage: value as KadroCandidateStage })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Aşama" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(KADRO_CANDIDATE_STAGES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Notlar"
              value={draft.note}
              onChange={(e) => setDraft({ ...draft, note: e.target.value })}
              rows={2}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={!draft.fullName.trim()}>
                Ekle
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>
                İptal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {candidates.length === 0 && !isAdding ? (
        <div className="text-center py-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Henüz aday yok</p>
        </div>
      ) : (
        <div className="space-y-2">
          {candidates.map((candidate) => (
            <Card key={candidate.id}>
              <CardContent className="pt-4">
                {editingId === candidate.id ? (
                  <div className="space-y-3">
                    <Input
                      placeholder="Ad Soyad"
                      value={draft.fullName}
                      onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
                    />
                    <Input
                      placeholder="LinkedIn, GitHub vb. linkler"
                      value={draft.links}
                      onChange={(e) => setDraft({ ...draft, links: e.target.value })}
                    />
                    <Select
                      value={draft.stage}
                      onValueChange={(value) => setDraft({ ...draft, stage: value as KadroCandidateStage })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Aşama" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(KADRO_CANDIDATE_STAGES).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Notlar"
                      value={draft.note}
                      onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdate(candidate.id)}>
                        <Check className="w-4 h-4 mr-1" />
                        Kaydet
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        İptal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-slate-900 dark:text-slate-100">
                          {candidate.fullName}
                        </div>
                        {candidate.links && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {candidate.links}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(candidate)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(candidate.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                        {KADRO_CANDIDATE_STAGES[candidate.stage]}
                      </span>
                    </div>
                    {candidate.note && (
                      <div className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        {candidate.note}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
