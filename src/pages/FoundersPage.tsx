import { useEffect, useState } from "react";
import { Linkedin } from "lucide-react";
import burakPhoto from "../../burak.png";
import ubtPhoto from "../../ubt.png";

type FounderSection = {
  title: string;
  body: string;
};

type FounderProfile = {
  name: string;
  role: string;
  summary: string;
  strengths: string[];
  linkedinUrl: string;
  sections: FounderSection[];
  imageSrc?: string;
  imageAlt: string;
  fallbackInitials: string;
};

const founderProfiles: FounderProfile[] = [
  {
    name: "Burak Akçakanat",
    role: "Kurucu Ortak",
    summary:
      "35 yılı aşkın üretim, ticaret, girişimcilik, danışmanlık ve uluslararası iş geliştirme deneyimine sahip; şirket yapılanması, operasyonel büyüme ve bölgesel genişleme alanlarında güçlü perspektif geliştirmiş kurucu.",
    strengths: [
      "Uluslararası pazar geliştirme",
      "Şirket yapılanması ve ölçeklenme",
      "Operasyonel dönüşüm",
      "Bölgesel büyüme stratejileri",
      "İnsan davranışı ve karar mekanizmaları",
      "Topluluk dinamikleri",
      "Dijital ekosistem tasarımı",
      "Network yapılanmaları",
      "Sürdürülebilir büyüme modelleri",
    ],
    linkedinUrl: "https://www.linkedin.com/in/burakakcakanat/",
    imageSrc: burakPhoto,
    imageAlt: "Burak Akçakanat profil fotoğrafı",
    fallbackInitials: "BA",
    sections: [
      {
        title: "Profesyonel Arka Plan",
        body:
          "35 yılı aşkın üretim, ticaret, girişimcilik, danışmanlık ve uluslararası iş geliştirme deneyimine sahiptir. Farklı sektörler ve coğrafyalarda edindiği saha pratiği; şirket yapılanması, operasyonel büyüme, stratejik dönüşüm ve bölgesel genişleme alanlarında güçlü bir perspektif geliştirmesini sağlamıştır. Amerika, Asya-Pasifik ve GCC bölgelerindeki deneyimleri sayesinde farklı pazar dinamikleri ve kültürler üzerine uluslararası bir bakış açısı kazanmıştır.",
      },
      {
        title: "CorteQS Vizyonu ile Bağlantısı",
        body:
          "CorteQS’i yalnızca bir networking platformu değil; şehir, sektör ve güven temelli bağlantılar üzerinden global Türk diasporasını organize edebilecek yeni nesil bir dijital ekosistem olarak konumlandırmaktadır. Platformun; profesyonelleri, girişimcileri, yatırımcıları ve toplulukları aynı altyapıda daha sistematik biçimde bir araya getirerek ekonomik, sosyal ve profesyonel etkileşimi güçlendirmesini hedeflemektedir.",
      },
      {
        title: "Stratejik ve Yatırımcı Perspektifi",
        body:
          "CorteQS’e; yüksek ölçeklenme potansiyeline sahip, çok katmanlı bir dijital büyüme altyapısı olarak yaklaşmaktadır. Şehir bazlı yapılanma modeli, diaspora dinamiği ve topluluk odaklı yapısı sayesinde platformun uzun vadede güçlü bir network-effect ekonomisi oluşturabileceğine inanmaktadır. CorteQS’in uzun vadeli sürdürülebilir bir ekosisteme dönüşmesini hedefliyor.",
      },
    ],
  },
  {
    name: "Umut Barış Terzioğlu",
    role: "Kurucu Ortak",
    summary:
      "Mühendislik disiplini, kalite güvencesi, otomasyon, süreç optimizasyonu ve ölçeklenebilir sistemler odağından gelen kurucu ve operasyonel yapı tasarımcısı.",
    strengths: [
      "Ürün güveni odaklı kalite yaklaşımı",
      "Disiplinli test stratejisi",
      "Süreç optimizasyonu bakışı",
      "Ölçeklenebilir otomasyon becerisi",
      "Kurumsal güvenilirlik odağı",
      "Topluluk uyumlu teknik mimari",
      "Kaliteyi koruyan sistem tasarımı",
      "Operasyonel düzen kurma disiplini",
      "Diaspora ihtiyaçlarına ürün yaklaşımı",
    ],
    linkedinUrl: "https://www.linkedin.com/in/ubterzioglu",
    imageSrc: ubtPhoto,
    imageAlt: "Umut Barış Terzioğlu profil fotoğrafı",
    fallbackInitials: "UBT",
    sections: [
      {
        title: "Profesyonel Arka Plan",
        body:
          "18 yılı aşan kariyeri boyunca Türkiye ve Almanya’da; Daimler / Mercedes-Benz ve Swisslog gibi yüksek karmaşıklığa sahip yapılarda görev aldı. Yalnızca test süreçlerinde bulunmakla kalmayıp kalite sistemleri kurdu, test stratejileri geliştirdi, otomasyon yapıları tasarladı ve global kullanıcıları etkileyen projelerde sürdürülebilir operasyonel yapıların nasıl inşa edilmesi gerektiğine dair güçlü bir birikim kazandı.",
      },
      {
        title: "CorteQS Vizyonu ile Bağlantısı",
        body:
          "CorteQS’i, yurt dışında yaşayan Türklerin güvenilir bağlantı, erişim, görünürlük ve fırsat ihtiyaçlarına yanıt verecek bir dijital altyapı olarak konumluyor. Onun bakışında platformun asıl değeri; dağınık insan gücünü, bilgi birikimini, hizmetleri ve topluluk etkisini organize ederek ölçülebilir bir güven ve etki sistemine dönüştürmesinde yatıyor.",
      },
      {
        title: "Stratejik ve Yatırımcı Perspektifi",
        body:
          "Kurumsal kalite ve ölçeklenebilirlik refleksini topluluk inşa motivasyonuyla birleştirerek CorteQS’in kısa vadeli bir proje değil, şehir şehir genişleyebilecek sürdürülebilir bir diaspora altyapısı olmasını hedefliyor. Bu nedenle platformu; üyelik, premium görünürlük, listeleme, iş birlikleri, topluluk araçları, etkinlikler ve diaspora odaklı reklam modelleriyle ölçeklenebilir bir girişim temeli üzerinde değerlendiriyor.",
      },
    ],
  },
];

