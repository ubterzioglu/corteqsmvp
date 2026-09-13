import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categoryOptions, languageOptions, originOptions } from "@/lib/whatsapp-landing-options";
import type { LandingCategory, LandingLanguage, LandingOrigin } from "@/lib/whatsapp-landings";

export type ApprovalFilter = "member" | "admin" | "";

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
  origin: LandingOrigin | "";
  onOriginChange: (value: LandingOrigin | "") => void;
  language: LandingLanguage | "";
  onLanguageChange: (value: LandingLanguage | "") => void;
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
  origin,
  onOriginChange,
  language,
  onLanguageChange,
}: CommunityFiltersProps) {
  return (
    <>
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          className="pl-9"
          placeholder="Topluluk ara!"
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

        <Select value={approval || "__all__"} onValueChange={(v) => onApprovalChange(v === "__all__" ? "" : (v as "member" | "admin"))}>
          <SelectTrigger className="w-[180px]" aria-label="Onay tipi filtresi">
            <SelectValue placeholder="Onay Tipi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tüm Onaylar</SelectItem>
            <SelectItem value="admin">Admin onaylı</SelectItem>
            <SelectItem value="member">Kullanıcı onaylı</SelectItem>
          </SelectContent>
        </Select>

        <Select value={origin || "__all__"} onValueChange={(v) => onOriginChange(v === "__all__" ? "" : (v as LandingOrigin))}>
          <SelectTrigger className="w-[130px]" aria-label="Bölge filtresi">
            <SelectValue placeholder="Bölge" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tüm Bölgeler</SelectItem>
            {originOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={language || "__all__"} onValueChange={(v) => onLanguageChange(v === "__all__" ? "" : (v as LandingLanguage))}>
          <SelectTrigger className="w-[130px]" aria-label="Dil filtresi">
            <SelectValue placeholder="Dil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tüm Diller</SelectItem>
            {languageOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
