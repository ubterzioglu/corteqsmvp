// M22 · ProLockedInboxCard — kilitli "talep sahibine doğrudan ulaş" yüzeyi.
// Desen: EventFeaturePromo (M10) — ÖDEME KAPSAM DIŞI (K05 Stripe PARK),
// fiyat/ödeme UI'ı UYDURULMAZ; kilit + açıklama + ilgi düğmesi. Tıklayanın
// ilgisi `feature_interest`'a 'pro.inbox' anahtarıyla yazılır (beyaz liste
// M22'de genişledi, mig 20261004110000) — "ücretli tarafın ne zaman
// yapılacağına bu tablo karar verecek".
//
// 🔴 Talep sahibinin İLETİŞİMİ bu kartta HİÇ çizilmez — istemciye zaten gelmez
// (detay sorgusu requester contact taşımaz). Kilit, "Pro gelince açılacak"
// sözüdür; kanıt satırı (feature_interest) silinmez, aynı kişi iki kez sayılmaz
// (RPC idempotent: already:true).
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Lock, MailOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  fetchMyFeatureInterests,
  registerFeatureInterest,
  type FeatureInterestKey,
} from "@/lib/feature-interest-api";
import { getErrorMessage } from "@/lib/whatsapp-landing-form";

// EventFeaturePromo ile AYNI anahtar — ilgi listesi tek cache'ten okunur,
// invalidation iki yüzeyi birden tazeler.
const INTERESTS_KEY = "feature-interests-mine";
const PRO_INBOX_KEY: FeatureInterestKey = "pro.inbox";

export function ProLockedInboxCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const interestsQuery = useQuery({
    queryKey: [INTERESTS_KEY],
    queryFn: fetchMyFeatureInterests,
  });
  const registered = (interestsQuery.data ?? []).includes(PRO_INBOX_KEY);

  const interestMutation = useMutation({
    mutationFn: (key: FeatureInterestKey) => registerFeatureInterest(key),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [INTERESTS_KEY] });
      toast({
        title: "İlgin kaydedildi",
        description: "Doğrudan iletişim Pro'da açıldığında ilk sen haberdar olacaksın.",
      });
    },
    onError: (error) => {
      toast({ title: "Kayıt alınamadı", description: getErrorMessage(error), variant: "destructive" });
    },
  });

  return (
    <Card
      data-testid="pro-locked-inbox-card"
      className="border-slate-200 bg-slate-50/60"
      aria-label="Talep sahibine doğrudan ulaş (kilitli)"
    >
      <CardContent className="flex items-start gap-3 p-4">
        <span className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500">
          <MailOpen className="h-4.5 w-4.5" aria-hidden="true" />
          <Lock
            className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-slate-500 p-0.5 text-white"
            aria-hidden="true"
          />
        </span>
        <div className="min-w-0 text-left">
          <p className="text-sm font-semibold text-slate-800">Talep sahibine doğrudan ulaş</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            İletişim bilgisi kilitli — ücretli yüzey yakında. Yanıtını şimdilik talebin
            sayfasından verebilirsin. İlgin, bu özelliğin önceliğini belirliyor.
          </p>
          {registered ? (
            <p
              className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700"
              data-testid="pro-locked-inbox-done"
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              İlgin kaydedildi
            </p>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              disabled={interestMutation.isPending}
              data-testid="pro-locked-inbox-cta"
              onClick={() => interestMutation.mutate(PRO_INBOX_KEY)}
            >
              {interestMutation.isPending ? "Kaydediliyor…" : "İlgileniyorum"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ProLockedInboxCard;
