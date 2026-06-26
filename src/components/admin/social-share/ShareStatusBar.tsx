// Sosyal Medya Paylaşım Takip — bir içerik kalemi için platform rozet çubuğu.
// 6 platform rozeti (kalem × platform) + kalem başına tek opsiyonel not/link.
// Salt sunum + etkileşim: DB çağrısı YAPMAZ, yalnız onToggle/onSaveNote tetikler.
// Veri/şema: lib/admin-shell/social-share-log.ts.

import { useEffect, useState } from "react";
import { Check, StickyNote } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  SHARE_PLATFORM_ICONS,
  SHARE_PLATFORM_LABELS,
  SHARE_PLATFORMS,
  type ShareBadge,
  type ShareNote,
  type SharePlatform,
  type ShareTab,
} from "@/lib/admin-shell/social-share-log";

type ShareStatusBarProps = {
  tab: ShareTab;
  itemId: string;
  badges: Partial<Record<SharePlatform, ShareBadge>>;
  note: ShareNote | undefined;
  onToggle: (platform: SharePlatform, shared: boolean) => void;
  onSaveNote: (note: string) => void;
  /** Bekleyen mutation sırasında rozetleri/not kaydını pasifleştirir. */
  pending?: boolean;
};

const shortDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });

export function ShareStatusBar({
  tab,
  itemId,
  badges,
  note,
  onToggle,
  onSaveNote,
  pending = false,
}: ShareStatusBarProps) {
  const [draft, setDraft] = useState(note?.note ?? "");
  const [open, setOpen] = useState(false);

  // Popover her açıldığında en güncel notu yansıt (dışarıdan değişebilir).
  useEffect(() => {
    if (open) setDraft(note?.note ?? "");
  }, [open, note?.note]);

  const hasNote = Boolean(note?.note?.trim());

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
      <span className="mr-1 text-xs font-medium text-muted-foreground">Paylaşıldı:</span>

      {SHARE_PLATFORMS.map((platform) => {
        const Icon = SHARE_PLATFORM_ICONS[platform];
        const badge = badges[platform];
        const shared = Boolean(badge?.shared);

        return (
          <button
            key={platform}
            type="button"
            disabled={pending}
            onClick={() => onToggle(platform, !shared)}
            title={
              shared && badge?.markedAt
                ? `${SHARE_PLATFORM_LABELS[platform]} · ${shortDate(badge.markedAt)}`
                : SHARE_PLATFORM_LABELS[platform]
            }
            aria-pressed={shared}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-50",
              shared
                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : "border-border bg-transparent text-muted-foreground hover:bg-muted",
            )}
          >
            {shared ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
            {SHARE_PLATFORM_LABELS[platform]}
            {shared && badge?.markedAt ? (
              <span className="opacity-70">· {shortDate(badge.markedAt)}</span>
            ) : null}
          </button>
        );
      })}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant={hasNote ? "secondary" : "ghost"}
            size="sm"
            className="ml-auto h-7 gap-1.5 px-2 text-xs"
          >
            <StickyNote className="h-3.5 w-3.5" />
            {hasNote ? "Notu Düzenle" : "Not Ekle"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Not / link (ör. paylaşılan gönderinin URL'i)
          </p>
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Bu kalem için kısa not veya link…"
            className="min-h-[88px] resize-y text-sm"
            data-testid={`share-note-input-${tab}-${itemId}`}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              İptal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={pending || draft === (note?.note ?? "")}
              onClick={() => {
                onSaveNote(draft);
                setOpen(false);
              }}
            >
              Kaydet
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
