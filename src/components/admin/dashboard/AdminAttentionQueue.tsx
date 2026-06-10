// Admin Panel V2 — dikkat isteyenler bloğu (masterplan §8.1.C).
// İlk sürüm: bekleyen approval'lar; veri yoksa "her şey yolunda" durumu.

import { ArrowRight, CheckCircle2, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";

import type { AdminDashboardSummary } from "@/lib/admin-shell/admin-dashboard-api";

type AdminAttentionQueueProps = {
  summary?: AdminDashboardSummary;
  isLoading: boolean;
};

const AdminAttentionQueue = ({ summary, isLoading }: AdminAttentionQueueProps) => {
  const pending = summary?.pendingApprovals;

  return (
    <section aria-label="Dikkat isteyenler" className="rounded-2xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold text-foreground">Dikkat İsteyenler</h2>
      <div className="mt-3 space-y-2">
        {isLoading ? (
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
        ) : typeof pending === "number" && pending > 0 ? (
          <Link
            to="/admin/approvals"
            className="flex items-center justify-between rounded-lg border border-amber-300/60 bg-amber-500/10 px-3 py-2.5 text-sm transition-colors hover:bg-amber-500/20"
          >
            <span className="inline-flex items-center gap-2 font-medium text-foreground">
              <ClipboardList aria-hidden="true" className="h-4 w-4 text-amber-600" />
              {pending} bekleyen approval talebi var
            </span>
            <ArrowRight aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
          </Link>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-emerald-500" />
            {typeof pending === "number"
              ? "Şu an dikkat bekleyen iş yok."
              : "Dikkat metrikleri şu an yüklenemedi."}
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminAttentionQueue;
