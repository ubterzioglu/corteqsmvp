import { Outlet } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import FooterSection from "@/components/FooterSection";

export default function PublicLayout() {
  return (
    <>
      <SiteHeader />
      <Outlet />
      <FooterSection />
    </>
  );
}
