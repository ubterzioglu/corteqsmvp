import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { setAttributeRuleAsAdmin, upsertEntityMetadataAsAdmin, type RoleManagementAttribute } from "@/lib/admin";

type Props = {
  roleKey: string;
  roleLabel: string;
  attributes: RoleManagementAttribute[];
  onAttributesChange: (next: RoleManagementAttribute[]) => void;
};

const AttributeRulesPanel = ({ roleKey, roleLabel, attributes, onAttributesChange }: Props) => {
  const { toast } = useToast();
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [editingDesc, setEditingDesc] = useState<string | null>(null);
  const [descDraft, setDescDraft] = useState("");

  const updateRule = async (attr: RoleManagementAttribute, patch: Partial<RoleManagementAttribute["rule"]>) => {
    const nextRule = { ...attr.rule, ...patch };
    onAttributesChange(
      attributes.map((a) => (a.key === attr.key ? { ...a, rule: nextRule } : a)),
    );
    setSavingKey(attr.key);
    try {
      await setAttributeRuleAsAdmin(roleKey, attr.key, {
        is_enabled:                         nextRule.is_enabled,
        is_required:                        nextRule.is_required,
        is_public_default:                  nextRule.is_public_default,
        user_can_edit:                      nextRule.user_can_edit,
        user_can_hide:                      nextRule.user_can_hide,
        requires_admin_approval_on_change:  nextRule.requires_admin_approval_on_change,
        sort_order:                         nextRule.sort_order,
      });
      toast({ title: "Attribute kuralı güncellendi", description: `${roleLabel} → ${attr.label}` });
    } catch (err: unknown) {
      onAttributesChange(attributes);
      toast({
        title: "Kaydedilemedi",
        description: err instanceof Error ? err.message : "Beklenmeyen hata",
        variant: "destructive",
      });
    } finally {
      setSavingKey(null);
    }
  };

  const saveDescription = async (attr: RoleManagementAttribute) => {
    try {
      await upsertEntityMetadataAsAdmin({
        entityType: "attribute",
        entityKey: attr.key,
        description: descDraft || null,
      });
      onAttributesChange(
        attributes.map((a) => (a.key === attr.key ? { ...a, description: descDraft || null } : a)),
      );
      toast({ title: "Açıklama kaydedildi" });
    } catch (err: unknown) {
      toast({
        title: "Açıklama kaydedilemedi",
        description: err instanceof Error ? err.message : "Beklenmeyen hata",
        variant: "destructive",
      });
    } finally {
      setEditingDesc(null);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">Attribute Kuralları</h3>
      <p className="text-xs text-muted-foreground">
        {roleLabel} rolü için hangi alanların açık, zorunlu ve düzenlenebilir olduğunu belirle.
      </p>

      {attributes.length === 0 && (
        <p className="text-sm text-muted-foreground">Bu rol için tanımlı attribute yok.</p>
      )}

      <div className="space-y-2">
        {attributes.map((attr) => {
          const disabled = savingKey === attr.key;
          return (
            <div key={attr.key} className="rounded border px-2.5 py-2">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold leading-tight">{attr.label}</p>
                  <p className="text-[10px] text-muted-foreground">{attr.key}</p>
                  {editingDesc === attr.key ? (
                    <div className="mt-1 flex items-center gap-1.5">
                      <Input
                        className="h-6 text-xs px-1.5"
                        value={descDraft}
                        onChange={(e) => setDescDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") void saveDescription(attr); if (e.key === "Escape") setEditingDesc(null); }}
                        autoFocus
                      />
                      <button type="button" className="text-[10px] text-primary" onClick={() => void saveDescription(attr)}>Kaydet</button>
                      <button type="button" className="text-[10px] text-muted-foreground" onClick={() => setEditingDesc(null)}>İptal</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="mt-0.5 text-[10px] text-muted-foreground hover:text-foreground text-left"
                      onClick={() => { setEditingDesc(attr.key); setDescDraft(attr.description ?? ""); }}
                    >
                      {attr.description ? attr.description : "Açıklama ekle…"}
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      ["Aktif",   "is_enabled"],
                      ["Zorunlu", "is_required"],
                      ["Public",  "is_public_default"],
                      ["Düzenler","user_can_edit"],
                      ["Gizler",  "user_can_hide"],
                      ["Onay",    "requires_admin_approval_on_change"],
                    ] as [string, keyof RoleManagementAttribute["rule"]][]
                  ).map(([label, field]) => (
                    <div key={field} className="inline-flex items-center gap-1">
                      <span className="text-[11px]">{label}</span>
                      <Switch
                        className="h-4 w-7 [&>span]:h-3 [&>span]:w-3 [&>span]:data-[state=checked]:translate-x-3"
                        checked={attr.rule[field] as boolean}
                        disabled={disabled}
                        onCheckedChange={(checked) => void updateRule(attr, { [field]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-1 inline-flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">Sıra:</span>
                <Input
                  type="number"
                  className="h-6 w-14 text-xs px-1.5"
                  defaultValue={String(attr.rule.sort_order)}
                  disabled={disabled}
                  onBlur={(e) => void updateRule(attr, { sort_order: Number(e.target.value) || attr.rule.sort_order })}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttributeRulesPanel;
