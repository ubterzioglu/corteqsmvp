import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, KeyRound, Loader2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CLAIM_VERIFY_RESULT_MESSAGES,
  fetchMyPendingClaim,
  startClaimCode,
  submitClaimScreenshot,
  verifyClaimCode,
  type ClaimVerifyOutcome,
  type PendingClaimRow,
} from "@/lib/group-claims";
import { getErrorMessage } from "@/lib/whatsapp-landing-form";
import type { WhatsAppLanding } from "@/lib/whatsapp-landings";

interface GroupOwnershipClaimProps {
  landing: WhatsAppLanding;
  isSignedIn: boolean;
  /** Girişsiz kullanıcı butona basınca OAuth akışı (dönüş bu sayfaya). */
  onRequestSignIn: () => void;
  /** Doğrulama başarılı → sayfa landing'i tazeler (rozet "Sahibi doğruladı" olur). */
  onVerified: () => void;
}

/**
 * G20 · "Bu grup sizin mi?" — tasarım §3.B sahiplik akışının UI'ı.
 *
 * Yalnız `ownership !== 'verified'` gruplarda görünür. İki yol:
 *   1. KOD: CQ+4 hane → kullanıcı grup adının sonuna ekler → "Kontrol et"
 *      sunucuda okur (edge) → verified / not_found (denemeli) / expired /
 *      invalid_link / unknown (son ikisi deneme SAYMAZ).
 *   2. EKRAN GÖRÜNTÜSÜ (yedek): private kovaya kendi klasörüne yükler →
 *      moderatör kuyruğu (`claim_pending`).
 *
 * "Şikayet et" bu bileşende DEĞİL: G14'te ayrı `GroupReportButton` olarak
 * detay sayfasının `reportSlot` yuvasına, bu bölümün yanına eklendi.
 */
