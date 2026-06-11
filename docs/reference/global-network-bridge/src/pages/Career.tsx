import { useState } from "react";
import {
  Briefcase,
  Globe2,
  PenTool,
  Megaphone,
  Code2,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InterestForm from "@/components/InterestForm";
import { Button } from "@/components/ui/button";

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
  const [open, setOpen] = useState(false);
  const [activeJob, setActiveJob] = useState<Job | null>(null);

  const apply = (job: Job | null) => {
    setActiveJob(job);
    setOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        {/* HERO */}
        <section className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-turquoise/15 border border-turquoise/30 mb-6">
              <Briefcase className="h-4 w-4 text-turquoise" />
              <span className="text-sm font-semibold text-turquoise">
                CorteQS Kariyer
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              CorteQS Global Ekibine Katıl
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Dünyanın dört bir yanındaki Türk diasporasını tek bir dijital ağda
              buluşturuyoruz.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              CorteQS; global Türk diasporasının profesyonellerini,
              işletmelerini, içerik üreticilerini, topluluklarını ve yerel
              aktörlerini tek çatı altında görünür, erişilebilir ve bağlantılı
              hale getirmek için geliştirilen yeni nesil bir dijital
              platformdur.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed mt-4">
              Şu anda hızlı büyüme dönemine hazırlanıyoruz. Önümüzde 19 ülkeye
              yayılacak bir <strong>pre-launch</strong> süreci,{" "}
              <strong>29 Ekim 2026</strong>'da planlanan tam açılış ve global
              ölçekte büyüyecek bir ekosistem var.
            </p>
            <div className="mt-8">
              <Button size="lg" onClick={() => apply(null)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Genel Başvuru Bırak
              </Button>
            </div>
          </div>
        </section>

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

        {/* JOBS */}
        <section className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-2 text-center">
              Açık Pozisyonlar
            </h2>
            <p className="text-center text-muted-foreground mb-10">
              Her pozisyon için doğrudan başvuru bırakabilirsin.
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
                        <div className="text-xs font-semibold text-turquoise mb-2">
                          {idx + 1}. Pozisyon
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

                        <Button onClick={() => apply(job)} className="mt-2">
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

        {/* FOOTER CTA */}
        <section className="container mx-auto px-4 mt-12">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Aradığın pozisyonu bulamadın mı? Genel başvuru bırak — yetenek
              havuzumuza ekleyelim.
            </p>
            <Button variant="outline" onClick={() => apply(null)}>
              Genel Başvuru Bırak
            </Button>
          </div>
        </section>
      </main>
      <Footer />
      <InterestForm
        open={open}
        onOpenChange={setOpen}
        context="kariyer" lockCategory
        title={activeJob ? `Başvuru: ${activeJob.title}` : "Genel Başvuru"}
        description="Bilgilerinizi bırakın, başvurunuzu inceleyip dönüş yapalım."
        source={activeJob ? `career-${activeJob.id}` : "career-general"}
        defaultCategory="kariyer"
      />
    </div>
  );
};

export default Career;
