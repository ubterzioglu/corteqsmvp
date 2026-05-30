import { Link } from "react-router-dom";
import { LayoutDashboard, Shield, User, Building2, Briefcase, Mic, Flag, Megaphone, CreditCard } from "lucide-react";
import Navbar from "@/components/Navbar";

const dashboards = [
  { to: "/profile?view=individual&tab=transactions", title: "İşlemlerim (Stripe)", desc: "Stripe üzerinden tahsilat ve harcama izleri. Stripe Ready.", icon: CreditCard },
  { to: "/profile?view=individual", title: "Kullanıcı Profili / Dashboard", desc: "Son kullanıcı için kişisel dashboard.", icon: User },
  { to: "/profile?view=admin", title: "Admin Dashboard", desc: "Platform yönetimi, kayıtlar, gelir takibi.", icon: Shield },
  { to: "/profile?view=ambassador", title: "City Ambassadors", desc: "Şehir elçileri programı paneli.", icon: Flag },
  { to: "/profile?view=business", title: "Businesses", desc: "İşletme listeleme ve yönetim.", icon: Building2 },
  { to: "/profile?view=consultant", title: "Consultants", desc: "Danışman dashboard'u.", icon: Briefcase },
  { to: "/profile?view=blogger", title: "Bloggers / Vloggers", desc: "İçerik üretici paneli.", icon: Mic },
  { to: "/profile?view=association", title: "Associations", desc: "Kuruluş ve dernek yönetimi.", icon: Megaphone },
];

const Dashboards = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center gap-3 mb-2">
            <LayoutDashboard className="h-7 w-7 text-turquoise" />
            <h1 className="text-3xl md:text-4xl font-extrabold">Dashboards (Geliştirici Erişimi)</h1>
          </div>
          <p className="text-muted-foreground mb-10 max-w-2xl">
            Bu sayfa menüden gizlidir. Tüm rol bazlı dashboard'lara hızlı erişim için kullanılır.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboards.map((d) => (
              <Link
                key={d.to}
                to={d.to}
                className="group rounded-2xl border border-border bg-card p-5 hover:border-turquoise/40 hover:shadow-card transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-turquoise/10 border border-turquoise/20 flex items-center justify-center mb-3">
                  <d.icon className="h-5 w-5 text-turquoise" />
                </div>
                <h2 className="font-bold mb-1">{d.title}</h2>
                <p className="text-sm text-muted-foreground">{d.desc}</p>
                <p className="text-xs text-turquoise mt-3 font-mono">{d.to}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboards;
