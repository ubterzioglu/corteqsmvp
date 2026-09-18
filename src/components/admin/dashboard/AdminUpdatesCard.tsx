// Admin Panel V2 — dashboard'da ürün güncellemeleri kartı.
// İçerik tek kaynaktan gelir: lib/admin-shell/admin-updates.ts — aynı liste
// topbar'daki Güncellemeler (bell) menüsünde ve /admin/about sayfasında da kullanılır.
//
// ANA KART da akordeondur ("single + collapsible", defaultValue YOK → kapalı başlar):
// başlığa tıklayınca açılır, içindeki kayıtlar yine ayrı akordeon KART'lardır
// (rounded-xl + border, hepsi kapalı başlar). Böylece pano varsayılan olarak
// güncellemelerin tamamından arınmış tek bir başlık satırı gösterir.
//
// "Tümünü gör" bağlantısı trigger'ın İÇİNE konmaz (button içine link gömülemez);
// başlık satırına absolute konumlanır ve chevron'un solunda her zaman görünür kalır.
// Yarıçap 12px'tir (rounded-xl) — tasarım sistemi tek yarıçap kuralı koyar,
// bkz. docs/modules/cadde-design-tokens.md §4.

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
    <section aria-label="Güncellemeler" className="rounded-2xl border border-border bg-card">
      <Accordion type="multiple">
        <AccordionItem value="guncellemeler-kart" className="border-b-0">
          <div className="relative">
            <AccordionTrigger
              className="px-4 py-4 pr-32 text-left hover:no-underline"
              chevronWrapperClassName="h-8 w-8"
            >
              <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <Newspaper aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                Güncellemeler
              </h2>
            </AccordionTrigger>
            <Link
              to="/admin/about"
              className="absolute right-14 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Tümünü gör
            </Link>
          </div>

          <AccordionContent className="px-4">
            {visibleUpdates.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz güncelleme yok.</p>
            ) : (
              <Accordion type="single" collapsible className="space-y-2">
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
};

export default AdminUpdatesCard;
