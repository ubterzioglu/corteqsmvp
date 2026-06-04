import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  upsertRoleProfileSectionRuleAsAdmin,
  upsertEntityMetadataAsAdmin,
  type RoleManagementSection,
} from "@/lib/admin";

type Props = {
  roleKey: string;
  roleLabel: string;
  sections: RoleManagementSection[];
  onSectionsChange: (next: RoleManagementSection[]) => void;
};

const ProfileSectionRulesPanel = ({ roleKey, roleLabel, sections, onSectionsChange }: Props) => {
  const { toast } = useToast();
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [editingDesc, setEditingDesc] = useState<string | null>(null);
  const [descDraft, setDescDraft] = useState("");

  const updateRule = async (
    section: RoleManagementSection,
    patch: Partial<RoleManagementSection["rule"]>,
  ) => {
    const nextRule = { ...section.rule, ...patch };
    onSectionsChange(
      sections.map((s) => (s.key === section.key ? { ...s, rule: nextRule } : s)),
    );
    setSavingKey(section.key);
    try {
      await upsertRoleProfileSectionRuleAsAdmin({
        roleKey,
        sectionKey: section.key,
        isEnabled: nextRule.is_enabled,
        requiresApproval: nextRule.requires_approval,
        sortOrder: nextRule.sort_order,
      });
      toast({
        title: "Bölüm kuralı güncellendi",
        description: `${roleLabel} → ${section.label}`,
      });
    } catch (err: unknown) {
      onSectionsChange(sections);
      toast({
        title: "Kaydedilemedi",
        description: err instanceof Error ? err.message : "Beklenmeyen hata",
        variant: "destructive",
      });
    } finally {
      setSavingKey(null);
    }
  };

  const saveDescription = async (section: RoleManagementSection) => {
    try {
      await upsertEntityMetadataAsAdmin({
        entityType: "profile_section",
        entityKey: section.key,
        description: descDraft || null,
      });
      onSectionsChange(
        sections.map((s) =>
          s.key === section.key ? { ...s, description: descDraft || null } : s,
        ),
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
      <h3 className="text-base font-semibold">Profil Bölümleri</h3>
      <p className="text-xs text-muted-foreground">
        {roleLabel} rolü için hangi profil kartı bölümlerinin görüneceğini yönet.
      </p>

      {sections.length === 0 && (
        <p className="text-sm text-muted-foreground">Bu rol için tanımlı profil bölümü yok.</p>
      )}

      <div className="space-y-2">
        {sections.map((section) => {
          const disabled = savingKey === section.key;
          return (
            <div key={section.key} className="rounded border px-2.5 py-2">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold leading-tight">{section.label}</p>
                    <Badge variant="outline" className="px-1.5 py-0 text-[9px]">
                      {section.section_area}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{section.key}</p>
                  {editingDesc === section.key ? (
                    <div className="mt-1 flex items-center gap-1.5">
                      <Input
                        className="h-6 text-xs px-1.5"
                        value={descDraft}
                        onChange={(e) => setDescDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void saveDescription(section);
                          if (e.key === "Escape") setEditingDesc(null);
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="text-[10px] text-primary"
                        onClick={() => void saveDescription(section)}
                      >
                        Kaydet
                      </button>
                      <button
                        type="button"
                        className="text-[10px] text-muted-foreground"
                        onClick={() => setEditingDesc(null)}
                      >
                        İptal
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="mt-0.5 text-[10px] text-muted-foreground hover:text-foreground text-left"
                      onClick={() => {
                        setEditingDesc(section.key);
                        setDescDraft(section.description ?? "");
                      }}
                    >
                      {section.description ? section.description : "Açıklama ekle…"}
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <div className="inline-flex items-center gap-1">
                    <span className="text-[11px]">Aktif</span>
                    <Switch
                      className="h-4 w-7 [&>span]:h-3 [&>span]:w-3 [&>span]:data-[state=checked]:translate-x-3"
                      checked={section.rule.is_enabled}
                      disabled={disabled}
                      onCheckedChange={(checked) => void updateRule(section, { is_enabled: checked })}
                    />
                  </div>
                  <div className="inline-flex items-center gap-1">
                    <span className="text-[11px]">Onay</span>
                    <Switch
                      className="h-4 w-7 [&>span]:h-3 [&>span]:w-3 [&>span]:data-[state=checked]:translate-x-3"
                      checked={section.rule.requires_approval}
                      disabled={disabled}
                      onCheckedChange={(checked) => void updateRule(section, { requires_approval: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-1 inline-flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">Sıra:</span>
                <Input
                  type="number"
                  className="h-6 w-14 text-xs px-1.5"
                  defaultValue={String(section.rule.sort_order)}
                  disabled={disabled}
                  onBlur={(e) =>
                    void updateRule(section, {
                      sort_order: Number(e.target.value) || section.rule.sort_order,
                    })
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileSectionRulesPanel;
