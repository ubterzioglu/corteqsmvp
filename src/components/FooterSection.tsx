import { useEffect, useState } from "react";
import { Mail, Copy, Check, MessageCircle, Linkedin, Instagram, Facebook, Send, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import RegisterInterestForm from "./RegisterInterestForm";

const XLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={className}
    fill="currentColor"
  >
    <path d="M18.244 2H21.5l-7.11 8.127L22.75 22h-6.548l-5.13-6.703L5.21 22H1.95l7.604-8.69L1.5 2H8.21l4.636 6.116L18.244 2Zm-1.14 18.05h1.804L7.23 3.845H5.294L17.104 20.05Z" />
  </svg>
);

const RedditLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={className}
    fill="currentColor"
  >
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
  </svg>
);

type SocialPlatform = Database["public"]["Tables"]["social_media_links"]["Row"]["platform"];

type SocialCircleItem = {
  key: string;
  label: string;
  href: string | null;
  accentClassName: string;
  icon: (className: string) => JSX.Element;
  onClick?: () => void;
};

const SOCIAL_FALLBACKS: Partial<Record<SocialPlatform, string>> = {
  LinkedIn: "https://www.linkedin.com/company/corteqs-global/",
  Facebook: "https://www.facebook.com/corteqs",
  Instagram: "https://www.instagram.com/corteqssocial/",
  "Twitter (X)": "https://x.com/corteqsx",
  YouTube: "https://www.youtube.com/@corteqsyoutube",
  Reddit: "https://www.reddit.com/r/corteqs/",
};

const socialCircleBaseClass =
  "group relative flex h-[3.85rem] min-w-[3.85rem] items-center justify-center rounded-[1.15rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)] text-white/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_24px_rgba(0,0,0,0.22)] backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.05)_100%)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/18 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a241d]";

