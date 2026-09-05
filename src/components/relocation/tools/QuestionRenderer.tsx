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
import { useGeoCitiesForCountries, useGeoCountries } from "@/hooks/useGeo";
import { TOOLS_UI_COPY } from "@/lib/relocation-tools-copy";
import { trCompare, trFold, trIncludes } from "@/lib/text-normalization";
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
  /**
   * Şehir sorusunun ülke kapsamı — kullanıcının `target_countries` sorusuna verdiği
   * cevaptan türer (`cityScopeFromAnswers`, `QuestionStepper` geçirir). Boş dizi
   * "daraltma yok" demektir. Renderer başka hiçbir soruya bakmaz: cevap torbasının
   * tamamını buraya vermek yerine tek ve dar bir sözleşme tutuldu.
   */
  scopeCountryCodes?: string[];
}

const MAX_COUNTRY_SELECTION = 3;
const CITY_ANY_VALUE = "Şehir fark etmez";

// geo_cities 76.990 satır; tek ülke bile 7-13 bin şehre çıkabiliyor (DE ~7k, US ~13k).
// Veri çekimi zaten ülkeye göre daraltılır (listGeoCitiesForCountries → range() sayfalama,
// PostgREST'in 1000 satırda sessiz kesmesi orada çözülü), ama cmdk'ya binlerce öğe
// basmak listeyi kilitler: filtre sonrası yalnız ilk MAX_RENDERED_CITIES öğe render edilir.
const MAX_RENDERED_CITIES = 200;

// Ölçek (1-5) sorularında ön-seçili gelen orta değer. QuestionStepper bu değeri
// "cevap verilmiş" sayar ve dokunulmadan İleri'ye basılsa da aynen kaydeder —
// böylece ekranda görünen seçim ile kaydedilen cevap daima aynı olur.
export const SCALE_DEFAULT_VALUE = 3;

/** "DE, NL" → ["DE","NL"]. Hem ülke kodu hem şehir adı cevapları virgülle saklanır. */
function parseCsvList(value: ToolAnswerValue | undefined): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Aksan/Türkçe-i duyarsız eşitlik — "Munchen" ile "München" aynı şehirdir. */
function containsFolded(list: string[], candidate: string): boolean {
  const folded = trFold(candidate);
  return list.some((item) => trFold(item) === folded);
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
  const selectedCodes = parseCsvList(value);
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
                    En fazla {MAX_COUNTRY_SELECTION} ülke seçebilirsin.
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
        En az 1, en fazla {MAX_COUNTRY_SELECTION} ülke seç. Çok geniş seçim sonucu yavaşlatabilir.
      </p>
    </div>
  );
}

/**
 * Şehir sorusu — "önce ülke, sonra şehir" drill-down'u (revizyon 2b1c1960).
 *
 * Eskiden düz `<Input type="text">` idi: kullanıcı ISO kodu/şehir adını elle yazmak
 * zorundaydı ve yazım hatası sessizce kaydediliyordu. Artık ülke bir kademe daraltma
 * adımıdır ve şehirler `useGeoCitiesForCountries` ile YALNIZ o ülke(ler) için çekilir —
 * 76.990 satırlık geo_cities asla toptan indirilmez.
 *
 * Ülke seçimi bir KAPI DEĞİL, daraltmadır: ülke seçilmeden de arama kutusuna yazılıp
 * "elle ekle" ile katalogda olmayan şehir girilebilir. Böylece katalog boşluğu
 * (München/Böblingen gibi) kullanıcıyı tıkamaz.
 */
