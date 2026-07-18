// Brainstorming bölümü oluştur/düzenle dialog formu.
// AdminBrainstormingPage tarafından hem "yeni" hem "düzenle" için kullanılır.
// Desen kaynağı: RevisionRequestForm.tsx.

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
import { Textarea } from "@/components/ui/textarea";
import type { BrainstormingSectionForm as SectionFormState } from "@/lib/brainstorming-schemas";
import type { BrainstormingSection } from "@/lib/brainstorming-api";

const EMPTY_FORM: SectionFormState = {
  groupLabel: "",
  title: "",
  intro: "",
};

function toFormState(section: BrainstormingSection): SectionFormState {
  return {
    groupLabel: section.groupLabel ?? "",
    title: section.title,
    intro: section.intro ?? "",
  };
}

export type SectionFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Düzenlenecek bölüm; verilmezse "yeni" modu. */
  section?: BrainstormingSection | null;
  onSubmit: (form: SectionFormState) => void;
  isSubmitting?: boolean;
};

export function SectionFormDialog({
  open,
  onOpenChange,
  section,
  onSubmit,
  isSubmitting = false,
}: SectionFormDialogProps) {
  const [form, setForm] = useState<SectionFormState>(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm(section ? toFormState(section) : EMPTY_FORM);
    }
  }, [open, section]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{section ? "Bölümü Düzenle" : "Yeni Bölüm"}</DialogTitle>
          <DialogDescription>
            Brainstorming raporunun bir bölümünü tanımlayın. Tüm adminler görür ve düzenler.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="section-group-label">Grup etiketi (opsiyonel)</Label>
            <Input
              id="section-group-label"
              value={form.groupLabel}
              onChange={(event) => setForm((prev) => ({ ...prev, groupLabel: event.target.value }))}
              placeholder="Örn. Bölüm 1 — Cadde 3.0"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="section-title">Başlık</Label>
            <Input
              id="section-title"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Örn. 1A. Cadde'nin arka plan eksikleri"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="section-intro">Giriş (opsiyonel)</Label>
            <Textarea
              id="section-intro"
              value={form.intro}
              onChange={(event) => setForm((prev) => ({ ...prev, intro: event.target.value }))}
              placeholder="Bölümün sade dille kısa açıklaması."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Vazgeç
          </Button>
          <Button onClick={() => onSubmit(form)} disabled={isSubmitting || !form.title.trim()}>
            {section ? "Kaydet" : "Oluştur"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
