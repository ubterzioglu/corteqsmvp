// Brainstorming — admin sayfası.
// Eski public /statusreport3006 sayfasının admin sürümü: sol panelde bölüm listesi,
// sağ panelde seçili bölümün satırları + yorum thread'i. Tüm adminler ortak
// görür/düzenler/yorum yazar. DB katmanı: src/lib/brainstorming-api.ts.

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lightbulb, Plus } from "lucide-react";

import { BrainstormingCommentThread } from "@/components/admin/brainstorming/BrainstormingCommentThread";
import { BrainstormingRowTable } from "@/components/admin/brainstorming/BrainstormingRowTable";
import { BrainstormingSectionList } from "@/components/admin/brainstorming/BrainstormingSectionList";
import { RowFormDialog } from "@/components/admin/brainstorming/RowFormDialog";
import { SectionFormDialog } from "@/components/admin/brainstorming/SectionFormDialog";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
  AdminPageShell,
} from "@/components/admin/page";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  createRow,
  createSection,
  deleteRow,
  deleteSection,
  fetchSections,
  reorderRows,
  reorderSections,
  updateRow,
  updateSection,
  type BrainstormingRow,
  type BrainstormingSection,
} from "@/lib/brainstorming-api";
import type {
  BrainstormingRowForm,
  BrainstormingSectionForm,
} from "@/lib/brainstorming-schemas";

const SECTIONS_KEY = ["brainstorming-sections"] as const;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Bilinmeyen hata";
}

function swap<T>(list: T[], indexA: number, indexB: number): T[] {
  const next = [...list];
  [next[indexA], next[indexB]] = [next[indexB], next[indexA]];
  return next;
}

const AdminBrainstormingPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [sectionFormOpen, setSectionFormOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<BrainstormingSection | null>(null);
  const [rowFormOpen, setRowFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<BrainstormingRow | null>(null);

  const sectionsQuery = useQuery({
    queryKey: SECTIONS_KEY,
    queryFn: fetchSections,
  });
  const sections = useMemo(() => sectionsQuery.data ?? [], [sectionsQuery.data]);

  useEffect(() => {
    if (!selectedSectionId && sections.length > 0) {
      setSelectedSectionId(sections[0].id);
    }
  }, [sections, selectedSectionId]);

  const selectedSection = sections.find((section) => section.id === selectedSectionId) ?? null;

  const invalidateSections = () => queryClient.invalidateQueries({ queryKey: SECTIONS_KEY });

  const sectionMutation = useMutation({
    mutationFn: (form: BrainstormingSectionForm) =>
      editingSection
        ? updateSection(editingSection.id, form)
        : createSection(form, sections.length),
    onSuccess: async (saved) => {
      const wasCreate = !editingSection;
      setSectionFormOpen(false);
      setEditingSection(null);
      await invalidateSections();
      toast({ title: wasCreate ? "Bölüm oluşturuldu" : "Bölüm güncellendi" });
      if (wasCreate) setSelectedSectionId(saved.id);
    },
    onError: (error: unknown) => {
      toast({ title: "İşlem başarısız", description: errorMessage(error), variant: "destructive" });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (id: string) => deleteSection(id),
    onSuccess: async (_data, id) => {
      if (selectedSectionId === id) setSelectedSectionId(null);
      await invalidateSections();
      toast({ title: "Bölüm silindi" });
    },
    onError: (error: unknown) => {
      toast({ title: "Silinemedi", description: errorMessage(error), variant: "destructive" });
    },
  });

  const reorderSectionsMutation = useMutation({
    mutationFn: (orderedIds: string[]) => reorderSections(orderedIds),
    onSuccess: () => invalidateSections(),
    onError: (error: unknown) => {
      toast({ title: "Sıralama kaydedilemedi", description: errorMessage(error), variant: "destructive" });
    },
  });

  const rowMutation = useMutation({
    mutationFn: (form: BrainstormingRowForm) => {
      if (!selectedSection) throw new Error("Önce bir bölüm seçin.");
      return editingRow
        ? updateRow(editingRow.id, form)
        : createRow(selectedSection.id, form, selectedSection.rows.length);
    },
    onSuccess: async () => {
      const wasCreate = !editingRow;
      setRowFormOpen(false);
      setEditingRow(null);
      await invalidateSections();
      toast({ title: wasCreate ? "Satır oluşturuldu" : "Satır güncellendi" });
    },
    onError: (error: unknown) => {
      toast({ title: "İşlem başarısız", description: errorMessage(error), variant: "destructive" });
    },
  });

  const deleteRowMutation = useMutation({
    mutationFn: (id: string) => deleteRow(id),
    onSuccess: async () => {
      await invalidateSections();
      toast({ title: "Satır silindi" });
    },
    onError: (error: unknown) => {
      toast({ title: "Silinemedi", description: errorMessage(error), variant: "destructive" });
    },
  });

  const reorderRowsMutation = useMutation({
    mutationFn: (orderedIds: string[]) => reorderRows(orderedIds),
    onSuccess: () => invalidateSections(),
    onError: (error: unknown) => {
      toast({ title: "Sıralama kaydedilemedi", description: errorMessage(error), variant: "destructive" });
    },
  });

  const openCreateSection = () => {
    setEditingSection(null);
    setSectionFormOpen(true);
  };

  const openEditSection = (section: BrainstormingSection) => {
    setEditingSection(section);
    setSectionFormOpen(true);
  };

  const moveSectionUp = (section: BrainstormingSection) => {
    const index = sections.findIndex((s) => s.id === section.id);
    if (index <= 0) return;
    reorderSectionsMutation.mutate(swap(sections, index, index - 1).map((s) => s.id));
  };

  const moveSectionDown = (section: BrainstormingSection) => {
    const index = sections.findIndex((s) => s.id === section.id);
    if (index === -1 || index >= sections.length - 1) return;
    reorderSectionsMutation.mutate(swap(sections, index, index + 1).map((s) => s.id));
  };

  const openCreateRow = () => {
    setEditingRow(null);
    setRowFormOpen(true);
  };

  const openEditRow = (row: BrainstormingRow) => {
    setEditingRow(row);
    setRowFormOpen(true);
  };

  const moveRowUp = (row: BrainstormingRow) => {
    if (!selectedSection) return;
    const index = selectedSection.rows.findIndex((r) => r.id === row.id);
    if (index <= 0) return;
    reorderRowsMutation.mutate(swap(selectedSection.rows, index, index - 1).map((r) => r.id));
  };

  const moveRowDown = (row: BrainstormingRow) => {
    if (!selectedSection) return;
    const index = selectedSection.rows.findIndex((r) => r.id === row.id);
    if (index === -1 || index >= selectedSection.rows.length - 1) return;
    reorderRowsMutation.mutate(swap(selectedSection.rows, index, index + 1).map((r) => r.id));
  };

  return (
    <AdminPageShell
      title="Brainstorming"
      description="Cadde 3.0 & Premium Panel durum ve karar raporu — tüm adminler ortak görür, düzenler ve yorum yazar."
      icon={Lightbulb}
      accent="emerald"
      contentWidth="wide"
      actions={
        <Button onClick={openCreateSection}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Bölüm
        </Button>
      }
    >
      {sectionsQuery.isLoading ? (
        <AdminLoadingState label="Bölümler yükleniyor" rows={4} />
      ) : sectionsQuery.isError ? (
        <AdminErrorState description="Bölümler yüklenemedi." onRetry={() => sectionsQuery.refetch()} />
      ) : sections.length === 0 ? (
        <AdminEmptyState
          icon={Lightbulb}
          title="Henüz bölüm yok"
          description="İlk bölümü oluşturarak başlayın."
          action={
            <Button onClick={openCreateSection} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Bölüm
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="min-w-0">
            <BrainstormingSectionList
              sections={sections}
              selectedId={selectedSectionId}
              onSelect={setSelectedSectionId}
              onEdit={openEditSection}
              onDelete={(section) => deleteSectionMutation.mutate(section.id)}
              onMoveUp={moveSectionUp}
              onMoveDown={moveSectionDown}
              isReordering={reorderSectionsMutation.isPending}
            />
          </div>

          <div className="min-w-0 space-y-4">
            {selectedSection ? (
              <>
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {selectedSection.groupLabel ? (
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {selectedSection.groupLabel}
                        </p>
                      ) : null}
                      <h2 className="text-base font-semibold text-foreground">
                        {selectedSection.title}
                      </h2>
                      {selectedSection.intro ? (
                        <p className="mt-1 text-sm text-muted-foreground">{selectedSection.intro}</p>
                      ) : null}
                    </div>
                    <Button onClick={openCreateRow} size="sm" className="shrink-0">
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Yeni Satır
                    </Button>
                  </div>

                  {selectedSection.rows.length === 0 ? (
                    <AdminEmptyState
                      title="Bu bölümde henüz satır yok"
                      description="İlk satırı oluşturarak başlayın."
                      action={
                        <Button onClick={openCreateRow} size="sm" variant="outline">
                          <Plus className="mr-2 h-4 w-4" />
                          Yeni Satır
                        </Button>
                      }
                    />
                  ) : (
                    <BrainstormingRowTable
                      rows={selectedSection.rows}
                      onEdit={openEditRow}
                      onDelete={(row) => deleteRowMutation.mutate(row.id)}
                      onMoveUp={moveRowUp}
                      onMoveDown={moveRowDown}
                      isReordering={reorderRowsMutation.isPending}
                    />
                  )}
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Yorumlar</h3>
                  <BrainstormingCommentThread sectionKey={selectedSection.sectionKey} />
                </div>
              </>
            ) : (
              <AdminEmptyState title="Bir bölüm seçin" description="Soldaki listeden bir bölüm seçin." />
            )}
          </div>
        </div>
      )}

      <SectionFormDialog
        open={sectionFormOpen}
        onOpenChange={(open) => {
          setSectionFormOpen(open);
          if (!open) setEditingSection(null);
        }}
        section={editingSection}
        onSubmit={(form) => sectionMutation.mutate(form)}
        isSubmitting={sectionMutation.isPending}
      />

      <RowFormDialog
        open={rowFormOpen}
        onOpenChange={(open) => {
          setRowFormOpen(open);
          if (!open) setEditingRow(null);
        }}
        row={editingRow}
        onSubmit={(form) => rowMutation.mutate(form)}
        isSubmitting={rowMutation.isPending}
      />
    </AdminPageShell>
  );
};

export default AdminBrainstormingPage;
