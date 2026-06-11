import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import { updateUserTaxonomySelectionAsAdmin } from "@/lib/admin";
import AdminPageGuideAccordion, { type AdminPageGuideSection } from "@/components/admin/AdminPageGuideAccordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import RoleSearchSelect from "@/components/admin/RoleSearchSelect";
import { adminSetCatalogItemAttribute, getCatalogItemProfile } from "@/lib/catalog-entity-api";
import { listAdminMemberCatalogProfiles, setMemberCatalogRoleAsAdmin } from "@/lib/member-catalog";

type UserRow = {
  item_id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  profile_type: string;
  auth_provider: string | null;
  created_at: string;
};

type RoleRow = {
  id: string;
  key: string;
  label: string;
  sort_order: number;
  is_active: boolean;
};

type AssignmentRow = {
  user_id: string;
  role_id: string;
};

type UserTaxonomySelectionRow = {
  group_id: string;
  option_id: string;
};

type TaxonomyGroupRow = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  sort_order: number;
};

type TaxonomyOptionRow = {
  id: string;
  group_id: string;
  key: string;
  label: string;
  description: string | null;
  sort_order: number;
};

type UserAttributeDisplayItem = {
  key: string;
  label: string;
  description: string | null;
  dataType: string;
  value: string;
  visibility: "public" | "private";
  approvalStatus: "draft" | "pending" | "approved" | "rejected";
  isSystem: boolean;
  sortOrder: number;
};

type UserTaxonomyDisplayGroup = {
  key: string;
  label: string;
  description: string | null;
  options: Array<{
    key: string;
    label: string;
    isSelected: boolean;
  }>;
  sortOrder: number;
};

type UserDataDialogState = {
  user: UserRow;
  roleLabel: string;
  roleId: string;
  attributes: UserAttributeDisplayItem[];
  taxonomyGroups: UserTaxonomyDisplayGroup[];
};

type ProviderFilter = "google" | "all" | "unknown";
type SortFilter = "created_desc" | "created_asc" | "name_asc";
type UsersRolesBackFilters = {
  q?: string;
  provider?: ProviderFilter;
  from?: string;
  to?: string;
  sort?: SortFilter;
};

const DEFAULT_PROVIDER_FILTER: ProviderFilter = "google";
const DEFAULT_SORT_FILTER: SortFilter = "created_desc";
const ADMIN_SWITCH_PANEL =
  "border border-emerald-200/70 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(229,246,238,0.95)_60%,_rgba(214,242,228,0.95)_100%)] shadow-[0_1px_2px_rgba(16,24,40,0.04)]";

const parseProviderFilter = (value: string | null): ProviderFilter => {
  if (value === "all" || value === "unknown" || value === "google") {
    return value;
  }
  return DEFAULT_PROVIDER_FILTER;
};

const parseSortFilter = (value: string | null): SortFilter => {
  if (value === "created_asc" || value === "name_asc" || value === "created_desc") {
    return value;
  }
  return DEFAULT_SORT_FILTER;
};

const buildUsersRolesSearchParams = (filters: UsersRolesBackFilters) => {
  const next = new URLSearchParams();
  if (filters.q) next.set("q", filters.q);
  if (filters.provider && filters.provider !== DEFAULT_PROVIDER_FILTER) next.set("provider", filters.provider);
  if (filters.from) next.set("from", filters.from);
  if (filters.to) next.set("to", filters.to);
  if (filters.sort && filters.sort !== DEFAULT_SORT_FILTER) next.set("sort", filters.sort);
  return next;
};

const formatAttributeValue = (valueText: string | null, valueJson: unknown) => {
  if (typeof valueText === "string" && valueText.trim()) {
    return valueText.trim();
  }

  if (Array.isArray(valueJson)) {
    const parts = valueJson
      .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
      .filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "-";
  }

  if (valueJson && typeof valueJson === "object") {
    try {
      return JSON.stringify(valueJson, null, 2);
    } catch {
      return String(valueJson);
    }
  }

  if (typeof valueJson === "string" && valueJson.trim()) {
    return valueJson.trim();
  }

  if (typeof valueJson === "number" || typeof valueJson === "boolean") {
    return String(valueJson);
  }

  return "-";
};

