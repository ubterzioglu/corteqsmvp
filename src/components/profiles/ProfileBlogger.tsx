import { useState, useEffect } from "react";
import SocialMediaCampaignDialog from "@/components/SocialMediaCampaignDialog";
import CategoryShowcasePurchase from "@/components/CategoryShowcasePurchase";
import {
  Users, MapPin, Globe, Calendar, Heart, Megaphone,
  TrendingUp, Settings, Star, Eye, BarChart3, CreditCard, Crown,
  Instagram, Video, Bot, MessageSquare, Phone, PenLine,
  Edit3, Handshake, Play, Link2, Trash2, ExternalLink, Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import WhatsAppGroupsTab from "@/components/profiles/WhatsAppGroupsTab";
import { addDiasporaBlogLink, getDiasporaBlogLinksByAuthor, removeDiasporaBlogLink, type DiasporaBlogLink } from "@/lib/diasporaBlogLinks";
import { toast } from "@/hooks/use-toast";

const ProfileBlogger = () => {
  const blogger = {
    name: "Selin Akış",
    title: "Travel & Lifestyle Influencer",
    email: "info@corteqs.net",
    country: "Hollanda",
    city: "Amsterdam",
    avatar: "SA",
    followers: 24500,
    totalViews: 1200000,
    posts: 186,
    rating: 4.8,
    reviewCount: 64,
    languages: ["Türkçe", "İngilizce", "Hollandaca"],
    description: "Hollanda'da yaşam, seyahat ve diaspora kültürü üzerine içerik üreten influencer. YouTube ve Instagram'da aktif.",
    balance: 3200.00,
    instagram: "@selinakis",
    youtube: "SelinAkışVlog",
    website: "selinakis.com",
    gustos: ["Seyahat", "Yaşam", "Kültür", "Yemek"],
    aiTwinEnabled: true,
  };

  // Diaspora blog link uploader state (links published to Medya page → Türk Diaspora Medyası filter)
  const [myBlogLinks, setMyBlogLinks] = useState<DiasporaBlogLink[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDesc, setLinkDesc] = useState("");

  useEffect(() => {
    setMyBlogLinks(getDiasporaBlogLinksByAuthor(blogger.name));
  }, []);

  const handleAddLink = () => {
    if (!linkUrl.trim() || !linkTitle.trim()) {
      toast({ title: "Eksik alan", description: "Link ve başlık zorunludur.", variant: "destructive" });
      return;
    }
    addDiasporaBlogLink({
      url: linkUrl.trim(),
      title: linkTitle.trim(),
      description: linkDesc.trim() || undefined,
      author: blogger.name,
      city: blogger.city,
      country: blogger.country,
    });
    setMyBlogLinks(getDiasporaBlogLinksByAuthor(blogger.name));
    setLinkUrl("");
    setLinkTitle("");
    setLinkDesc("");
    toast({ title: "Yazı eklendi", description: "Medya → Türk Diaspora Medyası filtresinde yayında." });
  };

  const handleRemoveLink = (id: string) => {
    removeDiasporaBlogLink(id);
    setMyBlogLinks(getDiasporaBlogLinksByAuthor(blogger.name));
  };

  const sessions = {
    aiTwin: [
      { id: 1, client: "Emre Aydın", date: "09 Mar 2026", time: "14:20", duration: "22dk", amount: 0 },
      { id: 2, client: "Fatma Kaya", date: "08 Mar 2026", time: "10:15", duration: "30dk", amount: 10 },
      { id: 3, client: "Can Özdemir", date: "07 Mar 2026", time: "19:45", duration: "18dk", amount: 0 },
    ],
    live: [
      { id: 10, client: "Zeynep Arslan", date: "12 Mar 2026", time: "15:00", duration: "30dk", status: "Onaylı", amount: 20 },
      { id: 11, client: "Ali Öztürk", date: "14 Mar 2026", time: "11:00", duration: "30dk", status: "Beklemede", amount: 20 },
    ],
  };

  const collaborations = [
    { brand: "Turkish Airlines", type: "Sponsorlu İçerik", status: "Aktif", fee: "€500" },
    { brand: "Booking.com", type: "Affiliate", status: "Aktif", fee: "Komisyon" },
    { brand: "CorteQS", type: "Marka Elçisi", status: "Aktif", fee: "€200/ay" },
  ];

  const blogPosts = [
    { title: "Amsterdam'da Türk Mahalleleri", views: 12400, likes: 890, date: "05 Mar" },
    { title: "Hollanda Oturma İzni Rehberi", views: 28500, likes: 2100, date: "28 Şub" },
    { title: "Diaspora Mutfağı: En İyi 10 Tarif", views: 8900, likes: 650, date: "20 Şub" },
  ];

  const stats = {
    monthlyViews: 85000,
    monthlyEngagement: "4.2%",
    monthlyRevenue: 1850,
    newFollowers: 1200,
  };

  return (
    <>
      {/* Blogger header */}
      <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shrink-0">
            {blogger.avatar}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{blogger.name}</h1>
              <Badge className="bg-pink-500/15 text-pink-600 border-pink-500/30 gap-1">
                <Play className="h-3 w-3" /> Influencer
              </Badge>
              {blogger.aiTwinEnabled && (
                <Badge className="bg-primary/15 text-primary border-primary/30 gap-1">
                  <Bot className="h-3 w-3" /> AI Twin Aktif
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground font-medium mt-0.5">{blogger.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{blogger.description}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {blogger.city}, {blogger.country}</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {(blogger.followers / 1000).toFixed(1)}K takipçi</span>
              <span className="flex items-center gap-1"><Star className="h-3 w-3 text-gold" /> {blogger.rating} ({blogger.reviewCount})</span>
              <span className="flex items-center gap-1"><Instagram className="h-3 w-3" /> {blogger.instagram}</span>
              <a href={`https://${blogger.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                <Globe className="h-3 w-3" /> {blogger.website}
              </a>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {blogger.gustos.map((g) => (
                <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
              ))}
            </div>
          </div>
          <div className="bg-pink-500/10 rounded-xl p-4 text-center shrink-0 min-w-[140px]">
            <CreditCard className="h-5 w-5 text-pink-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">€{blogger.balance.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Bakiye</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Aylık Görüntülenme", value: `${(stats.monthlyViews / 1000).toFixed(0)}K`, icon: Eye, color: "text-primary" },
          { label: "Etkileşim Oranı", value: stats.monthlyEngagement, icon: Heart, color: "text-pink-500" },
          { label: "Aylık Gelir", value: `€${stats.monthlyRevenue}`, icon: CreditCard, color: "text-success" },
          { label: "Yeni Takipçi", value: `+${stats.newFollowers}`, icon: Users, color: "text-turquoise" },
        ].map((stat, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-3 shadow-card text-center">
            <stat.icon className={`h-4 w-4 ${stat.color} mx-auto mb-1`} />
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="bg-card border border-border w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="content" className="gap-1.5"><PenLine className="h-4 w-4" /> İçerikler</TabsTrigger>
          <TabsTrigger value="sessions" className="gap-1.5"><Video className="h-4 w-4" /> Görüşmeler</TabsTrigger>
          <TabsTrigger value="collaborations" className="gap-1.5"><Handshake className="h-4 w-4" /> İşbirlikleri</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Analitik</TabsTrigger>
          <TabsTrigger value="promotions" className="gap-1.5"><Megaphone className="h-4 w-4" /> Tanıtım</TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5"><MessageSquare className="h-4 w-4" /> WhatsApp</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5"><Settings className="h-4 w-4" /> Ayarlar</TabsTrigger>
        </TabsList>

        {/* CONTENT */}
        <TabsContent value="content" className="mt-6 space-y-6">
          {/* Diaspora Blog Link Uploader */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-primary" /> Blog Linkleri Yükle
                </h2>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Radio className="h-3 w-3" />
                  Eklediğiniz yazılar <strong className="mx-1">Medya → Türk Diaspora Medyası</strong> filtresinde yayınlanır.
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">{myBlogLinks.length} yazı</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <Label className="text-xs">Yazı Linki *</Label>
                <Input
                  placeholder="https://blogunuz.com/yazi"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Yazı Başlığı *</Label>
                <Input
                  placeholder="Amsterdam'da Türk Mahalleleri"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                />
              </div>
            </div>
            <div className="mb-3">
              <Label className="text-xs">Kısa Açıklama (opsiyonel)</Label>
              <Textarea
                rows={2}
                placeholder="Yazının kısa özeti..."
                value={linkDesc}
                onChange={(e) => setLinkDesc(e.target.value)}
              />
            </div>
            <Button onClick={handleAddLink} className="gap-2">
              <Link2 className="h-4 w-4" /> Linki Yayınla
            </Button>

            {myBlogLinks.length > 0 && (
              <div className="mt-5 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Yayınlanan Yazılarım</p>
                {myBlogLinks.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{b.title}</p>
                      <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 truncate">
                        <ExternalLink className="h-3 w-3" /> {b.url}
                      </a>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveLink(b.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <PenLine className="h-5 w-5 text-primary" /> Blog Yazıları & İçerikler
              </h2>
              <Button className="gap-2"><PenLine className="h-4 w-4" /> Yeni İçerik</Button>
            </div>
            <div className="space-y-3">
              {blogPosts.map((post, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{post.title}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-3">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {(post.views / 1000).toFixed(1)}K görüntülenme</span>
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {post.likes} beğeni</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {post.date}</span>
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Düzenle</Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* SESSIONS */}
        <TabsContent value="sessions" className="mt-6 space-y-6">
          {/* AI Twin */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" /> AI Twin Sohbetleri
              </h2>
              <div className="text-sm text-muted-foreground">Ücretsiz · İlk 10dk</div>
            </div>
            <div className="space-y-2">
              {sessions.aiTwin.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{s.client}</p>
                    <p className="text-xs text-muted-foreground">{s.date} · {s.time} · {s.duration}</p>
                  </div>
                  <Badge className="bg-turquoise/15 text-turquoise border-turquoise/30 text-[10px]">Tamamlandı</Badge>
                  <span className="text-sm font-semibold text-foreground">{s.amount > 0 ? `€${s.amount}` : "Ücretsiz"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live sessions */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Video className="h-5 w-5 text-turquoise" /> Canlı Görüşmeler
              </h2>
              <div className="text-sm text-muted-foreground">€20/30dk</div>
            </div>
            <div className="space-y-2">
              {sessions.live.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-9 h-9 rounded-full bg-turquoise/10 flex items-center justify-center shrink-0">
                    <Video className="h-4 w-4 text-turquoise" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{s.client}</p>
                    <p className="text-xs text-muted-foreground">{s.date} · {s.time} · {s.duration}</p>
                  </div>
                  <Badge className={`text-[10px] ${s.status === "Onaylı" ? "bg-turquoise/15 text-turquoise border-turquoise/30" : "bg-gold/15 text-gold border-gold/30"}`}>
                    {s.status}
                  </Badge>
                  <span className="text-sm font-semibold text-foreground">€{s.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* COLLABORATIONS */}
        <TabsContent value="collaborations" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Handshake className="h-5 w-5 text-primary" /> Marka İşbirlikleri
              </h2>
              <Button variant="outline" className="gap-2"><Handshake className="h-4 w-4" /> Yeni İşbirliği</Button>
            </div>
            <div className="space-y-3">
              {collaborations.map((c, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {c.brand.substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{c.brand}</h3>
                    <p className="text-sm text-muted-foreground">{c.type}</p>
                  </div>
                  <Badge className="bg-turquoise/15 text-turquoise border-turquoise/30 text-xs">{c.status}</Badge>
                  <span className="text-sm font-semibold text-foreground">{c.fee}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ANALYTICS */}
        <TabsContent value="analytics" className="mt-6 space-y-6">
          {/* KPI Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Bu Ay İçerik", value: "24", prev: "18", icon: PenLine, color: "text-primary" },
              { label: "Ort. Etkileşim", value: "4.2%", prev: "3.8%", icon: Heart, color: "text-pink-500" },
              { label: "Toplam Görüntülenme", value: "85K", prev: "72K", icon: Eye, color: "text-chart-3" },
              { label: "Bu Ay Gelir", value: `€${stats.monthlyRevenue}`, prev: "€1,620", icon: CreditCard, color: "text-success" },
            ].map((kpi, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-4 shadow-card">
                <div className="flex items-center justify-between mb-2">
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                  <span className="text-[10px] text-muted-foreground">Önceki: {kpi.prev}</span>
                </div>
                <p className="text-xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Monthly Content & Engagement Chart */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> Aylık İçerik & Etkileşim
              </h2>
            </div>
            <div className="space-y-3">
              {[
                { month: "Ocak", content: 18, engagement: 3.5, views: 62000 },
                { month: "Şubat", content: 20, engagement: 3.8, views: 68000 },
                { month: "Mart", content: 22, engagement: 4.0, views: 75000 },
                { month: "Nisan", content: 19, engagement: 3.9, views: 71000 },
                { month: "Mayıs", content: 24, engagement: 4.1, views: 82000 },
                { month: "Haziran", content: 24, engagement: 4.2, views: 85000 },
              ].map((m) => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-14 shrink-0">{m.month}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 bg-muted rounded-full h-2.5">
                        <div className="bg-primary rounded-full h-2.5 transition-all" style={{ width: `${(m.content / 30) * 100}%` }} />
                      </div>
                      <span className="text-[10px] font-semibold text-foreground w-8">{m.content}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div className="bg-pink-500 rounded-full h-2 transition-all" style={{ width: `${(m.engagement / 6) * 100}%` }} />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground w-8">%{m.engagement}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground w-12 text-right">{(m.views / 1000).toFixed(0)}K</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" /> İçerik Sayısı</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block" /> Etkileşim %</span>
              <span>Görüntülenme (sağ)</span>
            </div>
          </div>

          {/* Platform Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Platform Performansı
              </h2>
              <div className="space-y-4">
                {[
                  { source: "Blog Yazıları", count: 48500, pct: 45 },
                  { source: "Instagram Reels", count: 32000, pct: 30 },
                  { source: "YouTube", count: 18000, pct: 17 },
                  { source: "TikTok", count: 8500, pct: 8 },
                ].map((s) => (
                  <div key={s.source}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground font-medium">{s.source}</span>
                      <span className="text-muted-foreground">{(s.count / 1000).toFixed(1)}K ({s.pct}%)</span>
                    </div>
                    <div className="bg-muted rounded-full h-2">
                      <div className="bg-primary rounded-full h-2" style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5 text-chart-3" /> Haftalık Görüntülenme
              </h2>
              <div className="space-y-2">
                {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day, i) => {
                  const val = [65, 78, 52, 91, 85, 70, 45][i];
                  return (
                    <div key={day} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-8">{day}</span>
                      <div className="flex-1 bg-muted rounded-full h-3">
                        <div className="bg-primary rounded-full h-3" style={{ width: `${val}%` }} />
                      </div>
                      <span className="text-xs font-medium text-foreground w-10 text-right">{(val * 120).toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* PROMOTIONS */}
        <TabsContent value="promotions" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" /> Tanıtım & Reklam
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { title: "Öne Çıkan Influencer", desc: "Ana sayfada ve arama sonuçlarında üst sıralarda görünün", price: "€29/hafta", icon: Star },
                { title: "WhatsApp Tanıtımı", desc: "CorteQS Kanalında Tanıtım", price: "€19/tanıtım", icon: Megaphone },
                { title: "Reklam İşbirliği", desc: "Markalarla eşleşme ve sponsorlu içerik fırsatları", price: "Değişken", icon: Handshake },
              ].map((promo) => (
                <div key={promo.title} className="border border-border rounded-xl p-4 hover:border-primary/30 hover:bg-primary/5 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <promo.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{promo.title}</h3>
                      <p className="text-xs font-semibold text-primary">{promo.price}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{promo.desc}</p>
                  <Button variant="outline" size="sm" className="w-full">Satın Al</Button>
                </div>
              ))}
              <div className="border border-primary/30 rounded-xl p-4 bg-primary/5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Megaphone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">Sosyal Medya Paketi</h3>
                    <p className="text-xs font-semibold text-primary">$25+/platform</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Sosyal medya hesaplarınızda profesyonel kampanya yönetimi</p>
                <SocialMediaCampaignDialog entityName={blogger.name} entityType="blogger" />
              </div>

              {/* Category Showcase */}
              <div className="bg-card rounded-2xl p-5 border border-gold/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-gold/10 p-2.5 rounded-full">
                    <Crown className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">Kategori Vitrini</h3>
                    <p className="text-xs font-semibold text-gold">€29+/hafta</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Kategorinizde ilk 6 sırada gösterilerek daha fazla müşteriye ulaşın</p>
                <CategoryShowcasePurchase entityName={blogger.name} category="V/Blogger" />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-6">
          <WhatsAppGroupsTab />
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-primary" /> Profil Bilgileri
              </h2>
              <div className="space-y-4">
                <div>
                  <Label>Ad Soyad</Label>
                  <Input defaultValue={blogger.name} />
                </div>
                <div>
                  <Label>Ünvan</Label>
                  <Input defaultValue={blogger.title} />
                </div>
                <div>
                  <Label>Bio / Hakkında</Label>
                  <Textarea defaultValue={blogger.description} rows={3} />
                </div>
                <div>
                  <Label>Gustolar (virgülle ayırın)</Label>
                  <Input defaultValue={blogger.gustos.join(", ")} />
                </div>
                <Button className="w-full mt-2">Profili Güncelle</Button>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" /> Sosyal Medya & İletişim
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label>Instagram</Label>
                    <Input defaultValue={blogger.instagram} />
                  </div>
                  <div>
                    <Label>YouTube</Label>
                    <Input defaultValue={blogger.youtube} />
                  </div>
                  <div>
                    <Label>Web Sitesi</Label>
                    <Input defaultValue={blogger.website} />
                  </div>
                  <div>
                    <Label>E-posta</Label>
                    <Input defaultValue={blogger.email} />
                  </div>
                  <Button variant="outline" className="w-full">Kaydet</Button>
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" /> Tercihler
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">AI Twin Aktif</p>
                      <p className="text-xs text-muted-foreground">Takipçileriniz AI Twin ile sohbet edebilsin</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">Canlı Görüşme Kabul Et</p>
                      <p className="text-xs text-muted-foreground">Randevu talepleri alın</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">İşbirliği Teklifleri</p>
                      <p className="text-xs text-muted-foreground">Markalardan teklif almaya açık</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default ProfileBlogger;
