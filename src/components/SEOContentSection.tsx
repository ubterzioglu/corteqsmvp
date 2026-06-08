import { Clapperboard, Globe, PenTool } from "lucide-react";
import { Link } from "react-router-dom";
import CorteqsWhatIsAccordion from "@/components/CorteqsWhatIsAccordion";

const featuredLinks = [
  {
    to: "/founding-1000",
    icon: Globe,
    className:
      "border-[#f0b73b]/35 bg-[linear-gradient(135deg,#fff3cf_0%,#ffe79e_52%,#ffd768_100%)] text-[#8f5b00] shadow-[0_14px_30px_rgba(240,183,59,0.18)]",
    label: "Founding 1000'e Katıl",
  },
  {
    to: "/blogger-yarismasi",
    icon: PenTool,
    className:
      "border-[#ef8c3f]/35 bg-[linear-gradient(135deg,#fff0de_0%,#ffd6af_52%,#ffbc7b_100%)] text-[#c96a1a] shadow-[0_14px_30px_rgba(239,140,63,0.18)]",
    label: "Blogger Yarışması",
  },
  {
    to: "/vlogger-yarismasi",
    icon: Clapperboard,
    className:
      "border-[#2f8fb4]/35 bg-[linear-gradient(135deg,#eef9fc_0%,#cfeefa_52%,#a9dff2_100%)] text-[#1f7595] shadow-[0_14px_30px_rgba(47,143,180,0.18)]",
    label: "Vlogger Yarışması",
  },
] as const;

const SEOContentSection = () => {
  return (
    <section className="relative mt-12 overflow-hidden py-4 lg:mt-16 lg:py-5">
      <article className="container relative z-10 mx-auto flex max-w-6xl flex-col gap-4 px-4" aria-labelledby="geo-content-title">
        <div className="flex flex-col gap-4">
          {featuredLinks.map((link, index) => {
            const Icon = link.icon;

            return (
              <div key={link.to} className="flex flex-col gap-4">
                <Link
                  to={link.to}
                  className={`group flex min-h-[72px] items-center gap-3 rounded-[1.25rem] border px-4 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(15,23,42,0.10)] sm:min-h-[76px] sm:px-5 ${link.className}`}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/70 shadow-[0_10px_24px_rgba(255,255,255,0.22)] backdrop-blur-md">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-base font-semibold leading-tight sm:text-[1.08rem]">{link.label}</span>
                </Link>

                {index === 0 ? (
                  <CorteqsWhatIsAccordion />
                ) : null}
              </div>
            );
          })}
        </div>
      </article>
    </section>
  );
};

export default SEOContentSection;
