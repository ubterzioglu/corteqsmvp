import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requestRelocationToolReport } from "@/lib/relocation-tools-api";
import { reportErrorMessage } from "@/lib/relocation-tool-report-errors";
import type { RelocationToolResultPayload } from "@/lib/relocation-tools-types";

type Props = { result: RelocationToolResultPayload };

export function ReportDeliveryCard({ result }: Props) {
  const [isSending, setIsSending] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const location = result.location_snapshot;

  const requestReport = async () => {
    setIsSending(true);
    setError(null);
    try {
      const response = await requestRelocationToolReport(result.result_id);
      setDeliveryStatus(response.status);
    } catch (requestError: unknown) {
      setError(reportErrorMessage(requestError));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4" aria-hidden="true" />
          Raporu e-postama gönder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {location ? (
          <>
            <p className="text-muted-foreground">
              Rapor konumu: <span className="font-medium text-foreground">{location.city}, {location.country}</span>
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isSending || deliveryStatus === "pending" || deliveryStatus === "sent"}
              onClick={() => void requestReport()}
            >
              {isSending
                ? "Kuyruğa alınıyor…"
                : deliveryStatus === "sent"
                  ? "Rapor gönderildi"
                  : deliveryStatus === "pending"
                    ? "Rapor gönderim kuyruğunda"
                    : "Raporu gönder"}
            </Button>
          </>
        ) : (
          <p className="text-muted-foreground">
            Rapor göndermek için profilinde ülke ve şehir bilgisi bulunmalı. Konumu tamamladıktan
            sonra bu aracı yeniden çöz. <Link className="font-medium text-primary underline" to="/profile">Profili aç</Link>
          </p>
        )}
        {error && <p role="alert" className="text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
