import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";


type CorteqsWhatIsAccordionProps = {
  className?: string;
};

const CorteqsWhatIsAccordion = ({ className }: CorteqsWhatIsAccordionProps) => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={`group relative inline-flex w-full items-center justify-center rounded-[1.25rem] border border-[#c94f1f] bg-[linear-gradient(135deg,#ee652b_0%,#d95520_100%)] px-5 py-4 text-center text-base font-normal text-white shadow-[0_16px_34px_rgba(238,101,43,0.34),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:saturate-110 sm:text-[1.05rem] ${className ?? ""}`}
        >
          <span
            className="pointer-events-none absolute inset-0 rounded-[1.25rem] opacity-100"
            aria-hidden
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 42%, rgba(255,255,255,0) 100%)",
            }}
          />
          <span className="relative z-10">
            CorteQS Nedir?
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm overflow-hidden rounded-[2rem] border border-[#f1d7ad] bg-[linear-gradient(145deg,#fffdf8_0%,#fff7e8_40%,#ffffff_100%)] p-0 shadow-[0_36px_120px_-42px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col items-center px-6 pb-7 pt-6">
          {/* Başlık */}
          <DialogTitle className="inline-flex items-center gap-2 text-xl font-black text-[#153a5b]">
            <Sparkles className="h-5 w-5 text-[#f59e0b]" />
            CorteQS nedir?
          </DialogTitle>

          {/* Video daire içinde */}
          <div className="relative mt-5 flex items-center justify-center">
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.18)_0%,rgba(15,118,110,0.12)_50%,rgba(255,255,255,0)_74%)] blur-2xl"
            />
            <div className="relative h-52 w-52 overflow-hidden rounded-full border-4 border-white shadow-[0_20px_50px_-16px_rgba(37,99,235,0.38),0_8px_24px_-10px_rgba(15,118,110,0.28)]">
              <video
                src="/whatmaskot.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Açıklama */}
          <DialogDescription className="mt-5 text-center text-sm leading-relaxed text-slate-700 sm:text-base">
            CorteQS, dünyanın farklı şehirlerinde yaşayan Türkleri birbirine bağlayan bir platformdur.
            İnsanlar burada toplulukları bulur, yeni bağlantılar kurar ve iş, destek veya işbirliği
            fırsatlarına ulaşır.
          </DialogDescription>

          {/* Alt butonlar */}
          <div className="mt-6 flex w-full gap-3">
            <Link
              to="/login?mode=signup"
              className="inline-flex flex-1 min-h-[48px] items-center justify-center rounded-xl border border-[#2f6fda] bg-[linear-gradient(135deg,#4285F4_0%,#3B78E7_100%)] px-4 text-sm font-bold text-white shadow-[0_16px_34px_rgba(66,133,244,0.34),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:saturate-110"
            >
              Kayıt ol!
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setTimeout(() => {
                  const el = document.getElementById("kaydol");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 150);
              }}
              className="inline-flex flex-1 min-h-[48px] items-center justify-center rounded-xl border border-[#34A853]/60 bg-[linear-gradient(135deg,#34A853_0%,#2F9B4D_100%)] px-4 text-sm font-bold text-white shadow-[0_16px_34px_rgba(52,168,83,0.34),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:saturate-110"
            >
              Bilgi al!
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CorteqsWhatIsAccordion;
