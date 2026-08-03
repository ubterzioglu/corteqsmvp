// "Şu an konuşulanlar" — son 7 günün en çok kullanılan hashtag'leri.
// Etiket sayfası ayrı bir rota değil; /cadde?etiket=... akış filtresidir.

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Hash } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listTrendingCaddeHashtags } from "@/lib/cadde-api";

const CaddeTrendingHashtags = () => {
  const trendingQuery = useQuery({
    queryKey: ["cadde", "trending-hashtags"],
    queryFn: () => listTrendingCaddeHashtags(8),
    staleTime: 1000 * 60 * 5,
  });

  const tags = trendingQuery.data ?? [];
  if (tags.length === 0) return null;

  return (
    <Card className="border-slate-200 bg-white/90" data-testid="cadde-trending-hashtags">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-display text-base">
          <Hash className="h-4 w-4 text-sky-600" />
          Şu An Konuşulanlar
        </CardTitle>
        <CardDescription>Son 7 günün öne çıkan etiketleri</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Link
            key={tag.tag}
            to={`/cadde?etiket=${encodeURIComponent(tag.tag)}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
          >
            #{tag.displayTag}
            <span className="text-slate-400">{tag.postCount}</span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};

export default CaddeTrendingHashtags;
