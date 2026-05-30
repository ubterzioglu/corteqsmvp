import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Coffee, Calendar, Info, ShieldCheck, Users, Heart, Plane, Briefcase, Eye, EyeOff, Linkedin, FileText, Presentation } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/hooks/useFollow";

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
            <h2 className="text-xl md:text-2xl font-bold text-foreground">{name}</h2>
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
          </div>

          {(title || email) && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {[title, email].filter(Boolean).join(" · ")}
            </p>
          )}
          {tagline && <p className="text-sm text-muted-foreground italic mt-0.5">"{tagline}"</p>}

          <div className="flex items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> <strong className="text-foreground">{followers}</strong> takipçi</span>
            <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> <strong className="text-foreground">{followingCount}</strong> takip</span>
            {(city || country) && (
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {[city, country].filter(Boolean).join(", ")}</span>
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

          {worldMessage && (
            <div className="mt-3 rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground/90">
              <span className="text-xs font-semibold text-primary mr-2">Profil Mesajım:</span>
              {worldMessage}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-border p-3">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Son 2 ayda etkinlikler</span>
          </div>
          {recentEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground">Henüz etkinlik yok.</p>
          ) : (
            <ul className="space-y-1">
              {recentEvents.slice(0, 4).map((e) => (
                <li key={e.id} className="text-xs flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">{e.source === "joined" ? "Katıldı" : "Takip"}</Badge>
                  <span className="truncate">{e.title}</span>
                  <span className="text-muted-foreground ml-auto shrink-0">{e.date}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border p-3">
          <div className="flex items-center gap-2 mb-2">
            <Coffee className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-semibold">Cadde'de Takılıyor</span>
          </div>
          {activeCafe ? (
            <Link to={`/cadde/${activeCafe.id}`} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              ☕ {activeCafe.name}{activeCafe.theme ? ` · ${activeCafe.theme}` : ""}
            </Link>
          ) : (
            <p className="text-xs text-muted-foreground">Şu an aktif bir cafe'de değil.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default IndividualPublicCard;
