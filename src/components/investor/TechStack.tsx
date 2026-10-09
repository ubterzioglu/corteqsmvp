import { STACK } from "@/lib/investor/investor-content";

const TechStack = () => (
  <div className="inv-grid inv-grid--3">
    {STACK.map((layer) => (
      <article key={layer.title} className="inv-card">
        <h3 className="inv-card__title" style={{ marginBottom: 10 }}>
          {layer.title}
        </h3>
        {layer.items.map((item) => (
          <div key={item.name} className="inv-stack__item">
            <div>
              <div className="inv-stack__name">{item.name}</div>
              <div className="inv-stack__role">{item.role}</div>
            </div>
            {item.version ? <span className="inv-stack__ver inv-mono">v{item.version}</span> : null}
          </div>
        ))}
      </article>
    ))}
  </div>
);

export default TechStack;
