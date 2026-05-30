import { useState } from "react";
import { Tag, Plus, X, Copy, Check, Percent, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export interface Coupon {
  id: number;
  title: string;
  code: string;
  type: "percent" | "fixed" | "gift";
  value: number;
  description: string;
  expires: string;
  usageLimit: number;
  usedCount: number;
  active: boolean;
  businessName: string;
  businessLogo: string;
}

// Business-side coupon manager
export const CouponManager = ({ businessName }: { businessName: string }) => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([
    { id: 1, title: "Hoşgeldin İndirimi", code: "HOSGELDIN15", type: "percent", value: 15, description: "İlk alışverişe özel %15 indirim", expires: "30 Nis 2026", usageLimit: 100, usedCount: 34, active: true, businessName, businessLogo: "" },
    { id: 2, title: "Hediye Tatlı", code: "TATLI1", type: "gift", value: 0, description: "50€ üzeri siparişlerde 1 adet baklava hediye", expires: "15 Mar 2026", usageLimit: 50, usedCount: 48, active: true, businessName, businessLogo: "" },
  ]);
  const [form, setForm] = useState({ title: "", code: "", type: "percent" as Coupon["type"], value: 0, description: "", expires: "", usageLimit: 100 });

  const handleCreate = () => {
    if (!form.title || !form.code) return;
    setCoupons(prev => [...prev, {
      id: Date.now(), ...form, usedCount: 0, active: true, businessName, businessLogo: "",
    }]);
    setForm({ title: "", code: "", type: "percent", value: 0, description: "", expires: "", usageLimit: 100 });
    setShowForm(false);
    toast({ title: "Kupon oluşturuldu! 🎉", description: `${form.code} kodu aktif edildi.` });
  };

  const toggleCoupon = (id: number) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Tag className="h-5 w-5 text-gold" /> İndirim Kuponları
        </h2>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "İptal" : "Kupon Oluştur"}
        </Button>
      </div>

      {showForm && (
        <div className="border border-dashed border-gold/30 rounded-xl p-5 bg-gold/5 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Kupon Başlığı</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ör: Yaz İndirimi" />
            </div>
            <div>
              <Label>Kupon Kodu</Label>
              <Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="Ör: YAZ20" className="font-mono" />
            </div>
          </div>
          <div>
            <Label>Kupon Türü</Label>
            <div className="flex gap-2 mt-2">
              {([
                { key: "percent" as const, label: "% İndirim", icon: Percent },
                { key: "fixed" as const, label: "€ İndirim", icon: Tag },
                { key: "gift" as const, label: "Hediye Ürün", icon: Gift },
              ]).map(t => (
                <Button key={t.key} variant={form.type === t.key ? "default" : "outline"} size="sm" className="gap-1 text-xs" onClick={() => setForm(p => ({ ...p, type: t.key }))}>
                  <t.icon className="h-3 w-3" /> {t.label}
                </Button>
              ))}
            </div>
          </div>
          {form.type !== "gift" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{form.type === "percent" ? "İndirim Oranı (%)" : "İndirim Tutarı (€)"}</Label>
                <Input type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Kullanım Limiti</Label>
                <Input type="number" value={form.usageLimit} onChange={e => setForm(p => ({ ...p, usageLimit: Number(e.target.value) }))} />
              </div>
            </div>
          )}
          <div>
            <Label>Açıklama</Label>
            <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Kupon açıklaması..." rows={2} />
          </div>
          <div>
            <Label>Son Kullanma Tarihi</Label>
            <Input value={form.expires} onChange={e => setForm(p => ({ ...p, expires: e.target.value }))} placeholder="Ör: 30 Nis 2026" />
          </div>
          <Button onClick={handleCreate} className="w-full bg-gold hover:bg-gold/90 text-primary-foreground">Kupon Oluştur</Button>
        </div>
      )}

      <div className="space-y-3">
        {coupons.map(c => (
          <div key={c.id} className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${c.active ? "bg-muted/50" : "bg-muted/20 opacity-60"}`}>
            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
              {c.type === "gift" ? <Gift className="h-5 w-5 text-gold" /> : c.type === "percent" ? <Percent className="h-5 w-5 text-gold" /> : <Tag className="h-5 w-5 text-gold" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">{c.title}</h3>
                <Badge variant={c.active ? "default" : "secondary"} className="text-xs">{c.active ? "Aktif" : "Pasif"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{c.description}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <code className="bg-card px-2 py-0.5 rounded border border-border font-bold text-primary">{c.code}</code>
                <span>Kullanım: {c.usedCount}/{c.usageLimit}</span>
                <span>Son: {c.expires}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => toggleCoupon(c.id)}>
              {c.active ? "Durdur" : "Aktifleştir"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

// User-side coupon display for individual profile
export const UserCoupons = ({ coupons }: { coupons: Coupon[] }) => {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyCode = (id: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast({ title: "Kod kopyalandı! 📋", description: `${code} panoya kopyalandı.` });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {coupons.map(c => (
        <div key={c.id} className="relative border border-dashed border-gold/30 rounded-xl p-5 bg-gold/5 hover:bg-gold/10 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            {c.type === "gift" ? <Gift className="h-4 w-4 text-gold" /> : <Tag className="h-4 w-4 text-gold" />}
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.type === "gift" ? "bg-turquoise/10 text-turquoise" : "bg-gold/10 text-gold"}`}>
              {c.type === "gift" ? "Hediye" : c.type === "percent" ? `%${c.value} İndirim` : `€${c.value} İndirim`}
            </span>
          </div>
          <h3 className="font-bold text-foreground mb-1">{c.title}</h3>
          <p className="text-xs text-muted-foreground mb-1">{c.businessName}</p>
          <p className="text-xs text-muted-foreground mb-3">Son: {c.expires}</p>
          <button
            onClick={() => copyCode(c.id, c.code)}
            className="w-full bg-card rounded-lg px-3 py-2 text-center border border-border hover:border-gold/30 transition-colors flex items-center justify-center gap-2"
          >
            <code className="text-sm font-bold text-primary tracking-wider">{c.code}</code>
            {copiedId === c.id ? <Check className="h-3 w-3 text-turquoise" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
          </button>
        </div>
      ))}
    </div>
  );
};
