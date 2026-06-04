import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

import ChatWindow from "@/components/chat/ChatWindow";
import { askRag } from "@/lib/ragApi";
import { INITIAL_DATA, type ChatMessage } from "@/lib/chatConfig";
import type { ChatState } from "@/hooks/useChatMachine";

type ChatBotProps = {
  classicFormMode?: "modal" | "route";
  classicFormHref?: string;
  classicFormLayout?: "inline" | "stacked";
  topLogoSrc?: string;
  topLogoAlt?: string;
  shellVariant?: "gradient" | "plain";
  showIntro?: boolean;
};

const createMessage = (role: ChatMessage["role"], content: string): ChatMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
  timestamp: Date.now(),
});

const INITIAL_MESSAGE =
  "Merhaba! Ben CorteQS bilgi asistanıyım. Platform, diaspora hizmetleri, şehirler, etkinlikler ve profiller hakkında sorularını yanıtlayabilirim.";

const createInitialState = (): ChatState => ({
  step: "welcome",
  messages: [createMessage("bot", INITIAL_MESSAGE)],
  data: { ...INITIAL_DATA },
  documentFiles: [],
  loading: false,
  error: null,
  submitted: false,
  stepHistory: ["welcome"],
  prefillCity: null,
});

const ChatBot = ({
  classicFormMode: _classicFormMode = "modal",
  classicFormHref: _classicFormHref = "/login",
  classicFormLayout: _classicFormLayout = "inline",
  topLogoSrc,
  topLogoAlt = "CorteQS Logo",
  shellVariant = "gradient",
  showIntro = true,
}: ChatBotProps) => {
  const [state, setState] = useState<ChatState>(createInitialState);

  const askQuestion = useCallback(async (input: string) => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    setState((current) => ({
      ...current,
      loading: true,
      error: null,
      messages: [...current.messages, createMessage("user", trimmedInput)],
    }));

    try {
      const { answer, hasContext } = await askRag(trimmedInput);
      const botAnswer = hasContext
        ? answer
        : "Bu konuda şu anda yeterli bağlam bulamadım. Soruyu farklı bir şekilde sorabilir misin?";

      setState((current) => ({
        ...current,
        loading: false,
        error: null,
        messages: [...current.messages, createMessage("bot", botAnswer)],
      }));
    } catch {
      const fallbackMessage = "Bilgi asistanına şu anda ulaşılamıyor. Lütfen birazdan tekrar dene.";
      setState((current) => ({
        ...current,
        loading: false,
        error: fallbackMessage,
        messages: [...current.messages, createMessage("bot", fallbackMessage)],
      }));
    }
  }, []);

  useEffect(() => {
    const handleSelectCity = (event: Event) => {
      const detail = (event as CustomEvent<{ city?: string }>).detail || {};
      const city = detail.city?.trim();
      if (!city) return;

      void askQuestion(`${city} için diaspora açısından kısa bir rehber paylaşır mısın?`);
    };

    window.addEventListener("corteqs:select-city", handleSelectCity as EventListener);
    return () => {
      window.removeEventListener("corteqs:select-city", handleSelectCity as EventListener);
    };
  }, [askQuestion]);

  const useGradientShell = shellVariant === "gradient";
  const introContent = showIntro ? (
    <div className="mx-auto mb-10 max-w-4xl text-center">
      {topLogoSrc ? (
        <div className="mb-5 flex justify-center">
          <img src={topLogoSrc} alt={topLogoAlt} className="h-20 w-auto sm:h-24" />
        </div>
      ) : null}
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Bilgi Asistanı
        </span>
      </div>
      <h2 className="mb-3 text-2xl font-bold leading-tight text-foreground md:text-4xl">
        Sorularını Sor
      </h2>
      <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
        CorteQS üyeliği, diaspora fırsatları, şehirler, rehberler ve platformdaki akışlar hakkında hızlıca bilgi al.
      </p>
    </div>
  ) : null;

  return (
    <section
      id="kaydol"
      className={`relative overflow-hidden ${useGradientShell ? "py-16 lg:py-24" : ""}`}
      style={
        useGradientShell
          ? {
              background:
                "linear-gradient(135deg, hsl(var(--primary) / 0.08) 0%, hsl(var(--accent) / 0.06) 50%, hsl(var(--background)) 100%)",
            }
          : undefined
      }
    >
      {useGradientShell ? (
        <>
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-30 blur-3xl"
            style={{ background: "hsl(var(--accent))" }}
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full opacity-20 blur-3xl"
            style={{ background: "hsl(var(--primary))" }}
          />
        </>
      ) : null}

      <div className={`relative z-10 mx-auto px-4 ${useGradientShell ? "container" : "max-w-2xl py-10 sm:py-12"}`}>
        {introContent}
        <ChatWindow
          state={state}
          onSendMessage={(input) => void askQuestion(input)}
          onSelectQuickReply={() => {}}
          onUploadFiles={() => {}}
          onRemoveFile={() => {}}
          assistantTitle="CorteQS Asistanı"
          assistantStatus="Sorularını yanıtlar ve doğru sayfalara yönlendirir"
          loadingOverride={state.loading}
          errorOverride={state.error}
          allowInputAfterSubmit
          showProgress={false}
        />
      </div>
    </section>
  );
};

export default ChatBot;
