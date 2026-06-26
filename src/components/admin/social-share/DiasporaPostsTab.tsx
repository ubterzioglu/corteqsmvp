// Sosyal Medya Paylaşım Deposu — "Diaspora Postları" sekmesi.
// 50 hazır LinkedIn postu + her biri için 1 Canva promptu; tema filtreli akordeon.
// Veri tek kaynak: lib/admin-shell/social-diaspora-posts.ts.

import { useMemo, useState } from "react";
import { Check, Copy, Linkedin, Palette } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  DIASPORA_POSTS,
  DIASPORA_THEME_LABELS,
  type DiasporaPostTheme,
} from "@/lib/admin-shell/social-diaspora-posts";

type CopyFn = (text: string, id: string) => void;

const ALL_FILTER = "all" as const;
type ThemeFilter = typeof ALL_FILTER | DiasporaPostTheme;

// Filtre çiplerinde gösterilecek temalar — yalnızca veride gerçekten geçenler,
// post sırasına göre ilk görülme sırasıyla.
const usedThemes = (): DiasporaPostTheme[] => {
  const seen: DiasporaPostTheme[] = [];
  for (const post of DIASPORA_POSTS) {
    if (!seen.includes(post.theme)) seen.push(post.theme);
  }
  return seen;
};

type DiasporaPostsTabProps = {
  copiedId: string | null;
  onCopy: CopyFn;
};

export function DiasporaPostsTab({ copiedId, onCopy }: DiasporaPostsTabProps) {
  const [filter, setFilter] = useState<ThemeFilter>(ALL_FILTER);

  const themes = useMemo(usedThemes, []);
  const visiblePosts = useMemo(
    () => (filter === ALL_FILTER ? DIASPORA_POSTS : DIASPORA_POSTS.filter((p) => p.theme === filter)),
    [filter],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={filter === ALL_FILTER}
          label={`Tümü (${DIASPORA_POSTS.length})`}
          onClick={() => setFilter(ALL_FILTER)}
        />
        {themes.map((theme) => (
          <FilterChip
            key={theme}
            active={filter === theme}
            label={DIASPORA_THEME_LABELS[theme]}
            onClick={() => setFilter(theme)}
          />
        ))}
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {visiblePosts.map((post) => (
          <AccordionItem
            key={post.id}
            value={post.id}
            className="rounded-xl border bg-card px-4"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex flex-1 items-center gap-3 pr-3 text-left">
                <span className="font-mono text-sm font-bold text-muted-foreground">
                  {String(post.order).padStart(2, "0")}
                </span>
                <span className="text-base font-semibold">{post.title}</span>
                <Badge variant="outline" className="border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-300">
                  {DIASPORA_THEME_LABELS[post.theme]}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Palette className="h-4 w-4" /> Canva Promptu
                      <span className="text-xs font-normal text-muted-foreground">metinsiz</span>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCopy(post.canvaPrompt, `${post.id}-canva`)}
                    >
                      {copiedId === `${post.id}-canva` ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      readOnly
                      value={post.canvaPrompt}
                      className="min-h-[160px] resize-y text-xs"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Linkedin className="h-4 w-4" /> LinkedIn Postu
                      <span className="text-xs font-normal text-muted-foreground">
                        kopyala-yapıştır
                      </span>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCopy(post.linkedinPost, `${post.id}-linkedin`)}
                    >
                      {copiedId === `${post.id}-linkedin` ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      readOnly
                      value={post.linkedinPost}
                      className="min-h-[260px] resize-y text-sm"
                    />
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

type FilterChipProps = {
  active: boolean;
  label: string;
  onClick: () => void;
};

function FilterChip({ active, label, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-amber-500 bg-amber-500/20 text-amber-700 dark:text-amber-200"
          : "border-border bg-muted/40 text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}
