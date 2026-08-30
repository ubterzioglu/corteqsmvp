import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Loader2, MapPinned, Send } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import {
  CONTRIBUTOR_RESOURCE_TYPES,
  listMyContributorResourceSubmissions,
  submitContributorResourceSubmission,
  type ContributorPermissionStatus,
  type ContributorResourceInput,
  type ContributorResourceStatus,
  type ContributorResourceType,
} from "@/lib/contributor-resource-submissions";

const QUERY_KEY = ["my-contributor-resource-submissions"] as const;

const TYPE_LABELS: Record<ContributorResourceType, string> = {
  business: "İşletme",
  advisor: "Danışman",
  association: "Dernek",
  whatsapp_group: "WhatsApp grubu",
  influencer: "İçerik üreticisi",
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
  needs_info: "Bilgi bekleniyor",
  rejected: "Uygun bulunmadı",
  duplicate: "Daha önce eklenmiş",
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

const ContributorResourcesPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile, isLoading: isProfileLoading, errorMessage } = useCurrentUserProfile();
  const [form, setForm] = useState<ContributorResourceInput>(initialForm);
  const isContributor = profile?.roleKey === "User_Contributor";

  const submissionsQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: listMyContributorResourceSubmissions,
    enabled: isContributor,
  });

  const submitMutation = useMutation({
    mutationFn: submitContributorResourceSubmission,
    onSuccess: async () => {
      setForm(initialForm());
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: "Kaynağın incelemeye gönderildi",
        description: "Admin kararı ve varsa bilgi isteği bu sayfada görünecek.",
      });
    },
    onError: (error: unknown) => toast({
      title: "Kaynak gönderilemedi",
      description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
      variant: "destructive",
    }),
  });

  if (isProfileLoading) {
    return <div className="mx-auto flex min-h-[50vh] max-w-5xl items-center justify-center px-4">Profil kontrol ediliyor...</div>;
  }

  if (errorMessage || !isContributor) {
    return (
      <main className="mx-auto min-h-[60vh] max-w-3xl px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Bu alan Contributor hesabına açık.</CardTitle>
            <CardDescription>
              {errorMessage ?? "Mevcut hesabında aktif Contributor rolü bulunmuyor."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline"><Link to="/profile">Profilime dön</Link></Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitMutation.mutate(form);
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-6 px-4 py-10">
      <Button asChild variant="ghost" className="-ml-3">
        <Link to="/profile"><ArrowLeft className="mr-2 h-4 w-4" />Profilime dön</Link>
      </Button>

      <div className="rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-orange-50 p-6 shadow-sm md:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-teal-100 p-3 text-teal-700"><MapPinned className="h-6 w-6" /></div>
          <div>
            <Badge className="mb-2 bg-teal-700 hover:bg-teal-700">Contributor</Badge>
            <h1 className="text-3xl font-bold tracking-tight">Şehrinden Kaynak Öner</h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              Gerçekten kontrol ettiğin işletme, topluluk, etkinlik veya hizmeti gönder. Bağlantıyı ve faydayı admin inceleyecek; sonuç yalnız sana ve adminlere görünecek.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Yeni kaynak</CardTitle>
            <CardDescription>Kişisel veri veya özel grup yazışması ekleme; yalnız paylaşılabilir kaynak bilgisi gönder.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="resource-type">Kaynak türü</Label>
                <select
                  id="resource-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.resourceType}
                  onChange={(event) => setForm((current) => ({ ...current, resourceType: event.target.value as ContributorResourceType }))}
                >
                  {CONTRIBUTOR_RESOURCE_TYPES.map((type) => <option key={type} value={type}>{TYPE_LABELS[type]}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display-name">Kaynak adı</Label>
                <Input id="display-name" required minLength={2} maxLength={200} value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="country">Ülke</Label>
                  <Input id="country" required maxLength={100} value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Şehir</Label>
                  <Input id="city" required maxLength={100} value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source-url">Birincil kaynak adresi</Label>
                <Input id="source-url" type="url" required maxLength={2048} placeholder="https://..." value={form.sourceUrl} onChange={(event) => setForm((current) => ({ ...current, sourceUrl: event.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Neden faydalı?</Label>
                <Textarea id="summary" required minLength={10} maxLength={1000} value={form.summary} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="verified-on">Bilgiyi kontrol ettiğin tarih</Label>
                  <Input id="verified-on" type="date" required max={new Date().toISOString().slice(0, 10)} value={form.verifiedOn} onChange={(event) => setForm((current) => ({ ...current, verifiedOn: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="permission-status">Paylaşım durumu</Label>
                  <select
                    id="permission-status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.permissionStatus}
                    onChange={(event) => setForm((current) => ({ ...current, permissionStatus: event.target.value as ContributorPermissionStatus }))}
                  >
                    <option value="unknown">Henüz sorulmadı</option>
                    <option value="confirmed">Paylaşım izni doğrulandı</option>
                    <option value="not_required">Herkese açık kaynak</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="conflict-disclosure">Bağın veya çıkar ilişkin var mı? (isteğe bağlı)</Label>
                <Textarea id="conflict-disclosure" maxLength={1000} value={form.conflictDisclosure} onChange={(event) => setForm((current) => ({ ...current, conflictDisclosure: event.target.value }))} />
              </div>

              <Button type="submit" disabled={submitMutation.isPending} className="w-full">
                {submitMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                İncelemeye gönder
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Gönderdiklerim</CardTitle>
            <CardDescription>İnceleme durumu ve admin notu burada güncellenir.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {submissionsQuery.isLoading ? <p className="text-sm text-muted-foreground">Gönderimler yükleniyor...</p> : null}
            {submissionsQuery.isError ? <p className="text-sm text-destructive">Gönderimler yüklenemedi.</p> : null}
            {!submissionsQuery.isLoading && !submissionsQuery.data?.length ? <p className="text-sm text-muted-foreground">Henüz gönderdiğin kaynak yok.</p> : null}
            {submissionsQuery.data?.map((submission) => (
              <article key={submission.id} className="space-y-2 rounded-xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{submission.displayName}</p>
                    <p className="text-xs text-muted-foreground">{submission.city}, {submission.country} · {TYPE_LABELS[submission.resourceType]}</p>
                  </div>
                  <Badge variant="outline">{STATUS_LABELS[submission.status]}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{submission.summary}</p>
                {submission.decisionNote ? <p className="rounded-lg bg-muted p-2 text-sm"><strong>Admin notu:</strong> {submission.decisionNote}</p> : null}
                <a className="inline-flex items-center text-sm font-medium text-teal-700 hover:underline" href={submission.sourceUrl} target="_blank" rel="noreferrer">
                  Kaynağı aç <ExternalLink className="ml-1 h-3.5 w-3.5" />
                </a>
              </article>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default ContributorResourcesPage;
