import { useEffect, useState } from "react";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import EntityTypeFilter from "@/components/admin/role-management/EntityTypeFilter";
import { fetchCatalogRows, filterCatalogRows, ENTITY_KIND_LABELS, type CatalogRow, type EntityKind } from "@/lib/role-catalog";

const KIND_META: Record<string, { short: string; className: string }> = {
  attribute: {
    short: "A",
    className:
      "border-[#ef8c3f]/35 bg-[linear-gradient(135deg,#fff0de_0%,#ffd6af_52%,#ffbc7b_100%)] text-[#c96a1a]",
  },
  feature: {
    short: "F",
    className:
      "border-[#34A853]/35 bg-[linear-gradient(135deg,rgba(52,168,83,0.12),rgba(52,168,83,0.2))] text-[#137333]",
  },
  profile_section: {
    short: "S",
    className:
      "border-[#4285F4]/35 bg-[linear-gradient(135deg,rgba(66,133,244,0.12),rgba(66,133,244,0.2))] text-[#185ABC]",
  },
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
              <Table className="min-w-[920px] table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 whitespace-nowrap px-2 text-[11px]">Tür</TableHead>
                    <TableHead className="w-[16rem] whitespace-nowrap px-2 text-[11px]">Label</TableHead>
                    <TableHead className="w-[20rem] whitespace-nowrap px-2 text-[11px]">Açıklama</TableHead>
                    <TableHead className="w-[16rem] whitespace-nowrap px-2 text-[11px]">Admin Notu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-4 text-center text-sm text-muted-foreground">
                        Eşleşen kayıt bulunamadı.
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleRows.map((row) => (
                      <TableRow key={`${row.kind}:${row.key}`} className="align-middle">
                        <TableCell className="px-2 py-2 whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={`h-6 min-w-6 justify-center px-1.5 py-0 text-[10px] font-semibold ${KIND_META[row.kind].className}`}
                            title={ENTITY_KIND_LABELS[row.kind]}
                          >
                            {KIND_META[row.kind].short}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-2 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <p className="truncate text-[12px] font-medium" title={row.label}>{row.label}</p>
                            {row.dataType && (
                              <span className="shrink-0 rounded border border-muted-foreground/20 bg-muted/40 px-1.5 py-0.5 text-[9px] text-muted-foreground">
                                {row.dataType}
                              </span>
                            )}
                            {row.sectionArea && (
                              <span className="shrink-0 rounded border border-muted-foreground/20 bg-muted/40 px-1.5 py-0.5 text-[9px] text-muted-foreground">
                                {row.sectionArea}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2 whitespace-nowrap">
                          <p className="truncate text-[11px] text-muted-foreground" title={row.description ?? "Açıklama yok"}>
                            {row.description ?? <span className="italic text-[11px]">—</span>}
                          </p>
                        </TableCell>
                        <TableCell className="px-2 py-2 whitespace-nowrap">
                          <p className="truncate text-[11px] text-muted-foreground" title={row.adminNote ?? "Admin notu yok"}>
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
