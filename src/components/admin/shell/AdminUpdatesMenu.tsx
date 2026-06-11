// Admin Panel V2 — güncellemeler (bildirim) menüsü.
// Okunmamış güncelleme sayısı zil ikonunun üzerinde rozet olarak görünür;
// menü açıldığında tümü okundu sayılır (localStorage, useAdminUpdates).
// İçerik tek kaynaktan: lib/admin-shell/admin-updates.ts (/admin/about ile ortak).

import { Bell } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminUpdates } from "@/hooks/admin/useAdminUpdates";

const VISIBLE_UPDATE_COUNT = 8;

const AdminUpdatesMenu = () => {
  const { updates, unreadCount, isUnread, markAllSeen } = useAdminUpdates();
  const visibleUpdates = updates.slice(0, VISIBLE_UPDATE_COUNT);

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) markAllSeen();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label="Güncellemeler" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span
              aria-label={`${unreadCount} okunmamış güncelleme`}
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Güncellemeler</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {visibleUpdates.map((update) => (
            <div key={update.id} className="px-2 py-2">
              <div className="flex items-start gap-2">
                {isUnread(update.id) && (
                  <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                )}
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground">{update.date}</p>
                  <p className="text-sm font-medium leading-5">{update.title}</p>
                  <ul className="mt-1 space-y-0.5">
                    {update.items.slice(0, 2).map((item) => (
                      <li key={item} className="line-clamp-2 text-xs leading-4 text-muted-foreground">
                        • {item}
                      </li>
                    ))}
                    {update.items.length > 2 && (
                      <li className="text-xs text-muted-foreground/70">+{update.items.length - 2} madde daha</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/admin/about" className="flex w-full justify-center text-sm font-medium">
            Tümünü gör
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AdminUpdatesMenu;
