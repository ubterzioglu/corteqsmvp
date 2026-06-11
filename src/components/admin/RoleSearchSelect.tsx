import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type RoleOption = {
  value: string;
  label: string;
  hint?: string;
  searchText?: string;
};

type RoleSearchSelectProps = {
  roles: RoleOption[];
  value: string;
  onValueChange: (roleKey: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

const RoleSearchSelect = ({
  roles,
  value,
  onValueChange,
  placeholder = "Rol seç...",
  disabled = false,
  className,
}: RoleSearchSelectProps) => {
  const [open, setOpen] = useState(false);

  const selectedRole = roles.find((r) => r.value === value);

  // Alphabetical order by label, keeping the "no role" option pinned to top.
  const sortedRoles = [...roles].sort((a, b) => {
    if (a.value === "no_role") return -1;
    if (b.value === "no_role") return 1;
    return a.label.localeCompare(b.label, "tr", { sensitivity: "base" });
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="truncate">
            {selectedRole ? selectedRole.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto min-w-[var(--radix-popover-trigger-width)] max-w-[min(480px,90vw)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Rol ara..." />
          <CommandList>
            <CommandEmpty>Rol bulunamadı.</CommandEmpty>
            <CommandGroup>
              {sortedRoles.map((role) => (
                <CommandItem
                  key={role.value}
                  value={`${role.label} ${role.hint ?? ""} ${role.searchText ?? ""}`.trim()}
                  onSelect={() => {
                    onValueChange(role.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === role.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="flex-1 truncate">{role.label}</span>
                  {role.hint ? (
                    <span className="ml-2 shrink-0 text-[10px] text-muted-foreground">
                      {role.hint}
                    </span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default RoleSearchSelect;
