// G24 · M5 Moderatör paneli — tasarım §10: TEK ekran, dört kuyruk.
//
//   Yeni gruplar (pending_review) · Sahiplik talepleri (ekran görüntüsü yöntemi)
//   · Şikayetler (G14 — admin_list_group_reports, grup bazlı; karar review_group_report_v1)
//   · Gönderiler (pending_platform)
//
// Kısayollar: J/K sonraki-önceki · A onayla · R reddet (hazır sebep listesi).
// Üst şerit: kuyruk sayıları · moderasyondan geçen grup (x/100) · hızlı şerit
// anahtarı (group_settings'e YAZAR — admin_set_group_setting beyaz listesi) ·
// görevlerin son çalışma zamanı (group_moderator_summary → cron.job_run_details).
//
// Kararlar MEVCUT tek kapılardan: set_group_status_v1 · admin_review_group_claim
// · group_post_review · admin_record_group_strike (bkz. group-moderation-api.ts).
// ⚠️ İstemci tarafı admin kontrolü YOK — AdminLayout kapısı + RLS/RPC yetkisi
// gerçek sınırdır (KR08 dersi: RLS yetkisiz kullanıcıya HATA dönerse GÖSTER,
// sessiz boş liste "veri yok" sanılır).
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  Clock,
  FileWarning,
  Loader2,
  MessageSquare,
  ShieldCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  REJECT_REASON_PRESETS,
  createClaimScreenshotUrl,
  decideClaim,
  decidePendingGroup,
  decidePost,
  fetchGroupModeratorSummary,
  fetchPendingClaims,
  fetchPendingGroups,
  fetchPendingPosts,
  recordStrike,
  setFastLaneEnabled,
  type GroupModeratorSummary,
  type PendingClaimRow,
  type PendingGroupRow,
  type PendingPostRow,
} from "@/lib/admin-shell/group-moderation-api";
import {
  fetchGroupReportQueue,
  reviewGroupReport,
  type GroupReportQueueItem,
  type GroupReportQueueReport,
} from "@/lib/group-reports-api";
import { getCategoryMeta } from "@/lib/whatsapp-landing-presentation";
import { getErrorMessage } from "@/lib/whatsapp-landing-form";
import { AdminGruplarPageReportsTab } from "@/pages/admin/AdminGruplarPageReportsTab";

type QueueTab = "groups" | "claims" | "reports" | "posts";

/** Reddetme akışı: satır seçildiğinde R ile açılır (hazır sebep + not). */
type RejectTarget =
  | { kind: "group"; row: PendingGroupRow }
  | { kind: "claim"; row: PendingClaimRow }
  | { kind: "post"; row: PendingPostRow }
  | { kind: "reports"; row: GroupReportQueueItem; only?: GroupReportQueueReport }
  | null;

/** Uyarı (strike) akışı: G15 merdiveni — gerekçe + opsiyonel kırmızı çizgi. */
type StrikeTarget = { row: PendingGroupRow } | null;

