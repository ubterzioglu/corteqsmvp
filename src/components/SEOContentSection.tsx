import { Clapperboard, Globe, PenTool } from "lucide-react";
import { Link } from "react-router-dom";
import CorteqsWhatIsAccordion from "@/components/CorteqsWhatIsAccordion";

const featuredLinks = [
  {
    to: "/founding-1000",
    icon: Globe,
    className:
      "border-[#FBBC05]/40 bg-[linear-gradient(135deg,#fff8e1_0%,#fff0b3_52%,#ffe57a_100%)] text-[#7a5200] shadow-[0_14px_30px_rgba(251,188,5,0.22)]",
    label: "Founding 1000'e Katıl",
  },
  {
    to: "/blogger-yarismasi",
    icon: PenTool,
    className:
      "border-[#EA4335]/35 bg-[linear-gradient(135deg,#fff0ee_0%,#ffd5d1_52%,#ffb8b1_100%)] text-[#b71c1c] shadow-[0_14px_30px_rgba(234,67,53,0.18)]",
    label: "Blogger Yarışması",
  },
  {
    to: "/vlogger-yarismasi",
    icon: Clapperboard,
    className:
      "border-[#4285F4]/35 bg-[linear-gradient(135deg,#e8f0fe_0%,#c5d8fd_52%,#a1c0fb_100%)] text-[#1a3e8f] shadow-[0_14px_30px_rgba(66,133,244,0.18)]",
    label: "Vlogger Yarışması",
  },
] as const;

const linkClass =
  "group flex min-h-[72px] w-full items-center gap-3 rounded-[1.25rem] border px-4 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(15,23,42,0.10)] sm:min-h-[76px] sm:px-5";

const SEOContentSection = () => {
  return (
    <section className="relative mt-12 overflow-hidden py-4 lg:mt-16 lg:py-5">
      <article className="container relative z-10 mx-auto flex max-w-6xl flex-col gap-4 px-4" aria-labelledby="geo-content-title">
        <div className="flex flex-col gap-4">
          <CorteqsWhatIsAccordion />
          {featuredLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`${linkClass} ${link.className}`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/70 shadow-[0_10px_24px_rgba(255,255,255,0.22)] backdrop-blur-md">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-base font-semibold leading-tight sm:text-[1.08rem]">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </article>
    </section>
  );
};

export default SEOContentSection;
