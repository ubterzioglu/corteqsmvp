import type { InvestorMetric } from "@/lib/investor/investor-content";

interface MetricTileProps {
  metric: InvestorMetric;
  tone?: "navy" | "light";
}

const MetricTile = ({ metric, tone = "light" }: MetricTileProps) => (
  <div className={tone === "light" ? "inv-kpi inv-kpi--light" : "inv-kpi"}>
    <div className="inv-kpi__value inv-mono">{metric.value}</div>
    <div className="inv-kpi__label">{metric.label}</div>
    {metric.hint ? <div className="inv-kpi__hint">{metric.hint}</div> : null}
  </div>
);

export default MetricTile;
