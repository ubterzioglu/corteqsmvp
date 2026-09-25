import { Outlet } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import FooterSection from "@/components/FooterSection";
import RouteErrorBoundary from "@/components/RouteErrorBoundary";
import { ToolResultReturnBar } from "@/components/relocation/tools/ToolResultReturnBar";

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      {/* Araç sonucundan CTA ile ayrılmış kullanıcıya "sonuca dön" şeridi
          (revizyon 0838da0b). CTA hedeflerinin hepsi bu layout'un altında olduğu için
          tek bağlanma noktası yeter. İz yoksa hiçbir şey render etmez — diğer tüm
          sayfalar birebir aynı kalır. */}
      <ToolResultReturnBar />
      <div className="flex-1">
        {/* Yalnız sayfa gövdesi sınırlıdır: bir sayfa çökerse header/footer ve menü
            erişilebilir kalır, navigasyonla (location.key) sınır sıfırlanır. */}
        <RouteErrorBoundary sectionName="PublicRoute">
          <Outlet />
        </RouteErrorBoundary>
      </div>
      <FooterSection />
    </div>
  );
}
