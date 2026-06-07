import { useEffect, useMemo, useState } from "react";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { listAdminUnifiedRecords } from "@/lib/admin-catalog";
import ItemListPanel from "@/components/admin/roles-overview/ItemListPanel";
import RoleListPanel from "@/components/admin/roles-overview/RoleListPanel";
import EntityCatalogPanel from "@/components/admin/roles-overview/EntityCatalogPanel";
import CaseDetailPanel from "@/components/admin/roles-overview/CaseDetailPanel";
import type { EntityCatalogItem, ItemListEntry, RoleEntityAssignment, RoleListItem } from "@/components/admin/roles-overview/types";

const AdminRolesOverviewPage = () => {
  const { toast } = useToast();

  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [entityItems, setEntityItems] = useState<EntityCatalogItem[]>([]);
  const [listItems, setListItems] = useState<ItemListEntry[]>([]);
  const [totalItemCount, setTotalItemCount] = useState(0);
  const [loadingTop, setLoadingTop] = useState(true);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedRoleKey, setSelectedRoleKey] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<RoleEntityAssignment | null>(null);
  const [loadingCase, setLoadingCase] = useState(false);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const [rolesRes, attrRes, featRes, sectRes, itemsRes] = await Promise.all([
          supabase.from("roles").select("id, key, label, is_active, sort_order").eq("is_active", true).order("sort_order"),
          supabase.from("attribute_catalog").select("key, label, description, data_type, sort_order").eq("is_active", true).order("sort_order"),
          supabase.from("feature_catalog").select("key, label, description, scope_role, sort_order").order("sort_order"),
          (supabase as any).from("profile_section_catalog").select("key, label, description, section_area, sort_order").eq("is_active", true).order("sort_order"),
          listAdminUnifiedRecords({ page: 1, pageSize: 100, filters: { kind: "", query: "", itemType: "", platformRoleKey: "", status: "", verificationStatus: "", city: "", countryCode: "" } }),
        ]);

        if (!isMounted) return;

        setRoles((rolesRes.data ?? []) as RoleListItem[]);

        const attrs: EntityCatalogItem[] = ((attrRes.data ?? []) as any[]).map((a) => ({
          kind: "attribute" as const,
          key: a.key,
          label: a.label,
          description: a.description,
          data_type: a.data_type,
          sort_order: a.sort_order,
        }));
        const feats: EntityCatalogItem[] = ((featRes.data ?? []) as any[]).map((f) => ({
          kind: "feature" as const,
          key: f.key,
          label: f.label,
          description: f.description,
          scope_role: f.scope_role,
          sort_order: f.sort_order,
        }));
        const sects: EntityCatalogItem[] = ((sectRes.data ?? []) as any[]).map((s) => ({
          kind: "section" as const,
          key: s.key,
          label: s.label,
          description: s.description,
          section_area: s.section_area,
          sort_order: s.sort_order,
        }));
        setEntityItems([...attrs, ...feats, ...sects]);

        setListItems(
          itemsRes.records.map((r) => ({
            id: r.id,
            kind: r.kind,
            title: r.title,
            platformRoleKey: r.platformRoleKey,
            status: r.status,
            claimantEmail: null,
            adminEmail: null,
          })),
        );
        setTotalItemCount(itemsRes.totalCount);
      } catch (err) {
        if (!isMounted) return;
        toast({ title: "Veri yüklenemedi", description: err instanceof Error ? err.message : "Beklenmeyen hata", variant: "destructive" });
      } finally {
        if (isMounted) setLoadingTop(false);
      }
    })();
    return () => { isMounted = false; };
  }, [toast]);

  useEffect(() => {
    if (!selectedRoleKey) {
      setAssignment(null);
      return;
    }

    const role = roles.find((r) => r.key === selectedRoleKey);
    if (!role) return;

    let isMounted = true;
    setLoadingCase(true);
    void (async () => {
      try {
        const [attrRulesRes, featFlagsRes, sectRulesRes] = await Promise.all([
          supabase
            .from("role_attribute_rules")
            .select("is_enabled, is_required, is_public_default, attribute_catalog(key, label)")
            .eq("role_id", role.id),
          supabase
            .from("role_feature_flags")
            .select("feature_key, is_enabled")
            .eq("role_id", role.id),
          (supabase as any)
            .from("role_profile_section_rules")
            .select("is_enabled, profile_section_catalog(key, label)")
            .eq("role_id", role.id),
        ]);

        if (!isMounted) return;

        const featureLabelMap = new Map(
          entityItems.filter((e) => e.kind === "feature").map((e) => [e.key, e.label]),
        );

        setAssignment({
          attributeRules: ((attrRulesRes.data ?? []) as any[]).map((r) => ({
            attributeKey: r.attribute_catalog?.key ?? "",
            attributeLabel: r.attribute_catalog?.label ?? r.attribute_catalog?.key ?? "",
            is_enabled: r.is_enabled,
            is_required: r.is_required,
            is_public_default: r.is_public_default,
          })),
          featureFlags: ((featFlagsRes.data ?? []) as any[]).map((f) => ({
            featureKey: f.feature_key,
            featureLabel: featureLabelMap.get(f.feature_key) ?? f.feature_key,
            is_enabled: f.is_enabled,
          })),
          sectionRules: ((sectRulesRes.data ?? []) as any[]).map((s) => ({
            sectionKey: s.profile_section_catalog?.key ?? "",
            sectionLabel: s.profile_section_catalog?.label ?? "",
            is_enabled: s.is_enabled,
          })),
        });
      } catch (err) {
        if (!isMounted) return;
        toast({ title: "Case verisi yüklenemedi", description: err instanceof Error ? err.message : "Beklenmeyen hata", variant: "destructive" });
      } finally {
        if (isMounted) setLoadingCase(false);
      }
    })();
    return () => { isMounted = false; };
  }, [selectedRoleKey, roles, entityItems, toast]);

  const selectedItem = useMemo(() => listItems.find((i) => i.id === selectedItemId) ?? null, [listItems, selectedItemId]);
  const selectedRole = useMemo(() => roles.find((r) => r.key === selectedRoleKey) ?? null, [roles, selectedRoleKey]);

  return (
    <AdminPageLayout>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Genel Durum</h2>
          <p className="text-sm text-muted-foreground">Sistemdeki tüm item, rol ve catalog entity'leri</p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3" style={{ minHeight: "360px" }}>
          <ItemListPanel
            items={listItems}
            selectedItemId={selectedItemId}
            onSelectItem={setSelectedItemId}
            totalCount={totalItemCount}
            isLoading={loadingTop}
          />
          <RoleListPanel
            roles={roles}
            selectedRoleKey={selectedRoleKey}
            onSelectRole={setSelectedRoleKey}
            isLoading={loadingTop}
          />
          <EntityCatalogPanel
            items={entityItems}
            isLoading={loadingTop}
          />
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">Örnek Case</h2>
          <CaseDetailPanel
            selectedItemTitle={selectedItem?.title ?? null}
            selectedRoleLabel={selectedRole?.label ?? null}
            claimantEmail={selectedItem?.claimantEmail ?? null}
            adminEmail={selectedItem?.adminEmail ?? null}
            assignment={assignment}
            isLoading={loadingCase}
          />
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default AdminRolesOverviewPage;
