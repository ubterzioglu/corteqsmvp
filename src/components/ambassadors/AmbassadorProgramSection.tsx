/**
 * Şehir Elçisi Programı tanıtımı — sorumluluklar, kazanımlar, öncelikli şehirler.
 * İçerik `city-ambassador-program.ts`'te (statik, bileşenden ayrı).
 */

import {
  Award,
  Calendar,
  DollarSign,
  Globe,
  Handshake,
  MapPin,
  Megaphone,
  Network,
  Rocket,
  Target,
  type LucideIcon,
} from "lucide-react";
import {
  AMBASSADOR_BENEFITS,
  AMBASSADOR_RESPONSIBILITIES,
  PRIORITY_CITIES,
  type ProgramItem,
} from "@/lib/city-ambassador-program";

/** Veri dosyası yalnız anahtar taşır; ikon nesneleri burada eşlenir. */
const ICONS: Record<string, LucideIcon> = {
  network: Network,
  megaphone: Megaphone,
  rocket: Rocket,
  calendar: Calendar,
  target: Target,
  handshake: Handshake,
  revenue: DollarSign,
  award: Award,
  globe: Globe,
};

const ItemGrid = ({ items }: { items: readonly ProgramItem[] }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {items.map((item) => {
      // Bilinmeyen anahtarda ikon çizilmemesi sessiz kusur olur; Globe'a düşer.
      const Icon = ICONS[item.iconKey] ?? Globe;
      return (
        <div
          key={item.title}
          className="rounded-2xl border border-border bg-card p-5 shadow-card"
        >
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 className="font-bold text-foreground">{item.title}</h3>
          <p className="mt-1.5 font-body text-sm leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        </div>
      );
    })}
  </div>
);

const AmbassadorProgramSection = () => {
  return (
    <section className="mt-16 border-t border-border pt-12">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold text-foreground">
          Şehrinde Elçi Olmak İster misin?
        </h2>
        <p className="mt-3 font-body text-base leading-relaxed text-muted-foreground">
          Güçlü bir yerel ağın varsa, insanları bir araya getirmeyi seviyorsan ve şehrinde
          kalıcı bir etki bırakmak istiyorsan — bu rol sana uygun. Gönüllülük değil, gelir
          paylaşımlı bir ortaklık.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {PRIORITY_CITIES.map((city) => (
          <span
            key={city}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground shadow-sm"
          >
            <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> {city}
          </span>
        ))}
      </div>
      <p className="mt-3 text-center font-body text-xs text-muted-foreground">
        Öncelikli şehirler bunlar, ama <strong>tüm şehirlerden</strong> başvuru kabul ediyoruz.
      </p>

      <h3 className="mb-4 mt-12 text-xl font-bold text-foreground">Ne yapacaksın?</h3>
      <ItemGrid items={AMBASSADOR_RESPONSIBILITIES} />

      <h3 className="mb-4 mt-10 text-xl font-bold text-foreground">Ne kazanacaksın?</h3>
      <ItemGrid items={AMBASSADOR_BENEFITS} />
    </section>
  );
};

export default AmbassadorProgramSection;
