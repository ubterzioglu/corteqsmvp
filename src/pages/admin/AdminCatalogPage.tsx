import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Database, MapPin, Search, ShieldCheck, SlidersHorizontal, UserRound } from "lucide-react";

import { AdminPageShell } from "@/components/admin/page";
import CatalogClaimRequestsPanel from "@/components/admin/catalog/CatalogClaimRequestsPanel";
import CatalogEntityProfilePanel from "@/components/admin/catalog/CatalogEntityProfilePanel";
import CatalogItemEditorsPanel from "@/components/admin/catalog/CatalogItemEditorsPanel";
import RoleSearchSelect from "@/components/admin/RoleSearchSelect";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  getAdminCatalogItemDetail,
  listAdminCatalogItemTypes,
  listAdminCatalogRoles,
  listAdminUnifiedRecords,
  setCatalogItemRole,
  type AdminCatalogDetail,
  type AdminCatalogFilters,
  type AdminCatalogItemType,
  type AdminCatalogRoleOption,
} from "@/lib/admin-catalog";
import { setUserRoleAsAdmin } from "@/lib/admin";
import type { UnifiedRecord } from "@/lib/catalog-types";

const PAGE_SIZE = 50;
type LegendItem = {
  code: string;
  label: string;
  description: string;
  group: string;
};

const KIND_ABBREVIATIONS: Record<UnifiedRecord["kind"], LegendItem> = {
  catalog_item: {
    code: "KTG",
    label: "Katalog",
    description: "CSV, import, manuel giriş veya başka kaynaklardan gelen katalog kayıtlarını temsil eder.",
    group: "Tür",
  },
  member_profile: {
    code: "MEM",
    label: "Üye",
    description: "Bir auth kullanıcısına bağlı üye katalog kaydını (item_type = member) temsil eder.",
    group: "Tür",
  },
  profile: {
    code: "KUL",
    label: "Kullanıcı",
    description: "Doğrudan platform kullanıcısına ait profil kaydını temsil eder.",
    group: "Tür",
  },
};
const STATUS_ABBREVIATIONS: Record<string, LegendItem> = {
  published: {
    code: "YAY",
    label: "Yayında",
    description: "Kayıt yayına alınmış durumdadır; ilgili akışta görünür veya kullanılabilir kabul edilir.",
    group: "Durum",
  },
  draft: {
    code: "TSL",
    label: "Taslak",
    description: "Kayıt henüz tamamlanmamış ya da yayına hazır olmadığı için taslak olarak tutulur.",
    group: "Durum",
  },
  pending_review: {
    code: "INC",
    label: "İncelemede",
    description: "Kayıt admin ya da moderasyon incelemesi bekliyordur; karar süreci tamamlanmamıştır.",
    group: "Durum",
  },
  archived: {
    code: "ARS",
    label: "Arşiv",
    description: "Kayıt aktif kullanım akışından çıkarılmıştır ama geçmiş referansı için saklanır.",
    group: "Durum",
  },
  rejected: {
    code: "RED",
    label: "Reddedildi",
    description: "Kayıt veya süreç olumsuz kararla sonuçlanmıştır; tekrar değerlendirme gerekebilir.",
    group: "Durum",
  },
  directory_opted_in: {
    code: "DIZ",
    label: "Dizinde",
    description: "Kullanıcı profili dizinde görünmeyi seçmiştir ve listelemeye dahildir.",
    group: "Durum",
  },
  private: {
    code: "GIZ",
    label: "Gizli",
    description: "Kullanıcı profili listeleme veya dizin görünürlüğünü kapatmıştır.",
    group: "Durum",
  },
};
const VERIFICATION_ABBREVIATIONS: Record<string, LegendItem> = {
  unverified: {
    code: "YOK",
    label: "Doğrulama Yok",
    description: "Kaydın doğruluğu için henüz ek bir teyit veya kaynak onayı bulunmuyor.",
    group: "Doğrulama",
  },
  pending: {
    code: "BEK",
    label: "Beklemede",
    description: "Doğrulama süreci başlamış ama henüz sonuçlandırılmamıştır.",
    group: "Doğrulama",
  },
  verified: {
    code: "DGR",
    label: "Doğrulandı",
    description: "Kayıt platform içinde kontrol edilmiş ve yeterli doğrulama eşiğini geçmiştir.",
    group: "Doğrulama",
  },
  official_source: {
    code: "RES",
    label: "Resmi Kaynak",
    description: "Kayıt resmi veya yüksek güvenilirlikli bir kaynaktan geldiği için güçlü doğrulama sinyali taşır.",
    group: "Doğrulama",
  },
  claimed: {
    code: "SHP",
    label: "Sahiplenildi",
    description: "Kayıt ilgili kişi veya temsilci tarafından sahiplenme akışına girmiş ya da bağlanmıştır.",
    group: "Doğrulama",
  },
};
const LEGEND_ITEMS = [
  ...Object.values(KIND_ABBREVIATIONS),
  ...Object.values(STATUS_ABBREVIATIONS),
  ...Object.values(VERIFICATION_ABBREVIATIONS),
].sort((left, right) => left.code.localeCompare(right.code, "tr")) as const;

