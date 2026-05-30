import { useEffect, useMemo, useState } from "react";

import AdminPageGuideAccordion, { type AdminPageGuideSection } from "@/components/admin/AdminPageGuideAccordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { setTaxonomyOptionActiveAsAdmin, upsertRoleTaxonomyRuleAsAdmin } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";

type RoleRow = {
  id: string;
  key: string;
  label: string;
};

type GroupRow = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  selection_mode: "single" | "multiple";
};

type OptionRow = {
  id: string;
  group_id: string;
  key: string;
  label: string;
  description: string | null;
  is_active: boolean;
};

type RuleRow = {
  role_id: string;
  group_id: string;
  is_enabled: boolean;
  is_required: boolean;
  selection_mode: "single" | "multiple";
};

const guideSections: AdminPageGuideSection[] = [
  {
    title: "Bu ekran ne için kullanılır?",
    items: [
      "Consultant alt kategorileri ve business alt tiplerini burada yönetirsin.",
      "Buradaki kayıtlar feature flag değildir; profil sınıflandırması ve koşullu alan davranışı içindir.",
      "Bir option pasif yapılırsa yeni seçimlerde görünmez ama mevcut veri anında silinmez.",
    ],
  },
  {
    title: "Adım adım nasıl kullanılır?",
    items: [
      "1. Üstten düzenlemek istediğin rolü seç.",
      "2. O role bağlı taxonomy grubunda `Aktif`, `Zorunlu` ve seçim tipini kontrol et.",
      "3. Gruptaki seçenekleri tek tek aktif veya pasif yap.",
      "4. `single` yalnızca tek seçim, `multiple` birden fazla seçim anlamına gelir.",
      "5. Kaydettikten sonra ilgili kullanıcının profil ekranında seçim yapabildiğini ve beklenen alanların açıldığını doğrula.",
    ],
  },
  {
    title: "Hangi durumda burada işlem yapmalısın?",
    items: [
      "Consultant uzmanlık etiketleri, business subtype veya benzeri sınıflandırmalar için burada işlem yap.",
      "Gerçek yetki açıp kapatmak istiyorsan burada değil `Roller & Featurelar` ekranında çalış.",
      "Bir alanı zorunlu/public yapmak istiyorsan burada değil `Attribute Yönetimi` ekranında çalış.",
    ],
  },
  {
    title: "Kaydettikten sonra ne kontrol etmelisin?",
    items: [
      "Pasif yaptığın option yeni seçimlerde görünmüyor olmalı.",
      "Business subtype değişince ilgili şartlı alanlar profilde mantıklı görünmeli.",
      "Consultant için `gayrimenkul` seçildiğinde buna bağlı medya/ek alan davranışı da kontrol edilmeli.",
    ],
  },
];

