import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, MapPin, Users, Heart, ShieldCheck, Briefcase, Plane,
  MessageSquare, UserPlus, Calendar, Tag, Globe, ClipboardList,
  Linkedin, FileText, Coffee, Bell, ExternalLink, Sparkles, Info
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DemoBadge from "@/components/DemoBadge";
import LanguagesCountriesBlock, { CountryLived } from "@/components/profiles/LanguagesCountriesBlock";
import { isFollowsVisibleOnProfile } from "@/components/profiles/MyFollowsSection";
import { useAuth } from "@/contexts/AuthContext";
import { canEnterCafe, cafeAccessReason } from "@/lib/caddeRules";
import { toast } from "@/hooks/use-toast";

interface MockPerson {
  id: string;
  name: string;
  photo: string;
  tagline: string;
  worldMessage: string;
  city: string;
  country: string;
  hometown: string;
  followers: number;
  following: number;
  passport: boolean;
  inCadde: boolean;
  cafeName?: string;
  jobSeeking?: boolean;
  relocating?: { city: string; country: string };
  bio: string;
  interests: string[];
  languages: string[];
  countriesLived?: CountryLived[];
  linkedin?: string;
  cvAvailable?: boolean;
  serviceRequests: { title: string; category: string; status: string; date: string }[];
  joinedEvents: { title: string; city: string; date: string }[];
  follows: { name: string; type: string }[];
  whatsappGroups: { name: string; members: number }[];
  coupons: { brand: string; title: string; expires: string }[];
  recentActivity: { text: string; date: string }[];
}

