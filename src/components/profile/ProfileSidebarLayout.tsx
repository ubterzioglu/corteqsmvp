import { type ReactNode, useState } from "react";
import { ChevronDown, Menu } from "lucide-react";

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
            {/* Düğme seçili bölümün adını taşır ve bu ad her seçimde DEĞİŞİR.
                Adın başına sabit "Menü" etiketi konur (kullanıcı kararı,
                2026-09-20): etiketsizken düğme bir başlık gibi okunuyor, bir
                menü açtığı anlaşılmıyordu. Etiket + ad + aşağı ok üçlüsü
                düğmenin ne yaptığını tek bakışta söyler. */}
            <Button
              variant="outline"
              className="h-auto w-full justify-between gap-3 rounded-2xl border-border/70 bg-background/80 px-3 py-2.5 shadow-sm backdrop-blur transition-colors hover:border-primary/40 hover:bg-background sm:w-auto sm:min-w-[16rem]"
              onClick={() => setMobileOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={mobileOpen}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Menu className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-col items-start text-left leading-tight">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Menü
                  </span>
                  <span className="truncate text-sm font-semibold text-foreground">
                    {activeItem?.label ?? "Profil Menüsü"}
                  </span>
                </span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
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
