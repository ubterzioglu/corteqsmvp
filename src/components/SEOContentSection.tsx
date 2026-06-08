import { Link } from "react-router-dom";
import CorteqsWhatIsAccordion from "@/components/CorteqsWhatIsAccordion";

const featuredLinks = [
  {
    to: "/founding-1000",
    className:
      "border-[#F9AB00] bg-[linear-gradient(135deg,#FBBC05_0%,#F9AB00_100%)] text-white shadow-[0_16px_34px_rgba(251,188,5,0.34),inset_0_1px_0_rgba(255,255,255,0.18)]",
    label: "Founding 1000'e Katıl",
  },
  {
    to: "/blogger-yarismasi",
    className:
      "border-[#c5221f] bg-[linear-gradient(135deg,#EA4335_0%,#D93025_100%)] text-white shadow-[0_16px_34px_rgba(234,67,53,0.34),inset_0_1px_0_rgba(255,255,255,0.18)]",
    label: "Blogger Yarışması",
  },
  {
    to: "/vlogger-yarismasi",
    className:
      "border-[#2f6fda] bg-[linear-gradient(135deg,#4285F4_0%,#3B78E7_100%)] text-white shadow-[0_16px_34px_rgba(66,133,244,0.34),inset_0_1px_0_rgba(255,255,255,0.18)]",
    label: "Vlogger Yarışması",
  },
] as const;

const linkClass =
  "group relative inline-flex min-h-[56px] w-full items-center justify-center rounded-[1.25rem] border px-5 py-4 text-center text-base font-normal transition-all duration-300 hover:-translate-y-0.5 hover:saturate-110 sm:text-[1.05rem]";

const SEOContentSection = () => {
  return (
    <section className="relative mt-12 overflow-hidden py-4 lg:mt-16 lg:py-5">
      <article className="container relative z-10 mx-auto flex max-w-6xl flex-col gap-4 px-4" aria-labelledby="geo-content-title">
        <div className="flex flex-col gap-4">
          <CorteqsWhatIsAccordion />
          {featuredLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`${linkClass} ${link.className}`}
            >
              <span
                className="pointer-events-none absolute inset-0 rounded-[1.25rem] opacity-100"
                aria-hidden
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 42%, rgba(255,255,255,0) 100%)",
                }}
              />
              <span className="relative z-10">{link.label}</span>
            </Link>
          ))}
        </div>
      </article>
    </section>
  );
};

export default SEOContentSection;
