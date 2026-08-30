import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listMemberCatalogNames } from "@/lib/member-catalog";

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

const DIRECTORY_SELECT = "user_id, tagline, active_city, active_country, follower_count, following_count, job_seeking, front_card, detail_card" as const;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const readStr = (value: unknown, key: string, fallback = ""): string => {
  const v = asRecord(value)?.[key];
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
};

const readBool = (value: unknown, key: string, fallback = false): boolean => {
  const v = asRecord(value)?.[key];
  return typeof v === "boolean" ? v : fallback;
};

const readRelocation = (detailCard: unknown) => {
  const relocation = asRecord(asRecord(detailCard)?.relocation);
  if (!relocation) return null;
  const enabled = typeof relocation.enabled === "boolean" ? relocation.enabled : false;
  if (!enabled) return null;
  return {
    enabled: true,
    city: typeof relocation.city === "string" ? relocation.city : "",
    country: typeof relocation.country === "string" ? relocation.country : "",
  };
};

const readRecentEvents = (detailCard: unknown): DirectoryProfile["recentEvents"] => {
  const events = asRecord(detailCard)?.recent_events;
  if (!Array.isArray(events)) return [];
  return events
    .map(asRecord)
    .filter((event): event is Record<string, unknown> => Boolean(event) && typeof event.title === "string" && event.title.trim().length > 0)
    .slice(0, 4)
    .map((event) => ({
      title: event.title as string,
      date: typeof event.date === "string" ? event.date : "",
      city: typeof event.city === "string" ? event.city : "",
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

      const userIds = rows.map((row) => row.user_id);

      const nameMap = await listMemberCatalogNames(userIds);
      if (!isMounted) return;

      const mapped: DirectoryProfile[] = rows.map((row) => {
        const front = row.front_card ?? {};
        const detail = row.detail_card ?? {};
        return {
          userId: row.user_id,
          displayName: nameMap.get(row.user_id) ?? "CorteQS Üyesi",
          tagline: row.tagline ?? "",
          worldMessage: readStr(front, "world_message"),
          profileImageUrl: readStr(front, "profile_image_url") || null,
          activeCity: row.active_city ?? "-",
          activeCountry: row.active_country ?? "-",
          followerCount: typeof row.follower_count === "number" ? row.follower_count : 0,
          followingCount: typeof row.following_count === "number" ? row.following_count : 0,
          jobSeeking: typeof row.job_seeking === "boolean" ? row.job_seeking : false,
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