function timeAgo(value: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} saat önce`;
  return `${Math.round(hours / 24)} gün önce`;
}

export default function AdminGruplarPage() {
  const [summary, setSummary] = useState<GroupModeratorSummary | null>(null);
  const [groups, setGroups] = useState<PendingGroupRow[]>([]);
  const [claims, setClaims] = useState<PendingClaimRow[]>([]);
  const [posts, setPosts] = useState<PendingPostRow[]>([]);
  const [reports, setReports] = useState<GroupReportQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<QueueTab>("groups");
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);
  const [fastLaneBusy, setFastLaneBusy] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<RejectTarget>(null);
  const [rejectPreset, setRejectPreset] = useState<string>("");
  const [rejectNote, setRejectNote] = useState("");
  const [strikeTarget, setStrikeTarget] = useState<StrikeTarget>(null);
  const [strikeReason, setStrikeReason] = useState("");
  const [strikeRedline, setStrikeRedline] = useState<string>("");
  const [showTasks, setShowTasks] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // ⚠️ KR08 dersi: RLS yetkisiz kullanıcıya hata döner — SESSİZ YUTMA YOK,
      // catch kullanıcıya YAZAR (boş liste "kuyruk boş" sanılır).
      const [summaryData, groupRows, claimRows, postRows, reportRows] = await Promise.all([
        fetchGroupModeratorSummary(),
        fetchPendingGroups(),
        fetchPendingClaims(),
        fetchPendingPosts(),
        fetchGroupReportQueue(),
      ]);
      setSummary(summaryData);
      setGroups(groupRows);
      setClaims(claimRows);
      setPosts(postRows);
      setReports(reportRows);
    } catch (error) {
      const message = getErrorMessage(error, "Moderasyon verileri okunamadı.");
      setLoadError(message);
      toast.error(`Moderasyon paneli yüklenemedi: ${message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const queueLength = useMemo(() => {
    if (tab === "groups") return groups.length;
    if (tab === "claims") return claims.length;
    if (tab === "posts") return posts.length;
    return reports.length;
  }, [tab, groups, claims, posts, reports]);

  useEffect(() => {
    setSelected(0);
  }, [tab]);

  const refreshSummary = useCallback(async () => {
    try {
      setSummary(await fetchGroupModeratorSummary());
    } catch {
      // Özet tazelenemezse panel çalışmaya devam eder (sayaçlar bayat kalır).
    }
  }, []);

  const runDecision = useCallback(
    async (action: () => Promise<void>, successMessage: string) => {
      setBusy(true);
      try {
        await action();
        toast.success(successMessage);
        setRejectTarget(null);
        setStrikeTarget(null);
        setRejectPreset("");
        setRejectNote("");
        setStrikeReason("");
        setStrikeRedline("");
        await Promise.all([load(), refreshSummary()]);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setBusy(false);
      }
    },
    [load, refreshSummary],
  );

  // G14 · şikayet onayı: TEK karar = TEK ihlal (sunucu grubun açık şikayetlerini
  // birlikte kapatır). Uyarı grubu yayına döndürmez — sonuç moderatöre yazılır.
  const upholdReports = useCallback(
    (item: GroupReportQueueItem) => {
      const first = item.reports[0];
      if (!first) return;
      void runDecision(async () => {
        const result = await reviewGroupReport(first.id, "upheld");
        toast.info(`Uyarı sonucu: ${result.strike?.outcome ?? "—"} · kapanan şikayet: ${result.closed_reports}`);
        if (result.listing_status === "hidden") {
          toast.info("Grup gizli kaldı: onaylanan şikayet grubu otomatik yayına döndürmez.");
        }
      }, `"${item.group_name}" şikayeti onaylandı — uyarı merdiveni işledi.`);
    },
    [runDecision],
  );

  const approveSelected = useCallback(() => {
    if (busy) return;
    if (tab === "groups") {
      const row = groups[selected];
      if (row) void runDecision(() => decidePendingGroup(row.id, "approve"), `"${row.group_name}" yayınlandı.`);
    } else if (tab === "claims") {
      const row = claims[selected];
      if (row) void runDecision(() => decideClaim(row.id, "approve"), "Sahiplik onaylandı — doğrulandı yapıldı.");
    } else if (tab === "posts") {
      const row = posts[selected];
      if (row) void runDecision(() => decidePost(row.id, "approve"), "Gönderi yayınlandı.");
    } else if (tab === "reports") {
      const row = reports[selected];
      if (row) upholdReports(row);
    }
  }, [busy, tab, groups, claims, posts, reports, selected, runDecision, upholdReports]);

  const openRejectForSelected = useCallback(() => {
    if (busy) return;
    if (tab === "groups" && groups[selected]) setRejectTarget({ kind: "group", row: groups[selected] });
    else if (tab === "claims" && claims[selected]) setRejectTarget({ kind: "claim", row: claims[selected] });
    else if (tab === "posts" && posts[selected]) setRejectTarget({ kind: "post", row: posts[selected] });
    else if (tab === "reports" && reports[selected]) setRejectTarget({ kind: "reports", row: reports[selected] });
  }, [busy, tab, groups, claims, posts, reports, selected]);

  // Tasarım §10 kısayolları: A onayla · R reddet · J/K sonraki/önceki.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)
      ) {
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const key = event.key.toLowerCase();
      if (key === "j") {
        event.preventDefault();
        setSelected((current) => Math.min(current + 1, Math.max(queueLength - 1, 0)));
      } else if (key === "k") {
        event.preventDefault();
        setSelected((current) => Math.max(current - 1, 0));
      } else if (key === "a") {
        event.preventDefault();
        approveSelected();
      } else if (key === "r") {
        event.preventDefault();
        openRejectForSelected();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [queueLength, approveSelected, openRejectForSelected]);

  const handleFastLaneToggle = async (enabled: boolean) => {
    setFastLaneBusy(true);
    try {
      await setFastLaneEnabled(enabled);
      toast.success(enabled ? "Hızlı şerit AÇILDI — admin gönderileri anında yayına çıkar." : "Hızlı şerit kapatıldı.");
      await refreshSummary();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setFastLaneBusy(false);
    }
  };

  const confirmReject = () => {
    if (!rejectTarget) return;
    const note = [rejectPreset, rejectNote.trim()].filter(Boolean).join(" — ") || undefined;
    if (rejectTarget.kind === "group") {
      void runDecision(() => decidePendingGroup(rejectTarget.row.id, "reject", note), "Grup reddedildi — ekleyene bildirim gitti.");
    } else if (rejectTarget.kind === "claim") {
      void runDecision(() => decideClaim(rejectTarget.row.id, "reject", note), "Sahiplik talebi reddedildi.");
    } else if (rejectTarget.kind === "reports") {
      const targets = rejectTarget.only ? [rejectTarget.only] : rejectTarget.row.reports;
      void runDecision(async () => {
        let republished = false;
        // Sırayla: son açık şikayetin reddi grubu (gizliyse) yayına döndürür.
        for (const report of targets) {
          const result = await reviewGroupReport(report.id, "rejected", note);
          republished = republished || result.group_republished;
        }
        if (republished) toast.info("Grup yeniden yayında (açık şikayet kalmadı).");
      }, targets.length > 1 ? `${targets.length} şikayet reddedildi.` : "Şikayet reddedildi.");
    } else {
      void runDecision(() => decidePost(rejectTarget.row.id, "reject", note), "Gönderi reddedildi.");
    }
  };

  const confirmStrike = () => {
    if (!strikeTarget || !strikeReason.trim()) {
      toast.error("Uyarı gerekçesi zorunlu.");
      return;
    }
    const redline = strikeRedline ? Number(strikeRedline) : null;
    void runDecision(
      () =>
        recordStrike(strikeTarget.row.id, strikeReason.trim(), redline).then((outcome) => {
          toast.info(`Uyarı sonucu: ${outcome}`);
        }),
      "Uyarı kaydedildi (G15 merdiveni işledi).",
    );
  };

  const openScreenshot = async (path: string | null) => {
    if (!path) {
      toast.error("Bu talepte ekran görüntüsü yok.");
      return;
    }
    try {
      const url = await createClaimScreenshotUrl(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(getErrorMessage(error, "Ekran görüntüsü açılamadı."));
    }
  };

  const suggestFastLane =
    summary !== null && !summary.fast_lane_enabled && summary.moderated_count >= summary.fast_lane_suggest_threshold;

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <ShieldCheck className="h-6 w-6 text-rose-600" />
          Grup Moderasyonu
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tek ekran dört kuyruk (tasarım §10). Kısayollar: <kbd className="rounded border px-1">J</kbd>/
          <kbd className="rounded border px-1">K</kbd> gez · <kbd className="rounded border px-1">A</kbd> onayla ·{" "}
          <kbd className="rounded border px-1">R</kbd> reddet.
        </p>
      </header>

      {loadError ? (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6 text-sm font-semibold text-red-700">
            {loadError} — yönetici yetkisi gerekiyor olabilir.{" "}
            <Button variant="outline" size="sm" className="ml-2" onClick={() => void load()}>
              Yeniden dene
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* ── Üst şerit ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Yeni gruplar</p>
              <p className="text-2xl font-black">{summary?.pending_groups ?? "—"}</p>
            </div>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Sahiplik talepleri</p>
              <p className="text-2xl font-black">{summary?.pending_claims ?? "—"}</p>
            </div>
            <BadgeCheck className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Şikayetler</p>
              <p className="text-2xl font-black">{summary?.pending_reports ?? "—"}</p>
            </div>
            <FileWarning className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Gönderi kuyruğu</p>
              <p className="text-2xl font-black">{summary?.pending_posts ?? "—"}</p>
            </div>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-6 pt-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Moderasyondan geçen grup</p>
            <p className="text-xl font-bold">
              {summary?.moderated_count ?? "—"} / {summary?.fast_lane_suggest_threshold ?? 100}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Zap className={`h-5 w-5 ${summary?.fast_lane_enabled ? "text-amber-500" : "text-muted-foreground"}`} />
            <div>
              <Label htmlFor="fast-lane-switch" className="cursor-pointer">
                Hızlı şerit {summary?.fast_lane_enabled ? "AÇIK" : "kapalı"}
              </Label>
              <p className="text-xs text-muted-foreground">
                Admin + sahipliği doğrulanmış gönderiler anında yayına çıkar.
              </p>
            </div>
            <Switch
              id="fast-lane-switch"
              checked={summary?.fast_lane_enabled ?? false}
              disabled={fastLaneBusy || summary === null}
              onCheckedChange={(checked) => void handleFastLaneToggle(checked)}
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowTasks((open) => !open)}>
            <Clock className="h-4 w-4" />
            Görev koşuları
          </Button>
        </CardContent>
        {suggestFastLane ? (
          <CardContent className="pt-0">
            <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
              Moderasyondan geçen grup sayısı {summary?.fast_lane_suggest_threshold}’e ulaştı — hızlı şeridi açmayı
              değerlendir. Karar senin (tasarım §2).
            </p>
          </CardContent>
        ) : null}
        {showTasks && summary ? (
          <CardContent className="pt-0">
            <ul className="space-y-1 text-sm">
              {summary.task_runs.map((run) => (
                <li key={run.jobname} className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs">{run.jobname}</span>
                  <span className="text-xs text-muted-foreground">({run.schedule})</span>
                  <Badge variant={run.last_status === "succeeded" ? "default" : "destructive"}>
                    {run.last_status ?? "henüz koşmadı"}
                  </Badge>
                  {run.last_end_time ? (
                    <span className="text-xs text-muted-foreground">{timeAgo(run.last_end_time)}</span>
                  ) : null}
                </li>
              ))}
              {summary.task_runs.length === 0 ? (
                <li className="text-muted-foreground">Kayıtlı grup görevi yok.</li>
              ) : null}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              ⚠️ "succeeded" yalnız çağrının döndüğünü gösterir (Radar dersi) — görevlerin ETKİSİ kabul
              testleriyle ölçülür.
            </p>
          </CardContent>
        ) : null}
      </Card>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Kuyruklar okunuyor...
        </p>
      ) : (
        <Tabs value={tab} onValueChange={(value) => setTab(value as QueueTab)}>
          <TabsList>
            <TabsTrigger value="groups">Yeni gruplar ({groups.length})</TabsTrigger>
            <TabsTrigger value="claims">Sahiplik ({claims.length})</TabsTrigger>
            <TabsTrigger value="reports">Şikayetler ({summary?.pending_reports ?? 0})</TabsTrigger>
            <TabsTrigger value="posts">Gönderiler ({posts.length})</TabsTrigger>
          </TabsList>

          {/* ── Kuyruk 1: yeni gruplar ── */}
          <TabsContent value="groups" className="space-y-3">
            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground">Yeni grup kuyruğu boş.</p>
            ) : null}
            {groups.map((row, index) => (
              <Card
                key={row.id}
                className={index === selected ? "border-rose-400 ring-2 ring-rose-200" : undefined}
                onClick={() => setSelected(index)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                    {row.group_name}
                    <Badge variant="outline">{getCategoryMeta(row.category).label}</Badge>
                    <Badge variant="outline">{row.country} / {row.city}</Badge>
                    {row.submitted_as_admin ? <Badge className="bg-orange-500">admin ekledi</Badge> : null}
                    {(row.review_flags ?? []).map((flag) => (
                      <Badge key={flag} variant="destructive">işaret: {flag}</Badge>
                    ))}
                    <span className="text-xs font-normal text-muted-foreground">{timeAgo(row.created_at)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {row.short_description ? (
                    <p className="text-sm text-muted-foreground">{row.short_description}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
                      disabled={busy}
                      onClick={() => void runDecision(() => decidePendingGroup(row.id, "approve"), `"${row.group_name}" yayınlandı.`)}
                    >
                      <Check className="h-4 w-4" /> Onayla (A)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 border-red-300 text-red-700"
                      disabled={busy}
                      onClick={() => {
                        setRejectTarget({ kind: "group", row });
                        setSelected(index);
                      }}
                    >
                      <X className="h-4 w-4" /> Reddet (R)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 border-amber-300 text-amber-700"
                      disabled={busy}
                      onClick={() => {
                        setStrikeTarget({ row });
                        setSelected(index);
                      }}
                    >
                      <AlertTriangle className="h-4 w-4" /> Uyarı ver
                    </Button>
                    <a
                      className="inline-flex items-center text-sm font-semibold text-rose-700 underline-offset-2 hover:underline"
                      href={`/addcom?group=${encodeURIComponent(row.slug)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Sayfayı gör
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ── Kuyruk 2: sahiplik talepleri (ekran görüntüsü) ── */}
          <TabsContent value="claims" className="space-y-3">
            {claims.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sahiplik kuyruğu boş (kod yolu otomatik işler; buraya yalnız ekran görüntüsü talepleri düşer).</p>
            ) : null}
            {claims.map((row, index) => (
              <Card
                key={row.id}
                className={index === selected ? "border-rose-400 ring-2 ring-rose-200" : undefined}
                onClick={() => setSelected(index)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                    {row.group_name ?? row.landing_id}
                    {row.is_contested ? <Badge variant="destructive">ÇEKİŞMELİ — mevcut sahip var</Badge> : null}
                    <span className="text-xs font-normal text-muted-foreground">{timeAgo(row.created_at)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {row.platform_name_read ? (
                    <p className="text-sm text-muted-foreground">Platformdan okunan ad: {row.platform_name_read}</p>
                  ) : null}
                  {row.review_note ? <p className="text-sm text-muted-foreground">Not: {row.review_note}</p> : null}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => void openScreenshot(row.screenshot_path)}>
                      Ekran görüntüsünü aç
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
                      disabled={busy}
                      onClick={() => void runDecision(() => decideClaim(row.id, "approve"), "Sahiplik onaylandı — doğrulandı yapıldı.")}
                    >
                      <Check className="h-4 w-4" /> Onayla (A)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 border-red-300 text-red-700"
                      disabled={busy}
                      onClick={() => {
                        setRejectTarget({ kind: "claim", row });
                        setSelected(index);
                      }}
                    >
                      <X className="h-4 w-4" /> Reddet (R)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ── Kuyruk 3: şikayetler (G14 — grup bazlı) ── */}
          <TabsContent value="reports">
            <AdminGruplarPageReportsTab
              reports={reports}
              selected={selected}
              busy={busy}
              onSelect={setSelected}
              onUphold={upholdReports}
              onReject={(row) => setRejectTarget({ kind: "reports", row })}
              onRejectSingle={(row, report) => setRejectTarget({ kind: "reports", row, only: report })}
            />
          </TabsContent>

          {/* ── Kuyruk 4: platform gönderi kuyruğu ── */}
          <TabsContent value="posts" className="space-y-3">
            {posts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Gönderi kuyruğu boş.</p>
            ) : null}
            {posts.map((row, index) => (
              <Card
                key={row.id}
                className={index === selected ? "border-rose-400 ring-2 ring-rose-200" : undefined}
                onClick={() => setSelected(index)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                    {row.group_name ?? row.landing_id}
                    <span className="text-xs font-normal text-muted-foreground">
                      {timeAgo(row.created_at)}
                      {row.escalate_at ? ` · 48 saat eşiği: ${timeAgo(row.escalate_at)}` : ""}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="line-clamp-4 whitespace-pre-line text-sm text-slate-800">{row.body}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
                      disabled={busy}
                      onClick={() => void runDecision(() => decidePost(row.id, "approve"), "Gönderi yayınlandı.")}
                    >
                      <Check className="h-4 w-4" /> Onayla (A)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 border-red-300 text-red-700"
                      disabled={busy}
                      onClick={() => {
                        setRejectTarget({ kind: "post", row });
                        setSelected(index);
                      }}
                    >
                      <X className="h-4 w-4" /> Reddet (R)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}

      {/* ── Reddetme: hazır sebep listesi + not (tasarım §10) ── */}
      {rejectTarget ? (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-base">
              Reddet: {rejectTarget.kind === "group" ? rejectTarget.row.group_name : rejectTarget.kind === "claim" ? (rejectTarget.row.group_name ?? "sahiplik talebi") : (rejectTarget.row.group_name ?? "gönderi")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="reject-preset">Hazır sebep</Label>
              <Select value={rejectPreset || undefined} onValueChange={setRejectPreset}>
                <SelectTrigger id="reject-preset" className="mt-1">
                  <SelectValue placeholder="Sebep seç" />
                </SelectTrigger>
                <SelectContent>
                  {REJECT_REASON_PRESETS.map((preset) => (
                    <SelectItem key={preset} value={preset}>{preset}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reject-note">Not (bildirime "Sebep:" olarak yazılır)</Label>
              <Textarea
                id="reject-note"
                rows={2}
                className="mt-1"
                maxLength={500}
                value={rejectNote}
                onChange={(event) => setRejectNote(event.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button className="bg-red-600 text-white hover:bg-red-700" disabled={busy} onClick={confirmReject}>
                Reddi onayla
              </Button>
              <Button variant="outline" disabled={busy} onClick={() => setRejectTarget(null)}>
                Vazgeç
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* ── Uyarı (G15 strike merdiveni) ── */}
      {strikeTarget ? (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-base">Uyarı ver: {strikeTarget.row.group_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Merdiven otomatik işler: 1. uyarı · 2. ihlal 30 gün askı · 3. ihlal listeden kaldırma +
              yasak. Kırmızı çizgi 2/4/6 İLK ihlalde kaldırır.
            </p>
            <div>
              <Label htmlFor="strike-reason">Gerekçe *</Label>
              <Textarea
                id="strike-reason"
                rows={2}
                className="mt-1"
                maxLength={500}
                value={strikeReason}
                onChange={(event) => setStrikeReason(event.target.value)}
                placeholder="Örn: Grup Sözü'ne aykırı paylaşım"
              />
            </div>
            <div>
              <Label htmlFor="strike-redline">Kırmızı çizgi (opsiyonel)</Label>
              <Select value={strikeRedline || undefined} onValueChange={setStrikeRedline}>
                <SelectTrigger id="strike-redline" className="mt-1">
                  <SelectValue placeholder="Seçilmedi — normal merdiven" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <SelectItem key={n} value={String(n)}>Kırmızı çizgi {n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button className="bg-amber-600 text-white hover:bg-amber-700" disabled={busy} onClick={confirmStrike}>
                Uyarıyı kaydet
              </Button>
              <Button variant="outline" disabled={busy} onClick={() => setStrikeTarget(null)}>
                Vazgeç
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
