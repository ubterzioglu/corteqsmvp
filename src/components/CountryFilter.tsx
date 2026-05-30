import { MapPin, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { countries } from "@/data/mock";

interface CountryFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const CountryFilter = ({ value, onChange }: CountryFilterProps) => {
  return (
    <div className="flex items-center gap-3">
      <MapPin className="h-5 w-5 text-primary" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[160px] bg-card border-border text-xs h-8">
          <SelectValue placeholder="Tüm Ülkeler" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border z-50">
          <SelectItem value="all">Tüm Ülkeler</SelectItem>
          {countries.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CountryFilter;
