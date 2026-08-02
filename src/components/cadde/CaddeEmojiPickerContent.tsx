import { EmojiPicker } from "frimousse";

import { cn } from "@/lib/utils";

interface CaddeEmojiPickerContentProps {
  onSelect: (emoji: string) => void;
}

const CaddeEmojiPickerContent = ({ onSelect }: CaddeEmojiPickerContentProps) => (
  <EmojiPicker.Root onEmojiSelect={({ emoji }) => onSelect(emoji)} columns={8} className="bg-white">
    <div className="border-b border-slate-100 p-2">
      <EmojiPicker.Search
        aria-label="Emoji ara"
        placeholder="Emoji ara"
        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
      />
    </div>
    <EmojiPicker.Viewport className="h-64 overflow-y-auto px-2 pb-2 pt-1">
      <EmojiPicker.Loading className="block p-3 text-sm text-slate-500">Yükleniyor...</EmojiPicker.Loading>
      <EmojiPicker.Empty className="block p-3 text-sm text-slate-500">Emoji bulunamadı.</EmojiPicker.Empty>
      <EmojiPicker.List
        components={{
          CategoryHeader: ({ category, className, ...props }) => (
            <div {...props} className={cn("sticky top-0 z-10 bg-white/95 px-1 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400", className)}>
              {category.label}
            </div>
          ),
          Row: ({ className, ...props }) => (
            <div {...props} className={cn("grid grid-cols-8 gap-0.5", className)} />
          ),
          Emoji: ({ emoji, className, ...props }) => (
            <button
              {...props}
              type="button"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg text-xl transition hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300",
                emoji.isActive ? "bg-orange-50" : null,
                className,
              )}
            >
              {emoji.emoji}
            </button>
          ),
        }}
      />
    </EmojiPicker.Viewport>
  </EmojiPicker.Root>
);

export default CaddeEmojiPickerContent;
