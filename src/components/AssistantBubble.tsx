import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { useAuth } from "@/components/auth/useAuth";
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

// A10 — Karşılama ipucu balonu: ~2 sn sonra gösterilir, oturum başına bir kez.
// Panel OTOMATİK AÇILMAZ — yalnız küçük bir ipucu balonu gösterilir.
// sessionStorage try/catch: bazı tarayıcılarda gizli modda storage devre dışı.
const WELCOME_SHOWN_KEY = "corteqs_assistant_welcome_shown";
const HINT_DELAY_MS = 2000;
const HINT_AUTO_CLOSE_MS = 5000; // İpucu 5 sn sonra otomatik kapanır

const AssistantBubble = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // A10: Oturum başına bir kez ipucu gösterimi (~2 sn sonra).
  useEffect(() => {
    try {
      if (sessionStorage.getItem(WELCOME_SHOWN_KEY)) return;
    } catch {
      // sessionStorage erişilemezse sessizce çık (gizli mod, storage devre dışı)
      return;
    }

    const showTimer = setTimeout(() => {
      setShowHint(true);
      try {
        sessionStorage.setItem(WELCOME_SHOWN_KEY, "1");
      } catch {
        // Yazma başarısız olsa bile sessizce devam et
      }
    }, HINT_DELAY_MS);

    return () => clearTimeout(showTimer);
  }, []);

  // A10: İpucu 5 sn sonra otomatik kapanır.
  useEffect(() => {
    if (!showHint) return;

    const hideTimer = setTimeout(() => {
      setShowHint(false);
    }, HINT_AUTO_CLOSE_MS);

    return () => clearTimeout(hideTimer);
  }, [showHint]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleBubbleClick = () => {
    setShowHint(false); // İpucu gizlenir
    setOpen((value) => !value);
  };

  const handleHintClick = () => {
    setShowHint(false);
    setOpen(true);
  };

  return (
    <>
      {/* A10: İpucu balonu */}
      {showHint && !open && (
        <button
          type="button"
          onClick={handleHintClick}
          data-testid="assistant-hint"
          className="fixed z-40 max-w-[min(70vw,16rem)] rounded-2xl bg-card border border-border shadow-lg px-4 py-3 text-sm text-foreground transition-all duration-300 opacity-100 scale-100 hover:shadow-xl cursor-pointer text-left"
          style={{ right: RIGHT, bottom: `calc(${BUBBLE_BOTTOM} + 4.5rem)` }}
        >
          {user
            ? "Platform hakkında soracakların olursa buradayım! 👋"
            : "Giriş yap, sorularını yanıtlayayım"}
        </button>
      )}

      <button
        type="button"
        onClick={handleBubbleClick}
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
        <img
          src="/lmaskog.png"
          alt=""
          aria-hidden="true"
          className="h-full w-full rounded-full object-cover"
        />
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
