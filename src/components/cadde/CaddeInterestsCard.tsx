// Cadde 3.0 Faz 3 — profil "Bireysel İlgi Alanlarım" bölümü (spec §12.1).
// Seçimler user_cadde_interests'e yazılır ve list_cadde_feed_v1 ranking'inde
// (ihtiyaç eşleşmesi + ilgi alanı skoru) kullanılır. Kendi verisini kendisi yönetir;
// ProfilePage'e tek satırla monte edilir.

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";

import { useAuth } from "@/components/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { listCaddeInterestCatalog, listMyCaddeInterests, saveMyCaddeInterests } from "@/lib/cadde-api";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";

const CaddeInterestsCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selection, setSelection] = useState<string[]>([]);

  const catalogQuery = useQuery({
    queryKey: caddeQueryKeys.interestCatalog,
    queryFn: listCaddeInterestCatalog,
    staleTime: 1000 * 60 * 60,
  });

  const myInterestsQuery = useQuery({
    queryKey: caddeQueryKeys.myInterests(user?.id ?? null),
    queryFn: () => listMyCaddeInterests(user?.id ?? ""),
    enabled: Boolean(user?.id),
  });

  useEffect(() => {
    if (myInterestsQuery.data) {
      setSelection(myInterestsQuery.data);
    }
  }, [myInterestsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Bu işlem için giriş yapın.");
      await saveMyCaddeInterests(user.id, selection);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: caddeQueryKeys.myInterests(user?.id ?? null) }),
        queryClient.invalidateQueries({ queryKey: caddeQueryKeys.feedRoot }),
      ]);
      toast({ title: "İlgi alanların kaydedildi" });
    },
    onError: (error) => {
      toast({
        title: "İlgi alanları kaydedilemedi",
        description: error instanceof Error ? error.message : "Bilinmeyen hata",
        variant: "destructive",
      });
    },
  });

  if (!user || (catalogQuery.data ?? []).length === 0) return null;

  const toggle = (key: string) => {
    setSelection((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  };

  const isDirty =
    selection.length !== (myInterestsQuery.data ?? []).length ||
    selection.some((key) => !(myInterestsQuery.data ?? []).includes(key));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-[11px]">
          <Heart className="h-3.5 w-3.5 text-rose-500" />
          Bireysel İlgi Alanlarım
        </CardTitle>
        <CardDescription className="text-[11px]">
          Cadde akışın bu seçimlere göre kişiselleşir; şehrindeki eşleşen ihtiyaçlar üstte görünür.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(catalogQuery.data ?? []).map((interest) => {
            const selected = selection.includes(interest.key);
            return (
              <button
                key={interest.key}
                type="button"
                onClick={() => toggle(interest.key)}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                  selected
                    ? "border-rose-500 bg-rose-50 text-rose-700"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {interest.labelTr}
              </button>
            );
          })}
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={!isDirty || saveMutation.isPending}>
            {saveMutation.isPending ? "Kaydediliyor..." : "İlgi Alanlarını Kaydet"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CaddeInterestsCard;
