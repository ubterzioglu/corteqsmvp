// G06b · Kurumsal doğrulama (Seviye 2) talep kartı — kuruluş kaydının sahibi/
// yöneticisi için belge yükleme + talep; bağı OLMAYAN kullanıcıya "önce kaydı
// sahiplen" yolu.
//
// 🔴 İKİ ADIMLI AKIŞ (G06a ölçümü: 262 kurumsal kaydın 249'unda kişi bağı YOK):
// Sahiplenmemiş kaydı doğrulatmak, o kurumu temsil etmekle aynı şey değildir.
// Bu yüzden bağı olmayan kullanıcıya belge formu GÖSTERİLMEZ — önce mevcut
// sahiplenme akışına (`editor_access`) yönlendirilir. Bağ sahibi (isOwner) ise
// belge yükleyip `request_org_verification_v1` çağırır.
//
// ⚠️ Veri katmanı `org-verification-api.ts` (careers deseni): dosya doğrulama,
// depolama anahtarı, MIME, hata haritası orada. Bu bileşen yalnız akışı çizer.
import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { BadgeCheck, PenLine, ShieldCheck, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitCatalogClaim } from "@/hooks/useSubmitCatalogClaim";
import {
  ORG_VERIFICATION_ACCEPT,
  ORG_VERIFICATION_MAX_DOCUMENTS,
  isOrgVerificationNotLinkedError,
  orgVerificationErrorMessage,
  requestOrgVerification,
  validateOrgVerificationFile,
} from "@/lib/org-verification-api";

interface OrgVerificationRequestCardProps {
  itemId: string;
  slug: string;
  /** Kayıt zaten doğrulanmış (verification_status='verified'). */
  isVerified: boolean;
  /** Kullanıcı kayda bağlı (sahip/yönetici) — belge formu yalnız bunlara görünür. */
  isOwner: boolean;
  /** Sahiplenme yolu açık mı (bağsız kullanıcı için claim CTA). */
  canClaim: boolean;
}

const MB = (bytes: number) => Math.round(bytes / (1024 * 1024));

