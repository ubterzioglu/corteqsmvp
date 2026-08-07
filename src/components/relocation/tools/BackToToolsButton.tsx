// Araç hub'ına dönüş — TEK KAYNAK.
//
// İki ayrı yerden kullanılır ve ikisi birlikte 18 aracın tamamını kapsar:
//   1. ToolResultView       → motor araçları (session/skorlama akışına giren 12 araç)
//   2. RelocationToolPage   → standalone araçlar (kendi bileşenini çizen 6 araç;
//                             bunlar ToolResultView'dan HİÇ geçmez)
// Yeni bir standalone araç eklendiğinde 2. nokta otomatik kapsar — araç sayfasına
// ayrıca buton koymak gerekmez.
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TOOLS_UI_COPY } from "@/lib/relocation-tools-copy";

export function BackToToolsButton() {
  return (
    <Button asChild variant="outline" className="h-12 w-full text-sm font-semibold">
      <Link to="/tools">
        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
        {TOOLS_UI_COPY.backToHub}
      </Link>
    </Button>
  );
}
