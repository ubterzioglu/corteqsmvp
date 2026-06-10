import {
  BriefcaseBusiness,
  CalendarDays,
  Clapperboard,
  Globe,
  Landmark,
  Map,
  MapPinned,
  MessageCircleMore,
  Plane,
  ScanSearch,
  Store,
  Users,
} from "lucide-react";
import showcasePanelImage from "@/assets/global-network-showcase-panel.png";
const logo = "/newlogo.png";

const rebuiltCards = [
  {
    title: "İşletmeler",
    description:
      "Yerel müşterilere, diasporaya ve global Türk ağına ulaşın. Etkinlikler, kampanyalar ve topluluklarla görünürlüğünüzü büyütün.",
    image: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200",
    icon: Store,
    accent: "from-[#42bf65] to-[#2da956]",
    text: "text-[#2c9b4d]",
    line: "bg-[#42bf65]",
  },
  {
    title: "Profesyoneller",
    description:
      "İş fırsatları, mentorlar, networking etkinlikleri ve şehir bazlı topluluklarla bağlantı kurun.",
    image: "https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=1200",
    icon: BriefcaseBusiness,
    accent: "from-[#4a97ff] to-[#2878f2]",
    text: "text-[#2878f2]",
    line: "bg-[#3c8cff]",
  },
  {
    title: "Kuruluşlar",
    description:
      "Topluluklarınızı büyütün, etkinliklerinizi duyurun ve global diaspora içinde görünür olun.",
    image: "https://images.pexels.com/photos/7092613/pexels-photo-7092613.jpeg?auto=compress&cs=tinysrgb&w=1200",
    icon: Landmark,
    accent: "from-[#a45af6] to-[#7c3aed]",
    text: "text-[#7c3aed]",
    line: "bg-[#9b5cf4]",
  },
  {
    title: "Topluluk Yöneticileri",
    description:
      "WhatsApp ve Telegram gruplarınızı listeleyin, yeni üyelere ulaşın ve kendi mikro ağınızı yönetin.",
    image: "https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=1200",
    icon: Users,
    accent: "from-[#52d67c] to-[#2bbf62]",
    text: "text-[#24a454]",
    line: "bg-[#35c465]",
  },
  {
    title: "İçerik Üreticileri",
    description:
      "Blogger, vlogger ve dijital topluluk liderleri için yeni nesil diaspora dağıtım ağı.",
    image: "https://images.pexels.com/photos/5054212/pexels-photo-5054212.jpeg?auto=compress&cs=tinysrgb&w=1200",
    icon: Clapperboard,
    accent: "from-[#ff59b8] to-[#ff2b92]",
    text: "text-[#ef2d8d]",
    line: "bg-[#ff2b92]",
  },
  {
    title: "Dijital Gruplar",
    description:
      "Şehir, ülke ve tema bazlı topluluklar tek bir keşif sisteminde birleşiyor.",
    image: "https://images.pexels.com/photos/4226256/pexels-photo-4226256.jpeg?auto=compress&cs=tinysrgb&w=1200",
    icon: Globe,
    accent: "from-[#ffb249] to-[#ff7a18]",
    text: "text-[#f97316]",
    line: "bg-[#ff7a18]",
  },
] as const;

const featureItems = [
  { label: "Cadde\nSosyal Ağı", icon: Map, color: "text-[#4bbf70]", ring: "ring-[#c6f2d3]" },
  { label: "WhatsApp\nTelegram Toplulukları", icon: MessageCircleMore, color: "text-[#35c465]", ring: "ring-[#caf4d6]" },
  { label: "Etkinlikler", icon: CalendarDays, color: "text-[#8b5cf6]", ring: "ring-[#e5d6ff]" },
  { label: "Relokasyon\nMentor Sistemi", icon: Plane, color: "text-[#fb923c]", ring: "ring-[#ffe0c5]" },
  { label: "Şehir Bazlı\nFeedler", icon: MapPinned, color: "text-[#3b82f6]", ring: "ring-[#d6e8ff]" },
  { label: "İşletmeler\nHizmetler", icon: BriefcaseBusiness, color: "text-[#f59e0b]", ring: "ring-[#ffecbe]" },
  { label: "Diaspora\nHaritası", icon: Globe, color: "text-[#ec4899]", ring: "ring-[#ffd5eb]" },
  { label: "AI Destekli\nYönlendirme", icon: ScanSearch, color: "text-[#6366f1]", ring: "ring-[#dfe0ff]" },
] as const;

