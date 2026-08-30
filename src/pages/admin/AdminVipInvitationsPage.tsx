import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Crown, Loader2, Plus, ShieldX } from "lucide-react";

import { AdminPageShell } from "@/components/admin/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  createVipInvitation,
  listVipInvitations,
  revokeVipInvitation,
  type CreatedVipInvitation,
  type VipInvitationListItem,
} from "@/lib/vip-invitations";

const invitationState = (invitation: VipInvitationListItem) => {
  if (invitation.revokedAt) return { label: "İptal edildi", variant: "destructive" as const };
  if (invitation.redeemedAt) return { label: "Kullanıldı", variant: "secondary" as const };
  if (new Date(invitation.expiresAt).getTime() <= Date.now()) return { label: "Süresi doldu", variant: "outline" as const };
  return { label: "Geçerli", variant: "default" as const };
};

const AdminVipInvitationsPage = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<VipInvitationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [created, setCreated] = useState<CreatedVipInvitation | null>(null);
  const [form, setForm] = useState({
    recipientName: "",
    recipientEmail: "",
    title: "CorteQS VIP Daveti",
    message: "",
    validDays: "30",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listVipInvitations());
    } catch (error: unknown) {
      toast({
        title: "VIP davetleri yüklenemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen hata",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const validDays = Number(form.validDays);
    if (!Number.isInteger(validDays) || validDays < 1 || validDays > 365) {
      toast({ title: "Geçerlilik 1–365 gün arasında olmalı", variant: "destructive" });
      return;
    }

    setSaving(true);
    setCreated(null);
    setCopied(false);
    try {
      const result = await createVipInvitation({ ...form, validDays });
      setCreated(result);
      toast({ title: "VIP daveti oluşturuldu", description: "Ham anahtar yalnızca bu ekranda bir kez gösterilir." });
      await load();
    } catch (error: unknown) {
      toast({
        title: "VIP daveti oluşturulamadı",
        description: error instanceof Error ? error.message : "Beklenmeyen hata",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const invitationUrl = created ? `${window.location.origin}/vip/${encodeURIComponent(created.token)}` : "";

  const handleCopy = async () => {
    if (!invitationUrl) return;
    await navigator.clipboard.writeText(invitationUrl);
    setCopied(true);
    toast({ title: "VIP bağlantısı kopyalandı" });
  };

  const handleRevoke = async (item: VipInvitationListItem) => {
    if (!window.confirm(`${item.recipientName ?? item.title} davetini iptal etmek istiyor musun?`)) return;
    try {
      await revokeVipInvitation(item.id, "Admin panelinden iptal edildi");
      toast({ title: "VIP daveti iptal edildi" });
      await load();
    } catch (error: unknown) {
      toast({
        title: "Davet iptal edilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen hata",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminPageShell
      title="VIP Davetleri"
      description="Tek kullanımlık, iptal edilebilir ve varsayılan 30 günlük kişisel davetler. Ham anahtar veritabanında tutulmaz."
      icon={Crown}
      accent="amber"
      contentWidth="wide"
    >
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader><CardTitle className="text-lg">Yeni davet</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="space-y-2">
                <Label htmlFor="vip-name">Alıcı adı</Label>
                <Input id="vip-name" value={form.recipientName} onChange={(event) => setForm((current) => ({ ...current, recipientName: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vip-email">Alıcı e-postası</Label>
                <Input id="vip-email" type="email" value={form.recipientEmail} onChange={(event) => setForm((current) => ({ ...current, recipientEmail: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vip-title">Başlık</Label>
                <Input id="vip-title" required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vip-message">Kişisel mesaj</Label>
                <Textarea id="vip-message" rows={4} value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vip-days">Geçerlilik (gün)</Label>
                <Input id="vip-days" type="number" min={1} max={365} value={form.validDays} onChange={(event) => setForm((current) => ({ ...current, validDays: event.target.value }))} />
              </div>
              <Button className="w-full gap-2" disabled={saving} type="submit">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Davet oluştur
              </Button>
            </form>

            {created && (
              <div className="mt-5 space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
                <p className="text-sm font-semibold">Bu bağlantı yalnızca şimdi gösterilir.</p>
                <Input readOnly aria-label="Oluşturulan VIP bağlantısı" value={invitationUrl} />
                <Button variant="outline" className="w-full gap-2" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Kopyalandı" : "Bağlantıyı kopyala"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Davet geçmişi</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Yükleniyor…</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz VIP daveti yok.</p>
            ) : items.map((item) => {
              const state = invitationState(item);
              return (
                <div key={item.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{item.recipientName ?? item.title}</p>
                      <Badge variant={state.variant}>{state.label}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.recipientEmail ?? "E-posta belirtilmedi"}</p>
                    <p className="text-xs text-muted-foreground">Son tarih: {new Date(item.expiresAt).toLocaleString("tr-TR")}</p>
                  </div>
                  {!item.revokedAt && !item.redeemedAt && new Date(item.expiresAt).getTime() > Date.now() && (
                    <Button variant="outline" size="sm" className="gap-2 text-destructive" onClick={() => handleRevoke(item)}>
                      <ShieldX className="h-4 w-4" /> İptal et
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </AdminPageShell>
  );
};

export default AdminVipInvitationsPage;
