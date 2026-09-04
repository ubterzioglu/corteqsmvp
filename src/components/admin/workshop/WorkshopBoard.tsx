// Workshop madde panosu — her /admin/workshop/<key> sayfasının ortak gövdesi.
// Kaynak: 30.07.2026 Cadde workshop'unda alınan format kararı — yalnız maddeler +
// UBT/Burak onay kutuları, yorum yok. İki onay tamamsa madde bitmiş sayılır.
//
// Sayfalar (AdminWorkshopCaddePage / AdminWorkshopProfilPage) bu bileşeni yalnız
// workshopKey ve başlık metinleriyle sarar; davranış tek yerde durur.
// DB katmanı: src/lib/admin-shell/workshop-items.ts (RLS: admin-only, ortak).

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Hammer, Plus } from "lucide-react";

import { WorkshopItemRow } from "@/components/admin/workshop/WorkshopItemRow";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminFilterBar,
  AdminLoadingState,
  AdminPageShell,
  AdminStatsGrid,
} from "@/components/admin/page";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  calculateWorkshopProgress,
  collectWorkshopSections,
  collectWorkshopSessions,
  createWorkshopItem,
  deleteWorkshopItem,
  fetchWorkshopItems,
  filterWorkshopItems,
  groupWorkshopItems,
  isWorkshopItemComplete,
  latestWorkshopSession,
  partitionWorkshopItems,
  setWorkshopItemApproval,
  updateWorkshopItem,
  type WorkshopItem,
  type WorkshopItemDraft,
  type WorkshopKey,
  type WorkshopOwner,
  type WorkshopStatusFilter,
} from "@/lib/admin-shell/workshop-items";

const STATUS_OPTIONS: { value: WorkshopStatusFilter; label: string }[] = [
  { value: "all", label: "Tüm maddeler" },
  { value: "open", label: "Bekleyenler" },
  { value: "completed", label: "Tamamlananlar" },
];

const NEW_SECTION_VALUE = "__new__";
const ALL_SESSIONS_VALUE = "all";

export interface WorkshopBoardProps {
  /** workshop_items.workshop_key — panoyu besleyen kayıt kümesi. */
  workshopKey: WorkshopKey;
  /** Sayfa başlığı (ör. "Cadde Workshop"). */
  title: string;
  /** Başlık altındaki açıklama; hangi toplantıdan geldiğini söyler. */
  description: string;
}

/** Sayaç anahtarı — aynı adlı bölüm iki oturumda ayrı sayılmalı. */
function sectionTotalsKey(sessionKey: string, section: string): string {
  return `${sessionKey} ${section}`;
}

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

