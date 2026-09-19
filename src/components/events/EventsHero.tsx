import { Calendar } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function EventsHero() {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-violet-100 bg-[radial-gradient(circle_at_top_left,#f5f3ff_0%,#fafafa_45%,#ffffff_100%)] shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(139,92,246,0.06),transparent_45%,rgba(59,130,246,0.08))]" />
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=400&fit=crop"
          alt="Türk diaspora etkinliklerini temsil eden görsel"
          className="h-[24rem] w-full object-cover md:h-[30rem]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.97)_0%,rgba(255,255,255,0.92)_22%,rgba(255,255,255,0.72)_40%,rgba(255,255,255,0.34)_58%,rgba(255,255,255,0.08)_72%,rgba(255,255,255,0)_82%)]" />
        <div className="absolute inset-y-0 left-0 flex w-full items-center p-6 md:w-[52%] md:p-10">
          <div className="max-w-full text-slate-950">
            <h1 className="flex items-start gap-3 text-[1.9rem] font-black tracking-tight md:text-[3rem]">
              <Calendar className="mt-1 h-7 w-7 shrink-0 text-violet-600 md:h-9 md:w-9" />
              <span className="flex flex-col leading-[0.95]">
                <span className="bg-[linear-gradient(90deg,#7c3aed_0%,#3b82f6_30%,#06b6d4_65%)] bg-clip-text text-transparent drop-shadow-[0_3px_14px_rgba(255,255,255,0.52)]">
                  Diaspora
                </span>
                <span className="bg-[linear-gradient(90deg,#3b82f6_0%,#8b5cf6_45%,#ec4899_100%)] bg-clip-text text-transparent drop-shadow-[0_3px_14px_rgba(255,255,255,0.52)]">
                  Etkinlikleri
                </span>
              </span>
            </h1>
            <div className="mt-4 flex max-w-[28rem] flex-wrap gap-2">
              <Badge className="flex h-9 items-center justify-center border border-violet-200/70 bg-white/88 px-4 text-center text-sm font-semibold text-violet-700 shadow-sm backdrop-blur-sm">
                Networking
              </Badge>
              <Badge className="flex h-9 items-center justify-center border border-blue-200/70 bg-white/88 px-4 text-center text-sm font-semibold text-blue-700 shadow-sm backdrop-blur-sm">
                Eğitim
              </Badge>
              <Badge className="flex h-9 items-center justify-center border border-indigo-200/70 bg-white/88 px-4 text-center text-sm font-semibold text-indigo-700 shadow-sm backdrop-blur-sm">
                Kültür & Sanat
              </Badge>
              <Badge className="flex h-9 items-center justify-center border border-rose-200/70 bg-white/88 px-4 text-center text-sm font-semibold text-rose-700 shadow-sm backdrop-blur-sm">
                Sosyal
              </Badge>
            </div>
            <div className="mt-5 space-y-2">
              <p className="text-[1.05rem] font-semibold text-slate-900 md:text-[1.22rem] md:whitespace-nowrap">
                Dünyadaki Türk diaspora etkinliklerini keşfet.
              </p>
              <p className="text-[1.05rem] font-bold text-slate-950 md:text-[1.22rem] md:whitespace-nowrap">
                Sana uygun etkinliğe katıl!
              </p>
              <p className="text-[1.05rem] font-bold text-slate-950 md:text-[1.22rem] md:whitespace-nowrap">
                Kendi etkinliğini ücretsiz oluştur.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
