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
    className: "text-black",
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

const seoLinkClass =
  "font-medium text-[hsl(170_65%_60%)] underline underline-offset-4 transition-colors hover:text-[hsl(170_65%_74%)]";

const Footer = () => {
  return (
    <footer className="select-none bg-[hsl(220_25%_10%)] text-white/80">
      {/* üst aksan çizgisi — sayfa ile footer bandı arasındaki tek ayraç */}
      <div
        className="h-[2px] w-full bg-gradient-to-r from-[hsl(var(--glow-teal))] via-[hsl(18_85%_55%)] to-[hsl(var(--glow-teal))]"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-6xl px-4 pt-4 text-center">
        <p className="mb-2.5 text-[11px] font-medium tracking-[0.08em] text-white/55">
          İletişim Kanallarımız
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {socialLinks.map(({ href, label, icon: Icon, className }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`CorteQS ${label}`}
              title={label}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white ${className}`}
            >
              <Icon className="h-4 w-4" />
              <span className="sr-only">{label}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-4 flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 text-[11px] font-medium tracking-wide text-white/65">
        {footerFlatLinks.map((link, index) => (
          <span key={link.label} className="flex items-center gap-x-3">
            {index > 0 && <span className="h-3 w-px bg-white/15" aria-hidden="true" />}
            {link.to ? (
              <Link
                to={link.to}
                onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
                className="underline underline-offset-4 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ) : (
              <a
                href={link.href}
                className="underline underline-offset-4 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            )}
          </span>
        ))}
      </div>

      <div className="mx-auto mt-3 max-w-6xl border-t border-white/15 px-4 py-2 text-center text-[8px] leading-[1.9] text-white/45">
        <span className="font-semibold text-white/85">CorteQS</span>
        {" · "}
        Türk Diasporası Topluluk ve Network Platformu
        {" · "}
        Faydalı bağlantılar:{" "}
        <a
          href="https://chatio.com.tr/"
          target="_blank"
          rel="dofollow noopener noreferrer"
          className={seoLinkClass}
        >
          Canlı Destek Yazılımı
        </a>
        {" · "}
        <span className="whitespace-nowrap">
          <a
            href="https://www.spindorai.com/seo/izmir-seo"
            target="_blank"
            rel="dofollow noopener noreferrer"
            className={seoLinkClass}
          >
            İzmir Seo Ajansı
          </a>{" "}
          Spindora Tarafından Seosu Yapılmıştır
        </span>
        {" · "}
        <span className="whitespace-nowrap">
          <a
            href="https://tekhurdametal.com/istanbul-hurdaci/"
            rel="dofollow"
            aria-label="İstanbul Hurdacı - Tek Hurda Metal A.Ş"
            title="Tek Hurda Metal A.Ş"
            className={seoLinkClass}
          >
            İstanbul Hurdacı
          </a>{" "}
          Firması Tek Hurda Metal A.Ş
        </span>
        {" · "}
        <span className="whitespace-nowrap">
          <a
            href="https://tekhurdametal.com/hurda-fiyatlari/"
            rel="dofollow"
            className={seoLinkClass}
          >
            Hurda Fiyatları
          </a>{" "}
          Tek Hurda Metal
        </span>
        {" · "}
        <span className="whitespace-nowrap">
          <a
            href="https://lionerotik.com/urunler/fetis-urunleri"
            rel="dofollow"
            className={seoLinkClass}
          >
            Antalya Erotik Shop
          </a>{" "}
          Lion Erotik
        </span>
        {" · "}
        <span className="whitespace-nowrap">
          <a
            href="https://ufuksoynakliyat.com.tr/esya-depolama"
            rel="dofollow"
            className={seoLinkClass}
          >
            Eşya Depolama
          </a>{" "}
          Firması Ufuksoy Nakliyat A.Ş
        </span>
        {" · "}
        <a
          href="https://ufuksoynakliyat.com.tr"
          target="_blank"
          rel="dofollow noopener noreferrer"
          className={seoLinkClass}
        >
          Evden Eve Nakliyat
        </a>
        {" · "}
        © 2026 CorteQS bir Qualtron Sinclair ve Akçakanat-Terzioğlu Girişimidir. Tüm hakları
        saklıdır.
        {" · "}
        Son güncelleme: 25 Temmuz 2026
      </div>
    </footer>
  );
};

export default Footer;
