// Ürün Güncellemeleri — içerik tek kaynaktan gelir (lib/admin-shell/admin-updates.ts).
// Topbar'daki Güncellemeler (bell) menüsü aynı listeyi gösterir.

import { Newspaper } from "lucide-react";

import { AdminPageShell } from "@/components/admin/page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ADMIN_UPDATES } from "@/lib/admin-shell/admin-updates";

const AdminAboutPage = () => (
  <AdminPageShell
    title="Ürün Güncellemeleri"
    description="Sürüm notları ve platformda yapılan başlıca değişiklikler — en yeni en üstte."
    icon={Newspaper}
    accent="red"
  >
    {ADMIN_UPDATES.map((update) => (
      <Card key={update.id}>
        <CardHeader>
          <CardTitle className="text-base">{update.title}</CardTitle>
          <CardDescription>{update.date}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {update.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    ))}
  </AdminPageShell>
);

export default AdminAboutPage;
