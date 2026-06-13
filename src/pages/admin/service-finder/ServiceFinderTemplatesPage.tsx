// /admin/service-finder/templates — meslek/sorgu şablonu düzenleyici.
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useServiceFinderTemplates,
  useUpsertServiceFinderTemplate,
} from "@/hooks/useServiceFinder";
import type { ServiceFinderTemplateRow } from "@/lib/service-finder-schemas";

interface TemplateFormState {
  template_key: string;
  label: string;
  role_key: string;
  item_type: string;
  category_slug: string;
  language_terms: string;
  must_exclude_terms: string;
  query_templates: string;
  is_active: boolean;
}

const EMPTY_FORM: TemplateFormState = {
  template_key: "",
  label: "",
  role_key: "",
  item_type: "advisor",
  category_slug: "",
  language_terms: "Türk, Türkçe, Turkish speaking, Türkisch",
  must_exclude_terms: "forum, reddit, job",
  query_templates: '["Türkçe konuşan {{profession}} {{city}}"]',
  is_active: true,
};

function toForm(template: ServiceFinderTemplateRow): TemplateFormState {
  return {
    template_key: template.template_key,
    label: template.label,
    role_key: template.role_key,
    item_type: template.item_type,
    category_slug: template.category_slug ?? "",
    language_terms: (template.language_terms ?? []).join(", "),
    must_exclude_terms: (template.must_exclude_terms ?? []).join(", "),
    query_templates: JSON.stringify(template.query_templates ?? [], null, 2),
    is_active: template.is_active,
  };
}

function splitTerms(value: string): string[] {
  return value
    .split(",")
    .map((term) => term.trim())
    .filter(Boolean);
}

function TemplateEditorDialog({
  template,
  trigger,
}: {
  template: ServiceFinderTemplateRow | null;
  trigger: React.ReactNode;
}) {
  const upsert = useUpsertServiceFinderTemplate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TemplateFormState>(template ? toForm(template) : EMPTY_FORM);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const update = (patch: Partial<TemplateFormState>) => setForm((current) => ({ ...current, ...patch }));

  const save = () => {
    let queryTemplates: unknown;
    try {
      queryTemplates = JSON.parse(form.query_templates || "[]");
      setJsonError(null);
    } catch {
      setJsonError("Sorgu şablonları geçerli JSON dizisi olmalı");
      return;
    }
    upsert.mutate(
      {
        templateId: template?.id ?? null,
        patch: {
          template_key: form.template_key,
          label: form.label,
          role_key: form.role_key,
          item_type: form.item_type,
          category_slug: form.category_slug || null,
          language_terms: splitTerms(form.language_terms),
          must_exclude_terms: splitTerms(form.must_exclude_terms),
          query_templates: queryTemplates as string[],
          is_active: form.is_active,
        },
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{template ? `Şablonu düzenle: ${template.label}` : "Yeni şablon"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Şablon anahtarı</Label>
              <Input
                value={form.template_key}
                onChange={(event) => update({ template_key: event.target.value })}
                disabled={Boolean(template)}
                placeholder="healthcare-doctor"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Etiket</Label>
              <Input value={form.label} onChange={(event) => update({ label: event.target.value })} placeholder="Doktor" />
            </div>
            <div className="grid gap-1.5">
              <Label>Rol anahtarı</Label>
              <Input value={form.role_key} onChange={(event) => update({ role_key: event.target.value })} placeholder="Healthcare_Doctor" />
            </div>
            <div className="grid gap-1.5">
              <Label>Kayıt tipi</Label>
              <Input value={form.item_type} onChange={(event) => update({ item_type: event.target.value })} placeholder="advisor" />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label>Kategori slug</Label>
              <Input
                value={form.category_slug}
                onChange={(event) => update({ category_slug: event.target.value })}
                placeholder="advisor-healthcare-doctor"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Dil terimleri (virgülle)</Label>
            <Input value={form.language_terms} onChange={(event) => update({ language_terms: event.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>Hariç terimler (virgülle)</Label>
            <Input value={form.must_exclude_terms} onChange={(event) => update({ must_exclude_terms: event.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>Sorgu şablonları (JSON dizi — {"{{city}}"}, {"{{profession}}"}, {"{{language_term}}"})</Label>
            <Textarea
              value={form.query_templates}
              onChange={(event) => update({ query_templates: event.target.value })}
              rows={5}
              className="font-mono text-xs"
            />
            {jsonError && <p className="text-xs text-red-600">{jsonError}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={(checked) => update({ is_active: checked })} />
            <Label className="text-sm">Aktif</Label>
          </div>
          <Button onClick={save} disabled={upsert.isPending}>
            {upsert.isPending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ServiceFinderTemplatesPage() {
  const { data: templates, isLoading } = useServiceFinderTemplates();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meslek Şablonları</h1>
          <p className="text-sm text-muted-foreground">
            Sorgu üretimi için rol + dil terimi + sorgu kalıbı tanımları.
          </p>
        </div>
        <TemplateEditorDialog template={null} trigger={<Button size="sm">Yeni Şablon</Button>} />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Yükleniyor...</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        {(templates ?? []).map((template) => (
          <Card key={template.id} className={!template.is_active ? "opacity-60" : undefined}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">
                {template.label}
                {!template.is_active && <span className="ml-2 text-xs text-muted-foreground">(pasif)</span>}
              </CardTitle>
              <TemplateEditorDialog
                template={template}
                trigger={
                  <Button variant="outline" size="sm">
                    Düzenle
                  </Button>
                }
              />
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Rol:</span> {template.role_key} ({template.item_type})
              </p>
              <p>
                <span className="font-medium text-foreground">Kategori:</span> {template.category_slug ?? "—"}
              </p>
              <p className="truncate">
                <span className="font-medium text-foreground">Dil terimleri:</span>{" "}
                {(template.language_terms ?? []).join(", ")}
              </p>
              <p>
                <span className="font-medium text-foreground">Sorgu kalıbı:</span>{" "}
                {Array.isArray(template.query_templates) ? template.query_templates.length : 0} adet
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
