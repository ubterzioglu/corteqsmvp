// Admin Panel V2 — utility topbar.
// Sol: mobil hamburger + breadcrumb. Sağ: tema, dış bağlantılar, kullanıcı
// menüsü. İşlev linkleri buraya KONULMAZ; navigasyon sidebar'dadır.
// Global arama (Ctrl+K) Faz 4'te eklenecektir.

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";

import AdminBreadcrumbs from "./AdminBreadcrumbs";
import AdminExternalLinksMenu from "./AdminExternalLinksMenu";
import AdminThemeToggle from "./AdminThemeToggle";
import AdminUserMenu from "./AdminUserMenu";

type AdminTopbarProps = {
  userEmail?: string;
  onLogout: () => Promise<void>;
  onOpenMobileSidebar: () => void;
};

const AdminTopbar = ({ userEmail, onLogout, onOpenMobileSidebar }: AdminTopbarProps) => (
  <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
    <div className="flex h-14 items-center justify-between gap-3 px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Admin menüsünü aç"
          className="lg:hidden"
          onClick={onOpenMobileSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <AdminBreadcrumbs />
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <AdminThemeToggle />
        <AdminExternalLinksMenu />
        <AdminUserMenu userEmail={userEmail} onLogout={onLogout} />
      </div>
    </div>
  </header>
);

export default AdminTopbar;
