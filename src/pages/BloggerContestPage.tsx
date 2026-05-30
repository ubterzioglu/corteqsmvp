import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  Calendar,
  Trophy,
  Users,
  FileText,
  Mic,
  BadgeCheck,
  PenLine,
  Award,
  Music,
  Image as ImageIcon,
  Headphones,
  Quote,
  ShieldCheck,
  Bot,
} from "lucide-react";
import RegisterInterestForm from "@/components/RegisterInterestForm";
import bloggerVisual from "@/assets/blogger-vlogger.jpg";

const themes = [
  { title: "Kültür", desc: "Kültürel deneyimler, diaspora gözlemleri ve kültürler arası karşılaşmalar." },
  { title: "Mücadele", desc: "Göç, kariyer, eğitim, iş kurma, yeniden başlama, dayanışma ve başarı hikâyeleri." },
  { title: "Mizah", desc: "Yurtdışında yaşamdan komik olaylar, kültürel yanlış anlamalar ve gündelik hayat mizahı." },
  { title: "Gusto", desc: "Şehir, mekan, yemek, seyahat, estetik, yaşam tarzı ve deneyim odaklı anlatılar." },
];

const evaluation = [
  { criterion: "Subscription / platform kayıt dönüşümü", weight: "%45" },
  { criterion: "Blog okunma ve okuma kalitesi", weight: "%20" },
  { criterion: "Sosyal medya teaser ve podcast performansı", weight: "%15" },
  { criterion: "Yazarın kendi hesabı + en iyi 3 destek hesabın yayılımı", weight: "%10" },
  { criterion: "Jüri değerlendirmesi", weight: "%10" },
];

const calendar = [
  { phase: "Başvuru başlangıcı", date: "10 Mayıs" },
  { phase: "Son içerik gönderim tarihi", date: "1 Eylül" },
  { phase: "Performans ölçüm süresi", date: "Her içerik için yayın tarihinden itibaren 45 gün" },
  { phase: "Kazananların ilanı", date: "29 Ekim CorteQS Lansmanı" },
  { phase: "Ödül ve online toplantılar", date: "29 Ekim'i takip eden hafta içinde" },
];

const teaserItems = [
  { icon: Quote, text: "Kısa teaser metni" },
  { icon: PenLine, text: "Yazıdan 3 güçlü alıntı" },
  { icon: ImageIcon, text: "Kapak görseli" },
  { icon: Sparkles, text: "Carousel & story başlıkları" },
];

const optionalMedia = [
  { icon: Headphones, text: "Podcast / seslendirme" },
  { icon: Music, text: "Özgün müzik" },
  { icon: ImageIcon, text: "Kısa video teaser" },
];

const statCards = [
  { icon: Trophy, value: "€1.500", label: "Birincilik Ödülü" },
  { icon: FileText, value: "5", label: "Maks. İçerik" },
  { icon: Calendar, value: "1 Eylül", label: "Son Gönderim" },
  { icon: Award, value: "29 Ekim", label: "Kazanan İlanı" },
];

const sectionTitleClass = "text-3xl md:text-4xl font-bold text-foreground mb-4";
const softCardClass =
  "rounded-xl border border-white/60 bg-card/85 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-primary/35 hover:shadow-lg";
const iconBoxClass =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10";
const primaryButtonClass =
  "group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90";

