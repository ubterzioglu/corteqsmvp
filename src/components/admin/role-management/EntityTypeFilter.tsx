import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ENTITY_KIND_LABELS, type EntityKind } from "@/lib/role-catalog";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  kind: EntityKind | "all";
  onKindChange: (value: EntityKind | "all") => void;
};

const KIND_OPTIONS: Array<{ value: EntityKind | "all" }> = [
  { value: "all" },
  { value: "attribute" },
  { value: "feature" },
  { value: "profile_section" },
];

const EntityTypeFilter = ({ search, onSearchChange, kind, onKindChange }: Props) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Ara (label, key, açıklama)…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="h-8 max-w-xs text-xs"
      />
      <Select value={kind} onValueChange={(v) => onKindChange(v as EntityKind | "all")}>
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {KIND_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {ENTITY_KIND_LABELS[opt.value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default EntityTypeFilter;
