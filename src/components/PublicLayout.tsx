import { Outlet } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import FooterSection from "@/components/FooterSection";

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex-1">
        <Outlet />
      </div>
      <FooterSection />
    </div>
  );
}
