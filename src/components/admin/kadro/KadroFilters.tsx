import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { KADRO_DEPTS, KADRO_WAVES, KADRO_WORK_TYPES, KADRO_STATUSES } from "@/lib/kadro/kadro-taxonomy";
import type { KadroFilters as KadroFiltersType } from "@/lib/kadro/kadro-view";
import { Download } from "lucide-react";

interface KadroFiltersProps {
  filters: KadroFiltersType;
  onChange: (filters: KadroFiltersType) => void;
  onExport: () => void;
}

export function KadroFilters({ filters, onChange, onExport }: KadroFiltersProps) {
  const updateFilter = (key: keyof KadroFiltersType, value: string | boolean) => {
    onChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onChange({
      q: "",
      dept: "",
      wave: "",
      type: "",
      status: "",
      openOnly: false,
    });
  };

  const hasActiveFilters = filters.q || filters.dept || filters.wave || filters.type || filters.status || filters.openOnly;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div className="md:col-span-2">
          <Input
            placeholder="Ara: pozisyon, sahip, KPI..."
            value={filters.q}
            onChange={(e) => updateFilter("q", e.target.value)}
            className="w-full"
          />
        </div>

        <Select value={filters.dept} onValueChange={(value) => updateFilter("dept", value === "all" ? "" : value)}>
          <SelectTrigger>
            <SelectValue placeholder="Departman" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Departmanlar</SelectItem>
            {KADRO_DEPTS.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.wave} onValueChange={(value) => updateFilter("wave", value === "all" ? "" : value)}>
          <SelectTrigger>
            <SelectValue placeholder="Dalga" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Dalgalar</SelectItem>
            {KADRO_WAVES.map((wave) => (
              <SelectItem key={wave.id} value={String(wave.id)}>
                {wave.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.type} onValueChange={(value) => updateFilter("type", value === "all" ? "" : value)}>
          <SelectTrigger>
            <SelectValue placeholder="Çalışma Tipi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Tipler</SelectItem>
            {Object.entries(KADRO_WORK_TYPES).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.status} onValueChange={(value) => updateFilter("status", value === "all" ? "" : value)}>
          <SelectTrigger>
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            {Object.entries(KADRO_STATUSES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.openOnly}
              onChange={(e) => updateFilter("openOnly", e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-600"
            />
            Sadece açık pozisyonlar
          </label>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Temizle
            </Button>
          )}
        </div>

        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="w-4 h-4 mr-2" />
          CSV İndir
        </Button>
      </div>
    </div>
  );
}