const parseAttributeDraftValue = (attribute: UserAttributeDisplayItem, rawValue: string): unknown => {
  if (attribute.dataType === "json") {
    return rawValue.trim() ? JSON.parse(rawValue) : {};
  }

  if (attribute.dataType === "multi_select") {
    return rawValue
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (attribute.dataType === "boolean") {
    const normalized = rawValue.trim().toLowerCase();
    return normalized === "true" || normalized === "evet" || normalized === "1";
  }

  return rawValue.trim();
};

const getAttributeDraftSeedValue = (attribute: UserAttributeDisplayItem) => (attribute.value === "-" ? "" : attribute.value);

const shouldSaveAttributeDraft = (
  attribute: UserAttributeDisplayItem,
  draftValue: string,
  nextVisibility: "public" | "private",
) => {
  return draftValue !== getAttributeDraftSeedValue(attribute) || nextVisibility !== attribute.visibility;
};

const guideSections: AdminPageGuideSection[] = [
  {
    title: "Bu ekran ne için kullanılır?",
    items: [
      "Bu ekran, sisteme giriş yapmış kullanıcıların hangi rolde olduğunu görmek ve gerekiyorsa rolünü düzeltmek için kullanılır.",
      "Kullanıcının bekleyen onayı veya ekstra feature override ihtiyacı var mı ilk bakışta anlaşılır; detay yönetimi `Details` penceresinde yapılır.",
      "Bir kullanıcı yanlış dashboard, yanlış profil formu veya yanlış taxonomy seçim grubu görüyorsa ilk bakılacak yer burasıdır.",
    ],
  },
  {
    title: "Adım adım nasıl kullanılır?",
    items: [
      "1. Üstteki arama kutusuna kullanıcının adını veya e-postasını yaz.",
      "2. Gerekirse `Provider`, `Kayıt başlangıç`, `Kayıt bitiş` ve `Sıralama` filtreleriyle listeyi daralt.",
      "3. Doğru kullanıcı satırını bulunca `Details` butonuyla kullanıcı detayını aç.",
      "4. Rol yanlışsa `Details` butonuna tıkla, açılan pencerede doğru rolü seç ve `Rolü Kaydet` ile işlemi tamamla.",
      "5. Aynı pencerede `Pending` ve `Override` sayılarına bak; ekstra işlem gerekip gerekmediğini hemen anla.",
      "6. Rol değişikliği sonrası kullanıcıda görünüm kartı sorunu varsa `Profile Sections`, sınıflandırma sorunu varsa `Taxonomy Yönetimi`, alan/form sorunu varsa `Attribute Yönetimi` ekranına geç.",
    ],
  },
  {
    title: "Hangi durumda hangi kararı ver?",
    items: [
      "Kullanıcının tüm deneyimi değişecekse rolü burada değiştir. Sadece tek bir izin farklı olsun istiyorsan role dokunma, `Feature Override` ekranına git.",
      "Kullanıcı yanlış role atanmışsa önce burada düzelt, sonra gerekiyorsa `Roller & Featurelar`, `Attribute Yönetimi`, `Profile Sections` veya `Taxonomy Yönetimi` tarafını kontrol et.",
      "Bir kullanıcı için `Pending` sayısı yüksekse rolü değiştirip çıkma; ilgili onay kuyruklarını da ayrıca incele.",
    ],
  },
  {
    title: "Kaydettikten sonra ne kontrol etmelisin?",
    items: [
      "Rol değişince `Details` penceresindeki rol bilgisinin güncellendiğini kontrol et.",
      "Kullanıcının işi rol değişikliğiyle çözüldüyse ekstra override vermemeye çalış; sistem temiz kalsın.",
      "Emin değilsen kullanıcıyı profilde veya ilgili admin ekranlarında tekrar açıp yeni davranışı doğrula.",
      "Özellikle `danisman` ve `isletme` rollerinde, taxonomy'ye bağlı zorunlu alanlar değişebileceği için profil ekranını ayrıca kontrol et.",
    ],
  },
];

const AdminLoginUsersRolesPage = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [rows, setRows] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [roleByUserId, setRoleByUserId] = useState<Record<string, string>>({});
  const [pendingCountByUserId, setPendingCountByUserId] = useState<Record<string, number>>({});
  const [overrideCountByUserId, setOverrideCountByUserId] = useState<Record<string, number>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [isUserDataDialogOpen, setIsUserDataDialogOpen] = useState(false);
  const [userDataDialogLoading, setUserDataDialogLoading] = useState(false);
  const [userDataDialogError, setUserDataDialogError] = useState<string | null>(null);
  const [userDataDialogState, setUserDataDialogState] = useState<UserDataDialogState | null>(null);
  const [dialogRoleId, setDialogRoleId] = useState("");
  const [attributeDrafts, setAttributeDrafts] = useState<Record<string, string>>({});
  const [visibilityDrafts, setVisibilityDrafts] = useState<Record<string, "public" | "private">>({});
  const [taxonomyDrafts, setTaxonomyDrafts] = useState<Record<string, string[]>>({});
  const [isUserDataSaving, setIsUserDataSaving] = useState(false);

  const searchText = searchParams.get("q") ?? "";
  const providerFilter = parseProviderFilter(searchParams.get("provider"));
  const fromDate = searchParams.get("from") ?? "";
  const toDate = searchParams.get("to") ?? "";
  const sortFilter = parseSortFilter(searchParams.get("sort"));

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("id, key, label, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (!isMounted) return;

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setRoles((data ?? []) as RoleRow[]);
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const data = await listAdminMemberCatalogProfiles({
          query: searchText,
          provider: providerFilter,
          fromDate,
          toDate,
          sort: sortFilter,
        });

        if (!isMounted) return;

        const userRows = data.map((row) => ({
          item_id: row.itemId,
          user_id: row.userId,
          email: row.email ?? null,
          full_name: row.fullName ?? null,
          profile_type: row.profileType ?? "bireysel",
          auth_provider: row.authProvider ?? null,
          created_at: row.createdAt ?? new Date(0).toISOString(),
        })) as UserRow[];
        setRows(userRows);

        if (userRows.length === 0) {
          setRoleByUserId({});
          setPendingCountByUserId({});
          setOverrideCountByUserId({});
          setIsLoading(false);
          return;
        }

        const [assignmentsResult, approvalsResult, overridesResult] = await Promise.all([
          supabase
            .from("user_role_assignments")
            .select("user_id, role_id")
            .in("user_id", userRows.map((row) => row.user_id)),
          supabase
            .from("approval_requests")
            .select("user_id, status")
            .eq("status", "pending")
            .in("user_id", userRows.map((row) => row.user_id)),
          supabase
            .from("user_feature_overrides")
            .select("user_id, feature_key")
            .in("user_id", userRows.map((row) => row.user_id)),
        ]);

        if (!isMounted) return;

        if (assignmentsResult.error || approvalsResult.error || overridesResult.error) {
          setErrorMessage(assignmentsResult.error?.message ?? approvalsResult.error?.message ?? overridesResult.error?.message ?? "Bilinmeyen hata");
          setRoleByUserId({});
          setPendingCountByUserId({});
          setOverrideCountByUserId({});
          setIsLoading(false);
          return;
        }

        const nextMap: Record<string, string> = {};
        for (const item of (assignmentsResult.data ?? []) as AssignmentRow[]) {
          nextMap[item.user_id] = item.role_id;
        }

        const nextPendingCountByUserId: Record<string, number> = {};
        for (const row of approvalsResult.data ?? []) {
          nextPendingCountByUserId[row.user_id] = (nextPendingCountByUserId[row.user_id] ?? 0) + 1;
        }

        const nextOverrideCountByUserId: Record<string, number> = {};
        for (const row of overridesResult.data ?? []) {
          nextOverrideCountByUserId[row.user_id] = (nextOverrideCountByUserId[row.user_id] ?? 0) + 1;
        }

        setRoleByUserId(nextMap);
        setPendingCountByUserId(nextPendingCountByUserId);
        setOverrideCountByUserId(nextOverrideCountByUserId);
        setIsLoading(false);
      } catch (error) {
        if (!isMounted) return;
        setRows([]);
        setRoleByUserId({});
        setPendingCountByUserId({});
        setOverrideCountByUserId({});
        setErrorMessage(error instanceof Error ? error.message : "Bilinmeyen hata");
        setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [fromDate, providerFilter, searchText, sortFilter, toDate]);

  const roleById = useMemo(() => {
    return new Map(roles.map((role) => [role.id, role]));
  }, [roles]);

  const roleIdByKey = useMemo(() => {
    return new Map(roles.map((role) => [role.key, role.id]));
  }, [roles]);

  const totalUsers = rows.length;

  const updateFilter = (key: keyof UsersRolesBackFilters, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next, { replace: true });
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const handleRoleChange = async (
    row: UserRow,
    nextRoleId: string,
    options?: {
      suppressSuccessToast?: boolean;
      suppressErrorToast?: boolean;
    },
  ) => {
    const nextRole = roleById.get(nextRoleId);
    if (!nextRole) return;

    const prevRoleId = roleByUserId[row.user_id] ?? roleIdByKey.get(row.profile_type) ?? "";
    setRoleByUserId((current) => ({ ...current, [row.user_id]: nextRoleId }));
    setUpdatingUserId(row.user_id);

    try {
      await setMemberCatalogRoleAsAdmin(row.item_id, nextRole.key);
      setRows((current) =>
        current.map((item) => (item.user_id === row.user_id ? { ...item, profile_type: nextRole.key } : item)),
      );
      setUserDataDialogState((current) => {
        if (!current || current.user.user_id !== row.user_id) return current;
        return {
          ...current,
          roleLabel: nextRole.label,
          user: {
            ...current.user,
            profile_type: nextRole.key,
          },
        };
      });
      if (!options?.suppressSuccessToast) {
        toast({
          title: "Rol güncellendi",
          description: `${row.email ?? row.user_id} için rol ${nextRole.label} olarak kaydedildi.`,
        });
      }
    } catch (error) {
      setRoleByUserId((current) => ({ ...current, [row.user_id]: prevRoleId }));
      if (!options?.suppressErrorToast) {
        toast({
          title: "Rol güncellenemedi",
          description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
          variant: "destructive",
        });
      }
      throw error;
    } finally {
      setUpdatingUserId((current) => (current === row.user_id ? null : current));
    }
  };

  const handleOpenAttributes = async (row: UserRow) => {
    const selectedRoleId = roleByUserId[row.user_id] ?? roleIdByKey.get(row.profile_type) ?? "";
    const roleLabel = roleById.get(selectedRoleId)?.label ?? row.profile_type;

    setIsUserDataDialogOpen(true);
    setUserDataDialogLoading(true);
    setUserDataDialogError(null);
    setUserDataDialogState(null);
    setDialogRoleId(selectedRoleId);
    setAttributeDrafts({});
    setVisibilityDrafts({});
    setTaxonomyDrafts({});

    try {
      const [catalogProfile, taxonomySelectionsResult, roleTaxonomyRulesResult] = await Promise.all([
        getCatalogItemProfile(row.item_id),
        supabase
          .from("user_taxonomy_selections")
          .select("group_id, option_id")
          .eq("user_id", row.user_id),
        selectedRoleId
          ? supabase
              .from("role_taxonomy_rules")
              .select("group_id")
              .eq("role_id", selectedRoleId)
              .eq("is_enabled", true)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (taxonomySelectionsResult.error || roleTaxonomyRulesResult.error) {
        throw taxonomySelectionsResult.error ?? roleTaxonomyRulesResult.error;
      }

      const taxonomySelections = (taxonomySelectionsResult.data ?? []) as UserTaxonomySelectionRow[];
      const roleGroupIds = (roleTaxonomyRulesResult.data ?? []).map((item) => item.group_id as string);
      const groupIds = Array.from(new Set([...taxonomySelections.map((item) => item.group_id), ...roleGroupIds]));

      const [taxonomyGroupsResult, taxonomyOptionsResult] = await Promise.all([
        groupIds.length > 0
          ? supabase
              .from("taxonomy_groups")
              .select("id, key, label, description, sort_order")
              .in("id", groupIds)
          : Promise.resolve({ data: [], error: null }),
        groupIds.length > 0
          ? supabase
              .from("taxonomy_options")
              .select("id, group_id, key, label, description, sort_order")
              .in("group_id", groupIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (taxonomyGroupsResult.error || taxonomyOptionsResult.error) {
        throw taxonomyGroupsResult.error ?? taxonomyOptionsResult.error;
      }

      const attributes: UserAttributeDisplayItem[] = catalogProfile.attributes
        .map((attribute) => ({
          key: attribute.attribute_key,
          label: attribute.label,
          description: null,
          dataType: attribute.data_type,
          value: formatAttributeValue(attribute.value_text, attribute.value_json),
          visibility: attribute.visibility === "admin_only" ? "private" : attribute.visibility,
          approvalStatus: attribute.approval_status,
          isSystem: attribute.is_system,
          sortOrder: attribute.sort_order,
        }))
        .sort((left, right) => left.sortOrder - right.sortOrder);

      const taxonomyGroupsById = new Map(
        ((taxonomyGroupsResult.data ?? []) as TaxonomyGroupRow[]).map((item) => [item.id, item]),
      );
      const taxonomyOptionsById = new Map(
        ((taxonomyOptionsResult.data ?? []) as TaxonomyOptionRow[]).map((item) => [item.id, item]),
      );

      const taxonomyGroupMap = new Map<string, UserTaxonomyDisplayGroup>();
      for (const selection of taxonomySelections) {
        const group = taxonomyGroupsById.get(selection.group_id);
        const option = taxonomyOptionsById.get(selection.option_id);
        if (!group || !option) continue;

        const existing = taxonomyGroupMap.get(group.id);
        if (existing) {
          existing.options.push({ key: option.key, label: option.label, isSelected: true });
          continue;
        }

        taxonomyGroupMap.set(group.id, {
          key: group.key,
          label: group.label,
          description: group.description,
          options: [{ key: option.key, label: option.label, isSelected: true }],
          sortOrder: group.sort_order,
        });
      }

      for (const group of (taxonomyGroupsResult.data ?? []) as TaxonomyGroupRow[]) {
        if (taxonomyGroupMap.has(group.id)) continue;
        taxonomyGroupMap.set(group.id, {
          key: group.key,
          label: group.label,
          description: group.description,
          options: [],
          sortOrder: group.sort_order,
        });
      }

      for (const option of (taxonomyOptionsResult.data ?? []) as TaxonomyOptionRow[]) {
        const matchingGroup = Array.from(taxonomyGroupMap.values()).find((group) => group.key === taxonomyGroupsById.get(option.group_id)?.key);
        if (!matchingGroup) continue;
        if (matchingGroup.options.some((item) => item.key === option.key)) continue;
        matchingGroup.options.push({ key: option.key, label: option.label, isSelected: false });
      }

      for (const group of taxonomyGroupMap.values()) {
        group.options.sort((left, right) => left.label.localeCompare(right.label, "tr"));
      }

      const nextState = {
        user: row,
        roleLabel,
        roleId: selectedRoleId,
        attributes,
        taxonomyGroups: Array.from(taxonomyGroupMap.values()).sort((left, right) => left.sortOrder - right.sortOrder),
      };

      setUserDataDialogState(nextState);
      setAttributeDrafts(
        Object.fromEntries(nextState.attributes.map((attribute) => [attribute.key, getAttributeDraftSeedValue(attribute)])),
      );
      setVisibilityDrafts(
        Object.fromEntries(nextState.attributes.map((attribute) => [attribute.key, attribute.visibility])),
      );
      setTaxonomyDrafts(
        Object.fromEntries(
          nextState.taxonomyGroups.map((group) => [
            group.key,
            group.options.filter((option) => option.isSelected).map((option) => option.key),
          ]),
        ),
      );
    } catch (error) {
      setUserDataDialogError(error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.");
    } finally {
      setUserDataDialogLoading(false);
    }
  };

  const handleSaveAllUserData = async () => {
    if (!userDataDialogState) return;
    setIsUserDataSaving(true);
    try {
      const currentRoleId =
        roleByUserId[userDataDialogState.user.user_id] ?? roleIdByKey.get(userDataDialogState.user.profile_type) ?? "";

      if (dialogRoleId && dialogRoleId !== currentRoleId) {
        await handleRoleChange(userDataDialogState.user, dialogRoleId, {
          suppressSuccessToast: true,
          suppressErrorToast: true,
        });
      }

      for (const attribute of userDataDialogState.attributes) {
        const rawValue = attributeDrafts[attribute.key] ?? "";
        const nextVisibility = visibilityDrafts[attribute.key] ?? attribute.visibility;
        if (!shouldSaveAttributeDraft(attribute, rawValue, nextVisibility)) continue;
        const payload = parseAttributeDraftValue(attribute, rawValue);
        await adminSetCatalogItemAttribute(
          userDataDialogState.user.item_id,
          attribute.key,
          payload,
          nextVisibility,
        );
      }

      for (const group of userDataDialogState.taxonomyGroups) {
        await updateUserTaxonomySelectionAsAdmin(
          userDataDialogState.user.user_id,
          group.key,
          taxonomyDrafts[group.key] ?? [],
        );
      }

      toast({ title: "Details kaydedildi" });
      await handleOpenAttributes(userDataDialogState.user);
    } catch (error) {
      toast({
        title: "Details kaydedilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsUserDataSaving(false);
    }
  };

  const handleToggleTaxonomyOption = (groupKey: string, optionKey: string) => {
    setTaxonomyDrafts((current) => {
      const active = current[groupKey] ?? [];
      const exists = active.includes(optionKey);
      return {
        ...current,
        [groupKey]: exists ? active.filter((item) => item !== optionKey) : [...active, optionKey],
      };
    });
  };

  return (
    <div className="space-y-4">
      <AdminPageGuideAccordion
        summary="Loginli kullanıcıların rol atamasını, pending approval sinyallerini ve override ihtiyacını bu ekrandan takip edebilirsin."
        sections={guideSections}
      />
      <Card>
        <CardHeader>
          <CardTitle>New Member System - Loginli Kullanıcılar & Roller</CardTitle>
          <CardDescription>
            Sadece login olmuş kullanıcılar listelenir. Bu ekranda kullanıcıya tek aktif rol atanır.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-3">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Arama (Ad/E-posta)</label>
                <Input
                  value={searchText}
                  onChange={(event) => updateFilter("q", event.target.value)}
                  placeholder="Örn: ayse / @mail.com"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Provider</label>
                <Select value={providerFilter} onValueChange={(value) => updateFilter("provider", value === DEFAULT_PROVIDER_FILTER ? "" : value)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="unknown">Unknown / Boş</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Kayıt başlangıç</label>
                <Input type="date" value={fromDate} onChange={(event) => updateFilter("from", event.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Kayıt bitiş</label>
                <Input type="date" value={toDate} onChange={(event) => updateFilter("to", event.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Sıralama</label>
                <Select value={sortFilter} onValueChange={(value) => updateFilter("sort", value === DEFAULT_SORT_FILTER ? "" : value)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_desc">En yeni kayıt</SelectItem>
                    <SelectItem value="created_asc">En eski kayıt</SelectItem>
                    <SelectItem value="name_asc">Ada göre (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-3">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-md border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Filtreleri Temizle
              </button>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
            Filtrelenen toplam login kullanıcı: <span className="font-semibold text-foreground">{totalUsers}</span>
          </div>

          {isLoading ? <p className="text-sm text-muted-foreground">Kullanıcı listesi yükleniyor...</p> : null}
          {errorMessage ? <p className="text-sm text-destructive">Liste alınamadı: {errorMessage}</p> : null}

          {!isLoading && !errorMessage ? (
            rows.length > 0 ? (
              <div className="overflow-x-auto rounded-md border">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 font-medium">Ad Soyad</th>
                      <th className="px-3 py-2 font-medium">E-posta</th>
                      <th className="px-3 py-2 font-medium">Provider</th>
                      <th className="px-3 py-2 font-medium">Kayıt Tarihi</th>
                      <th className="px-3 py-2 font-medium">Aksiyon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      return (
                        <tr key={row.user_id} className="border-t">
                          <td className="px-3 py-2">{row.full_name || "-"}</td>
                          <td className="px-3 py-2">{row.email || "-"}</td>
                          <td className="px-3 py-2">{row.auth_provider || "-"}</td>
                          <td className="px-3 py-2">
                            {new Date(row.created_at).toLocaleString("tr-TR", { timeZone: "Europe/Berlin" })}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => handleOpenAttributes(row)}
                              className="rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-100"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Kullanıcı bulunamadı.</p>
            )
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={isUserDataDialogOpen} onOpenChange={setIsUserDataDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Kullanıcı Details</DialogTitle>
            <DialogDescription>
              Role veya feature kuralı değil, kullanıcının gerçekten girdiği profil verileri gösterilir ve admin tarafından düzenlenebilir.
            </DialogDescription>
          </DialogHeader>

          {userDataDialogLoading ? <p className="text-sm text-muted-foreground">Kullanıcı verileri yükleniyor...</p> : null}
          {userDataDialogError ? <p className="text-sm text-destructive">Veri alınamadı: {userDataDialogError}</p> : null}

          {!userDataDialogLoading && !userDataDialogError && userDataDialogState ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <p className="text-[13px] font-medium text-foreground">{userDataDialogState.user.full_name || "İsimsiz kullanıcı"}</p>
                    <p className="text-xs text-muted-foreground">{userDataDialogState.user.email || "-"}</p>
                    <p className="text-xs text-muted-foreground">
                      Provider: {userDataDialogState.user.auth_provider || "-"} • Kayıt:
                      {" "}
                      {new Date(userDataDialogState.user.created_at).toLocaleString("tr-TR", { timeZone: "Europe/Berlin" })}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-[11px]">
                      Rol: {roleById.get(dialogRoleId)?.label ?? userDataDialogState.roleLabel}
                    </Badge>
                    <Badge variant="outline" className="border-orange-200 bg-orange-50 text-[11px] text-orange-700">
                      Pending: {pendingCountByUserId[userDataDialogState.user.user_id] ?? 0}
                    </Badge>
                    <Badge variant="outline" className="border-orange-200 bg-orange-50 text-[11px] text-orange-700">
                      Override: {overrideCountByUserId[userDataDialogState.user.user_id] ?? 0}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border bg-background p-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Rol Yönetimi</p>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <RoleSearchSelect
                          roles={roles.map((role) => ({
                            value: role.id,
                            label: role.label,
                            hint: role.key,
                            searchText: role.id,
                          }))}
                          value={dialogRoleId}
                          onValueChange={setDialogRoleId}
                          disabled={isUserDataSaving || updatingUserId === userDataDialogState.user.user_id || roles.length === 0}
                          className="h-9 min-w-[240px] text-[11px]"
                        />
                      </div>
                    </div>
                    <Button type="button" size="sm" className="text-[11px]" onClick={() => void handleSaveAllUserData()} disabled={isUserDataSaving || updatingUserId === userDataDialogState.user.user_id}>
                      {isUserDataSaving || updatingUserId === userDataDialogState.user.user_id ? "Kaydediliyor..." : "Tüm Değişiklikleri Kaydet"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-[13px] font-semibold text-foreground">Attribute Değerleri</h3>
                  <p className="text-xs text-muted-foreground">Kullanıcının doldurduğu alanlar ve mevcut onay/görünürlük durumu.</p>
                </div>

                {userDataDialogState.attributes.length > 0 ? (
                  <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                    {userDataDialogState.attributes.map((attribute) => (
                      <div key={attribute.key} className="rounded-lg border px-3 py-2">
                        <div className="flex flex-col gap-2 xl:flex-row xl:items-start">
                          <div className="xl:w-44 xl:shrink-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="text-[11px] font-semibold text-foreground">{attribute.label}</p>
                              <Badge variant="outline" className="px-1.5 py-0 text-[9px]">{attribute.key}</Badge>
                              <Badge variant="outline" className="px-1.5 py-0 text-[9px]">{attribute.dataType}</Badge>
                              <Badge variant="outline" className="px-1.5 py-0 text-[9px]">{attribute.approvalStatus}</Badge>
                            </div>
                            {attribute.description ? (
                              <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{attribute.description}</p>
                            ) : null}
                          </div>

                          <div className="min-w-0 flex-1">
                          {attribute.dataType === "textarea" || attribute.dataType === "json" || attribute.value.includes("\n") ? (
                            <Textarea
                              rows={attribute.dataType === "json" ? 5 : 3}
                              className="min-h-[40px] text-[11px]"
                              value={attributeDrafts[attribute.key] ?? ""}
                              onChange={(event) => setAttributeDrafts((current) => ({ ...current, [attribute.key]: event.target.value }))}
                              disabled={isUserDataSaving}
                            />
                          ) : (
                            <Input
                              className="h-9 text-[10px] placeholder:text-[10px]"
                              value={attributeDrafts[attribute.key] ?? ""}
                              onChange={(event) => setAttributeDrafts((current) => ({ ...current, [attribute.key]: event.target.value }))}
                              disabled={isUserDataSaving}
                            />
                          )}
                          </div>

                          <div className="xl:w-[84px] xl:shrink-0">
                            <div className={`flex h-9 items-center justify-between gap-1.5 rounded-full px-2 text-[11px] ${ADMIN_SWITCH_PANEL}`}>
                              {(visibilityDrafts[attribute.key] ?? attribute.visibility) === "public" ? (
                                <Eye className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                              ) : (
                                <EyeOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              )}
                              <Switch
                                checked={(visibilityDrafts[attribute.key] ?? attribute.visibility) === "public"}
                                onCheckedChange={(checked) =>
                                  setVisibilityDrafts((current) => ({
                                    ...current,
                                    [attribute.key]: checked ? "public" : "private",
                                  }))
                                }
                                disabled={isUserDataSaving}
                                aria-label={`${attribute.label} görünürlük`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Bu kullanıcı henüz attribute değeri girmemiş.</p>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-[13px] font-semibold text-foreground">Taxonomy Seçimleri</h3>
                  <p className="text-xs text-muted-foreground">Rolüne bağlı sınıflandırma veya alt tip seçimleri.</p>
                </div>

                {userDataDialogState.taxonomyGroups.length > 0 ? (
                  <div className="space-y-2">
                    {userDataDialogState.taxonomyGroups.map((group) => (
                      <div key={group.key} className="rounded-lg border px-3 py-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-[11px] font-semibold text-foreground">{group.label}</p>
                          <Badge variant="outline" className="px-1.5 py-0 text-[9px]">{group.key}</Badge>
                        </div>
                        {group.description ? <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{group.description}</p> : null}
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-2">
                            {group.options.map((option) => {
                              const selected = (taxonomyDrafts[group.key] ?? []).includes(option.key);
                              return (
                                <button
                                  key={option.key}
                                  type="button"
                                  onClick={() => handleToggleTaxonomyOption(group.key, option.key)}
                                  disabled={isUserDataSaving}
                                  className={`rounded-full border px-2.5 py-1 text-[10px] transition-colors ${
                                    selected
                                      ? "border-orange-300 bg-orange-100 text-orange-800"
                                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                                  } disabled:cursor-not-allowed disabled:opacity-60`}
                                >
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Bu kullanıcı için seçilmiş taxonomy kaydı yok.</p>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLoginUsersRolesPage;
