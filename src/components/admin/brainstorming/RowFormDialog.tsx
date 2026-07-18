// Brainstorming satırı oluştur/düzenle dialog formu.
// Bir bölümün içindeki tek bir konu satırını (label/technical/plain/status) düzenler.

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
  BRAINSTORMING_STATUSES,
  type BrainstormingRowForm as RowFormState,
  type BrainstormingStatus,
} from "@/lib/brainstorming-schemas";
import type { BrainstormingRow } from "@/lib/brainstorming-api";

const STATUS_LABELS: Record<BrainstormingStatus, string> = {
  ok: "🟢 Tamam",
  partial: "🟡 Kısmen",
  open: "🔴 Açık",
};

const EMPTY_FORM: RowFormState = {
  label: "",
  technical: "",
  plain: "",
  status: null,
};

function toFormState(row: BrainstormingRow): RowFormState {
  return {
    label: row.label,
    technical: row.technical,
    plain: row.plain,
    status: row.status,
  };
}

export type RowFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Düzenlenecek satır; verilmezse "yeni" modu. */
  row?: BrainstormingRow | null;
  onSubmit: (form: RowFormState) => void;
  isSubmitting?: boolean;
};

export function RowFormDialog({
  open,
  onOpenChange,
  row,
  onSubmit,
  isSubmitting = false,
}: RowFormDialogProps) {
  const [form, setForm] = useState<RowFormState>(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm(row ? toFormState(row) : EMPTY_FORM);
    }
  }, [open, row]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{row ? "Satırı Düzenle" : "Yeni Satır"}</DialogTitle>
          <DialogDescription>
            Solda teknik, sağda sade açıklama olacak şekilde bir konu satırı tanımlayın.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_160px]">
            <div className="space-y-1.5">
              <Label htmlFor="row-label">Konu başlığı</Label>
              <Input
                id="row-label"
                value={form.label}
                onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
                placeholder="Örn. Telefon doğrulama / SMS"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="row-status">Durum</Label>
              <Select
                value={form.status ?? "none"}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    status: value === "none" ? null : (value as BrainstormingStatus),
                  }))
                }
              >
                <SelectTrigger id="row-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Rozet yok</SelectItem>
                  {BRAINSTORMING_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="row-technical">Teknik açıklama</Label>
              <Textarea
                id="row-technical"
                value={form.technical}
                onChange={(event) => setForm((prev) => ({ ...prev, technical: event.target.value }))}
                placeholder="Detaylı, teknik dil."
                rows={5}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="row-plain">Sade açıklama</Label>
              <Textarea
                id="row-plain"
                value={form.plain}
                onChange={(event) => setForm((prev) => ({ ...prev, plain: event.target.value }))}
                placeholder="Burak için sade Türkçe karşılığı."
                rows={5}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Vazgeç
          </Button>
          <Button
            onClick={() => onSubmit(form)}
            disabled={
              isSubmitting || !form.label.trim() || !form.technical.trim() || !form.plain.trim()
            }
          >
            {row ? "Kaydet" : "Oluştur"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
