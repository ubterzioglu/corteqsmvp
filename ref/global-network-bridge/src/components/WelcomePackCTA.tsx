import { useState, useEffect } from "react";
import { Gift, X, MessageCircle, Bot, ChevronDown, Pencil, Plane, Car, Bus } from "lucide-react";
import { Button } from "@/components/ui/button";
import WelcomePack from "@/components/profiles/WelcomePack";
import WelcomePackOrderForm from "@/components/WelcomePackOrderForm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface WelcomePackCTAProps {
  userName: string;
  country: string;
  city: string;
}

const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/corteqs";
const WHATSAPP_BOT_URL = "https://wa.me/4915123456789?text=Merhaba%20CorteQS%20Bot";

const WelcomePackCTA = ({ userName, country, city }: WelcomePackCTAProps) => {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hasOrder, setHasOrder] = useState(false);
  const [orderSummary, setOrderSummary] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("welcome_pack_orders")
      .select("id, city, country, arrival_date, adults, children, needs_flight_discount, needs_car_rental, needs_airport_transfer, needs_mentor")
      .eq("user_id", user.id)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setHasOrder(true);
          const o = data[0];
          const needs = [
            o.needs_flight_discount && "✈️",
            o.needs_car_rental && "🚗",
            o.needs_airport_transfer && "🚐",
            o.needs_mentor && "🧭",
          ].filter(Boolean).join(" ");
          setOrderSummary(`${o.city}, ${o.country} • ${new Date(o.arrival_date).toLocaleDateString("tr-TR")} • ${o.adults}Y+${o.children}Ç ${needs}`);
        }
      });
  }, [user]);

  if (dismissed) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-40">
      {/* Thin CTA bar */}
      <div className="bg-gradient-to-r from-primary/90 via-primary to-turquoise/80 text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-10 gap-2">
            {/* Left: Welcome Pack toggle */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
            >
              <Gift className="h-4 w-4" />
              <span className="hidden sm:inline">
                {hasOrder ? "📦 Hoşgeldin Paketim" : "🎉 Hoş Geldin Paketi"}
              </span>
              <span className="sm:hidden">{hasOrder ? "📦 Paketim" : "🎉 Paket"}</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>

            {/* Center: Order summary or action buttons */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-center min-w-0">
              {hasOrder && orderSummary ? (
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-xs truncate max-w-[200px] sm:max-w-none opacity-90">{orderSummary}</span>
                  <WelcomePackOrderForm
                    defaultCountry={country}
                    defaultCity={city}
                    onSuccess={() => { setHasOrder(true); window.location.reload(); }}
                    trigger={
                      <button className="flex items-center gap-1 text-[10px] bg-white/15 hover:bg-white/25 rounded-full px-2 py-0.5 transition-colors shrink-0">
                        <Pencil className="h-2.5 w-2.5" /> Düzenle
                      </button>
                    }
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <WelcomePackOrderForm
                    defaultCountry={country}
                    defaultCity={city}
                    onSuccess={() => { setHasOrder(true); window.location.reload(); }}
                    trigger={
                      <button className="flex items-center gap-1.5 text-xs sm:text-sm font-medium bg-white/20 hover:bg-white/30 rounded-full px-3 py-1 transition-colors">
                        <Gift className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Paket Oluştur</span>
                        <span className="sm:hidden">Oluştur</span>
                      </button>
                    }
                  />
                </div>
              )}
            </div>

            {/* Right: WhatsApp + Dismiss */}
            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={WHATSAPP_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] sm:text-xs bg-white/15 hover:bg-white/25 rounded-full px-2 py-1 transition-colors"
              >
                <MessageCircle className="h-3 w-3" />
                <span className="hidden sm:inline">Kanal</span>
              </a>
              <a
                href={WHATSAPP_BOT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] sm:text-xs bg-white/15 hover:bg-white/25 rounded-full px-2 py-1 transition-colors"
              >
                <Bot className="h-3 w-3" />
                <span className="hidden sm:inline">Bot</span>
              </a>
              <button
                onClick={() => setDismissed(true)}
                className="p-1 hover:bg-white/15 rounded-full transition-colors"
                title="Kapat"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Welcome Pack */}
      {expanded && (
        <div className="bg-background/95 backdrop-blur-lg border-b border-border shadow-xl max-h-[70vh] overflow-y-auto">
          <div className="container mx-auto px-4 py-4">
            <WelcomePack
              userName={userName}
              country={country}
              city={city}
              onDismiss={() => { setExpanded(false); setDismissed(true); }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WelcomePackCTA;
