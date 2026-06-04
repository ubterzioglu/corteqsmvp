import { useEffect, useMemo, useState } from "react";

import AdminPageGuideAccordion, { type AdminPageGuideSection } from "@/components/admin/AdminPageGuideAccordion";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { upsertRoleProfileSectionRuleAsAdmin } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";

type RoleRow = {
  id: string;
  key: string;
  label: string;
};

type SectionRow = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  section_area: string;
  sort_order: number;
};

type RuleRow = {
  role_id: string;
  section_id: string;
  is_enabled: boolean;
  requires_approval: boolean;
  sort_order: number;
};

const guideSections: AdminPageGuideSection[] = [
  {
    title: "Bu ekran ne için kullanılır?",
    items: [
      "Public profilin hangi kart parçalarını göstereceğini role göre bu ekrandan yönetirsin.",
      "Feature matrisi yetki içindir; bu ekran yalnızca görünüm section kayıtlarını yönetir.",
      "Bir kart parçasını kaldırmak veya sırasını değiştirmek istiyorsan doğru yer burasıdır.",
    ],
  },
  {
    title: "Adım adım nasıl kullanılır?",
    items: [
      "1. Önce üstten düzenlemek istediğin rolü seç.",
      "2. Listede ilgili section satırını bul; satırda key, kart alanı ve açıklama görünür.",
      "3. `Aktif` ile section'ın o rol için görünüp görünmeyeceğini belirle.",
      "4. Gerekirse `Onay` ile ilgili section için ek approval ihtiyacını işaretle.",
      "5. `Sıra` değerini değiştirerek aynı kart içindeki dizilişi ayarla.",
      "6. Kaydettikten sonra ilgili kullanıcının `/directory/profile/...` ekranında yeni görünümü kontrol et.",
    ],
  },
  {
    title: "Bu ekran neyi yönetmez?",
    items: [
      "Bir kartın içindeki alanların public/private davranışı burada değil, `Attribute Yönetimi` tarafında belirlenir.",
      "Dashboard sekmeleri ve gerçek yetkiler burada değil, `Roller & Featurelar` ekranında yönetilir.",
      "Alt kategori ve alt tip etiketlerinin kendisi burada değil, `Taxonomy Yönetimi` ekranındadır.",
    ],
  },
  {
    title: "Kaydettikten sonra ne kontrol etmelisin?",
    items: [
      "Section kapattıysan public profilde tamamen kaybolduğunu doğrula.",
      "Section açık ama veri yoksa ekranın kırılmaması normaldir; renderer bu durumda sessizce gizler.",
      "Aynı değişiklik farklı roller için farklı sonuç üretmeli; gerekirse iki rolü art arda karşılaştır.",
    ],
  },
];

const AdminProfileSectionsPage = () => {
  const { toast } = useToast();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const [rolesResult, sectionsResult, rulesResult] = await Promise.all([
        (supabase as any).from("roles").select("id, key, label").eq("is_active", true).order("sort_order"),
        (supabase as any)
          .from("profile_section_catalog")
          .select("id, key, label, description, section_area, sort_order")
          .eq("is_active", true)
          .order("sort_order"),
        (supabase as any)
          .from("role_profile_section_rules")
          .select("role_id, section_id, is_enabled, requires_approval, sort_order"),
      ]);

      if (!isMounted) return;
      if (rolesResult.error || sectionsResult.error || rulesResult.error) {
        toast({
          title: "Profile sections alınamadı",
          description: rolesResult.error?.message ?? sectionsResult.error?.message ?? rulesResult.error?.message ?? "Bilinmeyen hata",
          variant: "destructive",
        });
        return;
      }

      const roleRows = (rolesResult.data ?? []) as RoleRow[];
      setRoles(roleRows);
      setSections((sectionsResult.data ?? []) as SectionRow[]);
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
        map.set(rule.section_id, rule);
      }
    }
    return map;
  }, [rules, selectedRoleId]);

  const updateRule = async (section: SectionRow, patch: Partial<RuleRow>) => {
    if (!selectedRole) return;
    const existing = ruleMap.get(section.id);
    const nextRule = {
      role_id: selectedRole.id,
      section_id: section.id,
      is_enabled: patch.is_enabled ?? existing?.is_enabled ?? true,
      requires_approval: patch.requires_approval ?? existing?.requires_approval ?? false,
      sort_order: patch.sort_order ?? existing?.sort_order ?? section.sort_order,
    };

    setSavingKey(`${selectedRole.id}:${section.id}`);
    try {
      await upsertRoleProfileSectionRuleAsAdmin({
        roleKey: selectedRole.key,
        sectionKey: section.key,
        isEnabled: nextRule.is_enabled,
        requiresApproval: nextRule.requires_approval,
        sortOrder: nextRule.sort_order,
      });
      setRules((current) => {
        const filtered = current.filter((item) => !(item.role_id === selectedRole.id && item.section_id === section.id));
        return [...filtered, nextRule];
      });
      toast({
        title: "Profile section kaydedildi",
        description: `${selectedRole.label} için ${section.label} güncellendi.`,
      });
    } catch (error) {
      toast({
        title: "Profile section kaydedilemedi",
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
        summary="Public profilin kart parçalarını role göre açıp kapatmak ve sıralamak için bu ekranı kullan."
        sections={guideSections}
      />
      <Card>
        <CardHeader>
          <CardTitle>Profile Sections</CardTitle>
          <CardDescription>Ön kart ve detay kart parçalarını role göre yönet.</CardDescription>
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

          <div className="space-y-3">
            {sections.map((section) => {
              const rule = ruleMap.get(section.id);
              const disabled = savingKey === `${selectedRoleId}:${section.id}`;
              return (
                <div key={`${selectedRoleId}:${section.id}`} className="rounded border px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{section.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {section.key} · {section.section_area} · {section.description ?? "-"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">Aktif</span>
                        <Switch
                          checked={rule?.is_enabled ?? true}
                          disabled={disabled}
                          onCheckedChange={(checked) => void updateRule(section, { is_enabled: checked })}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">Onay</span>
                        <Switch
                          checked={rule?.requires_approval ?? false}
                          disabled={disabled}
                          onCheckedChange={(checked) => void updateRule(section, { requires_approval: checked })}
                        />
                      </div>
                      <Input
                        className="h-8 w-20"
                        type="number"
                        value={rule?.sort_order ?? section.sort_order}
                        disabled={disabled}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          if (!Number.isNaN(value)) {
                            void updateRule(section, { sort_order: value });
                          }
                        }}
                      />
                    </div>
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

export default AdminProfileSectionsPage;
