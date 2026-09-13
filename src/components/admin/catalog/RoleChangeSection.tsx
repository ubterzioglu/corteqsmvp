import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

import RoleSearchSelect from "@/components/admin/RoleSearchSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminCatalogRoleOption } from "@/lib/admin-catalog";

const RoleChangeSection = ({
  currentRoleKey,
  roles,
  onRoleChange,
  isClearable = false,
}: {
  currentRoleKey: string | null;
  roles: AdminCatalogRoleOption[];
  onRoleChange: (roleKey: string | null) => void;
  isClearable?: boolean;
}) => {
  const NONE = "__none__";
  const [pendingKey, setPendingKey] = useState<string>(currentRoleKey ?? NONE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPendingKey(currentRoleKey ?? NONE);
  }, [currentRoleKey]);

  const isDirty = pendingKey !== (currentRoleKey ?? NONE);

  const handleSave = async () => {
    setSaving(true);
    await onRoleChange(pendingKey === NONE ? null : pendingKey);
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-slate-500" />
          Rol Yönetimi
        </CardTitle>
        <CardDescription>Bu kayıt için platform rolünü değiştirin.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <RoleSearchSelect
            roles={[
              ...(isClearable
                ? [{ value: NONE, label: "— Rol Yok —", hint: "no_role", searchText: "rol yok none clear" }]
                : []),
              ...roles.map((role) => ({
                value: role.key,
                label: role.label,
                hint: role.key,
                searchText: `${role.label} ${role.key}`,
              })),
            ]}
            value={pendingKey}
            onValueChange={setPendingKey}
            placeholder="Rol seçin..."
            className="flex-1"
          />
          <Button
            size="sm"
            disabled={!isDirty || saving}
            onClick={handleSave}
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
        {currentRoleKey && (
          <p className="text-xs text-muted-foreground">
            Mevcut rol: <span className="font-medium text-slate-700">{currentRoleKey}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default RoleChangeSection;
