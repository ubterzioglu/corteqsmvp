import { useEffect, useState } from "react";
import { Check, ExternalLink, Heart, Lightbulb, RefreshCw, Save, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  createMay19CampaignFileSignedUrl,
  deleteMay19CampaignEntry,
  listMay19CampaignEntries,
  updateMay19CampaignEntry,
  type May19SubmissionKind,
  type May19SubmissionRow,
  type May19SubmissionStatus,
} from "@/lib/may19-campaign";

type May19SubmissionsModerationProps = {
  kind: May19SubmissionKind;
};

const statusBadgeClass: Record<May19SubmissionStatus, string> = {
  pending: "border-amber-200 bg-amber-100 text-amber-800",
  approved: "border-emerald-200 bg-emerald-100 text-emerald-800",
  rejected: "border-rose-200 bg-rose-100 text-rose-800",
};

const statusLabel: Record<May19SubmissionStatus, string> = {
  pending: "Beklemede",
  approved: "Onaylı",
  rejected: "Reddedildi",
};

const kindMeta: Record<May19SubmissionKind, { title: string; description: string; icon: typeof Lightbulb }> = {
  idea: {
    title: "19 Mayıs Kelime Moderasyonu",
    description: "19 kelimelik fikir gönderimlerini inceleyin, not alın ve yayına uygun olanları onaylayın.",
    icon: Lightbulb,
  },
  moment: {
    title: "19 Mayıs Anı Moderasyonu",
    description: "19 Mayıs anı gönderimlerini inceleyin, not alın ve yayın için onaylayın.",
    icon: Heart,
  },
};

export default function May19SubmissionsModeration({ kind }: May19SubmissionsModerationProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState<May19SubmissionStatus>("pending");
  const [rows, setRows] = useState<May19SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const meta = kindMeta[kind];

  const load = async (status: May19SubmissionStatus) => {
    setLoading(true);

    try {
      const nextRows = await listMay19CampaignEntries(kind, status);
      setRows(nextRows);
      setNotesById(
        Object.fromEntries(nextRows.map((row) => [row.id, row.review_notes ?? ""])),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(tab);
  }, [kind, tab]);

  const handleStatus = async (id: string, status: May19SubmissionStatus) => {
    try {
      await updateMay19CampaignEntry(id, {
        status,
        review_notes: notesById[id]?.trim() || null,
      });
      toast({
        title: status === "approved" ? "Gönderim onaylandı" : "Gönderim reddedildi",
      });
      await load(tab);
    } catch (error) {
      toast({
        title: "İşlem başarısız",
        description: error instanceof Error ? error.message : "Beklenmeyen hata",
        variant: "destructive",
      });
    }
  };

  const handleSaveNotes = async (id: string) => {
    try {
      await updateMay19CampaignEntry(id, {
        review_notes: notesById[id]?.trim() || null,
      });
      toast({ title: "Moderasyon notu kaydedildi" });
      await load(tab);
    } catch (error) {
      toast({
        title: "Not kaydedilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen hata",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu gönderimi silmek istediğinize emin misiniz?")) return;

    try {
      await deleteMay19CampaignEntry(id);
      toast({ title: "Gönderim silindi" });
      await load(tab);
    } catch (error) {
      toast({
        title: "Silme başarısız",
        description: error instanceof Error ? error.message : "Beklenmeyen hata",
        variant: "destructive",
      });
    }
  };

  const handleOpenFile = async (storageBucket: string, storagePath: string) => {
    try {
      const signedUrl = await createMay19CampaignFileSignedUrl(storageBucket, storagePath);
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast({
        title: "Dosya acilamadi",
        description: error instanceof Error ? error.message : "Beklenmeyen hata",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <meta.icon className={`h-5 w-5 ${kind === "idea" ? "text-amber-500" : "text-rose-500"}`} />
            {meta.title}
          </h2>
          <p className="text-sm text-muted-foreground">{meta.description}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void load(tab)}>
          <RefreshCw className="h-3.5 w-3.5" />
          Yenile
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as May19SubmissionStatus)}>
        <TabsList>
          <TabsTrigger value="pending">Beklemede</TabsTrigger>
          <TabsTrigger value="approved">Onaylı</TabsTrigger>
          <TabsTrigger value="rejected">Reddedilen</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Yükleniyor...</p>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Bu durumda kayıt yok.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_auto] gap-3 border-b border-border bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid">
                <span>Gönderim</span>
                <span>İletişim</span>
                <span>Durum</span>
                <span>Aksiyon</span>
              </div>
              <div className="divide-y divide-border">
                {rows.map((row) => (
                  <div key={row.id} className="space-y-3 px-4 py-4">
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_auto] md:items-start">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-base font-semibold text-foreground">{row.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.full_name} · {row.city}, {row.country}
                        </p>
                        <p className="line-clamp-2 text-sm text-slate-700">{row.description}</p>
                      </div>

                      <div className="space-y-1 text-xs text-slate-600">
                        <p className="break-all">{row.email}</p>
                        <p>{row.social_handle || "—"}</p>
                      </div>

                      <div className="flex md:justify-start">
                        <Badge className={statusBadgeClass[row.status as May19SubmissionStatus]}>
                          {statusLabel[row.status as May19SubmissionStatus]}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => void handleSaveNotes(row.id)}
                        >
                          <Save className="h-3.5 w-3.5" />
                          Kaydet
                        </Button>
                        {row.status !== "approved" ? (
                          <Button
                            size="sm"
                            className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={() => void handleStatus(row.id, "approved")}
                          >
                            <Check className="h-3.5 w-3.5" />
                            Onayla
                          </Button>
                        ) : null}
                        {row.status !== "rejected" ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1.5"
                            onClick={() => void handleStatus(row.id, "rejected")}
                          >
                            <X className="h-3.5 w-3.5" />
                            Reddet
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5 text-destructive hover:text-destructive"
                          onClick={() => void handleDelete(row.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Sil
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 md:grid-cols-2">
                      {row.message ? (
                        <p className="md:col-span-2">
                          <span className="font-semibold text-slate-800">{kind === "idea" ? "Güçlendirme Notu" : "Ek Mesaj"}:</span>{" "}
                          {row.message}
                        </p>
                      ) : null}
                      {row.link ? (
                        <a
                          href={row.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-primary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Gönderi linkini aç
                        </a>
                      ) : (
                        <span className="text-slate-500">Gönderi linki yok</span>
                      )}
                      {row.storage_bucket && row.storage_path ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 text-primary hover:underline md:justify-self-end"
                          onClick={() => void handleOpenFile(row.storage_bucket!, row.storage_path!)}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Yüklenen dosyayı aç{row.file_name ? ` (${row.file_name})` : ""}
                        </button>
                      ) : (
                        <span className="text-slate-500 md:justify-self-end">Dosya yok</span>
                      )}
                    </div>

                    <Textarea
                      rows={2}
                      value={notesById[row.id] ?? ""}
                      onChange={(event) =>
                        setNotesById((current) => ({ ...current, [row.id]: event.target.value }))
                      }
                      placeholder="İç ekip notu, gerekçe veya yayın kararı..."
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
