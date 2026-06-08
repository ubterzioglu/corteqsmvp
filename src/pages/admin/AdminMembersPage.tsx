import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Search, ShieldCheck, SlidersHorizontal, UserRound } from "lucide-react";

import RoleSearchSelect from "@/components/admin/RoleSearchSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  listAdminCatalogRoles,
  listAdminUnifiedRecords,
  type AdminCatalogFilters,
  type AdminCatalogRoleOption,
} from "@/lib/admin-catalog";
import { setUserRoleAsAdmin } from "@/lib/admin";
import type { UnifiedRecord } from "@/lib/catalog-types";

const PAGE_SIZE = 50;

const STATUS_ABBREVIATIONS: Record<string, { code: string; label: string }> = {
  published: { code: "YAY", label: "Yayında" },
  draft: { code: "TSL", label: "Taslak" },
  pending_review: { code: "INC", label: "İncelemede" },
  archived: { code: "ARS", label: "Arşiv" },
  rejected: { code: "RED", label: "Reddedildi" },
  directory_opted_in: { code: "DIZ", label: "Dizinde" },
  private: { code: "GIZ", label: "Gizli" },
};

const VERIFICATION_ABBREVIATIONS: Record<string, { code: string; label: string }> = {
  unverified: { code: "YOK", label: "Doğrulama Yok" },
  pending: { code: "BEK", label: "Beklemede" },
  verified: { code: "DGR", label: "Doğrulandı" },
  official_source: { code: "RES", label: "Resmi Kaynak" },
  claimed: { code: "SHP", label: "Sahiplenildi" },
};

