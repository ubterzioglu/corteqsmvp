import { useEffect, useState } from "react";
import { Bot, X } from "lucide-react";

import ChatBot from "@/components/chat/ChatBot";

// A12a — 29.09 kullanıcı kararı: asistan HER sayfada yüzen balon olarak durur
// (eski "bölümü PublicLayout'a taşı" tarifi ölçümle çürütülmüştü: ChatBot tam
// boy bir sayfa bölümüdür, 54 rotanın altına yapıştırmak regresyondu).
//
// Yazma kapısı ZATEN ÇİFT KATMANLI: ChatBot girişsiz kullanıcıya istek
// GÖNDERMEZ (GUEST_MESSAGE gösterir) ve site-assistant edge function'ı anonim
// çağrıyı 401 ile reddeder. Balon bu yüzden herkese açık durabilir.
//
// Konum: ScrollTopButton'ın ÜSTÜ. Oradaki bottom değerini değiştirirsen
// BURADAKİ iki calc'i de güncelle (balon = +3.75rem, panel = +7.75rem).
const RIGHT = "max(0.75rem, calc(env(safe-area-inset-right) + 0.35rem))";
const BASE_BOTTOM = "max(0.75rem, calc(env(safe-area-inset-bottom) + 0.75rem))";
const BUBBLE_BOTTOM = `calc(${BASE_BOTTOM} + 3.75rem)`;
const PANEL_BOTTOM = `calc(${BASE_BOTTOM} + 7.75rem)`;

const AssistantBubble = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Bilgi asistanını kapat" : "Bilgi asistanını aç"}
        aria-expanded={open}
        data-testid="assistant-bubble"
        className={[
          "fixed z-50 flex h-14 w-14 items-center justify-center rounded-full",
          "bg-primary text-primary-foreground shadow-[0_18px_40px_rgba(18,95,150,0.35)]",
          "transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2",
        ].join(" ")}
        style={{ right: RIGHT, bottom: BUBBLE_BOTTOM }}
      >
        <Bot className="h-6 w-6" />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="CorteQS bilgi asistanı"
          data-testid="assistant-panel"
          className="fixed z-50 w-[min(92vw,26rem)] overflow-y-auto rounded-3xl"
          style={{ right: RIGHT, bottom: PANEL_BOTTOM, maxHeight: "min(64vh, 560px)" }}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Asistan penceresini kapat"
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          {/* sectionId=null: ana sayfadaki #kaydol çıpasıyla ÇAKIŞMASIN. */}
          <ChatBot shellVariant="plain" showIntro={false} sectionId={null} compact />
        </div>
      ) : null}
    </>
  );
};

export default AssistantBubble;
