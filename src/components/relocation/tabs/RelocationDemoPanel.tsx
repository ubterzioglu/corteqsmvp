// Taşınma Planlayıcı — üç DEMO sekmesinin (İşletmeler · Okullar · Hoşgeldin
// Paketi) ortak paneli. Veri: `src/lib/relocation-demo-content.ts`.
//
// Panel kendi uyarı satırını TAŞIR. Sayfanın tepesindeki demo bandı yeterli
// gibi görünür ama kullanıcı sekmeye doğrudan da gelebilir (bant yukarıda
// kalır, kaydırınca görünmez) — bu sınıf uyarının "bir yerde vardı" sanılıp
// hiç okunmamasıyla sonuçlanır. Uyarı içeriğin yanında durmalıdır.
import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";
import type { RelocationDemoItem } from "@/lib/relocation-demo-content";

interface RelocationDemoPanelProps {
  items: RelocationDemoItem[];
  /** Bu sekmede neyin örnek olduğunu anlatan tek cümle. */
  note: string;
}

export function RelocationDemoPanel({ items, note }: RelocationDemoPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="space-y-1 text-xs text-amber-900 dark:text-amber-200">
          <p>{note}</p>
          <p>Bu örnek içerik resmî belge listesinin yerini tutmaz.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <Card key={item.title}>
            <CardContent className="space-y-1 pt-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                {item.tag && (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    {item.tag}
                  </span>
                )}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
