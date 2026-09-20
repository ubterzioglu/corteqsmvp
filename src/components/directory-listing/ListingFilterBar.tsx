/**
 * Public liste sayfalarının filtre çubuğu: grup sekmeleri + arama + ülke/şehir.
 *
 * Ülke ve şehir seçenekleri GELEN VERİDEN türetilir, `geo_*` kataloglarından
 * değil — gerekçe `public-listing-filter.ts` dosya başında (özet: 9 kayıtlı bir
 * sayfada 251 ülkelik liste yanıltıcıdır ve katalogda bulunmayan şehirler
 * hiçbir filtreye düşmez).
 */

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RoleGroup } from "@/lib/directory-role-groups";
import type { FilterOption, ListingFilterState } from "@/lib/public-listing-filter";

interface ListingFilterBarProps {
  groups: readonly RoleGroup[];
  filter: ListingFilterState;
  onFilterChange: (next: ListingFilterState) => void;
  countryOptions: readonly FilterOption[];
  cityOptions: readonly FilterOption[];
  groupCounts: ReadonlyMap<string, number>;
  /** Arama alanının yer tutucusu — sayfaya göre değişir. */
  searchPlaceholder: string;
  /** Grup sekmeleri gizlenebilir (Şehir Elçileri'nde tek rol var). */
  showGroups?: boolean;
}

const ListingFilterBar = ({
  groups,
  filter,
  onFilterChange,
  countryOptions,
  cityOptions,
  groupCounts,
  searchPlaceholder,
  showGroups = true,
}: ListingFilterBarProps) => {
  const patch = (partial: Partial<ListingFilterState>) =>
    onFilterChange({ ...filter, ...partial });

  return (
    <div className="mb-8 space-y-4">
      {showGroups ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={filter.groupKey === "all" ? "default" : "outline"}
            size="sm"
            className="text-xs"
            onClick={() => patch({ groupKey: "all" })}
          >
            Tümü ({groupCounts.get("all") ?? 0})
          </Button>
          {groups.map((group) => {
            const count = groupCounts.get(group.key) ?? 0;
            return (
              <Button
                key={group.key}
                variant={filter.groupKey === group.key ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => patch({ groupKey: group.key })}
              >
                {group.label} ({count})
              </Button>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={filter.searchText}
            onChange={(event) => patch({ searchText: event.target.value })}
            placeholder={searchPlaceholder}
            className="pl-9"
            aria-label="Listede ara"
          />
        </div>

        {/* Ülke değişince şehir SIFIRLANIR — yoksa "Almanya + Dubai" gibi
            imkânsız bir kombinasyon kalır ve liste sessizce boş görünür. */}
        <Select
          value={filter.country}
          onValueChange={(value) => patch({ country: value, city: "all" })}
        >
          <SelectTrigger className="w-full sm:w-52" aria-label="Ülkeye göre süz">
            <SelectValue placeholder="Tüm Ülkeler" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">🌍 Tüm Ülkeler</SelectItem>
            {countryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label} ({option.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filter.city} onValueChange={(value) => patch({ city: value })}>
          <SelectTrigger className="w-full sm:w-52" aria-label="Şehre göre süz">
            <SelectValue placeholder="Tüm Şehirler" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Şehirler</SelectItem>
            {cityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label} ({option.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ListingFilterBar;
