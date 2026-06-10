import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Shield } from "lucide-react";
import { AdminFilterBar, AdminLoadingState, AdminPageShell } from "@/components/admin/page";
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
    <AdminPageShell
      title="Rol Yönetimi"
      description="Rol seçmeden tüm attribute, feature ve profil bölümlerini görüntüle. Rol seçince aynı tabloda düzenleme yapabilirsin."
      icon={Shield}
      accent="emerald"
      filters={
        <AdminFilterBar onReset={clearSelections} resetLabel="Seçimi temizle">
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
        </AdminFilterBar>
      }
    >
      <div className="sticky top-14 z-20 -mx-4 mb-4 border-b border-border/60 bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Kısaltmalar</span>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            Temel — rolün çoğu senaryoda bu aileye ihtiyacı vardır
          </span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            Secimli — ürün stratejisine veya operasyon kararına göre açılır
          </span>
          <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
            Operasyonel — yalnızca görevli veya sorumlu hesaplarda anlamlıdır
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            Yok — teknik scope veya ürün mantığı nedeniyle bu role uygulanmaz
          </span>
          <span className="ml-auto hidden text-[10px] leading-relaxed text-muted-foreground/60 sm:block">
            <span className="font-semibold">A</span> Aktif &nbsp;
            <span className="font-semibold">Z</span> Zorunlu &nbsp;
            <span className="font-semibold">P</span> Public &nbsp;
            <span className="font-semibold">D</span> Düzenler &nbsp;
            <span className="font-semibold">G</span> Gizler / Global &nbsp;
            <span className="font-semibold">O</span> Onay &nbsp;
            <span className="font-semibold">R</span> Rol &nbsp;
            <span className="font-semibold">S</span> Sıra
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {selectedRoleKey && loadingBundle && (
          <p className="text-xs text-muted-foreground">Rol verisi yükleniyor...</p>
        )}
        {bundleError && (
          <p className="text-sm text-destructive">Rol yüklenemedi: {bundleError}</p>
        )}

        {loadingCatalog ? (
          <AdminLoadingState label="Katalog yükleniyor..." />
        ) : (
          <UnifiedRulesTable
            rows={visibleRows}
            bundle={(!loadingBundle && bundle) ? bundle : null}
            onBundleChange={handleBundleChange}
          />
        )}
      </div>
    </AdminPageShell>
  );
};

export default AdminRoleManagementPage;
