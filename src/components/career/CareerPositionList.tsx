import { useEffect, useMemo, useState } from "react";

import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { CAREER_AREAS, CAREER_JOBS } from "@/lib/careers/careers-data";
import type { CareerAreaId } from "@/lib/careers/careers-types";

import { positionAnchorId } from "./career-anchors";
import CareerPositionCard from "./CareerPositionCard";

type CareerPositionListProps = {
  onApply: (positionId: string) => void;
};

const ALL = "tumu" as const;
type FilterValue = typeof ALL | CareerAreaId;

/** `#ilan-<id>` çapasından ilan kimliğini okur. */
function positionFromHash(hash: string): string | null {
  const match = hash.match(/^#ilan-([a-z0-9-]+)$/i);
  if (!match) return null;
  return CAREER_JOBS.some((job) => job.id === match[1]) ? match[1] : null;
}

export function CareerPositionList({ onApply }: CareerPositionListProps) {
  const [filter, setFilter] = useState<FilterValue>(ALL);
  const [openItems, setOpenItems] = useState<string[]>([]);

  const areaLabels = useMemo(
    () => new Map(CAREER_AREAS.map((area) => [area.id, area.label] as const)),
    [],
  );

  const visible = useMemo(
    () => (filter === ALL ? CAREER_JOBS : CAREER_JOBS.filter((job) => job.area === filter)),
    [filter],
  );

  // Derin bağlantı: `#ilan-<id>` ile gelindiğinde filtre temizlenir, ilan açılır
  // ve görünüme kaydırılır. ⚠️ Filtre temizlenmezse ilan seçili alanın dışında
  // kalır ve bağlantı sessizce boş bir listeye düşer.
  //
  // ⚠️ `hashchange` DE dinlenir. Yalnız mount'ta bakmak yetmez: SPA'da kullanıcı
  // zaten `/kariyer` sayfasındayken bir `#ilan-…` bağlantısına tıklarsa bileşen
  // yeniden MOUNT OLMAZ, etki hiç çalışmaz ve bağlantı sessizce ölür. (Mutasyon
  // turunda yakalandı: mount-only sürümde `setFilter(ALL)` satırı silindiğinde
  // hiçbir test düşmüyordu — çünkü mount anında filtre zaten `ALL`'du, yani o
  // satır fiilen ölü koddu.)
  useEffect(() => {
    const openFromHash = () => {
      const target = positionFromHash(window.location.hash);
      if (!target) return;

      setFilter(ALL);
      setOpenItems((current) => (current.includes(target) ? current : [...current, target]));
      window.requestAnimationFrame(() => {
        document.getElementById(positionAnchorId(target))?.scrollIntoView({ block: "start" });
      });
    };

    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  return (
    <section id="pozisyonlar" className="mx-auto max-w-5xl scroll-mt-24 px-4 py-16">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl font-bold sm:text-3xl">Açık pozisyonlar</h2>
        <p className="text-sm text-muted-foreground">
          {visible.length} pozisyon{filter === ALL ? "" : ` · ${areaLabels.get(filter)}`}
        </p>
      </div>

      <div role="group" aria-label="Alana göre filtrele" className="mt-6 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={filter === ALL ? "default" : "outline"}
          onClick={() => setFilter(ALL)}
          aria-pressed={filter === ALL}
        >
          Tümü
        </Button>
        {CAREER_AREAS.map((area) => (
          <Button
            key={area.id}
            size="sm"
            variant={filter === area.id ? "default" : "outline"}
            onClick={() => setFilter(area.id)}
            aria-pressed={filter === area.id}
          >
            {area.label}
          </Button>
        ))}
      </div>

      <Accordion
        type="multiple"
        value={openItems}
        onValueChange={setOpenItems}
        className="mt-6 space-y-3"
      >
        {visible.map((job) => (
          <CareerPositionCard
            key={job.id}
            job={job}
            areaLabel={areaLabels.get(job.area) ?? ""}
            onApply={onApply}
          />
        ))}
      </Accordion>
    </section>
  );
}

export default CareerPositionList;
