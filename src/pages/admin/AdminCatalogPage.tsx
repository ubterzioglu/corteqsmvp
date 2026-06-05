import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Database, MapPin, Search, SlidersHorizontal, UserRound } from "lucide-react";

import CatalogClaimRequestsPanel from "@/components/admin/catalog/CatalogClaimRequestsPanel";
import CatalogItemEditorsPanel from "@/components/admin/catalog/CatalogItemEditorsPanel";
import CatalogItemRolePanel from "@/components/admin/catalog/CatalogItemRolePanel";
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
  type AdminCatalogDetail,
  type AdminCatalogFilters,
  type AdminCatalogItemType,
  type AdminCatalogRoleOption,
} from "@/lib/admin-catalog";
import type { UnifiedRecord } from "@/lib/catalog-types";

const PAGE_SIZE = 50;
type LegendItem = {
  code: string;
  label: string;
  description: string;
};

const KIND_ABBREVIATIONS: Record<UnifiedRecord["kind"], LegendItem> = {
  catalog_item: {
    code: "KTG",
    label: "Katalog",
    description: "CSV, import, manuel giriş veya başka kaynaklardan gelen katalog kayıtlarını temsil eder.",
  },
  profile: {
    code: "KUL",
    label: "Kullanıcı",
    description: "Doğrudan platform kullanıcısına ait profil kaydını temsil eder.",
  },
};
const STATUS_ABBREVIATIONS: Record<string, LegendItem> = {
  published: {
    code: "YAY",
    label: "Yayında",
    description: "Kayıt yayına alınmış durumdadır; ilgili akışta görünür veya kullanılabilir kabul edilir.",
  },
  draft: {
    code: "TSL",
    label: "Taslak",
    description: "Kayıt henüz tamamlanmamış ya da yayına hazır olmadığı için taslak olarak tutulur.",
  },
  pending_review: {
    code: "INC",
    label: "İncelemede",
    description: "Kayıt admin ya da moderasyon incelemesi bekliyordur; karar süreci tamamlanmamıştır.",
  },
  archived: {
    code: "ARS",
    label: "Arşiv",
    description: "Kayıt aktif kullanım akışından çıkarılmıştır ama geçmiş referansı için saklanır.",
  },
  rejected: {
    code: "RED",
    label: "Reddedildi",
    description: "Kayıt veya süreç olumsuz kararla sonuçlanmıştır; tekrar değerlendirme gerekebilir.",
  },
  directory_opted_in: {
    code: "DIZ",
    label: "Dizinde",
    description: "Kullanıcı profili dizinde görünmeyi seçmiştir ve listelemeye dahildir.",
  },
  private: {
    code: "GIZ",
    label: "Gizli",
    description: "Kullanıcı profili listeleme veya dizin görünürlüğünü kapatmıştır.",
  },
};
const VERIFICATION_ABBREVIATIONS: Record<string, LegendItem> = {
  unverified: {
    code: "YOK",
    label: "Doğrulama Yok",
    description: "Kaydın doğruluğu için henüz ek bir teyit veya kaynak onayı bulunmuyor.",
  },
  pending: {
    code: "BEK",
    label: "Beklemede",
    description: "Doğrulama süreci başlamış ama henüz sonuçlandırılmamıştır.",
  },
  verified: {
    code: "DGR",
    label: "Doğrulandı",
    description: "Kayıt platform içinde kontrol edilmiş ve yeterli doğrulama eşiğini geçmiştir.",
  },
  official_source: {
    code: "RES",
    label: "Resmi Kaynak",
    description: "Kayıt resmi veya yüksek güvenilirlikli bir kaynaktan geldiği için güçlü doğrulama sinyali taşır.",
  },
  claimed: {
    code: "SHP",
    label: "Sahiplenildi",
    description: "Kayıt ilgili kişi veya temsilci tarafından sahiplenme akışına girmiş ya da bağlanmıştır.",
  },
};
const LEGEND_SECTIONS = [
  {
    title: "Tür",
    summary: "Kaydın sistemde hangi ana varlık ailesine ait olduğunu gösterir.",
    items: Object.values(KIND_ABBREVIATIONS),
  },
  {
    title: "Durum",
    summary: "Kaydın yayın, görünürlük veya moderasyon yaşam döngüsündeki anlık konumunu gösterir.",
    items: Object.values(STATUS_ABBREVIATIONS),
  },
  {
    title: "Doğrulama",
    summary: "Kaydın güvenilirlik ve teyit düzeyini özetler.",
    items: Object.values(VERIFICATION_ABBREVIATIONS),
  },
] as const;

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

