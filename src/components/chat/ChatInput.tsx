import { Loader2, Paperclip, Send, X } from "lucide-react";
import type { ChatStep } from "@/lib/chatConfig";

type Props = {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onFileSelect: (files: FileList) => void;
  documentFiles: File[];
  onRemoveFile: (index: number) => void;
  disabled?: boolean;
  loading?: boolean;
  submitted?: boolean;
  step: ChatStep;
  showFileInput: boolean;
};

const ChatInput = ({
  input,
  onInputChange,
  onSend,
  onFileSelect,
  documentFiles,
  onRemoveFile,
  disabled,
  loading,
  submitted,
  showFileInput,
}: Props) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t border-border bg-card p-4">
      {documentFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {documentFiles.map((file, index) => (
            <span
              key={`${file.name}-${index}`}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
            >
              <Paperclip className="h-3 w-3" />
              {file.name}
              <button
                type="button"
                onClick={() => onRemoveFile(index)}
                className="hover:text-destructive"
                aria-label="Kaldır"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {showFileInput && !submitted && (
          <>
            <button
              type="button"
              onClick={() => document.getElementById("chat-file-input")?.click()}
              disabled={submitted || documentFiles.length >= 5}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50"
              aria-label="Dosya ekle"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <input
              id="chat-file-input"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) onFileSelect(e.target.files);
                e.target.value = "";
              }}
            />
          </>
        )}
        <textarea
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={submitted ? "Kayıt tamamlandı ✅" : "Mesajını yaz..."}
          rows={1}
          disabled={disabled || submitted}
          className="max-h-32 min-h-[40px] flex-1 resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={!input.trim() || loading || submitted || disabled}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Gönder"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
