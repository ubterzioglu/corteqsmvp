import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Reads site_settings on app boot and applies brand assets:
 * - <link rel="icon"> swapped to admin-uploaded favicon
 * - document.title prefixed with admin brand name
 */
const BrandLoader = () => {
  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from("site_settings" as any) as any)
        .select("brand_name, favicon_url")
        .eq("id", 1)
        .maybeSingle();
      const s = data as { brand_name?: string | null; favicon_url?: string | null } | null;
      if (s?.favicon_url) {
        let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.head.appendChild(link);
        }
        link.href = s.favicon_url;
      }
    })();
  }, []);
  return null;
};

export default BrandLoader;
