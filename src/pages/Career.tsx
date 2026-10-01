import { useState } from "react";
import { Globe2, PenTool, Megaphone, Code2, AlertTriangle } from "lucide-react";
import CareerApplicationForm from "@/components/career/CareerApplicationForm";
import CareerClockBand from "@/components/career/CareerClockBand";
import CareerInternProgram from "@/components/career/CareerInternProgram";
import CareerHero from "@/components/career/CareerHero";
import CareerPositionList from "@/components/career/CareerPositionList";
import FounderLetters from "@/components/career/FounderLetters";
import ParticipationModels from "@/components/career/ParticipationModels";
import { Button } from "@/components/ui/button";
import { CAREER_INTERNSHIP, CAREER_JOBS } from "@/lib/careers/careers-data";
import { LEGACY_CAREER_POSITIONS, LEGACY_POSITION_NOTE } from "@/lib/careers/careers-legacy";
import { PAGE_SEO } from "@/lib/page-seo";
import { useSeo } from "@/lib/seo";

interface Job {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
  description: string;
  expectations?: string[];
  fitFor?: string[];
  topics?: string[];
}

const jobs: Job[] = [
  {
    id: "global-local-contributor",
    title: "Global Contributor / Local Contributor",
    icon: Globe2,
    tagline:
      "Yaşadığın şehirde Türk diasporasını harekete geçirecek yerel/global temsilciler.",
    description:
      "Bulunduğu şehirde veya ülkede Türk diasporasıyla bağlantısı güçlü olan; yerel işletmelere, profesyonellere, topluluklara ve son kullanıcılara ulaşabilecek kişiler arıyoruz. Yüksek takipçi sayısı zorunlu değil — önemli olan doğru insanlara ulaşabilmen, CorteQS'i anlatabilmen ve yerel ağı harekete geçirebilmen.",
    expectations: [
      "Yaşadığın şehirdeki Türk işletmelerine, profesyonellere ve topluluklara ulaşmak",
      "CorteQS'in bilinirliğini artırmak",
      "Platforma yeni kullanıcı, işletme ve profesyonel kazandırmak",
      "Merkezden gelen içeriklerin yerel çevrede yayılmasına destek olmak",
      "Yerel fırsatları, ihtiyaçları ve geri bildirimleri CorteQS ekibine aktarmak",
    ],
    fitFor: [
      "Diaspora içinde aktif çevresi olanlar",
      "Şehrindeki Türk topluluğunu iyi tanıyanlar",
      "Girişimcilik, topluluk yönetimi, satış, iş geliştirme veya iletişim odaklı kişiler",
      "Üniversite öğrencileri, genç profesyoneller, girişimciler, danışmanlar, freelance çalışanlar",
      "CorteQS'in global büyümesinde erken dönemde yer almak isteyenler",
    ],
  },
  {
    id: "content-creator",
    title: "Content Creator / Blogger / Vlogger",
    icon: PenTool,
    tagline:
      "CorteQS'in global içerik ekosisteminde yer alacak içerik üreticileri.",
    description:
      "Kendi hikayeni, yaşadığın ülkedeki diaspora deneyimlerini, şehir rehberlerini, işletme tanıtımlarını, profesyonel başarı hikayelerini veya global Türk diasporasına dair ilham verici içerikleri üretebilirsin.",
    topics: [
      "Yurtdışında yaşam deneyimleri",
      "Diaspora başarı hikayeleri",
      "Şehir ve ülke rehberleri",
      "Türk işletmeleri ve profesyonelleri",
      "Kültür, topluluk, göç, kariyer, eğitim ve girişimcilik",
      "CorteQS kategorileriyle uyumlu yerel içerikler",
      "Video, reels, short-form içerik, blog yazısı, röportaj ve saha içerikleri",
    ],
    fitFor: [
      "Blogger, vlogger, influencer veya mikro içerik üreticileri",
      "0–30K takipçi aralığındaki yükselen creator'lar",
      "Kamera karşısında veya yazılı içerikte güçlü olanlar",
      "Yaşadığı ülkede/şehirde diaspora hikayelerini görünür kılmak isteyenler",
      "CorteQS üzerinden global görünürlük kazanmak isteyenler",
    ],
  },
  {
    id: "global-content-lead",
    title: "Global Content Lead — Core Team",
    icon: Megaphone,
    tagline:
      "CorteQS'in global sesini kuracak, içerik motorunu tasarlayacak içerik lideri.",
    description:
      "İçerik, sosyal medya, kampanya, storytelling ve global görünürlük stratejisini yönetecek; hızlı düşünen, çok zeki, deneyimli, son teknoloji araçlara hakim ve fırtına gibi çalışan bir içerik lideri arıyoruz. Yalnızca sosyal medya postu hazırlayan biri değil; creator ağını yönetecek, kampanyaları ölçekleyecek, markanın her dijital temas noktasında tutarlı ve büyüme odaklı bir yapı kuracak kişi.",
    expectations: [
      "CorteQS global içerik stratejisini oluşturmak",
      "Web, sosyal medya, landing page, one pager, kampanya ve topluluk içeriklerini yönetmek",
      "Global creator ve contributor içerik akışını koordine etmek",
      "LinkedIn, Instagram, Facebook, YouTube, TikTok ve blog içerik sistemlerini kurmak",
      "AI destekli içerik üretim süreçlerini tasarlamak",
      "Marka dili, anlatı, kampanya fikri ve içerik takvimlerini yönetmek",
      "Growth, acquisition ve community ekipleriyle birlikte çalışmak",
      "İçerik performansını ölçmek, optimize etmek ve ölçeklemek",
    ],
    fitFor: [
      "İçerik, sosyal medya, growth marketing veya marka iletişiminde güçlü deneyim",
      "AI araçlarına, LLM'lere, otomasyonlara ve yeni nesil içerik üretim sistemlerine hakimiyet",
      "Global düşünebilme ve çok kültürlü kitlelere hitap edebilme",
      "Hem strateji kurabilen hem de gerektiğinde hızlıca üretime inebilen çalışma tarzı",
      "Girişim ortamında belirsizlikle çalışabilme",
      "Çok hızlı öğrenme, üretme ve güçlü sahiplenme refleksi",
    ],
  },
  {
    id: "technical-core-team",
    title: "Technical Core Team — CTO Altı Teknik Ekip",
    icon: Code2,
    tagline:
      "CTO ile birlikte CorteQS'in teknik çekirdeğini kuracak ekip üyeleri.",
    description:
      "Platformun mimarisi, ölçeklenebilirliği, AI entegrasyonları, dashboard yapıları, kullanıcı deneyimi, veri altyapısı ve global büyümeye hazır teknik sistemleri için güçlü bir çekirdek ekip oluşturuyoruz.",
    topics: [
      "Full-stack development",
      "Frontend / Backend development",
      "Mobile app development",
      "AI / LLM entegrasyonları",
      "Data engineering",
      "Product design / UX/UI",
      "DevOps / cloud infrastructure",
      "No-code / low-code / automation sistemleri",
      "Security, scalability ve platform architecture",
    ],
    fitFor: [
      "Erken aşama girişim ortamında çalışabilecek",
      "Modern teknolojilere ve AI destekli geliştirme süreçlerine hakim",
      "Hızlı prototipleme ve ürün çıkarma refleksi olan",
      "CTO ile yakın çalışabilecek",
      "Teknik kararları ürün ve iş modeli açısından da değerlendirebilen",
      "Global ölçeklenebilir bir platform kurma motivasyonu taşıyan ekip arkadaşları",
    ],
  },
];

