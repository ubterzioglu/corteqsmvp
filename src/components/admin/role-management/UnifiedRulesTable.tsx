import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  setAttributeRuleAsAdmin,
  setFeatureGlobalStateAsAdmin,
  setRoleFeatureFlagAsAdmin,
  upsertEntityMetadataAsAdmin,
  upsertRoleProfileSectionRuleAsAdmin,
  type RoleManagementAttribute,
  type RoleManagementBundle,
  type RoleManagementFeature,
  type RoleManagementSection,
} from "@/lib/admin";
import { ENTITY_KIND_LABELS, type CatalogRow } from "@/lib/role-catalog";

type Props = {
  rows: CatalogRow[];
  bundle: RoleManagementBundle | null;
  onBundleChange: (patch: Partial<RoleManagementBundle>) => void;
};

const KIND_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  attribute: "secondary",
  feature: "default",
  profile_section: "outline",
};

const UnifiedRulesTable = ({ rows, bundle, onBundleChange }: Props) => {
  const { toast } = useToast();
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [editingDesc, setEditingDesc] = useState<string | null>(null);
  const [descDraft, setDescDraft] = useState("");

  // Build quick-lookup maps from bundle
  const attrMap = new Map<string, RoleManagementAttribute>(
    (bundle?.attributes ?? []).map((a) => [a.key, a]),
  );
  const featMap = new Map<string, RoleManagementFeature>(
    (bundle?.features ?? []).map((f) => [f.key, f]),
  );
  const sectMap = new Map<string, RoleManagementSection>(
    (bundle?.sections ?? []).map((s) => [s.key, s]),
  );

  const saveDescription = async (row: CatalogRow, newDesc: string) => {
    try {
      await upsertEntityMetadataAsAdmin({
        entityType: row.kind,
        entityKey: row.key,
        description: newDesc || null,
      });
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

  const handleAttrToggle = async (
    row: CatalogRow,
    field: keyof RoleManagementAttribute["rule"],
    checked: boolean,
  ) => {
    if (!bundle) return;
    const existing = attrMap.get(row.key);
    const currentRule = existing?.rule ?? {
      is_enabled: false, is_required: false, is_public_default: false,
      user_can_edit: true, user_can_hide: true,
      requires_admin_approval_on_change: false, sort_order: row.sortOrder,
    };
    const nextRule = { ...currentRule, [field]: checked };
    const nextAttr = { ...(existing ?? { key: row.key, label: row.label, description: row.description, admin_note: row.adminNote }), rule: nextRule };
    const nextAttrs = bundle.attributes.some((a) => a.key === row.key)
      ? bundle.attributes.map((a) => (a.key === row.key ? nextAttr : a))
      : [...bundle.attributes, nextAttr as RoleManagementAttribute];
    onBundleChange({ attributes: nextAttrs });
    setSavingKey(`attr:${row.key}:${field}`);
    try {
      await setAttributeRuleAsAdmin(bundle.role.key, row.key, nextRule);
      toast({ title: "Attribute kuralı güncellendi", description: `${row.label}` });
    } catch (err: unknown) {
      onBundleChange({ attributes: bundle.attributes });
      toast({ title: "Kaydedilemedi", description: err instanceof Error ? err.message : "Beklenmeyen hata", variant: "destructive" });
    } finally {
      setSavingKey(null);
    }
  };

  const handleAttrSortOrder = async (row: CatalogRow, sortOrder: number) => {
    if (!bundle) return;
    const existing = attrMap.get(row.key);
    const currentRule = existing?.rule ?? {
      is_enabled: false, is_required: false, is_public_default: false,
      user_can_edit: true, user_can_hide: true,
      requires_admin_approval_on_change: false, sort_order: row.sortOrder,
    };
    const nextRule = { ...currentRule, sort_order: sortOrder };
    setSavingKey(`attr:${row.key}:sort`);
    try {
      await setAttributeRuleAsAdmin(bundle.role.key, row.key, nextRule);
    } catch (err: unknown) {
      toast({ title: "Sıra kaydedilemedi", description: err instanceof Error ? err.message : "Beklenmeyen hata", variant: "destructive" });
    } finally {
      setSavingKey(null);
    }
  };

  const handleFeatRoleToggle = async (row: CatalogRow, checked: boolean) => {
    if (!bundle) return;
    const existing = featMap.get(row.key);
    const nextFeat = { ...(existing ?? { key: row.key, label: row.label, description: row.description, admin_note: row.adminNote, is_active_globally: row.isActiveGlobally ?? false }), is_enabled: checked };
    const nextFeats = bundle.features.some((f) => f.key === row.key)
      ? bundle.features.map((f) => (f.key === row.key ? nextFeat as RoleManagementFeature : f))
      : [...bundle.features, nextFeat as RoleManagementFeature];
    onBundleChange({ features: nextFeats });
    setSavingKey(`feat:role:${row.key}`);
    try {
      await setRoleFeatureFlagAsAdmin(bundle.role.key, row.key, checked);
      toast({ title: "Feature güncellendi", description: `${row.label} ${checked ? "açıldı" : "kapatıldı"}` });
    } catch (err: unknown) {
      onBundleChange({ features: bundle.features });
      toast({ title: "Kaydedilemedi", description: err instanceof Error ? err.message : "Beklenmeyen hata", variant: "destructive" });
    } finally {
      setSavingKey(null);
    }
  };

  const handleFeatGlobalToggle = async (row: CatalogRow, checked: boolean) => {
    if (!bundle) return;
    const existing = featMap.get(row.key);
    const nextFeat = { ...(existing ?? { key: row.key, label: row.label, description: row.description, admin_note: row.adminNote, is_enabled: false }), is_active_globally: checked };
    const nextFeats = bundle.features.some((f) => f.key === row.key)
      ? bundle.features.map((f) => (f.key === row.key ? nextFeat as RoleManagementFeature : f))
      : [...bundle.features, nextFeat as RoleManagementFeature];
    onBundleChange({ features: nextFeats });
    setSavingKey(`feat:global:${row.key}`);
    try {
      await setFeatureGlobalStateAsAdmin(row.key, checked);
      toast({ title: "Global durum güncellendi", description: `${row.key} ${checked ? "global açık" : "global kapalı"}` });
    } catch (err: unknown) {
      onBundleChange({ features: bundle.features });
      toast({ title: "Kaydedilemedi", description: err instanceof Error ? err.message : "Beklenmeyen hata", variant: "destructive" });
    } finally {
      setSavingKey(null);
    }
  };

  const handleSectToggle = async (
    row: CatalogRow,
    field: "is_enabled" | "requires_approval",
    checked: boolean,
  ) => {
    if (!bundle) return;
    const existing = sectMap.get(row.key);
    const currentRule = existing?.rule ?? { is_enabled: false, requires_approval: false, sort_order: row.sortOrder };
    const nextRule = { ...currentRule, [field]: checked };
    const nextSect = { ...(existing ?? { key: row.key, label: row.label, description: row.description, admin_note: row.adminNote, section_area: row.sectionArea ?? "" }), rule: nextRule };
    const nextSects = bundle.sections.some((s) => s.key === row.key)
      ? bundle.sections.map((s) => (s.key === row.key ? nextSect as RoleManagementSection : s))
      : [...bundle.sections, nextSect as RoleManagementSection];
    onBundleChange({ sections: nextSects });
    setSavingKey(`sect:${row.key}:${field}`);
    try {
      await upsertRoleProfileSectionRuleAsAdmin({
        roleKey: bundle.role.key,
        sectionKey: row.key,
        isEnabled: nextRule.is_enabled,
        requiresApproval: nextRule.requires_approval,
        sortOrder: nextRule.sort_order,
      });
      toast({ title: "Bölüm kuralı güncellendi", description: row.label });
    } catch (err: unknown) {
      onBundleChange({ sections: bundle.sections });
      toast({ title: "Kaydedilemedi", description: err instanceof Error ? err.message : "Beklenmeyen hata", variant: "destructive" });
    } finally {
      setSavingKey(null);
    }
  };

  const handleSectSortOrder = async (row: CatalogRow, sortOrder: number) => {
    if (!bundle) return;
    const existing = sectMap.get(row.key);
    const currentRule = existing?.rule ?? { is_enabled: false, requires_approval: false, sort_order: row.sortOrder };
    const nextRule = { ...currentRule, sort_order: sortOrder };
    setSavingKey(`sect:${row.key}:sort`);
    try {
      await upsertRoleProfileSectionRuleAsAdmin({
        roleKey: bundle.role.key,
        sectionKey: row.key,
        isEnabled: nextRule.is_enabled,
        requiresApproval: nextRule.requires_approval,
        sortOrder,
      });
    } catch (err: unknown) {
      toast({ title: "Sıra kaydedilemedi", description: err instanceof Error ? err.message : "Beklenmeyen hata", variant: "destructive" });
    } finally {
      setSavingKey(null);
    }
  };

  const renderEditControls = (row: CatalogRow) => {
    if (!bundle) return null;

    if (row.kind === "attribute") {
      const rule = attrMap.get(row.key)?.rule ?? {
        is_enabled: false, is_required: false, is_public_default: false,
        user_can_edit: true, user_can_hide: true,
        requires_admin_approval_on_change: false, sort_order: row.sortOrder,
      };
      return (
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["Aktif",    "is_enabled"],
              ["Zorunlu",  "is_required"],
              ["Public",   "is_public_default"],
              ["Düzenler", "user_can_edit"],
              ["Gizler",   "user_can_hide"],
              ["Onay",     "requires_admin_approval_on_change"],
            ] as [string, keyof RoleManagementAttribute["rule"]][]
          ).map(([label, field]) => (
            <div key={field} className="inline-flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">{label}</span>
              <Switch
                className="h-4 w-7 [&>span]:h-3 [&>span]:w-3 [&>span]:data-[state=checked]:translate-x-3"
                checked={rule[field] as boolean}
                disabled={savingKey !== null}
                onCheckedChange={(checked) => void handleAttrToggle(row, field, checked)}
              />
            </div>
          ))}
          <div className="inline-flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">Sıra</span>
            <Input
              type="number"
              className="h-5 w-12 text-[10px] px-1"
              defaultValue={String(rule.sort_order)}
              disabled={savingKey !== null}
              onBlur={(e) => void handleAttrSortOrder(row, Number(e.target.value) || rule.sort_order)}
            />
          </div>
        </div>
      );
    }

    if (row.kind === "feature") {
      const feat = featMap.get(row.key);
      return (
        <div className="flex flex-wrap gap-1.5">
          <div className="inline-flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">Global</span>
            <Switch
              className="h-4 w-7 [&>span]:h-3 [&>span]:w-3 [&>span]:data-[state=checked]:translate-x-3"
              checked={feat?.is_active_globally ?? row.isActiveGlobally ?? false}
              disabled={savingKey !== null}
              onCheckedChange={(checked) => void handleFeatGlobalToggle(row, checked)}
            />
          </div>
          <div className="inline-flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">Rol</span>
            <Switch
              className="h-4 w-7 [&>span]:h-3 [&>span]:w-3 [&>span]:data-[state=checked]:translate-x-3"
              checked={feat?.is_enabled ?? false}
              disabled={savingKey !== null}
              onCheckedChange={(checked) => void handleFeatRoleToggle(row, checked)}
            />
          </div>
        </div>
      );
    }

    if (row.kind === "profile_section") {
      const rule = sectMap.get(row.key)?.rule ?? { is_enabled: false, requires_approval: false, sort_order: row.sortOrder };
      return (
        <div className="flex flex-wrap gap-1.5">
          <div className="inline-flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">Aktif</span>
            <Switch
              className="h-4 w-7 [&>span]:h-3 [&>span]:w-3 [&>span]:data-[state=checked]:translate-x-3"
              checked={rule.is_enabled}
              disabled={savingKey !== null}
              onCheckedChange={(checked) => void handleSectToggle(row, "is_enabled", checked)}
            />
          </div>
          <div className="inline-flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">Onay</span>
            <Switch
              className="h-4 w-7 [&>span]:h-3 [&>span]:w-3 [&>span]:data-[state=checked]:translate-x-3"
              checked={rule.requires_approval}
              disabled={savingKey !== null}
              onCheckedChange={(checked) => void handleSectToggle(row, "requires_approval", checked)}
            />
          </div>
          <div className="inline-flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">Sıra</span>
            <Input
              type="number"
              className="h-5 w-12 text-[10px] px-1"
              defaultValue={String(rule.sort_order)}
              disabled={savingKey !== null}
              onBlur={(e) => void handleSectSortOrder(row, Number(e.target.value) || rule.sort_order)}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  if (rows.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">Eşleşen kayıt bulunamadı.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24 text-[12px]">Tür</TableHead>
            <TableHead className="text-[12px]">Label</TableHead>
            <TableHead className="w-48 text-[12px]">Key</TableHead>
            <TableHead className="text-[12px]">Açıklama</TableHead>
            {bundle && <TableHead className="text-[12px]">Kurallar ({bundle.role.label})</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={`${row.kind}:${row.key}`} className="align-top">
              <TableCell className="py-2">
                <Badge variant={KIND_BADGE_VARIANT[row.kind]} className="text-[10px] px-1.5 py-0">
                  {ENTITY_KIND_LABELS[row.kind]}
                </Badge>
                {row.sectionArea && (
                  <p className="mt-0.5 text-[9px] text-muted-foreground">{row.sectionArea}</p>
                )}
              </TableCell>
              <TableCell className="py-2">
                <p className="text-[13px] font-medium leading-5">{row.label}</p>
                {row.dataType && (
                  <p className="text-[10px] text-muted-foreground">{row.dataType}</p>
                )}
              </TableCell>
              <TableCell className="py-2">
                <p className="text-[11px] font-mono text-muted-foreground break-all">{row.key}</p>
              </TableCell>
              <TableCell className="py-2">
                {editingDesc === `${row.kind}:${row.key}` ? (
                  <div className="flex items-start gap-1.5">
                    <Input
                      className="h-6 text-xs px-1.5"
                      value={descDraft}
                      onChange={(e) => setDescDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void saveDescription(row, descDraft);
                        if (e.key === "Escape") setEditingDesc(null);
                      }}
                      autoFocus
                    />
                    <button type="button" className="text-[10px] text-primary shrink-0" onClick={() => void saveDescription(row, descDraft)}>Kaydet</button>
                    <button type="button" className="text-[10px] text-muted-foreground shrink-0" onClick={() => setEditingDesc(null)}>İptal</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="text-left text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => { setEditingDesc(`${row.kind}:${row.key}`); setDescDraft(row.description ?? ""); }}
                  >
                    {row.description || "Açıklama ekle…"}
                  </button>
                )}
              </TableCell>
              {bundle && (
                <TableCell className="py-2">
                  {renderEditControls(row)}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UnifiedRulesTable;
