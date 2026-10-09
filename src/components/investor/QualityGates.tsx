import { Check } from "lucide-react";

import { QUALITY_GATES } from "@/lib/investor/investor-content";

const QualityGates = () => (
  <div className="inv-gates">
    {QUALITY_GATES.map((gate) => (
      <div key={gate} className="inv-gate">
        <span className="inv-gate__mark" aria-hidden="true">
          <Check size={14} strokeWidth={2.5} />
        </span>
        <span>{gate}</span>
      </div>
    ))}
  </div>
);

export default QualityGates;
