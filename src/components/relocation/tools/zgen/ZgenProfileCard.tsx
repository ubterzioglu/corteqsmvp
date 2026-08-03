// ZGEN — "senin kuşağın": 10 özellik + 5 vibe + erkek/kadın avatar.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getZgenProfile } from "@/lib/zgen/zgen-helpers";
import type { ZgenGeneration } from "@/lib/zgen/zgen-types";

interface ZgenProfileCardProps {
  gen: ZgenGeneration;
}

export function ZgenProfileCard({ gen }: ZgenProfileCardProps) {
  const profile = getZgenProfile(gen.id);

  return (
    <Card className="border-brand-indigo/30 ring-1 ring-brand-indigo/20">
      <CardHeader>
        <CardTitle className="text-base">
          Sen <span className="text-brand-indigo">{gen.name}</span> kuşağındansın
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">Tipik özellikler</h3>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {(profile?.traits ?? []).map((trait) => (
              <li key={trait} className="flex gap-2">
                <span className="text-brand-indigo">•</span>
                {trait}
              </li>
            ))}
          </ul>
        </div>

        <aside className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              <img
                src={gen.avatars.m}
                alt={`${gen.avatarAlt} (erkek)`}
                loading="lazy"
                className="h-16 w-16 rounded-full border-2 border-background object-cover shadow-sm"
              />
              <img
                src={gen.avatars.f}
                alt={`${gen.avatarAlt} (kadın)`}
                loading="lazy"
                className="h-16 w-16 rounded-full border-2 border-background object-cover shadow-sm"
              />
            </div>
            <p className="text-sm font-medium text-foreground">Senin vibe'ın</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(profile?.vibes ?? []).map((vibe) => (
              <Badge key={vibe} variant="secondary" className="font-normal">
                {vibe}
              </Badge>
            ))}
          </div>
        </aside>
      </CardContent>
    </Card>
  );
}
