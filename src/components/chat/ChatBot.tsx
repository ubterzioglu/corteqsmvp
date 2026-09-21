import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";

import ChatWindow from "@/components/chat/ChatWindow";
import { useAuth } from "@/components/auth/useAuth";
import { appendSources, toAssistantHistory } from "@/components/chat/chatbot-message-helpers";
import { askSiteAssistant } from "@/lib/site-assistant-api";
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
  "Merhaba! Ben CorteQS bilgi asistanıyım. Dizindeki kişi ve kurumlar ile blog rehberlerimiz hakkında sorularını yanıtlayabilirim.";

/** Asistan üyelere açıktır ve para harcar — edge function anonim çağrıyı 401 ile reddeder.
 *  Ziyaretçiye bunu istek GÖNDERMEDEN söylemek, 401'i hata gibi göstermekten iyidir. */
const GUEST_MESSAGE =
  "Bilgi asistanını kullanmak için giriş yapman gerekiyor. Giriş yaptıktan sonra dizindeki kayıtlar ve rehberler hakkında soru sorabilirsin.";

/** Bilgi tabanında eşleşme bulunamadığında modelin yanıtı yerine bu gösterilir. */
const NO_CONTEXT_MESSAGE =
  "Bu konuda kayıtlarımızda bir şey bulamadım. Soruyu farklı bir şekilde sorabilir ya da şehir/meslek gibi bir ayrıntı ekleyebilir misin?";

const NON_HISTORY_MESSAGES = [INITIAL_MESSAGE, GUEST_MESSAGE, NO_CONTEXT_MESSAGE];

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
  const { user } = useAuth();

  const askQuestion = useCallback(
    async (input: string) => {
      const trimmedInput = input.trim();
      if (!trimmedInput) return;

      // Ziyaretçiye istek GÖNDERİLMEZ. Edge function anonim çağrıyı 401 ile
      // reddediyor; o hatayı "asistana ulaşılamıyor" diye göstermek yanıltıcı olurdu.
      if (!user) {
        setState((current) => ({
          ...current,
          loading: false,
          error: null,
          messages: [
            ...current.messages,
            createMessage("user", trimmedInput),
            createMessage("bot", GUEST_MESSAGE),
          ],
        }));
        return;
      }

      // Geçmiş, yeni soruyla birlikte tek seferde kurulur; asistan çok turlu çalışıyor.
      const history = toAssistantHistory(
        [...state.messages, createMessage("user", trimmedInput)],
        NON_HISTORY_MESSAGES,
      );

      setState((current) => ({
        ...current,
        loading: true,
        error: null,
        messages: [...current.messages, createMessage("user", trimmedInput)],
      }));

      try {
        const { answer, hasContext, sources } = await askSiteAssistant(history);
        // `hasContext` artık sunucuda gerçekten hesaplanıyor; eşleşme yoksa modelin
        // serbest yanıtı yerine dürüst bir "bulamadım" gösterilir.
        const botAnswer = hasContext ? appendSources(answer, sources) : NO_CONTEXT_MESSAGE;

        setState((current) => ({
          ...current,
          loading: false,
          error: null,
          messages: [...current.messages, createMessage("bot", botAnswer)],
        }));
      } catch (error: unknown) {
        const fallbackMessage =
          error instanceof Error && error.message
            ? error.message
            : "Bilgi asistanına şu anda ulaşılamıyor. Lütfen birazdan tekrar dene.";
        setState((current) => ({
          ...current,
          loading: false,
          error: fallbackMessage,
          messages: [...current.messages, createMessage("bot", fallbackMessage)],
        }));
      }
    },
    [state.messages, user],
  );

  // `askQuestion` her mesajda yeniden kurulur (geçmişi kapsıyor). Dinleyicinin her
  // seferinde sökülüp takılmaması için en güncel sürüm ref üzerinden okunur.
  const askQuestionRef = useRef(askQuestion);
  useEffect(() => {
    askQuestionRef.current = askQuestion;
  }, [askQuestion]);

  useEffect(() => {
    const handleSelectCity = (event: Event) => {
      const detail = (event as CustomEvent<{ city?: string }>).detail || {};
      const city = detail.city?.trim();
      if (!city) return;

      void askQuestionRef.current(`${city} için diaspora açısından kısa bir rehber paylaşır mısın?`);
    };

    window.addEventListener("corteqs:select-city", handleSelectCity as EventListener);
    return () => {
      window.removeEventListener("corteqs:select-city", handleSelectCity as EventListener);
    };
  }, []);

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
