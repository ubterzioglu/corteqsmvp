import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, CheckCircle2, FileText, Loader2, MapPin, Paperclip, Send, Sparkles, User as UserIcon, Users, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import RegisterInterestForm from "@/components/RegisterInterestForm";
import { notifySubmission } from "@/lib/mail";
import { uploadSubmissionDocuments, validateSubmissionDocuments } from "@/lib/submissions";

type MatchPreview = {
  id: string;
  fullname: string;
  city: string;
  country: string;
  field: string;
  category: string | null;
  score: number;
  reason: string;
};

type ChatMsg = {
  role: "user" | "assistant";
  content: string;
  matches?: MatchPreview[];
};

type Collected = {
  category?: string;
  fullname?: string;
  country?: string;
  city?: string;
  business?: string;
  field?: string;
  email?: string;
  phone?: string;
  offers_needs?: string;
  referral_code?: string;
  contest_interest?: boolean;
};

type AIResponse = {
  message: string;
  extracted?: Collected;
  request_upload?: boolean;
  status: "in_progress" | "ready_to_submit" | "submit";
  error?: string;
};

type ErrorWithMessage = {
  message?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const maybeMessage = (error as ErrorWithMessage).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim() !== "") {
      return maybeMessage;
    }
  }
  return fallback;
}

const REQUIRED_FIELDS: (keyof Collected)[] = ["category", "fullname", "country", "city", "field", "email", "phone"];

const INITIAL_MESSAGE: ChatMsg = {
  role: "assistant",
  content:
    "Merhaba. Ben CorteQS kayıt asistanıyım. Seni kısa bir sohbetle diaspora ağımıza ekleyebilirim.\n\nKimsin, hangi şehirde yaşıyorsun ve ne iş yapıyorsun?",
};