const BloggerContestPage = () => {
  const [formOpen, setFormOpen] = useState(false);
  const openForm = () => setFormOpen(true);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top nav */}
      <div className="container mx-auto px-4 pt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 px-4 py-2 text-sm font-semibold text-primary shadow-sm backdrop-blur-sm transition-colors hover:bg-primary/10"
        >
          <ArrowLeft className="w-4 h-4" />
          Ana sayfaya dön
        </Link>
      </div>

      <section className="relative overflow-hidden bg-gradient-to-br from-background via-card to-secondary/40">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{ backgroundImage: `url(${bloggerVisual})`, backgroundSize: "cover", backgroundPosition: "center" }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/85 via-background/92 to-background" aria-hidden />

        <div className="container mx-auto px-4 py-16 lg:py-24 relative z-10">
          {/* HERO */}
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 mb-16">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 mb-6">
                <PenLine className="w-4 h-4 text-primary" />
                <span className="text-primary text-sm font-semibold tracking-wider uppercase">
                ✍️ CorteQS Blogger İçerik Yarışması
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 leading-tight">
                Global Türklerin en büyük{" "}
                <span className="text-accent">yazılı anlatı arşivini</span>{" "}
                birlikte oluşturuyoruz.
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Hikâyeni, gözlemini veya diaspora anlatını yaz. CorteQS'te yayınla. Dünyaya duyur.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-10">
                <button onClick={openForm} className={primaryButtonClass}>
                  Hikâyeni Gönder
                </button>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-lg overflow-hidden rounded-2xl border border-white/60 bg-card/80 shadow-2xl shadow-primary/10 backdrop-blur-sm">
              <img
                src={bloggerVisual}
                alt="CorteQS blogger ve vlogger yarışması"
                className="aspect-[4/3] w-full object-cover [filter:saturate(0.9)_contrast(0.95)]"
                width={1024}
                height={1024}
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-card/55 via-transparent to-primary/15" aria-hidden />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-20 border-t border-border pt-8">
            {statCards.map((s) => (
              <div key={s.label} className="rounded-xl border border-white/60 bg-card/85 p-5 text-center shadow-sm backdrop-blur-sm transition-all hover:border-primary/35 hover:shadow-lg">
                <s.icon className="w-6 h-6 text-primary mx-auto mb-3" />
                <div className="text-2xl md:text-3xl font-extrabold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* INTRO */}
          <div className="max-w-4xl mx-auto mb-20 space-y-5 rounded-2xl border border-white/60 bg-card/80 p-6 text-lg leading-relaxed text-muted-foreground shadow-sm backdrop-blur-sm md:p-8">
            <p>
              CorteQS Blogger İçerik Yarışması, dünyanın farklı ülkelerinde yaşayan{" "}
              <span className="text-primary font-semibold">Global Türklerin</span> kişisel hikâyelerini,
              diaspora deneyimlerini, kültürel gözlemlerini, mücadelelerini, mizahını ve gusto anlayışını
              yazılı anlatı olarak bir araya getirir.
            </p>
            <p>
              İçerik yalnızca kişinin kendi yaşam hikâyesiyle sınırlı değildir. Katılımcılar yaşadıkları
              ülkedeki Türk diasporasını, topluluk başarılarını, kültürel karşılaşmaları, iş hayatını,
              sosyal yaşamı, yeni nesil göç hikâyelerini ve Global Türklerin ortak meselelerini de konu
              edinebilir.
            </p>
            <p>
              Uygun blog yazıları CorteQS platformunda yayınlanır. Yazılar; sosyal medya teaser'ları,
              görsel anlatımlar, podcast, seslendirme, özgün müzik, kısa video teaser'lar ve yaratıcı medya
              bileşenleriyle daha geniş kitlelere ulaştırılabilir.
            </p>
          </div>

          {/* WHO CAN JOIN */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="text-center mb-8">
              <h2 className={sectionTitleClass}>Kimler Katılabilir?</h2>
            </div>
            <div className={`${softCardClass} flex items-start gap-4 md:p-8`}>
              <Users className="w-7 h-7 text-primary shrink-0 mt-1" />
              <p className="text-muted-foreground text-lg leading-relaxed">
                Yarışmaya <span className="text-foreground font-semibold">bloggerlar, yazarlar, hikâye anlatıcıları,
                içerik üreticileri, öğrenciler, profesyoneller, araştırmacılar</span> ve Global Türkler
                topluluğuna yazılı anlatıyla katkı sunmak isteyen herkes katılabilir.
              </p>
            </div>
          </div>

          {/* THEMES */}
          <div className="mb-20">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className={sectionTitleClass}>Temalar</h2>
              <p className="text-muted-foreground text-lg">İçeriğini bu dört tema ekseninde kurabilirsin.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-5 max-w-5xl mx-auto">
              {themes.map((t) => (
                <div key={t.title} className={softCardClass}>
                  <h3 className="font-bold text-primary text-xl mb-2">{t.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CATEGORIES */}
          <div className="mb-20">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className={sectionTitleClass}>Kategoriler</h2>
              <p className="text-muted-foreground text-lg">Dilediğin kategoride başvurabilirsin.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              <div className={softCardClass}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={iconBoxClass}>
                    <ShieldCheck className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-xl">Otantik İçerik</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Tamamen katılımcının kendi üretimi olan, AI kullanılmamış ve intihal içermeyen özgün
                  yazılardır. AI kullanımı, intihal veya daha önce yayınlanmış içerik tespiti diskalifiye
                  sebebi olabilir.
                </p>
              </div>
              <div className={softCardClass}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={iconBoxClass}>
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-xl">AI Serbest İçerik</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  AI ile üretilmiş, hibrit veya teknoloji destekli içerikler kabul edilir. AI kullanımı
                  beyan edilmelidir. Bu kategoride de intihal, telif ihlali ve izinsiz kullanım yasaktır.
                </p>
              </div>
            </div>
          </div>

          {/* PARTICIPATION & FEE */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 via-card to-primary/10 p-8 shadow-sm md:p-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                Katılım Limiti ve Ücret
              </h2>
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="rounded-xl border border-white/60 bg-card/80 p-6">
                  <div className="text-primary text-sm font-semibold uppercase tracking-wider mb-2">
                    Maksimum Başvuru
                  </div>
                  <div className="text-4xl font-extrabold text-foreground mb-2">5 İçerik</div>
                  <p className="text-muted-foreground text-sm">
                    Her içerik ayrı başvuru, ayrı değerlendirme ve ayrı referral kodu ile takip edilir.
                  </p>
                </div>
                <div className="rounded-xl border border-white/60 bg-card/80 p-6">
                  <div className="text-primary text-sm font-semibold uppercase tracking-wider mb-2">
                    Katılım Bedeli
                  </div>
                  <div className="text-4xl font-extrabold text-foreground mb-2">€25</div>
                  <p className="text-muted-foreground text-sm">
                    Her içerik başvurusu için katılım bedeli — başvuru sırasında ödenir.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* TEASER PACKAGE */}
          <div className="max-w-5xl mx-auto mb-20">
            <div className="text-center mb-10">
              <h2 className={sectionTitleClass}>
                Blog İçeriği ve Teaser Paketi
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl mx-auto">
                Ana içerik CorteQS platformunda yayınlanacak blog yazısıdır. Yazılar fotoğraf, görsel,
                alıntı kutusu, ses kaydı, harita, zaman çizelgesi veya diğer yaratıcı medya bileşenleriyle
                desteklenebilir.
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-primary text-sm font-semibold uppercase tracking-wider mb-4">
                Her başvuruda alınanlar
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {teaserItems.map((t) => (
                  <div
                    key={t.text}
                    className="flex items-center gap-3 p-4 rounded-xl bg-card/85 border border-white/60 shadow-sm"
                  >
                    <t.icon className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-foreground text-sm font-medium">{t.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-primary text-sm font-semibold uppercase tracking-wider mb-4">
                Opsiyonel medya bileşenleri (önerilir)
              </h3>
              <div className="grid sm:grid-cols-3 gap-3">
                {optionalMedia.map((m) => (
                  <div
                    key={m.text}
                    className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-card border border-white/60 shadow-sm"
                  >
                    <m.icon className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-foreground text-sm font-medium">{m.text}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Zorunlu değildir; ancak tanıtımı ve etkileşimi güçlendirdiği için tavsiye edilir.
              </p>
            </div>
          </div>

          {/* PODCAST */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className={`${softCardClass} flex items-start gap-5 md:p-9`}>
              <div className="shrink-0 w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Mic className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Podcast Yayını</h2>
                <p className="text-muted-foreground leading-relaxed">
                  CorteQS, uygun gördüğü blog yazılarını <span className="text-foreground font-semibold">Spotify
                  ve diğer podcast mecralarında</span> özgün seslendirme, müzik veya ses tasarımıyla
                  podcast formatında yayınlayabilir. Podcast yayınlarından gelen dinlenme, paylaşım, takip,
                  kaydetme ve platforma yönlendirme verileri değerlendirmeye dahil edilebilir.
                </p>
              </div>
            </div>
          </div>

          {/* EVALUATION */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="text-center mb-10">
              <h2 className={sectionTitleClass}>Değerlendirme Kriterleri</h2>
              <p className="text-muted-foreground text-lg">Toplam puan aşağıdaki ağırlıklarla hesaplanır.</p>
            </div>
            <div className="rounded-xl overflow-hidden border border-white/60 bg-card/80 shadow-sm">
              {evaluation.map((e, i) => (
                <div
                  key={e.criterion}
                  className={`flex items-center justify-between gap-4 px-6 py-4 ${
                    i % 2 === 0 ? "bg-background/70" : "bg-card/70"
                  } ${i !== evaluation.length - 1 ? "border-b border-border/70" : ""}`}
                >
                  <span className="text-foreground text-sm md:text-base">{e.criterion}</span>
                  <span className="text-primary font-bold text-lg whitespace-nowrap">{e.weight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PRIZES */}
          <div className="max-w-5xl mx-auto mb-20">
            <div className="text-center mb-10">
              <h2 className={sectionTitleClass}>Ödüller ve Görünürlük</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5 mb-6">
              {[
                { rank: "1.", prize: "€1.500", desc: "Birincilik para ödülü", glow: true },
                { rank: "2.", prize: "Dubai Uçak Bileti", desc: "İstanbul-Dubai standardı; eşdeğer alternatif sunulabilir" },
                { rank: "3.", prize: "Big Chefs Akşam Yemeği", desc: "2 kişilik; ülkeye göre eşdeğer deneyim sunulabilir" },
              ].map((p) => (
                <div
                  key={p.rank}
                  className={`relative p-7 rounded-2xl border text-center ${
                    p.glow
                      ? "bg-gradient-to-br from-accent/15 to-primary/10 border-accent/35 shadow-lg shadow-accent/10"
                      : "bg-card/85 border-white/60 shadow-sm"
                  }`}
                >
                  <div className={`text-5xl font-extrabold mb-3 ${p.glow ? "text-accent" : "text-foreground"}`}>
                    {p.rank}
                  </div>
                  <div className="text-xl font-bold text-foreground mb-2">{p.prize}</div>
                  <p className="text-muted-foreground text-xs leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-primary/10 border border-primary/20 p-5 flex items-start gap-3">
              <BadgeCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-foreground text-sm leading-relaxed">
                Öne çıkan <span className="font-bold text-primary">ilk 20 içerik üreticisine</span>{" "}
                CorteQS platformunda <span className="font-semibold">1 yıl süreyle Onursal
                Blogger/Vlogger Badge'i</span> verilir ve platformda özel tanıtım yapılır.
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Kazananın bulunduğu ülkeye göre eşdeğer seviye ödül alternatifi sunulabilir.
            </p>
          </div>

          {/* CALENDAR */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="text-center mb-10">
              <h2 className={sectionTitleClass}>Takvim</h2>
            </div>
            <div className="rounded-xl overflow-hidden border border-white/60 bg-card/80 shadow-sm">
              {calendar.map((c, i) => (
                <div
                  key={c.phase}
                  className={`grid grid-cols-1 sm:grid-cols-2 gap-2 px-6 py-4 ${
                    i % 2 === 0 ? "bg-background/70" : "bg-card/70"
                  } ${i !== calendar.length - 1 ? "border-b border-border/70" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-foreground font-medium text-sm md:text-base">{c.phase}</span>
                  </div>
                  <span className="text-primary text-sm md:text-base sm:text-right">{c.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* APPLICATION */}
          <div className="max-w-3xl mx-auto text-center rounded-2xl bg-gradient-to-br from-accent/12 via-card to-primary/12 border border-accent/25 p-10 shadow-lg shadow-accent/10 md:p-14">
            <PenLine className="w-12 h-12 text-accent mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4 leading-tight">
              Başvuru
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Katılımcı formu doldurur, içeriğini ve teaser materyallerini yükler, onayları verir ve her
              içerik için <span className="text-accent font-bold">€25 katılım bedelini</span> öder.
            </p>
            <button onClick={openForm} className={primaryButtonClass}>
              Başvuruyu Tamamla
            </button>
            <p className="text-xs text-muted-foreground mt-6">
              Ödeme akışı, başvuru tamamlandıktan sonra e-posta ile iletilecektir.
            </p>
          </div>
        </div>
      </section>

      <RegisterInterestForm
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultCategory="blogger-vlogger"
        defaultReferralCode="GGVBLA-M7SDSR"
      />
    </div>
  );
};

export default BloggerContestPage;
