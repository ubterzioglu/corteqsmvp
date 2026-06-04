import { useEffect, useState } from "react";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type RoleRow = {
  key: string;
  label: string;
  description: string | null;
  sort_order: number;
};

const getFamilyBadge = (key: string) => {
  const prefix = key.split("_")[0];
  const map: Record<string, string> = {
    User: "Kullanıcı",
    Admin: "Admin",
    Consultant: "Danışman",
    Organization: "Kuruluş",
    Business: "İşletme",
    Healthcare: "Sağlık",
    Event: "Etkinlik",
    Job: "İş",
    Community: "Topluluk",
    Marketplace: "Pazar",
  };
  return map[prefix] ?? prefix;
};

const AdminRolesPreviewPage = () => {
  const { toast } = useToast();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("key, label, description, sort_order")
        .eq("is_active", true)
        .order("sort_order");

      if (!isMounted) return;
      if (error) {
        toast({ title: "Roller yüklenemedi", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      setRoles((data ?? []) as RoleRow[]);
      setLoading(false);
    })();
    return () => { isMounted = false; };
  }, [toast]);

  return (
    <AdminPageLayout>
      <Card>
        <CardHeader>
          <CardTitle>Roller Önizleme</CardTitle>
          <CardDescription>
            Sistemdeki tüm aktif roller, slug'ları ve açıklamalarıyla birlikte listelenir.
            Bu sayfa salt okunurdur; düzenleme için Rol Yönetimi sayfasını kullan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Roller yükleniyor...</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table className="min-w-[1080px] table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-36 whitespace-nowrap text-[12px]">Aile</TableHead>
                    <TableHead className="w-[24rem] whitespace-nowrap text-[12px]">Label (Türkçe)</TableHead>
                    <TableHead className="w-[22rem] whitespace-nowrap text-[12px]">Key (Slug)</TableHead>
                    <TableHead className="whitespace-nowrap text-[12px]">Açıklama</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.key}>
                      <TableCell className="py-2 whitespace-nowrap">
                        <Badge variant="outline" className="px-1.5 py-0 text-[10px] whitespace-nowrap">
                          {getFamilyBadge(role.key)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 whitespace-nowrap">
                        <p className="truncate text-[13px] font-medium" title={role.label}>
                          {role.label}
                        </p>
                      </TableCell>
                      <TableCell className="py-2 whitespace-nowrap">
                        <p className="truncate text-[11px] font-mono text-muted-foreground" title={role.key}>
                          {role.key}
                        </p>
                      </TableCell>
                      <TableCell className="py-2 whitespace-nowrap">
                        <p
                          className="truncate text-xs text-muted-foreground"
                          title={role.description ?? "Açıklama yok"}
                        >
                          {role.description ?? <span className="italic">—</span>}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="px-3 py-2 text-[11px] text-muted-foreground border-t">
                Toplam {roles.length} aktif rol
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
};

export default AdminRolesPreviewPage;
