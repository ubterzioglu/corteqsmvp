import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AttributeVisibility, ProfileAttributeState } from "@/lib/member-profile";
import type { MyReferralCodeUsage } from "@/lib/member-profile-api";
import {
  PRIVATE_ONLY_ONBOARDING_ATTRIBUTE_KEYS,
  REFERRAL_CODE_ATTRIBUTE_KEY,
  type DraftValueMap,
  type DraftVisibilityMap,
} from "@/lib/profile-attribute-keys";

import { ProfileAttributeEditor } from "./ProfileAttributeEditor";
import {
  AMBER_BUTTON_PRIMARY,
  GOOGLE_SOFT_CARD_GREEN_SECTION,
  GOOGLE_SOFT_CARD_SUBTLE,
} from "./profile-card-styles";

export type ProfileRoleSpecificCardProps = {
  attributes: ProfileAttributeState[];
  draftValues: DraftValueMap;
  draftVisibilities: DraftVisibilityMap;
  displayNameLabel: string;
  isSaving: boolean;
  /** B12: kullanım kaydı varsa referral kodu salt-okunur rozetle gösterilir. */
  referralUsage: MyReferralCodeUsage | null;
  onValueChange: (attributeKey: string, value: string | boolean) => void;
  onVisibilityChange: (attributeKey: string, visibility: AttributeVisibility) => void;
  onSave: () => void;
};

/** Aktif role bağlı dinamik alanların toplu düzenlendiği kart. */
export const ProfileRoleSpecificCard = ({
  attributes,
  draftValues,
  draftVisibilities,
  displayNameLabel,
  isSaving,
  referralUsage,
  onValueChange,
  onVisibilityChange,
  onSave,
}: ProfileRoleSpecificCardProps) => {
  return (
    <Card className={GOOGLE_SOFT_CARD_GREEN_SECTION}>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-[11px]">Rolüne Özel Alanlar</CardTitle>
            <CardDescription className="text-[11px]">
              Aktif rolüne bağlı alanları tek kartta güncelle. Referral alanları backend tarafından private tutulur.
            </CardDescription>
          </div>
          <Button
            size="sm"
            className={AMBER_BUTTON_PRIMARY}
            onClick={onSave}
            disabled={isSaving || !attributes.length}
          >
            {isSaving ? "Kaydediliyor..." : "Rolüne Özel Alanları Kaydet"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {attributes.length ? (
          attributes.map((attribute) => {
            // B12: doğrulanmış referral kodu kilitli gösterilir — editör yerine rozet.
            if (attribute.attributeKey === REFERRAL_CODE_ATTRIBUTE_KEY && referralUsage) {
              const lockedCode = String(draftValues[attribute.attributeKey] ?? "").trim();
              const verifiedAt = referralUsage.usedAt
                ? new Date(referralUsage.usedAt).toLocaleDateString("tr-TR")
                : null;
              return (
                <div key={attribute.attributeKey} className={`rounded-lg px-2.5 py-2 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
                  <p className="text-[11px] font-medium">{attribute.label}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Input className="h-9 max-w-[220px] text-[10px]" value={lockedCode} readOnly disabled />
                    <Badge variant="secondary" className="px-1.5 py-0 text-[11px] text-emerald-700">
                      ✓ Doğrulandı{verifiedAt ? ` · ${verifiedAt}` : ""}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Referral kodun doğrulandı ve kilitlendi; değiştirmek için yöneticiyle iletişime geç.
                  </p>
                </div>
              );
            }

            return (
              <div key={attribute.attributeKey}>
                <ProfileAttributeEditor
                  attribute={attribute}
                  draftValue={draftValues[attribute.attributeKey]}
                  draftVisibility={draftVisibilities[attribute.attributeKey] ?? attribute.visibility}
                  displayNameLabel={displayNameLabel}
                  isSaving={isSaving}
                  saveMode="section"
                  visibilityMode="inline-switch"
                  hideVisibilityControl={PRIVATE_ONLY_ONBOARDING_ATTRIBUTE_KEYS.has(attribute.attributeKey)}
                  onValueChange={(nextValue) => onValueChange(attribute.attributeKey, nextValue)}
                  onVisibilityChange={(nextVisibility) => onVisibilityChange(attribute.attributeKey, nextVisibility)}
                />
                {attribute.attributeKey === REFERRAL_CODE_ATTRIBUTE_KEY ? (
                  <p className="mt-1 px-2.5 text-[10px] text-muted-foreground">
                    Sizi yönlendiren admin/davet kodunu gir — kaydederken doğrulanır.
                  </p>
                ) : null}
              </div>
            );
          })
        ) : (
          <p className="text-[11px] text-muted-foreground">
            Bu rol için şu an kullanıcı tarafından düzenlenebilir özel alan bulunmuyor.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileRoleSpecificCard;