export function WorkshopBoard({ workshopKey, title, description }: WorkshopBoardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [sessionFilter, setSessionFilter] = useState<string>(ALL_SESSIONS_VALUE);
  const [statusFilter, setStatusFilter] = useState<WorkshopStatusFilter>("all");
  const [searchText, setSearchText] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newSession, setNewSession] = useState("");
  const [newSection, setNewSection] = useState("");
  const [customSection, setCustomSection] = useState("");

  // Query key workshop'a bağlı: iki pano aynı önbelleği paylaşmamalı.
  const itemsKey = useMemo(() => ["workshop-items", workshopKey] as const, [workshopKey]);

  const itemsQuery = useQuery({
    queryKey: itemsKey,
    queryFn: () => fetchWorkshopItems(workshopKey),
  });
  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);

  const sessionOptions = useMemo(() => collectWorkshopSessions(items), [items]);
  const sectionOptions = useMemo(() => collectWorkshopSections(items), [items]);

  // Sayaçlar ve ilerleme çubuğu seçili workshop oturumunu yansıtır: WS2'ye
  // süzüldüğünde WS1'in bitmiş maddeleri oranı şişirmemeli.
  const scopedItems = useMemo(
    () =>
      sessionFilter === ALL_SESSIONS_VALUE
        ? items
        : items.filter((item) => item.sessionKey === sessionFilter),
    [items, sessionFilter],
  );
  const progress = useMemo(() => calculateWorkshopProgress(scopedItems), [scopedItems]);

  // Bekleyen maddeler üstte bölüm kartlarında; tamamlananlar en altta tek
  // akordeon kartında toplanır (pano uzadıkça bitmiş maddeler yolu tıkamasın).
  const { topSections, completedSections, completedCount } = useMemo(() => {
    const visible = filterWorkshopItems(items, {
      search: searchText,
      status: statusFilter,
      session: sessionFilter,
    });

    // "Tamamlananlar" filtresi zaten yalnız bitmişleri istiyor; onları bir de
    // akordeonun arkasına saklamak yerine doğrudan listede göster.
    if (statusFilter === "completed") {
      return { topSections: groupWorkshopItems(visible), completedSections: [], completedCount: 0 };
    }

    const { open, completed } = partitionWorkshopItems(visible);
    return {
      topSections: groupWorkshopItems(open),
      completedSections: groupWorkshopItems(completed),
      completedCount: completed.length,
    };
  }, [items, searchText, statusFilter, sessionFilter]);

  // Bölüm başlığındaki "tamamlanan/toplam" sayacı, tamamlananlar akordeona
  // taşındıktan sonra da anlamlı kalsın diye filtrelenmemiş listeden hesaplanır.
  const sectionTotals = useMemo(() => {
    const totals = new Map<string, { completed: number; total: number }>();
    for (const item of items) {
      const key = sectionTotalsKey(item.sessionKey, item.section.trim());
      const entry = totals.get(key) ?? { completed: 0, total: 0 };
      totals.set(key, {
        completed: entry.completed + (isWorkshopItemComplete(item) ? 1 : 0),
        total: entry.total + 1,
      });
    }
    return totals;
  }, [items]);

  const hasActiveFilters =
    sessionFilter !== ALL_SESSIONS_VALUE || statusFilter !== "all" || searchText.trim().length > 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: itemsKey });

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
    mutationFn: (draft: WorkshopItemDraft) => createWorkshopItem(workshopKey, draft),
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
  // Toplantı sırasında eklenen madde varsayılan olarak en son workshop'a düşer.
  const resolvedNewSession = newSession || latestWorkshopSession(items);

  const renderItemRow = (item: WorkshopItem) => (
    <WorkshopItemRow
      key={item.id}
      item={item}
      disabled={approvalMutation.isPending || deleteMutation.isPending}
      onToggle={(owner, done) => approvalMutation.mutate({ id: item.id, owner, done })}
      onSave={(draft) => updateMutation.mutate({ id: item.id, draft })}
      onDelete={() => deleteMutation.mutate(item.id)}
    />
  );

  const submitNewItem = () => {
    if (!newTitle.trim()) {
      toast({ title: "Madde metni boş bırakılamaz.", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      title: newTitle,
      section: resolvedNewSection,
      sessionKey: resolvedNewSession,
    });
  };

  return (
    <AdminPageShell
      title={title}
      eyebrow="Workshop"
      description={description}
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
          setSessionFilter(ALL_SESSIONS_VALUE);
          setStatusFilter("all");
          setSearchText("");
        } : undefined}>
          <Select value={sessionFilter} onValueChange={setSessionFilter}>
            <SelectTrigger className="h-9 w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SESSIONS_VALUE}>Tüm workshoplar</SelectItem>
              {sessionOptions.map((session) => (
                <SelectItem key={session} value={session}>
                  {session}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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

      {!itemsQuery.isLoading &&
      !itemsQuery.isError &&
      topSections.length === 0 &&
      completedSections.length === 0 ? (
        <AdminEmptyState
          title={hasActiveFilters ? "Filtreye uyan madde yok" : "Henüz madde yok"}
          description={
            hasActiveFilters
              ? "Filtreleri sıfırlayıp tekrar deneyin."
              : "Aşağıdaki formdan ilk maddeyi ekleyebilirsiniz."
          }
        />
      ) : null}

      {topSections.map((group) => {
        const totals = sectionTotals.get(sectionTotalsKey(group.sessionKey, group.section)) ?? {
          completed: 0,
          total: group.items.length,
        };
        return (
          <Card key={`${group.sessionKey}-${group.section || "genel"}`}>
            <CardHeader className="pb-2">
              <CardTitle className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {group.sessionKey}
                </span>
                {group.section || "Genel"}
                <span className="text-xs font-normal text-muted-foreground">
                  {totals.completed}/{totals.total}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-1">
              <ul className="flex flex-col">{group.items.map(renderItemRow)}</ul>
            </CardContent>
          </Card>
        );
      })}

      {completedSections.length > 0 ? (
        <Accordion type="single" collapsible className="rounded-xl border border-border bg-card px-3">
          <AccordionItem value="completed" className="border-b-0">
            <AccordionTrigger className="py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-foreground">
                  Tamamlananlar ({completedCount})
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-2">
              <div className="flex flex-col gap-3">
                {completedSections.map((group) => (
                  <div key={`${group.sessionKey}-${group.section || "genel"}`}>
                    <p className="px-3 pb-1 text-xs font-semibold text-muted-foreground">
                      <span className="mr-2 rounded bg-muted px-1 py-0.5 text-[10px] uppercase">
                        {group.sessionKey}
                      </span>
                      {group.section || "Genel"}
                      <span className="ml-2 font-normal">{group.items.length}</span>
                    </p>
                    <ul className="flex flex-col">{group.items.map(renderItemRow)}</ul>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Yeni madde ekle</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={resolvedNewSession} onValueChange={setNewSession}>
            <SelectTrigger className="h-9 w-full sm:w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sessionOptions.map((session) => (
                <SelectItem key={session} value={session}>
                  {session}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
}

export default WorkshopBoard;