const Career = () => {
  useSeo(PAGE_SEO.career, []);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  /**
   * Yeni ilan listesinden gelen başvuru isteği (KR05). Seçim tutulur ve forma
   * kaydırılır; formun kendisi KR06'da bu seçimi doldurur. Şu an hedef, eski
   * ilgi formunun bulunduğu `#basvuru` çapasıdır — KR06 aynı çapayı devralır,
   * böylece bağlantı hiçbir ara adımda boşa düşmez.
   */
  const handleApplyToPosition = (positionId: string) => {
    setSelectedPosition(positionId);
    document.getElementById("basvuru")?.scrollIntoView({ block: "start" });
  };

  const selectedPositionLabel =
    CAREER_JOBS.find((job) => job.id === selectedPosition)?.tr ??
    LEGACY_CAREER_POSITIONS.find((job) => job.id === selectedPosition)?.title ??
    (selectedPosition === CAREER_INTERNSHIP.id ? CAREER_INTERNSHIP.tr : null);

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-20">
        {/* KR04 — yeni iskelet. Açık pozisyon listesi KR05'te, başvuru formu
            KR06'da bu bölümlerin arasına girer. Aşağıdaki "önceki dönem"
            bölümü KR07'ye kadar yerinde kalır: sayfa hiçbir commit'te yarım
            kalmaz. */}
        <CareerHero />
        <CareerClockBand />
        <FounderLetters />
        <ParticipationModels />
        <CareerPositionList onApply={handleApplyToPosition} />
        <CareerInternProgram onApply={handleApplyToPosition} />

        {/* ——— Önceki dönem içeriği (KR07'de ayrı bölüme alınacak) ——— */}

        {/* INTRO BLOCK */}
        <section className="container mx-auto px-4 mb-14">
          <div className="max-w-4xl mx-auto rounded-2xl border border-border bg-card p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              CorteQS, Global Ölçekte Kurulacak Bir Start-up'ın Erken Dönem
              Liderlerini Arıyor
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Kendi işini yapan, bir kurumda çalışan ya da kariyerinde güçlü bir
              noktaya gelmiş deneyimli profesyonellerle tanışmak istiyoruz.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Aradığımız kişiler; yalnızca operasyonel katkı verecek ekip
              üyeleri değil, gerektiğinde <strong>ekip kurabilecek</strong>,
              ekip yönetebilecek, strateji geliştirebilecek, hızlı uygulamaya
              geçebilecek ve CorteQS'in global büyüme sürecinde sorumluluk
              alabilecek <strong>erken dönem liderlerdir</strong>.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Bu profilin; son teknolojiye, AI araçlarına, dijital sistemlere ve
              start-up çalışma kültürüne hakim olması; belirsizlik, hız, risk ve
              değişkenlik içinde değer üretebilmesi beklenir.
            </p>
            <p className="text-foreground font-semibold uppercase tracking-wide text-sm mb-4">
              Yurt dışında yaşamış veya yaşıyor olmanız avantajdır.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              CorteQS şu anda <strong>erken aşama / pre-launch</strong>{" "}
              dönemindedir. Bu nedenle bu fırsat, klasik güvenli maaşlı iş
              modeli arayanlardan çok; risk ve kazanç dengesini anlayan, erken
              dönem girişimlerde büyük sorumluluk ve uzun vadeli upside
              potansiyelini görebilen kişiler için uygundur.
            </p>
          </div>
        </section>

        {/* ÖNCEKİ DÖNEM İLANLARI (KR07) — silinmedi, yeni 17 ilanın altında
            ayrı bölümde duruyor. Kaldırma koşulu KALANLAR'da yazılı. */}
        <section className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-2 text-center">
              Önceki dönem ilanları
            </h2>
            <p className="text-center text-muted-foreground mb-10">
              Bu ilanlar önceki dönemde yayınlandı ve hâlâ geçerli. Başvuruların
              yukarıdaki formla aynı yere düşer.
            </p>

            <div className="grid gap-6">
              {jobs.map((job, idx) => {
                const Icon = job.icon;
                return (
                  <article
                    key={job.id}
                    className="rounded-2xl border border-border bg-card p-6 md:p-8 hover:border-turquoise/40 hover:shadow-card transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                      <div className="shrink-0">
                        <div className="h-14 w-14 rounded-xl bg-turquoise/15 border border-turquoise/30 flex items-center justify-center">
                          <Icon className="h-7 w-7 text-turquoise" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-turquoise">
                            {idx + 1}. Pozisyon
                          </span>
                          <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {LEGACY_POSITION_NOTE}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{job.title}</h3>
                        <p className="text-sm text-muted-foreground italic mb-4">
                          {job.tagline}
                        </p>
                        <p className="text-sm text-foreground/90 leading-relaxed mb-5">
                          {job.description}
                        </p>

                        {job.expectations && (
                          <div className="mb-4">
                            <h4 className="font-semibold text-sm mb-2">
                              Senden beklediklerimiz
                            </h4>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                              {job.expectations.map((e) => (
                                <li key={e}>{e}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {job.topics && (
                          <div className="mb-4">
                            <h4 className="font-semibold text-sm mb-2">
                              {job.id === "technical-core-team"
                                ? "İlgilendiğimiz alanlar"
                                : "İçerik konuları"}
                            </h4>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                              {job.topics.map((e) => (
                                <li key={e}>{e}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {job.fitFor && (
                          <div className="mb-5">
                            <h4 className="font-semibold text-sm mb-2">
                              {job.id === "global-content-lead" ||
                              job.id === "technical-core-team"
                                ? "Aradığımız profil"
                                : "Kimler için uygun?"}
                            </h4>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                              {job.fitFor.map((e) => (
                                <li key={e}>{e}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <Button onClick={() => handleApplyToPosition(job.id)} className="mt-2">
                          Bu Pozisyona Başvur
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* IMPORTANT NOTE */}
        <section className="container mx-auto px-4 mt-14">
          <div className="max-w-4xl mx-auto rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-6 md:p-8">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-1" />
              <h3 className="text-xl font-bold">Önemli Not</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              CorteQS şu anda <strong>erken aşama / pre-launch</strong>{" "}
              dönemindedir. Bu nedenle bazı roller başlangıçta gönüllülük,
              performans bazlı kazanç, referral modeli, proje bazlı ödeme,
              equity / opsiyon veya ilerleyen yatırım ve gelir dönemlerinde
              ücretli pozisyona dönüşebilecek modellerle değerlendirilecektir.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Amacımız, para akışı başladığında kime hangi rolü, hangi
              sorumlulukla ve hangi teklif modeliyle sunacağımızı önceden
              netleştirmek ve global büyümeye hazır bir yetenek havuzu
              oluşturmaktır.
            </p>
            <p className="text-sm text-foreground font-medium leading-relaxed">
              Bu yolculuğa erken katılanlar yalnızca bir işe başvurmuş olmayacak;
              CorteQS'in global kuruluş hikayesinin parçası olacak.
            </p>
          </div>
        </section>

        {/* FOOTER CTA — `#basvuru` çapası KR06'da gerçek başvuru formuna devredilir.
            Çapa şimdiden burada: ilan kartındaki "Bu pozisyona başvur" düğmesi
            hiçbir ara adımda boşa düşmesin. */}
        <section id="basvuru" className="container mx-auto scroll-mt-24 px-4 mt-12">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold sm:text-3xl">Başvur</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Formu doldur, CV'ni ekle. Ön yazı ve sunum isteğe bağlı.
            </p>
            {selectedPosition && selectedPositionLabel && (
              <p className="mt-4 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
                Seçtiğin pozisyon: <strong>{selectedPositionLabel}</strong>
              </p>
            )}
            <div className="mt-8">
              <CareerApplicationForm selectedPosition={selectedPosition} />
            </div>
          </div>
        </section>
      </main>

    </div>
  );
};

export default Career;
