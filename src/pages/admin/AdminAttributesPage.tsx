import { useEffect, useMemo, useState } from "react";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";

import AdminPageGuideAccordion, { type AdminPageGuideSection } from "@/components/admin/AdminPageGuideAccordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { setAttributeRuleAsAdmin } from "@/lib/admin";

type RoleRow = {
  id: string;
  key: string;
  label: string;
  sort_order: number;
};

type AttributeRow = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  data_type: string;
  is_active: boolean;
  is_system: boolean;
  sort_order: number;
};

type RuleRow = {
  id: string;
  role_id: string;
  attribute_id: string;
  is_enabled: boolean;
  is_required: boolean;
  is_public_default: boolean;
  user_can_edit: boolean;
  user_can_hide: boolean;
  requires_admin_approval_on_change: boolean;
  sort_order: number;
};

type AdminAttributesLocationState = {
  userId?: string;
  userName?: string | null;
  userEmail?: string | null;
  selectedRoleId?: string;
  backTo?: string;
};

const guideSections: AdminPageGuideSection[] = [
  {
    title: "Bu ekran ne için kullanılır?",
    items: [
      "Bu ekran, bir roldeki kullanıcının profilinde hangi alanların görüneceğini ve nasıl davranacağını belirler.",
      "Buradaki ayarlar profil formunu doğrudan etkiler: alan açık mı, zorunlu mu, public varsayılanı ne, kullanıcı düzenleyebilir mi gibi kurallar buradan gelir.",
      "Bir kullanıcı 'bu alan niye yok', 'bu alan niye zorunlu', 'niye gizleyemiyorum' diyorsa cevap çoğunlukla bu ekrandadır.",
      "Bu ekran feature yetkisini veya public kart parçalarını yönetmez; onlar sırasıyla `Roller & Featurelar` ve `Profile Sections` ekranlarındadır.",
    ],
  },
  {
    title: "Adım adım nasıl kullanılır?",
    items: [
      "1. Üstteki rol seçiciden düzenlemek istediğin rolü seç.",
      "2. Aşağıdaki listede o role ait attribute satırlarını tek tek gözden geçir.",
      "3. `Aktif` ile alanın görünüp görünmeyeceğini belirle.",
      "4. `Zorunlu` ile alanın doldurulmasının mecburi olup olmayacağını belirle.",
      "5. `Public` ile ilk görünürlük varsayımını ayarla.",
      "6. `Düzenler` ve `Gizler` seçenekleriyle kullanıcının o alan üzerinde ne kadar kontrolü olacağını belirle.",
      "7. `Onay` açıksa kullanıcı değişiklik yapsa bile değer doğrudan canlı görünmez; önce onay sürecine düşer.",
      "8. `Sıra` alanıyla profil formunda alanın hangi sırada görüneceğini düzenle.",
      "9. Business ve Consultant rollerinde taxonomy seçimi bazı alanları şartlı zorunlu hale getirebilir; test ederken kullanıcı profilini de aç.",
    ],
  },
  {
    title: "Hangi durumda hangi ayarı kullanmalısın?",
    items: [
      "Alan tamamen gereksizse `Aktif` kapat. Alan gerekli ama herkes doldurmak zorunda değilse `Zorunlu` kapalı bırak.",
      "Alan herkes tarafından görülmesin ama sistemde dursun istiyorsan `Public` varsayımını kapalı tut.",
      "Kullanıcının alanı saklamasını istemiyorsan `Gizler` kapat; ama bunu sadece gerçekten kritik alanlarda kullan.",
      "Kullanıcının yaptığı değişiklik admin kontrolünden geçsin istiyorsan `Onay` aç.",
      "Bir şey alan değil de sınıflandırma seçimi ise burada çözmeye çalışma; `Taxonomy Yönetimi` ekranına geç.",
    ],
  },
  {
    title: "Kaydettikten sonra ne kontrol etmelisin?",
    items: [
      "Toast mesajı geldiyse kural yazılmıştır; yine de aynı satırın güncel durumda kaldığını gözünle kontrol et.",
      "Bir rol için çok fazla alanı kapattıysan profil deneyimini bozmadığından emin olmak için ilgili profil akışını ayrıca kontrol et.",
      "Zorunlu ve gizlenemez alanları birlikte kullanırken dikkatli ol; kullanıcıyı gereksiz yere kilitlemeyesin.",
      "Business subtype veya consultant category seçimine bağlı zorunluluklar için örnek bir kullanıcıyla `/profile/...` ekranını da kontrol et.",
    ],
  },
];

const AdminAttributesPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [attributes, setAttributes] = useState<AttributeRow[]>([]);
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const locationState = (location.state as AdminAttributesLocationState | null) ?? null;
  const initialSelectedRoleId = locationState?.selectedRoleId ?? searchParams.get("selectedRoleId") ?? "";
  const selectedUserName = locationState?.userName?.trim() || "İsimsiz kullanıcı";
  const selectedUserEmail = locationState?.userEmail?.trim() || "-";
  const backTo = locationState?.backTo || "/admin/new-member/users-roles";

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const [rolesResult, attributesResult, rulesResult] = await Promise.all([
        supabase.from("roles").select("id, key, label, sort_order").eq("is_active", true).order("sort_order"),
        supabase
          .from("afs_attributes")
          .select("id, key, label, description, data_type, is_active, is_system, sort_order")
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("role_attributes")
          .select(
            "id, role_id, attribute_id, is_enabled, is_required, is_public_default, user_can_edit, user_can_hide, requires_admin_approval_on_change, sort_order",
          ),
      ]);

      if (!isMounted) return;

      if (rolesResult.error || attributesResult.error || rulesResult.error) {
        setErrorMessage(rolesResult.error?.message ?? attributesResult.error?.message ?? rulesResult.error?.message ?? "Bilinmeyen hata");
        return;
      }

      const roleRows = (rolesResult.data ?? []) as RoleRow[];
      setRoles(roleRows);
      setAttributes((attributesResult.data ?? []) as AttributeRow[]);
      setRules((rulesResult.data ?? []) as RuleRow[]);
      const roleExists = roleRows.some((role) => role.id === initialSelectedRoleId);
      setSelectedRoleId(roleExists ? initialSelectedRoleId : (roleRows[0]?.id ?? ""));
    })();

    return () => {
      isMounted = false;
    };
  }, [initialSelectedRoleId]);

  const roleById = useMemo(() => new Map(roles.map((role) => [role.id, role])), [roles]);

  const ruleByAttributeId = useMemo(() => {
    const nextMap = new Map<string, RuleRow>();
    for (const rule of rules) {
      if (rule.role_id === selectedRoleId) {
        nextMap.set(rule.attribute_id, rule);
      }
    }
    return nextMap;
  }, [rules, selectedRoleId]);

  const updateRule = async (attribute: AttributeRow, patch: Partial<RuleRow>) => {
    const role = roleById.get(selectedRoleId);
    if (!role) return;

    const currentRule = ruleByAttributeId.get(attribute.id);
    const nextRule = {
      is_enabled: patch.is_enabled ?? currentRule?.is_enabled ?? true,
      is_required: patch.is_required ?? currentRule?.is_required ?? false,
      is_public_default: patch.is_public_default ?? currentRule?.is_public_default ?? false,
      user_can_edit: patch.user_can_edit ?? currentRule?.user_can_edit ?? true,
      user_can_hide: patch.user_can_hide ?? currentRule?.user_can_hide ?? true,
      requires_admin_approval_on_change:
        patch.requires_admin_approval_on_change ?? currentRule?.requires_admin_approval_on_change ?? false,
      sort_order: patch.sort_order ?? currentRule?.sort_order ?? attribute.sort_order,
    };

    setSavingKey(`${role.id}:${attribute.id}`);
    try {
      await setAttributeRuleAsAdmin(role.key, attribute.key, nextRule);
      setRules((current) => {
        const withoutCurrent = current.filter((rule) => !(rule.role_id === role.id && rule.attribute_id === attribute.id));
        return [
          ...withoutCurrent,
          {
            id: currentRule?.id ?? `${role.id}:${attribute.id}`,
            role_id: role.id,
            attribute_id: attribute.id,
            ...nextRule,
          },
        ];
      });
      toast({
        title: "Attribute kuralı güncellendi",
        description: `${role.label} için ${attribute.label} ayarları kaydedildi.`,
      });
    } catch (error) {
      toast({
        title: "Kural güncellenemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSavingKey(null);
    }
  };

  const handleBack = () => {
    navigate(backTo);
  };

  return (
    <div className="space-y-4">
      <AdminPageGuideAccordion
        summary="Seçilen role ait alan kurallarını, görünürlük varsayımlarını ve onay ihtiyaçlarını bu ekrandan düzenleyebilirsin."
        sections={guideSections}
      />
      <Card>
        <CardHeader>
          <CardTitle>Attribute Yönetimi</CardTitle>
          <CardDescription>Role göre açık alanları, görünürlük varsayımlarını ve onay kurallarını yönet.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground">Kullanıcı bağlamı</p>
              {locationState?.userId ? (
                <>
                  <p className="text-sm font-medium text-foreground">{selectedUserName}</p>
                  <p className="text-xs text-muted-foreground">{selectedUserEmail}</p>
                  <p className="text-xs text-muted-foreground">
                    Bu kullanıcı için rol bazlı attribute kuralları görüntüleniyor.
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Genel rol görünümü açık. Belirli bir kullanıcı seçmeden attribute kurallarını yönetiyorsun.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleBack}
              className="rounded-md border px-2.5 py-1.5 text-xs transition-colors hover:bg-muted"
            >
              Loginli Kullanıcılar & Roller paneline dön
            </button>
          </div>

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

          {errorMessage ? <p className="text-sm text-destructive">Liste alınamadı: {errorMessage}</p> : null}

          <div className="space-y-3">
            {attributes.map((attribute) => {
              const rule = ruleByAttributeId.get(attribute.id);
              const disabled = savingKey === `${selectedRoleId}:${attribute.id}`;
              return (
                <div key={`${selectedRoleId}:${attribute.id}`} className="rounded border px-2.5 py-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold leading-tight">{attribute.label}</p>
                      <p className="text-[10px] text-muted-foreground">{attribute.key} · {attribute.description ?? "-"}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <ToggleLine
                        label="Aktif"
                        checked={rule?.is_enabled ?? true}
                        disabled={disabled}
                        onCheckedChange={(checked) => void updateRule(attribute, { is_enabled: checked })}
                      />
                      <ToggleLine
                        label="Zorunlu"
                        checked={rule?.is_required ?? false}
                        disabled={disabled}
                        onCheckedChange={(checked) => void updateRule(attribute, { is_required: checked })}
                      />
                      <ToggleLine
                        label="Public"
                        checked={rule?.is_public_default ?? false}
                        disabled={disabled}
                        onCheckedChange={(checked) => void updateRule(attribute, { is_public_default: checked })}
                      />
                      <ToggleLine
                        label="Düzenler"
                        checked={rule?.user_can_edit ?? true}
                        disabled={disabled}
                        onCheckedChange={(checked) => void updateRule(attribute, { user_can_edit: checked })}
                      />
                      <ToggleLine
                        label="Gizler"
                        checked={rule?.user_can_hide ?? true}
                        disabled={disabled}
                        onCheckedChange={(checked) => void updateRule(attribute, { user_can_hide: checked })}
                      />
                      <ToggleLine
                        label="Onay"
                        checked={rule?.requires_admin_approval_on_change ?? false}
                        disabled={disabled}
                        onCheckedChange={(checked) =>
                          void updateRule(attribute, { requires_admin_approval_on_change: checked })
                        }
                      />
                    </div>
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">Sıra:</span>
                    <Input
                      type="number"
                      className="h-6 w-14 text-xs px-1.5"
                      defaultValue={String(rule?.sort_order ?? attribute.sort_order)}
                      disabled={disabled}
                      onBlur={(e) => void updateRule(attribute, { sort_order: Number(e.target.value) || attribute.sort_order })}
                    />
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

const ToggleLine = ({
  label,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}) => {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="text-[11px]">{label}</span>
      <Switch
        className="h-4 w-7 [&>span]:h-3 [&>span]:w-3 [&>span]:data-[state=checked]:translate-x-3"
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
};

export default AdminAttributesPage;
