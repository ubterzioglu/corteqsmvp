// Revizyon İsteği oluştur/düzenle dialog formu.
// AdminRevisionRequestsPage tarafından hem "yeni" hem "düzenle" için kullanılır.

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  REVISION_PRIORITY_OPTIONS,
  REVISION_STATUSES,
  REVISION_STATUS_LABELS,
  type RevisionRequest,
  type RevisionRequestForm as RevisionRequestFormState,
  type RevisionStatus,
} from "@/lib/admin-shell/revision-requests";

const EMPTY_FORM: RevisionRequestFormState = {
  title: "",
  detail: "",
  status: "acik",
  priority: 5,
  areaLabel: "",
};

function toFormState(request: RevisionRequest): RevisionRequestFormState {
  return {
    title: request.title,
    detail: request.detail,
    status: request.status,
    priority: request.priority,
    areaLabel: request.areaLabel,
  };
}

export type RevisionRequestFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Düzenlenecek talep; verilmezse "yeni" modu. */
  request?: RevisionRequest | null;
  onSubmit: (form: RevisionRequestFormState) => void;
  isSubmitting?: boolean;
};

export function RevisionRequestForm({
  open,
  onOpenChange,
  request,
  onSubmit,
  isSubmitting = false,
}: RevisionRequestFormProps) {
  const [form, setForm] = useState<RevisionRequestFormState>(EMPTY_FORM);

  // Dialog her açıldığında formu seçili talebe (ya da boşa) senkronize et.
  useEffect(() => {
    if (open) {
      setForm(request ? toFormState(request) : EMPTY_FORM);
    }
  }, [open, request]);

  const handleSubmit = () => {
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{request ? "Revizyon İsteğini Düzenle" : "Yeni Revizyon İsteği"}</DialogTitle>
          <DialogDescription>
            Site veya ürün üzerinde yapılmasını istediğiniz değişikliği tanımlayın. Tüm adminler görür.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="revision-title">Başlık</Label>
            <Input
              id="revision-title"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Örn. Anasayfa hero görseli değişsin"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="revision-detail">Açıklama</Label>
            <Textarea
              id="revision-detail"
              value={form.detail}
              onChange={(event) => setForm((prev) => ({ ...prev, detail: event.target.value }))}
              placeholder="Detayları, gerekçeyi veya örnekleri yazın."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="revision-status">Durum</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, status: value as RevisionStatus }))
                }
              >
                <SelectTrigger id="revision-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REVISION_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {REVISION_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="revision-priority">Öncelik</Label>
              <Select
                value={String(form.priority)}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, priority: Number(value) }))
                }
              >
                <SelectTrigger id="revision-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REVISION_PRIORITY_OPTIONS.map((priority) => (
                    <SelectItem key={priority} value={String(priority)}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="revision-area">Alan (opsiyonel)</Label>
              <Input
                id="revision-area"
                value={form.areaLabel}
                onChange={(event) => setForm((prev) => ({ ...prev, areaLabel: event.target.value }))}
                placeholder="Örn. Cadde"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Vazgeç
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !form.title.trim()}>
            {request ? "Kaydet" : "Oluştur"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
