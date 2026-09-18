import { MessageSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { messagingHeroImage } from "@/lib/whatsapp-landing-presentation";

export function AddCommunityHero() {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-[radial-gradient(circle_at_top_left,#f1fbf8_0%,#f7fafc_45%,#ffffff_100%)] shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,185,129,0.06),transparent_45%,rgba(14,165,233,0.08))]" />
      <div className="relative">
        <img
          src={messagingHeroImage}
          alt="Türk diaspora topluluklarını temsil eden mesajlaşma grupları görseli"
          className="h-[24rem] w-full object-cover md:h-[30rem]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.97)_0%,rgba(255,255,255,0.92)_22%,rgba(255,255,255,0.72)_40%,rgba(255,255,255,0.34)_58%,rgba(255,255,255,0.08)_72%,rgba(255,255,255,0)_82%)]" />
        <div className="absolute inset-y-0 left-0 flex w-full items-center p-6 md:w-[52%] md:p-10">
          <div className="max-w-full text-slate-950">
            <h1 className="flex items-start gap-3 text-[1.9rem] font-black tracking-tight md:text-[3rem]">
              <MessageSquare className="mt-1 h-7 w-7 shrink-0 text-emerald-600 md:h-9 md:w-9" />
              <span className="flex flex-col leading-[0.95]">
                <span className="bg-[linear-gradient(90deg,#059669_0%,#06b6d4_30%,#2563eb_65%)] bg-clip-text text-transparent drop-shadow-[0_3px_14px_rgba(255,255,255,0.52)]">
                  WhatsApp
                </span>
                <span className="bg-[linear-gradient(90deg,#2563eb_0%,#7c3aed_45%,#f97316_100%)] bg-clip-text text-transparent drop-shadow-[0_3px_14px_rgba(255,255,255,0.52)]">
                  Grupları
                </span>
              </span>
            </h1>
            <div className="mt-4 flex max-w-[28rem] flex-wrap gap-2">
              <Badge className="flex h-9 items-center justify-center border border-emerald-200/70 bg-white/88 px-4 text-center text-sm font-semibold text-emerald-700 shadow-sm backdrop-blur-sm">
                Şehir Grupları
              </Badge>
              <Badge className="flex h-9 items-center justify-center border border-sky-200/70 bg-white/88 px-4 text-center text-sm font-semibold text-sky-700 shadow-sm backdrop-blur-sm">
                Meslek Grupları
              </Badge>
              <Badge className="flex h-9 items-center justify-center border border-indigo-200/70 bg-white/88 px-4 text-center text-sm font-semibold text-indigo-700 shadow-sm backdrop-blur-sm">
                Alumni Grupları
              </Badge>
              <Badge className="flex h-9 items-center justify-center border border-orange-200/70 bg-white/88 px-4 text-center text-sm font-semibold text-orange-700 shadow-sm backdrop-blur-sm">
                Dayanışma
              </Badge>
            </div>
            <div className="mt-5 space-y-2">
              <p className="text-[1.05rem] font-semibold text-slate-900 md:text-[1.22rem] md:whitespace-nowrap">
                Dünyadaki Türk WhatsApp gruplarını keşfet.
              </p>
              <p className="text-[1.05rem] font-bold text-slate-950 md:text-[1.22rem] md:whitespace-nowrap">
                Sana uygun gruba doğrudan katıl!
              </p>
              <p className="text-[1.05rem] font-bold text-slate-950 md:text-[1.22rem] md:whitespace-nowrap">
                Kendi grubunu ücretsiz ekle.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
