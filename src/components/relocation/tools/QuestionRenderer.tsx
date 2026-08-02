// Soru tipine göre input — QuestionStepper tarafından kullanılır.
// answer_type: single|multi|scale|number|currency|text|date|country|city|profession|consent.

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { useGeoCountries } from "@/hooks/useGeo";
import { TOOLS_UI_COPY } from "@/lib/relocation-tools-copy";
import { cn } from "@/lib/utils";
import type {
  RelocationToolQuestionRow,
  ToolQuestionOption,
  ToolAnswerValue,
} from "@/lib/relocation-tools-types";

interface QuestionRendererProps {
  question: RelocationToolQuestionRow;
  value: ToolAnswerValue | undefined;
  onChange: (value: ToolAnswerValue) => void;
}

const MAX_COUNTRY_SELECTION = 5;
const CITY_ANY_VALUE = "Şehir fark etmez";

function parseCountryCodes(value: ToolAnswerValue | undefined): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function ProfessionCombobox({
  id,
  options,
  value,
  onChange,
}: {
  id: string;
  options: ToolQuestionOption[];
  value: ToolAnswerValue | undefined;
  onChange: (value: ToolAnswerValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = typeof value === "string" ? value : "";
  const selectedLabel = options.find((opt) => opt.value === selected)?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Meslek seç"
          className="h-auto min-h-11 w-full justify-between gap-3 whitespace-normal px-3 py-2 text-left font-normal"
        >
          <span className={cn("truncate", !selectedLabel && "text-muted-foreground")}>
            {selectedLabel ?? "Meslek seç veya ara"}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Meslek ara..." />
          <CommandList>
            <CommandEmpty>
              Bu meslek için veri yoksa sonuç çıkmayabilir. Listedeki en yakın rolü seç.
            </CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={`${opt.label} ${opt.value}`}
                  onSelect={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected === opt.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span>{opt.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function CountryMultiCombobox({
  id,
  value,
  onChange,
}: {
  id: string;
  value: ToolAnswerValue | undefined;
  onChange: (value: ToolAnswerValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const countriesQuery = useGeoCountries(true);
  const countries = useMemo(() => countriesQuery.data ?? [], [countriesQuery.data]);
  const selectedCodes = parseCountryCodes(value);
  const selectedSet = useMemo(() => new Set(selectedCodes), [selectedCodes]);

  const countryByCode = useMemo(
    () => new Map(countries.map((country) => [country.code, country])),
    [countries],
  );

  const commit = (next: string[]) => onChange(next.join(","));
  const toggle = (code: string) => {
    if (selectedSet.has(code)) {
      commit(selectedCodes.filter((selected) => selected !== code));
      return;
    }
    if (selectedCodes.length >= MAX_COUNTRY_SELECTION) return;
    commit([...selectedCodes, code]);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Ülke seç"
            className="h-auto min-h-11 w-full justify-between gap-3 whitespace-normal px-3 py-2 text-left font-normal"
          >
            <span className={cn(!selectedCodes.length && "text-muted-foreground")}>
              {selectedCodes.length
                ? `${selectedCodes.length} ülke seçildi`
                : "Ülke seç veya ara"}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Ülke ara..." />
            <CommandList>
              <CommandEmpty>Ülke bulunamadı.</CommandEmpty>
              <CommandGroup>
                {selectedCodes.length >= MAX_COUNTRY_SELECTION && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    En fazla 5 ülke seçebilirsin.
                  </div>
                )}
                {countries.map((country) => {
                  const selected = selectedSet.has(country.code);
                  const disabled = !selected && selectedCodes.length >= MAX_COUNTRY_SELECTION;
                  return (
                    <CommandItem
                      key={country.code}
                      value={`${country.name} ${country.code}`}
                      disabled={disabled}
                      onSelect={() => {
                        toggle(country.code);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span>{country.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{country.code}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedCodes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCodes.map((code) => {
            const label = countryByCode.get(code)?.name ?? code;
            return (
              <span
                key={code}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-xs text-foreground"
              >
                {label}
                <button
                  type="button"
                  className="rounded-sm text-muted-foreground hover:text-foreground"
                  aria-label={`${label} kaldır`}
                  onClick={() => commit(selectedCodes.filter((selected) => selected !== code))}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        En az 1, en fazla 5 ülke seç. Çok geniş seçim sonucu yavaşlatabilir.
      </p>
    </div>
  );
}

export function QuestionRenderer({ question, value, onChange }: QuestionRendererProps) {
  const { answer_type, options, id } = question;

  switch (answer_type) {
    case "single":
      if (question.question_key === "profession_title" && options.length > 0) {
        return <ProfessionCombobox id={id} options={options} value={value} onChange={onChange} />;
      }
      return (
        <div>
          <p className="mb-2 text-xs text-muted-foreground">{TOOLS_UI_COPY.selectHint}</p>
          <RadioGroup
            value={typeof value === "string" ? value : ""}
            onValueChange={onChange}
            className="space-y-2"
          >
            {options.map((opt) => (
              <label
                key={opt.value}
                htmlFor={`${id}-${opt.value}`}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent"
              >
                <RadioGroupItem id={`${id}-${opt.value}`} value={opt.value} />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </RadioGroup>
        </div>
      );

    case "multi": {
      const selected = Array.isArray(value) ? value : [];
      const toggle = (v: string, checked: boolean) =>
        onChange(checked ? [...selected, v] : selected.filter((x) => x !== v));
      return (
        <div>
          <p className="mb-2 text-xs text-muted-foreground">{TOOLS_UI_COPY.multiHint}</p>
          <div className="space-y-2">
            {options.map((opt) => (
              <label
                key={opt.value}
                htmlFor={`${id}-${opt.value}`}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent"
              >
                <Checkbox
                  id={`${id}-${opt.value}`}
                  checked={selected.includes(opt.value)}
                  onCheckedChange={(c) => toggle(opt.value, c === true)}
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    case "scale": {
      const current = typeof value === "number" ? value : 3;
      return (
        <div className="space-y-3">
          <Slider min={1} max={5} step={1} value={[current]} onValueChange={(v) => onChange(v[0])} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{TOOLS_UI_COPY.scaleLow}</span>
            <span className="font-semibold text-foreground">{current}</span>
            <span>{TOOLS_UI_COPY.scaleHigh}</span>
          </div>
        </div>
      );
    }

    case "number":
    case "currency":
      return (
        <Input
          type="number"
          inputMode="numeric"
          value={typeof value === "number" ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder={question.help_tr ?? ""}
        />
      );

    case "consent":
      return (
        <label
          htmlFor={id}
          className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3"
        >
          <Checkbox
            id={id}
            checked={value === true}
            onCheckedChange={(c) => onChange(c === true)}
          />
          <span className="text-sm">{question.help_tr ?? question.prompt_tr}</span>
        </label>
      );

    case "country":
      if (question.question_key === "target_countries") {
        return <CountryMultiCombobox id={id} value={value} onChange={onChange} />;
      }
      return (
        <div className="space-y-1">
          {question.help_tr && (
            <Label htmlFor={id} className="text-xs text-muted-foreground">
              {question.help_tr}
            </Label>
          )}
          <Input
            id={id}
            type="text"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );

    // text / date / city / profession → serbest metin fallback.
    default:
      return (
        <div className="space-y-2">
          {question.help_tr && (
            <Label htmlFor={id} className="text-xs text-muted-foreground">
              {question.help_tr}
            </Label>
          )}
          <Input
            id={id}
            type={answer_type === "date" ? "date" : "text"}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              question.question_key === "target_cities"
                ? "Örn: Berlin, Amsterdam veya Şehir fark etmez"
                : undefined
            }
          />
          {question.question_key === "target_cities" && (
            <Button
              type="button"
              variant="outline"
              className="h-9"
              onClick={() => onChange(CITY_ANY_VALUE)}
            >
              {CITY_ANY_VALUE}
            </Button>
          )}
        </div>
      );
  }
}
