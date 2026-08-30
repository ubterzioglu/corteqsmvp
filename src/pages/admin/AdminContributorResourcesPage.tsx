import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, FileQuestion, FolderSearch2, Loader2, XCircle } from "lucide-react";

import { AdminEmptyState, AdminErrorState, AdminLoadingState, AdminPageShell } from "@/components/admin/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  CONTRIBUTOR_RESOURCE_TYPES,
  createContributorResourceSubmission,
  listContributorResourceSubmissions,
  reviewContributorResourceSubmission,
  type ContributorPermissionStatus,
  type ContributorResourceInput,
  type ContributorResourceStatus,
  type ContributorResourceType,
} from "@/lib/contributor-resource-submissions";

const QUERY_KEY = ["contributor-resource-submissions"] as const;

const TYPE_LABELS: Record<ContributorResourceType, string> = {
  business: "İşletme",
  advisor: "Danışman",
  association: "Dernek",
  whatsapp_group: "WhatsApp grubu",
  influencer: "Influencer",
  event: "Etkinlik",
  facebook_group: "Facebook grubu",
  instagram_page: "Instagram sayfası",
  professional_community: "Profesyonel topluluk",
  local_service: "Yerel hizmet sağlayıcı",
};

const STATUS_LABELS: Record<ContributorResourceStatus, string> = {
  draft: "Taslak",
  submitted: "İnceleme bekliyor",
  accepted: "Kabul edildi",
  needs_info: "Bilgi eksik",
  rejected: "Reddedildi",
  duplicate: "Mükerrer",
};

const initialForm = (): ContributorResourceInput => ({
  resourceType: "business",
  displayName: "",
  country: "",
  city: "",
  sourceUrl: "",
  summary: "",
  verifiedOn: new Date().toISOString().slice(0, 10),
  permissionStatus: "unknown",
  conflictDisclosure: "",
});

const AdminContributorResourcesPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ContributorResourceInput>(initialForm);
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});
  const submissionsQuery = useQuery({ queryKey: QUERY_KEY, queryFn: listContributorResourceSubmissions });

  const refresh = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  const createMutation = useMutation({
    mutationFn: createContributorResourceSubmission,
    onSuccess: async () => {
      setForm(initialForm());
      await refresh();
      toast({ title: "Kaynak inceleme kuyruğuna eklendi" });
    },
    onError: (error: unknown) => toast({
      title: "Kaynak eklenemedi",
      description: error instanceof Error ? error.message : "Beklenmeyen hata",
      variant: "destructive",
    }),
  });
  const reviewMutation = useMutation({
    mutationFn: reviewContributorResourceSubmission,
    onSuccess: async () => {
      await refresh();
      toast({ title: "Kaynak kararı kaydedildi" });
    },
    onError: (error: unknown) => toast({
      title: "Karar kaydedilemedi",
      description: error instanceof Error ? error.message : "Beklenmeyen hata",
      variant: "destructive",
    }),
  });

  const setField = <Key extends keyof ContributorResourceInput>(key: Key, value: ContributorResourceInput[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  if (submissionsQuery.isLoading) return <AdminLoadingState label="Contributor kaynakları yükleniyor…" />;
  if (submissionsQuery.isError) {
    return <AdminErrorState title="Contributor kaynakları yüklenemedi" onRetry={() => void submissionsQuery.refetch()} />;
  }

  const submissions = submissionsQuery.data ?? [];
  const pendingCount = submissions.filter((item) => item.status === "submitted" || item.status === "needs_info").length;

  return (
    <AdminPageShell
      title="Contributor Kaynak Kuyruğu"
      description="Contributor'lardan gelen yerel kaynakları kanıtıyla kaydet, incele ve karar geçmişini kaybetmeden sonuçlandır. Bu ilk sürüm yalnız admin kullanımına açıktır."
      icon={FolderSearch2}
      accent="emerald"
      contentWidth="wide"
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Yeni kaynak kaydı</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); createMutation.mutate(form); }}>
              <div className="space-y-2">
                <Label htmlFor="contributor-resource-type">Kaynak türü</Label>
                <select
                  id="contributor-resource-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.resourceType}
                  onChange={(event) => setField("resourceType", event.target.value as ContributorResourceType)}
                >
                  {CONTRIBUTOR_RESOURCE_TYPES.map((type) => <option key={type} value={type}>{TYPE_LABELS[type]}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contributor-display-name">Görünen ad</Label>
                <Input id="contributor-display-name" maxLength={200} required value={form.displayName} onChange={(event) => setField("displayName", event.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="contributor-country">Ülke</Label>
                  <Input id="contributor-country" maxLength={100} required value={form.country} onChange={(event) => setField("country", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contributor-city">Şehir</Label>
                  <Input id="contributor-city" maxLength={100} required value={form.city} onChange={(event) => setField("city", event.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contributor-source-url">Birincil kaynak adresi</Label>
                <Input id="contributor-source-url" type="url" maxLength={2048} required placeholder="https://…" value={form.sourceUrl} onChange={(event) => setField("sourceUrl", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contributor-summary">Neden faydalı?</Label>
                <Textarea id="contributor-summary" minLength={10} maxLength={1000} required rows={4} value={form.summary} onChange={(event) => setField("summary", event.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contributor-verified-on">Kontrol tarihi</Label>
                  <Input id="contributor-verified-on" type="date" required value={form.verifiedOn} onChange={(event) => setField("verifiedOn", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contributor-permission">Paylaşım izni</Label>
                  <select
                    id="contributor-permission"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.permissionStatus}
                    onChange={(event) => setField("permissionStatus", event.target.value as ContributorPermissionStatus)}
                  >
                    <option value="unknown">Henüz doğrulanmadı</option>
                    <option value="confirmed">İzin doğrulandı</option>
                    <option value="not_required">Açık/resmî kaynak</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contributor-conflict">Ücretli ilişki / çıkar beyanı</Label>
                <Textarea id="contributor-conflict" maxLength={1000} rows={2} value={form.conflictDisclosure} onChange={(event) => setField("conflictDisclosure", event.target.value)} />
              </div>
              <Button className="w-full" type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                İncelemeye ekle
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">İnceleme kuyruğu ({pendingCount} açık / {submissions.length} toplam)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {submissions.length === 0 ? (
              <AdminEmptyState title="Henüz kaynak gönderimi yok" description="İlk doğrulanmış kaynak soldaki formdan eklendiğinde burada görünecek." />
            ) : submissions.map((submission) => {
              const needsDecision = submission.status === "submitted" || submission.status === "needs_info";
              const note = decisionNotes[submission.id] ?? "";
              return (
                <div key={submission.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{submission.displayName}</p>
                      <p className="text-sm text-muted-foreground">{TYPE_LABELS[submission.resourceType]} · {submission.city}, {submission.country}</p>
                    </div>
                    <Badge variant={submission.status === "submitted" ? "default" : "secondary"}>{STATUS_LABELS[submission.status]}</Badge>
                  </div>
                  <p className="mt-3 text-sm">{submission.summary}</p>
                  <a className="mt-3 inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline" href={submission.sourceUrl} target="_blank" rel="noreferrer">
                    Kaynağı aç <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <p className="mt-2 text-xs text-muted-foreground">Kontrol: {submission.verifiedOn} · İzin: {submission.permissionStatus}</p>
                  {submission.decisionNote ? <p className="mt-2 rounded-md bg-muted p-2 text-sm">Karar notu: {submission.decisionNote}</p> : null}
                  {needsDecision ? (
                    <div className="mt-4 space-y-2 border-t pt-4">
                      <Label htmlFor={`decision-${submission.id}`}>Karar notu</Label>
                      <Textarea id={`decision-${submission.id}`} maxLength={1000} rows={2} value={note} onChange={(event) => setDecisionNotes((current) => ({ ...current, [submission.id]: event.target.value }))} />
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" className="gap-1" disabled={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ submissionId: submission.id, status: "accepted", decisionNote: note })}><CheckCircle2 className="h-4 w-4" /> Kabul et</Button>
                        <Button size="sm" variant="outline" className="gap-1" disabled={reviewMutation.isPending || !note.trim()} onClick={() => reviewMutation.mutate({ submissionId: submission.id, status: "needs_info", decisionNote: note })}><FileQuestion className="h-4 w-4" /> Bilgi iste</Button>
                        <Button size="sm" variant="destructive" className="gap-1" disabled={reviewMutation.isPending || !note.trim()} onClick={() => reviewMutation.mutate({ submissionId: submission.id, status: "rejected", decisionNote: note })}><XCircle className="h-4 w-4" /> Reddet</Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </AdminPageShell>
  );
};

export default AdminContributorResourcesPage;
