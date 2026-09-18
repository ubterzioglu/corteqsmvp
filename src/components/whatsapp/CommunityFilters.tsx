import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categoryOptions } from "@/lib/whatsapp-landing-options";
import type { LandingCategory } from "@/lib/whatsapp-landings";

export type ApprovalFilter = "admin" | "";

interface CommunityFiltersProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  cities: string[];
  category: LandingCategory | "";
  onCategoryChange: (value: LandingCategory | "") => void;
  city: string;
  onCityChange: (value: string) => void;
  approval: ApprovalFilter;
  onApprovalChange: (value: ApprovalFilter) => void;
}

export function CommunityFilters({
  searchQuery,
  onSearchQueryChange,
  cities,
  category,
  onCategoryChange,
  city,
  onCityChange,
  approval,
  onApprovalChange,
}: CommunityFiltersProps) {
  return (
    <>
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          className="pl-9"
          placeholder="Grup ara!"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Select value={category || "__all__"} onValueChange={(v) => onCategoryChange(v === "__all__" ? "" : (v as LandingCategory))}>
          <SelectTrigger className="w-[210px]" aria-label="Kategori filtresi">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tüm Kategoriler</SelectItem>
            {categoryOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={city || "__all__"} onValueChange={(v) => onCityChange(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-[140px]" aria-label="Şehir filtresi">
            <SelectValue placeholder="Şehir" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tüm Şehirler</SelectItem>
            {cities.map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={approval || "__all__"} onValueChange={(v) => onApprovalChange(v === "__all__" ? "" : "admin")}>
          <SelectTrigger className="w-[180px]" aria-label="Onay filtresi">
            <SelectValue placeholder="Onay Durumu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tüm Gruplar</SelectItem>
            <SelectItem value="admin">Admin onaylı</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
