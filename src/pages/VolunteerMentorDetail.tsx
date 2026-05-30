import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, HandHeart, Heart, MessageSquare, MapPin, UserPlus, UserCheck, Send, Instagram, Linkedin, Facebook, Sparkles, Star, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import PlatformMessageDialog from "@/components/messaging/PlatformMessageDialog";
import DetailAuthLock from "@/components/DetailAuthLock";

import { consultants } from "@/data/mock";
import { useFollow } from "@/hooks/useFollow";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type Comment = { id: string; name: string; avatar: string; text: string; date: string; likes: number };

const seedComments: Comment[] = [
  { id: "c1", name: "Ayşe K.", avatar: "AK", text: "Amsterdam'a yeni taşındığımda Özlem Hanım bana okul başvurularında yardımcı oldu. Tamamen gönüllü, çok samimi. Çok teşekkürler 🙏", date: "2 gün önce", likes: 14 },
  { id: "c2", name: "Mehmet S.", avatar: "MS", text: "BSN numarası ve belediye randevusu konusunda adım adım anlattı. Bu dayanışma çok değerli!", date: "1 hafta önce", likes: 9 },
  { id: "c3", name: "Zeynep T.", avatar: "ZT", text: "Türk topluluğuna bağlandığım ilk insan oldu. Mentörlüğü için minnettarım.", date: "3 hafta önce", likes: 22 },
];

const VolunteerMentorDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const mentor = consultants.find((c) => c.id === id);
  const { isFollowed, toggle } = useFollow();
  const isFollowing = mentor ? isFollowed("consultant", mentor.id) : false;

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(238);
  const [comments, setComments] = useState<Comment[]>(seedComments);
  const [newComment, setNewComment] = useState("");
  const [messageOpen, setMessageOpen] = useState(false);

  const handleMessageClick = () => setMessageOpen(true);


  if (!mentor) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4 text-center py-20">
          <h1 className="text-2xl font-bold text-foreground mb-4">Gönüllü mentör bulunamadı</h1>
          <Link to="/consultants?filter=gonullu" className="text-primary hover:underline">← Gönüllülere dön</Link>
        </div>
      </div>
    );
  }

  const handleLike = () => {
    setLiked((v) => !v);
    setLikeCount((n) => (liked ? n - 1 : n + 1));
  };

  const submitComment = () => {
    const text = newComment.trim();
    if (!text) return;
    setComments((prev) => [
      { id: `c${Date.now()}`, name: "Sen", avatar: "SN", text, date: "şimdi", likes: 0 },
      ...prev,
    ]);
    setNewComment("");
    toast({ title: "Yorum eklendi", description: "Dayanışmaya katkın için teşekkürler!" });
  };

  const mentorshipTopics = mentor.specialties ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link to="/consultants?filter=gonullu" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Gönüllülere dön
          </Link>
          <DetailAuthLock category="mentör profili" />

          {/* Demo notice */}
          <div className="bg-gold/15 border border-gold/40 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-foreground shrink-0" />
            <p className="text-xs md:text-sm text-foreground font-body">
              <span className="font-bold uppercase tracking-wider mr-1">Demo</span>
              Bu sayfa örnek içeriktir. Gerçek gönüllü mentör profilleri yakında.
            </p>
          </div>

          {/* Solidarity banner */}
          <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <div className="bg-emerald-500/15 p-2 rounded-full">
              <HandHeart className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Gönüllü Mentörlük — Ücretsiz Dayanışma 🤝</p>
              <p className="text-xs text-muted-foreground font-body">Bu mentör ticari hizmet vermez. Yaşadığı şehirde yeni gelen Türklere gönüllü olarak destek olur.</p>
            </div>
          </div>

          {/* Header */}
          <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card mb-8">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <img src={mentor.photo} alt={mentor.name} className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">{mentor.name}</h1>
                  <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 border border-emerald-500/40 hover:bg-emerald-500/20">
                    <HandHeart className="h-3 w-3" /> Gönüllü Mentör
                  </Badge>
                </div>
                <p className="text-muted-foreground font-body">{mentor.role}</p>
                <p className="text-sm text-muted-foreground font-body mt-1 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {mentor.city}, {mentor.country}</p>

                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  <button onClick={handleLike} className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${liked ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"}`}>
                    <Heart className={`h-4 w-4 ${liked ? "fill-rose-500" : ""}`} /> {likeCount}
                  </button>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4" /> {comments.length} yorum
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Star className="h-4 w-4 text-gold fill-gold" />
                    <span className="font-semibold text-foreground">{mentor.rating}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {mentor.languages.map((l) => (
                    <span key={l} className="text-xs bg-muted text-muted-foreground rounded-full px-3 py-1">{l}</span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
                <Button
                  variant={isFollowing ? "secondary" : "default"}
                  className="gap-2 w-full"
                  onClick={() => toggle("consultant", mentor.id, mentor.name)}
                >
                  {isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {isFollowing ? "Takipte" : "Takip Et"}
                </Button>
                <Button className="gap-2 w-full" onClick={handleMessageClick}>
                  <MessageSquare className="h-4 w-4" /> Mesaj Gönder
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column: Bio + Mentorship topics */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-lg font-bold text-foreground mb-3">Hakkında</h2>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">{mentor.bio}</p>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                  <HandHeart className="h-5 w-5 text-emerald-600" /> Mentörlük Konuları
                </h2>
                <div className="flex flex-wrap gap-2">
                  {mentorshipTopics.map((t) => (
                    <Badge key={t} variant="secondary" className="bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 hover:bg-emerald-500/15">
                      {t}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4 font-body">
                  Bu konular için Özlem Hanım haftada birkaç saatini yeni gelen Türklere ayırıyor — tamamen gönüllülük esasıyla.
                </p>
              </div>

              {/* Comments */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" /> Yorumlar & Teşekkürler ({comments.length})
                </h2>
                <div className="flex flex-col gap-2 mb-5">
                  <Textarea
                    placeholder="Deneyimini paylaş veya teşekkür et..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={2}
                  />
                  <div className="flex justify-end">
                    <Button size="sm" onClick={submitComment} className="gap-1.5">
                      <Send className="h-3.5 w-3.5" /> Gönder
                    </Button>
                  </div>
                </div>
                <div className="space-y-4">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3 pb-4 border-b border-border last:border-0">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-foreground shrink-0">
                        {c.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">{c.name}</span>
                          <span className="text-xs text-muted-foreground">{c.date}</span>
                        </div>
                        <p className="text-sm text-foreground mt-1 font-body">{c.text}</p>
                        <button className="text-xs text-muted-foreground hover:text-rose-500 mt-1.5 inline-flex items-center gap-1">
                          <Heart className="h-3 w-3" /> {c.likes}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column: Contact + Social */}
            <div className="space-y-6">

              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-lg font-bold text-foreground mb-3">Sosyal Medya</h2>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="icon" asChild>
                    <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                      <Instagram className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                      <Linkedin className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                      <Facebook className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-2xl p-6">
                <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                  <HandHeart className="h-4 w-4 text-emerald-600" /> Sen de Gönüllü Ol
                </h3>
                <p className="text-xs text-muted-foreground font-body mb-3">
                  Yaşadığın şehirde yeni gelen Türklere destek olmak istiyor musun? Son kullanıcı panelinden Gönüllü Mentör Ol butonuna tıkla.
                </p>
                <Link to="/profile">
                  <Button size="sm" variant="outline" className="w-full border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10">
                    Gönüllü Mentör Ol
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PlatformMessageDialog
        open={messageOpen}
        onOpenChange={setMessageOpen}
        recipientKind="volunteer"
        recipientSlug={mentor.id}
        recipientName={mentor.name}
        defaultSubject={`Gönüllü mentörlük talebi — ${mentor.city}`}
      />
    </div>
  );
};

export default VolunteerMentorDetail;
