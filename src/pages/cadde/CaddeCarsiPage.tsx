// Çarşı liste sayfası (/cadde/carsi, spec §14): kategori filtresi + ilan grid'i +
// "İlan Ver" formu + İlanlarım yönetimi (yayına al / pasife al / sil).
// İlan limiti ve validasyonlar DB'de enforce edilir (create_carsi_item_v1, D-07 limiti
// ayarlardan); buradaki form yalnız ilk hat validasyonudur.

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin, Plus, ShoppingBag } from "lucide-react";

import { useAuth } from "@/components/auth/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  createCarsiItem,
  deleteCarsiItem,
  formatCarsiPrice,
  listCarsiCategories,
  listCarsiItems,
  listMyCarsiItems,
  updateCarsiItem,
} from "@/lib/cadde-carsi-api";
import { listCaddeCities, listCaddeCountries } from "@/lib/cadde-api";
import { useCaddeDiasporaKey } from "@/hooks/cadde/useCaddeDiasporaKey";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";
import type { CarsiItem, CarsiItemStatus } from "@/lib/cadde-types";

const STATUS_LABELS: Record<CarsiItemStatus, string> = {
  draft: "Taslak",
  published: "Yayında",
  paused: "Pasif",
  expired: "Süresi doldu",
};

const emptyForm = {
  categoryKey: "",
  title: "",
  description: "",
  price: "",
  currency: "EUR",
  country: "",
  city: "",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short" }).format(new Date(value));

const CaddeCarsiPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryKey = searchParams.get("kategori") ?? "";
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const diasporaKey = useCaddeDiasporaKey();
  const categoriesQuery = useQuery({ queryKey: caddeQueryKeys.carsiCategories, queryFn: listCarsiCategories });
  const itemsQuery = useQuery({
    queryKey: caddeQueryKeys.carsiItems({ countries: [], cities: [], categoryKey: categoryKey || undefined, diasporaKey }),
    queryFn: () => listCarsiItems({ countries: [], cities: [], categoryKey: categoryKey || undefined, diasporaKey }),
  });
  const myItemsQuery = useQuery({
    queryKey: caddeQueryKeys.myCarsiItems(user?.id ?? null),
    queryFn: () => listMyCarsiItems(user?.id ?? ""),
    enabled: Boolean(user?.id),
  });

  const countriesQuery = useQuery({ queryKey: caddeQueryKeys.countries(), queryFn: listCaddeCountries, enabled: formOpen });
  const citiesQuery = useQuery({
    queryKey: caddeQueryKeys.cities(form.country ? [form.country] : []),
    queryFn: () => listCaddeCities(form.country ? [form.country] : []),
    enabled: formOpen && Boolean(form.country),
  });

  const invalidateCarsi = async () => {
    await queryClient.invalidateQueries({ queryKey: caddeQueryKeys.carsiRoot });
  };

  const createMutation = useMutation({
    mutationFn: () =>
      createCarsiItem({
        categoryKey: form.categoryKey,
        title: form.title,
        description: form.description,
        priceAmount: form.price.trim() ? Number(form.price) : undefined,
        priceCurrency: form.price.trim() ? form.currency : undefined,
        country: form.country || undefined,
        city: form.city || undefined,
        diasporaKey,
      }),
    onSuccess: async () => {
      setFormOpen(false);
      setForm(emptyForm);
      await invalidateCarsi();
      toast({ title: "İlanın Çarşı'da yayınlandı" });
    },
    onError: (error) => {
      toast({ title: "İlan yayınlanamadı", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ itemId, status }: { itemId: string; status: CarsiItemStatus }) => updateCarsiItem({ itemId, status }),
    onSuccess: invalidateCarsi,
    onError: (error) => {
      toast({ title: "İlan güncellenemedi", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => deleteCarsiItem(itemId),
    onSuccess: async () => {
      await invalidateCarsi();
      toast({ title: "İlan silindi" });
    },
    onError: (error) => {
      toast({ title: "İlan silinemedi", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" });
    },
  });

  const myItems = myItemsQuery.data ?? [];
  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);

  const updateForm = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffdf8_0%,#fff7ec_22%,#f6f8fb_100%)]">
      <section className="mx-auto w-full max-w-5xl space-y-5 px-4 py-8">
        <Card className="border-amber-200 bg-white/95">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <ShoppingBag className="h-6 w-6 text-amber-600" />
                  Çarşı
                </CardTitle>
                <CardDescription>Topluluk içi ikinci el, oda, ders, hizmet ve daha fazlası.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link to="/cadde">← Cadde</Link>
                </Button>
                {user ? (
                  <Dialog open={formOpen} onOpenChange={setFormOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        İlan Ver
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Yeni İlan</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Kategori *</Label>
                          <Select value={form.categoryKey || undefined} onValueChange={(value) => updateForm("categoryKey", value)}>
                            <SelectTrigger><SelectValue placeholder="Kategori seç" /></SelectTrigger>
                            <SelectContent>
                              {(categoriesQuery.data ?? []).map((category) => (
                                <SelectItem key={category.key} value={category.key}>{category.labelTr}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Başlık *</Label>
                          <Input value={form.title} onChange={(event) => updateForm("title", event.target.value)} maxLength={100} placeholder="Örn. IKEA çalışma masası" />
                        </div>
                        <div className="space-y-2">
                          <Label>Açıklama *</Label>
                          <Textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} rows={4} maxLength={2000} placeholder="Durumu, teslim şekli, detaylar..." />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Fiyat <span className="font-normal text-slate-500">(boş = belirtilmedi, 0 = ücretsiz)</span></Label>
                            <Input type="number" min={0} value={form.price} onChange={(event) => updateForm("price", event.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Para birimi</Label>
                            <Select value={form.currency} onValueChange={(value) => updateForm("currency", value)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {["EUR", "USD", "GBP", "TRY"].map((code) => (
                                  <SelectItem key={code} value={code}>{code}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Ülke</Label>
                            <Select value={form.country || "__none__"} onValueChange={(value) => { updateForm("country", value === "__none__" ? "" : value); updateForm("city", ""); }}>
                              <SelectTrigger><SelectValue placeholder="Global" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">Global</SelectItem>
                                {(countriesQuery.data ?? []).map((country) => (
                                  <SelectItem key={country.id} value={country.name}>{country.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Şehir</Label>
                            <Select value={form.city || "__none__"} onValueChange={(value) => updateForm("city", value === "__none__" ? "" : value)} disabled={!form.country}>
                              <SelectTrigger><SelectValue placeholder="Tüm şehirler" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">Tüm şehirler</SelectItem>
                                {(citiesQuery.data ?? []).map((city) => (
                                  <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button className="w-full" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                          {createMutation.isPending ? "Yayınlanıyor..." : "İlanı Yayınla"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSearchParams(new URLSearchParams())}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${!categoryKey ? "border-amber-600 bg-amber-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
              >
                Tümü
              </button>
              {(categoriesQuery.data ?? []).map((category) => (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => setSearchParams(new URLSearchParams({ kategori: category.key }))}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${categoryKey === category.key ? "border-amber-600 bg-amber-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                >
                  {category.labelTr}
                </button>
              ))}
            </div>
          </CardHeader>
        </Card>

        {user && myItems.length > 0 ? (
          <Card className="border-slate-200 bg-white/95">
            <CardHeader>
              <CardTitle className="text-base">İlanlarım</CardTitle>
              <CardDescription>Yayına alma, pasife alma ve silme buradan yapılır.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {myItems.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/cadde/carsi/${item.id}`} className="font-semibold text-slate-900 hover:underline">{item.title}</Link>
                      <Badge variant={item.status === "published" ? "default" : "secondary"}>{STATUS_LABELS[item.status]}</Badge>
                    </div>
                    <p className="text-xs text-slate-500">{item.categoryLabel} • {formatCarsiPrice(item)}{item.expiresAt ? ` • Bitiş: ${formatDate(item.expiresAt)}` : ""}</p>
                  </div>
                  <div className="flex gap-2">
                    {item.status === "published" ? (
                      <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ itemId: item.id, status: "paused" })} disabled={statusMutation.isPending}>Pasife Al</Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ itemId: item.id, status: "published" })} disabled={statusMutation.isPending}>Yayına Al</Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => deleteMutation.mutate(item.id)} disabled={deleteMutation.isPending}>Sil</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item: CarsiItem) => (
            <Link key={item.id} to={`/cadde/carsi/${item.id}`}>
              <Card className="h-full border-slate-200 bg-white/95 transition hover:border-amber-300 hover:shadow-md">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="border-amber-300 text-amber-800">{item.categoryLabel}</Badge>
                    <span className="text-xs text-slate-400">{formatDate(item.createdAt)}</span>
                  </div>
                  <h3 className="line-clamp-2 font-semibold text-slate-900">{item.title}</h3>
                  <p className="line-clamp-2 text-sm text-slate-600">{item.description}</p>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="font-semibold text-amber-900">{formatCarsiPrice(item)}</span>
                    {item.city ? (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" />
                        {item.city}
                      </span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {!itemsQuery.isLoading && items.length === 0 ? (
          <Card className="border-dashed border-slate-300 bg-white/90">
            <CardContent className="p-8 text-center text-slate-500">
              Bu kategoride yayında ilan yok.
            </CardContent>
          </Card>
        ) : null}
      </section>
    </main>
  );
};

export default CaddeCarsiPage;
