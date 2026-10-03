// M12 · InviteCard — üyenin davet kodu + linki + QR'ı (plan Faz 3).
//
// QR `referral-qr.ts` üzerinden YENİDEN kullanılır (plan notu) — ikinci QR
// altyapısı kurulmaz; `generateReferralQrPngDataUrl` hedefi https/localhost
// dışında reddeder (assertSafeTargetUrl iç kilit).
// Kod M11 RPC'sinden (idempotent); hata durumunda kart kullanıcıya YAZAR
// (KR08: sessiz boş durum yok) ve yeniden dene sunar.
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, Loader2, QrCode } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { buildInviteLink, getOrCreateMyInviteCode } from "@/lib/invites-api";
import { generateReferralQrPngDataUrl } from "@/lib/referral-qr";
import { getErrorMessage } from "@/lib/whatsapp-landing-form";

export function InviteCard() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const codeQuery = useQuery({
    queryKey: ["invite-code", "mine"],
    queryFn: getOrCreateMyInviteCode,
    staleTime: 5 * 60_000,
  });

  const code = codeQuery.data?.code ?? null;
  const inviteLink = code ? buildInviteLink(code) : null;

  useEffect(() => {
    let cancelled = false;
    if (!inviteLink) {
      setQrDataUrl(null);
      return;
    }
    generateReferralQrPngDataUrl(inviteLink)
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        // QR ikincil süs: üretilemezse link+kopyala çalışmaya devam eder.
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [inviteLink]);

  const copyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Kopyalama başarısız",
        description: `Linki elle kopyala: ${inviteLink}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Card data-testid="invite-card" className="border-emerald-200 bg-emerald-50/40">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
          <QrCode className="h-4.5 w-4.5 text-emerald-600" aria-hidden="true" />
          Arkadaşlarını davet et
        </CardTitle>
      </CardHeader>
      <CardContent>
        {codeQuery.isLoading ? (
          <p className="flex items-center gap-2 text-sm text-slate-600" role="status">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Davet kodun hazırlanıyor...
          </p>
        ) : null}

        {codeQuery.error ? (
          <div className="text-left">
            <p className="text-sm font-semibold text-red-700" role="alert">
              {getErrorMessage(codeQuery.error, "Davet kodu alınamadı.")}
            </p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => void codeQuery.refetch()}>
              Yeniden dene
            </Button>
          </div>
        ) : null}

        {code && inviteLink ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 space-y-2 text-left">
              <p className="text-xs text-slate-500">Davet kodun</p>
              <p className="font-mono text-2xl font-black tracking-widest text-slate-900" data-testid="invite-code">
                {code}
              </p>
              <p className="break-all text-xs text-slate-500" data-testid="invite-link">
                {inviteLink}
              </p>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => void copyLink()}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Kopyalandı" : "Linki kopyala"}
              </Button>
            </div>
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Davet linki QR kodu"
                width={128}
                height={128}
                className="shrink-0 rounded-xl border border-slate-200 bg-white p-1"
                data-testid="invite-qr"
              />
            ) : null}
          </div>
        ) : null}

        <p className="mt-3 text-xs text-slate-500">
          Davet ettiğin kişi kayıt olduğunda liderlik tablosunda bir sıra yükselirsin.
          Rozetler davet sayısıyla kazanılır — bir üye yalnız bir kez sayılır.
        </p>
      </CardContent>
    </Card>
  );
}

export default InviteCard;
