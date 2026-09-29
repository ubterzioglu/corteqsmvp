import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

// 29.09 kullanıcı kararı: yuvarlak · turuncu arka plan · beyaz yukarı ok · "UP"
// yazısı YOK. Asistan balonu (AssistantBubble) bu düğmenin ÜSTÜNDE konumlanır;
// dikey yerleşimi değiştirirken buradaki bottom değerini de güncelle.
const ScrollTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 320);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Yukarı çık"
      data-testid="scroll-top-button"
      className={[
        "fixed z-50 flex h-11 w-11 items-center justify-center rounded-full sm:h-12 sm:w-12",
        "bg-[#f97316] text-white shadow-[0_18px_40px_rgba(249,115,22,0.35)]",
        "transition-all duration-300 hover:-translate-y-1 hover:scale-[1.05] hover:bg-[#ea580c]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2",
        isVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      ].join(" ")}
      style={{
        right: "max(0.75rem, calc(env(safe-area-inset-right) + 0.35rem))",
        bottom: "max(0.75rem, calc(env(safe-area-inset-bottom) + 0.75rem))",
      }}
    >
      <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
    </button>
  );
};

export default ScrollTopButton;
