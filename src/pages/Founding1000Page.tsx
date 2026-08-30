import { useMemo } from "react";
import { useLocation } from "react-router-dom";

import Founding1000Section from "@/components/Founding1000Section";
import { PAGE_SEO } from "@/lib/page-seo";
import { readReferralCodeFromSearch } from "@/lib/referral-qr";
import { useSeo } from "@/lib/seo";

const Founding1000Page = () => {
  const location = useLocation();
  const referralCode = useMemo(() => readReferralCodeFromSearch(location.search), [location.search]);
  useSeo(PAGE_SEO.founding1000, []);

  return (
    <div className="min-h-screen bg-background">
      <main id="main">
        <Founding1000Section defaultReferralCode={referralCode} />
      </main>
    </div>
  );
};

export default Founding1000Page;
