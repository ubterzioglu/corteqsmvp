import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { CatalogAttributeDraftValue } from "@/lib/catalog-attribute-draft";
import type { CatalogEntityProfileAttribute } from "@/lib/catalog-entity-api";

export type AttributeVisibilityDraft = "public" | "private" | "admin_only";

interface InlineAttributeFieldProps {
  attribute: CatalogEntityProfileAttribute;
  value: CatalogAttributeDraftValue;
  visibility: AttributeVisibilityDraft;
  isSaving: boolean;
  onValueChange: (value: CatalogAttributeDraftValue) => void;
  onVisibilityChange: (visibility: AttributeVisibilityDraft) => void;
  onSave: () => void;
}

/** Single editable AFS attribute row inside the public profile edit mode. */
const InlineAttributeField = ({
  attribute,
  value,
  visibility,
  isSaving,
  onValueChange,
  onVisibilityChange,
  onSave,
}: InlineAttributeFieldProps) => (
  <div className="rounded-2xl border border-border bg-background/70 p-4">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm font-semibold text-foreground">{attribute.label}</p>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{visibility === "public" ? "Görünür" : "Gizli"}</span>
        <Switch
          checked={visibility === "public"}
          disabled={!attribute.editor_can_hide || isSaving}
          onCheckedChange={(checked) => onVisibilityChange(checked ? "public" : "private")}
          aria-label={`${attribute.label} görünürlüğü`}
        />
      </label>
    </div>

    {attribute.data_type === "textarea" || attribute.data_type === "json" ? (
      <Textarea
        rows={attribute.data_type === "json" ? 5 : 3}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onValueChange(event.target.value)}
        disabled={isSaving}
      />
    ) : attribute.data_type === "boolean" ? (
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2">
        <span className="text-sm text-foreground">{attribute.label}</span>
        <Switch
          checked={value === true}
          onCheckedChange={(checked) => onValueChange(checked)}
          disabled={isSaving}
        />
      </div>
    ) : (
      <Input
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onValueChange(event.target.value)}
        disabled={isSaving}
      />
    )}

    <div className="mt-3 flex justify-end">
      <Button type="button" size="sm" onClick={onSave} disabled={isSaving}>
        {isSaving ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </div>
  </div>
);

export default InlineAttributeField;
