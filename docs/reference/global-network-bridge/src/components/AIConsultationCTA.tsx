import { Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  /** Visual variant: 'card' = compact card button; 'panel' = panel/profile-page CTA */
  variant?: "card" | "panel";
  label?: string;
  className?: string;
  /** Optional context name for the toast (e.g. consultant name) */
  contextName?: string;
}

/**
 * Re-usable "AI Görüşme" CTA. Currently shows a "yakında" toast describing
 * the preparation phase (RAG, membership tier, data processing, testing).
 */
export const showAIComingSoonToast = (
  toast: ReturnType<typeof useToast>["toast"],
  contextName?: string
) => {
  toast({
    title: "🤖 AI Görüşme — Yakında",
    description:
      (contextName ? `${contextName} için ` : "") +
      "AI Görüşme özelliği şu an hazırlık aşamasında: RAG altyapısı, üyelik paketi başvurusu, veri işleme ve test süreçleri tamamlandıktan sonra aktif edilecek. Hazır olduğunda burada açılır.",
  });
};

const AIConsultationCTA = ({ variant = "card", label, className, contextName }: Props) => {
  const { toast } = useToast();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showAIComingSoonToast(toast, contextName);
  };

  if (variant === "panel") {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn("gap-2 relative border-primary/30 text-primary hover:bg-primary/5", className)}
        onClick={handleClick}
      >
        <Bot className="h-4 w-4" />
        {label ?? "AI Görüşme"}
        <span className="ml-1 inline-flex items-center gap-0.5 text-[10px] bg-primary/10 text-primary rounded-full px-1.5 py-0.5">
          <Sparkles className="h-2.5 w-2.5" /> Yakında
        </span>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("w-full gap-1 text-[11px] px-1.5 relative", className)}
      onClick={handleClick}
    >
      <Bot className="h-3 w-3" />
      {label ?? "AI Görüşme"}
      <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[8px] px-1 py-0.5 rounded-full">
        Yakında
      </span>
    </Button>
  );
};

export default AIConsultationCTA;
