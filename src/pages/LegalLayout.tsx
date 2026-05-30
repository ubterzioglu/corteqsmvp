import { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";
import { ShieldCheck, FileText, Cookie, Scale } from "lucide-react";

const navLinks = [
  { to: "/legal/privacy", label: "Gizlilik Politikası", icon: ShieldCheck },
  { to: "/legal/terms", label: "Kullanım Şartları", icon: FileText },
  { to: "/legal/kvkk", label: "KVKK / GDPR / CCPA", icon: Scale },
  { to: "/legal/cookies", label: "Çerez Politikası", icon: Cookie },
];

const LegalLayout = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2">{title}</h1>
        <p className="text-xs text-muted-foreground mb-6">
          Son güncelleme: 2 Mayıs 2026 · Yürürlük tarihi: 2 Mayıs 2026
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
          <aside className="space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </aside>
          <article className="prose prose-sm max-w-none text-foreground space-y-4 leading-relaxed [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-1 [&_p]:text-sm [&_p]:text-muted-foreground [&_li]:text-sm [&_li]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-primary [&_a]:underline">
            {children}
          </article>
        </div>
      </div>
    </main>
  </div>
);

export default LegalLayout;
