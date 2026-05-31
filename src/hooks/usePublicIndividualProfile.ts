import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  buildFallbackIndividualProfileDetails,
  mapIndividualProfileRow,
  type IndividualProfileDetailsCore,
} from "@/lib/individual-profile";

const PROFILE_DETAILS_SELECT = [
  "user_id",
  "tagline",
  "status_text",
  "presence_status",
  "visibility_status",
  "follower_count",
  "following_count",
  "event_count",
  "active_city",
  "active_country",
  "hometown",
  "phone_verified",
  "job_seeking",
  "mentor_opt_in",
  "front_card",
  "detail_card",
  "control_panel",
  "profile_settings",
].join(", ");

export const usePublicIndividualProfile = (targetUserId: string | undefined) => {
  const { isLoading: isAuthLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [details, setDetails] = useState<IndividualProfileDetailsCore | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!targetUserId) {
      setDetails(null);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    void (async () => {
      setIsLoading(true);
      setErrorMessage(null);

      const [
        { data: profileData, error: profileError },
        { data: detailsData, error: detailsError },
      ] = await Promise.all([
        supabase
          .from("user_profiles")
          .select("full_name, email")
          .eq("user_id", targetUserId)
          .maybeSingle(),
        supabase
          .from("individual_profile_details")
          .select(PROFILE_DETAILS_SELECT)
          .eq("user_id", targetUserId)
          .maybeSingle(),
      ]);

      if (!isMounted) return;

      if (detailsError || profileError) {
        setErrorMessage(
          detailsError?.message ?? profileError?.message ?? "Profil verisi yuklenemedi.",
        );
        setDetails(null);
        setIsLoading(false);
        return;
      }

      if (!detailsData) {
        setDetails(null);
        setIsLoading(false);
        return;
      }

      const displayName =
        typeof profileData?.full_name === "string" && profileData.full_name.trim()
          ? profileData.full_name
          : "CorteQS Üyesi";
      const email =
        typeof profileData?.email === "string" && profileData.email.trim()
          ? profileData.email
          : "-";

      const fallback = buildFallbackIndividualProfileDetails({
        userId: targetUserId,
        displayName,
        email,
      });

      setDetails(mapIndividualProfileRow(detailsData, fallback));
      setIsLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [isAuthLoading, targetUserId]);

  return { isLoading: isLoading || isAuthLoading, errorMessage, details };
};
