import { useMemo, useState } from "react";
import {
  CreditCard, ArrowUpRight, ArrowDownRight, Download,
  TrendingUp, TrendingDown, Wallet, ExternalLink, Filter, Info
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useDemoFlag } from "@/lib/demoFlags";

export type StripeTxn = {
  id: string;
  date: string; // ISO or display
  description: string;
  direction: "in" | "out"; // in = tahsilat, out = harcama
  amount: number; // positive number, in EUR
  status: "succeeded" | "pending" | "refunded" | "failed";
  source?: string; // ör. "AI Twin Seans", "Etkinlik Bileti"
  stripeRef?: string; // ör. "ch_3PXyz..."
};

interface Props {
  title?: string;
  transactions?: StripeTxn[];
  /** Para birimi sembolü, varsayılan € */
  currency?: string;
  /** Stripe henüz bağlı değilken Ready banner gösterilsin */
  stripeConnected?: boolean;
  /** Bireysel kullanıcılar tahsilat yapamaz — sadece harcama göster */
  outgoingOnly?: boolean;
}

const defaultTxns: StripeTxn[] = [
  { id: "demo_001", date: "2026-04-28", description: "Demo · AI Twin Seans — Ayşe Kara", direction: "out", amount: 15, status: "succeeded", source: "Demo", stripeRef: "demo_ch_001" },
  { id: "demo_002", date: "2026-04-22", description: "Demo · Danışmanlık Tahsilatı — Can Özdemir", direction: "in", amount: 120, status: "succeeded", source: "Demo", stripeRef: "demo_py_002" },
];

const statusBadge: Record<StripeTxn["status"], { label: string; cls: string }> = {
  succeeded: { label: "Başarılı", cls: "bg-success/15 text-success border-success/30" },
  pending:   { label: "Bekliyor", cls: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  refunded:  { label: "İade",     cls: "bg-muted text-muted-foreground border-border" },
  failed:    { label: "Başarısız", cls: "bg-destructive/15 text-destructive border-destructive/30" },
};

const StripeTransactionsPanel = ({
  title = "İşlemlerim",
  transactions,
  currency = "€",
  stripeConnected = false,
  outgoingOnly = false,
}: Props) => {
  const [filter, setFilter] = useState<"all" | "in" | "out">(outgoingOnly ? "out" : "all");
  const hasReal = useDemoFlag("transactions");
  const isDemo = !transactions && !hasReal;
  const baseTxns: StripeTxn[] = transactions ?? (hasReal ? [] : defaultTxns);
  const effectiveTxns: StripeTxn[] = outgoingOnly
    ? baseTxns.filter((t) => t.direction === "out")
    : baseTxns;

  const visible = useMemo(
    () => filter === "all" ? effectiveTxns : effectiveTxns.filter(t => t.direction === filter),
    [filter, effectiveTxns]
  );

  const totals = useMemo(() => {
    const succeeded = effectiveTxns.filter(t => t.status === "succeeded");
    const inSum = succeeded.filter(t => t.direction === "in").reduce((s, t) => s + t.amount, 0);
    const outSum = succeeded.filter(t => t.direction === "out").reduce((s, t) => s + t.amount, 0);
    return { inSum, outSum, net: inSum - outSum };
  }, [effectiveTxns]);

  const exportCsv = () => {
    const header = "id,date,description,direction,amount,status,source,stripe_ref\n";
    const rows = effectiveTxns.map(t =>
      [t.id, t.date, `"${t.description}"`, t.direction, t.amount, t.status, t.source ?? "", t.stripeRef ?? ""].join(",")
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "islemlerim.csv";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Stripe Ready banner */}
      {!stripeConnected && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              Stripe Ready · Yakında Aktif
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {outgoingOnly
                ? "Bireysel hesaplar yalnızca harcama (ödeme) yapabilir; tahsilat ve satış yapılamaz. Aşağıdaki kayıtlar tüm ödemelerinizi listeler."
                : "Tüm tahsilat ve harcamalarınız Stripe üzerinden güvenle takip edilecek. Aşağıdaki kayıtlar entegrasyon tamamlandığında otomatik dolacak."}
            </p>
          </div>
          <Badge variant="outline" className="border-primary/40 text-primary shrink-0">
            Stripe
          </Badge>
        </div>
      )}

      {isDemo && (
        <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-3 flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1 text-xs">
            <p className="font-semibold text-foreground">Demo görünüm</p>
            <p className="text-muted-foreground mt-0.5">
              İşlemleriniz burada listelenecek. Aşağıdakiler örnek (demo) kayıtlardır;
              ilk gerçek Stripe işleminizde otomatik olarak kaldırılır.
            </p>
          </div>
          <Badge variant="outline" className="border-amber-500/40 text-amber-700 shrink-0 text-[10px]">Demo</Badge>
        </div>
      )}

      {/* Summary cards */}
      <div className={`grid grid-cols-1 ${outgoingOnly ? "" : "md:grid-cols-3"} gap-4`}>
        {!outgoingOnly && (
          <Card className="border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">Toplam Tahsilat</p>
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <p className="text-2xl font-extrabold text-foreground">
                {currency}{totals.inSum.toLocaleString()}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">Stripe üzerinden gelen ödemeler</p>
            </CardContent>
          </Card>
        )}
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Toplam Harcama</p>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-2xl font-extrabold text-foreground">
              {currency}{totals.outSum.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Stripe üzerinden yapılan ödemeler</p>
          </CardContent>
        </Card>
        {!outgoingOnly && (
          <Card className="border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">Net</p>
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <p className={`text-2xl font-extrabold ${totals.net >= 0 ? "text-success" : "text-destructive"}`}>
                {totals.net >= 0 ? "+" : "-"}{currency}{Math.abs(totals.net).toLocaleString()}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">Tahsilat − Harcama</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transactions table */}
      <Card className="border-border">
        <CardContent className="p-0">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">{title}</h3>
              <Badge variant="outline" className="text-[10px]">Stripe</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {!outgoingOnly && <SelectItem value="in">Tahsilat</SelectItem>}
                  <SelectItem value="out">Harcama</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={exportCsv}>
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
            </div>
          </div>

          <div className="divide-y divide-border">
            {visible.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                {effectiveTxns.length === 0
                  ? "Henüz bir işleminiz yok. İşlemleriniz burada listelenecek."
                  : "Bu filtre için işlem bulunamadı."}
              </div>
            )}
            {visible.map((tx) => {
              const isIn = tx.direction === "in";
              const sb = statusBadge[tx.status];
              return (
                <div key={tx.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isIn ? "bg-success/10" : "bg-destructive/10"}`}>
                      {isIn ? (
                        <ArrowUpRight className="h-4 w-4 text-success" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate flex items-center gap-2">
                        {tx.description}
                        {isDemo && (
                          <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-700 bg-amber-500/10 shrink-0">
                            DEMO
                          </Badge>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                        {tx.source && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tx.source}</span>
                        )}
                        <Badge variant="outline" className={`text-[10px] ${sb.cls}`}>{sb.label}</Badge>
                        {tx.stripeRef && (
                          <span className="text-[10px] text-muted-foreground/70 font-mono">{tx.stripeRef}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold text-sm ${isIn ? "text-success" : "text-destructive"}`}>
                      {isIn ? "+" : "-"}{currency}{tx.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>İşlemler Stripe API üzerinden senkronize edilir.</span>
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Stripe Dashboard <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StripeTransactionsPanel;
