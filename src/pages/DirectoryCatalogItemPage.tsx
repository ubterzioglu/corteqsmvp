import { Navigate, useParams } from "react-router-dom";

import PublicProfileNotFound from "@/components/directory/public-profile/PublicProfileNotFound";
import PublicProfileShell from "@/components/directory/public-profile/PublicProfileShell";
import PublicProfileSkeleton from "@/components/directory/public-profile/PublicProfileSkeleton";
import { usePublicCatalogProfile } from "@/hooks/usePublicCatalogProfile";

const DirectoryCatalogItemPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const profileQuery = usePublicCatalogProfile(slug);

  if (!slug) return <Navigate to="/directory" replace />;
  if (profileQuery.isLoading) return <PublicProfileSkeleton />;
  if (profileQuery.isError || !profileQuery.data) return <PublicProfileNotFound />;

  return <PublicProfileShell profile={profileQuery.data} />;
};

export default DirectoryCatalogItemPage;
