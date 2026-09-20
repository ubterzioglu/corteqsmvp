// AI asistan sekmesi — çok turlu sohbet, taşınma dosyası bağlamlı.
//
// Bağlam src/lib/relocation-chat-context.ts ile kurulur ve her istekte gönderilir;
// edge function (relocation-assistant) sistem prompt'una ekler. Platform verisi
// yoksa bağlam bunu modele AÇIKÇA söyler, böylece model rakam uydurmaz.

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MAX_MESSAGE_CHARS, type RelocationChatMessage } from "@/lib/relocation-chat-api";

interface RelocationChatPanelProps {
  messages: RelocationChatMessage[];
  isSending: boolean;
  onSend: (text: string) => void;
  onSaveTranscript: () => void;
  /** İçerik yoksa kullanıcı beklentisini baştan doğru kurarız. */
  hasPlatformData: boolean;
}

const SUGGESTIONS = [
  "Taşınma bütçemi nasıl planlamalıyım?",
  "İlk ay hangi resmî işlemleri yapmalıyım?",
  "Diploma denkliği süreci nasıl işliyor?",
];

export function RelocationChatPanel({
  messages,
  isSending,
  onSend,
  onSaveTranscript,
  hasPlatformData,
}: RelocationChatPanelProps) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isSending]);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    onSend(trimmed.slice(0, MAX_MESSAGE_CHARS));
    setInput("");
  };

  return (
    <div className="space-y-4">
      {!hasPlatformData && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="py-3 text-xs text-muted-foreground">
            Hedef ülkeniz için platformda henüz maliyet ve belge verisi yok. Asistan genel
            rehberlik yapar; kesin rakam ve belge listesi için resmî kaynakları teyit edin.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-3 py-4">
          {messages.length === 0 ? (
            <div className="space-y-3 py-6 text-center">
              <p className="text-sm text-muted-foreground">
                Taşınma planınızla ilgili istediğinizi sorun.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => submit(suggestion)}
                    disabled={isSending}
                    className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Yanıt hazırlanıyor…
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}

          <div className="flex items-end gap-2 border-t pt-3">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit(input);
                }
              }}
              placeholder="Sorunuzu yazın…"
              rows={2}
              maxLength={MAX_MESSAGE_CHARS}
              className="resize-none"
              disabled={isSending}
            />
            <Button
              type="button"
              onClick={() => submit(input)}
              disabled={isSending || input.trim().length === 0}
              size="icon"
              aria-label="Gönder"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {messages.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={onSaveTranscript}
        >
          <Save className="h-3.5 w-3.5" />
          Sohbeti dökümanlarıma kaydet
        </Button>
      )}
    </div>
  );
}
