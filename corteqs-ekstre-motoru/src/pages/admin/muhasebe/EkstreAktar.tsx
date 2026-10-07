// /admin/muhasebe/ekstre — Kart ekstresi (PDF) / Drive CSV / Mercury -> Giderler
// Bağımlılıklar: mevcut projedeki shadcn/ui bileşenleri, @tanstack/react-query, sonner, lucide-react.
// Barış: import yollarını projedeki gerçek yollara göre düzelt (Giderler sayfasıyla aynı kalıp).
import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, FileUp, Landmark, Loader2, RefreshCw, Undo2, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// — Admin'deki Giderler sayfasıyla aynı etiketler (varsa oradaki sabitleri import edin)
export const CATEGORY_LABELS: Record<string, string> = {
  yazilim_araclar: "Yazılım & Araçlar", hosting_sunucu: "Hosting & Sunucu", alan_adi_ssl: "Alan Adı & SSL",
  pazarlama_reklam: "Pazarlama & Reklam", hukuki_danismanlik: "Hukuki & Danışmanlık", muhasebe_finans: "Muhasebe & Finans",
  seyahat_ulasim: "Seyahat & Ulaşım", ofis_kirtasiye: "Ofis & Kırtasiye", maas_ucret: "Maaş & Ücret",
  esop_hisse: "ESOP & Hisse", banka_komisyon: "Banka & Komisyon", diger: "Diğer Gider",
};
export const PERSON_LABELS: Record<string, string> = { burak: "Burak", baris: "Barış", ortak: "Ortak" };
const FLAG_LABELS: Record<string, { label: string; tone: "warn" | "info" | "muted" }> = {
  olasi_mukerrer: { label: "Olası mükerrer", tone: "warn" }, mukerrer: { label: "Mükerrer", tone: "muted" },
  iade: { label: "İade", tone: "info" }, kural_yok: { label: "Kural yok", tone: "warn" },
  teknoloji_olabilir: { label: "Teknoloji olabilir", tone: "warn" }, teknoloji_disi: { label: "Teknoloji dışı", tone: "muted" },
  kart_odemesi: { label: "Kart ödemesi", tone: "muted" }, istirak: { label: "Gider ortağı", tone: "info" },
  kur_yok: { label: "Kur yok", tone: "warn" }, beklemede: { label: "Beklemede", tone: "warn" },
};
const STATUS_LABELS: Record<string, string> = {
  uploaded: "Yüklendi", parsing: "Okunuyor…", ready: "İnceleme bekliyor", committed: "Muhasebeleşti",
  partially_committed: "Kısmen aktarıldı", failed: "Hata",
};

type Line = {
  id: string; line_no: number; txn_date: string; description_raw: string; merchant: string; line_type: string;
  amount_original: number; currency_original: string; amount_try: number | null; amount_usd: number | null;
  amount_usd_net: number | null; partner_share_usd: number | null; partner_name: string | null; fx_rate_usd: number | null; card_last4: string | null; category: string;
  person: string; decision: "import" | "review" | "skip"; include: boolean; flags: string[]; status: string;
  duplicate_reason: string | null; merchant_normalized: string | null; confidence: number; note: string | null;
};
type Import = {
  id: string; source: string; file_name: string | null; bank: string | null; period_start: string | null; period_end: string | null;
  status: string; summary: any; warnings: string[]; error: string | null; created_at: string; card_last4s: string[] | null;
};

const money = (n: number | null | undefined, cur = "USD") =>
  n == null ? "—" : new Intl.NumberFormat("tr-TR", { style: "currency", currency: cur === "TRY" ? "TRY" : cur, maximumFractionDigits: 2 }).format(n);
const trDate = (d: string | null) => (d ? d.split("-").reverse().join(".") : "—");

