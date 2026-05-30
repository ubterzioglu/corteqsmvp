import { cn } from "@/lib/utils";

type FloatingDotSize = "sm" | "md" | "lg";
type FloatingDotColor = "blue" | "green" | "orange" | "yellow";
type FloatingDotVariant = "float" | "slow" | "drift";

interface FloatingDotProps {
  size: FloatingDotSize;
  color: FloatingDotColor;
  variant: FloatingDotVariant;
  delay: number;
  className?: string;
}

const sizeClasses: Record<FloatingDotSize, string> = {
  sm: "h-3 w-3 md:h-4 md:w-4",
  md: "h-6 w-6 md:h-8 md:w-8",
  lg: "h-10 w-10 md:h-14 md:w-14",
};

const colorClasses: Record<FloatingDotColor, string> = {
  blue: "bg-sky-400/28",
  green: "bg-emerald-400/24",
  orange: "bg-orange-400/24",
  yellow: "bg-amber-300/24",
};

const variantClasses: Record<FloatingDotVariant, string> = {
  float: "animate-floating-dot",
  slow: "animate-floating-dot-slow",
  drift: "animate-floating-dot-drift",
};

const FloatingDot = ({ size, color, variant, delay, className }: FloatingDotProps) => {
  return (
    <span
      className={cn(
        "absolute rounded-full blur-[10px] will-change-transform",
        sizeClasses[size],
        colorClasses[color],
        variantClasses[variant],
        className,
      )}
      style={{ animationDelay: `${delay}s` }}
      aria-hidden="true"
    />
  );
};

export default FloatingDot;
