// Admin Panel V2 — global arama / command palette (cmdk).
// Sonuçlar registry'den üretilir: label, alias, açıklama ve grup adıyla
// aranır. Son kullanılanlar ilk blokta gösterilir; external linkler yeni
// sekmede açılır; seçimde dialog kapanır.

import { useNavigate } from "react-router-dom";
import { Clock, ExternalLink as ExternalLinkIcon, Star } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { adminNavGroups } from "@/lib/admin-shell/admin-navigation-registry";
import { flattenAdminNav } from "@/lib/admin-shell/admin-navigation-utils";
import type { AdminNavEntry } from "@/lib/admin-shell/admin-navigation-utils";
import type { AdminNavItem } from "@/lib/admin-shell/admin-shell-types";
import type { AdminRecentPage } from "@/hooks/admin/useAdminRecentPages";

type AdminCommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recentPages: AdminRecentPage[];
  favoriteEntries: AdminNavEntry[];
};

/** cmdk filtrelemesi için aranabilir değer: label + alias + grup + kısa ad. */
function searchValue(item: AdminNavItem, groupLabel: string): string {
  return [item.label, item.shortLabel ?? "", groupLabel, ...(item.aliases ?? [])]
    .filter(Boolean)
    .join(" ");
}

const AdminCommandPalette = ({
  open,
  onOpenChange,
  recentPages,
  favoriteEntries,
}: AdminCommandPaletteProps) => {
  const navigate = useNavigate();

  const close = () => onOpenChange(false);

  const selectInternal = (path: string) => {
    close();
    navigate(path);
  };

  const selectExternal = (href: string) => {
    close();
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const renderItem = (entry: AdminNavEntry) => {
    const { item, group } = entry;
    const Icon = item.icon;

    if (item.isExternal && item.href) {
      const href = item.href;
      return (
        <CommandItem key={item.id} value={searchValue(item, group.label)} onSelect={() => selectExternal(href)}>
          <Icon aria-hidden="true" className="mr-2 h-4 w-4" />
          <span>{item.label}</span>
          <ExternalLinkIcon aria-hidden="true" className="ml-auto h-3 w-3 opacity-60" />
        </CommandItem>
      );
    }

    if (!item.to) return null;
    const to = item.to;

    return (
      <CommandItem key={item.id} value={searchValue(item, group.label)} onSelect={() => selectInternal(to)}>
        <Icon aria-hidden="true" className="mr-2 h-4 w-4" />
        <span>{item.label}</span>
        {item.description && (
          <span className="ml-2 truncate text-xs text-muted-foreground">{item.description}</span>
        )}
      </CommandItem>
    );
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Ekran ara... (rol, override, anket, muhasebe)" />
      <CommandList>
        <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>

        {recentPages.length > 0 && (
          <>
            <CommandGroup heading="Son Kullanılanlar">
              {recentPages.map((page) => (
                <CommandItem
                  key={`recent-${page.path}`}
                  value={`son kullanılan ${page.label} ${page.path}`}
                  onSelect={() => selectInternal(page.path)}
                >
                  <Clock aria-hidden="true" className="mr-2 h-4 w-4" />
                  <span>{page.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {favoriteEntries.length > 0 && (
          <>
            <CommandGroup heading="Favoriler">
              {favoriteEntries.map((entry) =>
                entry.item.to ? (
                  <CommandItem
                    key={`favorite-${entry.item.id}`}
                    value={`favori ${searchValue(entry.item, entry.group.label)}`}
                    onSelect={() => selectInternal(entry.item.to!)}
                  >
                    <Star aria-hidden="true" className="mr-2 h-4 w-4 fill-amber-400 text-amber-400" />
                    <span>{entry.item.label}</span>
                  </CommandItem>
                ) : null,
              )}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {adminNavGroups.map((group) => (
          <CommandGroup key={group.id} heading={group.label}>
            {flattenAdminNav([group]).map(renderItem)}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
};

export default AdminCommandPalette;
