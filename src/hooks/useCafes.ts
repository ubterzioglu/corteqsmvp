import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface Cafe {
  id: string;
  name: string;
  theme: string;
  country: string | null;
  city: string | null;
  linkedin_url: string;
  extra_links: any;
  created_by: string;
  opens_at: string;
  closes_at: string;
  duration_hours: number;
  created_at: string;
  kind: "community" | "relocation" | "expo";
  open_entry: boolean;
  entry_question: string | null;
  capacity: number | null;
  member_count: number;
}

export const useActiveCafes = (filters?: { countries?: string[]; cities?: string[] }) => {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("cafes" as any)
      .select("*")
      .or(`closes_at.gt.${new Date().toISOString()},kind.in.(relocation,expo)`)
      .order("kind", { ascending: true })
      .order("opens_at", { ascending: false });
    if (filters?.cities && filters.cities.length > 0) q = q.in("city", filters.cities);
    else if (filters?.countries && filters.countries.length > 0) q = q.in("country", filters.countries);
    const { data, error } = await q;
    setLoading(false);
    if (!error && data) setCafes(data as unknown as Cafe[]);
  }, [JSON.stringify(filters?.countries || []), JSON.stringify(filters?.cities || [])]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { cafes, loading, refresh };
};

const parseJoinError = (msg: string | undefined): string => {
  if (!msg) return "Bilinmeyen hata.";
  if (msg.includes("daily_cafe_limit"))
    return "Bugün başka bir community cafe'ye katıldın. Yarın tekrar dene.";
  if (msg.includes("cafe_full")) return "Cafe dolu. Başka bir cafe deneyin.";
  if (msg.includes("tr_phone_restricted"))
    return "TR (+90) numaralı kullanıcılar yalnızca Relocation ve Expo cafelerine katılabilir.";
  return msg;
};

export const useCafe = (cafeId: string | undefined) => {
  const { user } = useAuth();
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [approved, setApproved] = useState(true);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!cafeId) return;
    setLoading(true);
    const { data } = await supabase.from("cafes" as any).select("*").eq("id", cafeId).maybeSingle();
    setCafe((data as unknown as Cafe) || null);
    if (user) {
      const { data: m } = await supabase
        .from("cafe_memberships" as any)
        .select("id, approved")
        .eq("cafe_id", cafeId)
        .eq("user_id", user.id)
        .maybeSingle();
      setIsMember(!!m);
      setApproved(m ? (m as any).approved !== false : true);
    }
    setLoading(false);
  }, [cafeId, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const join = async (answer?: string) => {
    if (!user) {
      toast({ title: "Giriş yapmalısın", variant: "destructive" });
      return false;
    }
    if (!cafeId || !cafe) return false;
    const needsApproval = !cafe.open_entry;
    const { error } = await supabase.from("cafe_memberships" as any).insert({
      cafe_id: cafeId,
      user_id: user.id,
      answer: answer || null,
      approved: needsApproval ? false : true,
    });
    if (error) {
      toast({
        title: "Cafe'ye katılınamadı",
        description: parseJoinError(error.message),
        variant: "destructive",
      });
      return false;
    }
    setIsMember(true);
    setApproved(!needsApproval);
    toast({
      title: needsApproval ? "Başvurun alındı" : "Cafe'ye katıldın 🎉",
      description: needsApproval ? "Cafe sahibi onayını bekliyor." : undefined,
    });
    refresh();
    return true;
  };

  return { cafe, isMember, approved, loading, join, refresh };
};
