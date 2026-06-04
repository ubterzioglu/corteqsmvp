import { useEffect, useState } from "react";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import EntityTypeFilter from "@/components/admin/role-management/EntityTypeFilter";
import { fetchCatalogRows, filterCatalogRows, ENTITY_KIND_LABELS, type CatalogRow, type EntityKind } from "@/lib/role-catalog";

const KIND_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  attribute: "secondary",
  feature: "default",
  profile_section: "outline",
};

const AdminEntityPreviewPage = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<EntityKind | "all">("all");

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const data = await fetchCatalogRows();
        if (!isMounted) return;
        setRows(data);
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : "Beklenmeyen hata";
        toast({ title: "Katalog yüklenemedi", description: msg, variant: "destructive" });
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [toast]);

  const visibleRows = filterCatalogRows(rows, { search, kind: kindFilter });

  return (
    <AdminPageLayout>
      <Card>
        <CardHeader>
          <CardTitle>AFS Önizleme</CardTitle>
          <CardDescription>
            Tüm Attribute, Feature ve Profile Section kayıtları açıklamalarıyla birlikte listelenir.
            Bu sayfa salt okunurdur; açıklamaları düzenlemek için Rol Yönetimi sayfasını kullan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <EntityTypeFilter
            search={search}
            onSearchChange={setSearch}
            kind={kindFilter}
            onKindChange={setKindFilter}
          />

          {loading ? (
            <p className="text-sm text-muted-foreground">Yükleniyor...</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24 text-[12px]">Tür</TableHead>
                    <TableHead className="text-[12px]">Label</TableHead>
                    <TableHead className="w-56 text-[12px]">Key</TableHead>
                    <TableHead className="text-[12px]">Açıklama</TableHead>
                    <TableHead className="w-40 text-[12px]">Admin Notu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-4 text-center text-sm text-muted-foreground">
                        Eşleşen kayıt bulunamadı.
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleRows.map((row) => (
                      <TableRow key={`${row.kind}:${row.key}`} className="align-top">
                        <TableCell className="py-2">
                          <Badge
                            variant={KIND_BADGE_VARIANT[row.kind]}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {ENTITY_KIND_LABELS[row.kind]}
                          </Badge>
                          {row.sectionArea && (
                            <p className="mt-0.5 text-[9px] text-muted-foreground">{row.sectionArea}</p>
                          )}
                          {row.dataType && (
                            <p className="mt-0.5 text-[9px] text-muted-foreground">{row.dataType}</p>
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          <p className="text-[13px] font-medium leading-5">{row.label}</p>
                        </TableCell>
                        <TableCell className="py-2">
                          <p className="text-[11px] font-mono text-muted-foreground break-all">{row.key}</p>
                        </TableCell>
                        <TableCell className="py-2">
                          <p className="text-xs text-muted-foreground">
                            {row.description ?? <span className="italic text-[11px]">—</span>}
                          </p>
                        </TableCell>
                        <TableCell className="py-2">
                          <p className="text-xs text-muted-foreground">
                            {row.adminNote ?? <span className="italic text-[11px]">—</span>}
                          </p>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <p className="px-3 py-2 text-[11px] text-muted-foreground border-t">
                {visibleRows.length} / {rows.length} kayıt gösteriliyor
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
};

export default AdminEntityPreviewPage;
