import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { useToast } from "@/hooks/use-toast";
import { createCaddePost, updateCaddePost } from "@/lib/cadde-api";
import { emptyCaddeComposer } from "@/lib/cadde-composer";
import type { CaddeMediaAsset } from "@/lib/cadde-types";

type UseCaddeComposerStateInput = {
  canPost: boolean;
  diasporaKey: string;
  registeredCountry: string;
  registeredCity: string;
  onPublished: () => Promise<void>;
};

/** CD02: düzenleme moduna alınan gönderinin composer'a yüklenen hâli. */
export type CaddeEditingPost = {
  id: string;
  body: string;
  media: CaddeMediaAsset[];
  country: string;
  city: string;
};

export function useCaddeComposerState({
  canPost,
  diasporaKey,
  registeredCountry,
  registeredCity,
  onPublished,
}: UseCaddeComposerStateInput) {
  const { toast } = useToast();
  const [composer, setComposer] = useState(emptyCaddeComposer);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const defaultComposerLocationLabel =
    [registeredCountry, registeredCity].filter(Boolean).join(" / ") || "profil konumun";

  const postMutation = useMutation({
    mutationFn: async () => {
      if (!canPost) throw new Error("Bu işlem için giriş yapın.");
      if (!composer.body.trim() && composer.media.length === 0) {
        throw new Error("Paylaşım metni veya en az bir görsel/video ekle.");
      }

      const primaryCountry = composer.country || registeredCountry;
      const primaryCity = composer.country ? composer.city : registeredCity;
      if (!primaryCountry.trim()) {
        throw new Error(
          "Paylaşımın hangi şehir/ülke akışına düşeceğini seç: Konum panelinden bir ülke seç ya da profiline konumunu ekle. Global akışa doğrudan paylaşım yapılamıyor.",
        );
      }

      const targets = [
        { country: primaryCountry, city: primaryCity },
        ...composer.targets
          .filter((target) => target.country.trim())
          .map((target) => ({ country: target.country.trim(), city: target.city?.trim() ?? "" })),
      ];

      await createCaddePost({
        type: composer.type,
        title: composer.title,
        body: composer.body,
        countryId: primaryCountry,
        cityId: primaryCity,
        targets,
        isBridge: false,
        interests: composer.interests,
        diasporaKey,
        media: composer.media,
      });
    },
    onSuccess: async () => {
      setComposer(emptyCaddeComposer);
      await onPublished();
      toast({ title: "Paylaşım Cadde'ye eklendi" });
    },
    onError: (error) => {
      toast({
        title: "Paylaşım gönderilemedi",
        description: error instanceof Error ? error.message : "Bilinmeyen hata",
        variant: "destructive",
      });
    },
  });

  /**
   * CD02 · düzenleme mutasyonu (`update_cadde_post_v1`, A11b).
   *
   * ⚠️ T1: `mentions` GÖNDERİLMEZ — RPC p_mentions null iken mevcut anmaları
   * korur; body'den düşen anma satırları da silinmez (RPC tasarımı).
   * ⚠️ Medya TAM liste gider (RPC "null=dokunma, liste=değiştir"): kullanıcı
   * medyaya dokunmasa bile mevcut liste aynen gönderilir, davranış birebir kalır.
   * ⚠️ T3: konum yalnız TEK hedef olarak gider; ek hedefler düzenlemede taşınmaz
   * (premium kapısı). Ülke seçili değilse targets hiç gönderilmez (dokunma).
   */
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!canPost) throw new Error("Bu işlem için giriş yapın.");
      if (!editingPostId) throw new Error("Düzenlenen paylaşım bulunamadı.");
      if (!composer.body.trim() && composer.media.length === 0) {
        throw new Error("Paylaşım metni veya en az bir görsel/video ekle.");
      }

      await updateCaddePost({
        postId: editingPostId,
        body: composer.body,
        media: composer.media,
        ...(composer.country.trim()
          ? { targets: [{ country: composer.country.trim(), city: composer.city?.trim() ?? "" }] }
          : {}),
      });
    },
    onSuccess: async () => {
      setEditingPostId(null);
      setComposer(emptyCaddeComposer);
      await onPublished();
      toast({ title: "Paylaşım güncellendi" });
    },
    onError: (error) => {
      toast({
        title: "Paylaşım güncellenemedi",
        description: error instanceof Error ? error.message : "Bilinmeyen hata",
        variant: "destructive",
      });
    },
  });

  /** Menünün "Düzenle" öğesi: composer'ı gönderi verisiyle doldurur. */
  const startEditing = (post: CaddeEditingPost) => {
    setEditingPostId(post.id);
    setComposer({
      ...emptyCaddeComposer,
      body: post.body,
      media: post.media,
      country: post.country,
      city: post.city,
    });
  };

  const cancelEditing = () => {
    setEditingPostId(null);
    setComposer(emptyCaddeComposer);
  };

  return {
    composer,
    defaultComposerLocationLabel,
    postMutation,
    setComposer,
    editingPostId,
    updateMutation,
    startEditing,
    cancelEditing,
  };
}
