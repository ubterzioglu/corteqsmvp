import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface FeedProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  country: string | null;
  profession: string | null;
  school: string | null;
  account_type: string | null;
}

export interface Suggestion extends FeedProfile {
  score: number;
  reasons: string[];
  tag_line?: string | null;
  bio?: string | null;
}

const extractKeywords = (txt?: string | null): string[] => {
  if (!txt) return [];
  return Array.from(
    new Set(
      txt
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 4),
    ),
  );
};

export function useFeedSocial() {
  const { user } = useAuth();
  const [following, setFollowing] = useState<FeedProfile[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setFollowing([]);
      setSuggestions([]);
      return;
    }
    setLoading(true);

    // 1) Current user profile (for similarity)
    const { data: me } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, city, country, profession, school, account_type, tag_line, bio")
      .eq("id", user.id)
      .single();

    // 2) Followed user IDs
    const { data: follows } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", user.id);
    const followingIds = (follows || []).map((f: any) => f.following_id);

    // 3) Followed profiles
    if (followingIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, city, country, profession, school, account_type")
        .in("id", followingIds)
        .limit(10);
      setFollowing((profs as FeedProfile[]) || []);
    } else {
      setFollowing([]);
    }

    // 4) Suggestions ordered sequentially by: country → city → profession → profile keywords
    if (me) {
      const myKeywords = [
        ...extractKeywords((me as any).tag_line),
        ...extractKeywords((me as any).bio),
      ];

      const orParts: string[] = [];
      if (me.country) orParts.push(`country.eq.${me.country}`);
      if (me.city) orParts.push(`city.eq.${me.city}`);
      if (me.profession) orParts.push(`profession.eq.${me.profession}`);
      if (me.school) orParts.push(`school.eq.${me.school}`);
      if (myKeywords.length > 0) {
        const top = myKeywords.slice(0, 6);
        top.forEach((k) => {
          orParts.push(`tag_line.ilike.%${k}%`);
          orParts.push(`bio.ilike.%${k}%`);
        });
      }

      if (orParts.length > 0) {
        const { data: candidates } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, city, country, profession, school, account_type, tag_line, bio")
          .neq("id", user.id)
          .or(orParts.join(","))
          .limit(80);

        const excluded = new Set([user.id, ...followingIds]);
        const scored: Suggestion[] = (candidates || [])
          .filter((p: any) => !excluded.has(p.id))
          .map((p: any) => {
            const reasons: string[] = [];
            // Sequential weights: country > city > profession > keywords
            const countryMatch = !!(me.country && p.country === me.country);
            const cityMatch = !!(me.city && p.city === me.city);
            const professionMatch = !!(me.profession && p.profession === me.profession);
            const schoolMatch = !!(me.school && p.school === me.school);
            const candidateText = `${p.tag_line || ""} ${p.bio || ""}`.toLowerCase();
            const keywordHits = myKeywords.filter((k) => candidateText.includes(k));
            if (countryMatch) reasons.push(`📍 ${p.country}`);
            if (cityMatch) reasons.push(`🏙 ${p.city}`);
            if (professionMatch) reasons.push(`💼 ${p.profession}`);
            if (schoolMatch) reasons.push(`🎓 ${p.school}`);
            if (keywordHits.length > 0) reasons.push(`🔖 ${keywordHits.slice(0, 2).join(", ")}`);
            // Sequential ordering: country (1000) > city (100) > profession (10) > keywords (1 each)
            const score =
              (countryMatch ? 1000 : 0) +
              (cityMatch ? 100 : 0) +
              (professionMatch ? 10 : 0) +
              (schoolMatch ? 5 : 0) +
              keywordHits.length;
            return { ...p, score, reasons };
          })
          .filter((p) => p.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 8);
        setSuggestions(scored);
      } else {
        setSuggestions([]);
      }
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const follow = useCallback(
    async (targetId: string) => {
      if (!user) {
        toast({ title: "Takip etmek için giriş yapın", variant: "destructive" });
        return;
      }
      const { error } = await supabase
        .from("user_follows")
        .insert({ follower_id: user.id, following_id: targetId });
      if (error) {
        toast({ title: "Takip edilemedi", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Takip edildi 🔔" });
      load();
    },
    [user, load],
  );

  const unfollow = useCallback(
    async (targetId: string) => {
      if (!user) return;
      await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetId);
      load();
    },
    [user, load],
  );

  return { following, suggestions, loading, follow, unfollow, reload: load };
}
