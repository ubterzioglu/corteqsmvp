import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ProfileAttributeState } from "@/lib/member-profile";
import { EDUCATION_LAST_SCHOOL_ATTRIBUTE_KEY, EDUCATION_LAST_SCHOOL_MAX_LENGTH, getAttributeSelectOptions } from "@/lib/profile-education";

import { GOOGLE_SOFT_CARD_SUBTLE } from "./profile-card-styles";

export type AttributeInputProps = {
  attribute: ProfileAttributeState;
  value: string | boolean | undefined;
  onChange: (value: string | boolean) => void;
  compact?: boolean;
};

/** Attribute'un `dataType`'ına göre doğru form kontrolünü çizen tek giriş noktası. */
export const AttributeInput = ({ attribute, value, onChange, compact = false }: AttributeInputProps) => {
  if (attribute.dataType === "textarea" || attribute.dataType === "multi_select" || attribute.dataType === "json") {
    return (
      <Textarea
        className={compact ? "min-h-[40px] text-[11px]" : undefined}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={attribute.dataType === "multi_select" ? "Virgülle ayırarak yaz" : attribute.label}
      />
    );
  }

  // `select` alanlar seçenekleri TS tek kaynağından alır (ör. öğrenim durumu —
  // src/lib/profile-education.ts). Seçeneği tanımsız bir select serbest metne düşer.
  const selectOptions = attribute.dataType === "select" ? getAttributeSelectOptions(attribute.attributeKey) : null;
  if (selectOptions) {
    const selectedValue = typeof value === "string" ? value : "";
    return (
      <Select value={selectedValue || undefined} onValueChange={(nextValue) => onChange(nextValue)}>
        <SelectTrigger
          className={compact ? "h-9 text-[10px]" : "text-[10px]"}
          aria-label={attribute.label}
        >
          <SelectValue placeholder={`${attribute.label} seç`} />
        </SelectTrigger>
        <SelectContent>
          {selectOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-[11px]">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (attribute.dataType === "boolean") {
    return (
      <div className={`flex items-center justify-between rounded-xl px-3 ${GOOGLE_SOFT_CARD_SUBTLE} ${compact ? "h-9 py-1.5" : "py-2"}`}>
        <p className={`${compact ? "text-[11px]" : "text-[11px]"} font-medium`}>{attribute.label}</p>
        <Switch checked={Boolean(value)} onCheckedChange={(checked) => onChange(checked)} />
      </div>
    );
  }

  return (
    <Input
      className={compact ? "h-9 text-[10px] md:text-[10px] placeholder:text-[10px]" : "text-[10px] placeholder:text-[10px]"}
      type={attribute.dataType === "url" ? "url" : "text"}
      maxLength={attribute.attributeKey === EDUCATION_LAST_SCHOOL_ATTRIBUTE_KEY ? EDUCATION_LAST_SCHOOL_MAX_LENGTH : undefined}
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder={attribute.label}
    />
  );
};

export default AttributeInput;
