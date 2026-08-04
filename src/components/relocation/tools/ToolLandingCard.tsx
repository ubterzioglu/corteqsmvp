// Araç hub kartı — bir relocation_tools satırını link kartı olarak gösterir.
import { Link } from "react-router-dom";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toolHeroImage } from "@/lib/relocation-tools-images";
import { resultKindStyle } from "@/lib/relocation-tools-result-style";
import { cn } from "@/lib/utils";
import type { RelocationToolRow } from "@/lib/relocation-tools-types";

interface ToolLandingCardProps {
  tool: RelocationToolRow;
}

export function ToolLandingCard({ tool }: ToolLandingCardProps) {
  const heroImage = toolHeroImage(tool.slug);
  const { label, Icon, chipClass, ringClass, barClass } = resultKindStyle(tool.result_kind);
  const questionCount = tool.quick_question_count || tool.detailed_question_count;

  return (
    <Link to={`/tools/${tool.slug}`} className="group block h-full">
      <Card
        className={cn(
          "relative flex h-full flex-col overflow-hidden border-border/50 ring-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-teal",
          ringClass,
        )}
      >
        <div className={cn("h-1.5 w-full", barClass)} aria-hidden="true" />
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
          {heroImage && (
            <img
              src={heroImage}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          {/* Başlık görselin üstünden alındığı için ağır karartma da kalktı: tek işi beyaz
              yazıyı okutmaktı, altında yazı yokken görselin altını lekeliyordu. Üstteki
              rozetler bu gradyana zaten dayanmıyordu (gradyanın üst ucu şeffaftı). */}
          <div
            className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
            aria-hidden="true"
          />
          <Badge className={cn("absolute left-2 top-2 z-10 gap-1 border shadow-md hover:bg-white/95", chipClass)}>
            <Icon className="h-3 w-3" aria-hidden="true" />
            {label}
          </Badge>
          <Badge className="absolute right-2 top-2 z-10 rotate-2 border border-white/50 bg-emerald-500 text-white shadow-lg hover:bg-emerald-500">
            🎉 Ücretsiz
          </Badge>
        </div>
        <CardContent className="flex flex-1 flex-col pt-4">
          {/* Başlık görselin ÜZERİNDE beyazdı ve okunmuyordu: araç görselleri açık/pastel
              illüstrasyon, beyaz yazı zemine karışıyordu. Kartın gövdesine alındı —
              kontrast artık görselden değil kart yüzeyinden geliyor. */}
          <CardTitle className="text-base leading-snug transition-colors group-hover:text-primary">
            {tool.title_tr}
          </CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">{tool.summary_tr}</p>
          {questionCount > 0 && (
            // mt-auto: başlık uzunlukları farklı olsa da meta satırı tüm kartlarda aynı hizada biter.
            <p className="mt-auto pt-3 text-xs font-medium text-primary">{questionCount} soru · birkaç dakika</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
