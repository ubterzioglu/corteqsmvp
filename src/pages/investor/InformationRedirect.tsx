import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";

import { useSeo } from "@/lib/seo";
import { INFORMATION_REDIRECTS, INVESTOR_PATH } from "@/lib/investor/investor-route";

// `/information/<slug>` → bize ait olmayan ekosistem adresi. Hedef YALNIZ sabit
// tablodan gelir; tanımsız slug yatırımcı sayfasına döner.
const InformationRedirect = () => {
  const { slug = "" } = useParams();
  const target = Object.prototype.hasOwnProperty.call(INFORMATION_REDIRECTS, slug)
    ? INFORMATION_REDIRECTS[slug]
    : null;

  useSeo({ title: "Yönlendiriliyor | CorteQS", robots: "noindex, nofollow" }, []);

  useEffect(() => {
    if (target) window.location.replace(target);
  }, [target]);

  if (!target) return <Navigate to={INVESTOR_PATH} replace />;
  return null;
};

export default InformationRedirect;