const FooterSection = () => {
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [supportFormOpen, setSupportFormOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [socialLinks, setSocialLinks] = useState<Partial<Record<SocialPlatform, string>>>({});

  useEffect(() => {
    let isMounted = true;

    const loadSocialLinks = async () => {
      const { data, error } = await supabase
        .from("social_media_links")
        .select("platform, link")
        .order("created_at", { ascending: false });

      if (error || !isMounted || !data) return;

      const nextLinks: Partial<Record<SocialPlatform, string>> = {};
      for (const row of data) {
        if (!row.link || nextLinks[row.platform]) continue;
        nextLinks[row.platform] = row.link;
      }

      setSocialLinks(nextLinks);
    };

    void loadSocialLinks();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText("info@corteqs.net");
    setCopied(true);
    toast({ title: "Kopyalandı!", description: "E-posta adresi panoya kopyalandı." });
    setTimeout(() => setCopied(false), 2000);
  };

  const socialCircleItems: SocialCircleItem[] = [
    {
      key: "linkedin",
      label: "CorteQS LinkedIn",
      href: socialLinks.LinkedIn || SOCIAL_FALLBACKS.LinkedIn || null,
      accentClassName: "text-[#58adff] group-hover:text-[#7bc0ff] group-hover:shadow-[0_0_22px_rgba(88,173,255,0.35)]",
      icon: (className) => <Linkedin className={className} />,
    },
    {
      key: "facebook",
      label: "CorteQS Facebook",
      href: socialLinks.Facebook || SOCIAL_FALLBACKS.Facebook || null,
      accentClassName: "text-[#5b8dff] group-hover:text-[#78a3ff] group-hover:shadow-[0_0_22px_rgba(91,141,255,0.35)]",
      icon: (className) => <Facebook className={className} />,
    },
    {
      key: "instagram",
      label: "CorteQS Instagram",
      href: socialLinks.Instagram || SOCIAL_FALLBACKS.Instagram || null,
      accentClassName: "text-[#ff69bd] group-hover:text-[#ff8fd0] group-hover:shadow-[0_0_22px_rgba(255,105,189,0.35)]",
      icon: (className) => <Instagram className={className} />,
    },
    {
      key: "x",
      label: "CorteQS X",
      href: socialLinks["Twitter (X)"] || SOCIAL_FALLBACKS["Twitter (X)"] || null,
      accentClassName: "text-white/80 group-hover:text-white group-hover:shadow-[0_0_22px_rgba(255,255,255,0.18)]",
      icon: (className) => <XLogo className={className} />,
    },
    {
      key: "youtube",
      label: "CorteQS YouTube",
      href: socialLinks.YouTube || SOCIAL_FALLBACKS.YouTube || null,
      accentClassName: "text-[#ff6a68] group-hover:text-[#ff8f8d] group-hover:shadow-[0_0_22px_rgba(255,106,104,0.35)]",
      icon: (className) => <Youtube className={className} />,
    },
    {
      key: "reddit",
      label: "CorteQS Reddit",
      href: socialLinks.Reddit || SOCIAL_FALLBACKS.Reddit || null,
      accentClassName: "text-[#ff4500] group-hover:text-[#ff6a33] group-hover:shadow-[0_0_22px_rgba(255,69,0,0.35)]",
      icon: (className) => <RedditLogo className={className} />,
    },
    {
      key: "telegram",
      label: "CorteQS Telegram",
      href: "https://t.me/corteqs",
      accentClassName: "text-[#30b9ff] group-hover:text-[#67cdff] group-hover:shadow-[0_0_22px_rgba(48,185,255,0.35)]",
      icon: (className) => <Send className={className} />,
    },
    {
      key: "whatsapp",
      label: "CorteQS WhatsApp",
      href: "https://wa.me/905302404995",
      accentClassName: "text-[#4df28f] group-hover:text-[#79f5a8] group-hover:shadow-[0_0_22px_rgba(77,242,143,0.35)]",
      icon: (className) => <MessageCircle className={className} />,
    },
  ];

  return (
    <footer className="relative overflow-hidden py-16 lg:py-20">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/videos/footer-community.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(14,46,50,0.68),rgba(17,34,44,0.54),rgba(8,12,18,0.62))]" aria-hidden />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.06)_45%,rgba(255,255,255,0.02)_100%)]"
        aria-hidden
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,hsl(var(--primary)/0.34),transparent_32%),radial-gradient(circle_at_82%_70%,hsl(var(--accent)/0.28),transparent_34%)]" aria-hidden />

      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-5xl rounded-3xl border border-white/20 bg-white/10 px-5 py-8 text-center shadow-2xl shadow-black/30 backdrop-blur-xl sm:px-8 lg:px-12">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-white md:text-4xl">
              Yakında Açılıyoruz!
            </h2>
            <p className="mx-auto mt-4 mb-6 max-w-4xl text-base leading-relaxed text-white/75 md:text-lg">
              Dünyanın neresinde olursanız olun, Corteqs Diaspora Connect sizi güçlü bir toplulukla buluşturacak.
            </p>

            <a
              href="mailto:info@corteqs.net"
              className="mb-8 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 transition-colors hover:bg-white/15"
            >
              <Mail className="w-5 h-5 text-primary" />
              <span className="text-lg font-bold text-primary">info@corteqs.net</span>
            </a>

            <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
              <button
                onClick={() => setFormOpen(true)}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 transition-all hover:bg-accent/90"
              >
                Kategorine Kayıt ve Takip İçin
              </button>
              <button
                onClick={() => setSupportFormOpen(true)}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-cyan-400 hover:to-blue-500"
              >
                Teknik, Org, Yatırım Görüşmeleri için
              </button>
              <a
                href="https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#1ebe5d]"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp Grubuna Katıl
              </a>
            </div>

            <div className="mt-8">
              <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.24em] text-white/55">
                Bizi Sosyal Medyada Takip Edin
              </p>
              <div className="mx-auto flex w-full max-w-[37rem] flex-wrap items-center justify-between gap-3 sm:gap-3.5">
                {socialCircleItems.map((item) => {
                  const icon = item.icon(`h-[1.55rem] w-[1.55rem] transition duration-300 ${item.accentClassName}`);

                  if (!item.href) {
                    return (
                      <button
                        key={item.key}
                        type="button"
                        aria-label={item.label}
                        aria-disabled={!item.onClick}
                        onClick={item.onClick}
                        className={`${socialCircleBaseClass} ${!item.onClick ? "cursor-default opacity-50 hover:translate-y-0 hover:text-white/78" : ""}`}
                      >
                        <span className="relative z-10">{icon}</span>
                      </button>
                    );
                  }

                  return (
                    <a
                      key={item.key}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.label}
                      className={socialCircleBaseClass}
                    >
                      <span className="relative z-10">{icon}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/15 pt-6 md:flex-row">
            <div className="flex flex-col items-center gap-3 md:flex-row md:gap-4">
              <div className="text-sm text-white/55">
                © {new Date().getFullYear()} CorteQS bir Qualtron Sinclair ve Akçakanat-Terzioğlu Girişimidir. Tüm hakları saklıdır.
              </div>
              <Link
                to="/founders"
                onClick={() => window.scrollTo({ top: 0, behavior: "auto" })}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Hakkımızda
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <a href="mailto:info@corteqs.net" className="text-sm font-semibold text-primary hover:underline">
                info@corteqs.net
              </a>
              <button
                onClick={handleCopy}
                className="rounded p-1 transition-colors hover:bg-white/10"
                title="Kopyala"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/55 hover:text-primary" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <RegisterInterestForm open={formOpen} onOpenChange={setFormOpen} />
      <RegisterInterestForm open={supportFormOpen} onOpenChange={setSupportFormOpen} mode="support" />
    </footer>
  );
};

export default FooterSection;
