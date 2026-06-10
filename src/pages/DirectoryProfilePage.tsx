import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";

import { resolveCatalogSlugForLinkedUser } from "@/lib/public-catalog-profile-api";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Legacy compatibility route: `/directory/profile/:userId`.
 * Never renders a profile itself — resolves the param (slug or UUID) and
 * redirects to the canonical `/directory/catalog/:slug` URL.
 */
const DirectoryProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [slug, setSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // catalog-directory.ts routes member items as /directory/profile/<slug>
  // (e.g. "member-b82291bc...") instead of a UUID. Detect this and forward
  // straight to the catalog page.
  const isSlugParam = userId
    ? /^[a-z]+-[a-z0-9]+/i.test(userId) && !UUID_PATTERN.test(userId)
    : false;

  useEffect(() => {
    if (!userId || isSlugParam) return;
    let isMounted = true;

    void (async () => {
      setIsLoading(true);
      setNotFound(false);

      const resolvedSlug = await resolveCatalogSlugForLinkedUser(userId);

      if (!isMounted) return;

      if (resolvedSlug) {
        setSlug(resolvedSlug);
      } else {
        setNotFound(true);
        setSlug(null);
      }

      setIsLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [userId, isSlugParam]);

  if (!userId) {
    return <Navigate to="/directory" replace />;
  }

  // Param is already a catalog slug (member-xxx, isletme-xxx, etc.) — redirect directly
  if (isSlugParam) {
    return <Navigate to={`/directory/catalog/${userId}`} replace />;
  }

  if (slug) {
    return <Navigate to={`/directory/catalog/${slug}`} replace />;
  }

  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground">Profil yönlendiriliyor...</div>;
  }

  if (notFound) {
    return <Navigate to="/directory" replace />;
  }

  return null;
};

export default DirectoryProfilePage;
