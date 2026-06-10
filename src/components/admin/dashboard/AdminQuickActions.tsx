// Admin Panel V2 — hızlı işlemler (masterplan §8.1.D).
// Hepsi mevcut route'lara link; URL değişikliği yok.

import {
  ClipboardList,
  ListChecks,
  MessageSquare,
  PlusCircle,
  Search,
  Shield,
  SlidersHorizontal,
  TrendingDown,
} from "lucide-react";
import { Link } from "react-router-dom";

type QuickAction = {
  label: string;
  to: string;
  icon: typeof Search;
};

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Kayıt ara", to: "/admin/data", icon: Search },
  { label: "Approval Queue aç", to: "/admin/approvals", icon: ClipboardList },
  { label: "AFS matrisi aç", to: "/admin/new-member/role-matrix", icon: Shield },
  { label: "Feature override tanımla", to: "/admin/new-member/overrides", icon: SlidersHorizontal },
  { label: "Topluluk landingleri", to: "/admin/whatsapp-landings", icon: MessageSquare },
  { label: "Command Center aç", to: "/admin/workspace/command-center", icon: ListChecks },
  { label: "Yeni anket oluştur", to: "/admin/surveys/new", icon: PlusCircle },
  { label: "Gider ekle", to: "/admin/muhasebe/giderler", icon: TrendingDown },
];

const AdminQuickActions = () => (
  <section aria-label="Hızlı işlemler" className="rounded-2xl border border-border bg-card p-4">
    <h2 className="text-sm font-semibold text-foreground">Hızlı İşlemler</h2>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.to + action.label}
            to={action.to}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
          >
            <Icon aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
            {action.label}
          </Link>
        );
      })}
    </div>
  </section>
);

export default AdminQuickActions;
