import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  MessageSquare, Users, MapPin, ArrowLeft, ShieldCheck, Share2, Check, UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import { getLanding, type WhatsAppLanding } from "@/lib/whatsappLandings";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const categoryLabel: Record<WhatsAppLanding["category"], string> = {
  alumni: "Alumni",
  hobi: "Hobi",
  is: "İş Grubu",
  doktor: "Doktor / Sağlık",
  yatirim: "Yatırım & Girişim",
  girisim: "Yatırım & Girişim",
  akademik: "Akademik",
  dayanisma: "Dayanışma",
  diger: "Diğer",
};

const WhatsAppGroupLanding = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [landing, setLanding] = useState<WhatsAppLanding | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  const [loading, setLoading] = useState(true);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const [joinName, setJoinName] = useState("");
  const [joinEmail, setJoinEmail] = useState("");
  const [joinPhone, setJoinPhone] = useState("");
  const [joinNote, setJoinNote] = useState("");

  useEffect(() => {
    setJoinName(profile?.full_name ?? "");
    setJoinEmail(user?.email ?? "");
    setJoinPhone(profile?.phone ?? "");
  }, [user, profile]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    getLanding(id)
      .then((l) => { if (!cancelled) setLanding(l); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 text-center text-muted-foreground">Yükleniyor...</main>
      </div>
    );
  }

  if (!landing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-3">Landing sayfası bulunamadı</h1>
            <p className="text-muted-foreground mb-6">Bu grup için yayınlanmış bir landing sayfası yok.</p>
            <Button onClick={() => navigate("/whatsapp-groups")} variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> WhatsApp Grupları'na dön
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const conditions = landing.conditions
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: landing.groupName, text: landing.tagline, url });
        return;
      } catch { /* fallthrough */ }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: "Link kopyalandı", description: "Landing sayfası linkini paylaşabilirsin." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinRequest = async () => {
    if (!user) {
      toast({
        title: "Giriş gerekli",
        description: "Talep göndermek için giriş sayfası yeni sekmede açılıyor. Giriş yaptıktan sonra bu sekmeye dön ve tekrar Gönder'e bas.",
      });
      window.open("/auth", "_blank", "noopener");
      return;
    }
    if (!joinName.trim() || !joinEmail.trim()) {
      toast({ title: "Eksik alan", description: "Ad ve e-posta zorunludur.", variant: "destructive" });
      return;
    }
    setJoinSubmitting(true);
    try {
      const { error } = await supabase.from("whatsapp_join_requests").insert({
        landing_id: landing!.id,
        user_id: user.id,
        full_name: joinName.trim(),
        email: joinEmail.trim(),
        phone: joinPhone.trim() || null,
        note: joinNote.trim() || null,
      });
      if (error) throw error;
      toast({
        title: "Talebin alındı! 🎉",
        description: "Yöneticiler bilgilendirildi. Onay sonrası iletişime geçilecek.",
      });
      setJoinOpen(false);
      setJoinNote("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
      toast({ title: "Gönderilemedi", description: msg, variant: "destructive" });
    } finally {
      setJoinSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/whatsapp-groups" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" /> Tüm gruplar
          </Link>

          {/* HERO */}
          {landing.mode === "visual" && landing.heroImage ? (
            <section className="relative overflow-hidden rounded-3xl border border-border mb-8">
              <img
                src={landing.heroImage}
                alt={landing.groupName}
                className="w-full h-64 md:h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
                <Badge className="bg-[#25D366] text-white border-0 mb-3">
                  <MessageSquare className="h-3 w-3 mr-1" /> {categoryLabel[landing.category]}
                </Badge>
                <h1 className="text-3xl md:text-5xl font-extrabold mb-2 leading-tight">
                  {landing.groupName}
                </h1>
                <p className="text-base md:text-lg text-white/90 max-w-2xl">{landing.tagline}</p>
              </div>
            </section>
          ) : (
            <section className="rounded-3xl border border-border bg-gradient-to-br from-[#25D366]/10 via-card to-turquoise/5 p-8 md:p-12 mb-8 text-center">
              <Badge className="bg-[#25D366] text-white border-0 mb-4">
                <MessageSquare className="h-3 w-3 mr-1" /> {categoryLabel[landing.category]}
              </Badge>
              <h1 className="text-3xl md:text-5xl font-extrabold mb-3">{landing.groupName}</h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">{landing.tagline}</p>
            </section>
          )}

          {/* META */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-8">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {landing.city}, {landing.country}
            </span>
            {landing.adminName && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-4 w-4" /> Yönetici: {landing.adminName}
              </span>
            )}
          </div>

          {/* CTA */}
          <section className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-8">
            <h2 className="text-xl font-bold mb-3">Çağrımız</h2>
            <p className="text-foreground/90 leading-relaxed whitespace-pre-line mb-6">
              {landing.callToActionText}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="flex-1 gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white">
                    <UserPlus className="h-5 w-5" /> Katılma Talebi Gönder
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{landing.groupName} — Katılma Talebi</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 mt-2">
                    <div className="space-y-1.5">
                      <Label>Ad Soyad *</Label>
                      <Input value={joinName} onChange={(e) => setJoinName(e.target.value)} placeholder="Adınız Soyadınız" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>E-posta *</Label>
                      <Input type="email" value={joinEmail} onChange={(e) => setJoinEmail(e.target.value)} placeholder="ornek@email.com" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Telefon</Label>
                      <Input value={joinPhone} onChange={(e) => setJoinPhone(e.target.value)} placeholder="+49 ..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Not (opsiyonel)</Label>
                      <Textarea value={joinNote} onChange={(e) => setJoinNote(e.target.value)} placeholder="Kendinden kısaca bahset..." rows={3} />
                    </div>
                    <Button onClick={handleJoinRequest} disabled={joinSubmitting} className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white">
                      {joinSubmitting ? "Gönderiliyor..." : "Talebi Gönder"}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Yöneticiler bilgilendirilecek; onay sonrası WhatsApp grup linki sana iletilecek.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
              <Button size="lg" variant="outline" className="gap-2" onClick={handleShare}>
                {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                {copied ? "Kopyalandı" : "Sayfayı Paylaş"}
              </Button>
            </div>
          </section>

          {/* Conditions */}
          {conditions.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-5 w-5 text-turquoise" />
                <h2 className="text-xl font-bold">Grup Koşulları</h2>
              </div>
              <ul className="space-y-2">
                {conditions.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                    <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Bottom CTA */}
          <div className="text-center text-xs text-muted-foreground">
            Bu sayfa CorteQS WhatsApp Grupları landing sistemi ile oluşturulmuştur.{" "}
            <Link to="/whatsapp-groups" className="underline">Sen de grubunu listele</Link>
          </div>

          {landing.adminContact && (
            <div className="text-center text-xs text-muted-foreground mt-2">
              İletişim: {landing.adminContact}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WhatsAppGroupLanding;
