// Admin Panel V2 — KPI strip (masterplan §8.1.B).
// Hesaplanamayan metrik "—" gösterir; loading'de skeleton.

import { ClipboardList, Database, Layers, ScrollText, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";
import type { AdminDashboardSummary } from "@/lib/admin-shell/admin-dashboard-api";
import { accentIconClasses } from "@/components/admin/shell/admin-accent";
import type { AdminAccent } from "@/lib/admin-shell/admin-shell-types";

type AdminDashboardKpisProps = {
  summary?: AdminDashboardSummary;
  isLoading: boolean;
};

type KpiCard = {
  key: keyof AdminDashboardSummary;
  label: string;
  to: string;
  icon: typeof Database;
  accent: AdminAccent;
};

const KPI_CARDS: KpiCard[] = [
  { key: "catalogItems", label: "Katalog Kaydı", to: "/admin/data", icon: Database, accent: "sky" },
  { key: "roles", label: "Tanımlı Rol", to: "/admin/new-member/roles-overview", icon: Layers, accent: "emerald" },
  { key: "pendingApprovals", label: "Bekleyen Approval", to: "/admin/approvals", icon: ClipboardList, accent: "amber" },
  { key: "featureOverrides", label: "Feature Override", to: "/admin/new-member/overrides", icon: SlidersHorizontal, accent: "indigo" },
  { key: "auditLogsLast24h", label: "Audit (24 saat)", to: "/admin/audit-logs", icon: ScrollText, accent: "red" },
];

const AdminDashboardKpis = ({ summary, isLoading }: AdminDashboardKpisProps) => (
  <section aria-label="Özet metrikler" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
    {KPI_CARDS.map((card) => {
      const Icon = card.icon;
      const value = summary?.[card.key];

      return (
        <Link
          key={card.key}
          to={card.to}
          className="rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
            <Icon aria-hidden="true" className={cn("h-4 w-4", accentIconClasses[card.accent])} />
          </div>
          {isLoading ? (
            <div className="mt-2 h-8 w-16 animate-pulse rounded bg-muted" />
          ) : (
            <div className="mt-1 text-2xl font-bold text-foreground">
              {typeof value === "number" ? value : "—"}
            </div>
          )}
        </Link>
      );
    })}
  </section>
);

export default AdminDashboardKpis;
