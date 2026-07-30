// Cadde Workshop — admin madde panosu.
// Kaynak: 30.07.2026 Cadde workshop transkripti (caddeworkshdp.md).
// DB katmanı: src/lib/admin-shell/workshop-items.ts (RLS: admin-only, ortak).
//
// Format kararı workshop'ta alındı: yalnız maddeler + UBT/Burak onay kutuları,
// yorum yok. İki onay tamamsa madde bitmiş sayılır.

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Hammer, Plus } from "lucide-react";

import { WorkshopItemRow } from "@/components/admin/workshop/WorkshopItemRow";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminFilterBar,
  AdminLoadingState,
  AdminPageShell,
  AdminStatsGrid,
} from "@/components/admin/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  calculateWorkshopProgress,
  collectWorkshopSections,
  createWorkshopItem,
  deleteWorkshopItem,
  fetchWorkshopItems,
  filterWorkshopItems,
  groupWorkshopItems,
  setWorkshopItemApproval,
  updateWorkshopItem,
  type WorkshopItemDraft,
  type WorkshopOwner,
  type WorkshopStatusFilter,
} from "@/lib/admin-shell/workshop-items";

const WORKSHOP_KEY = "cadde";
const ITEMS_KEY = ["workshop-items", WORKSHOP_KEY] as const;

const STATUS_OPTIONS: { value: WorkshopStatusFilter; label: string }[] = [
  { value: "all", label: "Tüm maddeler" },
  { value: "open", label: "Bekleyenler" },
  { value: "completed", label: "Tamamlananlar" },
];

const NEW_SECTION_VALUE = "__new__";

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

