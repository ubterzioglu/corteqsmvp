import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Coffee, Calendar, Info, ShieldCheck, Users, Plane, Briefcase, Eye, EyeOff, Linkedin, FileText, Presentation, BadgeCheck, Cake, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/hooks/useFollow";
import CafeOpenCTA from "@/components/profiles/CafeOpenCTA";
import LanguagesCountriesBlock, { type CountryLived } from "@/components/profiles/LanguagesCountriesBlock";

interface Props {
  name: string;
  avatarInitials: string;
  email?: string | null;
  title?: string | null;
  tagline?: string;
  worldMessage?: string;
  city?: string;
  country?: string;
  corteqsPassport?: boolean;
  recentEvents: Array<{ id: string; title: string; date: string; city?: string; source: "joined" | "followed" }>;
  relocating?: { country?: string; city?: string } | null;
  isJobSeeking?: boolean;
  profileVisible?: boolean;
  linkedinUrl?: string | null;
  linkedinVisible?: boolean;
  cvDoc?: { path: string; name: string } | null;
  pptDoc?: { path: string; name: string } | null;
  onOpenCv?: () => void;
  onOpenPpt?: () => void;
}

const IndividualPublicCard = ({
  name,
  avatarInitials,
  email,
  title,
  tagline,
  worldMessage,
  city,
  country,
  corteqsPassport,
  recentEvents,
  relocating,
  isJobSeeking,
  profileVisible,
  linkedinUrl,
  linkedinVisible = true,
  cvDoc,
  pptDoc,
  onOpenCv,
  onOpenPpt,
}: Props) => {
  const { user } = useAuth();
  const { list } = useFollow();
  const [activeCafe, setActiveCafe] = useState<{ id: string; name: string; theme?: string } | null>(null);
  const [followers, setFollowers] = useState<number>(0);
  const [isVerified, setIsVerified] = useState(false);
  const [birthdayDays, setBirthdayDays] = useState<number | null>(null);
  const [acceptsGifts, setAcceptsGifts] = useState(false);
  const [languages, setLanguages] = useState<string[]>([]);
  const [countriesLived, setCountriesLived] = useState<CountryLived[]>([]);
  const [yearsInCity, setYearsInCity] = useState<number | null>(null);
  const followingCount = list("user").length;

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("cafe_memberships")
        .select("cafe_id, joined_at, cafes:cafe_id(id, name, theme, closes_at)")
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false })
        .limit(1);
      if (cancelled) return;
      const row: any = data?.[0];
      if (row?.cafes && new Date(row.cafes.closes_at).getTime() > Date.now()) {
        setActiveCafe({ id: row.cafes.id, name: row.cafes.name, theme: row.cafes.theme });
      }
      const { count } = await supabase
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user.id);
      if (!cancelled) setFollowers(count || 0);
      const { data: prof } = await supabase
        .from("profiles")
        .select("is_verified, birth_date, birthday_reminder_enabled, gift_acceptance_enabled, languages_spoken, countries_lived, years_in_current_city")
        .eq("id", user.id)
        .maybeSingle();
      if (!cancelled && prof?.is_verified) setIsVerified(true);
      if (!cancelled && (prof as any)?.gift_acceptance_enabled) setAcceptsGifts(true);
      if (!cancelled) {
        const ls = (prof as any)?.languages_spoken;
        if (Array.isArray(ls)) setLanguages(ls);
        const cl = (prof as any)?.countries_lived;
        if (Array.isArray(cl)) setCountriesLived(cl as CountryLived[]);
        const yc = (prof as any)?.years_in_current_city;
        if (typeof yc === "number") setYearsInCity(yc);
      }
      if (!cancelled && prof?.birth_date && (prof as any).birthday_reminder_enabled) {
        const bd = new Date(prof.birth_date as string);
        const now = new Date();
        const next = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
        if (next.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) {
          next.setFullYear(now.getFullYear() + 1);
        }
        const days = Math.round((next.getTime() - now.getTime()) / 86400000);
        if (days >= 0 && days <= 14) setBirthdayDays(days);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  return (
    <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-card mb-6">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xl md:text-2xl shrink-0">
          {avatarInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl md:text-2xl font-bold text-foreground inline-flex items-center gap-1.5">
              {name}
              {isVerified && <BadgeCheck className="h-5 w-5 text-blue-500 fill-blue-500/20" aria-label="Onaylı Hesap" />}
            </h2>
            {isJobSeeking && (
              <Badge className="bg-turquoise/15 text-turquoise border-turquoise/30 gap-1 text-[11px]">
                <Briefcase className="h-3 w-3" /> İş Arıyorum
              </Badge>
            )}
            {profileVisible !== undefined && (
              profileVisible ? (
                <Badge variant="outline" className="gap-1 text-[11px]"><Eye className="h-3 w-3" /> Profil Açık</Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-[11px] text-muted-foreground"><EyeOff className="h-3 w-3" /> Profil Gizli</Badge>
              )
            )}
            {corteqsPassport && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="gap-1 bg-amber-500/15 text-amber-700 border-amber-500/30 text-[11px]">
                      <ShieldCheck className="h-3 w-3" /> CorteQS Pasaportu
                      <Info className="h-3 w-3 opacity-70" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Yabancı telefon ile kayıt olan diaspora üyelerine verilen dijital kimliktir.
                    Profilini doğrulanmış olarak gösterir; etkinlik ve hizmetlerde öncelik sağlar.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <CafeOpenCTA userId={user?.id} />
            {birthdayDays !== null && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-pink-600 bg-pink-500/10 border border-pink-500/30 rounded-full px-2 py-0.5">
                <Cake className="h-3 w-3" />
                {birthdayDays === 0 ? "Bugün doğum günü!" : `Doğum gününe ${birthdayDays} gün`}
              </span>
            )}
          </div>

          {(acceptsGifts || birthdayDays !== null) && (
            <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-pink-500/30 bg-gradient-to-r from-pink-500/10 to-amber-500/10 px-3 py-2 flex-wrap">
              <div className="flex items-center gap-2 text-sm">
                <Gift className="h-4 w-4 text-pink-600" />
                <span className="text-foreground/90">
                  {birthdayDays !== null
                    ? `${name.split(" ")[0]}'in doğum günü yaklaşıyor — bir sürpriz hazırla.`
                    : `${name.split(" ")[0]} hediye kabul ediyor.`}
                </span>
              </div>
              <Button
                size="sm"
                disabled
                title="Yakında aktif olacak"
                className="gap-1.5 bg-gradient-to-r from-pink-500 to-amber-500 text-white opacity-80 cursor-not-allowed"
              >
                <Gift className="h-3.5 w-3.5" /> Discount Kupon Hediye Et
                <span className="ml-1 text-[10px] bg-white/20 rounded px-1 py-0.5">Yakında</span>
              </Button>
            </div>
          )}

          {(title || email) && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {[title, email].filter(Boolean).join(" · ")}
            </p>
          )}
          {tagline && <p className="text-sm text-muted-foreground italic mt-0.5">"{tagline}"</p>}

          <div className="flex items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> <strong className="text-foreground">{followers}</strong> takipçi</span>
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> <strong className="text-foreground">{followingCount}</strong> takip</span>
            {(city || country) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {[city, country].filter(Boolean).join(", ")}
                {yearsInCity ? <span className="text-muted-foreground">· {yearsInCity} yıldır</span> : null}
              </span>
            )}
          </div>

          {(linkedinUrl && linkedinVisible) || cvDoc || pptDoc ? (
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {linkedinUrl && linkedinVisible && (
                <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                </a>
              )}
              {cvDoc && onOpenCv && (
                <button onClick={onOpenCv} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                  <FileText className="h-3.5 w-3.5" /> CV
                </button>
              )}
              {pptDoc && onOpenPpt && (
                <button onClick={onOpenPpt} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                  <Presentation className="h-3.5 w-3.5" /> Sunum
                </button>
              )}
            </div>
          ) : null}

          {relocating && (relocating.country || relocating.city) && (
            <Badge className="mt-2 gap-1 bg-amber-500/15 text-amber-700 border-amber-500/30">
              <Plane className="h-3 w-3" /> Yakında taşınacak: {[relocating.city, relocating.country].filter(Boolean).join(", ")}
            </Badge>
          )}

          <LanguagesCountriesBlock languages={languages} countries={countriesLived} />



          {worldMessage && (
            <div className="mt-3 rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground/90">
              <span className="text-xs font-semibold text-primary mr-2">Profil Mesajım:</span>
              {worldMessage}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default IndividualPublicCard;
