import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Database, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
import {
  filterAdminCatalogItems,
  listAdminCatalogItems,
  listAdminCatalogItemTypes,
  type AdminCatalogDetail,
  type AdminCatalogFilters,
  type AdminCatalogItemType,
} from "@/lib/admin-catalog";

const PAGE_SIZE = 50;

const DEFAULT_FILTERS: AdminCatalogFilters = {
  query: "",
  itemType: "",
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

const AdminCatalogPage = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<AdminCatalogDetail[]>([]);
  const [itemTypes, setItemTypes] = useState<AdminCatalogItemType[]>([]);
  const [filters, setFilters] = useState<AdminCatalogFilters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const deferredQuery = useDeferredValue(filters.query);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);

      try {
        const [nextItems, nextItemTypes] = await Promise.all([
          listAdminCatalogItems(),
          listAdminCatalogItemTypes(),
        ]);

        if (!isMounted) return;

        setItems(nextItems);
        setItemTypes(nextItemTypes);
      } catch (error) {
        if (!isMounted) return;

        toast({
          title: "Katalog kayıtları yüklenemedi",
          description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const effectiveFilters = useMemo(
    () => ({ ...filters, query: deferredQuery }),
    [deferredQuery, filters],
  );

  const filteredItems = useMemo(
    () => filterAdminCatalogItems(items, effectiveFilters),
    [effectiveFilters, items],
  );

  const selectedItem = useMemo(
    () => filteredItems.find((item) => item.id === selectedItemId) ?? items.find((item) => item.id === selectedItemId) ?? null,
    [filteredItems, items, selectedItemId],
  );

  const statusOptions = useMemo(
    () => Array.from(new Set(items.map((item) => item.status))).sort((left, right) => left.localeCompare(right, "tr")),
    [items],
  );

  const verificationOptions = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.verificationStatus))).sort((left, right) =>
        left.localeCompare(right, "tr"),
      ),
    [items],
  );

  const handleFilterChange = <K extends keyof AdminCatalogFilters>(key: K, value: AdminCatalogFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));

  const paginatedItems = useMemo(
    () => filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredItems, currentPage],
  );

  return (
    <>
      <div className="space-y-6">
        <Card className="overflow-hidden border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.14),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_34%),linear-gradient(160deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.96))] shadow-[0_28px_90px_-52px_rgba(15,23,42,0.5)]">
          <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600 shadow-sm">
                <Database className="h-3.5 w-3.5 text-emerald-600" />
                Unified Data
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl tracking-tight text-slate-950">Katalog kayıtları artık tek ekranda.</CardTitle>
                <CardDescription className="max-w-3xl text-sm leading-6 text-slate-600">
                  Yeni katalog altyapısındaki kayıtları tek bir admin yüzeyinde ara, filtrele ve detaylarını aç. Eski
                  kategori alt menüleri yerine tüm veri akışı burada birleşir.
                </CardDescription>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="border-white/80 bg-white/88 shadow-sm">
                <CardContent className="p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Toplam Kayıt</div>
                  <div className="mt-2 text-3xl font-semibold text-slate-950">{isLoading ? "..." : items.length}</div>
                </CardContent>
              </Card>
              <Card className="border-white/80 bg-white/88 shadow-sm">
                <CardContent className="p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Filtre Sonucu</div>
                  <div className="mt-2 text-3xl font-semibold text-slate-950">{isLoading ? "..." : filteredItems.length}</div>
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

        <Card className="border-slate-200 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.28)]">
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle>Data</CardTitle>
                <CardDescription>Başlık, slug, kategori, kaynak tipi ve lokasyon üzerinden katalog kayıtlarını filtrele.</CardDescription>
              </div>
              <Button variant="outline" onClick={() => { setFilters(DEFAULT_FILTERS); setCurrentPage(1); }}>
                Filtreleri Temizle
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,2.2fr)_repeat(5,minmax(0,1fr))]">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-inner">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <Input
                  type="search"
                  value={filters.query}
                  onChange={(event) => handleFilterChange("query", event.target.value)}
                  placeholder="Baslik, slug, kategori veya kaynak ara"
                  aria-label="Katalog araması"
                  className="h-auto border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
                />
              </label>

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
                onValueChange={(value) =>
                  handleFilterChange("verificationStatus", value === "__all__" ? "" : value)
                }
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
                    <TableHead>Tip</TableHead>
                    <TableHead>Kategoriler</TableHead>
                    <TableHead>Kaynak</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Doğrulama</TableHead>
                    <TableHead>Lokasyon</TableHead>
                    <TableHead>Oluşturulma</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-14 text-center text-sm text-muted-foreground">
                        Katalog kayıtları yükleniyor...
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {!isLoading && filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-14 text-center text-sm text-muted-foreground">
                        Bu filtrelerle eşleşen katalog kaydı bulunamadı.
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {!isLoading
                    ? paginatedItems.map((item) => (
                        <TableRow
                          key={item.id}
                          className="cursor-pointer"
                          onClick={() => setSelectedItemId(item.id)}
                        >
                          <TableCell className="min-w-[260px]">
                            <div className="space-y-1">
                              <div className="font-medium text-slate-950">{item.title}</div>
                              <div className="text-xs text-muted-foreground">{item.slug}</div>
                              {item.shortDescription ? (
                                <div className="line-clamp-2 text-xs text-muted-foreground">{item.shortDescription}</div>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{formatLabel(item.itemType)}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[180px] text-xs text-muted-foreground">
                            {compactList(item.categoryLabels)}
                          </TableCell>
                          <TableCell className="max-w-[140px] text-xs text-muted-foreground">
                            {compactList(item.sourceTypes.map(formatLabel))}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{formatLabel(item.status)}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{formatLabel(item.verificationStatus)}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {[item.primaryCity, item.primaryCountryCode].filter(Boolean).join(", ") || "-"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</TableCell>
                        </TableRow>
                      ))
                    : null}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 ? (
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div className="text-xs text-slate-600">
                  {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredItems.length)} / {filteredItems.length} kayıt
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                    .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                      if (idx > 0) {
                        const prev = arr[idx - 1];
                        if (p - prev > 1) acc.push("ellipsis");
                      }
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === "ellipsis" ? (
                        <span key={`ellipsis-${idx}`} className="px-1 text-xs text-slate-400">…</span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setCurrentPage(item)}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm ${
                            item === currentPage
                              ? "border-slate-900 bg-slate-900 font-medium text-white"
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {item}
                        </button>
                      ),
                    )}
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-500" />
              Satıra tıklayınca detay paneli açılır. Varsayılan sıralama en yeni oluşturulan katalog kayıtlarıdır.
            </div>
          </CardContent>
        </Card>
      </div>

      <Sheet open={Boolean(selectedItem)} onOpenChange={(open) => (!open ? setSelectedItemId(null) : undefined)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
          {selectedItem ? (
            <div className="space-y-6">
              <SheetHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{formatLabel(selectedItem.itemType)}</Badge>
                  <Badge variant="secondary">{formatLabel(selectedItem.status)}</Badge>
                  <Badge variant="outline">{formatLabel(selectedItem.verificationStatus)}</Badge>
                </div>
                <SheetTitle>{selectedItem.title}</SheetTitle>
                <SheetDescription>
                  <code>{selectedItem.slug}</code> kaydının temel metadata, kaynak ve lokasyon detayları.
                </SheetDescription>
              </SheetHeader>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Temel Bilgiler</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <MetadataRow label="Görünürlük" value={formatLabel(selectedItem.visibility)} />
                    <MetadataRow label="Oluşturulma" value={formatDateTime(selectedItem.createdAt)} />
                    <MetadataRow label="Güncellenme" value={formatDateTime(selectedItem.updatedAt)} />
                    <MetadataRow label="Yayına Alınma" value={formatDateTime(selectedItem.publishedAt)} />
                    <MetadataRow label="Oluşturan Kullanıcı" value={selectedItem.createdByUserId ?? "-"} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Görünür Özet</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>{selectedItem.headline ?? "Başlık altı açıklama yok."}</p>
                    <p>{selectedItem.shortDescription ?? "Kısa açıklama yok."}</p>
                    <p>{selectedItem.longDescription ?? "Uzun açıklama yok."}</p>
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
                      {selectedItem.categories.length ? (
                        selectedItem.categories.map((category) => (
                          <Badge key={`${category.slug}-${category.isPrimary ? "primary" : "secondary"}`} variant={category.isPrimary ? "secondary" : "outline"}>
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
                      {selectedItem.locations.length ? (
                        selectedItem.locations.map((location, index) => (
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

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Kaynak Kayıtları</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedItem.sources.length ? (
                    selectedItem.sources.map((source) => (
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
                    {JSON.stringify(selectedItem.attributes, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
};

const MetadataRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span>
    <span className="text-right text-sm text-slate-900">{value}</span>
  </div>
);

export default AdminCatalogPage;
