import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { approveCatalogClaim, listCatalogClaims, rejectCatalogClaim } from "@/lib/admin-catalog";
import type { CatalogClaim } from "@/lib/catalog-types";

type CatalogClaimRequestsPanelProps = {
  itemId: string;
};

const CatalogClaimRequestsPanel = ({ itemId }: CatalogClaimRequestsPanelProps) => {
  const [claims, setClaims] = useState<CatalogClaim[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingClaimId, setPendingClaimId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadClaims = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      setClaims(await listCatalogClaims(itemId));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Claim talepleri alınamadı.");
    } finally {
      setIsLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    void loadClaims();
  }, [loadClaims]);

  const handleApprove = async (claimId: string) => {
    setPendingClaimId(claimId);
    setErrorMessage(null);

    try {
      await approveCatalogClaim(claimId);
      await loadClaims();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Claim onaylanamadı.");
    } finally {
      setPendingClaimId(null);
    }
  };

  const handleReject = async (claimId: string) => {
    setPendingClaimId(claimId);
    setErrorMessage(null);

    try {
      await rejectCatalogClaim(claimId);
      await loadClaims();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Claim reddedilemedi.");
    } finally {
      setPendingClaimId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Claim Talepleri</CardTitle>
        <CardDescription>
          Onay verildiğinde kullanıcıya bu kayıt üzerinde `editor` üyeliği verilir. Platform rolü değişmez.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
        {isLoading ? <p className="text-sm text-muted-foreground">Claim talepleri yükleniyor...</p> : null}

        <div className="space-y-3">
          {claims.map((claim) => {
            const isPending = claim.status === "pending";
            const isSaving = pendingClaimId === claim.id;

            return (
              <div key={claim.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-slate-950">{claim.requesterFullName}</div>
                      <Badge variant={isPending ? "secondary" : "outline"}>{claim.status}</Badge>
                      <Badge variant="outline">{claim.claimType}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{claim.requesterEmail ?? claim.requestedByUserId}</div>
                    {claim.note ? <p className="text-sm text-slate-700">{claim.note}</p> : null}
                    <div className="text-xs text-muted-foreground">
                      Talep: {formatDateTime(claim.createdAt)}
                      {claim.reviewedAt ? ` • İnceleme: ${formatDateTime(claim.reviewedAt)}` : ""}
                      {claim.reviewerFullName ? ` • İnceleyen: ${claim.reviewerFullName}` : ""}
                    </div>
                  </div>

                  {isPending ? (
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" onClick={() => handleApprove(claim.id)} disabled={isSaving}>
                        {isSaving ? "İşleniyor..." : "Approve"}
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => handleReject(claim.id)} disabled={isSaving}>
                        Reject
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}

          {!isLoading && claims.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bu kayıt için claim talebi bulunmuyor.</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

const formatDateTime = (value: string | null) => {
  if (!value) return "-";

  return new Date(value).toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  });
};

export default CatalogClaimRequestsPanel;
