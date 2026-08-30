import { ExternalLink, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  formatBytes,
  getCategoryLabel,
  getFormTypeLabel,
  getReferralSourceLabel,
  getStatusLabel,
  getSubmissionDocuments,
  submissionStatusOptions,
  type Submission,
  type SubmissionStatus,
  type UploadedDocument,
} from "@/lib/submissions";

type Props = {
  submission: Submission | null;
  open: boolean;
  statusPending: boolean;
  documentPendingName: string | null;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (status: SubmissionStatus) => void;
  onOpenDocument: (document: UploadedDocument) => void;
};

const DetailField = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="space-y-1 rounded-xl border bg-muted/20 p-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
    <div className="whitespace-pre-wrap break-words text-sm text-foreground">{value || "Belirtilmedi"}</div>
  </div>
);

export function SubmissionDetailDialog({
  submission,
  open,
  statusPending,
  documentPendingName,
  onOpenChange,
  onStatusChange,
  onOpenDocument,
}: Props) {
  if (!submission) return null;
  const documents = getSubmissionDocuments(submission);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{submission.fullname}</DialogTitle>
          <DialogDescription>
            {getFormTypeLabel(submission.form_type)} · {getCategoryLabel(submission.category)} ·{" "}
            {new Date(submission.created_at).toLocaleString("tr-TR")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailField label="E-posta" value={submission.email} />
          <DetailField label="Telefon" value={submission.phone} />
          <DetailField label="Konum" value={[submission.city, submission.country].filter(Boolean).join(", ")} />
          <DetailField label="Alan / İşletme" value={[submission.field, submission.business].filter(Boolean).join(" · ")} />
          <div className="sm:col-span-2">
            <DetailField label="Açıklama" value={submission.description} />
          </div>
          <div className="sm:col-span-2">
            <DetailField label="Teklifler / İhtiyaçlar" value={submission.offers_needs} />
          </div>
          <DetailField
            label="Referral"
            value={
              <span>
                {getReferralSourceLabel(submission.referral_source)}
                {submission.referral_detail ? ` · ${submission.referral_detail}` : ""}
                {submission.referral_code ? ` · ${submission.referral_code}` : ""}
              </span>
            }
          />
          <DetailField label="Onboarding anahtarı" value={submission.onboarding_key} />
        </div>

        <div className="space-y-2 rounded-xl border p-3">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="submission-status">Durum</Label>
            <Badge variant="outline">{getStatusLabel(submission.status)}</Badge>
          </div>
          <Select
            value={submission.status}
            onValueChange={(value) => onStatusChange(value as SubmissionStatus)}
            disabled={statusPending}
          >
            <SelectTrigger id="submission-status" aria-label="Başvuru durumu">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {submissionStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <h3 className="font-semibold">Ek dosyalar ({documents.length})</h3>
          </div>
          {documents.length === 0 ? (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Ek dosya yok.</p>
          ) : (
            <div className="grid gap-2">
              {documents.map((document, index) => (
                <Button
                  key={`${document.name}-${index}`}
                  variant="outline"
                  className="h-auto justify-between gap-3 py-3"
                  onClick={() => onOpenDocument(document)}
                  disabled={documentPendingName === document.name}
                >
                  <span className="min-w-0 truncate">{document.name}</span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                    {document.sizeBytes ? formatBytes(document.sizeBytes) : ""}
                    <ExternalLink className="h-4 w-4" />
                  </span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
