import { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, MessageCircleQuestion } from "lucide-react";
import { askRag } from "@/lib/ragApi";

type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
};

const RagChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const { answer, hasContext } = await askRag(trimmed);

      const botContent = hasContext
        ? answer
        : "Üzgünüm, bu konuda yeterli bilgi bulamadım. Daha farklı bir şekilde sorabilir misin?";

      const botMsg: Message = {
        id: crypto.randomUUID(),
        role: "bot",
        content: botContent,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <section
      id="bilgi-asistani"
      className="relative overflow-hidden py-14 lg:py-20"
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--primary) / 0.05) 0%, hsl(var(--accent) / 0.04) 50%, hsl(var(--background)) 100%)",
      }}
    >
      <div className="container relative z-10 mx-auto max-w-3xl px-4">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5">
            <MessageCircleQuestion className="h-4 w-4 text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">
              Yapay Zekâ Destekli
            </span>
          </div>
          <h2 className="mb-3 text-3xl font-bold leading-tight text-foreground md:text-4xl">
            CorteQS Hakkında <span className="text-primary">Sor</span>
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            CorteQS ile ilgili merak ettiğin her şeyi sor, anında yanıt al.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-primary/5">
          <div className="border-b border-border bg-background/50 px-6 py-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card"
                  style={{ background: "hsl(var(--primary))" }}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  CorteQS Asistan
                </p>
                <p className="text-xs text-muted-foreground">
                  {loading ? "Yazıyor..." : "Online"}
                </p>
              </div>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="h-[380px] space-y-4 overflow-y-auto bg-gradient-to-b from-background/30 to-transparent p-6"
          >
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <p className="text-center text-sm text-muted-foreground">
                  Sorunu yaz, sana yardımcı olayım!
                </p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "bot" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-tr-sm bg-primary text-primary-foreground"
                      : "rounded-tl-sm bg-muted text-foreground"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent shadow">
                    <span className="text-xs font-bold text-accent-foreground">S</span>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                  <div className="flex gap-1.5">
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="mx-auto max-w-md rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-center text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <div className="border-t border-border bg-card p-4">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Sorunu yaz..."
                rows={1}
                disabled={loading}
                className="max-h-32 min-h-[40px] flex-1 resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={!input.trim() || loading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Gönder"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RagChat;