const kindLabel = (kind: UnifiedRecord["kind"]) => KIND_ABBREVIATIONS[kind].label;
const getKindCode = (kind: UnifiedRecord["kind"]) => KIND_ABBREVIATIONS[kind].code;
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
    if (selectedRecord?.kind !== "catalog_item") {
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
  const roleLabelByKey = useMemo(
    () => new Map(roles.map((role) => [role.key, role.label])),
    [roles],
  );

  const handleFilterChange = <K extends keyof AdminCatalogFilters>(key: K, value: AdminCatalogFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleSelectedItemRoleChanged = (roleKey: string | null) => {
    if (!selectedRecord || selectedRecord.kind !== "catalog_item") return;

    setSelectedRecord((current) => (current ? { ...current, platformRoleKey: roleKey } : current));
    setSelectedCatalogDetail((current) => (current ? { ...current, platformRoleKey: roleKey } : current));
    setRecords((current) =>
      current.map((record) => (record.id === selectedRecord.id ? { ...record, platformRoleKey: roleKey } : record)),
    );
  };

  const selectedProfile = selectedRecord?.kind === "profile" ? selectedRecord : null;
  const selectedCatalogRecord = selectedRecord?.kind === "catalog_item" ? selectedRecord : null;

  return (
    <>
      <div className="space-y-6">
        <Card className="overflow-hidden border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.14),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_34%),linear-gradient(160deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.96))] shadow-[0_28px_90px_-52px_rgba(15,23,42,0.5)]">
          <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600 shadow-sm">
                <Database className="h-3.5 w-3.5 text-emerald-600" />
                Unified Admin Data
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl tracking-tight text-slate-950">Katalog ve kullanıcılar tek admin yüzeyinde.</CardTitle>
                <CardDescription className="max-w-3xl text-sm leading-6 text-slate-600">
                  Unified admin görünümü ile katalog item&apos;larını ve kullanıcı kayıtlarını tek tabloda ara, filtrele ve detayını aç.
                </CardDescription>
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                {LEGEND_SECTIONS.map((section) => (
                  <div key={section.title} className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3 shadow-sm backdrop-blur">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{section.title} Lejant</div>
                    <div className="mt-2 space-y-1 text-xs text-slate-600">
                      {section.items.map((item) => (
                        <div key={`${section.title}-${item.code}`}>
                          {item.code} = {item.label}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="border-white/80 bg-white/88 shadow-sm">
                <CardContent className="p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Toplam Kayıt</div>
                  <div className="mt-2 text-3xl font-semibold text-slate-950">{isLoading ? "..." : totalCount}</div>
                </CardContent>
              </Card>
              <Card className="border-white/80 bg-white/88 shadow-sm">
                <CardContent className="p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Sayfa Sonucu</div>
                  <div className="mt-2 text-3xl font-semibold text-slate-950">{isLoading ? "..." : records.length}</div>
                </CardContent>
              </Card>
              <Card className="border-white/80 bg-white/88 shadow-sm">
                <CardContent className="p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">İçerik Tipi</div>
                  <div className="mt-2 text-lg font-semibold text-slate-950">{itemTypes.length} aktif katalog tipi</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

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
                <div className="space-y-6">
                  {LEGEND_SECTIONS.map((section) => (
                    <div key={section.title}>
                      <div className="space-y-1 mb-3">
                        <div className="text-sm font-semibold text-slate-900">{section.title} Kısaltmaları</div>
                        <div className="text-xs text-slate-500">{section.summary}</div>
                      </div>
                      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        {section.items.map((item) => (
                          <div key={`${section.title}-detail-${item.code}`} className="grid gap-1 md:grid-cols-[72px_160px_minmax(0,1fr)] md:items-start">
                            <div className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                              {item.code}
                            </div>
                            <div className="text-sm font-medium text-slate-900">{item.label}</div>
                            <div className="text-sm leading-6 text-slate-600">{item.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Card className="border-slate-200 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.28)]">
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle>Data</CardTitle>
                <CardDescription>Tür, tip, rol, kaynak ve lokasyon bilgisi üzerinden unified admin kayıtlarını filtrele.</CardDescription>
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
            <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_repeat(7,minmax(0,1fr))]">
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

              <Select value={filters.kind || "__all__"} onValueChange={(value) => handleFilterChange("kind", value === "__all__" ? "" : (value as AdminCatalogFilters["kind"]))}>
                <SelectTrigger aria-label="Tür filtresi">
                  <SelectValue placeholder="Tür" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tüm türler</SelectItem>
                  <SelectItem value="catalog_item">Katalog</SelectItem>
                  <SelectItem value="profile">Kullanıcı</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.itemType || "__all__"} onValueChange={(value) => handleFilterChange("itemType", value === "__all__" ? "" : value)}>
                <SelectTrigger aria-label="Item type filtresi">
                  <SelectValue placeholder="İçerik tipi" />
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
                  <SelectValue placeholder="Rol" />
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
                  <SelectValue placeholder="Durum" />
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
                  <SelectValue placeholder="Doğrulama" />
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

              <Input
                value={filters.city}
                onChange={(event) => handleFilterChange("city", event.target.value)}
                placeholder="Şehir"
                aria-label="Şehir filtresi"
              />

              <Input
                value={filters.countryCode}
                onChange={(event) => handleFilterChange("countryCode", event.target.value)}
                placeholder="Ülke kodu"
                aria-label="Ülke kodu filtresi"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Başlık</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Doğrulama</TableHead>
                    <TableHead>Kaynak / Özet</TableHead>
                    <TableHead>Lokasyon</TableHead>
                    <TableHead>Oluşturulma</TableHead>
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
                          <TableCell className="min-w-[260px]">
                            <div className="space-y-1">
                              <div className="font-medium text-slate-950">{record.title}</div>
                              <div className="text-xs text-muted-foreground">{record.slug ?? record.email ?? record.id}</div>
                              {record.summary ? <div className="line-clamp-2 text-xs text-muted-foreground">{record.summary}</div> : null}
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
                          <TableCell>
                            <div className="max-w-[150px] text-xs font-medium leading-5 text-slate-700">
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
                          <TableCell className="max-w-[220px] text-xs text-muted-foreground">
                            {record.kind === "catalog_item"
                              ? compactList(
                                  [...record.categoryLabels, ...record.sourceTypes.map((value) => formatLabel(value))].slice(0, 3),
                                )
                              : record.email ?? "-"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {[record.primaryCity, record.primaryCountryCode].filter(Boolean).join(", ") || "-"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDateTime(record.createdAt)}</TableCell>
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
            selectedRecord.kind === "catalog_item" ? (
              selectedCatalogDetail ? (
                <CatalogDetailSheet
                  record={selectedCatalogRecord}
                  detail={selectedCatalogDetail}
                  roles={roles}
                  onRoleChanged={handleSelectedItemRoleChanged}
                />
              ) : isLoadingSelectedDetail ? (
                <div className="py-10 text-sm text-muted-foreground">Katalog detayı yükleniyor...</div>
              ) : null
            ) : selectedProfile ? (
              <ProfileDetailSheet profile={selectedProfile} />
            ) : null
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
};

const CatalogDetailSheet = ({
  record,
  detail,
  roles,
  onRoleChanged,
}: {
  record: UnifiedRecord | null;
  detail: AdminCatalogDetail;
  roles: AdminCatalogRoleOption[];
  onRoleChanged: (roleKey: string | null) => void;
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
        <code>{detail.slug}</code> kaydının metadata, kural, claim ve düzenleyici detayları.
      </SheetDescription>
    </SheetHeader>

    <Tabs defaultValue="general" className="space-y-5">
      <TabsList className="h-auto w-full flex-wrap justify-start">
        <TabsTrigger value="general">Genel Bilgiler</TabsTrigger>
        <TabsTrigger value="rules">Rol & Kurallar</TabsTrigger>
        <TabsTrigger value="claims">Talepler</TabsTrigger>
        <TabsTrigger value="editors">Düzenleyiciler</TabsTrigger>
        <TabsTrigger value="sources">Kaynaklar</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Temel Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <MetadataRow label="Tür" value={kindLabel(record?.kind ?? "catalog_item")} />
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

      <TabsContent value="rules">
        <CatalogItemRolePanel itemId={detail.id} currentRoleKey={detail.platformRoleKey} roles={roles} onRoleChanged={onRoleChanged} />
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

const ProfileDetailSheet = ({ profile }: { profile: UnifiedRecord }) => (
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
