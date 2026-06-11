// Çarşı admin sayfası (/admin/cadde/carsi, spec §14.2) — rebuild sonrası kuyruk kalemi.
// Tüm ilanları listeler (admin RLS her durumu görür); aksiyonlar mevcut
// admin_moderate_cadde_entity_v1 RPC'sinden (entity=carsi_item: hide/publish + audit notu) —
// Tanıtım panelinden ayrı kalır (D-01 sözleşmesi).

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { db, reportCaddeApiError } from "@/lib/cadde-internal";
import { moderateCaddeEntity } from "@/lib/cadde-moderation-api";
import { formatCarsiPrice } from "@/lib/cadde-carsi-api";
import type { CarsiItemRow, CarsiItemStatus } from "@/lib/cadde-types";

type AdminCarsiRow = CarsiItemRow & { deleted_at: string | null };

const STATUS_LABELS: Record<CarsiItemStatus, string> = {
  draft: "Taslak",
  published: "Yayında",
  paused: "Pasif",
  expired: "Süresi doldu",
};

async function listAllCarsiItems(): Promise<AdminCarsiRow[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await db
      .from("carsi_items")
      .select("id, owner_user_id, category_key, title, description, price_amount, price_currency, country_id, city_id, image_urls, contact_mode, status, moderation_status, expires_at, created_at, deleted_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []) as AdminCarsiRow[];
  } catch (error: unknown) {
    reportCaddeApiError("listAllCarsiItems", error);
    return [];
  }
}

const AdminCaddeCarsiPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | CarsiItemStatus | "rejected">("all");

  const itemsQuery = useQuery({
    queryKey: ["cadde", "carsi", "admin-all"],
    queryFn: listAllCarsiItems,
  });

  const moderateMutation = useMutation({
    mutationFn: ({ itemId, action }: { itemId: string; action: "hide" | "publish" }) =>
      moderateCaddeEntity({ entityType: "carsi_item", entityId: itemId, action }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cadde", "carsi"] });
      toast({ title: "İlan güncellendi" });
    },
    onError: (error) => {
      toast({ title: "İşlem başarısız", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" });
    },
  });

  const items = useMemo(() => {
    const all = (itemsQuery.data ?? []).filter((item) => !item.deleted_at);
    if (statusFilter === "all") return all;
    if (statusFilter === "rejected") return all.filter((item) => item.moderation_status === "rejected");
    return all.filter((item) => item.status === statusFilter);
  }, [itemsQuery.data, statusFilter]);

  const filterButtons: Array<{ key: typeof statusFilter; label: string }> = [
    { key: "all", label: "Tümü" },
    { key: "published", label: "Yayında" },
    { key: "paused", label: "Pasif" },
    { key: "rejected", label: "Moderasyon Reddi" },
  ];

  return (
    <div className="space-y-5 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-amber-600" />
            Çarşı İlan Yönetimi
          </CardTitle>
          <CardDescription>
            {itemsQuery.isLoading ? "Yükleniyor..." : `${items.length} ilan. Gizleme/yayınlama moderasyon RPC'siyle audit'lenir.`}
          </CardDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            {filterButtons.map((button) => (
              <button
                key={button.key}
                type="button"
                onClick={() => setStatusFilter(button.key)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${statusFilter === button.key ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"}`}
              >
                {button.label}
              </button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link to={`/cadde/carsi/${item.id}`} className="font-semibold text-slate-900 hover:underline">{item.title}</Link>
              <Badge variant={item.status === "published" ? "default" : "secondary"}>{STATUS_LABELS[item.status]}</Badge>
              {item.moderation_status === "rejected" ? <Badge variant="destructive">Moderasyon reddi</Badge> : null}
              <Badge variant="outline">{item.category_key}</Badge>
            </div>
            <p className="mt-1 line-clamp-1 text-xs text-slate-500">{item.description}</p>
            <p className="text-xs font-medium text-amber-900">{formatCarsiPrice({ priceAmount: item.price_amount, priceCurrency: item.price_currency })}</p>
          </div>
          <div className="flex gap-2">
            {item.status === "published" && item.moderation_status === "approved" ? (
              <Button size="sm" variant="outline" onClick={() => moderateMutation.mutate({ itemId: item.id, action: "hide" })} disabled={moderateMutation.isPending}>
                Gizle
              </Button>
            ) : (
              <Button size="sm" onClick={() => moderateMutation.mutate({ itemId: item.id, action: "publish" })} disabled={moderateMutation.isPending}>
                Yayınla
              </Button>
            )}
          </div>
          </CardContent>
        </Card>
      ))}

      {!itemsQuery.isLoading && items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-slate-500">Bu filtrede ilan yok.</CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default AdminCaddeCarsiPage;
