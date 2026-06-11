// Çarşı ilan detayı (/cadde/carsi/:itemId, spec §14.2).
// Sahibi için yayına al / pasife al / sil kontrolleri; diğer kullanıcılar için
// ilan bilgisi + sahibin profil linki. Süresi dolan/pasif ilanı RLS sahibi dışında gizler.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Clock3, MapPin, ShoppingBag, User2 } from "lucide-react";

import { useAuth } from "@/components/auth/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { deleteCarsiItem, formatCarsiPrice, getCarsiItem, recordCarsiContact, updateCarsiItem } from "@/lib/cadde-carsi-api";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));

const CaddeCarsiItemPage = () => {
  const { itemId = "" } = useParams<{ itemId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const itemQuery = useQuery({
    queryKey: caddeQueryKeys.carsiItem(itemId),
    queryFn: () => getCarsiItem(itemId),
    enabled: Boolean(itemId),
  });
  const item = itemQuery.data ?? null;
  const isOwner = Boolean(user && item?.ownerUserId === user.id);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: caddeQueryKeys.carsiRoot });
  };

  const statusMutation = useMutation({
    mutationFn: (status: "published" | "paused") => updateCarsiItem({ itemId, status }),
    onSuccess: invalidate,
    onError: (error) => {
      toast({ title: "İlan güncellenemedi", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCarsiItem(itemId),
    onSuccess: async () => {
      await invalidate();
      toast({ title: "İlan silindi" });
      navigate("/cadde/carsi");
    },
    onError: (error) => {
      toast({ title: "İlan silinemedi", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" });
    },
  });

  if (itemQuery.isLoading) {
    return <main className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-500">İlan yükleniyor...</main>;
  }

  if (!item) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-slate-600">İlan bulunamadı, kaldırılmış veya süresi dolmuş.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/cadde/carsi">Çarşı'ya Dön</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffdf8_0%,#fff7ec_22%,#f6f8fb_100%)]">
      <section className="mx-auto w-full max-w-3xl space-y-5 px-4 py-8">
        <Card className="border-amber-200 bg-white/95">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-amber-300 text-amber-800">
                <ShoppingBag className="mr-1 h-3 w-3" />
                {item.categoryLabel}
              </Badge>
              {item.status !== "published" ? <Badge variant="secondary">Yayında değil</Badge> : null}
            </div>
            <CardTitle className="text-2xl">{item.title}</CardTitle>
            <p className="text-xl font-bold text-amber-900">{formatCarsiPrice(item)}</p>
            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5"><User2 className="h-4 w-4 text-amber-600" />{item.ownerName}</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-amber-600" />{[item.country, item.city].filter(Boolean).join(" • ") || "Global"}</span>
              <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-amber-600" />{formatDate(item.createdAt)}{item.expiresAt ? ` → ${formatDate(item.expiresAt)}` : ""}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {item.imageUrls.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {item.imageUrls.map((url) => (
                  <img key={url} src={url} alt={item.title} className="h-44 w-full rounded-xl border border-slate-200 object-cover" loading="lazy" />
                ))}
              </div>
            ) : null}

            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{item.description}</p>

            <Separator />

            {isOwner ? (
              <div className="flex flex-wrap gap-2">
                {item.status === "published" ? (
                  <Button variant="outline" onClick={() => statusMutation.mutate("paused")} disabled={statusMutation.isPending}>Pasife Al</Button>
                ) : (
                  <Button onClick={() => statusMutation.mutate("published")} disabled={statusMutation.isPending}>Yayına Al</Button>
                )}
                <Button variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>İlanı Sil</Button>
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                İlan sahibine ulaşmak için{" "}
                <Link
                  to={`/directory/profile/${item.ownerUserId}`}
                  className="font-semibold underline"
                  onClick={() => recordCarsiContact(item.id)}
                >
                  profilini ziyaret et
                </Link>
                . Platform içi mesajlaşma tercih edilir; ödeme/teslimde topluluk güvenlik kurallarına uy.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link to="/cadde/carsi">← Çarşı'ya Dön</Link>
          </Button>
        </div>
      </section>
    </main>
  );
};

export default CaddeCarsiItemPage;