export function GroupOwnershipClaim({
  landing,
  isSignedIn,
  onRequestSignIn,
  onVerified,
}: GroupOwnershipClaimProps) {
  const [pending, setPending] = useState<PendingClaimRow | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<ClaimVerifyOutcome | null>(null);
  const [busy, setBusy] = useState<"" | "start" | "verify" | "upload">("");
  // İlk yükleme eylemleri BLOKLAMAZ — yalnız bilgilendirme satırı çizer
  // (yoksa girişli kullanıcı butona bastığında tıklama yutulur).
  const [loadingPending, setLoadingPending] = useState(false);
  const [screenshotOpen, setScreenshotOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [queueMessage, setQueueMessage] = useState<string | null>(null);

  const loadPending = useCallback(async () => {
    if (!isSignedIn || !landing.dbId || landing.ownership === "verified") return;
    setLoadingPending(true);
    try {
      setPending(await fetchMyPendingClaim(landing.dbId));
    } catch {
      // Sessiz düş: giriş ekranı talep yükleme hatasıyla bloklanmaz.
      setPending(null);
    } finally {
      setLoadingPending(false);
    }
  }, [isSignedIn, landing.dbId, landing.ownership]);

  useEffect(() => {
    void loadPending();
  }, [loadPending]);

  if (landing.ownership === "verified" || !landing.dbId) return null;

  const guardSignIn = (): boolean => {
    if (!isSignedIn) {
      onRequestSignIn();
      return false;
    }
    return true;
  };

  const handleStartCode = async () => {
    if (!guardSignIn()) return;
    setBusy("start");
    setErrorText(null);
    setOutcome(null);
    setQueueMessage(null);
    try {
      const started = await startClaimCode(landing.dbId as string);
      setPending({
        id: started.claim_id,
        method: "code",
        status: "pending",
        code: started.code,
        code_expires_at: started.expires_at,
        attempt_count: 0,
      });
      setMessage(
        started.reused
          ? "Aktif kodun zaten vardı — aynen kullanabilirsin."
          : "Kodun hazır. Grup adının sonuna ekle, sonra Kontrol et'e bas.",
      );
    } catch (error) {
      setErrorText(getErrorMessage(error));
      await loadPending();
    } finally {
      setBusy("");
    }
  };

  const handleVerify = async () => {
    if (!guardSignIn() || !pending) return;
    setBusy("verify");
    setErrorText(null);
    setMessage(null);
    try {
      const result = await verifyClaimCode(pending.id);
      setOutcome(result);
      if (result.result === "verified") {
        setPending(null);
        onVerified();
      } else if (result.result === "expired") {
        setPending(null);
      } else if (result.result === "not_found" && result.exhausted) {
        // Denemeler tükendi — yedek yol açık (tasarım §3.B adım 5).
        setPending(null);
        setScreenshotOpen(true);
      }
    } catch (error) {
      setErrorText(getErrorMessage(error));
    } finally {
      setBusy("");
    }
  };

  const handleSubmitScreenshot = async () => {
    if (!guardSignIn() || !file) return;
    setBusy("upload");
    setErrorText(null);
    try {
      await submitClaimScreenshot(landing.dbId as string, file, note);
      setScreenshotOpen(false);
      setFile(null);
      setNote("");
      setQueueMessage(
        "Talebin moderatör kuyruğuna düştü. Ekibimiz ekran görüntüsünü inceleyip karar verecek.",
      );
      await loadPending();
    } catch (error) {
      setErrorText(getErrorMessage(error));
    } finally {
      setBusy("");
    }
  };

  const codeClaim = pending?.method === "code" ? pending : null;
  const screenshotClaim = pending?.method === "screenshot" ? pending : null;

  return (
    <section
      aria-labelledby="ownership-claim-title"
      className="rounded-[1.75rem] border border-border bg-card p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:p-8"
    >
      <h2 id="ownership-claim-title" className="flex items-center gap-2 text-xl font-bold text-foreground">
        <BadgeCheck className="h-5 w-5 text-emerald-600" />
        Bu grup sizin mi?
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Grubun gerçek adminiysen sahipliğini doğrula: sayfa sana bağlanır, gönderiler önce senin
        onayına düşer ve kartta "Sahibi doğruladı" rozeti görünür.
      </p>

      {errorText ? (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-semibold text-red-700">
          {errorText}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="mt-4 text-left text-sm font-semibold text-emerald-700">{message}</p>
      ) : null}
      {queueMessage ? (
        <p role="status" className="mt-4 text-left text-sm font-semibold text-emerald-700">{queueMessage}</p>
      ) : null}
      {outcome && outcome.result !== "verified" ? (
        <p role="status" className="mt-4 text-left text-sm text-slate-700">
          {CLAIM_VERIFY_RESULT_MESSAGES[outcome.result]}
          {outcome.result === "not_found" && !outcome.exhausted && typeof outcome.attempts_left === "number"
            ? ` Kalan deneme: ${outcome.attempts_left}.`
            : ""}
          {outcome.exhausted ? " Denemeler tükendi — ekran görüntüsü yolu açık." : ""}
        </p>
      ) : null}
      {outcome?.result === "verified" ? (
        <p role="status" className="mt-4 text-left text-sm font-bold text-emerald-700">
          {CLAIM_VERIFY_RESULT_MESSAGES.verified}
        </p>
      ) : null}

      {loadingPending ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Taleplerin okunuyor...
        </p>
      ) : null}

      {screenshotClaim ? (
        <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-sm font-semibold text-emerald-800">
          Bu grup için bekleyen bir ekran görüntüsü talebin var — moderatör kuyruğunda.
        </p>
      ) : codeClaim ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-left">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Sahiplik kodun</p>
          <p className="mt-1 font-mono text-2xl font-black tracking-widest text-slate-900">{codeClaim.code}</p>
          <p className="mt-2 text-sm text-slate-700">
            Grup adının sonuna <code className="rounded bg-white px-1.5 py-0.5 font-mono">· {codeClaim.code}</code>{" "}
            ekle, sonra Kontrol et'e bas. Kodun süresi sınırlı; sistem grup adını sunucuda okur.
          </p>
          <Button
            className="mt-3 bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => void handleVerify()}
            disabled={busy !== ""}
          >
            {busy === "verify" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Kontrol et
          </Button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button
            className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => void handleStartCode()}
            disabled={busy !== ""}
          >
            {busy === "start" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            Kod ile doğrula
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              if (!guardSignIn()) return;
              setScreenshotOpen((open) => !open);
            }}
            disabled={busy !== ""}
          >
            <UploadCloud className="h-4 w-4" />
            Ekran görüntüsüyle kanıtla
          </Button>
        </div>
      )}

      {screenshotOpen && !screenshotClaim ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-4 text-left">
          <Label htmlFor="claim-screenshot">
            Grup admin panelinden ekran görüntüsü (PNG/JPG/WebP/PDF, en fazla 10 MB)
          </Label>
          <Input
            id="claim-screenshot"
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            className="mt-2"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <Label htmlFor="claim-note" className="mt-3 block">Not (isteğe bağlı)</Label>
          <Textarea
            id="claim-note"
            rows={2}
            className="mt-1"
            maxLength={500}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Moderatöre eklemek istediğin bir şey var mı?"
          />
          <Button
            className="mt-3 bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => void handleSubmitScreenshot()}
            disabled={busy !== "" || !file}
          >
            {busy === "upload" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Talebi gönder
          </Button>
          <p className="mt-2 text-xs text-slate-500">
            Talebin moderatör kuyruğuna düşer; grup bu arada yayında kalır. Grup zaten sahiplenilmişse
            otomatik devir YOKTUR — karar moderatörün.
          </p>
        </div>
      ) : null}
    </section>
  );
}
