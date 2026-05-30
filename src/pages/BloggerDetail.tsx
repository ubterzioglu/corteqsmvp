import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, PenLine, Video, Instagram, Globe as GlobeIcon, ArrowLeft, ExternalLink, UserPlus, UserCheck, Eye, Heart, MessageSquare, Calendar, Handshake, Play, Users, Phone, Bot, MessageCircle, Mail, Building2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import { bloggers } from "@/data/mock";
import { useToast } from "@/hooks/use-toast";
import { useFollow } from "@/hooks/useFollow";

const BloggerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const blogger = bloggers.find((b) => b.id === id);
  const { isFollowed, toggle } = useFollow();
  const isFollowing = blogger ? isFollowed("blogger", blogger.id) : false;
  const [collabOpen, setCollabOpen] = useState(false);
  const [collabForm, setCollabForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    collabType: "",
    budget: "",
    message: "",
  });

  const updateCollab = (k: string, v: string) => setCollabForm((p) => ({ ...p, [k]: v }));

  const submitCollab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabForm.name || !collabForm.email || !collabForm.message) {
      toast({ title: "Eksik bilgi", description: "Ad, e-posta ve mesaj zorunlu.", variant: "destructive" });
      return;
    }
    toast({
      title: "İşbirliği teklifi gönderildi! 🤝",
      description: `${blogger?.name} en kısa sürede sizinle iletişime geçecek.`,
    });
    setCollabOpen(false);
    setCollabForm({ name: "", company: "", email: "", phone: "", collabType: "", budget: "", message: "" });
  };

  if (!blogger) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4 text-center py-20">
          <h1 className="text-2xl font-bold text-foreground mb-4">Profil bulunamadı</h1>
          <Link to="/bloggers" className="text-primary hover:underline">← Geri dön</Link>
        </div>
      </div>
    );
  }

  const toggleFollow = () => {
    toggle("blogger", blogger.id, blogger.name);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link to="/bloggers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Geri dön
          </Link>

          {/* Header */}
          <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card mb-8">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <img src={blogger.photo} alt={blogger.name} className="w-24 h-24 rounded-2xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">{blogger.name}</h1>
                  <Badge variant={blogger.type === "blogger" ? "secondary" : "default"}>
                    {blogger.type === "youtuber" ? "YouTuber" : blogger.type === "influencer" ? "Vlogger" : "Blogger"}
                  </Badge>
                  <Button variant={isFollowing ? "secondary" : "outline"} size="sm" className="gap-1" onClick={toggleFollow}>
                    {isFollowing ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                    {isFollowing ? "Takipte" : "Takip Et"}
                  </Button>
                </div>
                <p className="text-muted-foreground font-body mt-1">{blogger.bio}</p>
                <p className="text-sm text-muted-foreground font-body mt-2">📍 {blogger.city}, {blogger.country} · 🌍 {blogger.region}</p>
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-gold fill-gold" />
                    <span className="font-semibold text-foreground">{blogger.rating}</span>
                    <span className="text-sm text-muted-foreground">({blogger.reviews} değerlendirme)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">{(blogger.followers / 1000).toFixed(0)}K</span>
                    <span className="text-sm text-muted-foreground">takipçi</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-muted/60 rounded-full px-2.5 py-1">
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="h-3.5 w-3.5" />
                    <span className="text-sm font-semibold text-foreground">4.{Math.floor(Math.random() * 3) + 7}</span>
                    <span className="text-xs text-muted-foreground">Google</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {blogger.languages.map((l) => (
                    <span key={l} className="text-xs bg-muted text-muted-foreground rounded-full px-3 py-1">{l}</span>
                  ))}
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
                {/* Pricing */}
                <div className="bg-muted/50 rounded-xl p-3 mb-1">
                  <p className="text-xs text-muted-foreground font-body text-center mb-2">Görüşme Ücretleri</p>
                  <div className="flex gap-4 justify-center text-center">
                    <div>
                      <p className="text-lg font-bold text-foreground">€20</p>
                      <p className="text-[10px] text-muted-foreground">Canlı / 30dk</p>
                    </div>
                    <div className="w-px bg-border" />
                    <div>
                      <p className="text-lg font-bold text-success">Ücretsiz</p>
                      <p className="text-[10px] text-muted-foreground">AI Twin / 10dk</p>
                    </div>
                  </div>
                </div>
                {/* AI Twin & Canlı Görüşme */}
                <Button className="gap-2 w-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-semibold">
                  <Bot className="h-4 w-4" /> AI Twin ile Sohbet
                </Button>
                <Button variant="outline" className="gap-2 w-full border-success text-success hover:bg-success/10">
                  <Phone className="h-4 w-4" /> Canlı Görüşme
                </Button>
                <Button variant="outline" className="gap-2 w-full border-green-600 text-green-600 hover:bg-green-600/10">
                  <MessageCircle className="h-4 w-4" /> WhatsApp Görüşme
                </Button>
                <Button variant="outline" className="gap-2 w-full">
                  <MessageSquare className="h-4 w-4" /> Mesaj Gönder
                </Button>
                <Dialog open={collabOpen} onOpenChange={setCollabOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2 w-full">
                      <Calendar className="h-4 w-4" /> İşbirliği Teklifi
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Handshake className="h-5 w-5 text-primary" /> {blogger.name} ile İşbirliği
                      </DialogTitle>
                      <DialogDescription>
                        Teklifinizi iletin, talep kaydedilsin ve {blogger.name} sizinle iletişime geçsin.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitCollab} className="space-y-3 mt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="c-name">Ad Soyad *</Label>
                          <Input id="c-name" value={collabForm.name} onChange={(e) => updateCollab("name", e.target.value)} placeholder="Adınız" />
                        </div>
                        <div>
                          <Label htmlFor="c-company">Şirket / Marka</Label>
                          <div className="relative">
                            <Building2 className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                            <Input id="c-company" className="pl-8" value={collabForm.company} onChange={(e) => updateCollab("company", e.target.value)} placeholder="Şirket adı" />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="c-email">E-posta *</Label>
                          <div className="relative">
                            <Mail className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                            <Input id="c-email" type="email" className="pl-8" value={collabForm.email} onChange={(e) => updateCollab("email", e.target.value)} placeholder="ornek@firma.com" />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="c-phone">Telefon</Label>
                          <div className="relative">
                            <Phone className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                            <Input id="c-phone" className="pl-8" value={collabForm.phone} onChange={(e) => updateCollab("phone", e.target.value)} placeholder="+90 ..." />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label>İşbirliği Türü</Label>
                          <Select value={collabForm.collabType} onValueChange={(v) => updateCollab("collabType", v)}>
                            <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                            <SelectContent>
                              {(blogger.collabTypes?.length ? blogger.collabTypes : ["Sponsorlu İçerik", "Ürün Tanıtımı", "Marka Elçiliği", "Etkinlik Partneri"]).map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="c-budget">Bütçe (€)</Label>
                          <Input id="c-budget" value={collabForm.budget} onChange={(e) => updateCollab("budget", e.target.value)} placeholder="Örn. 500-1000" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="c-msg">Mesaj / Brief *</Label>
                        <Textarea id="c-msg" rows={4} value={collabForm.message} onChange={(e) => updateCollab("message", e.target.value)} placeholder="Kampanya hedefiniz, beklenen içerik, tarih..." />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setCollabOpen(false)}>İptal</Button>
                        <Button type="submit" className="gap-2"><Send className="h-4 w-4" /> Teklifi Gönder</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                {blogger.adCollaboration && (
                  <div className="bg-gold/10 border border-gold/20 rounded-xl p-3 mt-2">
                    <div className="flex items-center gap-2 text-gold font-semibold text-sm mb-2">
                      <Handshake className="h-4 w-4" /> Reklam İşbirliği
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {blogger.collabTypes.map((c) => (
                        <span key={c} className="text-[10px] bg-gold/15 text-gold rounded-full px-2 py-0.5">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="blog" className="w-full">
            <TabsList className="bg-card border border-border w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="blog">Blog Yazıları</TabsTrigger>
              {blogger.vlogs.length > 0 && <TabsTrigger value="vlogs">Vloglar</TabsTrigger>}
              <TabsTrigger value="about">Hakkında</TabsTrigger>
              <TabsTrigger value="contact">İletişim</TabsTrigger>
              {blogger.instagram && (
                <a href={`https://instagram.com/${blogger.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center">
                  <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-muted transition-colors">
                    <Instagram className="h-3 w-3" /> {blogger.instagram}
                  </Badge>
                </a>
              )}
              {blogger.youtube && (
                <a href={`https://youtube.com/${blogger.youtube}`} target="_blank" rel="noopener noreferrer" className="flex items-center">
                  <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-muted transition-colors">
                    <Video className="h-3 w-3" /> YouTube
                  </Badge>
                </a>
              )}
              <a href={blogger.website} target="_blank" rel="noopener noreferrer" className="flex items-center">
                <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-muted transition-colors">
                  <GlobeIcon className="h-3 w-3" /> Web Sitesi
                </Badge>
              </a>
            </TabsList>

            <TabsContent value="blog" className="mt-6">
              {blogger.blogPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {blogger.blogPosts.map((post) => (
                    <div key={post.id} className="bg-card rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all">
                      <div className="aspect-video">
                        <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-5">
                        <div className="flex flex-wrap gap-1 mb-2">
                          {post.tags.map((tag) => (
                            <span key={tag} className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5">#{tag}</span>
                          ))}
                        </div>
                        <h3 className="font-bold text-foreground text-lg mb-2">{post.title}</h3>
                        <p className="text-sm text-muted-foreground font-body mb-3">{post.excerpt}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {post.likes}</span>
                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {post.views.toLocaleString()}</span>
                          </div>
                          <span>{post.publishedAt}</span>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-3 gap-1">
                          <PenLine className="h-3 w-3" /> Yazıyı Oku
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground font-body">Henüz blog yazısı yok.</div>
              )}
            </TabsContent>

            {blogger.vlogs.length > 0 && (
              <TabsContent value="vlogs" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {blogger.vlogs.map((vlog) => (
                    <div key={vlog.id} className="bg-card rounded-2xl border border-border overflow-hidden shadow-card">
                      <div className="aspect-video relative group">
                        <img src={vlog.thumbnail} alt={vlog.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-foreground/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-primary text-primary-foreground rounded-full p-3">
                            <Play className="h-6 w-6" />
                          </div>
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-foreground mb-1">{vlog.title}</h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="h-3 w-3" /> {vlog.views.toLocaleString()} görüntülenme
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            )}

            <TabsContent value="about" className="mt-6">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-xl font-bold text-foreground mb-4">Hakkında</h2>
                <p className="text-muted-foreground font-body leading-relaxed mb-6">{blogger.bio}</p>
                <h3 className="font-semibold text-foreground mb-3">Uzmanlık Alanları</h3>
                <div className="flex flex-wrap gap-2">
                  {blogger.specialties.map((s) => (
                    <span key={s} className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-sm">{s}</span>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="mt-6">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-xl font-bold text-foreground mb-4">İletişim</h2>
                <div className="space-y-4">
                  <a href={blogger.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                    <GlobeIcon className="h-5 w-5 text-primary" />
                    <span className="text-foreground font-body">{blogger.website}</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                  </a>
                  {blogger.instagram && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                      <Instagram className="h-5 w-5 text-primary" />
                      <span className="text-foreground font-body">{blogger.instagram}</span>
                    </div>
                  )}
                  {blogger.youtube && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                      <Video className="h-5 w-5 text-primary" />
                      <span className="text-foreground font-body">{blogger.youtube}</span>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default BloggerDetail;
