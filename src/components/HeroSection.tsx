import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Trophy } from "lucide-react";
import CorteqsWhatIsAccordion from "./CorteqsWhatIsAccordion";
const heroLogo = "/newlogo.png";
import RegisterInterestForm from "./RegisterInterestForm";

// Dünya Kupası kampanya banner'ı — küçük hero görseli butonun parçası.
const WORLD_CUP_BANNER_IMAGE = "/world-cup/hero-kampanya.webp";

const HeroSection = () => {
  const [formOpen, setFormOpen] = useState(false);
  const heroCtaClass =
    "relative inline-flex min-h-[52px] w-full items-center justify-center rounded-xl border px-4 py-2 text-center text-[12px] font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:saturate-110 md:text-[13px]";
  const heroCardStyles = {
    register: {
      background: "linear-gradient(135deg, #4285F4 0%, #3B78E7 100%)",
      borderColor: "#2f6fda",
      color: "#FFFFFF",
      boxShadow: "0 16px 34px rgba(66, 133, 244, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.18)",
    },
    whatsapp: {
      background: "linear-gradient(135deg, #34A853 0%, #2F9B4D 100%)",
      borderColor: "#278543",
      color: "#FFFFFF",
      boxShadow: "0 16px 34px rgba(52, 168, 83, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.18)",
    },
    addWhatsapp: {
      background: "linear-gradient(135deg, #A142F4 0%, #9334E6 100%)",
      borderColor: "#7e2fd0",
      color: "#FFFFFF",
      boxShadow: "0 16px 34px rgba(161, 66, 244, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.18)",
    },
    addContent: {
      background: "linear-gradient(135deg, #EA4335 0%, #D93025 100%)",
      borderColor: "#c5221f",
      color: "#FFFFFF",
      boxShadow: "0 16px 34px rgba(234, 67, 53, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.18)",
    },
    about: {
      background: "linear-gradient(135deg, #00ACC1 0%, #0097A7 100%)",
      borderColor: "#00838f",
      color: "#FFFFFF",
      boxShadow: "0 16px 34px rgba(0, 172, 193, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.18)",
    },
    founders: {
      background: "linear-gradient(135deg, #FBBC05 0%, #F9AB00 100%)",
      borderColor: "#dd9700",
      color: "#FFFFFF",
      boxShadow: "0 16px 34px rgba(251, 188, 5, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.18)",
    },
  } as const;

  return (
    <section className="relative flex min-h-[620px] items-center overflow-hidden bg-gradient-to-br from-background via-card to-secondary/30 pt-3 lg:min-h-[680px] lg:pt-4 2xl:min-h-[720px]">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-[-10%] top-[8%] h-56 w-56 rounded-full bg-primary/8 blur-3xl lg:h-80 lg:w-80" />
        <div className="absolute bottom-[6%] right-[-8%] h-64 w-64 rounded-full bg-accent/10 blur-3xl lg:h-96 lg:w-96" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1780px] px-4 py-5 md:px-6 md:py-6 2xl:px-10">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,36rem)_minmax(0,1fr)] lg:gap-7 xl:grid-cols-[minmax(0,38rem)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,42rem)_minmax(0,1fr)] 2xl:gap-10">
          <div
            className="max-w-[760px] lg:-translate-y-4 xl:-translate-y-6 2xl:-translate-y-8"
            style={{
              animation: "heroSlideInLeft 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
            }}
          >
            {/* ——— Dünya Kupası kampanya butonu (premium banner) ——— */}
            <Link
              to="/dunya-kupasi"
              className="group relative mb-3 flex w-full max-w-[36rem] items-center gap-3 overflow-hidden rounded-2xl border border-amber-300/70 bg-gradient-to-r from-[#E30A17] via-[#c00712] to-[#8f040c] p-2 pr-4 shadow-[0_18px_42px_-18px_rgba(227,10,23,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_52px_-16px_rgba(227,10,23,0.7)] sm:gap-4 sm:p-2.5 sm:pr-5 lg:max-w-[34rem] 2xl:max-w-[38rem]"
            >
              {/* küçük hero görseli — butonun parçası */}
              <img
                src={WORLD_CUP_BANNER_IMAGE}
                alt=""
                className="h-14 w-[5.5rem] shrink-0 rounded-xl object-cover ring-1 ring-white/40 transition-transform duration-300 group-hover:scale-105 sm:h-16 sm:w-24"
              />
              <span className="min-w-0 flex-1 text-white">
                <span className="flex items-center gap-1.5 text-[15px] font-extrabold leading-tight tracking-tight sm:text-lg">
                  <Trophy className="h-4 w-4 shrink-0 text-amber-300 drop-shadow-[0_0_8px_rgba(255,209,102,0.7)] sm:h-5 sm:w-5" />
                  Türkiye Dünya Kupası'nda! 🇹🇷
                </span>
                <span className="mt-0.5 block truncate text-[11px] font-medium text-red-50/90 sm:text-xs">
                  Gurbette maç yayınlayan mekânı bul, tezahürata katıl
                </span>
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/15 backdrop-blur transition-transform duration-300 group-hover:translate-x-0.5 sm:h-9 sm:w-9">
                <ChevronRight className="h-4 w-4 text-white sm:h-5 sm:w-5" />
              </span>
              {/* üst kenar parlaklığı + hover'da soldan sağa ışık süpürmesi */}
              <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/30" aria-hidden />
              <span
                className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
                aria-hidden
              />
            </Link>

            <div className="flex max-w-[36rem] flex-col justify-center rounded-[2rem] border border-white/80 bg-[linear-gradient(90deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.93)_38%,rgba(255,255,255,0.82)_62%,rgba(255,255,255,0.58)_82%,rgba(255,255,255,0.18)_100%)] p-4 shadow-[0_20px_55px_-36px_rgba(15,23,42,0.32)] backdrop-blur-xl sm:p-5 lg:max-w-[34rem] lg:px-6 2xl:max-w-[38rem]">
              <div className="mb-3 flex flex-col items-center gap-3 text-center md:flex-row md:items-center md:text-left">
                <img src={heroLogo} alt="CorteQS Logo" className="mx-auto w-full max-w-[152px] shrink-0 md:mx-0 md:max-w-[176px]" />
                <h1 className="text-2xl font-extrabold leading-[0.95] text-foreground md:text-4xl 2xl:text-[2.75rem]">
                  Dünyadaki Türkleri Bir Araya Getiren{" "}
                  <span className="text-accent">Platform</span>
                </h1>
              </div>
              <p className="hero-description mb-5 max-w-lg text-center text-[12px] leading-relaxed text-muted-foreground md:text-left md:text-[13px] 2xl:max-w-xl 2xl:text-[14px]">
                Dünyanın farklı yerlerinde yaşayan Türkleri sosyal ve ekonomik olarak birbirine bağlıyoruz.
                <br />
                <strong>Ücretsiz kayıt ol! Ağını genişlet! Bağlan, keşfet, birlikte büyü!</strong>
              </p>
            </div>

            <div className="mt-3 max-w-[760px] space-y-2.5 lg:max-w-[540px] xl:max-w-[590px] 2xl:max-w-[640px]">
              <div className="w-full max-w-lg 2xl:max-w-[38rem]">
                <CorteqsWhatIsAccordion />
              </div>
              <div className="grid w-full max-w-lg gap-2.5 sm:grid-cols-2 2xl:max-w-[38rem]">
                <Link
                  to="/login?mode=signup"
                  className={`${heroCtaClass} whitespace-nowrap`}
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
                <a
                  href="https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${heroCtaClass} whitespace-nowrap`}
                  style={heroCardStyles.whatsapp}
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
                  <span className="relative z-10">WhatsApp Grubuna Katıl</span>
                </a>
              </div>

              <div className="grid max-w-lg grid-cols-1 gap-2.5 sm:grid-cols-2 2xl:max-w-[38rem]">
                <Link
                  to="/founders"
                  onClick={() => window.scrollTo({ top: 0, behavior: "auto" })}
                  className={`${heroCtaClass} font-bold`}
                  style={heroCardStyles.founders}
                >
                  <span
                    className="pointer-events-none absolute inset-0 opacity-100"
                    aria-hidden
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 42%, rgba(255,255,255,0) 100%)",
                    }}
                  />
                  <span className="relative z-10">Biz Kimiz</span>
                </Link>
                  <Link
                    to="/addcom"
                    className={`${heroCtaClass} px-4`}
                    style={heroCardStyles.addWhatsapp}
                  >
                    <span
                      className="pointer-events-none absolute inset-0 opacity-100"
                      aria-hidden
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 42%, rgba(255,255,255,0) 100%)",
                      }}
                    />
                    <span className="relative z-10">💬 Topluluğunu Ekle!</span>
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
              <div className="relative overflow-hidden rounded-3xl">
                <video
                  src="/herovideo.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
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

      <RegisterInterestForm open={formOpen} onOpenChange={setFormOpen} />
    </section>
  );
};

export default HeroSection;
