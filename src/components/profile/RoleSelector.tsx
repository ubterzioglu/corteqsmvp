// B6 · 3 adımlı rol seçici (ana rol → alt rol → uzmanlık)
import { useState, useMemo } from "react";
import { Check, ChevronRight, ChevronLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  useRoleStructureByAnaRol,
  ANA_ROL_OPTIONS,
  type RoleStructureEntry,
} from "@/hooks/useRoleStructure";

type RoleSelectorStep = 1 | 2 | 3;

export type RoleSelection = {
  anaRol: string;
  altRol: string;
  yeniKod: string;
  uzmanliklar: string[]; // specialty_slug listesi
};

type RoleSelectorProps = {
  value: RoleSelection | null;
  onChange: (selection: RoleSelection | null) => void;
  disabled?: boolean;
};

export function RoleSelector({ value, onChange, disabled }: RoleSelectorProps) {
  const [step, setStep] = useState<RoleSelectorStep>(1);
  const [selectedAnaRol, setSelectedAnaRol] = useState<string | null>(value?.anaRol || null);
  const [selectedAltRol, setSelectedAltRol] = useState<string | null>(null);
  const [selectedUzmanliklar, setSelectedUzmanliklar] = useState<string[]>(value?.uzmanliklar || []);

  const { data: roleStructure } = useRoleStructureByAnaRol(selectedAnaRol);

  // Alt rol listesi (benzersiz)
  const altRoller = useMemo(() => {
    if (!roleStructure) return [];
    const seen = new Set<string>();
    return roleStructure.filter((r) => {
      if (seen.has(r.alt_rol)) return false;
      seen.add(r.alt_rol);
      return true;
    });
  }, [roleStructure]);

  // Seçili alt rolün uzmanlıkları
  const uzmanliklar = useMemo(() => {
    if (!roleStructure || !selectedAltRol) return [];
    return roleStructure
      .filter((r) => r.alt_rol === selectedAltRol && r.uzmanlik)
      .map((r) => ({ slug: r.yeni_kod, label: r.uzmanlik }));
  }, [roleStructure, selectedAltRol]);

  const handleAnaRolSelect = (anaRol: string) => {
    setSelectedAnaRol(anaRol);
    setSelectedAltRol(null);
    setSelectedUzmanliklar([]);
    setStep(2);
  };

  const handleAltRolSelect = (altRol: string) => {
    setSelectedAltRol(altRol);
    setStep(3);
  };

  const handleUzmanlikToggle = (slug: string) => {
    setSelectedUzmanliklar((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleComplete = () => {
    if (selectedAnaRol && selectedAltRol) {
      // yeni_kod bul
      const entry = roleStructure?.find((r) => r.alt_rol === selectedAltRol);
      if (entry) {
        onChange({
          anaRol: selectedAnaRol,
          altRol: selectedAltRol,
          yeniKod: entry.yeni_kod,
          uzmanliklar: selectedUzmanliklar,
        });
      }
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedAnaRol(null);
      setSelectedAltRol(null);
      setSelectedUzmanliklar([]);
    } else if (step === 3) {
      setStep(2);
      setSelectedAltRol(null);
      setSelectedUzmanliklar([]);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedAnaRol(null);
    setSelectedAltRol(null);
    setSelectedUzmanliklar([]);
    onChange(null);
  };

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className={cn(step === 1 && "font-semibold text-foreground")}>1. Ana Rol</span>
        <ChevronRight className="h-4 w-4" />
        <span className={cn(step === 2 && "font-semibold text-foreground")}>2. Alt Rol</span>
        <ChevronRight className="h-4 w-4" />
        <span className={cn(step === 3 && "font-semibold text-foreground")}>3. Uzmanlık</span>
      </div>

      {/* Step 1: Ana Rol */}
      {step === 1 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {ANA_ROL_OPTIONS.map((option) => (
            <Button
              key={option.key}
              variant="outline"
              disabled={disabled}
              className={cn(
                "h-auto flex-col items-start gap-1 p-4 text-left",
                selectedAnaRol === option.key && "border-primary bg-primary/5"
              )}
              onClick={() => handleAnaRolSelect(option.key)}
            >
              <span className="font-semibold">{option.label}</span>
              {option.description && (
                <span className="text-xs text-muted-foreground">{option.description}</span>
              )}
            </Button>
          ))}
        </div>
      )}

      {/* Step 2: Alt Rol */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold">{selectedAnaRol}</span>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between" disabled={disabled}>
                <span className="truncate">{selectedAltRol || "Alt rol seç..."}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput placeholder="Alt rol ara..." />
                <CommandList>
                  <CommandEmpty>Alt rol bulunamadı.</CommandEmpty>
                  <CommandGroup>
                    {altRoller.map((role) => (
                      <CommandItem
                        key={role.alt_rol}
                        value={role.alt_rol}
                        onSelect={() => handleAltRolSelect(role.alt_rol)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedAltRol === role.alt_rol ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {role.alt_rol}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Step 3: Uzmanlık */}
      {step === 3 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold">{selectedAltRol}</span>
          </div>
          {uzmanliklar.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {uzmanliklar.map((u) => (
                <Badge
                  key={u.slug}
                  variant={selectedUzmanliklar.includes(u.slug) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleUzmanlikToggle(u.slug)}
                >
                  {u.label}
                  {selectedUzmanliklar.includes(u.slug) && (
                    <Check className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Bu alt rol için uzmanlık bulunmuyor. "Tamamla"ya basarak devam edin.
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleComplete} disabled={disabled}>
              Tamamla
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Sıfırla
            </Button>
          </div>
        </div>
      )}

      {/* Selection summary */}
      {value && (
        <div className="rounded-lg border bg-muted/50 p-3 text-sm">
          <div className="flex items-center justify-between">
            <span>
              <strong>{value.anaRol}</strong> → {value.altRol}
            </span>
            <Button variant="ghost" size="icon" onClick={handleReset}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {value.uzmanliklar.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {value.uzmanliklar.map((slug) => {
                const label = uzmanliklar.find((u) => u.slug === slug)?.label || slug;
                return (
                  <Badge key={slug} variant="secondary" className="text-xs">
                    {label}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
