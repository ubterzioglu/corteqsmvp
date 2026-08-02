import { lazy, Suspense, useState } from "react";
import { SmilePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const CaddeEmojiPickerContent = lazy(() => import("@/components/cadde/CaddeEmojiPickerContent"));

interface CaddeEmojiPickerButtonProps {
  onSelect: (emoji: string) => void;
  disabled?: boolean;
  className?: string;
}

const CaddeEmojiPickerButton = ({ onSelect, disabled, className }: CaddeEmojiPickerButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Emoji ekle"
          disabled={disabled}
          className={cn("h-10 w-10 shrink-0 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900", className)}
        >
          <SmilePlus className="h-4 w-4" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] overflow-hidden rounded-2xl border-slate-200 p-0">
        <Suspense fallback={<div className="p-4 text-sm text-slate-500">Emoji bankası yükleniyor...</div>}>
          <CaddeEmojiPickerContent
            onSelect={(emoji) => {
              onSelect(emoji);
              setOpen(false);
            }}
          />
        </Suspense>
      </PopoverContent>
    </Popover>
  );
};

export default CaddeEmojiPickerButton;
