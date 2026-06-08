import { Mail, Globe, MessageCircle, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";

const ContactPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">İletişim</h1>
          <p className="text-muted-foreground text-lg">
            Sorularınız, önerileriniz veya iş birliği talepleriniz için bize ulaşın.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <a
            href="mailto:info@corteqs.net"
            className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-card transition-all"
          >
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-foreground mb-1">E-posta</h2>
              <p className="text-sm text-muted-foreground">info@corteqs.net</p>
              <p className="text-xs text-muted-foreground mt-1">
                Genel sorular ve destek talepleriniz için
              </p>
            </div>
          </a>

          <a
            href="https://corteqs.net"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-card transition-all"
          >
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-foreground mb-1">Web</h2>
              <p className="text-sm text-muted-foreground">corteqs.net</p>
              <p className="text-xs text-muted-foreground mt-1">
                Platform ve hizmetlerimiz hakkında
              </p>
            </div>
          </a>

          <a
            href="https://wa.me/message/corteqs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-card transition-all"
          >
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <MessageCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-foreground mb-1">WhatsApp</h2>
              <p className="text-sm text-muted-foreground">WhatsApp ile yazın</p>
              <p className="text-xs text-muted-foreground mt-1">
                Hızlı destek ve topluluk kanalları için
              </p>
            </div>
          </a>

          <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-foreground mb-1">Konum</h2>
              <p className="text-sm text-muted-foreground">Global — Remote First</p>
              <p className="text-xs text-muted-foreground mt-1">
                Dünyanın dört bir yanından Türk diasporasına hizmet veriyoruz
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-card p-8 text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">İş Birliği & Ortaklık</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-lg mx-auto">
            Reklam, sponsorluk, kurumsal üyelik veya stratejik ortaklık teklifleri için
            doğrudan e-posta gönderin.
          </p>
          <a
            href="mailto:info@corteqs.net"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Mail className="h-4 w-4" />
            info@corteqs.net
          </a>
        </div>
      </div>
    </main>
  </div>
);

export default ContactPage;
