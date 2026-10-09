import { CircleCheck, TrendingUp } from "lucide-react";

import { HANDOVER } from "@/lib/investor/investor-content";

const HandoverGrid = () => (
  <div className="inv-grid inv-grid--2">
    {HANDOVER.map((column) => {
      const Icon = column.tone === "strong" ? CircleCheck : TrendingUp;
      return (
        <article key={column.title} className={`inv-card inv-handover inv-handover--${column.tone}`}>
          <h3 className="inv-card__title inv-handover__head">
            <Icon size={18} aria-hidden="true" />
            {column.title}
          </h3>
          <dl className="inv-handover__list">
            {column.items.map((item) => (
              <div key={item.title} className="inv-handover__item">
                <dt>{item.title}</dt>
                <dd>{item.text}</dd>
              </div>
            ))}
          </dl>
        </article>
      );
    })}
  </div>
);

export default HandoverGrid;
