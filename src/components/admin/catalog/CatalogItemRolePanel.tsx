import { useEffect, useState } from "react";

import CatalogItemRuleManager from "@/components/admin/catalog/CatalogItemRuleManager";
import RoleSearchSelect from "@/components/admin/RoleSearchSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCatalogItemRules,
  setCatalogItemRole,
  type AdminCatalogRoleOption,
} from "@/lib/admin-catalog";
import type { CatalogItemRules } from "@/lib/catalog-types";

type CatalogItemRolePanelProps = {
  itemId: string;
  currentRoleKey: string | null;
  roles: AdminCatalogRoleOption[];
  onRoleChanged: (roleKey: string | null) => void;
};

const CatalogItemRolePanel = ({ itemId, currentRoleKey, roles, onRoleChanged }: CatalogItemRolePanelProps) => {
  const [selectedRoleKey, setSelectedRoleKey] = useState(currentRoleKey ?? "");
  const [rules, setRules] = useState<CatalogItemRules | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingRules, setIsLoadingRules] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setSelectedRoleKey(currentRoleKey ?? "");
  }, [currentRoleKey]);

  useEffect(() => {
    let isMounted = true;
    const loadRules = async () => {
      setIsLoadingRules(true);
      setErrorMessage(null);

      try {
        const nextRules = await getCatalogItemRules(itemId);
        if (isMounted) setRules(nextRules);
      } catch (error) {
        if (isMounted) {
          setRules(null);
          setErrorMessage(error instanceof Error ? error.message : "Kurallar alınamadı.");
        }
      } finally {
        if (isMounted) setIsLoadingRules(false);
      }
    };

    void loadRules();

    return () => {
      isMounted = false;
    };
  }, [itemId, currentRoleKey]);

  const saveRole = async () => {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const nextRoleKey = selectedRoleKey || null;
      await setCatalogItemRole(itemId, nextRoleKey);
      onRoleChanged(nextRoleKey);
      setRules(await getCatalogItemRules(itemId));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Rol güncellenemedi.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Rol & Kurallar</CardTitle>
        <CardDescription>
          Bu rol item seviyesinde tutulur. Claim onayı kullanıcı rolünü değiştirmez, yalnızca düzenleme yetkisi verir.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <RoleSearchSelect
            roles={roles.map((role) => ({ value: role.key, label: role.label, hint: role.key }))}
            value={selectedRoleKey}
            onValueChange={setSelectedRoleKey}
            placeholder="Catalog item rolü seç..."
          />
          <Button type="button" onClick={saveRole} disabled={isSaving || selectedRoleKey === (currentRoleKey ?? "")}>
            {isSaving ? "Kaydediliyor..." : "Rolü Kaydet"}
          </Button>
        </div>

        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
        {isLoadingRules ? <p className="text-sm text-muted-foreground">Kurallar yükleniyor...</p> : null}

        {rules ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <RuleSummary title="Attributes" count={rules.attributes.length} values={rules.attributes.map((item) => item.label)} />
              <RuleSummary title="Features" count={rules.features.length} values={rules.features.map((item) => item.label ?? item.key)} />
              <RuleSummary title="Sections" count={rules.sections.length} values={rules.sections.map((item) => item.label ?? item.key)} />
            </div>

            <CatalogItemRuleManager itemId={itemId} rules={rules} onRulesChanged={setRules} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

const RuleSummary = ({ title, count, values }: { title: string; count: number; values: string[] }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</span>
      <Badge variant="secondary">{count}</Badge>
    </div>
    <div className="mt-3 flex flex-wrap gap-1.5">
      {values.slice(0, 6).map((value) => (
        <Badge key={value} variant="outline" className="max-w-full truncate">
          {value}
        </Badge>
      ))}
      {values.length > 6 ? <Badge variant="outline">+{values.length - 6}</Badge> : null}
      {values.length === 0 ? <span className="text-xs text-muted-foreground">Kural yok.</span> : null}
    </div>
  </div>
);

export default CatalogItemRolePanel;
