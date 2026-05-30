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
}

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
      .select("id, full_name, avatar_url, city, country, profession, school, account_type")
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

    // 4) Suggestions via similarity (country/city/profession/school)
    if (me) {
      const orParts: string[] = [];
      if (me.country) orParts.push(`country.eq.${me.country}`);
      if (me.city) orParts.push(`city.eq.${me.city}`);
      if (me.profession) orParts.push(`profession.eq.${me.profession}`);
      if (me.school) orParts.push(`school.eq.${me.school}`);

      if (orParts.length > 0) {
        let q = supabase
          .from("profiles")
          .select("id, full_name, avatar_url, city, country, profession, school, account_type")
          .neq("id", user.id)
          .or(orParts.join(","))
          .limit(50);

        const { data: candidates } = await q;
        const excluded = new Set([user.id, ...followingIds]);
        const scored: Suggestion[] = (candidates || [])
          .filter((p: any) => !excluded.has(p.id))
          .map((p: any) => {
            let score = 0;
            const reasons: string[] = [];
            if (me.country && p.country === me.country) { score += 1; reasons.push(`📍 ${p.country}`); }
            if (me.city && p.city === me.city) { score += 2; reasons.push(`🏙 ${p.city}`); }
            if (me.profession && p.profession === me.profession) { score += 3; reasons.push(`💼 ${p.profession}`); }
            if (me.school && p.school === me.school) { score += 3; reasons.push(`🎓 ${p.school}`); }
            return { ...p, score, reasons };
          })
          .filter((p) => p.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);
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
