// Canlı bütçe göstergesi — cost_total / hard_cap oranı.
import { Progress } from "@/components/ui/progress";
import { budgetPercent, formatUsd } from "@/lib/service-finder-format";
import { cn } from "@/lib/utils";

interface ServiceFinderBudgetMeterProps {
  costTotalUsd: number | string;
  softCapUsd: number | string;
  hardCapUsd: number | string;
  className?: string;
}

export function ServiceFinderBudgetMeter({
  costTotalUsd,
  softCapUsd,
  hardCapUsd,
  className,
}: ServiceFinderBudgetMeterProps) {
  const percent = budgetPercent(costTotalUsd, hardCapUsd);
  const overSoft = Number(costTotalUsd) >= Number(softCapUsd);
  const overHard = Number(costTotalUsd) >= Number(hardCapUsd);

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {formatUsd(costTotalUsd)} / {formatUsd(hardCapUsd)}
        </span>
        <span className={cn(overHard && "font-semibold text-red-600", !overHard && overSoft && "font-medium text-orange-600")}>
          %{percent}
        </span>
      </div>
      <Progress
        value={percent}
        className={cn("h-2", overHard ? "[&>div]:bg-red-500" : overSoft ? "[&>div]:bg-orange-500" : "")}
      />
      <p className="text-[11px] text-muted-foreground">
        Soft cap: {formatUsd(softCapUsd)}
        {overSoft && !overHard && " — ucuz mod etkin"}
        {overHard && " — hard cap aşıldı"}
      </p>
    </div>
  );
}
