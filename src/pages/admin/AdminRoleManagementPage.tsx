import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getRoleManagementBundle, type RoleManagementBundle } from "@/lib/admin";
import RoleSearchSelect, { type RoleOption } from "@/components/admin/RoleSearchSelect";
import EntityTypeFilter from "@/components/admin/role-management/EntityTypeFilter";
import UnifiedRulesTable from "@/components/admin/role-management/UnifiedRulesTable";
import { fetchCatalogRows, filterCatalogRows, type CatalogRow, type EntityKind } from "@/lib/role-catalog";

const AdminRoleManagementPage = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [selectedRoleKey, setSelectedRoleKey] = useState<string>(
    searchParams.get("role") ?? "",
  );
  const [catalogRows, setCatalogRows] = useState<CatalogRow[]>([]);
  const [bundle, setBundle] = useState<RoleManagementBundle | null>(null);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingBundle, setLoadingBundle] = useState(false);
  const [bundleError, setBundleError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<EntityKind | "all">("all");

  // Load roles list
  useEffect(() => {
    let isMounted = true;
    void (async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("key, label")
        .eq("is_active", true)
        .order("sort_order");

      if (!isMounted) return;
      if (error) {
        toast({ title: "Roller yüklenemedi", description: error.message, variant: "destructive" });
        setLoadingRoles(false);
        return;
      }
      setRoles(
        ((data ?? []) as Array<{ key: string; label: string }>).map((role) => ({
          value: role.key,
          label: role.label,
          hint: role.key,
        })),
      );
      setLoadingRoles(false);
    })();
    return () => { isMounted = false; };
  }, [toast]);

  // Load full entity catalog on mount
  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const rows = await fetchCatalogRows();
        if (!isMounted) return;
        setCatalogRows(rows);
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : "Beklenmeyen hata";
        toast({ title: "Katalog yüklenemedi", description: msg, variant: "destructive" });
      } finally {
        if (isMounted) setLoadingCatalog(false);
      }
    })();
    return () => { isMounted = false; };
  }, [toast]);

  // Load bundle when role is selected
  useEffect(() => {
    if (!selectedRoleKey) {
      setBundle(null);
      return;
    }

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("role", selectedRoleKey);
      return next;
    }, { replace: true });

    let isMounted = true;
    setBundleError(null);
    setLoadingBundle(true);

    void (async () => {
      try {
        const data = await getRoleManagementBundle(selectedRoleKey);
        if (!isMounted) return;
        setBundle(data);
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : "Beklenmeyen hata";
        setBundleError(msg);
        toast({ title: "Rol yüklenemedi", description: msg, variant: "destructive" });
      } finally {
        if (isMounted) setLoadingBundle(false);
      }
    })();

    return () => { isMounted = false; };
  }, [selectedRoleKey, setSearchParams, toast]);

  const handleBundleChange = (patch: Partial<RoleManagementBundle>) => {
    setBundle((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const clearSelections = () => {
    setSelectedRoleKey("");
    setSearch("");
    setKindFilter("all");
    setBundle(null);
    setBundleError(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("role");
      return next;
    }, { replace: true });
  };

  const visibleRows = filterCatalogRows(catalogRows, { search, kind: kindFilter });

  return (
    <AdminPageLayout>
      <Card>
        <CardHeader>
          <CardTitle>Rol Yönetimi</CardTitle>
          <CardDescription>
            Rol seçmeden tüm attribute, feature ve profil bölümlerini görüntüle. Rol seçince
            aynı tabloda düzenleme yapabilirsin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:flex-nowrap">
            <RoleSearchSelect
              roles={roles}
              value={selectedRoleKey}
              onValueChange={setSelectedRoleKey}
              disabled={loadingRoles}
              placeholder={loadingRoles ? "Roller yükleniyor..." : "Rol seç (isteğe bağlı)…"}
              className="h-11 w-full md:w-[240px] lg:w-[280px]"
            />
            <EntityTypeFilter
              search={search}
              onSearchChange={setSearch}
              kind={kindFilter}
              onKindChange={setKindFilter}
              className="flex-col gap-2 md:w-auto md:flex-row md:items-center md:flex-nowrap"
              searchClassName="h-11 w-full max-w-none text-sm md:w-[260px] lg:w-[320px]"
              triggerClassName="h-11 w-full text-sm md:w-[140px] lg:w-[160px]"
            />
            <Button type="button" variant="outline" className="h-11 md:ml-auto" onClick={clearSelections}>
              Seçimi temizle
            </Button>
          </div>

          {selectedRoleKey && loadingBundle && (
            <p className="text-xs text-muted-foreground">Rol verisi yükleniyor...</p>
          )}
          {bundleError && (
            <p className="text-sm text-destructive">Rol yüklenemedi: {bundleError}</p>
          )}

          {loadingCatalog ? (
            <p className="text-sm text-muted-foreground">Katalog yükleniyor...</p>
          ) : (
            <UnifiedRulesTable
              rows={visibleRows}
              bundle={(!loadingBundle && bundle) ? bundle : null}
              onBundleChange={handleBundleChange}
            />
          )}
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
};

export default AdminRoleManagementPage;
