import { useEffect, useMemo, useState } from "react";

import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type RoleRow = {
  key: string;
  label: string;
  sort_order: number;
  is_active: boolean;
};

const ROLE_FAMILY_LABELS: Record<string, string> = {
  Legacy: "Legacy Roller",
  User: "User",
  Admin: "Admin",
  Consultant: "Consultant",
  Organization: "Organization",
  Business: "Business",
  Healthcare: "Healthcare",
  Event: "Event",
  Job: "Job",
  Community: "Community",
  Marketplace: "Marketplace",
};

const getRoleFamilyKey = (roleKey: string) => {
  const [prefix] = roleKey.split("_");
  return prefix && prefix !== roleKey ? prefix : "Legacy";
};

const AdminRolesListPage = () => {
  const { toast } = useToast();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("key, label, sort_order, is_active")
        .order("sort_order", { ascending: true });

      if (!isMounted) return;

      if (error) {
        toast({
          title: "Roller yuklenemedi",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setRoles((data ?? []) as RoleRow[]);
      setIsLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const groupedRoles = useMemo(() => {
    const groups = new Map<string, RoleRow[]>();

    for (const role of roles) {
      const familyKey = getRoleFamilyKey(role.key);
      const currentGroup = groups.get(familyKey) ?? [];
      currentGroup.push(role);
      groups.set(familyKey, currentGroup);
    }

    return Array.from(groups.entries()).map(([familyKey, items]) => ({
      familyKey,
      title: ROLE_FAMILY_LABELS[familyKey] ?? familyKey,
      items,
    }));
  }, [roles]);

  const activeCount = roles.filter((role) => role.is_active).length;

  return (
    <AdminPageLayout>
      <Card className="border-slate-200 bg-white shadow-[0_20px_60px_-46px_rgba(15,23,42,0.35)]">
        <CardHeader className="gap-4">
          <div className="space-y-2">
            <CardTitle>Tum Roller</CardTitle>
            <CardDescription>
              `public.roles` tablosundaki tum rol kayitlarini aile bazinda incele. Liste
              `sort_order` sirasi ile gelir.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Toplam rol: {roles.length}
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1">
              Aktif rol: {activeCount}
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1">
              Rol ailesi: {groupedRoles.length}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-10 text-sm text-muted-foreground">Roller yukleniyor...</CardContent>
        </Card>
      ) : null}

      {!isLoading && roles.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-sm text-muted-foreground">Rol kaydi bulunamadi.</CardContent>
        </Card>
      ) : null}

      {!isLoading
        ? groupedRoles.map((group) => (
            <Card key={group.familyKey} className="border-slate-200 shadow-[0_16px_48px_-42px_rgba(15,23,42,0.28)]">
              <CardHeader>
                <CardTitle className="text-lg">{group.title}</CardTitle>
                <CardDescription>{group.items.length} rol</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Key</TableHead>
                        <TableHead>Label</TableHead>
                        <TableHead>Sort Order</TableHead>
                        <TableHead>Durum</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((role) => (
                        <TableRow key={role.key}>
                          <TableCell className="font-mono text-xs">{role.key}</TableCell>
                          <TableCell>{role.label}</TableCell>
                          <TableCell>{role.sort_order}</TableCell>
                          <TableCell>
                            <Badge variant={role.is_active ? "secondary" : "outline"}>
                              {role.is_active ? "Aktif" : "Pasif"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))
        : null}
    </AdminPageLayout>
  );
};

export default AdminRolesListPage;
