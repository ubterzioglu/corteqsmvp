import { MODULE_STATUS_LABEL, MODULES } from "@/lib/investor/investor-content";

const FeatureGrid = () => (
  <div className="inv-grid inv-grid--3">
    {MODULES.map((module) => (
      <article key={module.key} className="inv-card">
        <div className="inv-card__head">
          <h3 className="inv-card__title">{module.title}</h3>
          <span className={`inv-pill inv-pill--${module.status}`}>{MODULE_STATUS_LABEL[module.status]}</span>
        </div>
        <p className="inv-card__text">{module.summary}</p>
        <ul className="inv-list">
          {module.highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>
    ))}
  </div>
);

export default FeatureGrid;