const founderCardClass =
  "border-[#0f6fc2]/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(241,248,255,0.97),rgba(235,246,255,0.94))]";

const strengthCardClass =
  "border-[#0f6fc2]/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(236,248,255,0.86),rgba(229,244,255,0.82))]";

const sectionCardClass =
  "border-[#0f6fc2]/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(239,248,255,0.92),rgba(231,244,255,0.86))]";

const linkedinButtonClass =
  "group inline-flex items-center justify-center gap-2 rounded-full border border-[#0f6fc2]/20 bg-[linear-gradient(135deg,#f7fbff_0%,#e7f4ff_38%,#d7ecff_100%)] px-5 py-2.5 text-sm font-semibold text-[#0a4f96] shadow-[0_16px_36px_rgba(15,111,194,0.16),inset_0_1px_0_rgba(255,255,255,0.88)] transition duration-300 hover:-translate-y-0.5 hover:border-[#0f6fc2]/35 hover:bg-[linear-gradient(135deg,#ffffff_0%,#dff1ff_48%,#cde7ff_100%)] hover:text-[#083d75] hover:shadow-[0_20px_42px_rgba(15,111,194,0.22),0_0_0_6px_rgba(15,111,194,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6fc2]/35 focus-visible:ring-offset-2";

const FounderPortrait = ({
  src,
  alt,
  initials,
}: {
  src?: string;
  alt: string;
  initials: string;
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className="flex h-44 w-44 items-center justify-center rounded-full border border-[#0f6fc2]/15 bg-[radial-gradient(circle_at_30%_30%,rgba(255,191,71,0.28),rgba(15,111,194,0.10),rgba(255,255,255,0.96))] text-3xl font-black tracking-[0.18em] text-[#0a2f63] shadow-[0_20px_50px_rgba(15,111,194,0.20)]"
        aria-label={alt}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-44 w-44 rounded-full border-4 border-white object-cover shadow-[0_18px_45px_rgba(10,79,150,0.24),0_0_0_10px_rgba(255,191,71,0.14)]"
      onError={() => setHasError(true)}
    />
  );
};

