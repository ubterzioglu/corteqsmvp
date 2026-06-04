import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import RawHtmlDocument from "@/components/admin/RawHtmlDocument";
import YetkilendirmeGuide from "@/components/admin/YetkilendirmeGuide";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import rawGuideHtml from "../../../docs/guides/kategori-rol-feature-rehberi.html?raw";

const AdminHelpPage = () => {
  return (
    <AdminPageLayout className="max-w-7xl">
      <YetkilendirmeGuide />

      <Card>
        <CardHeader>
          <CardTitle>Kategori / Rol / Feature HTML Rehberi</CardTitle>
          <CardDescription>
            Yeni HTML rehberi ayri bir sayfaya gitmeden bu yardim ekraninin icine merge edildi. Icerik iframe olmadan
            dogrudan render edilir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RawHtmlDocument html={rawGuideHtml} className="overflow-hidden rounded-xl border border-border bg-white" />
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
};

export default AdminHelpPage;
