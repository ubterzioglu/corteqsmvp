import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Database, SlidersHorizontal } from "lucide-react";

import { AdminPageShell } from "@/components/admin/page";
import CatalogDetailSheet from "@/components/admin/catalog/CatalogDetailSheet";
import CatalogFiltersBar from "@/components/admin/catalog/CatalogFiltersBar";
import CatalogLegendCard from "@/components/admin/catalog/CatalogLegendCard";
import CatalogPagination from "@/components/admin/catalog/CatalogPagination";
import CatalogRecordsTable from "@/components/admin/catalog/CatalogRecordsTable";
import CatalogRoleCountsCard from "@/components/admin/catalog/CatalogRoleCountsCard";
import ProfileDetailSheet from "@/components/admin/catalog/ProfileDetailSheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import {
  getAdminCatalogItemDetail,
  getUserEmail,
  listAdminCatalogItemTypes,
  listAdminCatalogRoles,
  listAdminRoleRecordCounts,
  listAdminUnifiedRecords,
  setCatalogItemRole,
  type AdminCatalogDetail,
  type AdminCatalogFilters,
  type AdminCatalogItemType,
  type AdminCatalogRoleOption,
  type AdminRoleRecordCount,
} from "@/lib/admin-catalog";
import { DEFAULT_FILTERS, PAGE_SIZE } from "@/lib/admin-catalog-display";
import { setUserRoleAsAdmin } from "@/lib/admin";
import { reviewCatalogImport } from "@/lib/catalog-import-api";
import type { ReviewDecision } from "@/lib/catalog-import-schemas";
import type { UnifiedRecord } from "@/lib/catalog-types";

