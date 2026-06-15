import { useEffect, useState } from "react";
import { Layers, Network, Users } from "lucide-react";
import { getTotalDirectoryCount } from "@/lib/catalog-directory";
import Reveal from "@/components/motion/Reveal";
import CountUp from "@/components/motion/CountUp";

/**
 * Sosyal kanıt bandı — yalnızca DB'den doğrulanan rakamı gösterir.
 *
 * Tek güvenilir kaynak `getTotalDirectoryCount()` (catalog_items COUNT). Rakam
 * henüz yüklenmediyse veya 0/hata dönerse uydurma bir sayı GÖSTERMEYİZ; bunun
 * yerine yalnızca sabit-doğru bilgiyi ("80+ kategori", "Açık beta") gösteririz.
 */
const SocialProofBar = () => {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    void getTotalDirectoryCount()
      .then((value) => {
        if (active) setCount(value);
      })
      .catch(() => {
        if (active) setCount(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const hasCount = count !== null && count > 0;

  return (
    <section className="relative py-6" aria-label="CorteQS topluluğu">
      <div className="container mx-auto px-4">
        <Reveal className="glass-tech mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-3 rounded-2xl px-5 py-4 text-center sm:gap-6">
          {hasCount ? (
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="text-sm font-bold text-foreground sm:text-base">
                <CountUp to={count} />+ kayıtlı profil
              </span>
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-accent" aria-hidden="true" />
            <span className="text-sm font-bold text-foreground sm:text-base">80+ kategori</span>
          </div>

          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-[#34A853]" aria-hidden="true" />
            <span className="text-sm font-bold text-foreground sm:text-base">Açık beta yayında</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default SocialProofBar;
