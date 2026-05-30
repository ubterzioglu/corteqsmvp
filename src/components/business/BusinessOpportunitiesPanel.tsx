import { useEffect, useState } from "react";
import { Handshake, Plus, Mail, Trash2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type Opportunity = {
  id: string;
  title: string;
  description: string;
  contactEmail: string;
  active: boolean;
  createdAt: string;
};

const STORAGE_KEY = "business_opportunities_v1";

const BusinessOpportunitiesPanel = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Opportunity[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = (next: Opportunity[]) => {
    setItems(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const handleAdd = () => {
    if (!title.trim() || !contactEmail.trim()) {
      toast({ title: "Eksik bilgi", description: "Başlık ve iletişim e-postası gerekli.", variant: "destructive" });
      return;
    }
    const next: Opportunity = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      contactEmail: contactEmail.trim(),
      active: true,
      createdAt: new Date().toISOString(),
    };
    persist([next, ...items]);
    setTitle(""); setDescription(""); setContactEmail("");
    toast({ title: "Fırsat eklendi", description: "İşletme profilinizde yayında." });
  };

  const toggle = (id: string) => persist(items.map(i => i.id === id ? { ...i, active: !i.active } : i));
  const remove = (id: string) => persist(items.filter(i => i.id !== id));

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Handshake className="h-5 w-5 text-primary" /> İş Fırsatları & Ortaklık
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          İşletme profilinizde görünen iş birliği ve ortaklık tekliflerinizi buradan yönetin.
          Başvurular doğrudan e-posta adresinize iletilir.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Başlık *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn. Bayilik Fırsatı" />
          </div>
          <div>
            <Label className="text-xs">İletişim E-postası *</Label>
            <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="ortaklik@firmaniz.com" />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Açıklama</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Fırsatın detayları, hedef profil, koşullar..." />
          </div>
        </div>
        <Button onClick={handleAdd} className="gap-1.5 mt-4">
          <Plus className="h-4 w-4" /> Fırsat Ekle
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <Inbox className="h-4 w-4 text-primary" /> Yayındaki Fırsatlar
          <Badge variant="secondary" className="text-xs">{items.length}</Badge>
        </h3>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Henüz bir fırsat eklemediniz.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id} className="border border-border rounded-xl p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-foreground">{it.title}</h4>
                    <Badge variant={it.active ? "default" : "secondary"} className="text-[10px]">
                      {it.active ? "Aktif" : "Pasif"}
                    </Badge>
                  </div>
                  {it.description && (
                    <p className="text-sm text-muted-foreground mt-1">{it.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {it.contactEmail}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={it.active} onCheckedChange={() => toggle(it.id)} />
                  <Button variant="ghost" size="icon" onClick={() => remove(it.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessOpportunitiesPanel;
