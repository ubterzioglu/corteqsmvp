import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdminCatalogFilters, AdminCatalogItemType, AdminCatalogRoleOption } from "@/lib/admin-catalog";
import { formatLabel } from "@/lib/admin-catalog-display";

const CatalogFiltersBar = ({
  filters,
  itemTypes,
  roles,
  statusOptions,
  verificationOptions,
  cityOptions,
  countryOptions,
  onFilterChange,
}: {
  filters: AdminCatalogFilters;
  itemTypes: AdminCatalogItemType[];
  roles: AdminCatalogRoleOption[];
  statusOptions: string[];
  verificationOptions: string[];
  cityOptions: string[];
  countryOptions: string[];
  onFilterChange: <K extends keyof AdminCatalogFilters>(key: K, value: AdminCatalogFilters[K]) => void;
}) => (
  <div className="space-y-3">
    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-inner">
      <Search className="h-4 w-4 shrink-0 text-slate-400" />
      <Input
        type="search"
        value={filters.query}
        onChange={(event) => onFilterChange("query", event.target.value)}
        placeholder="Başlık, slug, kategori veya kullanıcı ara"
        aria-label="Katalog araması"
        className="h-auto border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
      />
    </label>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      <Select value={filters.kind || "__all__"} onValueChange={(value) => onFilterChange("kind", value === "__all__" ? "" : (value as AdminCatalogFilters["kind"]))}>
        <SelectTrigger aria-label="Tür filtresi">
          <SelectValue placeholder="Tüm türler" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Tüm türler</SelectItem>
          <SelectItem value="catalog_item">Katalog</SelectItem>
          <SelectItem value="member_profile">Üye</SelectItem>
          <SelectItem value="profile">Kullanıcı</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.itemType || "__all__"} onValueChange={(value) => onFilterChange("itemType", value === "__all__" ? "" : value)}>
        <SelectTrigger aria-label="Item type filtresi">
          <SelectValue placeholder="Tüm tipler" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Tüm tipler</SelectItem>
          {itemTypes.map((itemType) => (
            <SelectItem key={itemType.key} value={itemType.key}>
              {itemType.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.platformRoleKey || "__all__"}
        onValueChange={(value) => onFilterChange("platformRoleKey", value === "__all__" ? "" : value)}
      >
        <SelectTrigger aria-label="Rol filtresi">
          <SelectValue placeholder="Tüm roller" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Tüm roller</SelectItem>
          {roles.map((role) => (
            <SelectItem key={role.key} value={role.key}>
              {role.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.status || "__all__"} onValueChange={(value) => onFilterChange("status", value === "__all__" ? "" : value)}>
        <SelectTrigger aria-label="Durum filtresi">
          <SelectValue placeholder="Tüm durumlar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Tüm durumlar</SelectItem>
          {statusOptions.map((status) => (
            <SelectItem key={status} value={status}>
              {formatLabel(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.verificationStatus || "__all__"}
        onValueChange={(value) => onFilterChange("verificationStatus", value === "__all__" ? "" : value)}
      >
        <SelectTrigger aria-label="Doğrulama filtresi">
          <SelectValue placeholder="Tüm doğrulamalar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Tüm doğrulamalar</SelectItem>
          {verificationOptions.map((status) => (
            <SelectItem key={status} value={status}>
              {formatLabel(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.city || "__all__"} onValueChange={(value) => onFilterChange("city", value === "__all__" ? "" : value)}>
        <SelectTrigger aria-label="Şehir filtresi">
          <SelectValue placeholder="Tüm şehirler" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Tüm şehirler</SelectItem>
          {cityOptions.map((city) => (
            <SelectItem key={city} value={city}>
              {city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.countryCode || "__all__"} onValueChange={(value) => onFilterChange("countryCode", value === "__all__" ? "" : value)}>
        <SelectTrigger aria-label="Ülke filtresi">
          <SelectValue placeholder="Tüm ülkeler" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Tüm ülkeler</SelectItem>
          {countryOptions.map((code) => (
            <SelectItem key={code} value={code}>
              {code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
);

export default CatalogFiltersBar;
