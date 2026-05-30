import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  buildFallbackIndividualProfileDetails,
  mapIndividualProfileRow,
  type IndividualProfileDetailsCore,
  type IndividualProfileUpdateInput,
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

export const useIndividualProfileDetails = (enabled = true) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [details, setDetails] = useState<IndividualProfileDetailsCore | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  const displayName = useMemo(() => {
    const fullName = user?.user_metadata?.full_name;
    const name = user?.user_metadata?.name;
    return fullName || name || "CorteQS Üyesi";
  }, [user?.user_metadata?.full_name, user?.user_metadata?.name]);

  const email = user?.email ?? "-";

  const loadDetails = useCallback(async () => {
    if (!enabled || !user) {
      setDetails(null);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const [{ data: profileData, error: profileError }, { data, error }] = await Promise.all([
      supabase.from("user_profiles").select("full_name, email").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("individual_profile_details")
        .select(PROFILE_DETAILS_SELECT)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const resolvedDisplayName =
      typeof profileData?.full_name === "string" && profileData.full_name.trim().length > 0
        ? profileData.full_name
        : displayName;
    const resolvedEmail =
      typeof profileData?.email === "string" && profileData.email.trim().length > 0
        ? profileData.email
        : email;
    const fallback = buildFallbackIndividualProfileDetails({
      userId: user.id,
      displayName: resolvedDisplayName,
      email: resolvedEmail,
    });

    if (error || profileError) {
      setDetails(fallback);
      setErrorMessage(error?.message ?? profileError?.message ?? "Profil verisi yuklenemedi.");
      setIsLoading(false);
      return;
    }

    setDetails(mapIndividualProfileRow(data, fallback));
    setIsLoading(false);
  }, [displayName, email, enabled, user]);

  useEffect(() => {
    if (isAuthLoading) return;

    let isMounted = true;

    void (async () => {
      await loadDetails();
      if (!isMounted) return;
    })();

    return () => {
      isMounted = false;
    };
  }, [isAuthLoading, loadDetails]);

  const saveDetails = useCallback(async (input: IndividualProfileUpdateInput) => {
    if (!user) {
      throw new Error("Oturum bulunamadi.");
    }

    setIsSaving(true);
    setSaveErrorMessage(null);

    try {
      const baseDetails = details ?? buildFallbackIndividualProfileDetails({
        userId: user.id,
        displayName,
        email,
      });

      const nextFrontCard = {
        profile_image_url: baseDetails.frontCard.profileImageUrl,
        passport_status: baseDetails.frontCard.passportStatus,
        previous_cities: baseDetails.frontCard.previousCities,
        mini_event: baseDetails.frontCard.miniEvent,
        follow_request_state: baseDetails.frontCard.followRequestState,
        follow_request_note: baseDetails.frontCard.followRequestNote,
        profile_preview_note: baseDetails.frontCard.profilePreviewNote,
        world_message: input.worldMessage,
        corteqs_passport: baseDetails.frontCard.corteqsPassport,
        linkedin_url: input.linkedin || null,
        linkedin_visible: true,
        cv_doc: baseDetails.frontCard.cvDoc,
        presentation_doc: baseDetails.frontCard.presentationDoc,
        birthday_days: baseDetails.frontCard.birthdayDays,
        gift_acceptance: baseDetails.frontCard.giftAcceptance,
      };

      const nextDetailCard = {
        about_text: input.bio,
        interests: input.interests.slice(0, 12),
        languages: input.languages.slice(0, 5),
        lived_countries: baseDetails.detailCard.livedCountries,
        service_requests: baseDetails.detailCard.serviceRequests,
        events: baseDetails.detailCard.events,
        follows_preview: baseDetails.detailCard.followsPreview,
        whatsapp_groups: baseDetails.detailCard.whatsappGroups,
        activities: baseDetails.detailCard.activities,
        recent_events: baseDetails.detailCard.recentEvents,
        countries_lived: baseDetails.detailCard.countriesLived,
        relocation: baseDetails.detailCard.relocation,
        cv_request_enabled: baseDetails.detailCard.cvRequestEnabled,
        wishlist_status: baseDetails.detailCard.wishlistStatus === "hidden" ? "hidden" : "V2",
      };

      const nextProfileSettings = {
        country: input.country || null,
        city: input.city || null,
        years_in_city: input.yearsInCity || null,
        phone: input.phone || null,
        birth_date: baseDetails.controlPanel.birthDate === "-" ? null : baseDetails.controlPanel.birthDate,
        education: input.education || null,
        school: input.school || null,
        institution: input.institution || null,
        bio: input.bio || null,
        linkedin: input.linkedin || null,
        website_links: baseDetails.controlPanel.websiteLinks,
        websites: baseDetails.controlPanel.websites,
        skills: baseDetails.controlPanel.skills,
        profile_visible: input.profileVisible,
        job_seeking: input.jobSeeking,
        profile_steps: baseDetails.controlPanel.profileSteps,
      };

      const { error: detailsError } = await supabase.from("individual_profile_details").upsert(
        {
          user_id: user.id,
          tagline: input.tagline || null,
          status_text: input.statusText || null,
          active_country: input.activeCountry || null,
          active_city: input.activeCity || null,
          hometown: input.hometown || null,
          job_seeking: input.jobSeeking,
          front_card: nextFrontCard,
          detail_card: nextDetailCard,
          profile_settings: nextProfileSettings,
        },
        { onConflict: "user_id" },
      );

      if (detailsError) {
        throw detailsError;
      }

      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({ full_name: input.displayName || null })
        .eq("user_id", user.id);

      if (profileError) {
        throw profileError;
      }

      const normalizedName = input.displayName.trim();
      if (normalizedName) {
        await supabase.auth.updateUser({
          data: {
            full_name: normalizedName,
            name: normalizedName,
          },
        });
      }

      await loadDetails();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Profil kaydedilemedi.";
      setSaveErrorMessage(message);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [details, displayName, email, loadDetails, user]);

  return {
    isLoading: isLoading || isAuthLoading,
    errorMessage,
    details,
    isSaving,
    saveErrorMessage,
    saveDetails,
    refreshDetails: loadDetails,
  };
};
