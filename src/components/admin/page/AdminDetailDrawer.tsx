// Admin Panel V2 — sağ detay drawer'ı (masterplan §9.2 / §9.3).
// shadcn Sheet sarmalayıcısı; veri yoğun sayfalarda kayıt detayını gösterir.

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export type AdminDetailDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Genişlik override'ı; varsayılan responsive geniş panel. */
  widthClassName?: string;
};

export function AdminDetailDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  widthClassName = "w-full sm:max-w-xl",
}: AdminDetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={cn("flex flex-col gap-4 overflow-y-auto", widthClassName)}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-4">{children}</div>
        {footer ? <div className="border-t border-border pt-4">{footer}</div> : null}
      </SheetContent>
    </Sheet>
  );
}