const DEFAULT_FILTERS: AdminCatalogFilters = {
  kind: "",
  query: "",
  itemType: "",
  platformRoleKey: "",
  status: "",
  verificationStatus: "",
  city: "",
  countryCode: "",
};

const formatDateTime = (value: string | null) => {
  if (!value) return "-";

  return new Date(value).toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  });
};

const formatDateShort = (value: string | null) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    timeZone: "Europe/Berlin",
  });
};

const formatLabel = (value: string) =>
  value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR") + part.slice(1))
    .join(" ");

const compactList = (values: string[], fallback = "-") => {
  if (!values.length) return fallback;
  return values.join(", ");
};

const kindLabel = (kind: UnifiedRecord["kind"]) => KIND_ABBREVIATIONS[kind]?.label ?? formatLabel(kind);
const getKindCode = (kind: UnifiedRecord["kind"]) => KIND_ABBREVIATIONS[kind]?.code ?? kind.slice(0, 3).toUpperCase();
const getStatusCode = (status: string) => STATUS_ABBREVIATIONS[status]?.code ?? formatLabel(status);
const getStatusLabel = (status: string) => STATUS_ABBREVIATIONS[status]?.label ?? formatLabel(status);
const getVerificationCode = (status: string | null) => {
  if (!status) return "-";
  return VERIFICATION_ABBREVIATIONS[status]?.code ?? formatLabel(status);
};
const getVerificationLabel = (status: string | null) => {
  if (!status) return "-";
  return VERIFICATION_ABBREVIATIONS[status]?.label ?? formatLabel(status);
};

