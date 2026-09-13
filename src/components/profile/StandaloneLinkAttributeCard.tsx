import type { ComponentType } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { AttributeVisibility, ProfileAttributeState } from "@/lib/member-profile";

import {
  AMBER_BUTTON_PRIMARY,
  GOOGLE_SOFT_CARD_SECTION,
  GOOGLE_SOFT_SWITCH_PANEL,
} from "./profile-card-styles";

export type StandaloneLinkAttributeCardProps = {
  attribute: ProfileAttributeState;
  cardClassName?: string;
  title: string;
  description: string;
  /** WS1 madde 6: opsiyonel ama şiddetle tavsiye edilen alan — "Tavsiye edilir" rozeti. */
  recommended?: boolean;
  icon: ComponentType<{ className?: string }>;
  iconClassName: string;
  draftValue: string | boolean | undefined;
  draftVisibility: AttributeVisibility;
  isSaving: boolean;
  onValueChange: (value: string | boolean) => void;
  onVisibilityChange: (value: AttributeVisibility) => void;
  onSave: () => void;
};

/** LinkedIn / web sitesi gibi tek bağlantı alanını kendi kartında yöneten bileşen. */
export const StandaloneLinkAttributeCard = ({
  attribute,
  cardClassName,
  title,
  description,
  recommended = false,
  icon: Icon,
  iconClassName,
  draftValue,
  draftVisibility,
  isSaving,
  onValueChange,
  onVisibilityChange,
  onSave,
}: StandaloneLinkAttributeCardProps) => {
  const visible = draftVisibility === "public";

  return (
    <Card className={cardClassName ?? GOOGLE_SOFT_CARD_SECTION}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-[11px]">
          <Icon className={`h-4 w-4 ${iconClassName}`} />
          {title}
          {recommended ? (
            <Badge variant="secondary" className="px-1.5 py-0 text-[9px] text-sky-800">
              Tavsiye edilir
            </Badge>
          ) : (
            <Badge variant="outline" className="px-1.5 py-0 text-[9px] text-muted-foreground">
              Opsiyonel
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-[11px]">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 shrink-0 min-w-fit">
            <span className="text-[11px] font-medium text-foreground">{title}</span>
          </div>
          <Input
            type="url"
            value={typeof draftValue === "string" ? draftValue : ""}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder={attribute.label}
            className="h-8 flex-1 text-[10px] placeholder:text-[10px]"
          />
          <div className={`flex items-center gap-1.5 rounded-full px-2 shrink-0 ${GOOGLE_SOFT_SWITCH_PANEL}`} style={{ height: '32px' }}>
            {visible ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
            <Switch checked={visible} disabled={!attribute.userCanHide} onCheckedChange={(checked) => onVisibilityChange(checked ? "public" : "private")} />
          </div>
          <Button size="sm" className={AMBER_BUTTON_PRIMARY} onClick={onSave} disabled={isSaving}>
            {isSaving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StandaloneLinkAttributeCard;
