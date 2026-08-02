// @mention autocomplete'li metin alanı.
//
// Kullanıcı "@" yazıp en az 2 harf girdiğinde imlecin bulunduğu token'a göre öneri açar.
// Seçim yapıldığında gövdeye "@Görünen Ad" yazılır ve hedef (type + id + label) ayrı bir
// listede tutulur — gövde metni ile hedef arasındaki bağ display_label üzerinden kurulur
// (bkz. CaddePostBody). Öneri kaynağı search_cadde_mentions_v1: görünürlük kuralları DB'de.

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, ShoppingBag, User } from "lucide-react";

import CaddeCafeIcon from "@/components/cadde/CaddeCafeIcon";

import { Textarea } from "@/components/ui/textarea";
import { searchCaddeMentions } from "@/lib/cadde-api";
import { activeMentionToken } from "@/lib/cadde-text";
import type { CaddeMentionSuggestion, CaddeMentionTargetType, CaddePostMention } from "@/lib/cadde-types";

// Not: harita tipi lucide'a bağlanmaz (`typeof User` olurdu) — CaddeCafeIcon düz bir
// fonksiyon bileşeni ve lucide'ın ForwardRefExoticComponent imzasını karşılamıyor.
// Ortak sözleşme yalnız className.
const TYPE_ICON: Record<CaddeMentionTargetType, ComponentType<{ className?: string }>> = {
  user: User,
  catalog_item: Building2,
  cafe: CaddeCafeIcon,
  carsi_item: ShoppingBag,
};

export interface MentionTextareaProps {
  value: string;
  onChange: (next: string) => void;
  onMentionAdd: (mention: CaddePostMention) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  ariaLabel: string;
  className?: string;
}

const MentionTextarea = ({
  value,
  onChange,
  onMentionAdd,
  placeholder,
  rows = 3,
  maxLength,
  ariaLabel,
  className,
}: MentionTextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [caret, setCaret] = useState(0);
  const [highlight, setHighlight] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const active = useMemo(() => activeMentionToken(value, caret), [value, caret]);
  const query = active?.token ?? "";
  const enabled = !dismissed && query.length >= 2;

  const suggestionsQuery = useQuery({
    queryKey: ["cadde", "mention-search", query],
    queryFn: () => searchCaddeMentions(query),
    enabled,
    staleTime: 30_000,
  });

  const suggestions = enabled ? suggestionsQuery.data ?? [] : [];

  useEffect(() => setHighlight(0), [query]);

  const applySuggestion = (suggestion: CaddeMentionSuggestion) => {
    if (!active) return;
    const before = value.slice(0, active.start);
    const after = value.slice(caret);
    const inserted = `@${suggestion.label} `;
    onChange(`${before}${inserted}${after}`);
    onMentionAdd({ type: suggestion.type, id: suggestion.id, label: suggestion.label });
    setDismissed(true);

    // İmleci eklenen metnin sonuna taşı.
    const nextCaret = before.length + inserted.length;
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextCaret, nextCaret);
      setCaret(nextCaret);
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((current) => (current - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      applySuggestion(suggestions[highlight]);
    } else if (event.key === "Escape") {
      setDismissed(true);
    }
  };

  const syncCaret = (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
    setCaret(event.currentTarget.selectionStart ?? 0);
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => {
          setDismissed(false);
          setCaret(event.target.selectionStart ?? 0);
          onChange(event.target.value);
        }}
        onKeyUp={syncCaret}
        onClick={syncCaret}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        aria-label={ariaLabel}
        className={className}
      />

      {suggestions.length > 0 ? (
        <ul
          role="listbox"
          aria-label="Etiketleme önerileri"
          className="absolute z-30 mt-1 max-h-64 w-full max-w-sm overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-lg"
        >
          {suggestions.map((suggestion, index) => {
            const Icon = TYPE_ICON[suggestion.type];
            return (
              <li key={`${suggestion.type}-${suggestion.id}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === highlight}
                  onMouseDown={(event) => {
                    // mousedown: textarea blur olmadan seçim uygulanmalı.
                    event.preventDefault();
                    applySuggestion(suggestion);
                  }}
                  onMouseEnter={() => setHighlight(index)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition ${
                    index === highlight ? "bg-slate-100" : "hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <span className="min-w-0 flex-1 truncate font-medium text-slate-900">{suggestion.label}</span>
                  <span className="shrink-0 text-xs text-slate-500">{suggestion.subtitle}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};

export default MentionTextarea;
