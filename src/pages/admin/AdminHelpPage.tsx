import { Link } from "react-router-dom";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import YetkilendirmeGuide from "@/components/admin/YetkilendirmeGuide";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const AdminHelpPage = () => {
  return (
    <AdminPageLayout>
      <Card>
        <CardHeader>
          <CardTitle>Kategori / Rol / Feature HTML Rehberi</CardTitle>
          <CardDescription>
            Standalone HTML dokumanini admin panel icinde route olarak acmak icin bu kisayolu kullan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            to="/admin/new-member/kategori-rol-feature-rehberi"
            className="inline-flex items-center rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
          >
            HTML rehberi ac
          </Link>
        </CardContent>
      </Card>
      <YetkilendirmeGuide />
    </AdminPageLayout>
  );
};

export default AdminHelpPage;