const FoundersPage = () => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Kurucular | CorteQS";
    document.dispatchEvent(new Event("render-complete"));

    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <main className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] opacity-90"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle at 12% 14%, rgba(37,153,225,0.18), transparent 24%), radial-gradient(circle at 84% 10%, rgba(255,133,10,0.16), transparent 20%), radial-gradient(circle at 72% 78%, rgba(96,202,0,0.12), transparent 22%)",
          }}
        />
        <div
          className="pointer-events-none absolute left-1/2 top-16 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl"
          aria-hidden="true"
          style={{ background: "rgba(16, 128, 210, 0.12)" }}
        />

        <div className="container relative z-10 mx-auto max-w-6xl px-4 py-12 md:py-16">
          <section>
            <div className="grid gap-8 xl:grid-cols-2">
              {founderProfiles.map((founder) => {
                return (
                  <article
                    key={founder.name}
                    className={`overflow-hidden rounded-[2rem] border p-0 shadow-[0_24px_60px_rgba(15,23,42,0.07)] ${founderCardClass}`}
                  >
                    <div className="px-6 pt-6 md:px-8 md:pt-8">
                      <div className="mb-6 flex justify-center">
                        <div className="flex flex-col items-center gap-4">
                          <FounderPortrait
                            src={founder.imageSrc}
                            alt={founder.imageAlt}
                            initials={founder.fallbackInitials}
                          />
                          <a
                            href={founder.linkedinUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`${founder.name} LinkedIn profili`}
                            className={linkedinButtonClass}
                          >
                            <Linkedin className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                            LinkedIn
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="flex w-full items-end justify-between gap-4 px-6 pb-6 pt-0 text-left md:px-8 md:pb-8">
                      <div className="w-full">
                        <span className="inline-flex rounded-full border border-[#0f6fc2]/16 bg-[#0f6fc2]/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#0a4f96]">
                          {founder.role}
                        </span>
                        <h2 className="mt-4 text-3xl font-black tracking-tight text-[#071c3f] md:text-4xl">
                          {founder.name}
                        </h2>
                      </div>
                    </div>

                    <div className="px-6 pb-6 pt-0 md:px-8 md:pb-8">
                      <div className="grid gap-8">
                        <div>
                          <p className="text-base leading-8 text-slate-600">
                            {founder.summary}
                          </p>

                          <div className={`mt-6 rounded-2xl border p-4 ${strengthCardClass}`}>
                            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0a4f96]">
                              Ayırt Edici Güçler
                            </div>
                            <div className="mt-3 grid gap-2">
                              {founder.strengths.map((strength) => (
                                <div key={strength} className="flex items-start gap-3">
                                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#ff8a00]" />
                                  <p className="text-sm leading-6 text-slate-600">{strength}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-4">
                          {founder.sections.map((section) => (
                            <div
                              key={section.title}
                              className={`rounded-[1.6rem] border p-5 ${sectionCardClass}`}
                            >
                              <h3 className="text-lg font-bold text-[#071c3f]">{section.title}</h3>
                              <p className="mt-3 text-sm leading-7 text-slate-600">
                                {section.body}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </main>

    </div>
  );
};

export default FoundersPage;
