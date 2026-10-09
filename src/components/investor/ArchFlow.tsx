import type { ArchTile } from "@/lib/investor/architecture-content";

type Tone = "light" | "navy" | "plain";

interface ArchFlowProps {
  steps: readonly (ArchTile & { readonly tone?: Tone })[];
  label: string;
  /** "row": yan yana adımlar (dar ekranda alt alta) · "column": dikey akış. */
  direction?: "row" | "column";
}

/** Oklarla bağlı adım dizisi. Ok yalnız görseldir; sıra listeden okunur. */
const ArchFlow = ({ steps, label, direction = "row" }: ArchFlowProps) => (
  <ol className={`arch-flow arch-flow--${direction}`} aria-label={label}>
    {steps.map((step, index) => (
      <li key={step.title} className="arch-flow__item">
        {index > 0 ? (
          <span className="arch-flow__arrow" aria-hidden="true">
            {direction === "row" ? "→" : "↓"}
          </span>
        ) : null}
        <div className={`arch-box arch-box--${step.tone ?? (index === steps.length - 1 ? "navy" : "soft")}`}>
          <div className="arch-box__title">{step.title}</div>
          <div className="arch-box__text">{step.text}</div>
        </div>
      </li>
    ))}
  </ol>
);

export default ArchFlow;
