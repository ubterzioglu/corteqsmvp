// Admin Panel V2 — favoriler widget'ı (masterplan §8.1.G).
// localStorage'daki favorileri listeler; sidebar yıldızlarıyla yönetilir.

import { Star } from "lucide-react";
import { Link } from "react-router-dom";

import { useAdminFavorites } from "@/hooks/admin/useAdminFavorites";

const AdminFavorites = () => {
  const { favoriteEntries } = useAdminFavorites();

  return (
    <section aria-label="Favoriler" className="rounded-2xl border border-border bg-card p-4">
      <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
        <Star aria-hidden="true" className="h-4 w-4 fill-amber-400 text-amber-400" />
        Favoriler
      </h2>
      {favoriteEntries.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Henüz favori yok. Sidebar'da bir ekranın üzerine gelip yıldıza tıklayarak ekleyebilirsin.
        </p>
      ) : (
        <div className="mt-3 space-y-1">
          {favoriteEntries.map((entry) =>
            entry.item.to ? (
              <Link
                key={entry.item.id}
                to={entry.item.to}
                className="block rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
              >
                {entry.item.label}
                <span className="ml-2 text-xs text-muted-foreground">{entry.group.label}</span>
              </Link>
            ) : null,
          )}
        </div>
      )}
    </section>
  );
};

export default AdminFavorites;
