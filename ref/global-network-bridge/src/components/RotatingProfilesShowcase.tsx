import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface ProfileMini {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  tag_line: string | null;
  city: string | null;
  country: string | null;
  account_type: string | null;
}

const initialsOf = (name?: string | null) =>
  (name || "Ü")
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const Card = ({ p }: { p: ProfileMini }) => (
  <Link
    to={`/cadde`}
    className="block bg-card rounded-2xl border border-border p-4 shadow-card hover:shadow-card-hover transition-all hover:-translate-y-0.5 h-full"
  >
    <div className="flex items-start gap-3">
      {p.avatar_url ? (
        <img src={p.avatar_url} alt={p.full_name || ""} className="w-14 h-14 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">
          {initialsOf(p.full_name)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-foreground truncate">{p.full_name || "Üye"}</h3>
        {p.tag_line && (
          <p className="text-xs text-muted-foreground italic line-clamp-1 mt-0.5">"{p.tag_line}"</p>
        )}
        {(p.city || p.country) && (
          <div className="flex items-center gap-1 mt-1.5 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {[p.city, p.country].filter(Boolean).join(", ")}
          </div>
        )}
      </div>
    </div>
    {p.account_type && (
      <Badge variant="outline" className="mt-2 text-[10px]">{p.account_type}</Badge>
    )}
  </Link>
);

const RotatingProfilesShowcase = () => {
  const [profiles, setProfiles] = useState<ProfileMini[]>([]);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, tag_line, city, country, account_type")
        .eq("onboarding_completed", true)
        .not("city", "is", null)
        .not("country", "is", null)
        .limit(45);
      if (cancelled) return;
      // Shuffle for variety
      const shuffled = [...(data || [])].sort(() => Math.random() - 0.5);
      setProfiles(shuffled);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (profiles.length <= 9) return;
    const t = setInterval(() => setOffset((o) => (o + 3) % profiles.length), 4000);
    return () => clearInterval(t);
  }, [profiles.length]);

  if (profiles.length === 0) return null;

  // Get 9 visible profiles in a rotating window
  const visible: ProfileMini[] = [];
  for (let i = 0; i < Math.min(9, profiles.length); i++) {
    visible.push(profiles[(offset + i) % profiles.length]);
  }

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6 max-w-6xl mx-auto">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 text-xs font-semibold mb-2">
            <Sparkles className="h-3.5 w-3.5" /> Diaspora Topluluğu
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
            <Users className="h-6 w-6 text-sky-500" /> Diasporadan İnsanlar
          </h2>
        </div>
        <Link to="/diaspora-people" className="text-sm text-primary font-semibold hover:underline">
          Tümünü gör →
        </Link>
      </div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 transition-all duration-700">
        {visible.map((p, i) => (
          <div key={`${p.id}-${i}`} className="animate-fade-in">
            <Card p={p} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default RotatingProfilesShowcase;
