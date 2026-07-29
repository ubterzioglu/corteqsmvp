// Korumalı marka yönetimi (/admin/cadde/markalar).
//
// Marka listesi koda gömülü DEĞİL, DB'de (cadde_protected_brands) — yeni marka eklemek
// deploy gerektirmez. Buradaki liste create_cadde_cafe_v1'in marka kontrolünü besler:
// eşleşen adla cafe açmak yalnız markanın doğrulanmış sahibine (catalog_item_managers)
// ve admin/moderatöre açıktır; diğerlerine "Parodi X" adı önerilir.

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  createCaddeProtectedBrand,
  deleteCaddeProtectedBrand,
  listCaddeProtectedBrandsForAdmin,
  setCaddeProtectedBrandActive,
} from "@/lib/cadde-cafe-api";
import { checkBrandConflict } from "@/lib/cadde-rules";
import { trIncludes } from "@/lib/text-normalization";

const BRANDS_QUERY_KEY = ["cadde", "protected-brands", "admin"] as const;

const emptyForm = { brandName: "", matchPattern: "", note: "" };

const AdminCaddeBrandsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [testName, setTestName] = useState("");

  const brandsQuery = useQuery({ queryKey: BRANDS_QUERY_KEY, queryFn: listCaddeProtectedBrandsForAdmin });
  const brands = brandsQuery.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["cadde", "protected-brands"] });

  const createMutation = useMutation({
    mutationFn: () => createCaddeProtectedBrand(form),
    onSuccess: async () => {
      setForm(emptyForm);
      await invalidate();
      toast({ title: "Marka eklendi" });
    },
    onError: (error) =>
      toast({ title: "Marka eklenemedi", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setCaddeProtectedBrandActive(id, isActive),
    onSuccess: invalidate,
    onError: (error) =>
      toast({ title: "Güncellenemedi", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCaddeProtectedBrand(id),
    onSuccess: async () => {
      await invalidate();
      toast({ title: "Marka silindi" });
    },
    onError: (error) =>
      toast({ title: "Silinemedi", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" }),
  });

  // Türkçe-toleranslı arama: "sutas" yazınca "Sütaş" bulunur.
  const visibleBrands = brands.filter(
    (brand) => !search.trim() || trIncludes(brand.brandName, search) || trIncludes(brand.matchPattern, search),
  );

  const testResult = testName.trim() ? checkBrandConflict(testName, brands.filter((brand) => brand.isActive)) : null;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-600" />
                Korumalı Markalar
              </CardTitle>
              <CardDescription>
                Bu adlarla cafe açmak yalnız markanın doğrulanmış sahibine ve moderatörlere açıktır.
                Diğer üyelere "Parodi …" adı önerilir.
              </CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link to="/admin/cadde">← Cadde Yönetimi</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Yeni marka ekle</CardTitle>
          <CardDescription>
            Eşleşme anahtarı aksansız ve küçük harf olmalı (ör. "Sütaş" markası için <code>sutas</code>).
            Eşleşme kelime sınırında yapılır: <code>nike</code> → "Nike Cafe" yakalanır, "Teknike Dair" yakalanmaz.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <div className="space-y-1.5">
            <Label className="text-xs">Marka adı *</Label>
            <Input value={form.brandName} onChange={(event) => setForm({ ...form, brandName: event.target.value })} placeholder="Sütaş" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Eşleşme anahtarı *</Label>
            <Input value={form.matchPattern} onChange={(event) => setForm({ ...form, matchPattern: event.target.value })} placeholder="sutas" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Not</Label>
            <Input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="İsteğe bağlı" />
          </div>
          <Button className="self-end" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Ekleniyor…" : "Ekle"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ad testi</CardTitle>
          <CardDescription>Bir cafe adının engellenip engellenmeyeceğini burada dene.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input value={testName} onChange={(event) => setTestName(event.target.value)} placeholder="Örn. Starbucks Cafe" />
          {testName.trim() ? (
            testResult ? (
              <p className="text-sm text-amber-800">
                Engellenir — <strong>{testResult}</strong> markasıyla çakışıyor.
              </p>
            ) : (
              <p className="text-sm text-emerald-700">Serbest — hiçbir markayla çakışmıyor.</p>
            )
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Liste ({brands.length})</CardTitle>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Marka ara"
              className="max-w-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {brandsQuery.isLoading ? <p className="text-sm text-slate-500">Yükleniyor…</p> : null}
          {visibleBrands.map((brand) => (
            <div key={brand.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900">{brand.brandName}</span>
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{brand.matchPattern}</code>
                  {!brand.isActive ? <Badge variant="secondary">Pasif</Badge> : null}
                </div>
                {brand.note ? <p className="mt-1 text-xs text-slate-500">{brand.note}</p> : null}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleMutation.mutate({ id: brand.id, isActive: !brand.isActive })}
                  disabled={toggleMutation.isPending}
                >
                  {brand.isActive ? "Pasife Al" : "Aktifleştir"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => deleteMutation.mutate(brand.id)}
                  disabled={deleteMutation.isPending}
                >
                  Sil
                </Button>
              </div>
            </div>
          ))}
          {!brandsQuery.isLoading && visibleBrands.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">Eşleşen marka yok.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCaddeBrandsPage;
