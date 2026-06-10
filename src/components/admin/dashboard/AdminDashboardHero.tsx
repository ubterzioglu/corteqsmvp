// Admin Panel V2 — dashboard welcome hero (masterplan §8.1.A).
// Kişisel isim güvenilir olmadığı için e-posta kullanılır.

import { Sparkles } from "lucide-react";

import type { AdminDashboardSummary } from "@/lib/admin-shell/admin-dashboard-api";

type AdminDashboardHeroProps = {
  email?: string;
  summary?: AdminDashboardSummary;
};

function greetingByHour(hour: number): string {
  if (hour >= 5 && hour < 12) return "Günaydın";
  if (hour >= 12 && hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

function attentionSentence(summary?: AdminDashboardSummary): string {
  if (!summary) return "CorteQS operasyon merkezine hoş geldin.";

  const parts: string[] = [];
  if (typeof summary.pendingApprovals === "number" && summary.pendingApprovals > 0) {
    parts.push(`${summary.pendingApprovals} bekleyen approval`);
  }
  if (typeof summary.auditLogsLast24h === "number" && summary.auditLogsLast24h > 0) {
    parts.push(`son 24 saatte ${summary.auditLogsLast24h} audit kaydı`);
  }

  if (parts.length === 0) {
    return "CorteQS operasyon merkezine hoş geldin. Şu an dikkat bekleyen iş görünmüyor.";
  }
  return `Bugün dikkat isteyenler: ${parts.join(" ve ")}.`;
}

const AdminDashboardHero = ({ email, summary }: AdminDashboardHeroProps) => (
  <section className="overflow-hidden rounded-2xl border border-border bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.14),_transparent_45%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_40%)] bg-card p-6">
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
      <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-amber-500" />
      CorteQS Admin
    </div>
    <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
      {greetingByHour(new Date().getHours())}
      {email ? `, ${email}` : ""}
    </h1>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
      {attentionSentence(summary)}
    </p>
  </section>
);

export default AdminDashboardHero;
