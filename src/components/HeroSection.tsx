import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import CorteqsWhatIsAccordion from "./CorteqsWhatIsAccordion";
import CorteqsAnimatedBackground from "./landing/CorteqsAnimatedBackground";
import MouseSpotlight from "./landing/MouseSpotlight";
import HeroNetworkStats from "./landing/HeroNetworkStats";
import { PUBLIC_WHATSAPP_COMMUNITY } from "@/lib/contact-links";
const heroLogo = "/newlogo.png";

// İkincil CTA, sayfadaki "Diasporada Ara" bölümüne yumuşak kaydırır.
const scrollToSearch = () => {
  const el = document.getElementById("diaspora-ara");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const HeroSection = () => {
  const heroCtaClass =
    "relative inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 text-center text-[13px] font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:saturate-110 md:text-sm";
  const heroCardStyles = {
    register: {
      background: "linear-gradient(135deg, #4285F4 0%, #3B78E7 100%)",
      borderColor: "#2f6fda",
      color: "#FFFFFF",
      boxShadow: "0 16px 34px rgba(66, 133, 244, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.18)",
    },
    search: {
      background: "linear-gradient(135deg, #00ACC1 0%, #0097A7 100%)",
      borderColor: "#00838f",
      color: "#FFFFFF",
      boxShadow: "0 16px 34px rgba(0, 172, 193, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.18)",
    },
  } as const;

  return (
    <section className="relative flex items-start overflow-hidden bg-gradient-to-br from-background via-card to-secondary/30 pt-3 lg:min-h-[680px] lg:items-center lg:pt-4 2xl:min-h-[720px]">
      {/* tech katmanları: aurora + ince grid mesh (kenarlara solar) + marka blur orb'ları */}
      <div className="tech-aurora pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="tech-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      {/* canlı diaspora ağı (akan veri parçacıkları) + imleç parlaması — hepsi dekoratif, z-0 */}
      <CorteqsAnimatedBackground variant="hero" />
      <MouseSpotlight />
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-[-10%] top-[8%] h-56 w-56 rounded-full bg-primary/10 blur-3xl lg:h-80 lg:w-80" />
        <div className="absolute bottom-[6%] right-[-8%] h-64 w-64 rounded-full bg-accent/12 blur-3xl lg:h-96 lg:w-96" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1780px] px-4 py-5 md:px-6 md:py-6 2xl:px-10">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,36rem)_minmax(0,1fr)] lg:gap-7 xl:grid-cols-[minmax(0,38rem)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,42rem)_minmax(0,1fr)] 2xl:gap-10">
          <div
            className="min-w-0 max-w-[760px] lg:-translate-y-4 xl:-translate-y-6 2xl:-translate-y-8"
            style={{
              animation: "heroSlideInLeft 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
            }}
          >
            <div className="glass-tech flex max-w-[36rem] flex-col justify-center rounded-[2rem] p-4 sm:p-5 lg:max-w-[34rem] lg:px-6 2xl:max-w-[38rem]">
              <div className="mb-3 flex flex-col items-center gap-3 text-center md:flex-row md:items-center md:text-left">
                <img src={heroLogo} alt="CorteQS Logo" className="mx-auto w-full max-w-[152px] shrink-0 md:mx-0 md:max-w-[176px]" />
                <h1 className="font-display text-2xl font-bold leading-[0.95] tracking-[-0.02em] text-foreground md:text-4xl 2xl:text-[2.75rem]">
                  Dünyadaki Türkleri Bir Araya Getiren{" "}
                  <span className="text-gradient-tech">Platform</span>
                </h1>
              </div>
              <p className="hero-description mb-5 max-w-lg text-center text-[12px] leading-relaxed text-muted-foreground md:text-left md:text-[13px] 2xl:max-w-xl 2xl:text-[14px]">
                Dünyanın farklı yerlerinde yaşayan Türkleri ekonomik ve sosyal fırsatlarla birbirine bağlıyoruz.
                <br />
                <strong>Ücretsiz kayıt ol! Ağını genişlet! Bağlan, keşfet, birlikte büyü!</strong>
              </p>
              <HeroNetworkStats className="mt-1 justify-center md:justify-start" />
            </div>

            <div className="mt-3 max-w-[760px] space-y-4 pb-2 lg:max-w-[540px] xl:max-w-[590px] 2xl:max-w-[640px]">
              <div className="w-full max-w-lg 2xl:max-w-[38rem]">
                <CorteqsWhatIsAccordion />
              </div>

              {/* Birincil + ikincil CTA — net hiyerarşi */}
              <div className="grid w-full max-w-lg gap-3 sm:grid-cols-2 2xl:max-w-[38rem]">
                <Link
                  to="/login?mode=signup"
                  className={`${heroCtaClass} whitespace-nowrap hover:shadow-glow-teal`}
                  style={heroCardStyles.register}
                >
                  <span
                    className="pointer-events-none absolute inset-0 opacity-100"
                    aria-hidden
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 42%, rgba(255,255,255,0) 100%)",
                    }}
                  />
                  <span
                    className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/25"
                    aria-hidden
                  />
                  <span className="relative z-10">Ücretsiz Kayıt Ol</span>
                </Link>
                <button
                  type="button"
                  onClick={scrollToSearch}
                  className={`${heroCtaClass} hover:shadow-glow-teal`}
                  style={heroCardStyles.search}
                >
                  <span
                    className="pointer-events-none absolute inset-0 opacity-100"
                    aria-hidden
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 42%, rgba(255,255,255,0) 100%)",
                    }}
                  />
                  <span
                    className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/25"
                    aria-hidden
                  />
                  <Search className="relative z-10 h-4 w-4" aria-hidden="true" />
                  <span className="relative z-10">Diasporada Ara</span>
                </button>
              </div>

              {/* Üçüncül aksiyonlar — görsel ağırlığı düşük metin link grubu (ortalı) */}
              <div className="flex max-w-lg flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[12px] font-semibold text-slate-600 md:text-[13px] 2xl:max-w-[38rem]">
                <Link
                  to="/founders"
                  onClick={() => window.scrollTo({ top: 0, behavior: "auto" })}
                  className="underline-offset-2 transition-colors hover:text-slate-900 hover:underline"
                >
                  Biz Kimiz
                </Link>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <a
                  href={PUBLIC_WHATSAPP_COMMUNITY}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-2 transition-colors hover:text-[#2F9B4D] hover:underline"
                >
                  WhatsApp Grubu
                </a>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <Link
                  to="/addcom"
                  className="underline-offset-2 transition-colors hover:text-[#9334E6] hover:underline"
                >
                  Topluluğunu Ekle
                </Link>
              </div>
            </div>
          </div>

          <div
            className="relative hidden lg:flex lg:justify-end"
            style={{
              animation: "heroSlideInRight 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both",
            }}
          >
            <div className="relative w-full max-w-[1180px] xl:max-w-[1320px] 2xl:max-w-[1460px]">
              <div className="glow-border relative overflow-hidden rounded-3xl">
                <video
                  src="/herovideo.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-hidden="true"
                  className="h-auto w-full object-cover"
                />
                {/* köşe gölgelendirme */}
                <div className="pointer-events-none absolute inset-0 rounded-3xl shadow-[inset_0_0_60px_30px_rgba(0,0,0,0.35)]" />
                {/* sol kenar smooth geçiş */}
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 w-32 rounded-l-3xl"
                  style={{
                    background: "linear-gradient(to right, hsl(var(--background)) 0%, transparent 100%)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
