import type { ComponentType } from "react";

import { Switch } from "@/components/ui/switch";

import { ProfileInfoTip } from "./ProfileInfoTip";

export type PreferenceToggleCardProps = {
  title: string;
  description: string;
  /** WS1 madde 3: rozetin ne yaptığını anlatan (i) balonu. */
  info?: string;
  checked: boolean;
  disabled: boolean;
  toneClassName: string;
  icon: ComponentType<{ className?: string }>;
  onCheckedChange: (checked: boolean) => void;
};

export const PreferenceToggleCard = ({
  title,
  description,
  info,
  checked,
  disabled,
  toneClassName,
  icon: Icon,
  onCheckedChange,
}: PreferenceToggleCardProps) => {
  return (
    <div className={`rounded-xl p-3 ${toneClassName}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Icon className="mt-0.5 h-4 w-4 text-foreground" />
          <div>
            <p className="flex items-center gap-1 text-[11px] font-medium text-foreground">
              {title}
              {info ? <ProfileInfoTip label={title} text={info} /> : null}
            </p>
            <p className="text-[11px] text-muted-foreground">{description}</p>
          </div>
        </div>
        <Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  );
};

export default PreferenceToggleCard;
