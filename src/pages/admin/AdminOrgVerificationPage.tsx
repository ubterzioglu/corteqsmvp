// G07 · Kurumsal doğrulama — ADMIN inceleme ekranı.
// Kuyruk (bekleyen verification_level_2 talepleri) + belge önizleme (imzalı
// bağlantı) + Onayla/Reddet (sebep). Onayda catalog_items.verification_status
// 'verified' olur (migration 20261003130000, review_org_verification_v1).
//
// 🔴 Rozet/filtre yayılımı BU EKRANDA YOK — yalnız inceleme kuyruğu + karar.
// 🔴 Belge önizleme YALNIZ imzalı bağlantı (openOrgVerificationDocumentUrl);
// PRIVATE kova, getPublicUrl yok.
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, FileText, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchOrgVerificationQueue,
  openOrgVerificationDocumentUrl,
  reviewOrgVerification,
} from "@/lib/admin/org-verification-review-api";
import type { OrgVerificationQueueRow } from "@/lib/admin/org-verification-review-api";

const QUERY_KEY = ["admin", "org-verification-queue"] as const;

function VerificationClaimCard({ row }: { row: OrgVerificationQueueRow }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [openingDoc, setOpeningDoc] = useState<string | null>(null);

  const reviewMutation = useMutation({
    mutationFn: (approve: boolean) => reviewOrgVerification(row.claim_id, approve, reason),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: unknown) => {
      setActionError(error instanceof Error ? error.message : "İnceleme işlemi yapılamadı.");
    },
  });

  const openDocument = async (path: string) => {
    setOpeningDoc(path);
    setActionError(null);
    try {
      const url = await openOrgVerificationDocumentUrl(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Belge için imzalı bağlantı üretilemedi.",
      );
    } finally {
      setOpeningDoc(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <CardTitle className="text-base">{row.item_title}</CardTitle>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
          {row.status === "pending" ? "Bekliyor" : row.status}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Talep eden:</span> {row.requester_name}
          {row.note ? (
            <p className="mt-1 rounded-lg bg-muted/50 px-3 py-2 text-foreground">“{row.note}”</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Belgeler ({row.doc_paths.length})</p>
          {row.doc_paths.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bu talepte belge yolu yok.</p>
          ) : (
            <ul className="space-y-1.5">
              {row.doc_paths.map((path) => (
                <li key={path}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-[44px] w-full justify-start sm:min-h-9"
                    disabled={openingDoc === path}
                    onClick={() => openDocument(path)}
                  >
                    <FileText className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    <span className="truncate">{path.split("/").pop()}</span>
                    <ExternalLink className="ml-1.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {row.status === "pending" ? (
          <div className="space-y-3 border-t pt-3">
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ret sebebi (rette ZORUNLU, onayda isteğe bağlı) — talep sahibi görür."
              rows={2}
              maxLength={500}
            />
            {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="min-h-[44px] rounded-full sm:min-h-9"
                disabled={reviewMutation.isPending}
                onClick={() => reviewMutation.mutate(true)}
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Onayla (doğrulanmış yap)
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-[44px] rounded-full border-destructive/40 text-destructive sm:min-h-9"
                disabled={reviewMutation.isPending || reason.trim().length === 0}
                onClick={() => reviewMutation.mutate(false)}
              >
                <XCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Reddet
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-t pt-3 text-sm text-muted-foreground">
            {row.status === "approved" ? "Onaylandı" : "Reddedildi"}
            {row.review_reason ? ` · sebep: “${row.review_reason}”` : ""}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminOrgVerificationPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fetchOrgVerificationQueue("pending"),
  });

  const rows = data ?? [];

  return (
    <div className="space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Kurumsal Doğrulama İncelemesi</h1>
        <p className="text-sm text-muted-foreground">
          Bekleyen Seviye 2 doğrulama talepleri. Belgeyi imzalı bağlantıyla önizle, sonra onayla
          (kaydı <code>verified</code> yapar) ya da sebeple reddet. Rozet/filtre yayılımı bu
          ekranda yok — yalnız inceleme ve karar.
        </p>
      </header>

      {isError ? (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Kuyruk okunamadı: {error instanceof Error ? error.message : "yönetici yetkisi gerekiyor olabilir"}.
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Kuyruk yükleniyor…</p>
      ) : !isError && rows.length === 0 ? (
        <p className="rounded-2xl border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          Bekleyen kurumsal doğrulama talebi yok.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((row) => (
          <VerificationClaimCard key={row.claim_id} row={row} />
        ))}
      </div>
    </div>
  );
}
