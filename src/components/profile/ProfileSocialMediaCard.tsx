import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { ProfileAttributeState } from "@/lib/member-profile";
import { readDraftText } from "@/lib/profile-attribute-drafts";
import type { DraftValueMap } from "@/lib/profile-attribute-keys";
import { SOCIAL_ATTRIBUTE_CONFIGS } from "@/lib/profile-social-links";

import {
  AMBER_BUTTON_PRIMARY,
  GOOGLE_SOFT_CARD_RED_SECTION,
  GOOGLE_SOFT_SWITCH_PANEL,
} from "./profile-card-styles";

export type ProfileSocialMediaCardProps = {
  attributes: ProfileAttributeState[];
  draftValues: DraftValueMap;
  allVisible: boolean;
  isSaving: boolean;
  onValueChange: (attributeKey: string, value: string) => void;
  onAllVisibleChange: (checked: boolean) => void;
  onSave: () => void;
};

/** Sosyal medya bağlantılarını tek kartta toplu düzenleyen bölüm. */
export const ProfileSocialMediaCard = ({
  attributes,
  draftValues,
  allVisible,
  isSaving,
  onValueChange,
  onAllVisibleChange,
  onSave,
}: ProfileSocialMediaCardProps) => {
  return (
    <Card className={GOOGLE_SOFT_CARD_RED_SECTION}>
      <CardHeader className="pb-2">
        <CardTitle className="text-[11px]">Sosyal Medya Hesapları</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {attributes.length ? (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              {attributes.map((attribute) => {
                const config = SOCIAL_ATTRIBUTE_CONFIGS.find((item) => item.key === attribute.attributeKey);
                if (!config) return null;
                const Icon = config.icon;

                return (
                  <div key={attribute.attributeKey} className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 shrink-0 w-32">
                      <Icon className={`h-4 w-4 ${config.iconClassName}`} />
                      <span className="text-[10px] font-medium text-foreground truncate">{config.label}</span>
                    </div>
                    <Input
                      value={readDraftText(draftValues, attribute.attributeKey)}
                      onChange={(event) => onValueChange(attribute.attributeKey, event.target.value)}
                      placeholder={config.placeholder}
                      className="h-8 flex-1 text-[10px] placeholder:text-[10px]"
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-2">
              <div className={`flex items-center gap-1.5 rounded-full px-2 ${GOOGLE_SOFT_SWITCH_PANEL}`} style={{ height: '32px' }}>
                {allVisible ? (
                  <Eye className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <Switch
                  checked={allVisible}
                  aria-label="Sosyal medya görünürlük"
                  onCheckedChange={onAllVisibleChange}
                />
              </div>
              <Button size="sm" className={AMBER_BUTTON_PRIMARY} onClick={onSave} disabled={isSaving}>
                {isSaving ? "Kaydediliyor..." : "Sosyal Medya Kartını Kaydet"}
              </Button>
            </div>
          </>
        ) : (
          <p className="text-[11px] text-muted-foreground">Bu profil için sosyal medya alanları henüz etkin değil.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileSocialMediaCard;
