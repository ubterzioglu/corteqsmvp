import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";

type RedirectRow = {
  slug: string;
};

type CatalogRedirectQueryClient = {
  from: (
    tableName: "catalog_items",
  ) => {
    select: (
      columns: string,
    ) => {
      eq: (
        column: string,
        value: unknown,
      ) => {
        order: (
          orderColumn: string,
          options: { ascending: boolean },
        ) => {
          limit: (
            count: number,
          ) => {
            maybeSingle: () => Promise<{
              data: RedirectRow | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
    };
  };
};

const redirectQueryClient = supabase as unknown as CatalogRedirectQueryClient;

const DirectoryProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [slug, setSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // catalog-directory.ts routes member items as /directory/profile/<slug> (e.g. "member-b82291bc...")
  // instead of a UUID. Detect this and forward straight to the catalog page.
  const isSlugParam = userId ? /^[a-z]+-[a-z0-9]+/i.test(userId) && !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) : false;

  useEffect(() => {
    if (!userId || isSlugParam) return;
    let isMounted = true;

    void (async () => {
      setIsLoading(true);
      setNotFound(false);

      const { data, error } = await redirectQueryClient
        .from("catalog_items")
        .select("slug")
        .eq("linked_user_id", userId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!isMounted) return;

      if (error || !data?.slug) {
        setNotFound(true);
        setSlug(null);
      } else {
        setSlug((data as RedirectRow).slug);
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
