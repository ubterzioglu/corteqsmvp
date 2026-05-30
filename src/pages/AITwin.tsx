import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bot, Mic, Video, FileText, Sparkles, Crown, Lock, ShieldCheck,
  BookOpen, Wand2, Database, Headphones, Image as ImageIcon, Upload,
  ArrowRight, CheckCircle2, AlertCircle, Percent
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const steps = [
  {
    icon: BookOpen,
    title: "Özgün İçerik Toplama",
    desc: "Makale, sunum, e-kitap, video transkriptleri, podcast — uzmanlık alanına dair tüm yazılı/sözlü içerik.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Database,
    title: "RAG Bilgi Tabanı",
    desc: "Yüklenen dökümanlar embedding'lere dönüştürülür, retrieval-augmented generation ile yanıt verir.",
    color: "text-turquoise",
    bg: "bg-turquoise/10",
  },
  {
    icon: Mic,
    title: "Ses Klonlama",
    desc: "3-10 dakikalık temiz ses örneği. Konuşma tonun, ritmin ve aksanın korunarak modellenir.",
    color: "text-gold",
    bg: "bg-gold/10",
  },
  {
    icon: Video,
    title: "Görsel Avatar",
    desc: "Yüksek çözünürlüklü 1-2 dakikalık video örneği ile mimik ve jestler eşleştirilir.",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    icon: Wand2,
    title: "Twin Eğitimi",
    desc: "Ekibimiz veri yeterliliğini doğrular, modeli eğitir ve canlıya almadan önce kalite testleri yapar.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: ShieldCheck,
    title: "Yayın & Moderasyon",
    desc: "Profilinde 'AI Twin Aktif' rozeti çıkar. Tüm görüşmeler kayıt altına alınır, etik kurallar uygulanır.",
    color: "text-turquoise",
    bg: "bg-turquoise/10",
  },
];

const requirements = [
  { icon: FileText, text: "En az 50 sayfa özgün yazılı içerik (makale, e-kitap, blog)" },
  { icon: Headphones, text: "Min. 10 dakika temiz ses kaydı (tek kişi, gürültüsüz ortam)" },
  { icon: ImageIcon, text: "1-2 dk yüksek çözünürlüklü video (sabit kamera, yüze ışık)" },
  { icon: BookOpen, text: "Sıkça sorulan sorular ve örnek cevaplar listesi" },
];

const AITwin = () => {
  const { toast } = useToast();
  const [showPaywall, setShowPaywall] = useState(false);
  const isPremium = false; // mock — will read from user subscription later

  const handleSubmitClick = () => {
    if (!isPremium) {
      setShowPaywall(true);
      return;
    }
    toast({
      title: "Başvurun alındı 🎉",
      description: "Ekibimiz dökümanlarını 48 saat içinde inceleyip seninle iletişime geçecek.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Hero */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-primary border-primary/30 gap-1">
              <Sparkles className="h-3 w-3" /> AI Twin Aktivasyonu
            </Badge>
            <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
              Kendi <span className="text-primary">Dijital İkizini</span> kur
            </h1>
            <p className="text-muted-foreground font-body text-lg max-w-2xl mx-auto">
              Uzmanlığını 7/24 erişilebilir kıl. AI Twin, gerçek bilgine dayalı RAG modeliyle
              danışanlarına sen uyurken bile cevap verir.
            </p>
          </div>

          {/* Commission banner */}
          <div className="max-w-3xl mx-auto mb-10">
            <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-turquoise/10 to-primary/10 border border-primary/20 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Percent className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">AI Twin kullanımı %10 kesintiyle karşılanır</h3>
                <p className="text-sm text-muted-foreground font-body">
                  AI Twin seanslarından elde ettiğin gelirin %10'u altyapı (model, ses/görüntü işleme,
                  RAG veritabanı) için kesilir. Ek lisans veya kurulum ücreti yoktur.
                </p>
              </div>
            </div>
          </div>

          {/* How it works — small visual cards */}
          <h2 className="text-2xl font-bold text-foreground text-center mb-2">Nasıl hazırlanır?</h2>
          <p className="text-sm text-muted-foreground text-center mb-8 font-body">
            6 adımda dijital ikizini canlıya al
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
            {steps.map((s, i) => (
              <div
                key={i}
                className="bg-card rounded-xl border border-border p-5 shadow-card hover:shadow-elevated transition-shadow"
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground">ADIM {i + 1}</span>
                    <h3 className="font-bold text-foreground text-sm leading-tight">{s.title}</h3>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-body leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Requirements */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="bg-muted/40 rounded-2xl border border-border p-6">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Yeterli özgün veri için minimum gereksinimler
              </h3>
              <ul className="space-y-2.5">
                {requirements.map((r, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-foreground font-body">
                    <r.icon className="h-4 w-4 text-primary shrink-0" />
                    {r.text}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-4 flex items-start gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
                Veri yetersizse ekibimiz "Twin Boost" oturumlarıyla ek içerik kaydı planlar.
              </p>
            </div>
          </div>

          {/* Submission form / Paywall */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-card rounded-2xl border-2 border-primary/30 p-6 md:p-8 shadow-elevated">
              <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                <Upload className="h-6 w-6 text-primary" /> Başvuru ve Döküman Yükleme
              </h2>
              <p className="text-sm text-muted-foreground mb-6 font-body">
                Dökümanlarını yükle, ekibimiz inceleyip 48 saat içinde dönüş yapsın.
              </p>

              <div className="space-y-3 mb-6">
                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">Yazılı içerik (PDF, DOCX, TXT)</span>
                  <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center bg-muted/30">
                    <FileText className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Birden fazla dosya seçebilirsin</p>
                  </div>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">Ses örneği (MP3, WAV)</span>
                  <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center bg-muted/30">
                    <Mic className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">10 dk+ tek kişi kaydı</p>
                  </div>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">Video örneği (MP4, MOV)</span>
                  <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center bg-muted/30">
                    <Video className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">1-2 dk yüksek çözünürlük</p>
                  </div>
                </label>
              </div>

              <Button
                variant="hero"
                size="lg"
                className="w-full gap-2"
                onClick={handleSubmitClick}
              >
                {isPremium ? (
                  <>
                    <Upload className="h-4 w-4" /> Başvuruyu Gönder
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" /> Devam etmek için Premium Pro gerekli
                  </>
                )}
              </Button>

              {showPaywall && !isPremium && (
                <div className="mt-5 rounded-xl border-2 border-primary bg-gradient-to-br from-primary/10 to-turquoise/10 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-foreground">Premium Pro paketine yükselt</h3>
                  </div>
                  <p className="text-sm text-muted-foreground font-body mb-4">
                    AI Twin aktivasyonu yalnızca <span className="font-semibold text-foreground">Premium Pro</span>{" "}
                    danışmanlara açıktır. Yükseltme sonrası başvurun otomatik olarak admin onayına düşer.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link to="/pricing" className="flex-1">
                      <Button variant="hero" className="w-full gap-1.5">
                        <Crown className="h-4 w-4" /> Premium Pro'ya Geç <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowPaywall(false)}
                    >
                      Daha sonra
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground text-center mt-4 font-body">
                Yüklediğin tüm içerikler şifrelenir, yalnızca senin AI Twin'inin eğitiminde kullanılır.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AITwin;
