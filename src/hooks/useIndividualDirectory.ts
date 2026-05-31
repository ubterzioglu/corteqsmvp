import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DirectoryProfile = {
  userId: string;
  displayName: string;
  tagline: string;
  worldMessage: string;
  profileImageUrl: string | null;
  activeCity: string;
  activeCountry: string;
  followerCount: number;
  followingCount: number;
  jobSeeking: boolean;
  corteqsPassport: boolean;
  relocation: { enabled: boolean; city: string; country: string } | null;
  recentEvents: Array<{ title: string; date: string; city: string }>;
};

const DIRECTORY_SELECT = [
  "user_id",
  "tagline",
  "active_city",
  "active_country",
  "follower_count",
  "following_count",
  "job_seeking",
  "front_card",
  "detail_card",
].join(", ");

const readStr = (obj: any, key: string, fallback = ""): string => {
  const v = obj?.[key];
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
};

const readBool = (obj: any, key: string, fallback = false): boolean => {
  const v = obj?.[key];
  return typeof v === "boolean" ? v : fallback;
};

const readRelocation = (detailCard: any) => {
  const r = detailCard?.relocation;
  if (!r || typeof r !== "object") return null;
  const enabled = typeof r.enabled === "boolean" ? r.enabled : false;
  if (!enabled) return null;
  return {
    enabled: true,
    city: typeof r.city === "string" ? r.city : "",
    country: typeof r.country === "string" ? r.country : "",
  };
};

const readRecentEvents = (detailCard: any): DirectoryProfile["recentEvents"] => {
  const events = detailCard?.recent_events;
  if (!Array.isArray(events)) return [];
  return events
    .filter((e: any) => typeof e?.title === "string" && e.title.trim())
    .slice(0, 4)
    .map((e: any) => ({
      title: e.title,
      date: typeof e.date === "string" ? e.date : "",
      city: typeof e.city === "string" ? e.city : "",
    }));
};

export const useIndividualDirectory = (limit = 20) => {
  const [profiles, setProfiles] = useState<DirectoryProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      setIsLoading(true);
      setErrorMessage(null);

      const { data: rows, error: rowsError } = await supabase
        .from("individual_profile_details")
        .select(DIRECTORY_SELECT)
        .eq("visibility_status", "open")
        .order("follower_count", { ascending: false })
        .limit(limit);

      if (!isMounted) return;

      if (rowsError || !rows) {
        setErrorMessage(rowsError?.message ?? "Üyeler alınamadı.");
        setIsLoading(false);
        return;
      }

      if (rows.length === 0) {
        setProfiles([]);
        setIsLoading(false);
        return;
      }

      const userIds = rows.map((r: any) => r.user_id as string);

      const { data: profileRows } = await supabase
        .from("user_profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      if (!isMounted) return;

      const nameMap = new Map<string, string>();
      (profileRows ?? []).forEach((p: any) => {
        if (p.user_id && p.full_name) nameMap.set(p.user_id, p.full_name);
      });

      const mapped: DirectoryProfile[] = rows.map((r: any) => {
        const front = r.front_card ?? {};
        const detail = r.detail_card ?? {};
        return {
          userId: r.user_id,
          displayName: nameMap.get(r.user_id) ?? "CorteQS Üyesi",
          tagline: r.tagline ?? "",
          worldMessage: readStr(front, "world_message"),
          profileImageUrl: readStr(front, "profile_image_url") || null,
          activeCity: r.active_city ?? "-",
          activeCountry: r.active_country ?? "-",
          followerCount: typeof r.follower_count === "number" ? r.follower_count : 0,
          followingCount: typeof r.following_count === "number" ? r.following_count : 0,
          jobSeeking: typeof r.job_seeking === "boolean" ? r.job_seeking : false,
          corteqsPassport: readBool(front, "corteqs_passport"),
          relocation: readRelocation(detail),
          recentEvents: readRecentEvents(detail),
        };
      });

      setProfiles(mapped);
      setIsLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [limit]);

  return { profiles, isLoading, errorMessage };
};
