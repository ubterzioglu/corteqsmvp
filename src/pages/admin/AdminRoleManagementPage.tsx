import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  getRoleManagementBundle,
  type RoleManagementBundle,
} from "@/lib/admin";
import RoleSearchSelect, { type RoleOption } from "@/components/admin/RoleSearchSelect";
import AttributeRulesPanel from "@/components/admin/role-management/AttributeRulesPanel";
import FeatureFlagsPanel from "@/components/admin/role-management/FeatureFlagsPanel";
import ProfileSectionRulesPanel from "@/components/admin/role-management/ProfileSectionRulesPanel";

const AdminRoleManagementPage = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [selectedRoleKey, setSelectedRoleKey] = useState<string>(
    searchParams.get("role") ?? "",
  );
  const [bundle, setBundle] = useState<RoleManagementBundle | null>(null);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingBundle, setLoadingBundle] = useState(false);
  const [bundleError, setBundleError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("key, label")
        .eq("is_active", true)
        .order("sort_order");

      if (!isMounted) return;
      if (error) {
        toast({ title: "Roller yüklenemedi", description: error.message, variant: "destructive" });
        setLoadingRoles(false);
        return;
      }
      setRoles(
        ((data ?? []) as Array<{ key: string; label: string }>).map((role) => ({
          value: role.key,
          label: role.label,
          hint: role.key,
        })),
      );
      setLoadingRoles(false);
    })();
    return () => { isMounted = false; };
  }, [toast]);

  useEffect(() => {
    if (!selectedRoleKey) {
      setBundle(null);
      return;
    }

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("role", selectedRoleKey);
      return next;
    }, { replace: true });

    let isMounted = true;
    setBundleError(null);
    setLoadingBundle(true);

    void (async () => {
      try {
        const data = await getRoleManagementBundle(selectedRoleKey);
        if (!isMounted) return;
        setBundle(data);
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : "Beklenmeyen hata";
        setBundleError(msg);
        toast({ title: "Rol yüklenemedi", description: msg, variant: "destructive" });
      } finally {
        if (isMounted) setLoadingBundle(false);
      }
    })();

    return () => { isMounted = false; };
  }, [selectedRoleKey, setSearchParams, toast]);

  const handleBundleChange = (patch: Partial<RoleManagementBundle>) => {
    setBundle((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  return (
    <AdminPageLayout>
      <Card>
        <CardHeader>
          <CardTitle>Rol Yönetimi</CardTitle>
          <CardDescription>
            Bir rol seç. Seçilen role ait attribute, feature ve profil bölümü kurallarını
            tek ekrandan yönet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="max-w-sm">
            <RoleSearchSelect
              roles={roles}
              value={selectedRoleKey}
              onValueChange={setSelectedRoleKey}
              disabled={loadingRoles}
              placeholder={loadingRoles ? "Roller yükleniyor..." : "Rol seç..."}
            />
          </div>

          {!selectedRoleKey && (
            <p className="text-sm text-muted-foreground">
              Yönetmek istediğin rolü yukarıdan seç.
            </p>
          )}

          {loadingBundle && (
            <p className="text-sm text-muted-foreground">Rol verisi yükleniyor...</p>
          )}

          {bundleError && (
            <p className="text-sm text-destructive">Veri alınamadı: {bundleError}</p>
          )}

          {bundle && !loadingBundle && (
            <div className="space-y-8">
              <AttributeRulesPanel
                roleKey={bundle.role.key}
                roleLabel={bundle.role.label}
                attributes={bundle.attributes}
                onAttributesChange={(attributes) => handleBundleChange({ attributes })}
              />

              <FeatureFlagsPanel
                roleKey={bundle.role.key}
                roleLabel={bundle.role.label}
                features={bundle.features}
                onFeaturesChange={(features) => handleBundleChange({ features })}
              />

              <ProfileSectionRulesPanel
                roleKey={bundle.role.key}
                roleLabel={bundle.role.label}
                sections={bundle.sections}
                onSectionsChange={(sections) => handleBundleChange({ sections })}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
};

export default AdminRoleManagementPage;
