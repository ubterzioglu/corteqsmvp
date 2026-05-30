import { Sparkles } from "lucide-react";

interface DemoBadgeProps {
  variant?: "card" | "page";
  label?: string;
}

/**
 * Üst kenara yapışık ince DEMO bandı.
 * - card: kart üzerinde
 * - page: detay sayfasında geniş
 */
const DemoBadge = ({ variant = "card", label }: DemoBadgeProps) => {
  const text =
    label ||
    (variant === "page"
      ? "DEMO – Bu sayfa örnek içeriktir. Gerçek profiller yakında."
      : "DEMO – Örnek Kart");

  return (
    <div
      className={`absolute top-0 left-0 right-0 z-10 flex items-center justify-center gap-1.5 ${
        variant === "page" ? "py-1.5 text-xs" : "py-1 text-[10px]"
      } font-semibold uppercase tracking-wider bg-gold/90 text-foreground border-b border-gold rounded-t-2xl pointer-events-none`}
    >
      <Sparkles className={variant === "page" ? "h-3.5 w-3.5" : "h-3 w-3"} />
      <span>{text}</span>
    </div>
  );
};

export default DemoBadge;
