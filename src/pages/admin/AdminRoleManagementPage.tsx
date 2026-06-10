import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Shield } from "lucide-react";
import {
  AdminErrorState,
  AdminFilterBar,
  AdminLoadingState,
  AdminPageShell,
} from "@/components/admin/page";
import { useAdminRoleMatrix } from "@/hooks/admin/useAdminRoleMatrix";
import type { RoleManagementBundle } from "@/lib/admin";
import RoleSearchSelect from "@/components/admin/RoleSearchSelect";
import EntityTypeFilter from "@/components/admin/role-management/EntityTypeFilter";
import UnifiedRulesTable from "@/components/admin/role-management/UnifiedRulesTable";
import { filterCatalogRows, type EntityKind } from "@/lib/role-catalog";

const AdminRoleManagementPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedRoleKey, setSelectedRoleKey] = useState<string>(
    searchParams.get("role") ?? "",
  );
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<EntityKind | "all">("all");

  const { rolesQuery, catalogQuery, bundleQuery } = useAdminRoleMatrix(selectedRoleKey);

  // Bundle, UnifiedRulesTable tarafından lokal olarak düzenlenir; query verisi
  // geldiğinde (veya rol temizlendiğinde) lokal kopya senkronlanır.
  const [bundle, setBundle] = useState<RoleManagementBundle | null>(null);
  useEffect(() => {
    setBundle(bundleQuery.data ?? null);
  }, [bundleQuery.data]);

  // Eski davranış: seçili rol URL query param'ında korunur (masterplan §14.5).
  useEffect(() => {
    if (!selectedRoleKey) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("role", selectedRoleKey);
      return next;
    }, { replace: true });
  }, [selectedRoleKey, setSearchParams]);

  const handleBundleChange = (patch: Partial<RoleManagementBundle>) => {
    setBundle((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const clearSelections = () => {
    setSelectedRoleKey("");
    setSearch("");
    setKindFilter("all");
    setBundle(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("role");
      return next;
    }, { replace: true });
  };

  const loadingRoles = rolesQuery.isLoading;
  const loadingCatalog = catalogQuery.isLoading;
  const loadingBundle = bundleQuery.isLoading;
  const bundleError = bundleQuery.error
    ? bundleQuery.error instanceof Error
      ? bundleQuery.error.message
      : "Beklenmeyen hata"
    : null;
  const dataError = rolesQuery.error ?? catalogQuery.error;

  const visibleRows = filterCatalogRows(catalogQuery.data ?? [], { search, kind: kindFilter });

  return (
    <AdminPageShell
      title="Rol Yönetimi"
      description="Rol seçmeden tüm attribute, feature ve profil bölümlerini görüntüle. Rol seçince aynı tabloda düzenleme yapabilirsin."
      icon={Shield}
      accent="emerald"
      filters={
        <AdminFilterBar onReset={clearSelections} resetLabel="Seçimi temizle">
          <RoleSearchSelect
            roles={rolesQuery.data ?? []}
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

        {dataError ? (
          <AdminErrorState
            title="Katalog verisi alınamadı"
            description={dataError instanceof Error ? dataError.message : "Beklenmeyen hata"}
            onRetry={() => {
              void rolesQuery.refetch();
              void catalogQuery.refetch();
            }}
          />
        ) : loadingCatalog ? (
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
