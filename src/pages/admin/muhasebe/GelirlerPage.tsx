// src/pages/admin/muhasebe/GelirlerPage.tsx
// Gelir kayıtları listesi — arama, filtre, CRUD

import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, ExternalLink, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { IncomeFormDialog } from '@/components/admin/muhasebe/IncomeFormDialog';
import { StatusBadge } from '@/components/admin/muhasebe/StatusBadge';

import {
  useIncomes,
  useCreateIncome,
  useUpdateIncome,
  useDeleteIncome,
} from '@/hooks/useMuhasebe';
import { aggregateCurrencyTotals } from '@/lib/muhasebe-aggregations';
import {
  formatCurrency,
  formatCurrencySummary,
  formatDateTR,
  safeMuhasebeHref,
} from '@/lib/muhasebe-format';
import {
  INCOME_CATEGORY_LABELS,
  INCOME_STATUS_LABELS,
  type IncomeCategory,
  type IncomeRow,
  type IncomeStatus,
} from '@/types/muhasebe';

type StatusFilter = 'all' | IncomeStatus;
type CategoryFilter = 'all' | IncomeCategory;

export default function GelirlerPage() {
  const { data: incomes = [], isLoading } = useIncomes();
  const createMut = useCreateIncome();
  const updateMut = useUpdateIncome();
  const deleteMut = useDeleteIncome();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IncomeRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return incomes.filter((e) => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        e.description.toLowerCase().includes(q) ||
        e.source.toLowerCase().includes(q) ||
        (e.note?.toLowerCase().includes(q) ?? false) ||
        (e.link?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [incomes, search, statusFilter, categoryFilter]);

  const totalsByCurrency = useMemo(() => aggregateCurrencyTotals(filtered), [filtered]);

  const handleNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (row: IncomeRow) => {
    setEditing(row);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gelirler</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Şirket kurulana kadar geçici muhasebe kaydı
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Gelir
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
          <CardDescription>
            {filtered.length} kayıt · Toplamlar: {formatCurrencySummary(totalsByCurrency)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {(Object.keys(INCOME_CATEGORY_LABELS) as IncomeCategory[]).map(
                  (c) => (
                    <SelectItem key={c} value={c}>
                      {INCOME_CATEGORY_LABELS[c]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                {(Object.keys(INCOME_STATUS_LABELS) as IncomeStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {INCOME_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Müşteri / Kaynak</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Henüz gelir kaydı yok. "Yeni Gelir" ile başlayabilirsiniz.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTR(row.income_date)}
                      </TableCell>
                      <TableCell className="font-medium">{row.source}</TableCell>
                      <TableCell className="text-sm">
                        {INCOME_CATEGORY_LABELS[row.category]}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <span className="line-clamp-2">{row.description}</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums whitespace-nowrap">
                        {formatCurrency(Number(row.amount), row.currency)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} kind="income" />
                      </TableCell>
                      <TableCell>
                        {safeMuhasebeHref(row.link) ? (
                          <a
                            href={safeMuhasebeHref(row.link) ?? undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Aç
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(row)}
                            aria-label="Düzenle"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(row)}
                            aria-label="Sil"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <IncomeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        isSubmitting={createMut.isPending || updateMut.isPending}
        onSubmit={async (values) => {
          if (editing) {
            await updateMut.mutateAsync({ id: editing.id, input: values });
          } else {
            await createMut.mutateAsync(values);
          }
          setFormOpen(false);
          setEditing(null);
        }}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gelir kaydını sil?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.description}" kaydı kalıcı olarak silinecek. Bu işlem
              geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteTarget) {
                  await deleteMut.mutateAsync(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
