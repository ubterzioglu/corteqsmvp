import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, Inbox, Loader2, MessageCircleReply, UserRoundCheck } from "lucide-react";

import { AdminEmptyState, AdminErrorState, AdminLoadingState, AdminPageShell } from "@/components/admin/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  currentAdminUserId,
  listApprovedWhatsAppTemplates,
  listCustomerRequestMessages,
  listCustomerRequestThreads,
  sendCustomerRequestReply,
  updateCustomerRequestThread,
  type ApprovedWhatsAppTemplate,
  type CustomerRequestStatus,
} from "@/lib/customer-requests";
import { cn } from "@/lib/utils";

const THREADS_KEY = ["whatsapp-customer-request-threads"] as const;
const STATUS_LABELS: Record<CustomerRequestStatus, string> = {
  new: "Yeni",
  in_progress: "İşlemde",
  waiting_customer: "Müşteri bekleniyor",
  resolved: "Çözüldü",
  closed: "Kapalı",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
}

const AdminCustomerRequestsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyMode, setReplyMode] = useState<"text" | "template">("text");
  const [replyBody, setReplyBody] = useState("");
  const [templateId, setTemplateId] = useState("");

  const threadsQuery = useQuery({ queryKey: THREADS_KEY, queryFn: listCustomerRequestThreads });
  const threads = useMemo(() => threadsQuery.data ?? [], [threadsQuery.data]);
  const selected = threads.find((thread) => thread.id === selectedId) ?? threads[0] ?? null;
  const effectiveSelectedId = selected?.id ?? null;
  const messagesQuery = useQuery({
    queryKey: ["whatsapp-customer-request-messages", effectiveSelectedId],
    queryFn: () => listCustomerRequestMessages(effectiveSelectedId!),
    enabled: Boolean(effectiveSelectedId),
  });
  const templatesQuery = useQuery({
    queryKey: ["approved-whatsapp-templates"],
    queryFn: listApprovedWhatsAppTemplates,
  });
  const templates = templatesQuery.data ?? [];
  const selectedTemplate = templates.find((template) => template.id === templateId);
  const serviceWindowOpen = selected
    ? Date.now() - new Date(selected.lastInboundAt).getTime() < 24 * 60 * 60 * 1000
    : false;
  const effectiveReplyMode = serviceWindowOpen ? replyMode : "template";

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: THREADS_KEY });
    if (effectiveSelectedId) {
      await queryClient.invalidateQueries({ queryKey: ["whatsapp-customer-request-messages", effectiveSelectedId] });
    }
  };

  const updateMutation = useMutation({
    mutationFn: async (input: { status: CustomerRequestStatus; assignSelf?: boolean }) => {
      if (!selected) return;
      const assignedTo = input.assignSelf ? await currentAdminUserId() : selected.assignedTo;
      await updateCustomerRequestThread(selected.id, input.status, assignedTo);
    },
    onSuccess: async () => { await refresh(); toast({ title: "Müşteri talebi güncellendi" }); },
    onError: (error: unknown) => toast({
      title: "Talep güncellenemedi",
      description: error instanceof Error ? error.message : "Beklenmeyen hata",
      variant: "destructive",
    }),
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      if (effectiveReplyMode === "template") {
        if (!selectedTemplate) throw new Error("Onaylı bir template seçmelisin.");
        await sendCustomerRequestReply({ threadId: selected.id, template: selectedTemplate });
      } else {
        if (!replyBody.trim()) throw new Error("Yanıt metni boş olamaz.");
        await sendCustomerRequestReply({ threadId: selected.id, body: replyBody });
      }
    },
    onSuccess: async () => {
      setReplyBody("");
      await refresh();
      toast({ title: "WhatsApp yanıtı gönderildi" });
    },
    onError: (error: unknown) => toast({
      title: "Yanıt gönderilemedi",
      description: error instanceof Error ? error.message : "Beklenmeyen hata",
      variant: "destructive",
    }),
  });

  if (threadsQuery.isLoading) return <AdminLoadingState label="Müşteri talepleri yükleniyor…" />;
  if (threadsQuery.isError) return <AdminErrorState title="Müşteri talepleri yüklenemedi" onRetry={() => void threadsQuery.refetch()} />;

  return (
    <AdminPageShell
      title="Müşteri Talepleri"
      description="WhatsApp Cloud API üzerinden gelen talepleri ata, durumunu yönet ve denetimli yanıtla. Telefon kimliği tarayıcıya açılmaz."
      icon={Inbox}
      accent="emerald"
      contentWidth="wide"
    >
      {threads.length === 0 ? (
        <AdminEmptyState title="Henüz müşteri talebi yok" description="İmzalı bir WhatsApp mesajı geldiğinde kuyruk otomatik oluşur." />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card>
            <CardHeader><CardTitle className="text-base">Talep kuyruğu ({threads.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {threads.map((thread) => (
                <button
                  type="button"
                  key={thread.id}
                  onClick={() => setSelectedId(thread.id)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/60",
                    selected?.id === thread.id && "border-emerald-500 bg-emerald-500/10",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">Talep {thread.id.slice(0, 8)}</span>
                    <Badge variant={thread.status === "new" ? "default" : "secondary"}>{STATUS_LABELS[thread.status]}</Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{thread.latestMessagePreview ?? "Mesaj önizlemesi yok"}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{formatDate(thread.lastMessageAt)} · {thread.messageCount} mesaj</p>
                </button>
              ))}
            </CardContent>
          </Card>

          {selected && (
            <div className="space-y-5">
              <Card>
                <CardContent className="flex flex-wrap items-center gap-3 p-4">
                  <Label htmlFor="customer-request-status">Durum</Label>
                  <Select
                    value={selected.status}
                    onValueChange={(status: CustomerRequestStatus) => updateMutation.mutate({ status })}
                  >
                    <SelectTrigger id="customer-request-status" className="w-52"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(STATUS_LABELS) as CustomerRequestStatus[]).map((status) => (
                        <SelectItem key={status} value={status}>{STATUS_LABELS[status]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    className="gap-2"
                    disabled={updateMutation.isPending || selected.assignedTo !== null}
                    onClick={() => updateMutation.mutate({ status: "in_progress", assignSelf: true })}
                  >
                    <UserRoundCheck className="h-4 w-4" />
                    {selected.assignedTo ? "Atandı" : "Bana ata"}
                  </Button>
                  <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock3 className="h-4 w-4" />
                    {serviceWindowOpen ? "24 saatlik serbest yanıt penceresi açık" : "Yalnız onaylı template gönderilebilir"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Konuşma</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {messagesQuery.isLoading ? <p className="text-sm text-muted-foreground">Mesajlar yükleniyor…</p> : null}
                  {(messagesQuery.data ?? []).map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "max-w-[85%] rounded-xl border p-3",
                        message.direction === "outbound" ? "ml-auto bg-emerald-500/10" : "bg-muted/50",
                      )}
                    >
                      <p className="whitespace-pre-wrap text-sm">{message.body ?? (message.templateName ? `Template: ${message.templateName}` : "[Desteklenmeyen mesaj]")}</p>
                      <p className="mt-2 text-[11px] text-muted-foreground">{formatDate(message.createdAt)} · {message.deliveryStatus}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><MessageCircleReply className="h-4 w-4" /> Denetimli yanıt</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {serviceWindowOpen && (
                    <Select value={replyMode} onValueChange={(value: "text" | "template") => setReplyMode(value)}>
                      <SelectTrigger aria-label="Yanıt türü" className="w-56"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Serbest metin</SelectItem>
                        <SelectItem value="template">Onaylı template</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {effectiveReplyMode === "text" ? (
                    <Textarea
                      aria-label="WhatsApp yanıt metni"
                      maxLength={4000}
                      rows={5}
                      value={replyBody}
                      onChange={(event) => setReplyBody(event.target.value)}
                    />
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp-template">Meta tarafından onaylanmış template</Label>
                      <Select value={templateId} onValueChange={setTemplateId}>
                        <SelectTrigger id="whatsapp-template"><SelectValue placeholder="Template seç" /></SelectTrigger>
                        <SelectContent>
                          {templates.map((template: ApprovedWhatsAppTemplate) => (
                            <SelectItem key={template.id} value={template.id}>{template.name} · {template.language}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {templates.length === 0 && <p className="text-sm text-amber-700">Doğrulanmış, parametresiz ve onaylı template kaydı yok.</p>}
                    </div>
                  )}
                  <Button
                    className="gap-2"
                    disabled={replyMutation.isPending || (effectiveReplyMode === "template" ? !selectedTemplate : !replyBody.trim())}
                    onClick={() => replyMutation.mutate()}
                  >
                    {replyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircleReply className="h-4 w-4" />}
                    Yanıtı gönder
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </AdminPageShell>
  );
};

export default AdminCustomerRequestsPage;
