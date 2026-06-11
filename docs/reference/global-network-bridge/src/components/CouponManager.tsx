import { useState } from "react";
import { Tag, Plus, X, Copy, Check, Percent, Gift, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CouponCheckoutDialog } from "@/components/CouponCheckoutDialog";

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
  price?: number;
  isFree?: boolean;
  businessUserId?: string;
}

// Business-side coupon manager
export const CouponManager = ({ businessName }: { businessName: string }) => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([
    { id: 1, title: "Hoşgeldin İndirimi", code: "HOSGELDIN15", type: "percent", value: 15, description: "İlk alışverişe özel %15 indirim", expires: "", usageLimit: 100, usedCount: 0, active: false, businessName, businessLogo: "", price: 0, isFree: true },
  ]);
  const [form, setForm] = useState({ title: "", code: "", type: "percent" as Coupon["type"], value: 0, description: "", expires: "", usageLimit: 100, isFree: true, price: 0 });
  const [pendingActivationId, setPendingActivationId] = useState<number | null>(null);
  const [previewCoupon, setPreviewCoupon] = useState<Coupon | null>(null);

  const handleCreate = () => {
    if (!form.title || !form.code) return;
    if (pendingActivationId !== null) {
      setCoupons(prev => prev.map(c => c.id === pendingActivationId ? { ...c, ...form, active: true } : c));
      toast({ title: "Kupon aktifleştirildi! 🎉", description: `${form.code} profilde yayında ve satın alınabilir.` });
      setPendingActivationId(null);
    } else {
      setCoupons(prev => [...prev, {
        id: Date.now(), ...form, usedCount: 0, active: true, businessName, businessLogo: "",
      }]);
      toast({ title: "Kupon oluşturuldu! 🎉", description: `${form.code} kodu aktif edildi.` });
    }
    setForm({ title: "", code: "", type: "percent", value: 0, description: "", expires: "", usageLimit: 100, isFree: true, price: 0 });
    setShowForm(false);
  };

  const toggleCoupon = (id: number) => {
    const c = coupons.find(x => x.id === id);
    if (!c) return;
    if (!c.active) {
      // Activating: open prefilled form so business completes details (price/free, expiry, etc.)
      setForm({ title: c.title, code: c.code, type: c.type, value: c.value, description: c.description, expires: c.expires, usageLimit: c.usageLimit, isFree: c.isFree ?? true, price: c.price ?? 0 });
      setPendingActivationId(id);
      setShowForm(true);
      toast({ title: "Detayları tamamlayın", description: "Son kullanma tarihi ve diğer detayları girip aktifleştirin." });
      return;
    }
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: false } : c));
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
          <div>
            <Label>Fiyatlandırma</Label>
            <div className="flex gap-2 mt-2">
              <Button type="button" size="sm" variant={form.isFree ? "default" : "outline"} onClick={() => setForm(p => ({ ...p, isFree: true, price: 0 }))}>Ücretsiz</Button>
              <Button type="button" size="sm" variant={!form.isFree ? "default" : "outline"} onClick={() => setForm(p => ({ ...p, isFree: false }))}>Ücretli (€)</Button>
            </div>
            {!form.isFree && (
              <Input type="number" min={0} step="0.5" value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} placeholder="Kupon satış fiyatı (€)" className="mt-2" />
            )}
          </div>
          <Button onClick={handleCreate} className="w-full bg-gold hover:bg-gold/90 text-primary-foreground">{pendingActivationId !== null ? "Aktifleştir & Yayınla" : "Kupon Oluştur"}</Button>
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
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                <code className="bg-card px-2 py-0.5 rounded border border-border font-bold text-primary">{c.code}</code>
                <span>Kullanım: {c.usedCount}/{c.usageLimit}</span>
                {c.expires && <span>Son: {c.expires}</span>}
                <Badge variant="outline" className="text-[10px]">{c.isFree ?? true ? "Ücretsiz" : `€${(c.price ?? 0).toFixed(2)}`}</Badge>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {c.active && (
                <Button variant="outline" size="sm" className="gap-1" onClick={() => setPreviewCoupon(c)}>
                  <ShoppingCart className="h-3.5 w-3.5" /> Satın Al (Önizle)
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => toggleCoupon(c.id)}>
                {c.active ? "Durdur" : "Aktifleştir"}
              </Button>
            </div>
          </div>
        ))}
      </div>
      <CouponCheckoutDialog coupon={previewCoupon} open={!!previewCoupon} onOpenChange={(o) => !o && setPreviewCoupon(null)} />
    </div>
  );
};

// User-side coupon display for individual profile
export const UserCoupons = ({ coupons }: { coupons: Coupon[] }) => {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [buyCoupon, setBuyCoupon] = useState<Coupon | null>(null);

  const copyCode = (id: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast({ title: "Kod kopyalandı! 📋", description: `${code} panoya kopyalandı.` });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {coupons.map(c => {
        const isFree = c.isFree ?? (Number(c.price ?? 0) === 0);
        return (
          <div key={c.id} className="relative border border-dashed border-gold/30 rounded-xl p-5 bg-gold/5 hover:bg-gold/10 transition-colors flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              {c.type === "gift" ? <Gift className="h-4 w-4 text-gold" /> : <Tag className="h-4 w-4 text-gold" />}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.type === "gift" ? "bg-turquoise/10 text-turquoise" : "bg-gold/10 text-gold"}`}>
                {c.type === "gift" ? "Hediye" : c.type === "percent" ? `%${c.value} İndirim` : `€${c.value} İndirim`}
              </span>
              <Badge variant="outline" className="text-[10px] ml-auto">{isFree ? "Ücretsiz" : `€${(c.price ?? 0).toFixed(2)}`}</Badge>
            </div>
            <h3 className="font-bold text-foreground mb-1">{c.title}</h3>
            <p className="text-xs text-muted-foreground mb-1">{c.businessName}</p>
            {c.expires && <p className="text-xs text-muted-foreground mb-3">Son: {c.expires}</p>}
            <div className="mt-auto space-y-2">
              <Button onClick={() => setBuyCoupon(c)} className="w-full gap-1.5 bg-gold hover:bg-gold/90 text-primary-foreground">
                <ShoppingCart className="h-3.5 w-3.5" /> {isFree ? "Kuponu Al" : "Satın Al"}
              </Button>
              <button
                onClick={() => copyCode(c.id, c.code)}
                className="w-full bg-card rounded-lg px-3 py-2 text-center border border-border hover:border-gold/30 transition-colors flex items-center justify-center gap-2"
              >
                <code className="text-sm font-bold text-primary tracking-wider">{c.code}</code>
                {copiedId === c.id ? <Check className="h-3 w-3 text-turquoise" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
              </button>
            </div>
          </div>
        );
      })}
      <CouponCheckoutDialog coupon={buyCoupon} open={!!buyCoupon} onOpenChange={(o) => !o && setBuyCoupon(null)} />
    </div>
  );
};
