import { useState } from "react";
import { Briefcase, Building2, ChevronDown, Landmark, User, Mic, Users } from "lucide-react";
import RegisterInterestForm from "./RegisterInterestForm";
import heroNetworkLight from "@/assets/hero-network-light.jpg";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const categories = [
  {
    icon: Briefcase,
    title: "Danışmanlar",
    desc: "Vergi, emlak, vize, iş kurma, kariyer, doktorlar ve daha birçok alanda uzman profesyoneller ağı.",
    defaultCategory: "danisman",
  },
  {
    icon: Building2,
    title: "İşletmeler & Şirketler",
    desc: "Diasporadaki Türk işletmeleri, şirketleri ve girişimcileri — marketler, klinikler, restoranlar, kafeler, butikler, ajanslar, kuaförler, atölyeler, turizm ofisleri ve daha fazlasını keşfedin, iş birliği yapın.",
    defaultCategory: "isletme",
  },
  {
    icon: Landmark,
    title: "Kuruluşlar",
    desc: "Dernekler, vakıflar, radyo ve TV kuruluşları. Topluluk yapılarına katılın veya kaydedin.",
    defaultCategory: "dernek",
  },
  {
    icon: Mic,
    title: "Blogger & Vlogger",
    desc: "Diaspora hikayelerini anlatan içerik üreticileri ağına katılın, sesinizi duyurun.",
    defaultCategory: "blogger-vlogger",
  },
  {
    icon: Users,
    title: "Şehir Elçisi / City Business Partner",
    desc: "Şehrinde diaspora ağını temsil et, yerel iş partneri ol. VIP olduğunda sabit gelir.",
    defaultCategory: "sehir-elcisi",
  },
  {
    icon: User,
    title: "Bireysel Kullanıcı",
    desc: "Platform hizmetlerinden faydalanmak isteyen bireyler için. Danışman bulun, etkinliklere katılın.",
    defaultCategory: "bireysel",
  },
];

const CategoriesSection = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [isOpen, setIsOpen] = useState(false);

  const openForm = (category: string) => {
    setSelectedCategory(category);
    setFormOpen(true);
  };

  return (
    <section id="kategoriler" className="py-14 lg:py-20 bg-card relative overflow-hidden">
      <div
        className="absolute inset-0 bg-center bg-cover bg-no-repeat opacity-[0.31]"
        style={{ backgroundImage: `url(${heroNetworkLight})` }}
      />
      <div className="container mx-auto px-4 relative z-10">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="overflow-hidden rounded-2xl border border-white/50 bg-card/80 shadow-xl shadow-primary/10 backdrop-blur-sm">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-white/20 md:px-8 md:py-6"
                aria-expanded={isOpen}
              >
                <div className="min-w-0">
                  <span className="text-primary font-semibold text-sm uppercase tracking-wider">Kategoriler</span>
                  <h2 className="mt-3 mb-3 text-2xl font-bold text-foreground md:text-4xl">
                    Corteqs'de Yerinizi Belirleyin
                  </h2>
                  <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                    Kategorinize tıklayın, platform açıldığında ilk siz haberdar olun.
                  </p>
                </div>
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-background/80 text-primary transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                >
                  <ChevronDown className="h-5 w-5" />
                </span>
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden border-t border-white/50">
              <div className="p-6 md:p-8">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.map((cat) => (
                    <div
                      key={cat.title}
                      className="group flex h-full flex-col rounded-2xl border border-white/50 bg-background/90 p-8 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-lg"
                    >
                      <div className="mb-5 flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <cat.icon className="h-7 w-7 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold leading-snug text-foreground">{cat.title}</h3>
                      </div>
                      <p className="mb-6 flex-1 text-sm leading-relaxed text-muted-foreground">{cat.desc}</p>
                      <button
                        onClick={() => openForm(cat.defaultCategory)}
                        className="mt-auto w-full rounded-xl bg-primary/10 py-3 text-sm font-semibold text-primary transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
                      >
                        Kayıt Bırak / Takip Et
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-12 text-center">
                  <p className="text-muted-foreground text-sm">
                    İletişim: <a href="mailto:info@corteqs.net" className="text-primary hover:underline">info@corteqs.net</a>
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>

      <RegisterInterestForm
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultCategory={selectedCategory}
      />
    </section>
  );
};

export default CategoriesSection;