const AdminWorkshopCaddePage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<WorkshopStatusFilter>("all");
  const [searchText, setSearchText] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newSection, setNewSection] = useState("");
  const [customSection, setCustomSection] = useState("");

  const itemsQuery = useQuery({
    queryKey: ITEMS_KEY,
    queryFn: () => fetchWorkshopItems(WORKSHOP_KEY),
  });
  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);

  const progress = useMemo(() => calculateWorkshopProgress(items), [items]);
  const sectionOptions = useMemo(() => collectWorkshopSections(items), [items]);

  const visibleSections = useMemo(
    () => groupWorkshopItems(filterWorkshopItems(items, { search: searchText, status: statusFilter })),
    [items, searchText, statusFilter],
  );

  const hasActiveFilters = statusFilter !== "all" || searchText.trim().length > 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ITEMS_KEY });

  const showError = (error: unknown) => {
    toast({
      title: "İşlem başarısız",
      description: error instanceof Error ? error.message : "Bilinmeyen hata",
      variant: "destructive",
    });
  };

  const approvalMutation = useMutation({
    mutationFn: ({ id, owner, done }: { id: string; owner: WorkshopOwner; done: boolean }) =>
      setWorkshopItemApproval(id, owner, done),
    onSuccess: invalidate,
    onError: showError,
  });

  const createMutation = useMutation({
    mutationFn: (draft: WorkshopItemDraft) => createWorkshopItem(WORKSHOP_KEY, draft),
    onSuccess: async () => {
      setNewTitle("");
      setCustomSection("");
      await invalidate();
      toast({ title: "Madde eklendi" });
    },
    onError: showError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, draft }: { id: string; draft: WorkshopItemDraft }) =>
      updateWorkshopItem(id, draft),
    onSuccess: async () => {
      await invalidate();
      toast({ title: "Madde güncellendi" });
    },
    onError: showError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWorkshopItem(id),
    onSuccess: async () => {
      await invalidate();
      toast({ title: "Madde silindi" });
    },
    onError: showError,
  });

  const resolvedNewSection =
    newSection === NEW_SECTION_VALUE || newSection === "" ? customSection : newSection;

  const submitNewItem = () => {
    if (!newTitle.trim()) {
      toast({ title: "Madde metni boş bırakılamaz.", variant: "destructive" });
      return;
    }
    createMutation.mutate({ title: newTitle, section: resolvedNewSection });
  };

  return (
    <AdminPageShell
      title="Cadde Workshop"
      eyebrow="Workshop"
      description="30.07.2026 Cadde workshop maddeleri. Bir madde UBT ve Burak onayını da aldığında bitmiş sayılır."
      icon={Hammer}
      accent="emerald"
      contentWidth="wide"
      stats={
        <AdminStatsGrid columns={4}>
          <StatCard label="Toplam madde" value={String(progress.total)} />
          <StatCard
            label="UBT onayı"
            value={`${progress.ubtDone}/${progress.total}`}
            hint="UBT işaretledi"
          />
          <StatCard
            label="Burak onayı"
            value={`${progress.burakDone}/${progress.total}`}
            hint="Burak işaretledi"
          />
          <StatCard
            label="Tamamlanan"
            value={`${progress.completed}/${progress.total}`}
            hint={`%${progress.percent} — iki onay tamam`}
          />
        </AdminStatsGrid>
      }
      filters={
        <AdminFilterBar onReset={hasActiveFilters ? () => {
          setStatusFilter("all");
          setSearchText("");
        } : undefined}>
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Madde ara…"
            className="h-9 w-full sm:w-72"
          />
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as WorkshopStatusFilter)}>
            <SelectTrigger className="h-9 w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </AdminFilterBar>
      }
    >
      <Progress value={progress.percent} className="h-2" aria-label="Workshop tamamlanma oranı" />

      {itemsQuery.isLoading ? <AdminLoadingState /> : null}

      {itemsQuery.isError ? (
        <AdminErrorState
          description="Workshop maddeleri yüklenemedi."
          onRetry={() => itemsQuery.refetch()}
        />
      ) : null}

      {!itemsQuery.isLoading && !itemsQuery.isError && visibleSections.length === 0 ? (
        <AdminEmptyState
          title={hasActiveFilters ? "Filtreye uyan madde yok" : "Henüz madde yok"}
          description={
            hasActiveFilters
              ? "Filtreleri sıfırlayıp tekrar deneyin."
              : "Aşağıdaki formdan ilk maddeyi ekleyebilirsiniz."
          }
        />
      ) : null}

      {visibleSections.map((group) => (
        <Card key={group.section || "genel"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              {group.section || "Genel"}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {group.items.filter((item) => item.ubtDone && item.burakDone).length}/{group.items.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-1">
            <ul className="flex flex-col">
              {group.items.map((item) => (
                <WorkshopItemRow
                  key={item.id}
                  item={item}
                  disabled={approvalMutation.isPending || deleteMutation.isPending}
                  onToggle={(owner, done) => approvalMutation.mutate({ id: item.id, owner, done })}
                  onSave={(draft) => updateMutation.mutate({ id: item.id, draft })}
                  onDelete={() => deleteMutation.mutate(item.id)}
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Yeni madde ekle</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={newSection} onValueChange={setNewSection}>
            <SelectTrigger className="h-9 w-full sm:w-56">
              <SelectValue placeholder="Bölüm seç" />
            </SelectTrigger>
            <SelectContent>
              {sectionOptions.map((section) => (
                <SelectItem key={section} value={section}>
                  {section}
                </SelectItem>
              ))}
              <SelectItem value={NEW_SECTION_VALUE}>Yeni bölüm…</SelectItem>
            </SelectContent>
          </Select>

          {newSection === NEW_SECTION_VALUE ? (
            <Input
              value={customSection}
              onChange={(event) => setCustomSection(event.target.value)}
              placeholder="Bölüm adı"
              className="h-9 w-full sm:w-48"
            />
          ) : null}

          <Input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submitNewItem();
            }}
            placeholder="Madde metni"
            className="h-9 flex-1"
          />

          <Button type="button" onClick={submitNewItem} disabled={createMutation.isPending}>
            <Plus aria-hidden="true" className="mr-1.5 h-4 w-4" />
            Ekle
          </Button>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
};

export default AdminWorkshopCaddePage;
