// Ürün Güncellemeleri — içerik tek kaynaktan gelir (lib/admin-shell/admin-updates.ts).
// Topbar'daki Güncellemeler (bell) menüsü ve /admin panosundaki AdminUpdatesCard
// aynı listeyi gösterir.
//
// Kayıtlar akordeon KART olarak çizilir ve HEPSİ KAPALI başlar (defaultValue yok).
// Sebep ölçüm: liste 176 kayda ulaştı ve kayıt başına 10-15 madde var; hepsi açık
// render edilince sayfa okunamaz bir metin duvarına dönüşüyordu. Panodaki
// AdminUpdatesCard ile aynı davranış — iki yüzey ayrışmasın.

import { Newspaper } from "lucide-react";

import { AdminPageShell } from "@/components/admin/page";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ADMIN_UPDATES } from "@/lib/admin-shell/admin-updates";

const AdminAboutPage = () => (
  <AdminPageShell
    title="Ürün Güncellemeleri"
    description="Sürüm notları ve platformda yapılan başlıca değişiklikler — en yeni en üstte. Ayrıntı için bir kayda tıkla."
    icon={Newspaper}
    accent="red"
  >
    <Accordion type="single" collapsible className="space-y-2">
      {ADMIN_UPDATES.map((update) => (
        <AccordionItem
          key={update.id}
          value={update.id}
          className="rounded-xl border border-border bg-card data-[state=open]:bg-muted/40"
        >
          <AccordionTrigger className="px-4 py-3 text-left hover:no-underline">
            <p className="text-xs text-muted-foreground">{update.date}</p>
            <p className="text-base font-medium leading-6 text-foreground">{update.title}</p>
          </AccordionTrigger>
          <AccordionContent className="px-4">
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {update.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </AdminPageShell>
);

export default AdminAboutPage;
