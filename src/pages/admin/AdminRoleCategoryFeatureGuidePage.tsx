import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import RawHtmlDocument from "@/components/admin/RawHtmlDocument";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import rawGuideHtml from "../../../docs/guides/kategori-rol-feature-rehberi.html?raw";

const AdminRoleCategoryFeatureGuidePage = () => {
  return (
    <AdminPageLayout className="max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/admin/help"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Yardim ekranina don
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kategori / Rol / Feature HTML Rehberi</CardTitle>
          <CardDescription>
            Bu sayfa HTML dokumanini admin panel icinde dogrudan render eder. Icerik route olarak baglidir; iframe kullanilmaz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RawHtmlDocument html={rawGuideHtml} className="overflow-hidden rounded-xl border border-border bg-white" />
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
};

export default AdminRoleCategoryFeatureGuidePage;
