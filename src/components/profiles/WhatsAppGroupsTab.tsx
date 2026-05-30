import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Globe, ExternalLink, Plus, MessageSquare, Bot, Bell, Phone, Megaphone, Trash2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { listMyLandings, deleteMyLanding, type WhatsAppLanding } from "@/lib/whatsappLandings";

const corteqsFeatures = [
  { icon: Bell, label: "Bildirimler", desc: "Platform bildirimleri anlık olarak WhatsApp'ınıza gelir" },
  { icon: MessageSquare, label: "Mesajlar", desc: "Danışman ve işletmelerden gelen mesajları takip edin" },
  { icon: Phone, label: "RFQ & Teklifler", desc: "Hizmet talepleri ve teklifleriniz hakkında anında haberdar olun" },
  { icon: Bot, label: "CorteQS Bot", desc: "Hesap bilgileri, ödemeler ve destek için 1'e 1 görüşme" },
];

const statusMeta: Record<string, { label: string; cls: string; Icon: typeof Clock }> = {
  pending: { label: "Onay bekliyor", cls: "bg-amber-500/10 text-amber-600 border-amber-500/30", Icon: Clock },
  approved: { label: "Onaylandı", cls: "bg-success/10 text-success border-success/30", Icon: CheckCircle2 },
  rejected: { label: "Reddedildi", cls: "bg-destructive/10 text-destructive border-destructive/30", Icon: XCircle },
};

const WhatsAppGroupsTab = () => {
  const [items, setItems] = useState<(WhatsAppLanding & { dbId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const refresh = async () => {
    setLoading(true);
    setItems(await listMyLandings());
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const handleDelete = async (dbId: string, name: string) => {
    if (!confirm(`"${name}" başvurusunu silmek istediğine emin misin?`)) return;
    try {
      await deleteMyLanding(dbId);
      setItems((prev) => prev.filter((i) => i.dbId !== dbId));
      toast({ title: "Silindi", description: `${name} başvurun kaldırıldı.` });
    } catch (e) {
      toast({ title: "Silinemedi", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Live announcement */}
      <div className="rounded-xl border-2 border-success/40 bg-gradient-to-r from-success/10 to-success/5 p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-success/20 flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-5 w-5 text-success" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">🎉 Chat Grup yükleme açıldı!</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Artık ülke, şehir ve temaya göre grubunuzu ekleyebilir; landing page oluşturabilir veya landing page'i atlayarak doğrudan WhatsApp linkinizle yayınlayabilirsiniz.
          </p>
          <Link to="/whatsapp-groups">
            <Button size="sm" className="mt-2 h-7 text-xs gap-1 bg-success hover:bg-success/90 text-white">
              <Plus className="h-3 w-3" /> Hemen Grup Yükle
            </Button>
          </Link>
        </div>
      </div>

      {/* CorteQS WhatsApp İletişim */}
      <div className="rounded-2xl border-2 border-success/30 bg-success/5 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-success/20 flex items-center justify-center shrink-0">
            <Bot className="h-6 w-6 text-success" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-foreground text-base">CorBot — CorteQS'in yapay zekâ WhatsApp botu</h3>
            <p className="text-xs text-muted-foreground">Hızlı erişim & bilgi · Bildirimler, mesajlar ve destek tek bir yerde</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs">
              <a href="https://wa.me/491637084577?text=Merhaba" target="_blank" rel="noopener noreferrer" className="text-success hover:underline font-medium inline-flex items-center gap-1">🤖 CorBot — WhatsApp Bot</a>
              <a href="https://whatsapp.com/channel/0029VbCUnsN6GcGHZvUypo13" target="_blank" rel="noopener noreferrer" className="text-success hover:underline font-medium inline-flex items-center gap-1">📣 CorteQS Kanalı</a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {corteqsFeatures.map((f, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-lg bg-background/60 border border-border p-3">
              <f.icon className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <a href="https://wa.me/4915200000000?text=Merhaba%20CorteQS%2C%20hesabımı%20bağlamak%20istiyorum" target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button className="w-full gap-2 bg-success hover:bg-success/90 text-white"><Bot className="h-4 w-4" /> CorteQS Bot ile Bağlan</Button>
          </a>
          <a href="https://whatsapp.com/channel/0029VbCUnsN6GcGHZvUypo13" target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button variant="outline" className="w-full gap-2 border-success/40 text-success hover:bg-success/10"><Megaphone className="h-4 w-4" /> CorteQS Kanalını Takip Et</Button>
          </a>
        </div>

        <p className="text-[11px] text-muted-foreground text-center">WhatsApp ile bağlanarak bildirimlerinizi, mesajlarınızı ve RFQ güncellemelerinizi anlık olarak alabilirsiniz.</p>
      </div>

      {/* Başvuru Gönderilen Gruplar */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
          <MessageSquare className="h-4 w-4 text-success" /> Başvuru Gönderilen Gruplar
          {items.length > 0 && <span className="text-xs text-muted-foreground font-normal">({items.length})</span>}
        </h3>
        <div className="flex gap-2">
          <Link to="/whatsapp-groups">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs"><Globe className="h-3.5 w-3.5" /> Keşfet</Button>
          </Link>
          <Link to="/whatsapp-groups">
            <Button size="sm" className="gap-1.5 h-8 text-xs"><Plus className="h-3.5 w-3.5" /> Grup Ekle</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground py-4 text-center">Yükleniyor…</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 py-5 px-4 text-center">
          <p className="text-xs text-muted-foreground">Henüz bir grup başvurun yok. <Link to="/whatsapp-groups" className="text-success hover:underline">Yeni grup ekle</Link></p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border bg-card overflow-hidden">
          {items.map((g) => {
            const meta = statusMeta[g.status ?? "pending"] ?? statusMeta.pending;
            const Icon = meta.Icon;
            return (
              <div key={g.dbId} className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 transition-colors">
                <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="h-4 w-4 text-success" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{g.groupName}</p>
                    <Badge variant="outline" className={`text-[10px] h-5 gap-1 ${meta.cls}`}>
                      <Icon className="h-2.5 w-2.5" /> {meta.label}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {g.city}, {g.country} · {g.category}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {g.status === "approved" && (
                    <Link to={`/whatsapp-groups/${g.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                        <ExternalLink className="h-3 w-3" /> Görüntüle
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(g.dbId, g.groupName)}
                    aria-label="Sil"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WhatsAppGroupsTab;