const AdminCatalogPage = () => {
  const { toast } = useToast();
  const [records, setRecords] = useState<UnifiedRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [itemTypes, setItemTypes] = useState<AdminCatalogItemType[]>([]);
  const [roles, setRoles] = useState<AdminCatalogRoleOption[]>([]);
  const [roleCounts, setRoleCounts] = useState<AdminRoleRecordCount[]>([]);
  const [filters, setFilters] = useState<AdminCatalogFilters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<UnifiedRecord | null>(null);
  const [selectedCatalogDetail, setSelectedCatalogDetail] = useState<AdminCatalogDetail | null>(null);
  const [selectedCreatorEmail, setSelectedCreatorEmail] = useState<string | null>(null);
  const [isLoadingSelectedDetail, setIsLoadingSelectedDetail] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const deferredQuery = useDeferredValue(filters.query);
  const effectiveFilters = useMemo(() => ({ ...filters, query: deferredQuery }), [deferredQuery, filters]);

  useEffect(() => {
    let isMounted = true;

    const loadLookups = async () => {
      try {
        const [nextItemTypes, nextRoles] = await Promise.all([listAdminCatalogItemTypes(), listAdminCatalogRoles()]);

        if (!isMounted) return;

        setItemTypes(nextItemTypes);
        setRoles(nextRoles);
      } catch (error) {
        if (!isMounted) return;

        toast({
          title: "Katalog seçenekleri yüklenemedi",
          description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
          variant: "destructive",
        });
      }
    };

    void loadLookups();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  useEffect(() => {
    let isMounted = true;

    const loadRoleCounts = async () => {
      try {
        const counts = await listAdminRoleRecordCounts();
        if (isMounted) setRoleCounts(counts);
      } catch (error) {
        if (!isMounted) return;

        toast({
          title: "Rol dağılımı yüklenemedi",
          description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
          variant: "destructive",
        });
      }
    };

    void loadRoleCounts();

    return () => {
      isMounted = false;
    };
  }, [toast, reloadKey]);

  useEffect(() => {
    let isMounted = true;

    const loadRecords = async () => {
      setIsLoading(true);

      try {
        const response = await listAdminUnifiedRecords({
          page: currentPage,
          pageSize: PAGE_SIZE,
          filters: effectiveFilters,
        });

        if (!isMounted) return;

        setRecords(response.records);
        setTotalCount(response.totalCount);
      } catch (error) {
        if (!isMounted) return;

        toast({
          title: "Admin kayıtları yüklenemedi",
          description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadRecords();

    return () => {
      isMounted = false;
    };
  }, [currentPage, effectiveFilters, toast, reloadKey]);

  useEffect(() => {
    // member_profile records are catalog_items rows (item_type = 'member'),
    // so they load through the same catalog detail RPC as catalog_item.
    const isCatalogBacked =
      selectedRecord?.kind === "catalog_item" || selectedRecord?.kind === "member_profile";

    if (!isCatalogBacked) {
      setSelectedCatalogDetail(null);
      setSelectedCreatorEmail(null);
      return;
    }

    let isMounted = true;

    const loadDetail = async () => {
      setIsLoadingSelectedDetail(true);
      setSelectedCreatorEmail(null);

      try {
        const detail = await getAdminCatalogItemDetail(selectedRecord.id);
        if (isMounted) setSelectedCatalogDetail(detail);

        if (detail.createdByUserId) {
          try {
            const email = await getUserEmail(detail.createdByUserId);
            if (isMounted) setSelectedCreatorEmail(email);
          } catch {
            // Email resolution is best-effort; the UUID still shows if it fails.
            if (isMounted) setSelectedCreatorEmail(null);
          }
        }
      } catch (error) {
        if (!isMounted) return;

        setSelectedCatalogDetail(null);
        setSelectedCreatorEmail(null);
        toast({
          title: "Katalog detayı yüklenemedi",
          description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) setIsLoadingSelectedDetail(false);
      }
    };

    void loadDetail();

    return () => {
      isMounted = false;
    };
  }, [selectedRecord, toast]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalCount]);

  const statusOptions = useMemo(
    () => Array.from(new Set(records.map((record) => record.status))).sort((left, right) => left.localeCompare(right, "tr")),
    [records],
  );

  const verificationOptions = useMemo(
    () =>
      Array.from(new Set(records.map((record) => record.verificationStatus).filter(Boolean) as string[])).sort((left, right) =>
        left.localeCompare(right, "tr"),
      ),
    [records],
  );

  const cityOptions = useMemo(
    () =>
      Array.from(new Set(records.map((record) => record.primaryCity).filter(Boolean) as string[])).sort((left, right) =>
        left.localeCompare(right, "tr"),
      ),
    [records],
  );

  const countryOptions = useMemo(
    () =>
      Array.from(new Set(records.map((record) => record.primaryCountryCode).filter(Boolean) as string[])).sort((left, right) =>
        left.localeCompare(right, "tr"),
      ),
    [records],
  );
  const roleLabelByKey = useMemo(
    () => new Map(roles.map((role) => [role.key, role.label])),
    [roles],
  );

  const handleFilterChange = <K extends keyof AdminCatalogFilters>(key: K, value: AdminCatalogFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const selectedProfile = selectedRecord?.kind === "profile" ? selectedRecord : null;

  const handleCatalogRoleChange = async (itemId: string, roleKey: string | null) => {
    try {
      await setCatalogItemRole(itemId, roleKey);
      setSelectedCatalogDetail((prev) => prev ? { ...prev, platformRoleKey: roleKey } : prev);
      setRecords((prev) =>
        prev.map((r) => r.id === itemId ? { ...r, platformRoleKey: roleKey } : r),
      );
      toast({ title: "Katalog rolü güncellendi", description: roleKey ? `Yeni rol: ${roleLabelByKey.get(roleKey) ?? roleKey}` : "Rol kaldırıldı." });
    } catch (error) {
      toast({ title: "Rol güncellenemedi", description: error instanceof Error ? error.message : "Beklenmeyen hata.", variant: "destructive" });
    }
  };

  const handleProfileRoleChange = async (userId: string, roleKey: string) => {
    try {
      await setUserRoleAsAdmin(userId, roleKey);
      setRecords((prev) =>
        prev.map((r) => r.id === userId ? { ...r, platformRoleKey: roleKey } : r),
      );
      toast({ title: "Kullanıcı rolü güncellendi", description: `Yeni rol: ${roleLabelByKey.get(roleKey) ?? roleKey}` });
    } catch (error) {
      toast({ title: "Rol güncellenemedi", description: error instanceof Error ? error.message : "Beklenmeyen hata.", variant: "destructive" });
    }
  };

  const handleImportReview = async (itemId: string, decision: ReviewDecision, note: string | null) => {
    try {
      await reviewCatalogImport(itemId, decision, note);
      toast({
        title: decision === "approved" ? "Kayıt onaylandı" : "Kayıt reddedildi",
        description: decision === "approved" ? "Kayıt yayına alındı ve herkese açık." : "Kayıt reddedildi ve gizli kaldı.",
      });
      setSelectedRecord(null);
      setReloadKey((key) => key + 1);
    } catch (error) {
      toast({
        title: "Karar uygulanamadı",
        description: error instanceof Error ? error.message : "Beklenmeyen hata.",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminPageShell
      title="Kayıt Veritabanı"
      description="Tüm katalog ve profil kayıtları; kullanıcı rol atama buradan yapılır."
      icon={Database}
      accent="sky"
      contentWidth="wide"
    >
      <div className="space-y-6">
        <CatalogLegendCard />

        <CatalogRoleCountsCard roleCounts={roleCounts} />

        <Card className="border-slate-200 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.28)]">
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle>Kayıt Listesi</CardTitle>
                <CardDescription>Rol, durum, kaynak ve lokasyon bilgisi üzerinden tüm kayıtları filtrele.</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setFilters(DEFAULT_FILTERS);
                  setCurrentPage(1);
                }}
              >
                Filtreleri Temizle
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <CatalogFiltersBar
              filters={filters}
              itemTypes={itemTypes}
              roles={roles}
              statusOptions={statusOptions}
              verificationOptions={verificationOptions}
              cityOptions={cityOptions}
              countryOptions={countryOptions}
              onFilterChange={handleFilterChange}
            />

            <CatalogRecordsTable
              records={records}
              isLoading={isLoading}
              roleLabelByKey={roleLabelByKey}
              onSelectRecord={setSelectedRecord}
            />

            {totalPages > 1 ? (
              <CatalogPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                onPageChange={setCurrentPage}
              />
            ) : null}

            <div className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-500" />
              Satıra tıklayınca detay paneli açılır. Unified görünüm server-side sayfalama ile çalışır.
            </div>
          </CardContent>
        </Card>
      </div>

      <Sheet open={Boolean(selectedRecord)} onOpenChange={(open) => (!open ? setSelectedRecord(null) : undefined)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl">
          <SheetHeader className="sr-only">
            <SheetTitle>Katalog kayıt detayı</SheetTitle>
            <SheetDescription>Seçilen katalog veya profil kaydının yönetim ayrıntıları.</SheetDescription>
          </SheetHeader>
          {selectedRecord ? (
            selectedRecord.kind === "catalog_item" || selectedRecord.kind === "member_profile" ? (
              selectedCatalogDetail ? (
                <CatalogDetailSheet
                  detail={selectedCatalogDetail}
                  creatorEmail={selectedCreatorEmail}
                  roles={roles}
                  onRoleChange={(roleKey) => handleCatalogRoleChange(selectedCatalogDetail.id, roleKey)}
                  onReview={(decision, note) => handleImportReview(selectedCatalogDetail.id, decision, note)}
                />
              ) : isLoadingSelectedDetail ? (
                <div className="py-10 text-sm text-muted-foreground">Katalog detayı yükleniyor...</div>
              ) : null
            ) : selectedProfile ? (
              <ProfileDetailSheet
                profile={selectedProfile}
                roles={roles}
                onRoleChange={(roleKey) => handleProfileRoleChange(selectedProfile.id, roleKey)}
              />
            ) : null
          ) : null}
        </SheetContent>
      </Sheet>
    </AdminPageShell>
  );
};

export default AdminCatalogPage;
