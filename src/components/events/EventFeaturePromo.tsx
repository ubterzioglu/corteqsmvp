// M10 · EventFeaturePromo — kilitli ücretli yüzeyler + ilgi kaydı.
//
// Plan kararı: ÖDEME KAPSAM DIŞI (Stripe ayrı plan). "Öne çıkar" ve "Bilet sat"
// KİLİTLİ kart olarak durur; tıklayanın ilgisi `feature_interest`'a yazılır —
// ücretli tarafın ne zaman yapılacağına bu birikim karar verir. Fiyat/ödeme
// UI'ı UYDURULMAZ (kilit + açıklama + ilgi düğmesi).
//
// Yerleşim: MyEventsPanel listesinin altı (yalnız etkinliği olan üye görür —
// etkinliği olmayana "öne çıkar" satmak anlamsız).
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Lock, Sparkles, Ticket } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  FEATURE_INTEREST_KEYS,
  fetchMyFeatureInterests,
  registerFeatureInterest,
  type FeatureInterestKey,
} from "@/lib/feature-interest-api";
import { getErrorMessage } from "@/lib/whatsapp-landing-form";

const PROMO_META: Record<FeatureInterestKey, {
  label: string;
  description: string;
  icon: typeof Sparkles;
} | null> = {
  "event.featured": {
    label: "Öne çıkar",
    description: "Etkinliğin dizinde ve akışta öne çıksın. Ücretli yüzey yakında — ilgi kaydı planlamayı belirleyecek.",
    icon: Sparkles,
  },
  "event.ticketing": {
    label: "Bilet sat",
    description: "Etkinliğine bilet/aidat topla. Ücretli yüzey yakında — ödeme altyapısı ayrı planda.",
    icon: Ticket,
  },
  // M22: pro.inbox bu panelde ÇİZİLMEZ (etkinlik yüzeyi değil) — kendi kartı
  // ProLockedInboxCard, /tavsiye/:id detayında. Record EXHAUSTIVE kalır:
  // FEATURE_INTEREST_KEYS'e yeni anahtar gelirse buraya meta ya da bilinçli
  // null EKLEMEK zorunlu (derleme zamanı aynası korunur).
  "pro.inbox": null,
};

const INTERESTS_KEY = "feature-interests-mine";

export function EventFeaturePromo() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeKey, setActiveKey] = useState<FeatureInterestKey | null>(null);

  const interestsQuery = useQuery({
    queryKey: [INTERESTS_KEY],
    queryFn: fetchMyFeatureInterests,
  });
  const registered = new Set(interestsQuery.data ?? []);

  const interestMutation = useMutation({
    mutationFn: (key: FeatureInterestKey) => registerFeatureInterest(key),
    onSuccess: (_result, key) => {
      void queryClient.invalidateQueries({ queryKey: [INTERESTS_KEY] });
      toast({ title: "İlgin kaydedildi", description: `${PROMO_META[key].label} için listeye eklendin.` });
    },
    onError: (error) => {
      toast({ title: "Kayıt alınamadı", description: getErrorMessage(error), variant: "destructive" });
    },
  });

  return (
    <section aria-label="Ücretli özellikler (yakında)" data-testid="event-feature-promo">
      <h4 className="text-sm font-bold text-slate-700">Yakında · ücretli özellikler</h4>
      <p className="mt-1 text-xs text-slate-500">
        Bu yüzeyler kilitli; ödeme altyapısı ayrı bir planda. İlgin, hangisinin önce
        yapılacağına karar veriyor.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {FEATURE_INTEREST_KEYS.map((key) => {
          const meta = PROMO_META[key];
          // M22: null meta = bu panelin yüzeyi değil (pro.inbox → ProLockedInboxCard).
          if (!meta) return null;
          const Icon = meta.icon;
          const isRegistered = registered.has(key);
          return (
            <Card key={key} className="border-slate-200 bg-slate-50/60" data-testid={`feature-promo-${key}`}>
              <CardContent className="flex items-start gap-3 p-4">
                <span className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                  <Lock className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-slate-500 p-0.5 text-white" aria-hidden="true" />
                </span>
                <div className="min-w-0 text-left">
                  <p className="text-sm font-semibold text-slate-800">{meta.label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{meta.description}</p>
                  {isRegistered ? (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700" data-testid={`feature-promo-${key}-done`}>
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      İlgin kaydedildi
                    </p>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      disabled={interestMutation.isPending}
                      onClick={() => {
                        setActiveKey(key);
                        interestMutation.mutate(key);
                      }}
                      data-testid={`feature-promo-${key}-cta`}
                    >
                      {interestMutation.isPending && activeKey === key ? "Kaydediliyor…" : "İlgileniyorum"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export default EventFeaturePromo;
