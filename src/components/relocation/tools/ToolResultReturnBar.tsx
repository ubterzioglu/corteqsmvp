// Araç sonucuna dönüş şeridi (revizyon 0838da0b).
//
// PublicLayout'ta TEK KEZ bağlanır. CTA hedeflerinin hepsi (/tools, /directory,
// /profile, /cadde, /relocation) o layout'un altında olduğu için hedef sayfalara
// tek tek buton koymak gerekmez — yeni bir CTA hedefi eklendiğinde de otomatik kapsanır
// (aynı "tek darboğaz" mantığı `BackToToolsButton` yorumunda da anlatılıyor).
//
// İz yoksa HİÇBİR ŞEY render etmez: şerit yalnız bir testten CTA ile ayrılmış
// kullanıcıya görünür, sitenin geri kalanına hiçbir kutu eklemez.
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";

import {
  forgetToolResult,
  readToolResultReturn,
  type ToolResultReturn,
} from "@/lib/relocation-result-return";

export function ToolResultReturnBar() {
  const { pathname } = useLocation();
  const [entry, setEntry] = useState<ToolResultReturn | null>(null);

  // Her rota değişiminde yeniden okunur: kullanıcı hedef sayfada derinleştikçe
  // (ör. /cadde → /cadde/carsi/:id) şerit taşınır, ama sonuca dönünce kaybolur.
  useEffect(() => {
    setEntry(readToolResultReturn(pathname));
  }, [pathname]);

  const dismiss = useCallback(() => {
    forgetToolResult();
    setEntry(null);
  }, []);

  if (!entry) return null;

  const label = entry.toolLabel ? `${entry.toolLabel} sonucuna dön` : "Test sonucuna dön";

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="container mx-auto flex items-center gap-3 px-4 py-2">
        <Link
          to={entry.href}
          onClick={dismiss}
          className="inline-flex min-h-9 flex-1 items-center gap-2 text-sm font-medium text-amber-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{label}</span>
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dönüş şeridini kapat"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-amber-800 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