const GlobalNetworkShowcaseSection = () => {
  return (
    <section className="relative overflow-hidden py-5 lg:py-8">
      <div className="container relative z-10 mx-auto max-w-6xl px-4">
        <div className="rounded-[1.75rem] border border-slate-200/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(252,253,255,0.96))] px-6 py-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)] md:px-8 md:py-7 xl:px-6 xl:py-6">
            <h2 className="mb-5 text-center text-[1.5rem] font-black leading-[1.15] tracking-[-0.03em] text-slate-900 sm:text-[1.85rem] lg:text-[2.2rem]">
              Dünyanın farklı yerlerinde yaşayan<br />
              <span className="bg-[linear-gradient(90deg,#23b26d_0%,#7c3aed_48%,#ff7a18_100%)] bg-clip-text text-transparent">
                Türkleri sosyal ve ekonomik olarak
              </span><br />
              birbirine bağlıyoruz.
            </h2>

            <div className="flex justify-center mb-5">
              <div className="relative w-full max-w-2xl">
                <img
                  src="/sweet.jpg"
                  alt="CorteQS global ağ görseli"
                  className="w-full object-contain rounded-[1.5rem]"
                  style={{
                    filter: "drop-shadow(0 8px 32px rgba(124,58,237,0.18)) drop-shadow(0 2px 12px rgba(35,178,109,0.14))",
                  }}
                />
                {/* Sol kenar solma */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-20 rounded-l-[1.5rem] bg-gradient-to-r from-white/90 to-transparent" />
                {/* Sağ kenar solma */}
                <div className="pointer-events-none absolute inset-y-0 right-0 w-20 rounded-r-[1.5rem] bg-gradient-to-l from-white/90 to-transparent" />
                {/* Alt kenar solma */}
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 rounded-b-[1.5rem] bg-gradient-to-t from-white/80 to-transparent" />
              </div>
            </div>

            <p className="mb-8 text-center text-[0.98rem] font-medium leading-7 text-slate-500 sm:text-[1.08rem]">
              CorteQS, işletmelerden profesyonellere, kuruluşlardan topluluk yöneticilerine
              kadar herkesi tek bir ağ içinde bir araya getirir.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              {rebuiltCards.map((card) => {
                const Icon = card.icon;

                return (
                  <article
                    key={`reference-card-${card.title}`}
                    className="group flex flex-row items-center overflow-hidden rounded-[1.35rem] border border-slate-200/90 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,0.09)] sm:min-h-[248px] sm:flex-col sm:items-stretch"
                  >
                    <div className="relative hidden h-24 overflow-hidden sm:block sm:h-28 xl:h-24 2xl:h-28">
                      <img
                        src={card.image}
                        alt={card.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_48%,rgba(255,255,255,0.14)_100%)]" />
                    </div>

                    <div className="flex flex-1 flex-row items-center gap-3 px-4 py-3 text-left sm:flex-col sm:gap-0 sm:py-4 sm:text-center sm:pb-4 sm:pt-5 2xl:px-5">
                      <div className="flex shrink-0 flex-row items-center gap-3 sm:min-h-[5.1rem] sm:flex-col sm:justify-start sm:gap-2">
                        <div className={`shrink-0 rounded-full bg-gradient-to-br p-2.5 text-white shadow-[0_12px_24px_rgba(15,23,42,0.14)] ${card.accent}`}>
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <h4 className={`text-left text-[0.85rem] font-bold leading-[1.08] tracking-[-0.04em] sm:text-center sm:text-[0.72rem] xl:text-[0.76rem] 2xl:text-[0.84rem] ${card.text}`}>
                          {card.title}
                        </h4>
                      </div>
                      <p className="flex-1 text-left text-[0.78rem] leading-5 text-slate-600 sm:mt-2 sm:min-h-[6.4rem] sm:text-center sm:text-[0.76rem] 2xl:text-[0.8rem]">
                        {card.description}
                      </p>
                      <div className={`hidden h-1 w-8 rounded-full sm:mx-auto sm:mt-4 sm:block ${card.line}`} />
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-5 overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white shadow-[0_16px_38px_rgba(15,23,42,0.06)]">
              <div className="grid grid-cols-2 gap-0 md:grid-cols-2 xl:grid-cols-[1.55fr_repeat(8,minmax(0,1fr))]">
                <div className="col-span-2 flex min-h-[96px] items-center gap-3 border-b border-slate-200/80 px-4 py-3 sm:min-h-[168px] sm:items-start sm:gap-4 sm:px-6 sm:py-5 xl:col-span-1 xl:min-h-[156px] xl:border-r xl:border-b-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(244,247,255,0.95))] shadow-[0_16px_30px_rgba(15,23,42,0.08)] sm:h-16 sm:w-16">
                    <img src={logo} alt="CorteQS" className="h-12 w-12 object-contain sm:h-16 sm:w-16" />
                  </div>
                  <div className="flex flex-col justify-between gap-1 sm:min-h-[118px] sm:gap-0 sm:pt-1">
                    <p className="text-[1.35rem] font-black leading-none tracking-[-0.04em] text-slate-900 sm:text-[1.8rem]">
                      CorteQS
                    </p>
                    <p className="max-w-[14rem] text-[0.78rem] font-semibold leading-5 tracking-[-0.03em] text-slate-800 sm:text-[0.86rem] sm:leading-5.5">
                      Yurt Dışında Yaşayan Türklerin Sistemi
                    </p>
                  </div>
                </div>

                {featureItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={`reference-${item.label}`}
                      className="flex min-h-[96px] items-start justify-center border-b border-r border-slate-200/80 px-2 py-3 text-center even:border-r-0 last:border-b-0 sm:min-h-[168px] sm:px-4 sm:py-5 xl:min-h-[156px] xl:border-b-0 xl:border-r xl:last:border-r-0"
                    >
                      <div className="flex w-full flex-col items-center justify-between gap-1.5 sm:min-h-[118px] sm:gap-0">
                        <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_10px_28px_rgba(15,23,42,0.08)] ring-1 sm:h-16 sm:w-16 ${item.ring}`}>
                          <Icon className={`h-5 w-5 sm:h-8 sm:w-8 ${item.color}`} />
                        </div>
                        <p className="flex items-start justify-center whitespace-pre-line text-[0.68rem] font-semibold leading-[1.3] tracking-[-0.02em] text-slate-800 sm:min-h-[68px] sm:text-[0.78rem] sm:leading-[1.4] xl:text-[0.8rem]">
                          {item.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 px-6 py-4">
                <div className="h-1 w-full rounded-full bg-[linear-gradient(90deg,#ffb46b_0%,#f6f0df_8%,#52d67c_42%,#f7f4ea_56%,#8b5cf6_78%,#60a5fa_100%)]" />
                <p className="mt-3 text-center text-lg font-semibold tracking-[-0.03em] text-slate-700">
                  Bağlan. Keşfet. Güçlen.
                </p>
              </div>
            </div>
        </div>
      </div>
    </section>
  );
};

export default GlobalNetworkShowcaseSection;
