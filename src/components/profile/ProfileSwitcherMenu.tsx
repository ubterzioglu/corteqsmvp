import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, Megaphone, Plus, Sparkles, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { memberCatalogItemsKeys } from "@/hooks/useMemberCatalogSlug";
import {
  getMyEditableCatalogItems,
  type EditableCatalogItemSummary,
} from "@/lib/member-catalog";
import { profileEditorPathFor } from "@/lib/profile-routing";
import {
  isPremiumPresentation,
  resolveProfilePresentation,
} from "@/lib/profile-presentation";
import { getUiProfileType, roleMetaByLegacyKey } from "@/lib/profile-types";
import RequestNewProfileDialog from "@/components/profile/RequestNewProfileDialog";

type ProfileSwitcherMenuProps = {
  /**
   * Aktif profilin item id'si. `null` ise (Bireysel editör route'u item id
   * taşımaz) `member` tipindeki item aktif kabul edilir.
   */
  currentItemId: string | null;
  /** Tetikleyici buton sınıfı — premium hero buton kolonuyla hizalamak için. */
  triggerClassName?: string;
};

/** Member (Bireysel) item'ı her zaman en üste alır; diğerleri DB sırasında kalır. */
const sortMemberFirst = (
  items: EditableCatalogItemSummary[],
): EditableCatalogItemSummary[] => {
  return items
    .slice()
    .sort((left, right) => {
      if (left.itemType === right.itemType) return 0;
      if (left.itemType === "member") return -1;
      if (right.itemType === "member") return 1;
      return 0;
    });
};

const profileTypeLabel = (item: EditableCatalogItemSummary): string => {
  if (item.roleKey) {
    return roleMetaByLegacyKey[getUiProfileType(item.roleKey)].adminLabel;
  }
  return item.itemType;
};

/**
 * Birden fazla profile yetkili kullanıcılar için profil geçiş menüsü.
 * Veriyi `getMyEditableCatalogItems` ile kendi çeker (cache, useMemberCatalogSlug
 * ile ortak query key üzerinden paylaşılır — ekstra istek yok). 2'den az profil
 * varsa hiçbir şey render etmez.
 */
const ProfileSwitcherMenu = ({ currentItemId, triggerClassName }: ProfileSwitcherMenuProps) => {
  const navigate = useNavigate();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: memberCatalogItemsKeys.mine,
    queryFn: getMyEditableCatalogItems,
    staleTime: 60_000,
  });

  const items = useMemo(() => sortMemberFirst(data ?? []), [data]);

  // Henüz yüklenen kullanıcıya menü gösterme; "+ Yeni Profil" için tek
  // profilli kullanıcıya da menü gösterilir (bkz. items.map altındaki öğe).
  if (isLoading) {
    return null;
  }

  const activeItemId =
    currentItemId ?? items.find((item) => item.itemType === "member")?.itemId ?? null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" className={triggerClassName}>
            <Users className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Diğer Profiller
            <ChevronDown className="ml-auto h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Profillerin</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {items.map((item) => {
            const isActive = item.itemId === activeItemId;
            const isPremium = isPremiumPresentation(resolveProfilePresentation(item.roleKey));
            return (
              <DropdownMenuItem
                key={item.itemId}
                disabled={isActive}
                onSelect={() => {
                  if (isActive) return;
                  navigate(profileEditorPathFor(item));
                }}
                className="flex items-start gap-2"
              >
                <span className="mt-0.5 h-3.5 w-3.5 shrink-0">
                  {isActive ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {item.title}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {profileTypeLabel(item)}
                    {isPremium ? (
                      <span className="inline-flex items-center gap-0.5 text-violet-700 dark:text-violet-400">
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        Premium
                      </span>
                    ) : null}
                  </span>
                </span>
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          {/* m46: hedef sabit "bireysel" DEĞİL — /profile kullanıcının kendi profil tipine
              yönlenir (danışman/işletme de olabilir) ve ProfilePage redirect'i artık hash'i
              koruyor. "?tab=settings" kaldırıldı: ProfilePage tab parametresi okumuyor. */}
          <DropdownMenuItem
            onSelect={() => navigate("/profile#cadde-tanitim")}
            className="gap-2"
          >
            <Megaphone className="h-3.5 w-3.5" aria-hidden="true" />
            Caddeye reklam ver
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsRequestDialogOpen(true)} className="gap-2">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            + Yeni Profil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <RequestNewProfileDialog
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        onSuccess={() => setIsRequestDialogOpen(false)}
      />
    </>
  );
};

export default ProfileSwitcherMenu;
