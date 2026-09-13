import { Users } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminRoleRecordCount } from "@/lib/admin-catalog";

const CatalogRoleCountsCard = ({ roleCounts }: { roleCounts: AdminRoleRecordCount[] }) => (
  <Card className="border-slate-200 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.28)]">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2">
        <Users className="h-5 w-5 text-slate-500" />
        Kullanıcı Tipi Dağılımı
      </CardTitle>
      <CardDescription>Her rol için toplam kayıt sayısı (tüm veritabanı, filtrelerden bağımsız).</CardDescription>
    </CardHeader>
    <CardContent>
      <Accordion type="single" collapsible>
        <AccordionItem value="role-counts" className="border-0">
          <AccordionTrigger className="py-2">
            <span className="text-sm text-slate-600">
              Toplam {roleCounts.reduce((sum, rc) => sum + rc.recordCount, 0)} kayıt · {roleCounts.length} tip
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {roleCounts.map((rc) => (
                <div
                  key={rc.roleKey}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <span className="truncate text-sm text-slate-700">{rc.roleLabel}</span>
                  <Badge variant="secondary">{rc.recordCount}</Badge>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </CardContent>
  </Card>
);

export default CatalogRoleCountsCard;
