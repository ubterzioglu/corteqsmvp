import { useEffect, useMemo, useState } from "react";
import { Layers } from "lucide-react";
import { AdminPageShell } from "@/components/admin/page";
import { useToast } from "@/hooks/use-toast";
import {
  fetchRoleAssignmentDetail,
  fetchRolesOverviewTopBundle,
  listAdminUnifiedRecords,
  listCatalogItemEditors,
} from "@/lib/admin-catalog";
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
  const [selectedAdminEmail, setSelectedAdminEmail] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<RoleEntityAssignment | null>(null);
  const [loadingCase, setLoadingCase] = useState(false);

  // Selecting an item auto-drives its assigned role (platformRoleKey) so the AFS flows from
  // the item's real role. Manual role selection (RoleListPanel) remains a fallback.
  const handleSelectItem = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = listItems.find((entry) => entry.id === itemId);
    if (item?.platformRoleKey) {
      setSelectedRoleKey(item.platformRoleKey);
    }
  };

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const [topBundle, itemsRes] = await Promise.all([
          fetchRolesOverviewTopBundle(),
          listAdminUnifiedRecords({ page: 1, pageSize: 100, filters: { kind: "", query: "", itemType: "", platformRoleKey: "", status: "", verificationStatus: "", city: "", countryCode: "" } }),
        ]);

        if (!isMounted) return;

        setRoles(topBundle.roles as RoleListItem[]);

        const attrs: EntityCatalogItem[] = topBundle.attrs.map((a) => ({
          kind: "attribute" as const,
          key: a.key,
          label: a.label,
          description: a.description,
          data_type: a.data_type,
          sort_order: a.sort_order,
        }));
        const feats: EntityCatalogItem[] = topBundle.feats.map((f) => ({
          kind: "feature" as const,
          key: f.key,
          label: f.label,
          description: f.description,
          scope_role: f.scope_role,
          sort_order: f.sort_order,
        }));
        const sects: EntityCatalogItem[] = topBundle.sects.map((s) => ({
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
            // admin_list_unified_records returns the linked member's email (claim sahibi).
            claimantEmail: r.email ?? null,
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
        const detail = await fetchRoleAssignmentDetail(role.id);

        if (!isMounted) return;

        const featureLabelMap = new Map(
          entityItems.filter((e) => e.kind === "feature").map((e) => [e.key, e.label]),
        );

        setAssignment({
          attributeRules: detail.attributeRules.map((r) => ({
            attributeKey: r.afs_attributes?.key ?? "",
            attributeLabel: r.afs_attributes?.label ?? r.afs_attributes?.key ?? "",
            is_enabled: r.is_enabled,
            is_required: r.is_required,
            is_public_default: r.is_public_default,
          })),
          featureFlags: detail.featureFlags.map((f) => ({
            featureKey: f.feature_key,
            featureLabel: featureLabelMap.get(f.feature_key) ?? f.feature_key,
            is_enabled: f.is_enabled,
          })),
          sectionRules: detail.sectionRules.map((s) => ({
            sectionKey: s.afs_sections?.key ?? "",
            sectionLabel: s.afs_sections?.label ?? "",
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

  // "Admin" = the item's owner/manager (the person who manages that profile).
  useEffect(() => {
    if (!selectedItemId) {
      setSelectedAdminEmail(null);
      return;
    }

    let isMounted = true;
    void (async () => {
      try {
        const editors = await listCatalogItemEditors(selectedItemId);
        if (!isMounted) return;
        const owner =
          editors.find((editor) => editor.membershipRole === "owner") ??
          editors.find((editor) => editor.membershipRole === "manager") ??
          null;
        setSelectedAdminEmail(owner?.email || null);
      } catch {
        // Membership may not exist (e.g. member_profile items) — leave admin empty silently.
        if (isMounted) setSelectedAdminEmail(null);
      }
    })();
    return () => { isMounted = false; };
  }, [selectedItemId]);

  const selectedItem = useMemo(() => listItems.find((i) => i.id === selectedItemId) ?? null, [listItems, selectedItemId]);
  const selectedRole = useMemo(() => roles.find((r) => r.key === selectedRoleKey) ?? null, [roles, selectedRoleKey]);

  return (
    <AdminPageShell
      title="AFS Genel Bakış"
      description="Sistemdeki tüm item, rol ve catalog entity'leri"
      icon={Layers}
      accent="emerald"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3" style={{ minHeight: "360px" }}>
        <ItemListPanel
          items={listItems}
          selectedItemId={selectedItemId}
          onSelectItem={handleSelectItem}
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

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Örnek Case</h2>
        <CaseDetailPanel
          mode="login"
          selectedItemTitle={selectedItem?.title ?? null}
          selectedRoleLabel={selectedRole?.label ?? null}
          claimantEmail={selectedItem?.claimantEmail ?? null}
          adminEmail={selectedAdminEmail}
          assignment={assignment}
          isLoading={loadingCase}
        />
        <CaseDetailPanel
          mode="external"
          selectedItemTitle={selectedItem?.title ?? null}
          selectedRoleLabel={selectedRole?.label ?? null}
          claimantEmail={null}
          adminEmail={null}
          assignment={assignment}
          isLoading={loadingCase}
        />
      </div>
    </AdminPageShell>
  );
};

export default AdminRolesOverviewPage;