const ChatRegisterBar = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMsg[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [collected, setCollected] = useState<Collected>({});
  const [docs, setDocs] = useState<File[]>([]);
  const [consent, setConsent] = useState(false);
  const [classicFormOpen, setClassicFormOpen] = useState(false);
  const [presetCity, setPresetCity] = useState<string | undefined>(undefined);
  const [submitted, setSubmitted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const progress = useMemo(() => {
    const done = REQUIRED_FIELDS.filter((field) => !!collected[field]).length;
    return Math.round((done / REQUIRED_FIELDS.length) * 100);
  }, [collected]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === "#kaydol-form") {
        setClassicFormOpen(true);
      }
    };

    const handleSelectCity = (event: Event) => {
      const detail = (event as CustomEvent<{ city?: string; mode?: "ai" | "form" }>).detail || {};
      const city = detail.city?.trim();
      if (!city) return;

      if (detail.mode === "form") {
        setPresetCity(city);
        setClassicFormOpen(true);
        return;
      }

      setCollected((current) => ({ ...current, city }));
      setMessages((current) => {
        if (current.some((msg) => msg.role === "user" && msg.content.includes(`📍 ${city}`))) {
          return current;
        }

        return [
          ...current,
          { role: "user", content: `📍 ${city} şehrindeyim, buradan devam edelim.` },
          {
            role: "assistant",
            content: `${city} olarak not aldım. Şimdi adını ve ne iş yaptığını söyleyebilir misin?`,
          },
        ];
      });
    };

    checkHash();
    window.addEventListener("hashchange", checkHash);
    window.addEventListener("corteqs:select-city", handleSelectCity as EventListener);

    return () => {
      window.removeEventListener("hashchange", checkHash);
      window.removeEventListener("corteqs:select-city", handleSelectCity as EventListener);
    };
  }, []);

  const callAI = async (history: ChatMsg[], nextCollected: Collected) => {
    const { data, error } = await supabase.functions.invoke<AIResponse>("chat-register", {
      body: { messages: history, collected: nextCollected },
    });
    if (error) throw error;
    if (!data) throw new Error("AI cevabı alınamadı");
    if (data.error) throw new Error(data.error);
    return data;
  };

  const findMatches = async (payload: {
    sourceSubmissionId?: string;
    offers_needs?: string;
    field?: string;
    city?: string;
    country?: string;
    category?: string;
    persist?: boolean;
  }): Promise<MatchPreview[]> => {
    if (!consent) return [];
    if (!payload.offers_needs || payload.offers_needs.trim().length < 5) return [];
    try {
      const { data, error } = await supabase.functions.invoke<{ matches: MatchPreview[] }>("find-matches", {
        body: payload,
      });
      if (error) throw error;
      return data?.matches ?? [];
    } catch (error) {
      console.error("find-matches error:", error);
      return [];
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const nextFiles = Array.from(files);
    const validation = validateSubmissionDocuments(nextFiles, docs);

    if (!validation.ok) {
      toast({
        title: "Dosya eklenemedi",
        description: validation.message,
        variant: "destructive",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setDocs(validation.files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submitToDatabase = async () => {
    setLoading(true);
    try {
      const uploadedDocs = await uploadSubmissionDocuments(docs);
      const insertData = {
        form_type: "register",
        source_type: "chatbot",
        category: collected.category ?? null,
        fullname: collected.fullname ?? "",
        country: collected.country ?? "",
        city: collected.city ?? "",
        business: collected.business ?? null,
        field: collected.field ?? "",
        email: collected.email ?? "",
        phone: (collected.phone ?? "").replace(/[\s\-().]/g, ""),
        offers_needs: collected.offers_needs ?? null,
        contest_interest: collected.contest_interest ?? false,
        document_url: uploadedDocs[0]?.url ?? null,
        document_name: uploadedDocs[0]?.name ?? null,
        documents: uploadedDocs,
        referral_code: collected.referral_code?.toUpperCase() ?? null,
        referral_source: "ai-chat",
        consent: true,
        status: "new",
      };

      const { data: inserted, error } = await supabase.from("submissions").insert(insertData).select("id").single();
      if (error) throw error;

      try {
        if (inserted?.id) {
          await notifySubmission(inserted.id);
        }
      } catch (notificationError) {
        console.error("Mail notification error:", notificationError);
      }

      setSubmitted(true);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "Kaydın başarıyla alındı. Platform açıldığında ilk haber alanlardan biri olacaksın.",
        },
      ]);
      toast({ title: "Kaydınız alındı", description: "Teşekkürler. Yakında iletişime geçeceğiz." });

      if (collected.offers_needs && inserted?.id) {
        const finalMatches = await findMatches({
          sourceSubmissionId: inserted.id,
          offers_needs: collected.offers_needs,
          field: collected.field,
          city: collected.city,
          country: collected.country,
          category: collected.category,
          persist: true,
        });

        if (finalMatches.length > 0) {
          setMessages((current) => [
            ...current,
            {
              role: "assistant",
              content: `${finalMatches.length} potansiyel eşleşme kayda alındı. Uygun yönlendirmeler admin incelemesiyle devam edecek.`,
              matches: finalMatches,
            },
          ]);
        }
      }
    } catch (error: unknown) {
      console.error("Chat submit error:", error);
      toast({
        title: "Bir hata oluştu",
        description: getErrorMessage(error, "Lütfen tekrar deneyin."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading || submitted) return;

    if (!consent) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "AI destekli kayıt için önce kişisel veriler ve üçüncü taraf AI işleme onay kutusunu işaretlemen gerekiyor.",
        },
      ]);
      return;
    }

    const userMsg: ChatMsg = { role: "user", content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const ai = await callAI(newHistory, collected);
      const nextCollected = { ...collected, ...(ai.extracted ?? {}) };
      setCollected(nextCollected);
      setMessages((current) => [...current, { role: "assistant", content: ai.message }]);

      if (ai.status === "ready_to_submit" && nextCollected.offers_needs) {
        const preview = await findMatches({
          offers_needs: nextCollected.offers_needs,
          field: nextCollected.field,
          city: nextCollected.city,
          country: nextCollected.country,
          category: nextCollected.category,
          persist: false,
        });

        if (preview.length > 0) {
          setMessages((current) => [
            ...current,
            {
              role: "assistant",
              content: `${preview.length} potansiyel eşleşme buldum. Kaydı tamamlarsan bunu değerlendirme akışına alacağız.`,
              matches: preview,
            },
          ]);
        }
      }

      if (ai.status === "submit") {
        if (!consent) {
          setMessages((current) => [
            ...current,
            {
              role: "assistant",
              content: "Son adım olarak aşağıdaki onay kutusunu işaretle ve Kaydı Tamamla butonuna bas.",
            },
          ]);
        } else {
          await submitToDatabase();
        }
      }
    } catch (error: unknown) {
      console.error(error);
      toast({
        title: "AI asistanına ulaşılamadı",
        description: getErrorMessage(error, "Lütfen tekrar deneyin."),
        variant: "destructive",
      });
      setMessages((current) => [...current, { role: "assistant", content: "Şu anda bir sorun yaşadım. Bir kez daha deneyebilir misin?" }]);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = REQUIRED_FIELDS.every((field) => !!collected[field]) && consent && !submitted && !loading;

  return (
    <section
      id="kaydol"
      className="relative overflow-hidden bg-background py-16 lg:py-24"
    >
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-45"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80"
        aria-hidden="true"
      >
        <source src="https://videos.pexels.com/video-files/3255275/3255275-uhd_2560_1440_25fps.mp4" type="video/mp4" />
      </video>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-background/85 via-background/70 to-background/92" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,hsl(var(--primary)/0.18),transparent_34%),radial-gradient(circle_at_82%_30%,hsl(var(--accent)/0.14),transparent_32%)]" aria-hidden="true" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto mb-10 max-w-3xl rounded-3xl border border-white/40 bg-background/70 px-6 py-8 text-center shadow-2xl shadow-primary/10 backdrop-blur-xl md:px-10 md:py-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Akıllı Kayıt Deneyimi</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold leading-tight text-foreground md:text-5xl">
            Formu Unut. <span className="text-accent">Sohbet Et.</span>
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            AI asistanımız seninle konuşarak kısa sürede kaydını oluşturur. İstersen klasik forma da geçebilirsin.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <span className="text-sm text-muted-foreground">Sohbet yerine klasik form mu istiyorsun?</span>
            <button
              type="button"
              onClick={() => setClassicFormOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-primary/30 bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-primary hover:bg-primary/5"
            >
              <FileText className="h-4 w-4 text-primary" />
              Ben Form Dolduracağım
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-primary/5">
          <div className="border-b border-border bg-background/50 px-6 py-4 backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card" style={{ background: "hsl(var(--primary))" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">CorteQS AI Asistanı</p>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">İlerleme</p>
                <p className="text-sm font-bold text-primary">%{progress}</p>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div ref={scrollRef} className="h-[420px] space-y-4 overflow-y-auto bg-gradient-to-b from-background/30 to-transparent p-6">
            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                {message.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div className={`flex max-w-[80%] flex-col gap-2 ${message.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "rounded-tr-sm bg-primary text-primary-foreground"
                        : "rounded-tl-sm bg-muted text-foreground"
                    }`}
                  >
                    {message.content}
                  </div>
                  {message.matches && message.matches.length > 0 && (
                    <div className="grid w-full gap-2">
                      {message.matches.map((match) => (
                        <div key={match.id} className="rounded-xl border border-primary/20 bg-card/80 p-3 shadow-sm backdrop-blur">
                          <div className="mb-1 flex items-start justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-accent/80">
                                <Users className="h-3.5 w-3.5 text-primary-foreground" />
                              </div>
                              <p className="truncate text-sm font-semibold text-foreground">{match.fullname || "Potansiyel eşleşme"}</p>
                            </div>
                            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                              %{Math.round(match.score)}
                            </span>
                          </div>
                          {(match.city || match.country || match.field) ? (
                            <div className="mb-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">
                                {[match.city, match.country].filter(Boolean).join(", ") || "Konum paylaşılmıyor"}
                                {match.field ? ` · ${match.field}` : ""}
                              </span>
                            </div>
                          ) : null}
                          <p className="text-xs leading-snug text-foreground/80">{match.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent shadow">
                    <UserIcon className="h-4 w-4 text-accent-foreground" />
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
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {docs.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-border bg-background/40 px-6 py-3">
              {docs.map((file, index) => (
                <span key={`${file.name}-${index}`} className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                  <Paperclip className="h-3 w-3" />
                  {file.name}
                  <button type="button" onClick={() => setDocs(docs.filter((_, currentIndex) => currentIndex !== index))} className="hover:text-destructive" aria-label="Kaldır">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="border-t border-border bg-card p-4">
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitted || docs.length >= 5}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50"
                aria-label="Dosya ekle"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(event) => handleFiles(event.target.files)}
              />
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder={submitted ? "Kayıt tamamlandı" : "Mesajını yaz veya soruya cevap ver..."}
                rows={1}
                disabled={submitted || loading}
                className="max-h-32 min-h-[40px] flex-1 resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={!input.trim() || loading || submitted}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Gönder"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>

            <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <label className="flex cursor-pointer items-start gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} disabled={submitted} className="mt-0.5 rounded border-input" />
                <span className="leading-relaxed">Kişisel verilerimin CorteQS ve gerekli AI altyapıları tarafından kayıt ve eşleştirme amacıyla işlenmesini onaylıyorum.</span>
              </label>
              {canSubmit && (
                <button
                  type="button"
                  onClick={() => void submitToDatabase()}
                  disabled={loading}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Kaydı Tamamla
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <RegisterInterestForm
        open={classicFormOpen}
        onOpenChange={(open) => {
          setClassicFormOpen(open);
          if (!open) setPresetCity(undefined);
        }}
        defaultCity={presetCity}
      />
    </section>
  );
};

export default ChatRegisterBar;
