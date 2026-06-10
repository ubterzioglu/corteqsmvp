// Admin Panel V2 — mobil drawer.
// Desktop sidebar ile AYNI registry'den üretilir; ayrı statik link listesi
// tutulmaz (masterplan Risk 3 önlemi). Navigasyonda Sheet kapanır.

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { adminNavGroups } from "@/lib/admin-shell/admin-navigation-registry";

import AdminSidebarGroup from "./AdminSidebarGroup";
import AdminSidebarItem from "./AdminSidebarItem";

type AdminMobileSidebarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout: () => Promise<void>;
};

const inactiveItems = adminNavGroups.flatMap((group) =>
  group.items.filter((item) => item.isInactive),
);

const AdminMobileSidebar = ({ open, onOpenChange, onLogout }: AdminMobileSidebarProps) => {
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[86vw] max-w-sm overflow-y-auto p-4">
        <SheetHeader>
          <SheetTitle>CorteQS Admin</SheetTitle>
        </SheetHeader>
        <nav aria-label="Admin navigasyonu" className="mt-4 space-y-3">
          {adminNavGroups.map((group) => (
            <AdminSidebarGroup key={group.id} group={group} onNavigate={close} />
          ))}

          {inactiveItems.length > 0 && (
            <div className="border-t border-border/60 pt-2">
              <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                İnaktif
              </div>
              <div className="space-y-0.5">
                {inactiveItems.map((item) => (
                  <AdminSidebarItem key={item.id} item={item} onNavigate={close} />
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-border/60 pt-2">
            <button
              type="button"
              onClick={() => void onLogout()}
              className="block w-full rounded-md px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
            >
              Çıkış
            </button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default AdminMobileSidebar;