export default function EkstreAktar() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"active" | "import" | "review" | "skip" | "all">("active");
  const [ruleFor, setRuleFor] = useState<Line | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  // ── yüklemeler
  const imports = useQuery({
    queryKey: ["statement_imports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("statement_imports").select("*").order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      return data as Import[];
    },
    refetchInterval: (q) => ((q.state.data as Import[] | undefined)?.some((i) => i.status === "parsing") ? 3000 : false),
  });
  // ── muhasebe ayarları (gider ortağı kolonu, kur tarihi)
  const settings = useQuery({
    queryKey: ["accounting_settings"],
    queryFn: async () => {
      const { data } = await supabase.from("accounting_settings").select("*").eq("id", 1).maybeSingle();
      return (data ?? { partner_share_enabled: true, fx_rate_date: "transaction", mercury_auto_commit: false }) as
        { partner_share_enabled: boolean; fx_rate_date: "transaction" | "upload"; mercury_auto_commit: boolean };
    },
  });
  const partnerOn = settings.data?.partner_share_enabled !== false;
  const saveSetting = useMutation({
    mutationFn: async (fields: Record<string, unknown>) => {
      const { error } = await supabase.from("accounting_settings").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounting_settings"] });
      if (current && !["committed"].includes(current.status)) reparse.mutate(current.id); // açık ekstreye yeni ayarı uygula
    },
    onError: (e: any) => toast.error(e.message),
  });

  const current = imports.data?.find((i) => i.id === (selectedId ?? imports.data?.[0]?.id)) ?? null;

  const lines = useQuery({
    queryKey: ["statement_lines", current?.id],
    enabled: !!current,
    queryFn: async () => {
      const { data, error } = await supabase.from("statement_lines").select("*").eq("import_id", current!.id).order("line_no");
      if (error) throw error;
      return data as Line[];
    },
  });

  // ── yükle + ayrıştır
  const upload = useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
      if (!["pdf", "csv", "json"].includes(ext)) throw new Error("PDF, CSV ya da JSON yükleyin");
      const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("statements").upload(path, file, { contentType: file.type || undefined });
      if (upErr) throw upErr;
      const { data, error } = await supabase.functions.invoke("statement-parse", { body: { file_path: path, file_name: file.name } });
      if (error) throw new Error((await (error as any).context?.json?.())?.error ?? error.message);
      if (!data?.ok) throw new Error(data?.error ?? "Ekstre okunamadı");
      return data;
    },
    onSuccess: (d) => {
      toast.success(`Ekstre okundu: ${d.summary.total} satır · ${d.summary.import} aktarılacak · ${d.summary.review} incelenecek`);
      setSelectedId(d.import_id); setFilter("active");
      qc.invalidateQueries({ queryKey: ["statement_imports"] });
    },
    onError: (e: any) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["statement_imports"] }); },
  });

  const reparse = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke("statement-parse", { body: { import_id: id } });
      if (error || !data?.ok) throw new Error(data?.error ?? error?.message);
      return data;
    },
    onSuccess: () => { toast.success("Kurallar yeniden uygulandı"); qc.invalidateQueries({ queryKey: ["statement_lines"] }); qc.invalidateQueries({ queryKey: ["statement_imports"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const mercury = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("mercury-sync", { body: {} });
      if (error || !data?.ok) throw new Error(data?.error ?? error?.message);
      return data;
    },
    onSuccess: (d) => {
      const n = d.results.reduce((a: number, r: any) => a + (r.new_lines ?? 0), 0);
      toast.success(n ? `Mercury: ${n} yeni işlem` : "Mercury: yeni işlem yok");
      qc.invalidateQueries({ queryKey: ["statement_imports"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ── satır düzenleme (anında kaydedilir)
  const patch = useMutation({
    mutationFn: async ({ id, ...fields }: Partial<Line> & { id: string }) => {
      const { error } = await supabase.from("statement_lines").update({ ...fields, edited: true, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, ...fields }) => {
      qc.setQueryData<Line[]>(["statement_lines", current?.id], (old) => old?.map((l) => (l.id === id ? { ...l, ...fields } : l)));
    },
    onError: (e: any) => { toast.error("Kaydedilemedi: " + e.message); qc.invalidateQueries({ queryKey: ["statement_lines"] }); },
  });

  const setShare = (l: Line, share: number | null) => {
    const net = l.amount_usd == null ? null : Math.round((l.amount_usd - (share ?? 0)) * 100) / 100;
    patch.mutate({ id: l.id, partner_share_usd: share, amount_usd_net: net });
  };

  // ── muhasebeleştir / geri al
  const commit = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("commit_statement_lines", { p_import_id: current!.id, p_line_ids: null });
      if (error) throw error;
      return data as { inserted: number; skipped_duplicates: number; missing_fx: number };
    },
    onSuccess: (d) => {
      toast.success(`${d.inserted} gider CorteQS muhasebesine USD olarak girildi${d.skipped_duplicates ? ` · ${d.skipped_duplicates} mükerrer atlandı` : ""}`);
      if (d.missing_fx) toast.warning(`${d.missing_fx} satırın kuru bulunamadı, girilmedi. Kuralları yeniden uygulayın.`);
      qc.invalidateQueries(); // Giderler sayfası da tazelensin
    },
    onError: (e: any) => toast.error(e.message),
  });
  const revert = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("revert_statement_import", { p_import_id: current!.id });
      if (error) throw error;
      return data as { deleted: number };
    },
    onSuccess: (d) => { toast.success(`${d.deleted} gider geri alındı`); qc.invalidateQueries(); },
    onError: (e: any) => toast.error(e.message),
  });

  const all = lines.data ?? [];
  const visible = useMemo(() => all.filter((l) =>
    filter === "all" ? true : filter === "active" ? l.decision !== "skip" || l.include : l.decision === filter), [all, filter]);
  const chosen = all.filter((l) => l.include && l.status === "pending");
  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    for (const l of chosen) t[l.person] = (t[l.person] ?? 0) + ((partnerOn ? l.amount_usd_net : l.amount_usd) ?? 0);
    return t;
  }, [chosen, partnerOn]);
  const count = (d: string) => all.filter((l) => l.decision === d).length;
  const locked = current?.status === "committed";

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files?.[0]; if (f) upload.mutate(f);
  }, [upload]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Ekstre Aktar</h1>
          <p className="text-sm text-muted-foreground">Ekstreyi yükle → Claude okur, teknoloji giderlerini ayıklar, USD'ye çevirir (TL: USD/TRY, EUR: çapraz kur), gider ortağı katkısını düşer → sen gözden geçirip onaylayınca CorteQS muhasebesine USD olarak girer.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Switch id="partner" checked={partnerOn} disabled={settings.isLoading}
              onCheckedChange={(v) => saveSetting.mutate({ partner_share_enabled: v })} />
            <Label htmlFor="partner">Gider ortağı kolonu</Label>
          </div>
          <Select value={settings.data?.fx_rate_date ?? "transaction"} onValueChange={(v) => saveSetting.mutate({ fx_rate_date: v })}>
            <SelectTrigger className="h-9 w-[210px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="transaction">Kur: işlem günü (TCMB)</SelectItem>
              <SelectItem value="upload">Kur: bugünkü güncel kur (TCMB)</SelectItem>
            </SelectContent>
          </Select>
        <Button variant="outline" onClick={() => mercury.mutate()} disabled={mercury.isPending}>
          {mercury.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Landmark className="mr-2 h-4 w-4" />}
          Mercury'yi senkronla
        </Button>
        </div>
      </div>

      {/* Yükleme alanı */}
      <Card
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}
        className={dragging ? "border-primary ring-2 ring-primary/30" : "border-dashed"}
      >
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          {upload.isPending ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <FileUp className="h-8 w-8 text-muted-foreground" />}
          <div className="font-medium">{upload.isPending ? "Ekstre okunuyor… (PDF için 20-60 sn)" : "Ekstre PDF'ini buraya bırak"}</div>
          <div className="text-xs text-muted-foreground">QNB Finansbank · İş Bankası Maximiles · sanal/normal kart · ayrıca Drive tablosunun CSV'si veya Gemini JSON çıktısı</div>
          <input ref={fileRef} type="file" accept=".pdf,.csv,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate(f); e.target.value = ""; }} />
          <Button size="sm" onClick={() => fileRef.current?.click()} disabled={upload.isPending}>Dosya seç</Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Yükleme geçmişi */}
        <Card className="h-fit">
          <CardHeader className="pb-2"><CardTitle className="text-base">Yüklemeler</CardTitle></CardHeader>
          <CardContent className="space-y-1 p-2">
            {imports.isLoading && <div className="p-3 text-sm text-muted-foreground">Yükleniyor…</div>}
            {imports.data?.length === 0 && <div className="p-3 text-sm text-muted-foreground">Henüz ekstre yok.</div>}
            {imports.data?.map((i) => (
              <button key={i.id} onClick={() => setSelectedId(i.id)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted ${current?.id === i.id ? "bg-muted" : ""}`}>
                <div className="truncate font-medium">{i.file_name ?? i.source}</div>
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{i.bank ?? (i.source === "sheet_csv" ? "Drive CSV" : "—")} · {trDate(i.period_end ?? i.created_at.slice(0, 10))}</span>
                  <Badge variant={i.status === "committed" ? "default" : i.status === "failed" ? "destructive" : "secondary"} className="text-[10px]">
                    {STATUS_LABELS[i.status] ?? i.status}
                  </Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* İnceleme */}
        <Card>
          {!current ? (
            <CardContent className="py-16 text-center text-muted-foreground">Bir ekstre yükleyin.</CardContent>
          ) : (
            <>
              <CardHeader className="gap-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{current.file_name}</CardTitle>
                    <CardDescription>
                      {current.bank ?? "—"} · dönem {trDate(current.period_start)} – {trDate(current.period_end)}
                      {current.card_last4s?.length ? ` · kart ${current.card_last4s.map((c) => "…" + c).join(", ")}` : ""}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {!locked && <Button size="sm" variant="ghost" onClick={() => reparse.mutate(current.id)} disabled={reparse.isPending}>
                      <RefreshCw className={`mr-1 h-4 w-4 ${reparse.isPending ? "animate-spin" : ""}`} /> Kuralları yeniden uygula
                    </Button>}
                    {["committed", "partially_committed"].includes(current.status) &&
                      <Button size="sm" variant="ghost" onClick={() => confirm("Bu ekstreden oluşan giderler silinecek. Emin misin?") && revert.mutate()}>
                        <Undo2 className="mr-1 h-4 w-4" /> Geri al
                      </Button>}
                  </div>
                </div>
                {current.error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Hata</AlertTitle><AlertDescription>{current.error}</AlertDescription></Alert>}
                {current.warnings?.length > 0 && (
                  <Alert><AlertTriangle className="h-4 w-4" /><AlertTitle>Kontrol et</AlertTitle>
                    <AlertDescription><ul className="list-disc pl-4">{current.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></AlertDescription>
                  </Alert>
                )}
                <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
                  <TabsList>
                    <TabsTrigger value="active">Teknoloji ({all.filter((l) => l.decision !== "skip" || l.include).length})</TabsTrigger>
                    <TabsTrigger value="review">İncele ({count("review")})</TabsTrigger>
                    <TabsTrigger value="import">Hazır ({count("import")})</TabsTrigger>
                    <TabsTrigger value="skip">Atlanan ({count("skip")})</TabsTrigger>
                    <TabsTrigger value="all">Tümü ({all.length})</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead className="min-w-[220px]">Açıklama</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Kim</TableHead>
                      <TableHead className="text-right">Ekstre tutarı</TableHead>
                      <TableHead className="text-right">Brüt $</TableHead>
                      {partnerOn && <TableHead className="min-w-[170px]">Gider ortağı katkısı</TableHead>}
                      <TableHead className="text-right">CorteQS'e giren $</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.isLoading && <TableRow><TableCell colSpan={partnerOn ? 10 : 9} className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>}
                    {visible.map((l) => {
                      const ro = locked || l.status !== "pending";
                      return (
                        <TableRow key={l.id} className={l.include ? "" : "opacity-60"}>
                          <TableCell>
                            <Checkbox checked={l.include} disabled={ro} onCheckedChange={(v) => patch.mutate({ id: l.id, include: !!v })} />
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm">{trDate(l.txn_date)}</TableCell>
                          <TableCell>
                            <Input defaultValue={l.merchant} disabled={ro} className="h-8"
                              onBlur={(e) => e.target.value !== l.merchant && patch.mutate({ id: l.id, merchant: e.target.value })} />
                            <div className="mt-1 truncate text-[11px] text-muted-foreground" title={l.description_raw}>
                              {l.description_raw}{l.card_last4 ? ` · …${l.card_last4}` : ""}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select value={l.category} disabled={ro} onValueChange={(v) => patch.mutate({ id: l.id, category: v })}>
                              <SelectTrigger className="h-8 w-[170px]"><SelectValue /></SelectTrigger>
                              <SelectContent>{Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select value={l.person} disabled={ro} onValueChange={(v) => patch.mutate({ id: l.id, person: v })}>
                              <SelectTrigger className="h-8 w-[100px]"><SelectValue /></SelectTrigger>
                              <SelectContent>{Object.entries(PERSON_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right text-sm">
                            {money(l.amount_original, l.currency_original)}
                            {l.currency_original !== "TRY" && l.amount_try != null && <div className="text-[11px] text-muted-foreground">{money(l.amount_try, "TRY")}</div>}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right text-sm">
                            {money(l.amount_usd)}
                            {l.currency_original !== "USD" && l.fx_rate_usd != null &&
                              <div className="text-[11px] text-muted-foreground">kur {l.currency_original === "TRY" ? (1 / l.fx_rate_usd).toFixed(4) + " ₺/$" : l.fx_rate_usd.toFixed(4) + " $/" + l.currency_original}</div>}
                          </TableCell>
                          {partnerOn && (
                            <TableCell>
                              <div className="flex gap-1">
                                <Input placeholder="Ortak" defaultValue={l.partner_name ?? ""} disabled={ro} className="h-8 w-[80px]"
                                  onBlur={(e) => { const v = e.target.value.trim() || null; if (v !== l.partner_name) patch.mutate({ id: l.id, partner_name: v }); }} />
                                <Input type="number" step="0.01" placeholder="$" defaultValue={l.partner_share_usd ?? ""} disabled={ro} className="h-8 w-[80px] text-right"
                                  onBlur={(e) => { const v = e.target.value === "" ? null : Number(e.target.value); if (v !== l.partner_share_usd) setShare(l, v); }} />
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="whitespace-nowrap text-right text-sm font-semibold">{money(partnerOn ? l.amount_usd_net : l.amount_usd)}</TableCell>
                          <TableCell>
                            <div className="flex max-w-[220px] flex-wrap items-center gap-1">
                              {l.status === "committed" && <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" />Aktarıldı</Badge>}
                              {l.flags.map((f) => {
                                const m = FLAG_LABELS[f] ?? { label: f, tone: "muted" as const };
                                const b = <Badge key={f} variant={m.tone === "warn" ? "destructive" : m.tone === "info" ? "secondary" : "outline"} className="text-[10px]">{m.label}</Badge>;
                                return f.includes("mukerrer") && l.duplicate_reason
                                  ? <Tooltip key={f}><TooltipTrigger asChild>{b}</TooltipTrigger><TooltipContent>{l.duplicate_reason}</TooltipContent></Tooltip>
                                  : b;
                              })}
                              {!ro && (l.flags.includes("kural_yok") || l.flags.includes("teknoloji_olabilir")) &&
                                <Button size="sm" variant="link" className="h-auto p-0 text-xs" onClick={() => setRuleFor(l)}><Wand2 className="mr-1 h-3 w-3" />Kural yap</Button>}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
              {!locked && (
                <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t bg-background/95 p-4 backdrop-blur">
                  <div className="text-sm">
                    <b>{chosen.length}</b> satır seçili · {Object.entries(totals).map(([p, v]) => `${PERSON_LABELS[p]}: ${money(v)}`).join(" · ") || "—"}
                    {count("review") > 0 && <span className="ml-2 text-amber-600">· {all.filter((l) => l.decision === "review" && l.status === "pending").length} satır inceleme bekliyor</span>}
                  </div>
                  <Button onClick={() => commit.mutate()} disabled={!chosen.length || commit.isPending}>
                    {commit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Gözden geçirdim, CorteQS muhasebesine gir ({chosen.length})
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <RuleDialog line={ruleFor} onClose={() => setRuleFor(null)} onSaved={() => current && reparse.mutate(current.id)} />
    </div>
  );
}

/** Kural oluştur: bir dahaki ekstrede bu tüccar otomatik tanınır. */
function RuleDialog({ line, onClose, onSaved }: { line: Line | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>(null);
  const open = !!line;
  if (line && (!form || form._id !== line.id)) {
    const key = (line.merchant_normalized ?? line.merchant).split(" ").slice(0, 2).join(" ");
    setForm({ _id: line.id, pattern: key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), merchant: line.merchant, category: line.category === "diger" ? "yazilim_araclar" : line.category, person: "", is_tech: true, auto_commit: false });
  }
  const save = async () => {
    const { _id, person, ...rest } = form;
    const { error } = await supabase.from("merchant_rules").insert({ ...rest, person: person || null, priority: 50 });
    if (error) return toast.error(error.message);
    toast.success("Kural kaydedildi"); onClose(); onSaved();
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Tüccar kuralı</DialogTitle></DialogHeader>
        {form && (
          <div className="grid gap-3">
            <div className="grid gap-1"><Label>Ekstrede geçen ifade (regex)</Label><Input value={form.pattern} onChange={(e) => setForm({ ...form, pattern: e.target.value })} />
              <span className="text-xs text-muted-foreground">Ör: <code>CURSOR</code> ya da <code>NOTION|NOTION LABS</code>. Büyük/küçük harf fark etmez.</span></div>
            <div className="grid gap-1"><Label>Görünen ad</Label><Input value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1"><Label>Kategori</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="grid gap-1"><Label>Kim (boş = karttan)</Label>
                <Select value={form.person || "_"} onValueChange={(v) => setForm({ ...form, person: v === "_" ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="_">Karttan</SelectItem>{Object.entries(PERSON_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select></div>
            </div>
            <div className="flex items-center justify-between"><Label>Teknoloji gideri</Label><Switch checked={form.is_tech} onCheckedChange={(v) => setForm({ ...form, is_tech: v })} /></div>
            <div className="flex items-center justify-between"><Label>Mercury'de otomatik aktar</Label><Switch checked={form.auto_commit} onCheckedChange={(v) => setForm({ ...form, auto_commit: v })} /></div>
          </div>
        )}
        <DialogFooter><Button variant="ghost" onClick={onClose}>Vazgeç</Button><Button onClick={save}>Kaydet ve yeniden uygula</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
