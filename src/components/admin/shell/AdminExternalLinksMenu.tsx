// Admin Panel V2 — dış bağlantılar menüsü (Engine, Globe, Founders).
// Linkler registry'deki isExternal item'lardan üretilir.

import { ExternalLink, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { adminNavGroups } from "@/lib/admin-shell/admin-navigation-registry";
import { flattenAdminNav } from "@/lib/admin-shell/admin-navigation-utils";

const externalItems = flattenAdminNav(adminNavGroups)
  .map((entry) => entry.item)
  .filter((item) => item.isExternal && item.href);

const AdminExternalLinksMenu = () => {
  if (externalItems.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label="Dış bağlantılar">
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Dış Bağlantılar</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {externalItems.map((item) => (
          <DropdownMenuItem key={item.id} asChild>
            <a href={item.href} target="_blank" rel="noreferrer" className="flex items-center gap-2">
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
              <span>{item.label}</span>
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AdminExternalLinksMenu;
