import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Coffee,
  Calendar,
  Info,
  ShieldCheck,
  Users,
  Heart,
  Plane,
  Briefcase,
  Eye,
  EyeOff,
  Linkedin,
  FileText,
  Presentation,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const documentActions = [
    linkedinUrl && linkedinVisible
      ? {
          key: "linkedin",
          label: "LinkedIn",
          icon: Linkedin,
          kind: "link" as const,
          href: linkedinUrl,
        }
      : null,
    cvDoc && onOpenCv
      ? {
          key: "cv",
          label: "CV",
          icon: FileText,
          kind: "button" as const,
          onClick: onOpenCv,
        }
      : null,
    pptDoc && onOpenPpt
      ? {
          key: "ppt",
          label: "Sunum",
          icon: Presentation,
          kind: "button" as const,
          onClick: onOpenPpt,
        }
      : null,
  ].filter(Boolean);

  return (
    <section className="mb-6 overflow-hidden rounded-[28px] border border-border bg-card shadow-card">
      <div className="border-b border-border bg-[radial-gradient(circle_at_top_left,rgba(18,164,196,0.18),transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.04),rgba(15,23,42,0))] px-5 py-5 md:px-7 md:py-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-gradient-primary text-2xl font-bold text-primary-foreground shadow-lg md:h-24 md:w-24 md:text-3xl">
                {avatarInitials}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary">
                    <Sparkles className="mr-1 h-3 w-3" /> Bireysel Panelim
                  </Badge>
                  {isJobSeeking && (
                    <Badge className="border-turquoise/30 bg-turquoise/15 text-turquoise">
                      <Briefcase className="mr-1 h-3 w-3" /> İş Arıyorum
                    </Badge>
                  )}
                  {profileVisible !== undefined && (
                    profileVisible ? (
                      <Badge variant="outline" className="gap-1 text-[11px]">
                        <Eye className="h-3 w-3" /> Profil Açık
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-[11px] text-muted-foreground">
                        <EyeOff className="h-3 w-3" /> Profil Gizli
                      </Badge>
                    )
                  )}
                  {corteqsPassport && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className="gap-1 border-amber-500/30 bg-amber-500/15 text-amber-700 text-[11px]">
                            <ShieldCheck className="h-3 w-3" /> CorteQS Pasaportu
                            <Info className="h-3 w-3 opacity-70" />
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          Yabancı telefon ile kayıt olan diaspora üyelerine verilen dijital kimliktir.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{name}</h2>
                  {tagline ? (
                    <span className="rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                      {tagline}
                    </span>
                  ) : null}
                </div>

                {(title || email) && (
                  <p className="mt-1 truncate text-sm text-muted-foreground md:text-base">
                    {[title, email].filter(Boolean).join(" · ")}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <strong className="text-foreground">{followers}</strong> takipçi
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" />
                    <strong className="text-foreground">{followingCount}</strong> takip
                  </span>
                  {(city || country) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {[city, country].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>

                {documentActions.length > 0 ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {documentActions.map((action) => {
                      if (!action) return null;
                      const Icon = action.icon;
                      return action.kind === "link" ? (
                        <a
                          key={action.key}
                          href={action.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/85 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                        >
                          <Icon className="h-3.5 w-3.5" /> {action.label}
                        </a>
                      ) : (
                        <button
                          key={action.key}
                          onClick={action.onClick}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/85 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                        >
                          <Icon className="h-3.5 w-3.5" /> {action.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {relocating && (relocating.country || relocating.city) && (
                  <Badge className="mt-4 gap-1 border-amber-500/30 bg-amber-500/15 text-amber-700">
                    <Plane className="h-3 w-3" /> Yakında taşınacak: {[relocating.city, relocating.country].filter(Boolean).join(", ")}
                  </Badge>
                )}

                {worldMessage && (
                  <div className="mt-4 rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm text-foreground/90">
                    <span className="mr-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Profil Mesajım</span>
                    {worldMessage}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-border bg-background/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Ön İzleme</p>
                <h3 className="mt-1 text-lg font-bold text-foreground">Panel görünümü hazır</h3>
              </div>
              <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-border bg-card px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Takipçi</p>
                <p className="text-lg font-bold text-foreground">{followers}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Takip</p>
                <p className="text-lg font-bold text-foreground">{followingCount}</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-3 text-xs text-muted-foreground">
              Profil ayarlarında görünürlük, kariyer bağlantıları ve CV yüklemesini güncelledikçe bu kart ziyaretçi görünümünü daha iyi yansıtır.
            </div>
            <Button asChild variant="outline" className="mt-4 w-full justify-between">
              <Link to="/profile/bireysel?tab=settings">
                Profil ayarlarına git <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-5 md:grid-cols-2 md:p-6">
        <div className="rounded-[22px] border border-border bg-background/70 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Son 2 ayda etkinlikler</span>
          </div>
          {recentEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground">Henüz etkinlik yok.</p>
          ) : (
            <ul className="space-y-2">
              {recentEvents.slice(0, 4).map((event) => (
                <li key={event.id} className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-xs">
                  <Badge variant="secondary" className="text-[10px]">
                    {event.source === "joined" ? "Katıldı" : "Takip"}
                  </Badge>
                  <span className="min-w-0 flex-1 truncate text-foreground">{event.title}</span>
                  <span className="shrink-0 text-muted-foreground">{event.date}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-[22px] border border-border bg-background/70 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Coffee className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-semibold text-foreground">Cadde'de Takılıyor</span>
          </div>
          {activeCafe ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-border bg-card px-3 py-3">
                <p className="text-sm font-semibold text-foreground">{activeCafe.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{activeCafe.theme ? `${activeCafe.theme} atmosferi aktif` : "Canlı katılım alanı açık"}</p>
              </div>
              <Link to={`/cadde/${activeCafe.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                Cadde'ye git <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Şu an aktif bir cafe'de değil.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default IndividualPublicCard;
