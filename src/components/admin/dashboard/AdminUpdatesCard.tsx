// Admin Panel V2 — dashboard'da ürün güncellemeleri kartı (kapalı akordeon).
// İçerik tek kaynaktan gelir: lib/admin-shell/admin-updates.ts — aynı liste
// topbar'daki Güncellemeler (bell) menüsünde ve /admin/about sayfasında da kullanılır.
// Akordeon "single + collapsible" ve defaultValue YOK → tüm kayıtlar kapalı başlar.
//
// Her kayıt ayrı bir KART olarak çizilir (rounded-xl + border + aralık). Düz satır
// listesindeyken kayıtlar birbirine yapışık görünüyordu; başlıklar uzun olduğu için
// nerede bittiği okunmuyordu. Yarıçap 12px'tir (rounded-xl) — tasarım sistemi tek
// yarıçap kuralı koyar, bkz. docs/modules/cadde-design-tokens.md §4.

import { Newspaper } from "lucide-react";
import { Link } from "react-router-dom";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ADMIN_UPDATES } from "@/lib/admin-shell/admin-updates";

const VISIBLE_UPDATE_COUNT = 8;

const AdminUpdatesCard = () => {
  const visibleUpdates = ADMIN_UPDATES.slice(0, VISIBLE_UPDATE_COUNT);

  return (
    <section aria-label="Güncellemeler" className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <Newspaper aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
          Güncellemeler
        </h2>
        <Link to="/admin/about" className="text-xs font-medium text-muted-foreground hover:text-foreground">
          Tümünü gör
        </Link>
      </div>

      {visibleUpdates.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Henüz güncelleme yok.</p>
      ) : (
        <Accordion type="single" collapsible className="mt-3 space-y-2">
          {visibleUpdates.map((update) => (
            <AccordionItem
              key={update.id}
              value={update.id}
              className="rounded-xl border border-border bg-background data-[state=open]:bg-muted/40"
            >
              <AccordionTrigger
                className="px-3 py-3 text-left hover:no-underline"
                chevronWrapperClassName="h-8 w-8"
              >
                <p className="text-[11px] text-muted-foreground">{update.date}</p>
                <p className="text-sm font-medium leading-5 text-foreground">{update.title}</p>
              </AccordionTrigger>
              <AccordionContent className="px-3">
                <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                  {update.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </section>
  );
};

export default AdminUpdatesCard;
