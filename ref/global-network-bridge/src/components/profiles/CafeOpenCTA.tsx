import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Coffee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  userId?: string | null;
  variant?: "badge" | "button";
  className?: string;
}

const CafeOpenCTA = ({ userId, variant = "badge", className = "" }: Props) => {
  const [cafe, setCafe] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("cafes")
        .select("id, name, closes_at")
        .eq("created_by", userId)
        .gt("closes_at", new Date().toISOString())
        .order("opens_at", { ascending: false })
        .limit(1);
      const row: any = data?.[0];
      if (!cancelled && row) setCafe({ id: row.id, name: row.name });
    })();
    return () => { cancelled = true; };
  }, [userId]);

  if (!cafe) return null;

  if (variant === "button") {
    return (
      <Link
        to={`/cadde/${cafe.id}`}
        onClick={(e) => e.stopPropagation()}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 hover:bg-amber-500/20 text-xs font-semibold transition ${className}`}
      >
        <Coffee className="h-3.5 w-3.5" /> Cafe'sine Git
      </Link>
    );
  }

  return (
    <Link
      to={`/cadde/${cafe.id}`}
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 hover:bg-amber-500/25 text-[11px] font-semibold transition ${className}`}
      title={`Şu an açık: ${cafe.name}`}
    >
      <Coffee className="h-3 w-3" /> Cafe'sine Git
    </Link>
  );
};

export default CafeOpenCTA;
