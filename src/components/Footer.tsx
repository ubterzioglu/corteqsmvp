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
import footerCommunityVideo from "../../footer-community.mp4";

const socialLinks = [
  {
    href: "https://www.linkedin.com/company/corteqs-global",
    label: "LinkedIn",
    icon: Linkedin,
    className: "text-[#7dd3fc] hover:shadow-[0_0_28px_rgba(125,211,252,0.2)]",
  },
  {
    href: "https://www.facebook.com/corteqs",
    label: "Facebook",
    icon: Facebook,
    className: "text-[#60a5fa] hover:shadow-[0_0_28px_rgba(96,165,250,0.22)]",
  },
  {
    href: "https://www.instagram.com/corteqsturk",
    label: "Instagram",
    icon: Instagram,
    className: "text-[#f472b6] hover:shadow-[0_0_28px_rgba(244,114,182,0.22)]",
  },
  {
    href: "https://x.com/turksdiaspora",
    label: "X",
    icon: Twitter,
    className: "text-[#d1d5db] hover:shadow-[0_0_28px_rgba(209,213,219,0.16)]",
  },
  {
    href: "https://www.reddit.com/r/corteqs/",
    label: "Reddit",
    icon: MessageCircle,
    className: "text-[#fb923c] hover:shadow-[0_0_28px_rgba(251,146,60,0.22)]",
  },
  {
    href: "https://www.youtube.com/@corteqsyoutube",
    label: "YouTube",
    icon: Youtube,
    className: "text-[#f87171] hover:shadow-[0_0_28px_rgba(248,113,113,0.22)]",
  },
  {
    href: "https://t.me/turksdiaspora",
    label: "Telegram",
    icon: Send,
    className: "text-[#38bdf8] hover:shadow-[0_0_28px_rgba(56,189,248,0.22)]",
  },
  {
    href: "https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD",
    label: "WhatsApp",
    icon: MessageCircle,
    className: "text-[#4ade80] hover:shadow-[0_0_28px_rgba(74,222,128,0.22)]",
  },
];

const Footer = () => {
  return (
    <footer className="relative isolate overflow-hidden px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      >
        <source src={footerCommunityVideo} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(8,36,44,0.88)_0%,rgba(16,37,47,0.76)_40%,rgba(23,29,35,0.72)_66%,rgba(51,35,28,0.84)_100%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="pointer-events-none absolute left-[-12%] top-16 h-44 w-44 rounded-full bg-turquoise/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-[-4%] h-56 w-56 rounded-full bg-primary/25 blur-3xl" />

      <div className="container relative z-10 mx-auto max-w-6xl">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/15 bg-black/25 px-5 py-8 text-center shadow-[0_36px_120px_-42px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:px-8 lg:px-12 lg:py-10">
          <div className="mx-auto mb-10 max-w-4xl py-2">
            <p className="mb-5 text-sm font-medium tracking-[0.08em] text-white">İletişim Kanallarımız</p>
            <div className="overflow-x-auto px-1 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="mx-auto flex min-w-max items-center justify-center gap-3 px-1 py-1 sm:gap-4">
                {socialLinks.map(({ href, label, icon: Icon, className }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`CorteQS ${label}`}
                    title={label}
                    className={`group relative inline-flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-white/8 text-[#29d3c3] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-white/12 sm:h-20 sm:w-20 ${className}`}
                  >
                    <span className="absolute inset-1 rounded-full border border-white/10 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.12),transparent_58%)]" />
                    <Icon className="relative z-10 h-7 w-7 transition-transform duration-300 group-hover:scale-110 sm:h-8 sm:w-8" />
                    <span className="sr-only">{label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-white/10 pt-3.5">
            <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="inline-flex min-w-max items-center whitespace-nowrap px-0.5 text-[0.76rem] text-white sm:text-[0.8rem]">
                {footerFlatLinks.map((link, index) => (
                  <div
                    key={link.label}
                    className={index > 0 ? "ml-2 border-l border-white/20 pl-2" : ""}
                  >
                    {link.to ? (
                      <Link
                        to={link.to}
                        className="text-white transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-white transition-colors hover:text-white"
                      >
                        {link.label}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3.5 border-t border-white/10 pt-3.5">
            <p className="overflow-x-auto whitespace-nowrap text-center text-[0.66rem] text-white sm:text-[0.72rem]">
              © 2026 CorteQS bir Qualtron Sinclair ve Akçakanat-Terzioğlu Girişimidir. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