const PEOPLE: Record<string, MockPerson> = {
  u1: {
    id: "u1",
    name: "Berk Kural",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    tagline: "Berlin'de fullstack geliştirici, açık kaynağa katkı",
    worldMessage: "Diasporadaki yazılımcılarla bağ kuralım — birlikte daha güçlüyüz.",
    city: "Berlin", country: "Almanya", hometown: "İzmir",
    followers: 142, following: 87, passport: true, inCadde: true,
    cafeName: "Berlin IT Cafe",
    bio: "8 yıldır Berlin'de yaşıyorum. React, Node ve Go ile fullstack ürünler geliştiriyorum. Türk diasporasındaki yazılımcılar için açık kaynak topluluk inşa etmeye çalışıyorum.",
    interests: ["Yazılım", "Açık Kaynak", "Startup", "Bisiklet"],
    languages: ["Türkçe", "Almanca", "İngilizce"],
    countriesLived: [{ country: "Türkiye", from: 1990, to: 2017 }, { country: "Almanya", from: 2017, to: null }],
    linkedin: "linkedin.com/in/berkkural",
    cvAvailable: true,
    serviceRequests: [
      { title: "Berlin'de vergi danışmanı arıyorum", category: "Mali Müşavir", status: "Açık", date: "10 May" },
      { title: "Almanca dil okulu önerisi", category: "Eğitim", status: "Yanıtlandı", date: "2 May" },
    ],
    joinedEvents: [
      { title: "Berlin Türk Devs Meetup", city: "Berlin", date: "8 May" },
      { title: "Avrupa Diaspora Tech Konferansı", city: "Münih", date: "20 Haz" },
    ],
    follows: [
      { name: "Berlin Türk Cemiyeti", type: "Dernek" },
      { name: "Cafe Anadolu Berlin", type: "İşletme" },
      { name: "Av. Selma Yıldırım", type: "Danışman" },
    ],
    whatsappGroups: [
      { name: "Berlin Yazılımcılar TR", members: 248 },
      { name: "Almanya Diaspora Genel", members: 1240 },
    ],
    coupons: [
      { brand: "THY", title: "%15 Berlin–İstanbul", expires: "30 Haz" },
      { brand: "HSBC", title: "Diaspora hesap fırsatı", expires: "31 Tem" },
    ],
    recentActivity: [
      { text: "Berlin Türk Devs Meetup'a katıldı", date: "8 May" },
      { text: "Berlin IT Cafe açtı", date: "5 May" },
      { text: "Av. Selma Yıldırım'ı takip etti", date: "1 May" },
    ],
  },
  u2: {
    id: "u2",
    name: "Ayşe Demir",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    tagline: "Londra'da pazarlama uzmanı, yeni fırsatlara açık",
    worldMessage: "Kariyer geçişimde mentor arıyorum 💪",
    city: "Londra", country: "İngiltere", hometown: "Ankara",
    followers: 98, following: 132, passport: true, inCadde: false,
    jobSeeking: true,
    bio: "10 yıldır pazarlama alanındayım, son 4 yıldır Londra'da fintech şirketlerinde brand & growth liderliği yapıyorum. Şu an product marketing tarafına geçiş düşünüyorum.",
    interests: ["Pazarlama", "Fintech", "Yoga", "Türk Mutfağı"],
    languages: ["Türkçe", "İngilizce", "Fransızca"],
    countriesLived: [{ country: "Türkiye", from: 1988, to: 2015 }, { country: "Fransa", from: 2015, to: 2021 }, { country: "İngiltere", from: 2021, to: null }],
    linkedin: "linkedin.com/in/aysedemir",
    cvAvailable: true,
    serviceRequests: [
      { title: "Londra'da Türkçe konuşan kariyer koçu", category: "Kariyer", status: "Açık", date: "12 May" },
    ],
    joinedEvents: [
      { title: "Londra Diaspora Brunch", city: "Londra", date: "29 Nis" },
      { title: "Türk Kadın Liderler Zirvesi", city: "Online", date: "2 Haz" },
    ],
    follows: [
      { name: "Londra Türk Toplumu", type: "Dernek" },
      { name: "Mehmet Yılmaz", type: "Mentör" },
    ],
    whatsappGroups: [
      { name: "Londra Diaspora Kadınlar", members: 412 },
      { name: "UK Pazarlama TR", members: 186 },
    ],
    coupons: [
      { brand: "THY", title: "%10 Londra–İstanbul", expires: "15 Tem" },
    ],
    recentActivity: [
      { text: "Londra Diaspora Brunch'a katıldı", date: "29 Nis" },
      { text: "İş Arıyor rozetini açtı", date: "20 Nis" },
    ],
  },
  u3: {
    id: "u3",
    name: "Mehmet Yıldız",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    tagline: "Yakında Amsterdam'a taşınıyorum 🇳🇱",
    worldMessage: "Amsterdam'da daire ve okul önerilerine açığım, teşekkürler!",
    city: "İstanbul", country: "Türkiye", hometown: "İstanbul",
    followers: 54, following: 67, passport: false, inCadde: true,
    cafeName: "Relocation Amsterdam",
    relocating: { city: "Amsterdam", country: "Hollanda" },
    bio: "Backend geliştiriciyim, Hollanda'daki bir şirketten teklif aldım. Eylül ayında ailemle Amsterdam'a taşınıyoruz. Welcome Pack sürecindeyim.",
    interests: ["Yazılım", "Aile", "Bisiklet", "Hollanda Kültürü"],
    languages: ["Türkçe", "İngilizce"],
    countriesLived: [{ country: "Türkiye", from: 1992, to: null }],
    linkedin: "linkedin.com/in/mehmetyildiz",
    cvAvailable: false,
    serviceRequests: [
      { title: "Amsterdam'da 2+1 daire (uzun vade)", category: "Emlak", status: "Açık", date: "11 May" },
      { title: "Çocuk için Türkçe destekli okul", category: "Eğitim", status: "Açık", date: "9 May" },
      { title: "Hollanda vize danışmanı", category: "Vize", status: "Yanıtlandı", date: "1 May" },
    ],
    joinedEvents: [
      { title: "Hollanda Vize Webinar", city: "Online", date: "5 May" },
      { title: "Amsterdam Yeni Gelenler Buluşması", city: "Amsterdam", date: "15 Eyl" },
    ],
    follows: [
      { name: "Ayşe Kara (Emlak)", type: "Danışman" },
      { name: "Hollanda Türk Federasyonu", type: "Dernek" },
    ],
    whatsappGroups: [
      { name: "Amsterdam Yeni Gelenler TR", members: 326 },
      { name: "Hollanda Aileler", members: 540 },
    ],
    coupons: [
      { brand: "Welcome Pack", title: "Karşılama paketi indirimi", expires: "1 Eyl" },
    ],
    recentActivity: [
      { text: "Relocation Amsterdam cafe'sini açtı", date: "10 May" },
      { text: "Hollanda Vize Webinar'a katıldı", date: "5 May" },
      { text: "Welcome Pack siparişi başlattı", date: "28 Nis" },
    ],
  },
  u4: {
    id: "u4",
    name: "Selin Aktaş",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    tagline: "New York'ta sanat tarihçisi & blogger",
    worldMessage: "Galeri açılışı için NY'deki Türklerle buluşmak isterim.",
    city: "New York", country: "ABD", hometown: "İzmir",
    followers: 312, following: 201, passport: true, inCadde: false,
    bio: "Sanat tarihçisiyim, NY'de bağımsız bir galeri yönetiyorum. Türk çağdaş sanatçılarını ABD'de tanıtmak için bir blog yürütüyorum.",
    interests: ["Çağdaş Sanat", "Edebiyat", "Seyahat", "Fotoğraf"],
    languages: ["Türkçe", "İngilizce", "İtalyanca"],
    countriesLived: [{ country: "Türkiye", from: 1985, to: 2008 }, { country: "İtalya", from: 2008, to: 2014 }, { country: "ABD", from: 2014, to: null }],
    linkedin: "linkedin.com/in/selinaktas",
    cvAvailable: true,
    serviceRequests: [
      { title: "NY'de Türk catering önerisi (galeri açılışı)", category: "Etkinlik", status: "Açık", date: "13 May" },
    ],
    joinedEvents: [
      { title: "NY Sanat Türk Buluşma", city: "New York", date: "30 Nis" },
      { title: "Çağdaş Türk Sanatı Sergisi", city: "New York", date: "5 Haz" },
    ],
    follows: [
      { name: "Türk Amerikan Cemiyeti", type: "Dernek" },
      { name: "NY Türk Restoranları", type: "İşletme" },
    ],
    whatsappGroups: [
      { name: "NY Türk Sanatçılar", members: 142 },
      { name: "ABD Doğu Yakası Diaspora", members: 980 },
    ],
    coupons: [
      { brand: "THY", title: "%12 NY–İstanbul Business", expires: "20 Tem" },
    ],
    recentActivity: [
      { text: "NY Sanat Türk Buluşma'ya katıldı", date: "30 Nis" },
      { text: "Yeni blog yazısı yayınladı", date: "25 Nis" },
    ],
  },
};

