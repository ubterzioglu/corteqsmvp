// Admin Panel V2 — kullanıcı menüsü (e-posta, güncellemeler, çıkış).

import { Link } from "react-router-dom";
import { CircleUser, LogOut, Newspaper } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AdminUserMenuProps = {
  userEmail?: string;
  onLogout: () => Promise<void>;
};

const AdminUserMenu = ({ userEmail, onLogout }: AdminUserMenuProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button type="button" variant="ghost" size="icon" aria-label="Kullanıcı menüsü">
        <CircleUser className="h-5 w-5" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
        {userEmail ?? "Yönetici"}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link to="/admin/about" className="flex items-center gap-2">
          <Newspaper aria-hidden="true" className="h-4 w-4" />
          Ürün Güncellemeleri
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => void onLogout()} className="flex items-center gap-2">
        <LogOut aria-hidden="true" className="h-4 w-4" />
        Çıkış
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export default AdminUserMenu;
