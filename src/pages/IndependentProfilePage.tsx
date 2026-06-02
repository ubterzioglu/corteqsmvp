import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getPublicIndependentProfile,
  type IndependentProfile,
} from "@/lib/independent-profiles";

const formatAnnouncementDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
};

const profileKindLabel = (profileKind: IndependentProfile["profileKind"]) =>
  profileKind === "embassy" ? "Büyükelçilik Profili" : "Konsolosluk Profili";

const IndependentProfilePage = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<IndependentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      setIsLoading(true);
      const nextProfile = await getPublicIndependentProfile(slug);
      if (!isMounted) return;
      setProfile(nextProfile);
      setIsLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const mapSearchQuery = encodeURIComponent(
    profile?.mapQuery || [profile?.title, profile?.city, profile?.country].filter(Boolean).join(", "),
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-6xl px-4 pb-16 pt-24">
        <Link to="/associations" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Kuruluşlara dön
        </Link>

        {isLoading ? (
          <Card className="rounded-3xl border border-border bg-card p-8 text-center text-muted-foreground">
            Diplomatik profil yükleniyor...
          </Card>
        ) : null}

        {!isLoading && !profile ? (
          <Card className="rounded-3xl border border-border bg-card p-8 text-center">
            <h1 className="text-2xl font-bold text-foreground">Diplomatik profil bulunamadı</h1>
            <p className="mt-3 text-muted-foreground">
              Bu slug için yayınlanmış bağımsız bir büyükelçilik veya konsolosluk profili yok.
            </p>
            <Link to="/associations">
              <Button className="mt-6" variant="outline">
                Tüm kuruluşlara dön
              </Button>
            </Link>
          </Card>
        ) : null}

        {!isLoading && profile ? (
          <div className="space-y-8">
            <section className="overflow-hidden rounded-[2rem] border border-border bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_50%,#eef6ff_100%)] shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              {profile.heroImageUrl ? (
                <div className="relative">
                  <img
                    src={profile.heroImageUrl}
                    alt={profile.title}
                    className="h-72 w-full object-cover md:h-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/35 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
                    <HeroCopy profile={profile} dark />
                  </div>
                </div>
              ) : (
                <div className="p-6 md:p-8">
                  <HeroCopy profile={profile} />
                </div>
              )}
            </section>

            <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
              <div className="space-y-6">
                <Card className="rounded-3xl border border-border shadow-sm">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold text-foreground">Hakkında</h2>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                      {profile.description}
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border border-border shadow-sm">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-bold text-foreground">Sunulan Hizmetler</h2>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {profile.services.map((service) => (
                        <div key={service.title} className="rounded-2xl border border-border bg-muted/30 p-4">
                          <p className="font-semibold text-foreground">{service.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border border-border shadow-sm">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-bold text-foreground">Duyurular ve Etkinlikler</h2>
                    </div>
                    <div className="space-y-3">
                      {profile.announcements.map((announcement) => (
                        <div key={`${announcement.title}:${announcement.date ?? ""}`} className="rounded-2xl border border-border bg-muted/30 p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-foreground">{announcement.title}</p>
                            {announcement.type ? <Badge variant="outline">{announcement.type}</Badge> : null}
                            {announcement.date ? <Badge variant="secondary">{formatAnnouncementDate(announcement.date)}</Badge> : null}
                          </div>
                          {announcement.description ? (
                            <p className="mt-2 text-sm text-muted-foreground">{announcement.description}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="rounded-3xl border border-border shadow-sm">
                  <CardContent className="space-y-4 p-6">
                    <h2 className="text-lg font-bold text-foreground">İletişim</h2>
                    <ContactRow icon={MapPin} label="Konum" value={[profile.city, profile.country].join(", ")} />
                    {profile.addressText ? <ContactRow icon={Navigation} label="Adres" value={profile.addressText} /> : null}
                    {profile.workingHours ? <ContactRow icon={CalendarDays} label="Çalışma Saatleri" value={profile.workingHours} /> : null}
                    {profile.contactPhone ? <ContactRow icon={Phone} label="Telefon" value={profile.contactPhone} /> : null}
                    {profile.contactEmail ? <ContactRow icon={Mail} label="E-posta" value={profile.contactEmail} /> : null}
                    {profile.websiteUrl ? <ContactRow icon={Globe} label="Website" value={profile.websiteUrl} /> : null}
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border border-border shadow-sm">
                  <CardContent className="space-y-3 p-6">
                    <h2 className="text-lg font-bold text-foreground">Hızlı Aksiyonlar</h2>
                    {profile.ctas.map((cta) => (
                      <a key={`${cta.label}:${cta.url}`} href={cta.url} target="_blank" rel="noreferrer">
                        <Button className="w-full gap-2" variant={cta.variant === "default" ? "default" : "outline"}>
                          {cta.label}
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    ))}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${mapSearchQuery}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button className="w-full gap-2" variant="outline">
                        Haritada Aç
                        <MapPin className="h-4 w-4" />
                      </Button>
                    </a>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${mapSearchQuery}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button className="w-full gap-2" variant="outline">
                        Yol Tarifi
                        <Navigation className="h-4 w-4" />
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
};

const HeroCopy = ({ profile, dark = false }: { profile: IndependentProfile; dark?: boolean }) => (
  <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-3">
      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border text-3xl shadow-sm ${dark ? "border-white/20 bg-white/10" : "border-border bg-card"}`}>
        {profile.logoUrl || "🏛️"}
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={dark ? "secondary" : "outline"}>{profile.typeLabel}</Badge>
          <Badge variant={dark ? "secondary" : "secondary"}>{profileKindLabel(profile.profileKind)}</Badge>
        </div>
        <h1 className={`text-3xl font-black md:text-5xl ${dark ? "text-white" : "text-foreground"}`}>{profile.title}</h1>
      </div>
    </div>
    {profile.subtitle ? (
      <p className={`max-w-3xl text-sm md:text-lg ${dark ? "text-slate-100" : "text-muted-foreground"}`}>{profile.subtitle}</p>
    ) : null}
    <div className={`flex flex-wrap items-center gap-3 text-sm ${dark ? "text-slate-100" : "text-muted-foreground"}`}>
      <span className="inline-flex items-center gap-1.5">
        <MapPin className="h-4 w-4" />
        {profile.city}, {profile.country}
      </span>
      {profile.websiteUrl ? (
        <a href={profile.websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:underline">
          <Globe className="h-4 w-4" />
          Resmi web sitesi
        </a>
      ) : null}
    </div>
  </div>
);

const ContactRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) => (
  <div className="rounded-2xl border border-border bg-muted/30 p-4">
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-xl bg-background p-2">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  </div>
);

export default IndependentProfilePage;
