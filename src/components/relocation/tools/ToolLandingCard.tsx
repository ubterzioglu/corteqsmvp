// Araç hub kartı — bir relocation_tools satırını link kartı olarak gösterir.
// TEK varyant: mobilde de masaüstünde de aynı kart. (Eski mobil accordion varyantı
// kaldırıldı — 18 araçlık dizinde bulunabilirliği arama + kategori filtresi sağlıyor,
// içeriği katlayıp gizlemek değil.)
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toolHeroImage } from "@/lib/relocation-tools-images";
import { resultKindStyle } from "@/lib/relocation-tools-result-style";
import { cn } from "@/lib/utils";
import type { RelocationToolRow } from "@/lib/relocation-tools-types";

/** Bu indeksten öncekiler eager yüklenir — ilk ekrandaki kartlar LCP'yi geciktirmesin. */
const EAGER_IMAGE_COUNT = 3;
/** Stagger gecikmesi bu karttan sonra sabitlenir — 18. kart 0.8sn beklemesin. */
const MAX_STAGGER_STEPS = 8;
const STAGGER_STEP_MS = 45;

interface ToolLandingCardProps {
  tool: RelocationToolRow;
  /** Grid'deki sırası — görsel yükleme stratejisi ve açılış gecikmesi buradan gelir. */
  index?: number;
}

export function ToolLandingCard({ tool, index = 0 }: ToolLandingCardProps) {
  const heroImage = toolHeroImage(tool.slug);
  const { label, Icon, chipClass, ringClass, barClass } = resultKindStyle(tool.result_kind);
  const questionCount = tool.quick_question_count || tool.detailed_question_count;
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(heroImage) && !imageFailed;

  return (
    <Link
      to={`/tools/${tool.slug}`}
      className={cn(
        "group block h-full rounded-lg",
        "animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-500 motion-reduce:animate-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
      style={{ animationDelay: `${Math.min(index, MAX_STAGGER_STEPS) * STAGGER_STEP_MS}ms` }}
    >
      <Card
        className={cn(
          "relative flex h-full flex-col overflow-hidden border-border/50 shadow-sm ring-1",
          "transition-[transform,box-shadow] duration-300 ease-out",
          "group-hover:-translate-y-1.5 group-hover:shadow-glow-teal",
          "group-focus-visible:-translate-y-1.5 group-focus-visible:shadow-glow-teal",
          "motion-reduce:transform-none motion-reduce:transition-none",
          ringClass,
        )}
      >
        <div className={cn("h-1.5 w-full", barClass)} aria-hidden="true" />
        {/* Zemin markalı gradyan: lazy görsel yüklenene kadar (ve 404 olursa kalıcı olarak)
            burada düz gri bir boşluk değil, sonucun türünü anlatan renkli bir yüzey durur. */}
        <div className={cn("relative aspect-[16/9] w-full overflow-hidden", barClass)}>
          {showImage ? (
            <img
              src={heroImage}
              alt=""
              loading={index < EAGER_IMAGE_COUNT ? "eager" : "lazy"}
              decoding="async"
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center" aria-hidden="true">
              <Icon className="h-10 w-10 text-white drop-shadow" />
            </div>
          )}
          {/* Parlama süpürmesi — yalnızca hover'da, imleçsiz cihazda hiç çalışmaz. */}
          <div
            className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full motion-reduce:hidden"
            aria-hidden="true"
          />
          <Badge className={cn("absolute left-2 top-2 z-10 gap-1 border shadow-md hover:bg-white/95", chipClass)}>
            <Icon className="h-3 w-3" aria-hidden="true" />
            {label}
          </Badge>
        </div>

        <CardContent className="flex flex-1 flex-col pt-4">
          {/* Başlık görselin ÜZERİNDE beyazdı ve okunmuyordu: araç görselleri açık/pastel
              illüstrasyon, beyaz yazı zemine karışıyordu. Kartın gövdesine alındı —
              kontrast artık görselden değil kart yüzeyinden geliyor. */}
          <CardTitle className="text-base leading-snug transition-colors group-hover:text-primary">
            {tool.title_tr}
          </CardTitle>
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{tool.summary_tr}</p>

          {/* mt-auto: başlık/özet uzunlukları farklı olsa da meta satırı tüm kartlarda aynı hizada biter. */}
          <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-xs font-medium text-primary">
            <span>{questionCount > 0 ? `${questionCount} soru · birkaç dakika` : "Hemen dene"}</span>
            <ArrowUpRight
              className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
              aria-hidden="true"
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