const DEFAULT_FILTERS: AdminCatalogFilters = {
  kind: "profile",
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

const AdminMembersPage = () => {
  const { toast } = useToast();
  const [records, setRecords] = useState<UnifiedRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [roles, setRoles] = useState<AdminCatalogRoleOption[]>([]);
  const [filters, setFilters] = useState<AdminCatalogFilters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<UnifiedRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const deferredQuery = useDeferredValue(filters.query);
  const effectiveFilters = useMemo(() => ({ ...filters, query: deferredQuery }), [deferredQuery, filters]);

  useEffect(() => {
    let isMounted = true;

    const loadRoles = async () => {
      try {
        const nextRoles = await listAdminCatalogRoles();
        if (isMounted) setRoles(nextRoles);
      } catch (error) {
        if (!isMounted) return;
        toast({
          title: "Roller yüklenemedi",
          description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
          variant: "destructive",
        });
      }
    };

    void loadRoles();
    return () => { isMounted = false; };
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
          title: "Kullanıcılar yüklenemedi",
          description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadRecords();
    return () => { isMounted = false; };
  }, [currentPage, effectiveFilters, toast]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalCount]);

  const statusOptions = useMemo(
    () => Array.from(new Set(records.map((r) => r.status))).sort((a, b) => a.localeCompare(b, "tr")),
    [records],
  );

  const verificationOptions = useMemo(
    () =>
      Array.from(new Set(records.map((r) => r.verificationStatus).filter(Boolean) as string[])).sort((a, b) =>
        a.localeCompare(b, "tr"),
      ),
    [records],
  );

  const cityOptions = useMemo(
    () =>
      Array.from(new Set(records.map((r) => r.primaryCity).filter(Boolean) as string[])).sort((a, b) =>
        a.localeCompare(b, "tr"),
      ),
    [records],
  );

  const countryOptions = useMemo(
    () =>
      Array.from(new Set(records.map((r) => r.primaryCountryCode).filter(Boolean) as string[])).sort((a, b) =>
        a.localeCompare(b, "tr"),
      ),
    [records],
  );

  const roleLabelByKey = useMemo(() => new Map(roles.map((r) => [r.key, r.label])), [roles]);

  const handleFilterChange = <K extends keyof AdminCatalogFilters>(key: K, value: AdminCatalogFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleProfileRoleChange = async (userId: string, roleKey: string) => {
    try {
      await setUserRoleAsAdmin(userId, roleKey);
      setRecords((prev) => prev.map((r) => (r.id === userId ? { ...r, platformRoleKey: roleKey } : r)));
      toast({ title: "Kullanıcı rolü güncellendi", description: `Yeni rol: ${roleLabelByKey.get(roleKey) ?? roleKey}` });
    } catch (error) {
      toast({ title: "Rol güncellenemedi", description: error instanceof Error ? error.message : "Beklenmeyen hata.", variant: "destructive" });
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="sticky top-[76px] z-20">
          <Card className="overflow-hidden border-slate-200 bg-white/95 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.32)] backdrop-blur">
            <CardContent className="space-y-2 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-950">
                  <UserRound className="h-4 w-4 text-emerald-600" />
                  <span>Bireysel Kullanıcılar</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-950">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Toplam Kayıt
                  </span>
                  <span>{isLoading ? "..." : totalCount}</span>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                Auth kullanıcılarına ait profil kayıtlarını görüntüle ve rol ata.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.28)]">
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle>Kullanıcı Listesi</CardTitle>
                <CardDescription>Rol, durum ve lokasyon bilgisi üzerinden bireysel kullanıcıları filtrele.</CardDescription>
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
                  placeholder="Ad, e-posta veya kullanıcı ara"
                  aria-label="Kullanıcı araması"
                  className="h-auto border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
                        {getStatusLabel(status)}
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
                        {getVerificationLabel(status)}
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
                    <TableHead>Ad / E-posta</TableHead>
                    <TableHead>Profil Tipi</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Doğrulama</TableHead>
                    <TableHead>Lokasyon</TableHead>
                    <TableHead>Tarih</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-14 text-center text-sm text-muted-foreground">
                        Kullanıcılar yükleniyor...
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {!isLoading && records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-14 text-center text-sm text-muted-foreground">
                        Bu filtrelerle eşleşen kullanıcı bulunamadı.
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {!isLoading
                    ? records.map((record) => (
                        <TableRow
                          key={record.id}
                          className="cursor-pointer"
                          onClick={() => setSelectedRecord(record)}
                        >
                          <TableCell className="min-w-[200px] max-w-[240px]">
                            <div className="flex flex-col gap-0.5">
                              <div className="truncate font-medium text-slate-950 leading-tight">{record.title}</div>
                              <div className="flex items-center gap-1.5">
                                <span className="truncate text-[10px] text-muted-foreground">{record.email ?? record.id}</span>
                                <span className="shrink-0 text-[10px] text-slate-400">{formatDateShort(record.createdAt)}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {record.profileType ? formatLabel(record.profileType) : "-"}
                            </Badge>
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
                            <Badge variant="secondary" title={getStatusLabel(record.status)}>
                              {getStatusCode(record.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" title={getVerificationLabel(record.verificationStatus)}>
                              {getVerificationCode(record.verificationStatus)}
                            </Badge>
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
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-sm disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                    .reduce<(number | "ellipsis")[]>((acc, p, i, arr) => {
                      if (i > 0) {
                        const prev = arr[i - 1];
                        if (p - prev > 1) acc.push("ellipsis");
                      }
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "ellipsis" ? (
                        <span key={`ellipsis-${i}`} className="px-1 text-xs text-slate-400">…</span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm ${
                            p === currentPage
                              ? "border-slate-900 bg-slate-900 font-medium text-white"
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </button>
                      ),
                    )}
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-sm disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-500" />
              Satıra tıklayınca detay paneli açılır. Yalnızca auth kullanıcılarına ait profil kayıtları listelenir.
            </div>
          </CardContent>
        </Card>
      </div>

      <Sheet open={Boolean(selectedRecord)} onOpenChange={(open) => (!open ? setSelectedRecord(null) : undefined)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
          {selectedRecord ? (
            <ProfileDetailSheet
              profile={selectedRecord}
              roles={roles}
              onRoleChange={(roleKey) => handleProfileRoleChange(selectedRecord.id, roleKey)}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
};

const RoleChangeSection = ({
  currentRoleKey,
  roles,
  onRoleChange,
}: {
  currentRoleKey: string | null;
  roles: AdminCatalogRoleOption[];
  onRoleChange: (roleKey: string) => void;
}) => {
  const NONE = "__none__";
  const [pendingKey, setPendingKey] = useState<string>(currentRoleKey ?? NONE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPendingKey(currentRoleKey ?? NONE);
  }, [currentRoleKey]);

  const isDirty = pendingKey !== (currentRoleKey ?? NONE);

  const handleSave = async () => {
    if (pendingKey === NONE) return;
    setSaving(true);
    await onRoleChange(pendingKey);
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-slate-500" />
          Rol Yönetimi
        </CardTitle>
        <CardDescription>Bu kullanıcı için platform rolünü değiştirin.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <RoleSearchSelect
            roles={roles.map((role) => ({
              value: role.key,
              label: role.label,
              hint: role.key,
              searchText: `${role.label} ${role.key}`,
            }))}
            value={pendingKey}
            onValueChange={setPendingKey}
            placeholder="Rol seçin..."
            className="flex-1"
          />
          <Button size="sm" disabled={!isDirty || saving || pendingKey === NONE} onClick={handleSave}>
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

const MetadataRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span>
    <span className="text-right text-sm text-slate-900">{value}</span>
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
        <Badge variant="secondary">{profile.status}</Badge>
      </div>
      <SheetTitle>{profile.title}</SheetTitle>
      <SheetDescription>Kullanıcı profiline ait admin özeti.</SheetDescription>
    </SheetHeader>

    <RoleChangeSection
      currentRoleKey={profile.platformRoleKey}
      roles={roles}
      onRoleChange={onRoleChange}
    />

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-4 w-4 text-slate-500" />
          Profil Özeti
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <MetadataRow label="Profil Tipi" value={profile.profileType ? formatLabel(profile.profileType) : "-"} />
        <MetadataRow label="Platform Rolü" value={profile.platformRoleKey ?? "-"} />
        <MetadataRow label="E-posta" value={profile.email ?? "-"} />
        <MetadataRow label="Şehir" value={profile.primaryCity ?? "-"} />
        <MetadataRow label="Ülke" value={profile.primaryCountryCode ?? "-"} />
        <MetadataRow label="Durum" value={profile.status} />
        <MetadataRow label="Oluşturulma" value={formatDateTime(profile.createdAt)} />
        <MetadataRow label="Güncellenme" value={formatDateTime(profile.updatedAt)} />
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <UserRound className="h-4 w-4 text-slate-500" />
          Admin Notu
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Bu görünüm yalnızca auth kullanıcılarını (kind=profile) listeler. Katalog kayıtları için /admin/data sayfasını kullanın.
      </CardContent>
    </Card>
  </div>
);

export default AdminMembersPage;