export default function OrgVerificationRequestCard({
  itemId,
  slug,
  isVerified,
  isOwner,
  canClaim,
}: OrgVerificationRequestCardProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  // Sahip statüsü bayat olabilir (RPC not_linked dönerse) → claim yoluna düş.
  const [fellToClaim, setFellToClaim] = useState(false);

  const claimMutation = useSubmitCatalogClaim();
  const requestMutation = useMutation({
    mutationFn: () => requestOrgVerification(itemId, files, note),
  });

  // Sahip statüsü bayat olabilir: RPC `not_linked` derse claim yoluna düş.
  // 🔴 Render sırasında setState YAPILMAZ (React anti-pattern) — effect ile.
  const requestError = requestMutation.error;
  useEffect(() => {
    if (requestError && isOrgVerificationNotLinkedError(requestError)) setFellToClaim(true);
  }, [requestError]);

  const validationError = useMemo(() => {
    if (files.length === 0) return null; // submit'ta "belge gerekli" mesajı verilir
    if (files.length > ORG_VERIFICATION_MAX_DOCUMENTS) {
      return `En fazla ${ORG_VERIFICATION_MAX_DOCUMENTS} belge yükleyebilirsin (${files.length} seçildi).`;
    }
    for (const file of files) {
      const error = validateOrgVerificationFile(file);
      if (error) return `${file.name}: ${error}`;
    }
    return null;
  }, [files]);

  // Zaten doğrulanmış → yalnız bilgi, form yok.
  if (isVerified) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <BadgeCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <CardTitle className="text-base">Bu kayıt doğrulanmış</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Bu kuruluş kaydı yönetici onayından geçmiş. Yeni bir doğrulama talebi gerekmiyor.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Bağı OLMAYAN kullanıcı → "önce kaydı sahiplen" yolu (belge formu YOK).
  if (!isOwner || fellToClaim) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            Kurumsal doğrulama (Seviye 2)
          </CardTitle>
          <CardDescription>
            Bu kuruluşu doğrulatmak için önce kaydı temsil yetkisi almalısın. Sahiplenme talebi
            yönetici onayından geçer; onaydan sonra tüzük/yetki belgenle doğrulama başvurusu
            açabilirsin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {canClaim ? (
            <Button
              type="button"
              className="min-h-[44px] rounded-full sm:min-h-9"
              disabled={claimMutation.isPending || claimMutation.isSuccess}
              onClick={() => claimMutation.mutate({ itemId, slug })}
            >
              <PenLine className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              {claimMutation.isSuccess
                ? "Sahiplenme Talebi Gönderildi"
                : claimMutation.isPending
                  ? "Gönderiliyor..."
                  : "Önce Kaydı Sahiplen"}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Bu kayıt için sahiplenme talebi şu anda kapalı. Yöneticiyle iletişime geç.
            </p>
          )}
          {claimMutation.isSuccess ? (
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Sahiplenme talebin admin onayına gönderildi. Onaylanınca bu kartta belge
              yükleyebileceksin.
            </p>
          ) : null}
          {claimMutation.isError ? (
            <p className="text-sm text-destructive">
              Sahiplenme talebi gönderilemedi:{" "}
              {claimMutation.error instanceof Error ? claimMutation.error.message : "Beklenmeyen hata"}
            </p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  // Bağ sahibi (isOwner) → belge yükleme + talep formu.
  const onSubmit = () => {
    setFormError(null);
    if (files.length === 0) {
      setFormError("En az bir belge yüklemelisin (tüzük veya yetki belgesi).");
      return;
    }
    if (validationError) {
      setFormError(validationError);
      return;
    }
    requestMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          Kurumsal doğrulama başvurusu
        </CardTitle>
        <CardDescription>
          Bu kuruluşu temsil ettiğini gösteren belgeyi yükle (tüzük, yetki belgesi veya faaliyet
          belgesi). Talep yönetici kuyruğuna düşer; onaylayan kişi ve zaman kayda işlenir.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="org-verification-docs">
            Belgeler (en fazla {ORG_VERIFICATION_MAX_DOCUMENTS} dosya · PDF, JPG, PNG, WebP ·
            dosya başına en çok 15 MB)
          </Label>
          <input
            id="org-verification-docs"
            type="file"
            multiple
            accept={ORG_VERIFICATION_ACCEPT}
            className="block w-full cursor-pointer rounded-lg border border-input bg-background px-3 py-2 text-sm"
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          />
          {files.length > 0 ? (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {files.map((file) => (
                <li key={file.name} className="flex items-center gap-1.5">
                  <UploadCloud className="h-3.5 w-3.5" aria-hidden="true" />
                  {file.name} · {MB(file.size)} MB
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="org-verification-note">Not (isteğe bağlı)</Label>
          <Textarea
            id="org-verification-note"
            value={note}
            maxLength={500}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Kurulduğunuz yıl, faaliyet alanı gibi kısa bir açıklama ekleyebilirsin."
            rows={3}
          />
        </div>

        {validationError ? (
          <p className="text-sm text-destructive">{validationError}</p>
        ) : null}
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

        {requestMutation.isSuccess ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400">
            Doğrulama talebin yönetici onayına gönderildi. Sonucu bu sayfada göreceksin.
          </p>
        ) : null}

        {requestError && !isOrgVerificationNotLinkedError(requestError) ? (
          <p className="text-sm text-destructive">
            Talep gönderilemedi: {orgVerificationErrorMessage(requestError)}
          </p>
        ) : null}

        <Button
          type="button"
          className="min-h-[44px] rounded-full sm:min-h-9"
          disabled={requestMutation.isPending || requestMutation.isSuccess || Boolean(validationError)}
          onClick={onSubmit}
        >
          <ShieldCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          {requestMutation.isSuccess
            ? "Talep Gönderildi"
            : requestMutation.isPending
              ? "Gönderiliyor..."
              : "Doğrulama Talebini Gönder"}
        </Button>
      </CardContent>
    </Card>
  );
}
