// Admin Panel V2 — son kullanılanlar widget'ı (masterplan §8.1.F).

import { Clock } from "lucide-react";
import { Link } from "react-router-dom";

import { useAdminRecentPages } from "@/hooks/admin/useAdminRecentPages";

const AdminRecentPages = () => {
  const { recentPages } = useAdminRecentPages();
  // Dashboard'un kendisi de kaydedildiği için listede gizlenir.
  const pages = recentPages.filter((page) => page.path !== "/admin");

  return (
    <section aria-label="Son kullanılanlar" className="rounded-2xl border border-border bg-card p-4">
      <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
        <Clock aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
        Son Kullanılanlar
      </h2>
      {pages.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Henüz gezinme geçmişi yok. Ziyaret ettiğin ekranlar burada listelenecek.
        </p>
      ) : (
        <div className="mt-3 space-y-1">
          {pages.map((page) => (
            <Link
              key={page.path}
              to={page.path}
              className="block truncate rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
            >
              {page.label}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminRecentPages;
