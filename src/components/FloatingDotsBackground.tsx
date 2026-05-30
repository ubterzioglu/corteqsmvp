import FloatingDot from "@/components/FloatingDot";

const FloatingDotsBackground = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(246,252,251,0.9)_0%,rgba(255,249,245,0.82)_48%,rgba(248,252,250,0.9)_100%)]" />

      <FloatingDot size="lg" color="blue" variant="float" delay={0.2} className="left-[6%] top-[8%]" />
      <FloatingDot size="md" color="green" variant="drift" delay={1.1} className="left-[18%] top-[26%]" />
      <FloatingDot size="sm" color="yellow" variant="slow" delay={0.8} className="left-[34%] top-[14%]" />
      <FloatingDot size="lg" color="orange" variant="slow" delay={1.6} className="left-[76%] top-[10%]" />
      <FloatingDot size="md" color="blue" variant="drift" delay={0.4} className="right-[10%] top-[28%]" />
      <FloatingDot size="sm" color="green" variant="float" delay={1.9} className="right-[24%] top-[38%]" />
      <FloatingDot size="lg" color="yellow" variant="drift" delay={0.9} className="left-[10%] top-[58%]" />
      <FloatingDot size="md" color="orange" variant="float" delay={1.3} className="left-[30%] top-[68%]" />
      <FloatingDot size="sm" color="blue" variant="slow" delay={0.1} className="left-[48%] top-[56%]" />
      <FloatingDot size="md" color="green" variant="drift" delay={2.1} className="right-[18%] top-[62%]" />
      <FloatingDot size="lg" color="orange" variant="float" delay={1.5} className="right-[8%] top-[78%]" />
      <FloatingDot size="sm" color="yellow" variant="slow" delay={2.4} className="left-[62%] top-[82%]" />
    </div>
  );
};

export default FloatingDotsBackground;
