// src/pages/admin/muhasebe/GiderlerPage.tsx
// Gider kayıtları listesi — arama, filtre, CRUD

import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, ExternalLink, CreditCard, Search } from 'lucide-react';

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

import { ExpenseFormDialog } from '@/components/admin/muhasebe/ExpenseFormDialog';
import { StatusBadge } from '@/components/admin/muhasebe/StatusBadge';

import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from '@/hooks/useMuhasebe';
import { aggregateCurrencyTotals } from '@/lib/muhasebe-aggregations';
import {
  formatCurrency,
  formatCurrencySummary,
  formatDateTR,
  safeMuhasebeHref,
} from '@/lib/muhasebe-format';
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_STATUS_LABELS,
  PERSON_LABELS,
  type ExpenseCategory,
  type ExpenseRow,
  type ExpenseStatus,
  type PersonType,
} from '@/types/muhasebe';

type PersonFilter = 'all' | PersonType;
type StatusFilter = 'all' | ExpenseStatus;
type CategoryFilter = 'all' | ExpenseCategory;

export default function GiderlerPage() {
  const { data: expenses = [], isLoading } = useExpenses();
  const createMut = useCreateExpense();
  const updateMut = useUpdateExpense();
  const deleteMut = useDeleteExpense();

  const [search, setSearch] = useState('');
  const [personFilter, setPersonFilter] = useState<PersonFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter((e) => {
      if (personFilter !== 'all' && e.person !== personFilter) return false;
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        e.description.toLowerCase().includes(q) ||
        (e.note?.toLowerCase().includes(q) ?? false) ||
        (e.invoice_url?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [expenses, search, personFilter, statusFilter, categoryFilter]);

  const totalsByCurrency = useMemo(() => aggregateCurrencyTotals(filtered), [filtered]);

  const handleNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (row: ExpenseRow) => {
    setEditing(row);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Giderler</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Şirket kurulana kadar geçici muhasebe kaydı
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Gider
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
              value={personFilter}
              onValueChange={(v) => setPersonFilter(v as PersonFilter)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kişi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kişiler</SelectItem>
                {(Object.keys(PERSON_LABELS) as PersonType[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PERSON_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map(
                  (c) => (
                    <SelectItem key={c} value={c}>
                      {EXPENSE_CATEGORY_LABELS[c]}
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
                {(Object.keys(EXPENSE_STATUS_LABELS) as ExpenseStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {EXPENSE_STATUS_LABELS[s]}
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
                  <TableHead>Kim</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Fatura</TableHead>
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
                      Henüz gider kaydı yok. "Yeni Gider" ile başlayabilirsiniz.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTR(row.expense_date)}
                      </TableCell>
                      <TableCell>{PERSON_LABELS[row.person]}</TableCell>
                      <TableCell className="text-sm">
                        {EXPENSE_CATEGORY_LABELS[row.category]}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <span className="line-clamp-2">{row.description}</span>
                        {row.is_virtual_card && (
                          <span className="inline-flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <CreditCard className="h-3 w-3" />
                            Sanal Kart
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums whitespace-nowrap">
                        {formatCurrency(Number(row.amount), row.currency)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} kind="expense" />
                      </TableCell>
                      <TableCell>
                        {safeMuhasebeHref(row.invoice_url) ? (
                          <a
                            href={safeMuhasebeHref(row.invoice_url) ?? undefined}
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

      <ExpenseFormDialog
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
            <AlertDialogTitle>Gider kaydını sil?</AlertDialogTitle>
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
