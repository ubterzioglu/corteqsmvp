import { type ReactNode, useState } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type SidebarMenuItem = {
  id: string;
  label: string;
  icon: ReactNode;
  content: ReactNode;
};

type ProfileSidebarLayoutProps = {
  menuItems: SidebarMenuItem[];
  defaultActiveId: string;
  sidebarHeader?: ReactNode;
};

const ProfileSidebarLayout = ({
  menuItems,
  defaultActiveId,
  sidebarHeader,
}: ProfileSidebarLayoutProps) => {
  const [activeId, setActiveId] = useState(defaultActiveId);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeItem = menuItems.find((item) => item.id === activeId) ?? menuItems[0];

  const handleSelect = (id: string) => {
    setActiveId(id);
    setMobileOpen(false);
  };

  const sidebarNav = (
    <nav className="flex flex-col gap-1">
      {menuItems.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSelect(item.id)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
              )}
            >
              {item.icon}
            </span>
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-10">
      <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] w-1/5 shrink-0 flex-col gap-4 overflow-y-auto lg:flex">
        {sidebarHeader ? <div className="mb-2">{sidebarHeader}</div> : null}
        {sidebarNav}
      </aside>

      <div className="flex-1 space-y-4 lg:w-4/5">
        <div className="lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-4 w-4" />
              {activeItem?.label ?? "Menü"}
            </Button>
            <SheetContent side="left" className="w-72">
              <SheetHeader className="mb-4">
                <SheetTitle>Profil Menüsü</SheetTitle>
              </SheetHeader>
              {sidebarHeader ? <div className="mb-4">{sidebarHeader}</div> : null}
              {sidebarNav}
            </SheetContent>
          </Sheet>
        </div>

        <div>{activeItem?.content}</div>
      </div>
    </div>
  );
};

export default ProfileSidebarLayout;
