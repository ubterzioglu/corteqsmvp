import { Eye, EyeOff } from "lucide-react";

import SearchableCitySelect from "@/components/SearchableCitySelect";
import SearchableCountrySelect from "@/components/SearchableCountrySelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { AttributeVisibility, ProfileAttributeState } from "@/lib/member-profile";
import { readDraftText } from "@/lib/profile-attribute-drafts";
import type { DraftValueMap, DraftVisibilityMap } from "@/lib/profile-attribute-keys";
import { PHONE_ATTRIBUTE_KEY } from "@/lib/profile-phone";

import { ProfilePhoneField } from "./ProfilePhoneField";
import {
  AMBER_BUTTON_PRIMARY,
  GOOGLE_SOFT_CARD_BLUE_SECTION,
  GOOGLE_SOFT_SWITCH_PANEL,
} from "./profile-card-styles";

export type ProfileFieldsCardProps = {
  displayNameAttribute: ProfileAttributeState;
  displayNameLabel: string;
  /** WS1 madde 1: telefon kuralı role_attributes'ta yoksa alan hiç çizilmez. */
  phoneAttribute: ProfileAttributeState | null;
  phoneError: string | null;
  isPhoneSaving: boolean;
  isDisplayNameSaving: boolean;
  commonAttributes: ProfileAttributeState[];
  commonAllVisible: boolean;
  isSavingCommonAttributes: boolean;
  draftValues: DraftValueMap;
  draftVisibilities: DraftVisibilityMap;
  onValueChange: (attributeKey: string, value: string | boolean) => void;
  onVisibilityChange: (attributeKey: string, visibility: AttributeVisibility) => void;
  onPhoneChange: (value: string) => void;
  onPhoneSave: () => void;
  onDisplayNameSave: () => void;
  onCommonAllVisibleChange: (checked: boolean) => void;
  onCommonSave: () => void;
};

/** Telefon, görünen isim, ülke/şehir ve kısa açıklamayı toplayan ana form kartı. */
export const ProfileFieldsCard = ({
  displayNameAttribute,
  displayNameLabel,
  phoneAttribute,
  phoneError,
  isPhoneSaving,
  isDisplayNameSaving,
  commonAttributes,
  commonAllVisible,
  isSavingCommonAttributes,
  draftValues,
  draftVisibilities,
  onValueChange,
  onVisibilityChange,
  onPhoneChange,
  onPhoneSave,
  onDisplayNameSave,
  onCommonAllVisibleChange,
  onCommonSave,
}: ProfileFieldsCardProps) => {
  const displayNameVisibility =
    draftVisibilities[displayNameAttribute.attributeKey] ?? displayNameAttribute.visibility;

  return (
    <Card className={GOOGLE_SOFT_CARD_BLUE_SECTION}>
      <CardHeader className="pb-2">
        <CardTitle className="text-[11px]">Profil Alanları</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {phoneAttribute ? (
          <>
            <ProfilePhoneField
              value={readDraftText(draftValues, PHONE_ATTRIBUTE_KEY)}
              error={phoneError}
              isRequired={phoneAttribute.isRequired}
              isSaving={isPhoneSaving}
              canEdit={phoneAttribute.userCanEdit}
              onChange={onPhoneChange}
              onSave={onPhoneSave}
              saveButtonClassName={AMBER_BUTTON_PRIMARY}
              lockPanelClassName={GOOGLE_SOFT_SWITCH_PANEL}
            />
            <Separator className="my-2" />
          </>
        ) : null}

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 shrink-0 w-32">
            <span className="text-[10px] font-medium text-foreground truncate">{displayNameLabel}</span>
            {displayNameAttribute.isRequired ? (
              <Badge variant="secondary" className="px-1.5 py-0 text-[9px] shrink-0">Zorunlu</Badge>
            ) : null}
          </div>
          <Input
            type="text"
            value={readDraftText(draftValues, displayNameAttribute.attributeKey)}
            onChange={(event) => onValueChange(displayNameAttribute.attributeKey, event.target.value)}
            placeholder={displayNameAttribute.label}
            className="h-8 flex-1 text-[10px] placeholder:text-[10px]"
          />
          <div className={`flex items-center gap-1.5 rounded-full px-2 shrink-0 ${GOOGLE_SOFT_SWITCH_PANEL}`} style={{ height: '32px' }}>
            {displayNameVisibility === "public" ? (
              <Eye className="h-3.5 w-3.5 shrink-0 text-primary" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            <Switch
              checked={displayNameVisibility === "public"}
              onCheckedChange={(checked) =>
                onVisibilityChange(displayNameAttribute.attributeKey, checked ? "public" : "private")
              }
              disabled={!displayNameAttribute.userCanHide}
              aria-label={`${displayNameLabel} görünürlük`}
            />
          </div>
          <Button size="sm" className={AMBER_BUTTON_PRIMARY} onClick={onDisplayNameSave} disabled={!displayNameAttribute.userCanEdit || isDisplayNameSaving}>
            {isDisplayNameSaving ? "Kaydediliyor..." : displayNameAttribute.attributeKey === "full_name" ? "Ad Soyadı Kaydet" : "İsmi Kaydet"}
          </Button>
        </div>

        <Separator className="my-2" />

        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {commonAttributes
              .filter((attr) => ["country", "city"].includes(attr.attributeKey))
              .map((attribute) => (
                <div key={attribute.attributeKey} className="space-y-1">
                  <label className="text-[10px] font-medium text-foreground">
                    {attribute.attributeKey === "country" ? "Ülke" : "Şehir"}
                  </label>
                  {attribute.attributeKey === "country" ? (
                    <SearchableCountrySelect
                      value={readDraftText(draftValues, attribute.attributeKey)}
                      onChange={(nextValue) => onValueChange(attribute.attributeKey, nextValue)}
                      size="sm"
                    />
                  ) : (
                    <SearchableCitySelect
                      value={readDraftText(draftValues, attribute.attributeKey)}
                      onChange={(nextValue) => onValueChange(attribute.attributeKey, nextValue)}
                      countryName={readDraftText(draftValues, "country") || undefined}
                      size="sm"
                    />
                  )}
                </div>
              ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-medium text-foreground">Kısa Açıklama</label>
              {commonAttributes
                .filter((attr) => attr.attributeKey === "bio_short")
                .map((attribute) => (
                  <Input
                    key={attribute.attributeKey}
                    type="text"
                    value={readDraftText(draftValues, attribute.attributeKey)}
                    onChange={(event) => onValueChange(attribute.attributeKey, event.target.value)}
                    placeholder={attribute.label}
                    className="h-8 text-[10px] placeholder:text-[10px]"
                  />
                ))}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className={`flex items-center gap-1.5 rounded-full px-2 ${GOOGLE_SOFT_SWITCH_PANEL}`} style={{ height: '32px' }}>
                {commonAllVisible ? (
                  <Eye className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <Switch
                  checked={commonAllVisible}
                  aria-label="Ortak alanlar görünürlük"
                  onCheckedChange={onCommonAllVisibleChange}
                />
              </div>
              <Button size="sm" className={AMBER_BUTTON_PRIMARY} onClick={onCommonSave} disabled={isSavingCommonAttributes}>
                {isSavingCommonAttributes ? "Kaydediliyor..." : "Ortak Alanları Kaydet"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileFieldsCard;