const Stat = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) => (
  <div className="bg-card rounded-xl border border-border p-3 text-center">
    <Icon className="h-4 w-4 mx-auto mb-1 text-primary" />
    <div className="text-lg font-bold leading-none">{value}</div>
    <div className="text-[10px] text-muted-foreground mt-1">{label}</div>
  </div>
);

const SectionCard = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-card rounded-2xl border border-border p-5 shadow-card">{children}</div>
);

const DiasporaPersonDetail = () => {
  const { id } = useParams<{ id: string }>();
  const person = (id && PEOPLE[id]) || PEOPLE.u1;
  const { profile } = useAuth();
  // Cafe açıldığı ülke — mock veride yok, sahibinin ülkesi varsayılır
  const cafeCountry = (person as any).cafeCountry || person.country;
  const cafeAllowed = canEnterCafe(profile as any, { country: cafeCountry });
  const cafeBlockReason = cafeAccessReason(profile as any, { country: cafeCountry });
  const linkedinHref = person.linkedin
    ? (person.linkedin.startsWith("http") ? person.linkedin : `https://${person.linkedin.replace(/^\/+/, "")}`)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link to="/diaspora-people" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" /> Diasporada İnsanlar
          </Link>

          {/* Hero */}
          <div className="relative bg-card rounded-2xl border border-border shadow-card overflow-hidden mb-4">
            <DemoBadge variant="page" />
            <div className="pt-8 p-6 flex flex-col sm:flex-row gap-5">
              <div className="relative shrink-0">
                <img src={person.photo} alt={person.name} className="w-28 h-28 rounded-2xl object-cover" />
                {person.inCadde && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-card animate-pulse" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold">{person.name}</h1>
                  {person.passport && (
                    <Badge className="gap-1 bg-amber-500/15 text-amber-700 border-amber-500/30">
                      <ShieldCheck className="h-3 w-3" /> Diaspora Pasaport
                    </Badge>
                  )}
                  {person.inCadde && (
                    <Badge className="gap-1 bg-emerald-500 text-white border-emerald-600">
                      <Coffee className="h-3 w-3" /> Online/Cadde'de
                    </Badge>
                  )}
                  {person.jobSeeking && (
                    <Badge className="gap-1 bg-turquoise/15 text-turquoise border-turquoise/30" title="Panelden 'İş Arıyorum Badge'i' toggle'ı ile yönetilir">
                      <Briefcase className="h-3 w-3" /> İş Arayışında
                    </Badge>
                  )}
                  {person.relocating && (
                    <Badge className="gap-1 bg-amber-500/15 text-amber-700 border-amber-500/30">
                      <Plane className="h-3 w-3" /> {person.relocating.city}'a taşınıyor
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground italic mt-1">"{person.tagline}"</p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {person.city}, {person.country}</span>
                  <span>Memleket: {person.hometown}</span>
                </div>
                <div className="mt-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                  💬 {person.worldMessage}
                </div>
                <LanguagesCountriesBlock languages={person.languages} countries={person.countriesLived} compact />
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button size="sm" className="gap-1"><MessageSquare className="h-3.5 w-3.5" /> Mesaj Gönder</Button>
                  {person.cafeName && (
                    cafeAllowed ? (
                      <Button size="sm" variant="outline" asChild className="gap-1">
                        <Link to="/cadde"><Coffee className="h-3.5 w-3.5" /> {person.cafeName}</Link>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 opacity-60 cursor-not-allowed"
                        title={cafeBlockReason || "Bu cafe'ye erişim yetkin yok"}
                        onClick={(e) => {
                          e.preventDefault();
                          toast({
                            title: "Cafe'ye giriş kısıtlı",
                            description: cafeBlockReason || "TR numaralı kullanıcılar yalnızca Türkiye ve Köprü cafelerine girebilir.",
                          });
                        }}
                      >
                        <Coffee className="h-3.5 w-3.5" /> {person.cafeName}
                      </Button>
                    )
                  )}
                  {linkedinHref && (
                    <Button size="sm" variant="outline" asChild className="gap-1">
                      <a href={linkedinHref} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-3.5 w-3.5" /> LinkedIn <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Stat icon={Users} label="Takipçi" value={person.followers} />
            <Stat icon={Heart} label="Takip" value={person.following} />
            <Stat icon={Calendar} label="Etkinlik" value={person.joinedEvents.length} />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="about">
            <TabsList className="flex flex-wrap h-auto bg-muted/40 p-1 rounded-xl">
              <TabsTrigger value="about" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Hakkında</TabsTrigger>
              <TabsTrigger value="requests" className="gap-1.5"><ClipboardList className="h-3.5 w-3.5" /> Hizmet Talepleri</TabsTrigger>
              <TabsTrigger value="events" className="gap-1.5"><Calendar className="h-3.5 w-3.5" /> Etkinlikler</TabsTrigger>
              <TabsTrigger value="follows" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Takip</TabsTrigger>
              <TabsTrigger value="whatsapp" className="gap-1.5" title="Admini oldukları WhatsApp grupları"><MessageSquare className="h-3.5 w-3.5" /> WhatsApp <Info className="h-3 w-3 opacity-60" /></TabsTrigger>
              <TabsTrigger value="activity" className="gap-1.5"><Bell className="h-3.5 w-3.5" /> Aktivite</TabsTrigger>
            </TabsList>

            <div className="mt-4 space-y-4">
              <TabsContent value="about" className="m-0">
                <SectionCard>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-bold">Hakkında</h3>
                    <Badge variant="outline" className="text-[10px]">Demo</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{(person.bio ?? "").slice(0, 1000)}</p>
                  <div className="grid sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-1.5">İlgi Alanları</div>
                      <div className="flex flex-wrap gap-1.5">
                        {person.interests.map((i) => <Badge key={i} variant="outline">{i}</Badge>)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-1.5">Diller</div>
                      <div className="flex flex-wrap gap-1.5">
                        {person.languages.map((l) => <Badge key={l} variant="outline"><Globe className="h-3 w-3 mr-1" />{l}</Badge>)}
                      </div>
                    </div>
                  </div>
                  {person.cvAvailable && (
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-medium">CV / Özgeçmiş yüklü</span>
                        <span
                          className="text-[11px] text-muted-foreground inline-flex items-center"
                          title="CV İste'ye basınca üyenin bildirimlerine talep düşer. Kabul/Red şeklinde çalışır; kabulde CV'si sana iletilir."
                        >
                          <Info className="h-3 w-3 opacity-60" />
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          toast({
                            title: "CV talebin iletildi",
                            description: `${person.name} bildirimlerinden talebini görecek. Kabul ederse CV'si sana gönderilir; reddederse bilgilendirilirsin.`,
                          });
                        }}
                      >
                        CV İste
                      </Button>
                    </div>
                  )}
                </SectionCard>
              </TabsContent>

              <TabsContent value="requests" className="m-0">
                <SectionCard>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold">Hizmet Talepleri</h3>
                    <Badge variant="outline" className="text-[10px]">Demo</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-3">
                    Yalnızca üyenin "Profilimde göster" anahtarını açtığı hizmet talepleri listelenir.
                    Aynı anda en fazla <strong>4 aktif talep</strong> görünür ve her talep <strong>21 gün</strong> süreyle profilde / AI-match bildirimlerde kalır.
                  </p>
                  <ul className="space-y-2">
                    {person.serviceRequests.slice(0, 4).map((r, i) => (
                      <li key={i} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border">
                        <div>
                          <div className="text-sm font-semibold">{r.title}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{r.category} · {r.date}</div>
                        </div>
                        <Badge variant={r.status === "Açık" ? "default" : "outline"}>{r.status}</Badge>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              </TabsContent>

              <TabsContent value="events" className="m-0">
                <SectionCard>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-bold">Katıldığı Etkinlikler</h3>
                    <Badge variant="outline" className="text-[10px]">Demo</Badge>
                  </div>
                  <ul className="space-y-2">
                    {person.joinedEvents.map((e, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <div>
                            <div className="text-sm font-semibold">{e.title}</div>
                            <div className="text-[11px] text-muted-foreground">{e.city}</div>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{e.date}</span>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              </TabsContent>

              <TabsContent value="follows" className="m-0">
                <SectionCard>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold">Takip Ettikleri</h3>
                    <Badge variant="outline" className="text-[10px]">Demo</Badge>
                  </div>
                  {isFollowsVisibleOnProfile() ? (
                    <>
                      <p className="text-[11px] text-muted-foreground mb-3">
                        Profilde en fazla 50 takip gösterilir. Üye panelinden bu listeyi gizleyebilir.
                      </p>
                      <ul className="grid sm:grid-cols-2 gap-2">
                        {person.follows.slice(0, 50).map((f, i) => (
                          <li key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border">
                            <div>
                              <div className="text-sm font-semibold">{f.name}</div>
                              <div className="text-[11px] text-muted-foreground">{f.type}</div>
                            </div>
                            <Button size="sm" variant="outline">Gör</Button>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      Bu üye takip ettiklerini gizli tutuyor.
                    </p>
                  )}
                </SectionCard>
              </TabsContent>


              <TabsContent value="whatsapp" className="m-0">
                <SectionCard>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-bold">Admini olduğu WhatsApp grupları</h3>
                    <Badge variant="outline" className="text-[10px]">Demo</Badge>
                  </div>
                  <ul className="space-y-2">
                    {person.whatsappGroups.map((g, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-emerald-600" />
                          <div>
                            <div className="text-sm font-semibold">{g.name}</div>
                            <div className="text-[11px] text-muted-foreground">{g.members} üye</div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">Katıl</Button>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              </TabsContent>


              <TabsContent value="activity" className="m-0">
                <SectionCard>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold">Son Aktiviteler</h3>
                    <Badge variant="outline" className="text-[10px]">Demo</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-3">
                    Yalnızca platformdaki son 3 aktivite gösterilir (panel içi işlemler hariç).
                  </p>
                  <ul className="space-y-2">
                    {person.recentActivity.slice(0, 3).map((a, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-2 text-sm">
                          <Bell className="h-3.5 w-3.5 text-primary" />
                          {a.text}
                        </div>
                        <span className="text-[11px] text-muted-foreground">{a.date}</span>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DiasporaPersonDetail;
