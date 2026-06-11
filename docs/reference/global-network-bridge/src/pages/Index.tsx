import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import DiasporaSearchBar from "@/components/DiasporaSearchBar";
import ConsultantCategories from "@/components/ConsultantCategories";
import FeaturedConsultants from "@/components/FeaturedConsultants";
import FeaturedEvents from "@/components/FeaturedEvents";
import AssociationsSection from "@/components/AssociationsSection";
import BusinessesSection from "@/components/BusinessesSection";
import Footer from "@/components/Footer";
import SectionErrorBoundary from "@/components/SectionErrorBoundary";
import RotatingProfilesShowcase from "@/components/RotatingProfilesShowcase";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <SectionErrorBoundary sectionName="DiasporaSearchBar">
        <DiasporaSearchBar />
      </SectionErrorBoundary>
      <ConsultantCategories />
      <FeaturedConsultants />
      <SectionErrorBoundary sectionName="RotatingProfilesShowcase">
        <RotatingProfilesShowcase />
      </SectionErrorBoundary>
      <AssociationsSection />
      <BusinessesSection />
      <FeaturedEvents />
      <Footer />
    </div>
  );
};

export default Index;
