import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gift, X, ExternalLink, Landmark, Smartphone, Coffee, Check, Copy, ChevronDown, ChevronUp, Plane, Car, Bus, UserCheck, Lock } from "lucide-react";
import WelcomePackOrderForm from "@/components/WelcomePackOrderForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface WelcomePackProps {
  userName: string;
  country: string;
  city: string;
  onDismiss: () => void;
}

const bankOptions: Record<string, { name: string; logo: string; bonus: string; link: string }[]> = {
  Almanya: [
    { name: "N26", logo: "🏦", bonus: "€30 Hoşgeldin Bonusu", link: "https://n26.com/r/referral" },
    { name: "Commerzbank", logo: "🟡", bonus: "€50 Hoşgeldin + Ücretsiz Kart", link: "https://commerzbank.de" },
    { name: "Deutsche Bank", logo: "🔵", bonus: "6 Ay Ücretsiz Hesap", link: "https://deutsche-bank.de" },
    { name: "ING", logo: "🟠", bonus: "€75 İlk Maaş Bonusu", link: "https://ing.de" },
  ],
  Hollanda: [
    { name: "ING", logo: "🟠", bonus: "€50 Hoşgeldin", link: "https://ing.nl" },
    { name: "ABN AMRO", logo: "🟢", bonus: "3 Ay Ücretsiz", link: "https://abnamro.nl" },
    { name: "Bunq", logo: "🌳", bonus: "€10 Yeşil Bonus", link: "https://bunq.com" },
  ],
  default: [
    { name: "Wise", logo: "🌍", bonus: "İlk Transfer Ücretsiz", link: "https://wise.com" },
    { name: "Revolut", logo: "💳", bonus: "Premium 1 Ay Ücretsiz", link: "https://revolut.com" },
    { name: "N26", logo: "🏦", bonus: "€30 Hoşgeldin Bonusu", link: "https://n26.com" },
  ],
};

const simOptions: Record<string, { name: string; logo: string; offer: string; couponCode: string; hasOnline: boolean; link: string }[]> = {
  Almanya: [
    { name: "Vodafone", logo: "📱", offer: "CallYa Start — %30 İndirim", couponCode: "CORTEQS30", hasOnline: true, link: "https://vodafone.de/callya" },
    { name: "O2", logo: "📶", offer: "Prepaid S — İlk Ay Ücretsiz", couponCode: "CORTEQS02", hasOnline: true, link: "https://o2online.de" },
    { name: "Aldi Talk", logo: "🛒", offer: "Starter Paket €7.99 + 5GB Bonus", couponCode: "CQSALDI5", hasOnline: false, link: "" },
  ],
  Hollanda: [
    { name: "Lebara", logo: "📱", offer: "Prepaid €10 + 5GB Bonus", couponCode: "CQSLBR5", hasOnline: true, link: "https://lebara.nl" },
    { name: "Simyo", logo: "📶", offer: "İlk Ay %50 İndirim", couponCode: "CQSSIMYO", hasOnline: true, link: "https://simyo.nl" },
  ],
  default: [
    { name: "Lycamobile", logo: "📱", offer: "Uluslararası Paket — %25 İndirim", couponCode: "CQSLYCA25", hasOnline: true, link: "https://lycamobile.com" },
    { name: "Lebara", logo: "📶", offer: "Hoşgeldin Paketi + 3GB Bonus", couponCode: "CQSLBR3", hasOnline: true, link: "https://lebara.com" },
  ],
};

const cafeGifts = [
  { id: "gift1", title: "☕ Kahve + 🥯 Simit Hediyesi", description: "CorteQS'e özel, size en yakın partnerden", code: "HOSGELDIN-KAHVE", validUntil: "Kayıt tarihinden 30 gün", redeemInfo: "QR kodunu partnerimize gösterin" },
];