const AdminTaxonomyPage = () => {
  const { toast } = useToast();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [options, setOptions] = useState<OptionRow[]>([]);
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const [rolesResult, groupsResult, optionsResult, rulesResult] = await Promise.all([
        (supabase as any).from("roles").select("id, key, label").eq("is_active", true).order("sort_order"),
        (supabase as any)
          .from("taxonomy_groups")
          .select("id, key, label, description, selection_mode")
          .eq("is_active", true)
          .order("sort_order"),
        (supabase as any)
          .from("taxonomy_options")
          .select("id, group_id, key, label, description, is_active")
          .order("sort_order"),
        (supabase as any)
          .from("role_taxonomy_rules")
          .select("role_id, group_id, is_enabled, is_required, selection_mode"),
      ]);

      if (!isMounted) return;

      if (rolesResult.error || groupsResult.error || optionsResult.error || rulesResult.error) {
        toast({
          title: "Taxonomy verileri alınamadı",
          description:
            rolesResult.error?.message ??
            groupsResult.error?.message ??
            optionsResult.error?.message ??
            rulesResult.error?.message ??
            "Bilinmeyen hata",
          variant: "destructive",
        });
        return;
      }

      const roleRows = (rolesResult.data ?? []) as RoleRow[];
      setRoles(roleRows);
      setGroups((groupsResult.data ?? []) as GroupRow[]);
      setOptions((optionsResult.data ?? []) as OptionRow[]);
      setRules((rulesResult.data ?? []) as RuleRow[]);
      setSelectedRoleId(roleRows[0]?.id ?? "");
    })();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? null;

  const ruleMap = useMemo(() => {
    const map = new Map<string, RuleRow>();
    for (const rule of rules) {
      if (rule.role_id === selectedRoleId) {
        map.set(rule.group_id, rule);
      }
    }
    return map;
  }, [rules, selectedRoleId]);

  const updateRule = async (group: GroupRow, patch: Partial<RuleRow>) => {
    if (!selectedRole) return;
    const existing = ruleMap.get(group.id);
    const nextRule: RuleRow = {
      role_id: selectedRole.id,
      group_id: group.id,
      is_enabled: patch.is_enabled ?? existing?.is_enabled ?? true,
      is_required: patch.is_required ?? existing?.is_required ?? false,
      selection_mode: patch.selection_mode ?? existing?.selection_mode ?? group.selection_mode,
    };

    setSavingKey(`${selectedRole.id}:${group.id}`);
    try {
      await upsertRoleTaxonomyRuleAsAdmin({
        roleKey: selectedRole.key,
        groupKey: group.key,
        isEnabled: nextRule.is_enabled,
        isRequired: nextRule.is_required,
        selectionMode: nextRule.selection_mode,
      });
      setRules((current) => {
        const filtered = current.filter((item) => !(item.role_id === selectedRole.id && item.group_id === group.id));
        return [...filtered, nextRule];
      });
      toast({
        title: "Taxonomy rule güncellendi",
        description: `${selectedRole.label} için ${group.label} kaydedildi.`,
      });
    } catch (error) {
      toast({
        title: "Taxonomy rule kaydedilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSavingKey(null);
    }
  };

  const toggleOption = async (option: OptionRow, nextActive: boolean) => {
    setSavingKey(option.key);
    try {
      await setTaxonomyOptionActiveAsAdmin(option.key, nextActive);
      setOptions((current) => current.map((item) => (item.key === option.key ? { ...item, is_active: nextActive } : item)));
      toast({
        title: "Taxonomy option güncellendi",
        description: `${option.label} ${nextActive ? "aktif" : "pasif"} yapıldı.`,
      });
    } catch (error) {
      toast({
        title: "Taxonomy option güncellenemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageGuideAccordion
        summary="Taxonomy gruplarını, role kurallarını ve seçeneklerin aktifliğini bu ekrandan yönet."
        sections={guideSections}
      />
      <Card>
        <CardHeader>
          <CardTitle>Taxonomy Yönetimi</CardTitle>
          <CardDescription>Alt kategori ve alt tipleri role göre aç/kapat; seçenekleri aktif veya pasif yap.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm">
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Rol seç" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {groups.map((group) => {
              const rule = ruleMap.get(group.id);
              const groupOptions = options.filter((option) => option.group_id === group.id);
              return (
                <div key={group.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">{group.label}</p>
                      <p className="text-xs text-muted-foreground">{group.key} · {group.description ?? "-"}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">Aktif</span>
                        <Switch
                          checked={rule?.is_enabled ?? true}
                          disabled={savingKey === `${selectedRoleId}:${group.id}`}
                          onCheckedChange={(checked) => void updateRule(group, { is_enabled: checked })}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">Zorunlu</span>
                        <Switch
                          checked={rule?.is_required ?? false}
                          disabled={savingKey === `${selectedRoleId}:${group.id}`}
                          onCheckedChange={(checked) => void updateRule(group, { is_required: checked })}
                        />
                      </div>
                      <Select
                        value={rule?.selection_mode ?? group.selection_mode}
                        onValueChange={(value) => void updateRule(group, { selection_mode: value as "single" | "multiple" })}
                      >
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">single</SelectItem>
                          <SelectItem value="multiple">multiple</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    {groupOptions.map((option) => (
                      <div key={option.id} className="flex items-center justify-between rounded border px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">{option.label}</p>
                          <p className="text-xs text-muted-foreground">{option.key}</p>
                        </div>
                        <Switch
                          checked={option.is_active}
                          disabled={savingKey === option.key}
                          onCheckedChange={(checked) => void toggleOption(option, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTaxonomyPage;
