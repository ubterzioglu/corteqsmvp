// Cadde 3.0 Faz 3 — profil "Bireysel İlgi Alanlarım" bölümü (spec §12.1).
// Seçimler user_cadde_interests'e yazılır ve list_cadde_feed_v1 ranking'inde
// (ihtiyaç eşleşmesi + ilgi alanı skoru) kullanılır. Kendi verisini kendisi yönetir;
// ProfilePage'e tek satırla monte edilir.

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Heart } from "lucide-react";

import { useAuth } from "@/components/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { listCaddeInterestCatalog, listMyCaddeInterests, saveMyCaddeInterests } from "@/lib/cadde-api";
import { buildCaddeInterestsMirrorText } from "@/lib/cadde-format";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";
import type { AttributeVisibility } from "@/lib/member-profile";
import { updateProfileAttribute } from "@/lib/member-profile-api";

type CaddeInterestsCardProps = {
  /** Aynalanan `interests` attribute'u yazıldıktan sonra üst bileşenin profil verisini tazelemesi için. */
  onSaved?: () => void;
  /** Kayıtlı `interests` attribute görünürlüğü; toggle bunu yansıtır (public profil ile tutarlılık). */
  visibility?: AttributeVisibility;
  /** Kullanıcı bu alanın görünürlüğünü değiştirebilir mi (afs role rule). Varsayılan: izinli. */
  canHide?: boolean;
};

const CaddeInterestsCard = ({ onSaved, visibility = "public", canHide = true }: CaddeInterestsCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selection, setSelection] = useState<string[]>([]);
  const [draftVisibility, setDraftVisibility] = useState<AttributeVisibility>(visibility);

  // Üst bileşenden gelen kayıtlı görünürlük değiştiğinde toggle'ı senkronla.
  useEffect(() => {
    setDraftVisibility(visibility);
  }, [visibility]);

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

      // Seçimi profil `interests` attribute'una aynala: Profil Tamamlanma kartı ve
      // public profil user_profile_attributes'u okur, user_cadde_interests'i görmez.
      // Görünürlüğü açıkça geçir — aksi halde RPC is_public_default'a düşer ve
      // toggle ile public profil tutarsızlaşır.
      // Ayna yazımı başarısız olursa cadde kaydı geçerli kalır (non-fatal).
      try {
        await updateProfileAttribute(
          "interests",
          buildCaddeInterestsMirrorText(catalogQuery.data ?? [], selection),
          draftVisibility,
        );
      } catch (mirrorError: unknown) {
        console.error("[CaddeInterestsCard] interests attribute aynası yazılamadı", mirrorError);
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: caddeQueryKeys.myInterests(user?.id ?? null) }),
        queryClient.invalidateQueries({ queryKey: caddeQueryKeys.feedRoot }),
      ]);
      onSaved?.();
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
    draftVisibility !== visibility ||
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
        <div className="flex items-center justify-end gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2" style={{ height: "32px" }}>
            {draftVisibility === "public" ? (
              <Eye className="h-3.5 w-3.5 shrink-0 text-primary" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            <Switch
              checked={draftVisibility === "public"}
              disabled={!canHide}
              onCheckedChange={(checked) => setDraftVisibility(checked ? "public" : "private")}
              aria-label="İlgi alanları görünürlük"
            />
          </div>
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={!isDirty || saveMutation.isPending}>
            {saveMutation.isPending ? "Kaydediliyor..." : "İlgi Alanlarını Kaydet"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CaddeInterestsCard;
