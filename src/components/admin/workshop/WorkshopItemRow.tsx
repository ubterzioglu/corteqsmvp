// Workshop panosu — tek madde satırı.
// Format kararı (30.07.2026 Cadde workshop'u): madde metni + iki onay kutusu
// (UBT, Burak). Yorum/thread YOK. İkisi de işaretliyse madde bitmiştir.

import { useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  isWorkshopItemComplete,
  WORKSHOP_OWNER_LABELS,
  type WorkshopItem,
  type WorkshopItemDraft,
  type WorkshopOwner,
} from "@/lib/admin-shell/workshop-items";

export type WorkshopItemRowProps = {
  item: WorkshopItem;
  onToggle: (owner: WorkshopOwner, done: boolean) => void;
  onSave: (draft: WorkshopItemDraft) => void;
  onDelete: () => void;
  disabled?: boolean;
};

export function WorkshopItemRow({ item, onToggle, onSave, onDelete, disabled }: WorkshopItemRowProps) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(item.title);
  const complete = isWorkshopItemComplete(item);

  const startEdit = () => {
    setDraftTitle(item.title);
    setEditing(true);
  };

  const commitEdit = () => {
    const title = draftTitle.trim();
    if (!title || title === item.title) {
      setEditing(false);
      return;
    }
    onSave({ title, section: item.section, sessionKey: item.sessionKey });
    setEditing(false);
  };

  return (
    <li
      className={cn(
        "flex flex-col gap-3 border-b border-border/60 px-3 py-2.5 last:border-b-0 sm:flex-row sm:items-start sm:gap-4",
        complete && "bg-emerald-50/60 dark:bg-emerald-950/20",
      )}
    >
      <span className="flex w-16 shrink-0 items-center gap-1.5 pt-0.5 text-xs text-muted-foreground">
        <span
          className="rounded bg-muted px-1 py-0.5 text-[10px] font-semibold uppercase leading-none"
          title={`${item.sessionKey} workshop maddesi`}
        >
          {item.sessionKey}
        </span>
        <span className="font-semibold tabular-nums">{item.itemNo}</span>
      </span>

      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") commitEdit();
                if (event.key === "Escape") setEditing(false);
              }}
              className="h-8 text-sm"
            />
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={commitEdit}>
              <Check aria-hidden="true" className="h-4 w-4" />
              <span className="sr-only">Kaydet</span>
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setEditing(false)}
            >
              <X aria-hidden="true" className="h-4 w-4" />
              <span className="sr-only">Vazgeç</span>
            </Button>
          </div>
        ) : (
          <p className={cn("text-sm leading-relaxed", complete && "text-muted-foreground line-through")}>
            {item.title}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-4 sm:pt-0.5">
        {(["ubt", "burak"] as const).map((owner) => {
          const checked = owner === "ubt" ? item.ubtDone : item.burakDone;
          const inputId = `workshop-${item.id}-${owner}`;
          return (
            <label
              key={owner}
              htmlFor={inputId}
              className="flex cursor-pointer items-center gap-1.5 text-xs font-medium"
            >
              <Checkbox
                id={inputId}
                checked={checked}
                disabled={disabled}
                onCheckedChange={(value) => onToggle(owner, value === true)}
              />
              {WORKSHOP_OWNER_LABELS[owner]}
            </label>
          );
        })}

        <div className="flex items-center">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground"
            onClick={startEdit}
            disabled={disabled}
          >
            <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
            <span className="sr-only">Maddeyi düzenle</span>
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            disabled={disabled}
          >
            <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
            <span className="sr-only">Maddeyi sil</span>
          </Button>
        </div>
      </div>
    </li>
  );
}
