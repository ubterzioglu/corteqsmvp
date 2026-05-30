import type { ReactNode } from "react";

import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import type { AppFeatureKey } from "@/lib/features";

type RequireFeatureProps = {
  feature: AppFeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
};

const RequireFeature = ({ feature, children, fallback = null }: RequireFeatureProps) => {
  const { isLoading, isFeatureEnabled } = useFeatureFlags(true);

  if (isLoading) {
    return <div className="flex min-h-[120px] items-center justify-center text-sm text-muted-foreground">Yetki yükleniyor...</div>;
  }

  if (!isFeatureEnabled(feature)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RequireFeature;
