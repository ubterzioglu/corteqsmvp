import {
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
  Send,
  Twitter,
  Youtube,
} from "lucide-react";
import { Link } from "react-router-dom";
import { footerFlatLinks } from "@/components/footerLinks";
import DiasporaNetworkLayer from "@/components/landing/DiasporaNetworkLayer";
import { PUBLIC_WHATSAPP_COMMUNITY } from "@/lib/contact-links";

const socialLinks = [
  {
    href: "https://www.linkedin.com/company/corteqs-global",
    label: "LinkedIn",
    icon: Linkedin,
    className: "text-[#0a66c2]",
  },
  {
    href: "https://www.facebook.com/corteqs",
    label: "Facebook",
    icon: Facebook,
    className: "text-[#1877f2]",
  },
  {
    href: "https://www.instagram.com/corteqsturk",
    label: "Instagram",
    icon: Instagram,
    className: "text-[#d6249f]",
  },
  {
    href: "https://x.com/turksdiaspora",
    label: "X",
    icon: Twitter,
    className: "text-foreground",
  },
  {
    href: "https://www.reddit.com/r/diasporaturks/",
    label: "Reddit",
    icon: MessageCircle,
    className: "text-[#ff4500]",
  },
  {
    href: "https://www.youtube.com/@corteqsyoutube",
    label: "YouTube",
    icon: Youtube,
    className: "text-[#ff0000]",
  },
  {
    href: "https://t.me/turksdiaspora",
    label: "Telegram",
    icon: Send,
    className: "text-[#229ed9]",
  },
  {
    href: PUBLIC_WHATSAPP_COMMUNITY,
    label: "WhatsApp",
    icon: MessageCircle,
    className: "text-[#25d366]",
  },
];

const Footer = () => {
  return (
    <footer className="relative isolate overflow-hidden bg-gradient-to-b from-background via-secondary/25 to-background px-4 py-8 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
      {/* tech katmanları: aurora + ince grid mesh + canlı diaspora ağı — anasayfayla
          aynı tasarım dili. Hepsi dekoratif: pointer-events yok, aria-hidden, z-0. */}
      <div className="tech-aurora pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="tech-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <DiasporaNetworkLayer />
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-[-12%] top-12 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-8 right-[-4%] h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto max-w-6xl">
        <div className="glass-tech mx-auto max-w-5xl rounded-[2rem] px-5 py-8 text-center sm:px-8 lg:px-12 lg:py-10">
          <div className="mx-auto mb-6 max-w-4xl py-1 sm:mb-10 sm:py-2">
            <p className="mb-3 text-sm font-medium tracking-[0.08em] text-foreground sm:mb-5">İletişim Kanallarımız</p>
            <div className="px-1 py-2 sm:py-3">
              <div className="mx-auto grid w-max grid-cols-4 gap-2 px-1 py-1 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-center sm:gap-4">
                {socialLinks.map(({ href, label, icon: Icon, className }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`CorteQS ${label}`}
                    title={label}
                    className={`group relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-white/70 shadow-[0_18px_40px_-26px_hsl(var(--glow-teal)/0.5)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-white hover:shadow-[0_22px_48px_-22px_hsl(var(--glow-teal)/0.7)] sm:h-20 sm:w-20 ${className}`}
                  >
                    <span className="absolute inset-1 rounded-full border border-white/40 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.6),transparent_60%)]" />
                    <Icon className="relative z-10 h-5 w-5 transition-transform duration-300 group-hover:scale-110 sm:h-8 sm:w-8" />
                    <span className="sr-only">{label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-border/60 pt-3.5">
            <div className="pb-1">
              <div className="flex flex-wrap items-center justify-center gap-y-1.5 whitespace-nowrap px-0.5 text-[0.76rem] text-foreground sm:text-[0.8rem]">
                {footerFlatLinks.map((link, index) => (
                  <div
                    key={link.label}
                    className={index > 0 ? "ml-2 border-l border-border/60 pl-2" : ""}
                  >
                    {link.to ? (
                      <Link
                        to={link.to}
                        onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
                        className="text-muted-foreground transition-colors hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-muted-foreground transition-colors hover:text-primary"
                      >
                        {link.label}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3.5 border-t border-border/60 pt-3.5">
            <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-0.5 text-center text-[0.62rem] leading-relaxed text-muted-foreground sm:text-[0.68rem]">
              <span>© 2026 CorteQS bir Qualtron Sinclair ve Akçakanat-Terzioğlu Girişimidir. Tüm hakları saklıdır.</span>
              <span aria-hidden="true" className="text-muted-foreground/40">|</span>
              <a
                href="https://chatio.com.tr/"
                target="_blank"
                rel="dofollow noopener noreferrer"
                className="transition-colors hover:text-primary"
              >
                Canlı Destek Yazılımı
              </a>
              <span aria-hidden="true" className="text-muted-foreground/40">|</span>
              <a
                href="https://www.spindorai.com/seo/izmir-seo"
                target="_blank"
                rel="dofollow noopener noreferrer"
                className="transition-colors hover:text-primary"
              >
                İzmir Seo Ajansı
              </a>
              <span aria-hidden="true" className="text-muted-foreground/40">|</span>
              <span>Spindora Tarafından Seosu Yapılmıştır.</span>
              <span aria-hidden="true" className="text-muted-foreground/40">|</span>
              <a
                href="https://tekhurdametal.com/istanbul-hurdaci/"
                target="_blank"
                rel="dofollow noopener noreferrer"
                aria-label="İstanbul Hurdacı - Tek Hurda Metal A.Ş"
                title="Tek Hurda Metal A.Ş"
                className="transition-colors hover:text-primary"
              >
                İstanbul Hurdacı
              </a>
              <span aria-hidden="true" className="text-muted-foreground/40">|</span>
              <a
                href="https://ufuksoynakliyat.com.tr"
                target="_blank"
                rel="dofollow noopener noreferrer"
                className="transition-colors hover:text-primary"
              >
                Evden Eve Nakliyat
              </a>
              <span aria-hidden="true" className="text-muted-foreground/40">|</span>
              <span>Son güncelleme: 24 Temmuz 2026</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
