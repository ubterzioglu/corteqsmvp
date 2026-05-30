import { useState } from "react";
import bloggerVlogger from "@/assets/blogger-vlogger.jpg";
import RegisterInterestForm from "./RegisterInterestForm";

const BloggerSection = () => {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <section className="py-14 lg:py-20 bg-section-warm">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">İçerik Üreticileri</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3 mb-6">
              Blogger & Vlogger Ağı
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Blog yazarları, YouTuber'lar, podcaster'lar ve sosyal medya influencer'ları — sesinizi Corteqs Diaspora Connect ile güçlendirin.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                { title: "İçerik Desteği", desc: "Profesyonel içerik üretim desteği" },
                { title: "Ağ Erişimi", desc: "Geniş diaspora ağına erişim" },
                { title: "Etkinlikler", desc: "Özel etkinlik ve buluşmalar" },
                { title: "İş Birlikleri", desc: "Marka ve proje iş birlikleri" },
              ].map((item) => (
                <div key={item.title} className="p-4 rounded-xl bg-card border border-border">
                  <h4 className="font-semibold text-primary mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 mb-6">
              <p className="text-foreground font-semibold">🏆 Ödüllü Blog Yazısı Yarışmamız Başlıyor!</p>
              <p className="text-sm text-muted-foreground">Kaydınızı yapın, yarışma detaylarını kaçırmayın.</p>
            </div>
            <button
              onClick={() => setFormOpen(true)}
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-accent text-accent-foreground font-semibold text-lg hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
            >
              Kayıt Bırak / Takip Et
            </button>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-xl">
            <img
              src={bloggerVlogger}
              alt="Blogger ve Vlogger"
              className="w-full object-cover [filter:brightness(0.95)_saturate(0.85)_contrast(0.95)]"
              loading="lazy"
              width={1200}
              height={800}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-card/40 via-card/10 to-primary/15 mix-blend-soft-light" aria-hidden />
            <div className="pointer-events-none absolute inset-0 bg-card/15" aria-hidden />
          </div>
        </div>
      </div>

      <RegisterInterestForm open={formOpen} onOpenChange={setFormOpen} defaultCategory="blogger-vlogger" />
    </section>
  );
};

export default BloggerSection;
