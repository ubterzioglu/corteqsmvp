import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { useToast } from "@/hooks/use-toast";
import { createCaddePost } from "@/lib/cadde-api";
import { emptyCaddeComposer } from "@/lib/cadde-composer";

type UseCaddeComposerStateInput = {
  canPost: boolean;
  diasporaKey: string;
  registeredCountry: string;
  registeredCity: string;
  onPublished: () => Promise<void>;
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

  return { composer, defaultComposerLocationLabel, postMutation, setComposer };
}
