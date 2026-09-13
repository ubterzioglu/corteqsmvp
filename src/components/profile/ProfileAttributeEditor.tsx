import { useState } from "react";
import { CheckCircle2, ChevronDown, Clock3, Eye, EyeOff, Globe2, Lock, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { AttributeVisibility, ProfileAttributeState } from "@/lib/member-profile";
import { VISIBILITY_OPTIONS } from "@/lib/profile-attribute-keys";

import { AttributeInput } from "./AttributeInput";
import {
  AMBER_BUTTON_PRIMARY,
  GOOGLE_SOFT_CARD_SUBTLE,
  GOOGLE_SOFT_CARD_SUBTLE_INTERACTIVE,
  GOOGLE_SOFT_SWITCH_PANEL,
  GOOGLE_SOFT_WARNING_PANEL,
} from "./profile-card-styles";

export type ProfileAttributeEditorProps = {
  attribute: ProfileAttributeState;
  draftValue: string | boolean | undefined;
  draftVisibility: AttributeVisibility;
  displayNameLabel: string;
  isSaving: boolean;
  saveMode: "single" | "section";
  visibilityMode: "select" | "collapsible-radio" | "inline-switch";
  hideVisibilityControl?: boolean;
  onValueChange: (value: string | boolean) => void;
  onVisibilityChange: (value: AttributeVisibility) => void;
  onSave?: () => void;
};

export const ProfileAttributeEditor = ({
  attribute,
  draftValue,
  draftVisibility,
  displayNameLabel,
  isSaving,
  saveMode,
  visibilityMode,
  hideVisibilityControl = false,
  onValueChange,
  onVisibilityChange,
  onSave,
}: ProfileAttributeEditorProps) => {
  const [isVisibilityOpen, setIsVisibilityOpen] = useState(false);
  const attributeLabel = attribute.attributeKey === "full_name" ? displayNameLabel : attribute.label;
  const visibilityLabel = VISIBILITY_OPTIONS.find((option) => option.value === draftVisibility)?.label ?? draftVisibility;
  const visibilityLocked = !attribute.userCanHide;

  if (visibilityMode === "inline-switch") {
    return (
      <div className={`rounded-lg px-2.5 py-2 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
        <div className="flex items-start gap-2">
          <div className="w-28 shrink-0 space-y-1 sm:w-36">
            <div className="flex flex-wrap items-center gap-1">
              <p className="text-[11px] font-semibold leading-4">{attributeLabel}</p>
              {attribute.isRequired ? <Badge variant="secondary" className="px-1.5 py-0 text-[11px]">Zorunlu</Badge> : null}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <AttributeInput attribute={attribute} value={draftValue} onChange={onValueChange} compact />
          </div>

          {hideVisibilityControl ? null : (
            <div className="w-[84px] shrink-0">
              <div className={`flex h-9 items-center justify-between gap-1.5 rounded-full px-2 text-[11px] ${GOOGLE_SOFT_SWITCH_PANEL}`}>
                {draftVisibility === "public" ? (
                  <Eye className="h-3.5 w-3.5 shrink-0 text-primary" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                <Switch
                  checked={draftVisibility === "public"}
                  onCheckedChange={(checked) => onVisibilityChange(checked ? "public" : "private")}
                  disabled={visibilityLocked}
                  aria-label={`${attributeLabel} görünürlük`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-3 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[11px] font-semibold">{attributeLabel}</p>
            {attribute.isRequired ? <Badge variant="secondary" className="text-[11px] px-1.5 py-0">Zorunlu</Badge> : null}
            {attribute.requiresAdminApprovalOnChange ? (
              <Badge variant="outline" className="text-[11px] px-1.5 py-0">Onaylı</Badge>
            ) : null}
          </div>
          {attribute.description ? <p className="text-[11px] text-muted-foreground">{attribute.description}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {attribute.approvalStatus === "approved" ? (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Onaylı
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <Clock3 className="h-3.5 w-3.5" />
              Beklemede
            </span>
          )}
          {!hideVisibilityControl ? (
            <span className="inline-flex items-center gap-1 text-slate-600">
              {draftVisibility === "public" ? <Globe2 className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              {visibilityLabel}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-slate-600">
              <Lock className="h-3.5 w-3.5" />
              Private
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <AttributeInput attribute={attribute} value={draftValue} onChange={onValueChange} />

        {hideVisibilityControl ? null : visibilityMode === "collapsible-radio" ? (
          <Collapsible open={isVisibilityOpen} onOpenChange={setIsVisibilityOpen}>
            <div className={`rounded-xl ${GOOGLE_SOFT_CARD_SUBTLE}`}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
                  disabled={visibilityLocked}
                >
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Görünürlük</p>
                    <p className="text-[11px] font-medium text-foreground">{visibilityLabel}</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isVisibilityOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden border-t">
                <RadioGroup
                  value={draftVisibility}
                  onValueChange={(value) => onVisibilityChange(value as AttributeVisibility)}
                  className="gap-2 p-3"
                >
                  {VISIBILITY_OPTIONS.map((option) => {
                    const optionId = `${attribute.attributeKey}-${option.value}`;
                    return (
                      <label
                        key={option.value}
                        htmlFor={optionId}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[11px] ${GOOGLE_SOFT_CARD_SUBTLE_INTERACTIVE}`}
                      >
                        <RadioGroupItem value={option.value} id={optionId} />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </RadioGroup>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ) : (
          <div className="max-w-xs">
            <Select
              value={draftVisibility}
              onValueChange={(value) => onVisibilityChange(value as AttributeVisibility)}
              disabled={visibilityLocked}
            >
              <SelectTrigger className="h-8 text-[11px]">
                <SelectValue placeholder="Görünürlük seç" />
              </SelectTrigger>
              <SelectContent>
                {VISIBILITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {saveMode === "single" && onSave ? (
          <div className="flex justify-end">
            <Button size="sm" className={AMBER_BUTTON_PRIMARY} onClick={onSave} disabled={!attribute.userCanEdit || isSaving}>
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        ) : null}

        {attribute.requiresAdminApprovalOnChange ? (
          <div className={`rounded-lg px-2.5 py-1.5 text-[11px] text-amber-900 ${GOOGLE_SOFT_WARNING_PANEL}`}>
            <div className="flex items-start gap-1.5">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5" />
              <p>Bu alan güncellendiğinde public görünmeden önce admin onayı bekler.</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ProfileAttributeEditor;
