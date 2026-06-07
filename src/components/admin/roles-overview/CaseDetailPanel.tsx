import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RoleEntityAssignment } from "./types";

interface Props {
  selectedItemTitle: string | null;
  selectedRoleLabel: string | null;
  claimantEmail: string | null;
  adminEmail: string | null;
  assignment: RoleEntityAssignment | null;
  isLoading?: boolean;
}

const CaseDetailPanel = ({
  selectedItemTitle,
  selectedRoleLabel,
  claimantEmail,
  adminEmail,
  assignment,
  isLoading,
}: Props) => {
  if (!selectedItemTitle && !selectedRoleLabel) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Yukarıdan bir item ve bir rol seçerek örnek case detayını görüntüleyin.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Örnek Case</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-2 rounded-lg border p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Claim / Admin</p>
            {claimantEmail ? (
              <div>
                <p className="text-[10px] text-muted-foreground">Claim Sahibi</p>
                <p className="text-xs font-medium">{claimantEmail}</p>
              </div>
            ) : null}
            {adminEmail ? (
              <div>
                <p className="text-[10px] text-muted-foreground">Admin</p>
                <p className="text-xs font-medium">{adminEmail}</p>
              </div>
            ) : null}
            {!claimantEmail && !adminEmail ? (
              <p className="text-xs text-muted-foreground">Bilgi yok</p>
            ) : null}
          </div>

          <div className="space-y-2 rounded-lg border p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">1 Item</p>
            {selectedItemTitle ? (
              <p className="text-xs font-medium">{selectedItemTitle}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Seçilmedi</p>
            )}
          </div>

          <div className="space-y-2 rounded-lg border p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">1 Rol</p>
            {selectedRoleLabel ? (
              <p className="text-xs font-medium">{selectedRoleLabel}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Seçilmedi</p>
            )}
          </div>
        </div>

        {isLoading ? (
          <p className="text-xs text-muted-foreground">Yükleniyor...</p>
        ) : assignment ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                Attribute Kuralları <Badge variant="secondary">{assignment.attributeRules.length}</Badge>
              </div>
              {assignment.attributeRules.map((rule) => (
                <div key={rule.attributeKey} className="flex items-center justify-between rounded border px-2 py-1">
                  <span className="text-[11px]">{rule.attributeLabel}</span>
                  <div className="flex gap-1">
                    {rule.is_enabled && <Badge variant="outline" className="text-[9px] py-0">A</Badge>}
                    {rule.is_required && <Badge variant="secondary" className="text-[9px] py-0">Z</Badge>}
                    {rule.is_public_default && <Badge variant="outline" className="text-[9px] py-0">P</Badge>}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                Feature Flag <Badge variant="secondary">{assignment.featureFlags.length}</Badge>
              </div>
              {assignment.featureFlags.map((flag) => (
                <div key={flag.featureKey} className="flex items-center justify-between rounded border px-2 py-1">
                  <span className="text-[11px]">{flag.featureLabel}</span>
                  <Badge variant={flag.is_enabled ? "default" : "outline"} className="text-[9px] py-0">
                    {flag.is_enabled ? "Açık" : "Kapalı"}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                Section Kuralları <Badge variant="secondary">{assignment.sectionRules.length}</Badge>
              </div>
              {assignment.sectionRules.map((rule) => (
                <div key={rule.sectionKey} className="flex items-center justify-between rounded border px-2 py-1">
                  <span className="text-[11px]">{rule.sectionLabel}</span>
                  <Badge variant={rule.is_enabled ? "default" : "outline"} className="text-[9px] py-0">
                    {rule.is_enabled ? "Açık" : "Kapalı"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default CaseDetailPanel;
