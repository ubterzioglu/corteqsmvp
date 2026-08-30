import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileCheck2, FileSearch, Search, Users } from "lucide-react";

import { SubmissionDetailDialog } from "@/components/admin/submissions/SubmissionDetailDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  fetchSubmissions,
  filterSubmissions,
  getAdminSubmissionDocumentUrl,
  updateSubmissionStatus,
  type AdminSubmissionFilters,
} from "@/lib/admin/admin-submissions-api";
import {
  getCategoryLabel,
  getFormTypeLabel,
  getStatusLabel,
  getSubmissionDocuments,
  submissionStatusOptions,
  type Submission,
  type SubmissionStatus,
  type UploadedDocument,
} from "@/lib/submissions";
import { trCompare } from "@/lib/text-normalization";

const SUBMISSIONS_QUERY_KEY = ["admin", "submissions"] as const;
const EMPTY_SUBMISSIONS: Submission[] = [];

const AdminSubmissionsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<AdminSubmissionFilters>({});
  const [selected, setSelected] = useState<Submission | null>(null);
  const [documentPendingName, setDocumentPendingName] = useState<string | null>(null);

  const submissionsQuery = useQuery({ queryKey: SUBMISSIONS_QUERY_KEY, queryFn: () => fetchSubmissions() });
  const submissions = submissionsQuery.data ?? EMPTY_SUBMISSIONS;
  const visibleSubmissions = useMemo(() => filterSubmissions(submissions, filters), [filters, submissions]);

  const formTypes = useMemo(
    () => Array.from(new Set(submissions.map((row) => row.form_type))).sort(trCompare),
    [submissions],
  );
  const categories = useMemo(
    () => Array.from(new Set(submissions.map((row) => row.category).filter(Boolean) as string[])).sort(trCompare),
    [submissions],
  );
  const withDocuments = useMemo(
    () => submissions.filter((row) => getSubmissionDocuments(row).length > 0).length,
    [submissions],
  );

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SubmissionStatus }) =>
      updateSubmissionStatus(id, status),
    onSuccess: (updated) => {
      queryClient.setQueryData<Submission[]>(SUBMISSIONS_QUERY_KEY, (current = []) =>
        current.map((row) => (row.id === updated.id ? updated : row)),
      );
      setSelected(updated);
      toast({ title: "Başvuru durumu güncellendi" });
    },
    onError: (error) =>
      toast({
        title: "Durum güncellenemedi",
        description: error instanceof Error ? error.message : "Bilinmeyen hata",
        variant: "destructive",
      }),
  });

  const openDocument = async (document: UploadedDocument) => {
    setDocumentPendingName(document.name);
    try {
      const signedUrl = await getAdminSubmissionDocumentUrl(document);
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast({
        title: "Dosya açılamadı",
        description: error instanceof Error ? error.message : "Bilinmeyen hata",
        variant: "destructive",
      });
    } finally {
      setDocumentPendingName(null);
    }
  };

  const setFilter = <K extends keyof AdminSubmissionFilters>(key: K, value: AdminSubmissionFilters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Üye Takibi</CardTitle>
          <CardDescription>
            Kayıt formlarındaki açıklama, ihtiyaç, referral ve private ek dosyalarını tek yerde inceleyin.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Toplam</p><p className="text-2xl font-semibold">{submissions.length}</p></div>
          <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Filtre sonucu</p><p className="text-2xl font-semibold">{visibleSubmissions.length}</p></div>
          <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Ek dosyası olan</p><p className="text-2xl font-semibold">{withDocuments}</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtreler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              role="searchbox"
              aria-label="Başvurularda ara"
              placeholder="Ad, açıklama, ihtiyaç, şehir, e-posta veya referral ara..."
              value={filters.search ?? ""}
              onChange={(event) => setFilter("search", event.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setFilter("search", "iş arıyorum")}>İş arıyorum</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setFilters({})}>Filtreleri temizle</Button>
          </div>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
            <Select value={filters.status ?? "all"} onValueChange={(value) => setFilter("status", value)}>
              <SelectTrigger aria-label="Durum filtresi"><SelectValue placeholder="Durum" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Tüm durumlar</SelectItem>{submissionStatusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filters.formType ?? "all"} onValueChange={(value) => setFilter("formType", value)}>
              <SelectTrigger aria-label="Form tipi filtresi"><SelectValue placeholder="Form tipi" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Tüm formlar</SelectItem>{formTypes.map((value) => <SelectItem key={value} value={value}>{getFormTypeLabel(value)}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filters.category ?? "all"} onValueChange={(value) => setFilter("category", value)}>
              <SelectTrigger aria-label="Kategori filtresi"><SelectValue placeholder="Kategori" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Tüm kategoriler</SelectItem>{categories.map((value) => <SelectItem key={value} value={value}>{getCategoryLabel(value)}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="date" aria-label="Başlangıç tarihi" value={filters.createdFrom ?? ""} onChange={(event) => setFilter("createdFrom", event.target.value)} />
            <Input type="date" aria-label="Bitiş tarihi" value={filters.createdTo ?? ""} onChange={(event) => setFilter("createdTo", event.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="has-documents" checked={Boolean(filters.hasDocuments)} onCheckedChange={(checked) => setFilter("hasDocuments", checked)} />
            <Label htmlFor="has-documents">Yalnız ek dosyası olanlar</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><FileSearch className="h-4 w-4" /> Başvurular</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {submissionsQuery.isLoading ? <p className="py-8 text-center text-sm text-muted-foreground">Yükleniyor...</p> : null}
          {submissionsQuery.isError ? <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{submissionsQuery.error instanceof Error ? submissionsQuery.error.message : "Başvurular yüklenemedi."}</p> : null}
          {!submissionsQuery.isLoading && visibleSubmissions.map((submission) => {
            const documents = getSubmissionDocuments(submission);
            return (
              <div key={submission.id} className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{submission.fullname}</p>
                    <Badge variant="outline">{getStatusLabel(submission.status)}</Badge>
                    {documents.length ? <Badge variant="secondary" className="gap-1"><FileCheck2 className="h-3 w-3" /> {documents.length} ek</Badge> : null}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{submission.email} · {submission.city}, {submission.country}</p>
                  <p className="mt-1 line-clamp-1 text-sm">{submission.description || submission.offers_needs || "Açıklama yok"}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelected(submission)}>Detay</Button>
              </div>
            );
          })}
          {!submissionsQuery.isLoading && !submissionsQuery.isError && visibleSubmissions.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Filtrelerle eşleşen başvuru yok.</p> : null}
        </CardContent>
      </Card>

      <SubmissionDetailDialog
        submission={selected}
        open={Boolean(selected)}
        statusPending={statusMutation.isPending}
        documentPendingName={documentPendingName}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
        onStatusChange={(status) => { if (selected) statusMutation.mutate({ id: selected.id, status }); }}
        onOpenDocument={(document) => void openDocument(document)}
      />
    </div>
  );
};

export default AdminSubmissionsPage;
