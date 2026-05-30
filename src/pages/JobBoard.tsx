import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Search, MapPin, Building2, Clock, Filter } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { countryCities } from "@/data/countryCities";
import JobApplyDialog from "@/components/JobApplyDialog";

type Listing = {
  id: string;
  title: string;
  business_name: string | null;
  hide_business_name: boolean | null;
  department: string | null;
  employment_type: string;
  location_type: string;
  country: string | null;
  city: string | null;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  description: string | null;
  package: string;
  created_at: string;
  expires_at: string | null;
};

const JobBoard = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState<string>("all");
  const [city, setCity] = useState<string>("all");
  const [keyword, setKeyword] = useState("");
  const [applyTarget, setApplyTarget] = useState<Listing | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("job_listings")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      setListings((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const countries = useMemo(() => {
    const set = new Set<string>();
    listings.forEach((l) => l.country && set.add(l.country));
    return Array.from(set).sort();
  }, [listings]);

  const cityOptions = useMemo(() => {
    if (country === "all") return [];
    const fromData = (countryCities[country] || []).slice().sort();
    const fromListings = Array.from(new Set(listings.filter((l) => l.country === country).map((l) => l.city).filter(Boolean) as string[]));
    return Array.from(new Set([...fromData, ...fromListings])).sort();
  }, [country, listings]);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return listings.filter((l) => {
      if (country !== "all" && l.country !== country) return false;
      if (city !== "all" && l.city !== city) return false;
      if (k && !l.title.toLowerCase().includes(k)) return false;
      return true;
    });
  }, [listings, country, city, keyword]);

  const formatSalary = (l: Listing) => {
    if (!l.salary_min && !l.salary_max) return null;
    const sym = l.currency === "EUR" ? "€" : l.currency === "USD" ? "$" : l.currency;
    return `${sym}${l.salary_min || "?"} - ${sym}${l.salary_max || "?"}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 pt-24 pb-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">İş İlanları</h1>
              <p className="text-sm text-muted-foreground">Diaspora işletmelerinin tüm açık pozisyonları</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 mb-6 shadow-card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="İlan başlığında ara…"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={country} onValueChange={(v) => { setCountry(v); setCity("all"); }}>
              <SelectTrigger><SelectValue placeholder="Ülke" /></SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                <SelectItem value="all">Tüm Ülkeler</SelectItem>
                {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={city} onValueChange={setCity} disabled={country === "all"}>
              <SelectTrigger><SelectValue placeholder={country === "all" ? "Önce ülke seçin" : `Tüm Şehirler - ${country}`} /></SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                <SelectItem value="all">{country === "all" ? "Tüm Şehirler" : `Tüm Şehirler - ${country}`}</SelectItem>
                {cityOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            {filtered.length} ilan bulundu
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Yükleniyor…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
            <Briefcase className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="font-medium text-foreground">Bu kriterlere uygun ilan bulunamadı.</p>
            <p className="text-sm text-muted-foreground mt-1">Filtreleri değiştirip tekrar deneyin.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((l) => (
              <div key={l.id} className="bg-card border border-border rounded-2xl p-5 shadow-card hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-lg font-semibold text-foreground">{l.title}</h3>
                      {l.package === "premium" && <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/30 text-[10px]">Premium</Badge>}
                      {l.package === "featured" && <Badge className="bg-primary/10 text-primary border border-primary/30 text-[10px]">Spotlight</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                      {!l.hide_business_name && l.business_name && (
                        <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{l.business_name}</span>
                      )}
                      {l.hide_business_name && (
                        <span className="flex items-center gap-1 italic"><Building2 className="h-3.5 w-3.5" />Gizli işveren</span>
                      )}
                      {(l.city || l.country) && (
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{[l.city, l.country].filter(Boolean).join(", ")}</span>
                      )}
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{l.employment_type}</span>
                      {l.location_type === "remote" && <Badge variant="outline" className="text-[10px]">Remote</Badge>}
                      {l.location_type === "hybrid" && <Badge variant="outline" className="text-[10px]">Hybrid</Badge>}
                    </div>
                    {l.description && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{l.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {formatSalary(l) && (
                      <span className="text-sm font-semibold text-foreground">{formatSalary(l)}</span>
                    )}
                    <Button size="sm" onClick={() => setApplyTarget(l)}>Başvur</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      {applyTarget && (
        <JobApplyDialog
          open={!!applyTarget}
          onOpenChange={(o) => !o && setApplyTarget(null)}
          listing={{ id: applyTarget.id, title: applyTarget.title }}
        />
      )}
    </div>
  );
};

export default JobBoard;
