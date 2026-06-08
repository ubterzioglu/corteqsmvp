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

    // 1) Current user profile attributes for similarity
    const { getAttributesBatch, getProfilesBasicBatch } = await import("@/lib/profile-helpers");
    const myAttrs = await getAttributesBatch(user.id, ["full_name", "avatar_url", "city", "country", "profession", "school"]);
    const me: FeedProfile | null = {
      id: user.id,
      full_name: myAttrs.full_name,
      avatar_url: myAttrs.avatar_url,
      city: myAttrs.city,
      country: myAttrs.country,
      profession: myAttrs.profession,
      school: myAttrs.school,
      account_type: null,
    };

    // 2) Followed user IDs
    const { data: follows } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", user.id);
    const followingIds = (follows || []).map((f: any) => f.following_id);

    // 3) Followed profiles via profile-helpers
    if (followingIds.length > 0) {
      const profs = await getProfilesBasicBatch(followingIds.slice(0, 10));
      setFollowing(profs.map((p) => ({
        id: p.user_id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        city: null, country: null, profession: null, school: null, account_type: p.role_key,
      })));
    } else {
      setFollowing([]);
    }

    // 4) Suggestions: fetch all users, score by shared attributes
    if (me.country || me.city || me.profession || me.school) {
      const { data: allUsers } = await supabase
        .from("user_role_assignments")
        .select("user_id")
        .neq("user_id", user.id)
        .limit(100);
      const candidateIds = (allUsers || []).map((u: any) => u.user_id).filter((id: string) => !followingIds.includes(id));
      if (candidateIds.length > 0) {
        const candidates = await getProfilesBasicBatch(candidateIds.slice(0, 50));
        const candidateAttrs = await Promise.all(
          candidates.slice(0, 20).map((c) => getAttributesBatch(c.user_id, ["city", "country", "profession", "school"]))
        );
        const scored: Suggestion[] = candidates.slice(0, 20)
          .map((p, i) => {
            const attrs = candidateAttrs[i];
            let score = 0;
            const reasons: string[] = [];
            if (me.country && attrs.country === me.country) { score += 1; reasons.push(`📍 ${attrs.country}`); }
            if (me.city && attrs.city === me.city) { score += 2; reasons.push(`🏙 ${attrs.city}`); }
            if (me.profession && attrs.profession === me.profession) { score += 3; reasons.push(`💼 ${attrs.profession}`); }
            if (me.school && attrs.school === me.school) { score += 3; reasons.push(`🎓 ${attrs.school}`); }
            return { id: p.user_id, full_name: p.full_name, avatar_url: p.avatar_url, city: attrs.city, country: attrs.country, profession: attrs.profession, school: attrs.school, account_type: p.role_key, score, reasons };
          })
          .filter((p) => p.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);
        setSuggestions(scored);
      } else {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
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
