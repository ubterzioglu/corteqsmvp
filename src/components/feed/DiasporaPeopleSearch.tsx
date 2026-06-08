import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Users, Filter, Briefcase, Plane, MapPin, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import SearchableCountrySelect from "@/components/SearchableCountrySelect";
import SearchableCitySelect from "@/components/SearchableCitySelect";
import { useGeoCountries } from "@/hooks/useGeo";

interface PersonRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  country: string | null;
  profession: string | null;
  job_seeking?: boolean | null;
  relocating_country?: string | null;
  relocating_city?: string | null;
  online?: boolean;
}

const MOCK_PEOPLE: PersonRow[] = [
  { id: "m1", full_name: "Berk Kural", avatar_url: null, city: "Berlin", country: "Almanya", profession: "Yazılım Mühendisi", job_seeking: false, online: true },
  { id: "m2", full_name: "Mert Demir", avatar_url: null, city: "Londra", country: "İngiltere", profession: "Pazarlama", job_seeking: true, online: true },
  { id: "m3", full_name: "Ayşe Yıldız", avatar_url: null, city: "Amsterdam", country: "Hollanda", profession: "UX Designer", job_seeking: false, relocating_country: "Almanya", relocating_city: "Münih" },
  { id: "m4", full_name: "Cem Aksoy", avatar_url: null, city: "İstanbul", country: "Türkiye", profession: "Doktor", job_seeking: false, relocating_country: "Kanada", relocating_city: "Toronto" },
  { id: "m5", full_name: "Deniz Kara", avatar_url: null, city: "Paris", country: "Fransa", profession: "Şef", job_seeking: true, online: true },
];

const PROFESSIONS = [
  "Yazılım & IT",
  "Mühendislik",
  "Sağlık (Doktor / Hemşire)",
  "Akademisyen / Araştırmacı",
  "Pazarlama & Satış",
  "Tasarım & UX",
  "Hukuk",
  "Finans & Muhasebe",
  "Eğitim / Öğretmen",
  "Şef / Gastronomi",
  "Sanat & Medya",
  "Girişimci",
  "Öğrenci",
  "Diğer",
];

const DiasporaPeopleSearch = () => {
  const countriesQuery = useGeoCountries();
  const [q, setQ] = useState("");
  const [country, setCountry] = useState<string>("all");
  const [city, setCity] = useState<string>("all");
  const [profession, setProfession] = useState<string>("all");
  const [filter, setFilter] = useState<"all" | "job" | "relocating">("all");
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Fetch all members via user_role_assignments
      const { data: uraData } = await supabase
        .from("user_role_assignments")
        .select("user_id")
        .limit(40);
      if (cancelled) return;
      const userIds = (uraData || []).map((u: any) => u.user_id);
      const { getProfilesBasicBatch, getAttributesBatch } = await import("@/lib/profile-helpers");
      const basicProfiles = await getProfilesBasicBatch(userIds);
      const attrsAll = await Promise.all(
        basicProfiles.map((p) => getAttributesBatch(p.user_id, ["city", "country", "profession"]))
      );
      const real: PersonRow[] = basicProfiles.map((p, i) => ({
        id: p.user_id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        city: attrsAll[i].city,
        country: attrsAll[i].country,
        profession: attrsAll[i].profession,
      }));
      // Online check
      let onlineIds = new Set<string>();
      if (real.length > 0) {
        const since = new Date(Date.now() - 4 * 3600 * 1000).toISOString();
        const { data: memberships } = await supabase
          .from("cafe_memberships")
          .select("user_id, joined_at")
          .gte("joined_at", since);
        (memberships as any[] | null)?.forEach((m) => onlineIds.add(m.user_id));
      }
      const merged: PersonRow[] = [
        ...real.map((p) => ({ ...p, online: onlineIds.has(p.id) })),
        ...MOCK_PEOPLE,
      ];
      setPeople(merged);
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    return people.filter((p) => {
      if (q && !(p.full_name || "").toLowerCase().includes(q.toLowerCase()) && !(p.profession || "").toLowerCase().includes(q.toLowerCase())) return false;
      if (country !== "all" && p.country !== country) return false;
      if (city !== "all" && p.city !== city) return false;
      if (profession !== "all" && !(p.profession || "").toLowerCase().includes(profession.split(" ")[0].toLowerCase())) return false;
      if (filter === "job" && !p.job_seeking) return false;
      if (filter === "relocating" && !p.relocating_country) return false;
      return true;
    });
  }, [people, q, country, city, profession, filter]);

  const visible = showAll ? filtered : filtered.slice(0, 5);

  return (
    <div className="space-y-2.5">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="İsim veya meslek ara..."
          className="h-8 pl-8 text-xs"
        />
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <SearchableCountrySelect
          value={country}
          onChange={(v) => { setCountry(v); setCity("all"); }}
          countries={["all", ...(countriesQuery.data ?? []).map((countryItem) => countryItem.name)]}
          placeholder="Ülke"
          size="xs"
          allowClear={false}
          includeAllOptionLabel="Tüm Ülkeler"
        />
        <SearchableCitySelect
          value={city}
          onChange={setCity}
          countryName={country === "all" ? undefined : country}
          placeholder={country === "all" ? "Önce ülke seçin" : `Tüm Şehirler - ${country}`}
          size="xs"
          allowClear={false}
          disabled={country === "all"}
          includeAllOptionLabel={country === "all" ? undefined : `Tüm Şehirler - ${country}`}
        />
        <Select value={profession} onValueChange={setProfession}>
          <SelectTrigger className="h-7 text-[11px]"><SelectValue placeholder="Meslek" /></SelectTrigger>
          <SelectContent className="max-h-64">
            <SelectItem value="all">🎓 Tüm Meslekler</SelectItem>
            {PROFESSIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        <Filter className="h-3 w-3 text-muted-foreground" />
        <button
          onClick={() => setFilter("all")}
          className={`text-[10px] px-2 py-0.5 rounded-full border ${filter === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}
        >Tümü</button>
        <button
          onClick={() => setFilter("job")}
          className={`text-[10px] px-2 py-0.5 rounded-full border inline-flex items-center gap-0.5 ${filter === "job" ? "bg-turquoise text-white border-turquoise" : "bg-card text-muted-foreground border-border hover:border-turquoise/40"}`}
        ><Briefcase className="h-2.5 w-2.5" /> İş Arayanlar</button>
        <button
          onClick={() => setFilter("relocating")}
          className={`text-[10px] px-2 py-0.5 rounded-full border inline-flex items-center gap-0.5 ${filter === "relocating" ? "bg-amber-500 text-white border-amber-500" : "bg-card text-muted-foreground border-border hover:border-amber-500/40"}`}
        ><Plane className="h-2.5 w-2.5" /> Taşınacaklar</button>
        {/* Meslek hızlı seçim chip'leri (top navigasyon) */}
        <span className="mx-1 h-3 w-px bg-border" />
        <GraduationCap className="h-3 w-3 text-muted-foreground" />
        {["Yazılım & IT", "Sağlık (Doktor / Hemşire)", "Mühendislik", "Pazarlama & Satış", "Akademisyen / Araştırmacı"].map((p) => (
          <button
            key={p}
            onClick={() => setProfession(profession === p ? "all" : p)}
            className={`text-[10px] px-2 py-0.5 rounded-full border ${profession === p ? "bg-violet-500 text-white border-violet-500" : "bg-card text-muted-foreground border-border hover:border-violet-500/40"}`}
          >{p.split(" ")[0]}</button>
        ))}
      </div>

    </div>
  );
};

export default DiasporaPeopleSearch;
