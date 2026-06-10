// Admin Panel V2 — utility topbar.
// Sol: mobil hamburger + breadcrumb. Sağ: global arama (Ctrl+K), tema,
// dış bağlantılar, kullanıcı menüsü. İşlev linkleri buraya KONULMAZ;
// navigasyon sidebar'dadır.

import { Menu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

import AdminBreadcrumbs from "./AdminBreadcrumbs";
import AdminExternalLinksMenu from "./AdminExternalLinksMenu";
import AdminThemeToggle from "./AdminThemeToggle";
import AdminUserMenu from "./AdminUserMenu";

type AdminTopbarProps = {
  userEmail?: string;
  onLogout: () => Promise<void>;
  onOpenMobileSidebar: () => void;
  onOpenCommandPalette: () => void;
};

const AdminTopbar = ({ userEmail, onLogout, onOpenMobileSidebar, onOpenCommandPalette }: AdminTopbarProps) => (
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenCommandPalette}
          aria-label="Ekran ara"
          className="gap-2 text-muted-foreground"
        >
          <Search aria-hidden="true" className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Ara</span>
          <kbd className="pointer-events-none hidden rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium sm:inline-block">
            Ctrl K
          </kbd>
        </Button>
        <AdminThemeToggle />
        <AdminExternalLinksMenu />
        <AdminUserMenu userEmail={userEmail} onLogout={onLogout} />
      </div>
    </div>
  </header>
);

export default AdminTopbar;