function CityDrilldownCombobox({
  id,
  value,
  onChange,
  scopeCountryCodes,
}: {
  id: string;
  value: ToolAnswerValue | undefined;
  onChange: (value: ToolAnswerValue) => void;
  scopeCountryCodes: string[];
}) {
  const [countryOpen, setCountryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [countryCode, setCountryCode] = useState("");

  const countriesQuery = useGeoCountries(true);
  const countries = useMemo(() => countriesQuery.data ?? [], [countriesQuery.data]);

  // Kullanıcı 1. adımda ülke seçtiyse O ülke geçerlidir; seçmediyse `target_countries`
  // cevabından gelen kapsam kullanılır. Kapsam da boşsa hiçbir şehir çekilmez (kanca
  // enabled=false) — 76.990 satırlık geo_cities asla toptan indirilmez.
  const activeCountryCodes = countryCode ? [countryCode] : scopeCountryCodes;
  const citiesQuery = useGeoCitiesForCountries(activeCountryCodes);

  const isAnyCity = typeof value === "string" && value.trim() === CITY_ANY_VALUE;
  const selectedCities = isAnyCity ? [] : parseCsvList(value);

  const selectedCountryName = countries.find((country) => country.code === countryCode)?.name ?? "";
  // Kapsam devredeyken tetik "hangi ülkeler" sorusunu cevaplamalı, yoksa kullanıcı
  // listeyi neyin daralttığını göremez ve ülkeyi gereksiz yere ikinci kez seçer.
  const countryTriggerLabel =
    selectedCountryName
    || (scopeCountryCodes.length ? `Seçtiğin ülkeler (${scopeCountryCodes.length})` : "");

  const visibleCountries = useMemo(() => {
    const matched = countries.filter((country) =>
      trIncludes(`${country.name} ${country.code}`, countryQuery),
    );
    if (scopeCountryCodes.length === 0) return matched;
    // Kapsam ülkeleri BAŞA alınır, kapsam dışındakiler GİZLENMEZ: ülke bir kapı değil,
    // daraltmadır (aynı ilke serbest metin çıkışında da geçerli). Kullanıcı 4. soruda
    // yazmadığı bir ülkenin şehrini de arayabilmeli.
    const inScope = new Set(scopeCountryCodes);
    return [
      ...matched.filter((country) => inScope.has(country.code)),
      ...matched.filter((country) => !inScope.has(country.code)),
    ];
  }, [countries, countryQuery, scopeCountryCodes]);

  const cityNames = useMemo(() => {
    const names = (citiesQuery.data ?? []).map((city) => city.name).filter(Boolean);
    return Array.from(new Set(names)).sort(trCompare);
  }, [citiesQuery.data]);

  const matchedCities = useMemo(
    () => cityNames.filter((name) => trIncludes(name, cityQuery)),
    [cityNames, cityQuery],
  );
  const visibleCities = matchedCities.slice(0, MAX_RENDERED_CITIES);
  const hiddenCityCount = matchedCities.length - visibleCities.length;

  const typedCity = cityQuery.trim();
  // Katalogda karşılığı olmayan (ya da ülke henüz seçilmemiş) şehir için serbest metin çıkışı.
  const canAddTypedCity =
    typedCity.length > 0
    && !containsFolded(matchedCities, typedCity)
    && !containsFolded(selectedCities, typedCity);

  const commitCities = (next: string[]) => onChange(next.join(", "));

  const addCity = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || containsFolded(selectedCities, trimmed)) return;
    commitCities([...selectedCities, trimmed]);
    setCityQuery("");
  };

  // Kaldırma da aksan-duyarsız: kullanıcı "Munchen" yazıp eklediyse katalogdaki
  // "München" satırına tekrar tıklayınca seçim gerçekten kalkmalı.
  const removeCity = (name: string) => {
    const folded = trFold(name);
    commitCities(selectedCities.filter((city) => trFold(city) !== folded));
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor={`${id}-country`} className="text-xs text-muted-foreground">
          1. Ülke (listeyi daraltır)
        </Label>
        <Popover
          open={countryOpen}
          onOpenChange={(next) => {
            setCountryOpen(next);
            if (!next) setCountryQuery("");
          }}
        >
          <PopoverTrigger asChild>
            <Button
              id={`${id}-country`}
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={countryOpen}
              aria-label="Şehir için ülke seç"
              className="h-auto min-h-11 w-full justify-between gap-3 whitespace-normal px-3 py-2 text-left font-normal"
            >
              <span className={cn("truncate", !countryTriggerLabel && "text-muted-foreground")}>
                {countryTriggerLabel || "Ülke seç veya ara"}
              </span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Ülke ara..."
                value={countryQuery}
                onValueChange={setCountryQuery}
              />
              <CommandList>
                <CommandEmpty>Ülke bulunamadı.</CommandEmpty>
                <CommandGroup>
                  {visibleCountries.map((country) => (
                    <CommandItem
                      key={country.code}
                      value={country.code}
                      onSelect={() => {
                        setCountryCode(country.code === countryCode ? "" : country.code);
                        setCityQuery("");
                        setCountryOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          countryCode === country.code ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span>{country.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{country.code}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-1">
        <Label htmlFor={`${id}-city`} className="text-xs text-muted-foreground">
          2. Şehir (birden fazla seçebilirsin)
        </Label>
        <Popover
          open={cityOpen}
          onOpenChange={(next) => {
            setCityOpen(next);
            if (!next) setCityQuery("");
          }}
        >
          <PopoverTrigger asChild>
            <Button
              id={`${id}-city`}
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={cityOpen}
              aria-label="Şehir seç"
              className="h-auto min-h-11 w-full justify-between gap-3 whitespace-normal px-3 py-2 text-left font-normal"
            >
              <span className={cn("truncate", !selectedCities.length && "text-muted-foreground")}>
                {selectedCities.length
                  ? `${selectedCities.length} şehir seçildi`
                  : "Şehir seç veya yaz"}
              </span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Şehir ara veya yaz..."
                value={cityQuery}
                onValueChange={setCityQuery}
              />
              <CommandList>
                <CommandEmpty>
                  {activeCountryCodes.length
                    ? "Şehir bulunamadı. Yazdığın adı elle ekleyebilirsin."
                    : "Önce ülke seç ya da şehir adını yazıp elle ekle."}
                </CommandEmpty>
                <CommandGroup>
                  {canAddTypedCity && (
                    <CommandItem
                      value={`manual-${typedCity}`}
                      onSelect={() => addCity(typedCity)}
                    >
                      <Check className="mr-2 h-4 w-4 opacity-0" />
                      <span>{`"${typedCity}" şehrini elle ekle`}</span>
                    </CommandItem>
                  )}
                  {visibleCities.map((name) => {
                    const selected = containsFolded(selectedCities, name);
                    return (
                      <CommandItem
                        key={name}
                        value={name}
                        onSelect={() => (selected ? removeCity(name) : addCity(name))}
                      >
                        <Check
                          className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")}
                        />
                        <span>{name}</span>
                      </CommandItem>
                    );
                  })}
                  {hiddenCityCount > 0 && (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      +{hiddenCityCount} şehir daha — aramayı daraltmak için yazmaya devam et.
                    </div>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {selectedCities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCities.map((city) => (
            <span
              key={city}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-xs text-foreground"
            >
              {city}
              <button
                type="button"
                className="rounded-sm text-muted-foreground hover:text-foreground"
                aria-label={`${city} kaldır`}
                onClick={() => removeCity(city)}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant={isAnyCity ? "default" : "outline"}
        className="h-9"
        aria-pressed={isAnyCity}
        onClick={() => onChange(isAnyCity ? "" : CITY_ANY_VALUE)}
      >
        {CITY_ANY_VALUE}
      </Button>

      <p className="text-xs text-muted-foreground">
        {scopeCountryCodes.length && !countryCode
          ? "Şehir listesi daha önce seçtiğin ülkelerden geliyor. Tek ülkeye indirmek için yukarıdan seçebilir, listede olmayan şehri arama kutusuna yazıp elle ekleyebilirsin."
          : "Şehir listesi seçtiğin ülkeye göre daralır. Listede yoksa arama kutusuna yazıp elle ekleyebilirsin."}
      </p>
    </div>
  );
}

export function QuestionRenderer({
  question,
  value,
  onChange,
  scopeCountryCodes = [],
}: QuestionRendererProps) {
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
      // Ön-seçili varsayılan gösterilir. Radix, zaten seçili şıkka tıklandığında
      // onValueChange tetiklemez; bu yüzden varsayılanı QuestionStepper geçerli cevap sayar.
      const current = typeof value === "number" ? value : SCALE_DEFAULT_VALUE;
      return (
        <RadioGroup
          value={String(current)}
          onValueChange={(v) => onChange(Number(v))}
          className="space-y-2"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              htmlFor={`${id}-scale-${n}`}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent"
            >
              <RadioGroupItem id={`${id}-scale-${n}`} value={String(n)} />
              <span className="text-sm">
                {n}
                {n === 1 && ` — ${TOOLS_UI_COPY.scaleLow}`}
                {n === 5 && ` — ${TOOLS_UI_COPY.scaleHigh}`}
              </span>
            </label>
          ))}
        </RadioGroup>
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
    // İSTİSNA: target_cities (ve answer_type='city') artık ülke→şehir drill-down'u kullanır.
    default: {
      if (question.question_key === "target_cities" || answer_type === "city") {
        return (
          <CityDrilldownCombobox
            id={id}
            value={value}
            onChange={onChange}
            scopeCountryCodes={scopeCountryCodes}
          />
        );
      }
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
          />
        </div>
      );
    }
  }
}
