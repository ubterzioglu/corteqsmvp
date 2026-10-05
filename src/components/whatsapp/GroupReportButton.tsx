import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Flag, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useGroupReportState, useSubmitGroupReport } from "@/hooks/useGroupReports";
import {
  GROUP_REPORT_NOTE_MAX,
  GROUP_REPORT_REASONS,
  type GroupReportReason,
} from "@/lib/group-reports-api";
import type { WhatsAppLanding } from "@/lib/whatsapp-landings";

interface GroupReportButtonProps {
  landing: WhatsAppLanding;
  isSignedIn: boolean;
  /** Girişsiz kullanıcı → OAuth akışı (dönüş aynı grup sayfasına). */
  onRequestSignIn: () => void;
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

/**
 * G14 · "Şikayet et" (tasarım §3.E, politika §4/§8).
 *
 * Kurallar SUNUCUDA zorlanır (`submit_group_report_v1`); bu bileşen yalnız
 * kullanıcıya DÜRÜST durum gösterir (`group_report_state_v1`):
 *   • girişsiz → "Giriş yap ve şikayet et" (OAuth, aynı sayfaya dönüş)
 *   • kendi grubu / yayında olmayan grup → bölüm HİÇ çizilmez
 *   • telefon doğrulanmamış → "Şikayet için telefon doğrulaması gerekir" + profil
 *     (⚠️ SMS sağlayıcısı U06'ya dek kapalı: bugün hiçbir üye doğrulayamaz — gizlenmez)
 *   • hesap çok yeni · bekleme süresi → sebep yazılır, form açılmaz
 */
export function GroupReportButton({ landing, isSignedIn, onRequestSignIn }: GroupReportButtonProps) {
  const stateQuery = useGroupReportState(landing.dbId, isSignedIn);
  const submit = useSubmitGroupReport(landing.dbId);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<GroupReportReason | "">("");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  if (!landing.dbId) return null;

  const wrap = (children: ReactNode) => (
    <section
      aria-label="Grubu şikayet et"
      className="rounded-[1.75rem] border border-border bg-card p-5 text-sm md:p-6"
    >
      {children}
    </section>
  );

  if (!isSignedIn) {
    return wrap(
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground">Bu grupta kurallara aykırı bir durum mu var?</p>
        <Button variant="outline" size="sm" className="gap-2" onClick={onRequestSignIn}>
          <Flag className="h-4 w-4" aria-hidden="true" />
          Giriş yap ve şikayet et
        </Button>
      </div>,
    );
  }

  if (stateQuery.isLoading) {
    return wrap(
      <p className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Şikayet durumu okunuyor...
      </p>,
    );
  }

  if (stateQuery.isError) {
    return wrap(
      <p role="alert" className="text-red-700">
        {stateQuery.error instanceof Error ? stateQuery.error.message : "Şikayet durumu okunamadı."}
      </p>,
    );
  }

  const state = stateQuery.data;
  // Kendi grubunda ve yayında olmayan grupta düğme çizilmez.
  if (!state || state.own_group || !state.published) return null;

  if (sent && !state.cooldown_until) {
    // Gönderim başarılı, durum tazeleniyor.
    return wrap(<p role="status">Şikayetin alındı. Moderatör ekibi inceleyecek.</p>);
  }

  if (state.cooldown_until) {
    return wrap(
      <p role="status" className="text-muted-foreground">
        {sent ? "Şikayetin alındı. Moderatör ekibi inceleyecek. " : "Bu gruba şikayetin alınmıştı. "}
        Aynı gruba yeni şikayet {formatDate(state.cooldown_until)} tarihinden sonra gönderilebilir.
      </p>,
    );
  }

  if (state.phone_required) {
    return wrap(
      <div className="space-y-2">
        <p className="font-semibold text-foreground">Şikayet için telefon doğrulaması gerekir.</p>
        <p className="text-muted-foreground">
          Sahte hesaplarla grupların haksız yere gizlenmesini önlemek için yalnız telefonu doğrulanmış
          üyeler şikayet edebilir. Telefon doğrulaması henüz tüm üyelere açılmadı; açıldığında profil
          sayfandan yapabileceksin.
        </p>
        <Link to="/profile" className="font-semibold text-emerald-700 underline-offset-2 hover:underline">
          Profiline git
        </Link>
      </div>,
    );
  }

  if (state.account_too_new) {
    return wrap(
      <p role="status" className="text-muted-foreground">
        Hesabın çok yeni; şikayet hakkı hesap belirli bir süre kullanıldıktan sonra açılır.
      </p>,
    );
  }

  if (!open) {
    return wrap(
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground">Bu grupta kurallara aykırı bir durum mu var?</p>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
          <Flag className="h-4 w-4" aria-hidden="true" />
          Şikayet et
        </Button>
      </div>,
    );
  }

  const needsNote = reason === "diger";
  const trimmedNote = note.trim();
  const canSubmit = reason !== "" && (!needsNote || trimmedNote.length > 0) && !submit.isPending;

  const handleSubmit = () => {
    if (!canSubmit || !reason) return;
    submit.mutate(
      { landingId: landing.dbId as string, reason, note: trimmedNote || undefined },
      { onSuccess: () => setSent(true) },
    );
  };

  return wrap(
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-foreground">Grubu şikayet et</h2>
        <p className="mt-1 text-muted-foreground">
          Sebebi seç. Kimliğin grup sahibine gösterilmez; şikayeti yalnız moderatör ekibi görür.
        </p>
      </div>
      <RadioGroup
        value={reason}
        onValueChange={(value) => setReason(value as GroupReportReason)}
        aria-label="Şikayet sebebi"
        className="space-y-2"
      >
        {GROUP_REPORT_REASONS.map((item) => (
          <div key={item.key} className="flex items-start gap-2">
            <RadioGroupItem value={item.key} id={`group-report-${item.key}`} className="mt-0.5" />
            <Label htmlFor={`group-report-${item.key}`} className="font-normal leading-snug">
              {item.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
      <div>
        <Label htmlFor="group-report-note">
          Açıklama {needsNote ? "(zorunlu)" : "(isteğe bağlı)"}
        </Label>
        <Textarea
          id="group-report-note"
          rows={3}
          className="mt-1"
          maxLength={GROUP_REPORT_NOTE_MAX}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {note.length} / {GROUP_REPORT_NOTE_MAX}
        </p>
      </div>
      {submit.isError ? (
        <p role="alert" className="text-red-700">
          {submit.error instanceof Error ? submit.error.message : "Şikayet gönderilemedi."}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button className="gap-2 bg-red-600 text-white hover:bg-red-700" disabled={!canSubmit} onClick={handleSubmit}>
          {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Şikayeti gönder
        </Button>
        <Button variant="outline" disabled={submit.isPending} onClick={() => setOpen(false)}>
          Vazgeç
        </Button>
      </div>
    </div>,
  );
}