const WelcomePack = ({ userName, country, city, onDismiss }: WelcomePackProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isLocked = !user;
  const [expandedSection, setExpandedSection] = useState<string | null>("flight");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const banks = bankOptions[country] || bankOptions.default;
  const sims = simOptions[country] || simOptions.default;

  const firstName = userName?.split(" ")[0] || "Kullanıcı";

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({ title: "Kod kopyalandı! 📋", description: code });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const markComplete = (step: string) => {
    setCompletedSteps(prev => prev.includes(step) ? prev.filter(s => s !== step) : [...prev, step]);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const totalSteps = 7;
  const allDone = completedSteps.length >= totalSteps;
  const progress = Math.round((completedSteps.length / totalSteps) * 100);

  return (
    <div className="relative bg-gradient-to-br from-primary/5 via-accent/10 to-turquoise/5 rounded-xl border border-primary/20 p-4 mb-6 shadow-card overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-turquoise/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      {/* Header */}
      <div className="relative flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-turquoise flex items-center justify-center text-white">
            <Gift className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-foreground">🎉 Hoş Geldin Paketi</h2>
              <Badge variant="outline" className="text-[10px] gap-1 border-amber-500/40 text-amber-600 bg-amber-500/5">
                <Lock className="h-2.5 w-2.5" /> Yakında
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Merhaba {firstName}! {city}, {country} için hazırlandı
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onDismiss}
          title="Paketi kapat"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Progress */}
      <div className="relative mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>{completedSteps.length}/{totalSteps} tamamlandı</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-turquoise rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="relative">
        <div className="space-y-2 [&_a]:pointer-events-none [&_a]:opacity-60 [&_button[data-lockable=true]]:pointer-events-none [&_button[data-lockable=true]]:opacity-60">

        {/* 1. FLIGHT DISCOUNT */}
        <div className={`bg-card rounded-xl border transition-all ${completedSteps.includes("flight") ? "border-success/40 bg-success/5" : "border-border"}`}>
          <button onClick={() => toggleSection("flight")} className="w-full flex items-center justify-between px-3 py-2.5 text-left">
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-md flex items-center justify-center ${completedSteps.includes("flight") ? "bg-success/15 text-success" : "bg-sky-500/10 text-sky-500"}`}>
                {completedSteps.includes("flight") ? <Check className="h-4 w-4" /> : <Plane className="h-4 w-4" />}
              </div>
              <div>
                <span className="font-semibold text-sm text-foreground">✈️ Uçak Bileti İndirimi</span>
                <p className="text-xs text-muted-foreground">Partner havayollarından özel fiyatlar</p>
              </div>
            </div>
            {expandedSection === "flight" ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          {expandedSection === "flight" && (
            <div className="px-3 pb-3 space-y-1.5">
              {[
                { name: "Turkish Airlines", logo: "🇹🇷", offer: "Diaspora %10 İndirim", link: "https://turkishairlines.com" },
                { name: "Pegasus", logo: "✈️", offer: "%15 Hoşgeldin İndirimi", link: "https://flypgs.com" },
                { name: "SunExpress", logo: "☀️", offer: "İlk Uçuş %20", link: "https://sunexpress.com" },
              ].map(airline => (
                <div key={airline.name} className="flex items-center gap-2.5 p-2 bg-muted/50 rounded-md hover:bg-muted transition-colors">
                  <span className="text-lg">{airline.logo}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs text-foreground">{airline.name}</p>
                    <p className="text-xs text-turquoise font-medium">{airline.offer}</p>
                  </div>
                  <a href={airline.link} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="gap-1 text-xs"><ExternalLink className="h-3 w-3" /> İncele</Button>
                  </a>
                </div>
              ))}
              <Button size="sm" variant={completedSteps.includes("flight") ? "outline" : "default"} className="w-full mt-1.5 gap-1.5 h-8 text-xs" data-lockable="true" disabled onClick={() => markComplete("flight")}>
                <Check className="h-3.5 w-3.5" /> {completedSteps.includes("flight") ? "Tamamlandı ✓" : "Bilet aldım, tamamla"}
              </Button>
            </div>
          )}
        </div>

        {/* 2. MOBILE SIM */}
        <div className={`bg-card rounded-xl border transition-all ${completedSteps.includes("sim") ? "border-success/40 bg-success/5" : "border-border"}`}>
          <button onClick={() => toggleSection("sim")} className="w-full flex items-center justify-between px-3 py-2.5 text-left">
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-md flex items-center justify-center ${completedSteps.includes("sim") ? "bg-success/15 text-success" : "bg-amber-500/10 text-amber-500"}`}>
                {completedSteps.includes("sim") ? <Check className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
              </div>
              <div>
                <span className="font-semibold text-sm text-foreground">Mobil Hat Al</span>
                <p className="text-xs text-muted-foreground">Özel kupon kodlarıyla indirimli</p>
              </div>
            </div>
            {expandedSection === "sim" ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          {expandedSection === "sim" && (
            <div className="px-3 pb-3 space-y-1.5">
              {sims.map((sim) => (
                <div key={sim.name} className="flex items-center gap-2.5 p-2 bg-muted/50 rounded-md hover:bg-muted transition-colors">
                  <span className="text-lg">{sim.logo}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs text-foreground">{sim.name}</p>
                    <p className="text-xs text-turquoise font-medium">{sim.offer}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <code className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">{sim.couponCode}</code>
                      <button onClick={() => copyCode(sim.couponCode)} className="text-muted-foreground hover:text-primary">
                        {copiedCode === sim.couponCode ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                  {sim.hasOnline ? (
                    <a href={sim.link} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="gap-1 text-xs"><ExternalLink className="h-3 w-3" /> Online Al</Button>
                    </a>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">Mağazadan Al</Badge>
                  )}
                </div>
              ))}
              <p className="text-[11px] text-muted-foreground italic">💡 Bazı operatörler yalnızca mağazadan SIM satışı yapıyor. Kupon kodunu mağazada gösterin.</p>
              <Button size="sm" variant={completedSteps.includes("sim") ? "outline" : "default"} className="w-full mt-1.5 gap-1.5 h-8 text-xs" data-lockable="true" disabled onClick={() => markComplete("sim")}>
                <Check className="h-3.5 w-3.5" /> {completedSteps.includes("sim") ? "Tamamlandı ✓" : "Hat aldım, tamamla"}
              </Button>
            </div>
          )}
        </div>

        {/* 3. AIRPORT TRANSFER */}
        <div className={`bg-card rounded-xl border transition-all ${completedSteps.includes("transfer") ? "border-success/40 bg-success/5" : "border-border"}`}>
          <button onClick={() => toggleSection("transfer")} className="w-full flex items-center justify-between px-3 py-2.5 text-left">
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-md flex items-center justify-center ${completedSteps.includes("transfer") ? "bg-success/15 text-success" : "bg-violet-500/10 text-violet-500"}`}>
                {completedSteps.includes("transfer") ? <Check className="h-4 w-4" /> : <Bus className="h-4 w-4" />}
              </div>
              <div>
                <span className="font-semibold text-sm text-foreground">🚐 Havaalanı Transferi</span>
                <p className="text-xs text-muted-foreground">Güvenli ve uygun fiyatlı transfer</p>
              </div>
            </div>
            {expandedSection === "transfer" ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          {expandedSection === "transfer" && (
            <div className="px-3 pb-3 space-y-1.5">
              {[
                { name: "GetTransfer", logo: "🚐", offer: "İlk Transfer %10 İndirim", link: "https://gettransfer.com" },
                { name: "Welcome Pickups", logo: "🤝", offer: "Hoşgeldin Paketi Özel Fiyat", link: "https://welcomepickups.com" },
              ].map(t => (
                <div key={t.name} className="flex items-center gap-2.5 p-2 bg-muted/50 rounded-md hover:bg-muted transition-colors">
                  <span className="text-lg">{t.logo}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs text-foreground">{t.name}</p>
                    <p className="text-xs text-turquoise font-medium">{t.offer}</p>
                  </div>
                  <a href={t.link} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="gap-1 text-xs"><ExternalLink className="h-3 w-3" /> İncele</Button>
                  </a>
                </div>
              ))}
              <Button size="sm" variant={completedSteps.includes("transfer") ? "outline" : "default"} className="w-full mt-1.5 gap-1.5 h-8 text-xs" data-lockable="true" disabled onClick={() => markComplete("transfer")}>
                <Check className="h-3.5 w-3.5" /> {completedSteps.includes("transfer") ? "Tamamlandı ✓" : "Transfer ayarladım, tamamla"}
              </Button>
            </div>
          )}
        </div>

        {/* 4. CAR RENTAL */}
        <div className={`bg-card rounded-xl border transition-all ${completedSteps.includes("car") ? "border-success/40 bg-success/5" : "border-border"}`}>
          <button onClick={() => toggleSection("car")} className="w-full flex items-center justify-between px-3 py-2.5 text-left">
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-md flex items-center justify-center ${completedSteps.includes("car") ? "bg-success/15 text-success" : "bg-emerald-500/10 text-emerald-500"}`}>
                {completedSteps.includes("car") ? <Check className="h-4 w-4" /> : <Car className="h-4 w-4" />}
              </div>
              <div>
                <span className="font-semibold text-sm text-foreground">🚗 Araç Kiralama</span>
                <p className="text-xs text-muted-foreground">İndirimli araç kiralama seçenekleri</p>
              </div>
            </div>
            {expandedSection === "car" ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          {expandedSection === "car" && (
            <div className="px-3 pb-3 space-y-1.5">
              {[
                { name: "Sixt", logo: "🚗", offer: "%15 Hoşgeldin İndirimi", link: "https://sixt.com" },
                { name: "Europcar", logo: "🚙", offer: "3 Gün Kirala 2 Öde", link: "https://europcar.com" },
                { name: "Enterprise", logo: "🏎️", offer: "İlk Kiralama %20", link: "https://enterprise.com" },
              ].map(car => (
                <div key={car.name} className="flex items-center gap-2.5 p-2 bg-muted/50 rounded-md hover:bg-muted transition-colors">
                  <span className="text-lg">{car.logo}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs text-foreground">{car.name}</p>
                    <p className="text-xs text-turquoise font-medium">{car.offer}</p>
                  </div>
                  <a href={car.link} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="gap-1 text-xs"><ExternalLink className="h-3 w-3" /> İncele</Button>
                  </a>
                </div>
              ))}
              <Button size="sm" variant={completedSteps.includes("car") ? "outline" : "default"} className="w-full mt-1.5 gap-1.5 h-8 text-xs" data-lockable="true" disabled onClick={() => markComplete("car")}>
                <Check className="h-3.5 w-3.5" /> {completedSteps.includes("car") ? "Tamamlandı ✓" : "Araç kiraladım, tamamla"}
              </Button>
            </div>
          )}
        </div>

        {/* 5. BANK */}
        <div className={`bg-card rounded-xl border transition-all ${completedSteps.includes("bank") ? "border-success/40 bg-success/5" : "border-border"}`}>
          <button onClick={() => toggleSection("bank")} className="w-full flex items-center justify-between px-3 py-2.5 text-left">
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-md flex items-center justify-center ${completedSteps.includes("bank") ? "bg-success/15 text-success" : "bg-primary/10 text-primary"}`}>
                {completedSteps.includes("bank") ? <Check className="h-4 w-4" /> : <Landmark className="h-4 w-4" />}
              </div>
              <div>
                <span className="font-semibold text-sm text-foreground">Banka Hesabı Aç</span>
                <p className="text-xs text-muted-foreground">Özel hoşgeldin bonuslarıyla</p>
              </div>
            </div>
            {expandedSection === "bank" ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          {expandedSection === "bank" && (
            <div className="px-3 pb-3 space-y-1.5">
              {banks.map((bank) => (
                <div key={bank.name} className="flex items-center gap-2.5 p-2 bg-muted/50 rounded-md hover:bg-muted transition-colors">
                  <span className="text-lg">{bank.logo}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs text-foreground">{bank.name}</p>
                    <p className="text-xs text-turquoise font-medium">{bank.bonus}</p>
                  </div>
                  <a href={bank.link} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="gap-1 text-xs"><ExternalLink className="h-3 w-3" /> Başvur</Button>
                  </a>
                </div>
              ))}
              <Button size="sm" variant={completedSteps.includes("bank") ? "outline" : "default"} className="w-full mt-1.5 gap-1.5 h-8 text-xs" data-lockable="true" disabled onClick={() => markComplete("bank")}>
                <Check className="h-3.5 w-3.5" /> {completedSteps.includes("bank") ? "Tamamlandı ✓" : "Banka seçtim, tamamla"}
              </Button>
            </div>
          )}
        </div>

        {/* 6. MENTOR */}
        <div className={`bg-card rounded-xl border transition-all ${completedSteps.includes("mentor") ? "border-success/40 bg-success/5" : "border-border"}`}>
          <button onClick={() => toggleSection("mentor")} className="w-full flex items-center justify-between px-3 py-2.5 text-left">
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-md flex items-center justify-center ${completedSteps.includes("mentor") ? "bg-success/15 text-success" : "bg-indigo-500/10 text-indigo-500"}`}>
                {completedSteps.includes("mentor") ? <Check className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
              </div>
              <div>
                <span className="font-semibold text-sm text-foreground">🧭 Relokasyon Mentörü</span>
                <p className="text-xs text-muted-foreground">Ücretli veya gönüllü rehberlik</p>
              </div>
            </div>
            {expandedSection === "mentor" ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          {expandedSection === "mentor" && (
            <div className="px-3 pb-3 space-y-1.5">
              {[
                { name: "Ücretli Mentör", logo: "💼", desc: "Profesyonel danışman eşliğinde adım adım taşınma rehberliği", type: "paid" },
                { name: "Gönüllü Mentör", logo: "🤝", desc: "Deneyimli diaspora üyelerinden ücretsiz destek", type: "volunteer" },
              ].map(m => (
                <div key={m.type} className="flex items-start gap-2.5 p-2 bg-muted/50 rounded-md hover:bg-muted transition-colors">
                  <span className="text-2xl mt-0.5">{m.logo}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                </div>
              ))}
              <p className="text-[11px] text-muted-foreground italic">💡 Hoşgeldin Paketi oluşturduğunuzda mentör tercihinizi belirtebilirsiniz.</p>
              <Button size="sm" variant={completedSteps.includes("mentor") ? "outline" : "default"} className="w-full mt-1.5 gap-1.5 h-8 text-xs" data-lockable="true" disabled onClick={() => markComplete("mentor")}>
                <Check className="h-3.5 w-3.5" /> {completedSteps.includes("mentor") ? "Tamamlandı ✓" : "Mentör seçtim, tamamla"}
              </Button>
            </div>
          )}
        </div>

        {/* 7. CAFE GIFT (last) */}
        <div className={`bg-card rounded-xl border transition-all ${completedSteps.includes("cafe") ? "border-success/40 bg-success/5" : "border-border"}`}>
          <button onClick={() => toggleSection("cafe")} className="w-full flex items-center justify-between px-3 py-2.5 text-left">
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-md flex items-center justify-center ${completedSteps.includes("cafe") ? "bg-success/15 text-success" : "bg-rose-500/10 text-rose-500"}`}>
                {completedSteps.includes("cafe") ? <Check className="h-4 w-4" /> : <Coffee className="h-4 w-4" />}
              </div>
              <div>
                <span className="font-semibold text-sm text-foreground">☕ Kahve + 🥯 Simit Hediyesi</span>
                <p className="text-xs text-muted-foreground">CorteQS'ten size özel ikram</p>
              </div>
            </div>
            {expandedSection === "cafe" ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          {expandedSection === "cafe" && (
            <div className="px-4 pb-4">
              {cafeGifts.map((gift) => (
                <div key={gift.id} className="p-4 bg-gradient-to-br from-amber-50/50 to-rose-50/50 dark:from-amber-500/5 dark:to-rose-500/5 rounded-lg border border-amber-200/30 dark:border-amber-500/20">
                  <p className="font-semibold text-foreground mb-1">{gift.title}</p>
                  <p className="text-xs text-muted-foreground mb-3">{gift.description}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-lg font-mono font-bold">{gift.code}</code>
                    <button onClick={() => copyCode(gift.code)} className="text-muted-foreground hover:text-primary">
                      {copiedCode === gift.code ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">⏰ Geçerlilik: {gift.validUntil}</p>
                  <p className="text-[11px] text-muted-foreground">📱 {gift.redeemInfo}</p>
                </div>
              ))}
              <Button size="sm" variant={completedSteps.includes("cafe") ? "outline" : "default"} className="w-full mt-3 gap-1.5" data-lockable="true" disabled onClick={() => markComplete("cafe")}>
                <Check className="h-3.5 w-3.5" /> {completedSteps.includes("cafe") ? "Kullanıldı ✓" : "Hediyemi kullandım"}
              </Button>
            </div>
          )}
        </div>
        </div>
      </div>

      {allDone && (
        <div className="relative mt-4 p-4 bg-success/10 rounded-xl border border-success/30 text-center">
          <p className="text-sm font-semibold text-success mb-2">🎉 Tebrikler! Tüm adımları tamamladınız!</p>
          <Button size="sm" variant="outline" onClick={onDismiss} className="gap-1.5">
            <X className="h-3.5 w-3.5" /> Paketi Kaldır
          </Button>
        </div>
      )}
    </div>
  );
};

export default WelcomePack;
