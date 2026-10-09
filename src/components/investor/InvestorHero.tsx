import { motion } from "framer-motion";

import { HERO, HERO_METRICS } from "@/lib/investor/investor-content";
import MetricTile from "./MetricTile";

const InvestorHero = () => (
  <section id="kapak" className="inv-hero">
    <div className="inv-container">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <span className="inv-kicker inv-mono">{HERO.kicker}</span>
        <h1 className="inv-hero__title">{HERO.title}</h1>
        <p className="inv-hero__lead">{HERO.lead}</p>
      </motion.div>
      <div className="inv-kpis">
        {HERO_METRICS.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.08 }}
          >
            <MetricTile metric={metric} tone="navy" />
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default InvestorHero;
