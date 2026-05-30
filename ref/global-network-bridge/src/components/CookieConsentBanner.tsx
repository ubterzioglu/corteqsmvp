import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "corteqs.cookie.consent.v1";

type Choice = "accepted" | "rejected" | "essential";

const CookieConsentBanner = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  const decide = (choice: Choice) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ choice, ts: new Date().toISOString() }),
      );
    } catch {
      /* no-op */
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed bottom-0 inset-x-0 z-[60] p-3 sm:p-4"
    >
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card/95 backdrop-blur shadow-2xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Cookie className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              🍪 Çerez Kullanımı / Cookie Notice
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Sitemizi kullanarak deneyiminizi geliştirmek için zorunlu, analitik ve
              pazarlama çerezlerini kullanıyoruz. KVKK, GDPR, CCPA, PIPEDA ve APP'lere
              uygun olarak tercihinizi belirleyebilirsiniz. Detay için{" "}
              <Link to="/legal/cookies" className="underline text-primary">
                Çerez Politikası
              </Link>
              .
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button size="sm" onClick={() => decide("accepted")}>
                Tümünü Kabul Et
              </Button>
              <Button size="sm" variant="outline" onClick={() => decide("essential")}>
                Sadece Zorunlu
              </Button>
              <Button size="sm" variant="ghost" onClick={() => decide("rejected")}>
                Reddet
              </Button>
            </div>
          </div>
          <button
            onClick={() => decide("essential")}
            aria-label="Kapat"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
