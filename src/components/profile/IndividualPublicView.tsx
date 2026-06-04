import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Briefcase,
  Calendar,
  Coffee,
  Eye,
  EyeOff,
  Info,
  Linkedin,
  MapPin,
  MessageSquare,
  Plane,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/components/auth/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import type { IndividualProfileDetailsCore } from "@/lib/individual-profile";
import type { PublicProfileLink } from "@/lib/profile-view-model";

type Props = {
  details: IndividualProfileDetailsCore;
  publicLinks?: PublicProfileLink[];
  extraBadges?: string[];
};

const IndividualPublicView = ({ details, publicLinks = [], extraBadges = [] }: Props) => {
  const { user } = useAuth();
  const [activeCafe, setActiveCafe] = useState<{
    id: string;
    name: string;
    theme?: string;
  } | null>(null);
  const [followerCount, setFollowerCount] = useState(details.followerCount);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const [isMessageSending, setIsMessageSending] = useState(false);

  const isSelf = Boolean(user?.id && user.id === details.userId);
  const front = details.frontCard;
  const relocation = details.detailCard.relocation;
  const locationLabel = [details.activeCity, details.activeCountry]
    .filter((part) => part && part !== "-")
    .join(", ");
  const avatarInitials = details.displayName.slice(0, 2).toUpperCase();
  const canMessageUser = !isSelf && Boolean(details.userId);
  const canFollowUser = !isSelf && Boolean(details.userId);
  const hasJobBadge = extraBadges.includes("İş Arıyorum") || details.jobSeeking;
  const hasMentorBadge = extraBadges.includes("Gönüllü Mentör") || details.mentorOptIn;
  const hasMovingSoonBadge = extraBadges.includes("Yakında Taşınacağım") || relocation.enabled;
  const businessOrOrganization = details.controlPanel.businessOrOrganization.trim();
  const interestFocus = details.controlPanel.interestFocus.trim();
  const fallbackLinks: PublicProfileLink[] = [];
  if (details.frontCard.linkedinUrl && details.frontCard.linkedinVisible) {
    fallbackLinks.push({ label: "LinkedIn", url: details.frontCard.linkedinUrl });
  }
  const websiteUrl = details.controlPanel.websiteLinks[0] ?? details.controlPanel.websites[0];
  if (websiteUrl) {
    fallbackLinks.push({ label: "Website", url: websiteUrl });
  }
  const visibleLinks = publicLinks.length ? publicLinks : fallbackLinks;

  useEffect(() => {
    if (!details.userId) return;
    let cancelled = false;

    void (async () => {
      const [{ data: cafeRows }, { count }, { data: followRow }] = await Promise.all([
        supabase
          .from("cafe_memberships")
          .select("cafe_id, joined_at, cafes:cafe_id(id, name, theme, closes_at)")
          .eq("user_id", details.userId)
          .order("joined_at", { ascending: false })
          .limit(1),
        supabase
          .from("user_follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", details.userId),
        user
          ? supabase
              .from("user_follows")
              .select("follower_id")
              .eq("follower_id", user.id)
              .eq("following_id", details.userId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      if (cancelled) return;

      const cafeRow = cafeRows?.[0] as
        | {
            cafes?: {
              id: string;
              name: string;
              theme?: string | null;
              closes_at: string;
            } | null;
          }
        | undefined;
      if (cafeRow?.cafes && new Date(cafeRow.cafes.closes_at).getTime() > Date.now()) {
        setActiveCafe({
          id: cafeRow.cafes.id,
          name: cafeRow.cafes.name,
          theme: cafeRow.cafes.theme ?? undefined,
        });
      }
      if (count !== null) setFollowerCount(count);
      setIsFollowing(Boolean(followRow));
    })();

    return () => {
      cancelled = true;
    };
  }, [details.userId, user]);

  const handleSendMessage = async () => {
    if (!user) {
      toast({ title: "Mesaj göndermek için giriş yapın", variant: "destructive" });
      return;
    }
    if (!details.userId) {
      toast({ title: "Bu profile şu anda mesaj gönderilemiyor", variant: "destructive" });
      return;
    }
    const content = messageDraft.trim();
    if (!content) return;
    setIsMessageSending(true);
    try {
      const payload: TablesInsert<"direct_messages"> = {
        sender_id: user.id,
        recipient_id: details.userId,
        content,
      };
      const { error } = await supabase.from("direct_messages").insert(payload);
      if (error) throw error;
      toast({ title: "Mesaj gönderildi" });
      setMessageDraft("");
      setIsMessageOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Mesaj gönderilemedi";
      toast({ title: message, variant: "destructive" });
    } finally {
      setIsMessageSending(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user) {
      toast({ title: "Takip etmek için giriş yapın", variant: "destructive" });
      return;
    }
    if (!details.userId) {
      toast({ title: "Bu profil şu anda takip edilemiyor", variant: "destructive" });
      return;
    }
    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("user_follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", details.userId);
        if (error) throw error;
        setIsFollowing(false);
        setFollowerCount((prev) => Math.max(0, prev - 1));
      } else {
        const { error } = await supabase
          .from("user_follows")
          .insert({ follower_id: user.id, following_id: details.userId });
        if (error) throw error;
        setIsFollowing(true);
        setFollowerCount((prev) => prev + 1);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "İşlem başarısız";
      toast({ title: message, variant: "destructive" });
    } finally {
      setIsFollowLoading(false);
    }
  };

  return (
    <section className="mb-6 overflow-hidden rounded-[28px] border border-border bg-card shadow-card">
      {/* Header */}
      <div className="border-b border-border bg-[radial-gradient(circle_at_top_left,rgba(18,164,196,0.18),transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.04),rgba(15,23,42,0))] px-5 py-5 md:px-7 md:py-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          {front.profileImageUrl ? (
            <img
              src={front.profileImageUrl}
              alt={details.displayName}
              className="h-20 w-20 shrink-0 rounded-[24px] object-cover shadow-lg md:h-24 md:w-24"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-gradient-primary text-2xl font-bold text-primary-foreground shadow-lg md:h-24 md:w-24 md:text-3xl">
              {avatarInitials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2">
              {hasJobBadge && (
                <Badge className="border-turquoise/30 bg-turquoise/15 text-turquoise">
                  <Briefcase className="mr-1 h-3 w-3" /> İş Arıyorum
                </Badge>
              )}
              {hasMentorBadge && (
                <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-700">
                  <UserCheck className="mr-1 h-3 w-3" /> Gönüllü Mentör
                </Badge>
              )}
              {details.controlPanel.profileVisible ? (
                <Badge variant="outline" className="gap-1 text-[11px]">
                  <Eye className="h-3 w-3" /> Profil Açık
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-[11px] text-muted-foreground">
                  <EyeOff className="h-3 w-3" /> Profil Gizli
                </Badge>
              )}
              {front.corteqsPassport && (
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

            {/* Name + tagline */}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {details.displayName}
              </h2>
              {details.tagline ? (
                <span className="rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                  {details.tagline}
                </span>
              ) : null}
              {businessOrOrganization ? (
                <span className="rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-700">
                  {businessOrOrganization}
                </span>
              ) : null}
            </div>


            {/* Stats row */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <strong className="text-foreground">{followerCount}</strong> takipçi
              </span>
              <span className="flex items-center gap-1">
                <strong className="text-foreground">{details.followingCount}</strong> takip
              </span>
              {locationLabel && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {locationLabel}
                </span>
              )}
            </div>

            {/* Document links */}
            {visibleLinks.length ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {visibleLinks.map((link) => (
                  <a
                    key={`${link.label}-${link.url}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/85 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    {link.label === "LinkedIn" ? <Linkedin className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                    {link.label}
                  </a>
                ))}
              </div>
            ) : null}

            {interestFocus ? (
              <p className="mt-4 text-sm font-medium text-foreground/80">
                İştigal / İlgi Sahası: {interestFocus}
              </p>
            ) : null}

            {/* Relocation badge */}
            {hasMovingSoonBadge && (
              <Badge className="mt-4 gap-1 border-amber-500/30 bg-amber-500/15 text-amber-700">
                <Plane className="h-3 w-3" />{" "}
                {relocation.country || relocation.city
                  ? `Yakında taşınacak: ${[relocation.city, relocation.country].filter(Boolean).join(", ")}`
                  : "Yakında taşınacak"}
              </Badge>
            )}

            {/* World message */}
            {front.worldMessage ? (
              <div className="mt-4 rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm text-foreground/90">
                <span className="mr-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Profil Mesajım
                </span>
                {front.worldMessage}
              </div>
            ) : null}

            {/* Action buttons — visitor only */}
            {!isSelf && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={isFollowing ? "secondary" : "default"}
                  disabled={isFollowLoading || !canFollowUser}
                  onClick={() => void handleFollowToggle()}
                  className="gap-1.5"
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="h-3.5 w-3.5" /> Takip Ediliyor
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" /> Takip Et
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={!canMessageUser}
                  onClick={() => {
                    if (!canMessageUser) {
                      toast({ title: "Bu profile şu anda mesaj gönderilemiyor", variant: "destructive" });
                      return;
                    }
                    setIsMessageOpen(true);
                  }}
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Mesaj
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom cards */}
      <div className="grid gap-3 p-5 md:grid-cols-2 md:p-6">
        {/* Events */}
        <div className="rounded-[22px] border border-border bg-background/70 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Son 2 ayda etkinlikler</span>
          </div>
          {details.detailCard.recentEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground">Henüz etkinlik yok.</p>
          ) : (
            <ul className="space-y-2">
              {details.detailCard.recentEvents.slice(0, 4).map((event) => (
                <li
                  key={`${event.title}-${event.date}`}
                  className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-xs"
                >
                  <span className="min-w-0 flex-1 truncate text-foreground">{event.title}</span>
                  <span className="shrink-0 text-muted-foreground">{event.date}</span>
                  {event.city ? (
                    <span className="shrink-0 text-muted-foreground">({event.city})</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Cadde */}
        <div className="rounded-[22px] border border-border bg-background/70 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Coffee className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-semibold text-foreground">Cadde'de Takılıyor</span>
          </div>
          {activeCafe ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-border bg-card px-3 py-3">
                <p className="text-sm font-semibold text-foreground">{activeCafe.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activeCafe.theme
                    ? `${activeCafe.theme} atmosferi aktif`
                    : "Canlı katılım alanı açık"}
                </p>
              </div>
              <Link
                to={`/cadde/${activeCafe.id}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Cadde'ye git <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Şu an aktif bir cafe'de değil.</p>
          )}
        </div>
      </div>
      {/* Message dialog */}
      <Dialog open={isMessageOpen} onOpenChange={setIsMessageOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{details.displayName} kullanıcısına mesaj</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Mesajınızı yazın..."
            rows={5}
            maxLength={2000}
            value={messageDraft}
            onChange={(e) => setMessageDraft(e.target.value)}
            className="mt-2 resize-none"
          />
          <div className="flex items-center justify-between gap-2 mt-2">
            <span className="text-xs text-muted-foreground">{messageDraft.length}/2000</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsMessageOpen(false)}>
                İptal
              </Button>
              <Button
                size="sm"
                disabled={isMessageSending || messageDraft.trim().length === 0}
                onClick={() => void handleSendMessage()}
              >
                {isMessageSending ? "Gönderiliyor..." : "Gönder"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default IndividualPublicView;