const AdminCatalogPage = () => {
  const { toast } = useToast();
  const [records, setRecords] = useState<UnifiedRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [itemTypes, setItemTypes] = useState<AdminCatalogItemType[]>([]);
  const [roles, setRoles] = useState<AdminCatalogRoleOption[]>([]);
  const [filters, setFilters] = useState<AdminCatalogFilters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<UnifiedRecord | null>(null);
  const [selectedCatalogDetail, setSelectedCatalogDetail] = useState<AdminCatalogDetail | null>(null);
  const [isLoadingSelectedDetail, setIsLoadingSelectedDetail] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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
  }, [currentPage, effectiveFilters, toast]);

  useEffect(() => {
    // member_profile records are catalog_items rows (item_type = 'member'),
    // so they load through the same catalog detail RPC as catalog_item.
    const isCatalogBacked =
      selectedRecord?.kind === "catalog_item" || selectedRecord?.kind === "member_profile";

    if (!isCatalogBacked) {
      setSelectedCatalogDetail(null);
      return;
    }

    let isMounted = true;

    const loadDetail = async () => {
      setIsLoadingSelectedDetail(true);

      try {
        const detail = await getAdminCatalogItemDetail(selectedRecord.id);
        if (isMounted) setSelectedCatalogDetail(detail);
      } catch (error) {
        if (!isMounted) return;

        setSelectedCatalogDetail(null);
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
  const legendItems = useMemo(() => [...LEGEND_ITEMS], []);

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
  return (
    <AdminPageShell
      title="Kayıt Veritabanı"
      description="Tüm katalog ve profil kayıtları; kullanıcı rol atama buradan yapılır."
      icon={Database}
      accent="sky"
      contentWidth="wide"
    >
      <div className="space-y-6">
        <Collapsible defaultOpen={false}>
          <Card className="border-slate-200 bg-white shadow-[0_18px_55px_-42px_rgba(15,23,42,0.24)]">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer select-none pb-3 transition-colors hover:bg-slate-50/60">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle>Kısaltma Rehberi</CardTitle>
                    <CardDescription>
                      Tablodaki kısa kodlar alan kazanmak için kullanılır. Aşağıdan her kodun sistemde tam olarak neyi anlattığını açabilirsiniz.
                    </CardDescription>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 [[data-state=open]>&]:rotate-90" />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {legendItems.map((item) => (
                      <div
                        key={`legend-detail-${item.group}-${item.code}`}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                            {item.code}
                          </div>
                          <div className="text-sm font-medium text-slate-900">{item.label}</div>
                          <Badge variant="outline" className="text-[10px]">
                            {item.group}
                          </Badge>
                        </div>
                        <div className="mt-2 text-sm leading-6 text-slate-600">{item.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

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
            <div className="space-y-3">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-inner">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <Input
                  type="search"
                  value={filters.query}
                  onChange={(event) => handleFilterChange("query", event.target.value)}
                  placeholder="Başlık, slug, kategori veya kullanıcı ara"
                  aria-label="Katalog araması"
                  className="h-auto border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                <Select value={filters.kind || "__all__"} onValueChange={(value) => handleFilterChange("kind", value === "__all__" ? "" : (value as AdminCatalogFilters["kind"]))}>
                  <SelectTrigger aria-label="Tür filtresi">
                    <SelectValue placeholder="Tüm türler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tüm türler</SelectItem>
                    <SelectItem value="catalog_item">Katalog</SelectItem>
                    <SelectItem value="member_profile">Üye</SelectItem>
                    <SelectItem value="profile">Kullanıcı</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.itemType || "__all__"} onValueChange={(value) => handleFilterChange("itemType", value === "__all__" ? "" : value)}>
                  <SelectTrigger aria-label="Item type filtresi">
                    <SelectValue placeholder="Tüm tipler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tüm tipler</SelectItem>
                    {itemTypes.map((itemType) => (
                      <SelectItem key={itemType.key} value={itemType.key}>
                        {itemType.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.platformRoleKey || "__all__"}
                  onValueChange={(value) => handleFilterChange("platformRoleKey", value === "__all__" ? "" : value)}
                >
                  <SelectTrigger aria-label="Rol filtresi">
                    <SelectValue placeholder="Tüm roller" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tüm roller</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.key} value={role.key}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.status || "__all__"} onValueChange={(value) => handleFilterChange("status", value === "__all__" ? "" : value)}>
                  <SelectTrigger aria-label="Durum filtresi">
                    <SelectValue placeholder="Tüm durumlar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tüm durumlar</SelectItem>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.verificationStatus || "__all__"}
                  onValueChange={(value) => handleFilterChange("verificationStatus", value === "__all__" ? "" : value)}
                >
                  <SelectTrigger aria-label="Doğrulama filtresi">
                    <SelectValue placeholder="Tüm doğrulamalar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tüm doğrulamalar</SelectItem>
                    {verificationOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.city || "__all__"} onValueChange={(value) => handleFilterChange("city", value === "__all__" ? "" : value)}>
                  <SelectTrigger aria-label="Şehir filtresi">
                    <SelectValue placeholder="Tüm şehirler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tüm şehirler</SelectItem>
                    {cityOptions.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.countryCode || "__all__"} onValueChange={(value) => handleFilterChange("countryCode", value === "__all__" ? "" : value)}>
                  <SelectTrigger aria-label="Ülke filtresi">
                    <SelectValue placeholder="Tüm ülkeler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tüm ülkeler</SelectItem>
                    {countryOptions.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Başlık / Kaynak</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Doğrulama</TableHead>
                    <TableHead>Kaynak / Özet</TableHead>
                    <TableHead>Lokasyon</TableHead>
                    <TableHead>Tarih</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-14 text-center text-sm text-muted-foreground">
                        Admin kayıtları yükleniyor...
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {!isLoading && records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-14 text-center text-sm text-muted-foreground">
                        Bu filtrelerle eşleşen kayıt bulunamadı.
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {!isLoading
                    ? records.map((record) => (
                        <TableRow key={`${record.kind}-${record.id}`} className="cursor-pointer" onClick={() => setSelectedRecord(record)}>
                          <TableCell className="min-w-[200px] max-w-[240px]">
                            <div className="flex flex-col gap-0.5">
                              <div className="truncate font-medium text-slate-950 leading-tight">{record.title}</div>
                              <div className="flex items-center gap-1.5">
                                <span className="truncate text-[10px] text-muted-foreground">{record.slug ?? record.email ?? record.id}</span>
                                <span className="shrink-0 text-[10px] text-slate-400">{formatDateShort(record.createdAt)}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" title={kindLabel(record.kind)} aria-label={`Tür: ${kindLabel(record.kind)}`}>
                              {getKindCode(record.kind)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{record.itemType ? formatLabel(record.itemType) : record.profileType ? formatLabel(record.profileType) : "-"}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[130px]">
                            <div
                              className="truncate text-[11px] font-medium text-slate-700"
                              title={roleLabelByKey.get(record.platformRoleKey ?? "") ?? record.platformRoleKey ?? "-"}
                            >
                              {roleLabelByKey.get(record.platformRoleKey ?? "") ?? record.platformRoleKey ?? "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" title={getStatusLabel(record.status)} aria-label={`Durum: ${getStatusLabel(record.status)}`}>
                              {getStatusCode(record.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              title={getVerificationLabel(record.verificationStatus)}
                              aria-label={`Doğrulama: ${getVerificationLabel(record.verificationStatus)}`}
                            >
                              {getVerificationCode(record.verificationStatus)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[160px]">
                            <div
                              className="truncate text-[11px] text-muted-foreground"
                              title={
                                record.kind === "catalog_item"
                                  ? compactList([...record.categoryLabels, ...record.sourceTypes.map((value) => formatLabel(value))].slice(0, 5))
                                  : (record.email ?? "-")
                              }
                            >
                              {record.kind === "catalog_item"
                                ? compactList(
                                    [...record.categoryLabels, ...record.sourceTypes.map((value) => formatLabel(value))].slice(0, 3),
                                  )
                                : record.email ?? "-"}
                            </div>
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {[record.primaryCity, record.primaryCountryCode].filter(Boolean).join(", ") || "-"}
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap" title={formatDateTime(record.createdAt)}>
                            {formatDateShort(record.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    : null}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 ? (
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div className="text-xs text-slate-600">
                  {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} / {totalCount} kayıt
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-sm disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
                    .reduce<(number | "ellipsis")[]>((acc, page, index, pages) => {
                      if (index > 0) {
                        const prev = pages[index - 1];
                        if (page - prev > 1) acc.push("ellipsis");
                      }
                      acc.push(page);
                      return acc;
                    }, [])
                    .map((page, index) =>
                      page === "ellipsis" ? (
                        <span key={`ellipsis-${index}`} className="px-1 text-xs text-slate-400">
                          …
                        </span>
                      ) : (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm ${
                            page === currentPage
                              ? "border-slate-900 bg-slate-900 font-medium text-white"
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {page}
                        </button>
                      ),
                    )}
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-sm disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
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
          {selectedRecord ? (
            selectedRecord.kind === "catalog_item" || selectedRecord.kind === "member_profile" ? (
              selectedCatalogDetail ? (
                <CatalogDetailSheet
                  detail={selectedCatalogDetail}
                  roles={roles}
                  onRoleChange={(roleKey) => handleCatalogRoleChange(selectedCatalogDetail.id, roleKey)}
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

const RoleChangeSection = ({
  currentRoleKey,
  roles,
  onRoleChange,
  isClearable = false,
}: {
  currentRoleKey: string | null;
  roles: AdminCatalogRoleOption[];
  onRoleChange: (roleKey: string | null) => void;
  isClearable?: boolean;
}) => {
  const NONE = "__none__";
  const [pendingKey, setPendingKey] = useState<string>(currentRoleKey ?? NONE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPendingKey(currentRoleKey ?? NONE);
  }, [currentRoleKey]);

  const isDirty = pendingKey !== (currentRoleKey ?? NONE);

  const handleSave = async () => {
    setSaving(true);
    await onRoleChange(pendingKey === NONE ? null : pendingKey);
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-slate-500" />
          Rol Yönetimi
        </CardTitle>
        <CardDescription>Bu kayıt için platform rolünü değiştirin.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <RoleSearchSelect
            roles={[
              ...(isClearable
                ? [{ value: NONE, label: "— Rol Yok —", hint: "no_role", searchText: "rol yok none clear" }]
                : []),
              ...roles.map((role) => ({
                value: role.key,
                label: role.label,
                hint: role.key,
                searchText: `${role.label} ${role.key}`,
              })),
            ]}
            value={pendingKey}
            onValueChange={setPendingKey}
            placeholder="Rol seçin..."
            className="flex-1"
          />
          <Button
            size="sm"
            disabled={!isDirty || saving}
            onClick={handleSave}
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
        {currentRoleKey && (
          <p className="text-xs text-muted-foreground">
            Mevcut rol: <span className="font-medium text-slate-700">{currentRoleKey}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const CatalogDetailSheet = ({
  detail,
  roles,
  onRoleChange,
}: {
  detail: AdminCatalogDetail;
  roles: AdminCatalogRoleOption[];
  onRoleChange: (roleKey: string | null) => void;
}) => (
  <div className="space-y-6">
    <SheetHeader>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{formatLabel(detail.itemType)}</Badge>
        <Badge variant="outline">Katalog</Badge>
        <Badge variant="secondary">{formatLabel(detail.status)}</Badge>
        <Badge variant="outline">{formatLabel(detail.verificationStatus)}</Badge>
      </div>
      <SheetTitle>{detail.title}</SheetTitle>
      <SheetDescription>
        <code>{detail.slug}</code> kaydının özet, attribute, claim ve düzenleyici detayları.
      </SheetDescription>
    </SheetHeader>

    <Tabs defaultValue="general" className="space-y-5">
      <TabsList className="h-auto w-full flex-wrap justify-start">
        <TabsTrigger value="general">Özet</TabsTrigger>
        <TabsTrigger value="profile">Attribute Değerleri</TabsTrigger>
        <TabsTrigger value="claims">Talepler</TabsTrigger>
        <TabsTrigger value="editors">Düzenleyiciler</TabsTrigger>
        <TabsTrigger value="sources">Kaynaklar</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-5">
        <RoleChangeSection
          currentRoleKey={detail.platformRoleKey}
          roles={roles}
          onRoleChange={onRoleChange}
          isClearable
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Temel Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <MetadataRow label="Tür" value={kindLabel("catalog_item")} />
              <MetadataRow label="Görünürlük" value={formatLabel(detail.visibility)} />
              <MetadataRow label="Platform Rolü" value={detail.platformRoleKey ?? "-"} />
              <MetadataRow label="Oluşturulma" value={formatDateTime(detail.createdAt)} />
              <MetadataRow label="Güncellenme" value={formatDateTime(detail.updatedAt)} />
              <MetadataRow label="Yayına Alınma" value={formatDateTime(detail.publishedAt)} />
              <MetadataRow label="Oluşturan Kullanıcı" value={detail.createdByUserId ?? "-"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Görünür Özet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>{detail.headline ?? "Başlık altı açıklama yok."}</p>
              <p>{detail.shortDescription ?? "Kısa açıklama yok."}</p>
              <p>{detail.longDescription ?? "Uzun açıklama yok."}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Kategori ve Lokasyon</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Kategoriler</div>
              <div className="flex flex-wrap gap-2">
                {detail.categories.length ? (
                  detail.categories.map((category) => (
                    <Badge
                      key={`${category.slug}-${category.isPrimary ? "primary" : "secondary"}`}
                      variant={category.isPrimary ? "secondary" : "outline"}
                    >
                      {category.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Kategori yok.</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <MapPin className="h-3.5 w-3.5" />
                Lokasyonlar
              </div>
              <div className="space-y-2">
                {detail.locations.length ? (
                  detail.locations.map((location, index) => (
                    <div key={`${location.city}-${location.countryCode}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <div>{[location.city, location.countryCode].filter(Boolean).join(", ") || "Lokasyon bilgisi eksik"}</div>
                      <div className="text-xs text-muted-foreground">{location.addressLine ?? "-"}</div>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Lokasyon kaydı yok.</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="profile">
        <CatalogEntityProfilePanel itemId={detail.id} />
      </TabsContent>

      <TabsContent value="claims">
        <CatalogClaimRequestsPanel itemId={detail.id} />
      </TabsContent>

      <TabsContent value="editors">
        <CatalogItemEditorsPanel itemId={detail.id} />
      </TabsContent>

      <TabsContent value="sources" className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Kaynak Kayıtları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {detail.sources.length ? (
              detail.sources.map((source) => (
                <div key={`${source.sourceType}-${source.externalId}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{formatLabel(source.sourceType)}</Badge>
                    <span className="text-sm font-medium text-slate-900">{source.externalId}</span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <div>Import: {formatDateTime(source.importedAt)}</div>
                    <div>Last seen: {formatDateTime(source.lastSeenAt)}</div>
                    <div className="break-all">URL: {source.sourceUrl ?? "-"}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Bu kayıt için source record bulunamadı.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Attributes JSON</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-xs leading-6 text-slate-100">
              {JSON.stringify(detail.attributes, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
);

const ProfileDetailSheet = ({
  profile,
  roles,
  onRoleChange,
}: {
  profile: UnifiedRecord;
  roles: AdminCatalogRoleOption[];
  onRoleChange: (roleKey: string) => void;
}) => (
  <div className="space-y-6">
    <SheetHeader>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">Kullanıcı</Badge>
        <Badge variant="outline">{profile.profileType ? formatLabel(profile.profileType) : "-"}</Badge>
        <Badge variant="secondary">{formatLabel(profile.status)}</Badge>
      </div>
      <SheetTitle>{profile.title}</SheetTitle>
      <SheetDescription>Kullanıcı profiline ait unified admin özeti.</SheetDescription>
    </SheetHeader>

    <RoleChangeSection
      currentRoleKey={profile.platformRoleKey}
      roles={roles}
      onRoleChange={(roleKey) => roleKey && onRoleChange(roleKey)}
    />

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Profil Özeti</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <MetadataRow label="Tür" value="Kullanıcı" />
        <MetadataRow label="Profil Tipi" value={profile.profileType ? formatLabel(profile.profileType) : "-"} />
        <MetadataRow label="Platform Rolü" value={profile.platformRoleKey ?? "-"} />
        <MetadataRow label="E-posta" value={profile.email ?? "-"} />
        <MetadataRow label="Şehir" value={profile.primaryCity ?? "-"} />
        <MetadataRow label="Ülke" value={profile.primaryCountryCode ?? "-"} />
        <MetadataRow label="Oluşturulma" value={formatDateTime(profile.createdAt)} />
        <MetadataRow label="Güncellenme" value={formatDateTime(profile.updatedAt)} />
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Admin Notu</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <UserRound className="h-4 w-4" />
          Bu görünüm profile-uygun özet sunar. Kataloga özel rol, claim ve editor panelleri yalnız katalog item kayıtlarında açılır.
        </div>
      </CardContent>
    </Card>
  </div>
);

const MetadataRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span>
    <span className="text-right text-sm text-slate-900">{value}</span>
  </div>
);

export default AdminCatalogPage;
