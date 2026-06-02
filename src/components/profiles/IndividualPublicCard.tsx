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

  const locationLabel = [city, country].filter(Boolean).join(", ");
  const spotlightItems = [
    title ? { icon: Briefcase, label: "Uzmanlık", value: title } : null,
    locationLabel ? { icon: MapPin, label: "Konum", value: locationLabel } : null,
    recentEvents[0] ? { icon: Calendar, label: "Son hareket", value: recentEvents[0].title } : null,
  ].filter(Boolean);

  return (
    <section className="mb-6 overflow-hidden rounded-[32px] border border-slate-200/80 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_38%,#f7f8fc_100%)] shadow-[0_30px_80px_-36px_rgba(15,23,42,0.38)]">
      <div className="relative border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(18,164,196,0.22),transparent_30%),radial-gradient(circle_at_top_right,rgba(14,116,144,0.18),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(12,74,110,0.92)_55%,rgba(240,249,255,0.98)_160%)] px-5 py-6 text-white md:px-7 md:py-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),transparent)]" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[28px] border border-white/15 bg-[linear-gradient(145deg,rgba(255,255,255,0.22),rgba(255,255,255,0.08))] text-2xl font-bold text-white shadow-[0_20px_50px_-20px_rgba(15,23,42,0.9)] backdrop-blur md:h-24 md:w-24 md:text-3xl">
                {avatarInitials}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
                    <Sparkles className="mr-1 h-3 w-3" /> Bireysel Panelim
                  </Badge>
                  {isJobSeeking && (
                    <Badge className="border-emerald-300/25 bg-emerald-300/15 text-emerald-100">
                      <Briefcase className="mr-1 h-3 w-3" /> İş Arıyorum
                    </Badge>
                  )}
                  {profileVisible !== undefined && (
                    profileVisible ? (
                      <Badge variant="outline" className="gap-1 border-white/20 bg-white/10 text-[11px] text-white">
                        <Eye className="h-3 w-3" /> Profil Açık
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 border-white/10 bg-slate-950/15 text-[11px] text-slate-200">
                        <EyeOff className="h-3 w-3" /> Profil Gizli
                      </Badge>
                    )
                  )}
                  {corteqsPassport && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className="gap-1 border-amber-200/30 bg-amber-200/15 text-[11px] text-amber-50">
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
                  <h2 className="text-2xl font-bold tracking-tight text-white md:text-4xl">{name}</h2>
                  {tagline ? (
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-slate-100">
                      {tagline}
                    </span>
                  ) : null}
                </div>

                {(title || email) && (
                  <p className="mt-1 truncate text-sm text-slate-200 md:text-base">
                    {[title, email].filter(Boolean).join(" · ")}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-200">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <strong className="text-white">{followers}</strong> takipçi
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" />
                    <strong className="text-white">{followingCount}</strong> takip
                  </span>
                  {(city || country) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {[city, country].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>

                {spotlightItems.length > 0 ? (
                  <div className="mt-5 grid gap-2 sm:grid-cols-3">
                    {spotlightItems.map((item) => {
                      if (!item) return null;
                      const Icon = item.icon;
                      return (
                        <div key={`${item.label}-${item.value}`} className="rounded-[20px] border border-white/12 bg-white/10 px-3 py-3 backdrop-blur">
                          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-sky-100/80">
                            <Icon className="h-3.5 w-3.5" />
                            {item.label}
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm font-medium text-white">{item.value}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

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
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/16 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:border-white/35 hover:bg-white/16"
                        >
                          <Icon className="h-3.5 w-3.5" /> {action.label}
                        </a>
                      ) : (
                        <button
                          key={action.key}
                          onClick={action.onClick}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/16 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:border-white/35 hover:bg-white/16"
                        >
                          <Icon className="h-3.5 w-3.5" /> {action.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {relocating && (relocating.country || relocating.city) && (
                  <Badge className="mt-4 gap-1 border-amber-200/25 bg-amber-200/15 text-amber-50">
                    <Plane className="h-3 w-3" /> Yakında taşınacak: {[relocating.city, relocating.country].filter(Boolean).join(", ")}
                  </Badge>
                )}

                {worldMessage && (
                  <div className="mt-4 rounded-[22px] border border-white/14 bg-white/10 px-4 py-3 text-sm text-slate-50">
                    <span className="mr-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">Profil Mesajım</span>
                    {worldMessage}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.08))] p-4 text-white backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100/80">Ön İzleme</p>
                <h3 className="mt-1 text-lg font-bold text-white">Panel görünümü hazır</h3>
              </div>
              <div className="rounded-2xl bg-white/12 p-2 text-white">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-white/12 bg-white/10 px-3 py-2">
                <p className="text-[11px] text-slate-200">Takipçi</p>
                <p className="text-lg font-bold text-white">{followers}</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/10 px-3 py-2">
                <p className="text-[11px] text-slate-200">Takip</p>
                <p className="text-lg font-bold text-white">{followingCount}</p>
              </div>
            </div>
            <div className="mt-4 rounded-[22px] border border-dashed border-white/18 bg-slate-950/18 p-3 text-xs text-slate-100/85">
              Profil ayarlarında görünürlük, kariyer bağlantıları ve CV yüklemesini güncelledikçe bu kart ziyaretçi görünümünü daha iyi yansıtır.
            </div>
            <Button asChild variant="secondary" className="mt-4 w-full justify-between border-0 bg-white text-slate-950 hover:bg-slate-100">
              <Link to="/profile/bireysel?tab=settings">
                Profil ayarlarına git <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-5 md:grid-cols-2 md:p-6">
        <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,rgba(240,249,255,0.9),rgba(255,255,255,0.95))] p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Son 2 ayda etkinlikler</span>
          </div>
          {recentEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground">Henüz etkinlik yok.</p>
          ) : (
            <ul className="space-y-2">
              {recentEvents.slice(0, 4).map((event) => (
                <li key={event.id} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
                  <Badge variant="secondary" className="text-[10px] shadow-none">
                    {event.source === "joined" ? "Katıldı" : "Takip"}
                  </Badge>
                  <span className="min-w-0 flex-1 truncate text-foreground">{event.title}</span>
                  <span className="shrink-0 text-muted-foreground">{[event.city, event.date].filter(Boolean).join(" · ")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,251,235,0.82),rgba(255,255,255,0.96))] p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Coffee className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-semibold text-foreground">Cadde'de Takılıyor</span>
          </div>
          {activeCafe ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-amber-200/60 bg-white px-3 py-3 shadow-sm">
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
