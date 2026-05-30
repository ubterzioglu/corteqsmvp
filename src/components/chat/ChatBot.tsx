import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Sparkles } from "lucide-react";
import ChatWindow from "@/components/chat/ChatWindow";
import RegisterInterestForm from "@/components/RegisterInterestForm";
import { useChatMachine } from "@/hooks/useChatMachine";
import {
  getStepMessage,
  shouldRedirectToKnowledgeAssistant,
  shouldStartRegistration,
} from "@/lib/chatConfig";
import { askRag } from "@/lib/ragApi";

type ChatBotProps = {
  classicFormMode?: "modal" | "route";
  classicFormHref?: string;
  classicFormLayout?: "inline" | "stacked";
  topLogoSrc?: string;
  topLogoAlt?: string;
  shellVariant?: "gradient" | "plain";
  showIntro?: boolean;
};

const ChatBot = ({
  classicFormMode = "modal",
  classicFormHref = "/form",
  classicFormLayout = "inline",
  topLogoSrc,
  topLogoAlt = "CorteQS Logo",
  shellVariant = "gradient",
  showIntro = true,
}: ChatBotProps) => {
  const {
    state,
    sendMessage,
    goBack,
    selectQuickReply,
    uploadFiles,
    removeFile,
    submit,
    prefillCity,
    beginRegistration,
    appendMessage,
  } = useChatMachine();

  const [classicFormOpen, setClassicFormOpen] = useState(false);
  const [presetCity, setPresetCity] = useState<string | undefined>(undefined);
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);
  const [knowledgeError, setKnowledgeError] = useState<string | null>(null);

  useEffect(() => {
    const handleSelectCity = (event: Event) => {
      const detail =
        (event as CustomEvent<{ city?: string; mode?: "ai" | "form" }>)
          .detail || {};
      const city = detail.city?.trim();
      if (!city) return;

      if (detail.mode === "form") {
        setPresetCity(city);
        setClassicFormOpen(true);
        return;
      }

      prefillCity(city);
    };

    window.addEventListener(
      "corteqs:select-city",
      handleSelectCity as EventListener
    );
    return () => {
      window.removeEventListener(
        "corteqs:select-city",
        handleSelectCity as EventListener
      );
    };
  }, [prefillCity]);

  useEffect(() => {
    if (
      state.step === "summary" &&
      state.messages.length > 0 &&
      state.messages[state.messages.length - 1].role === "user"
    ) {
      void submit();
    }
  }, [state.step, state.messages, submit]);

  const answerKnowledgeQuestion = async (input: string) => {
    appendMessage({ role: "user", content: input });
    setKnowledgeError(null);
    setKnowledgeLoading(true);

    try {
      const { answer, hasContext } = await askRag(input);
      appendMessage({
        role: "bot",
        content: hasContext
          ? answer
          : "Üzgünüm, bu konuda yeterli bilgi bulamadım. Daha farklı bir şekilde sorabilir misin?",
      });

      if (state.step !== "welcome" && !state.submitted) {
        const { content, quickReplies } = getStepMessage(state.step, state.data);
        appendMessage({
          role: "bot",
          content: `Kayıt için kaldığımız yerden devam edelim.\n\n${content}`,
          quickReplies,
        });
      }
    } catch {
      const message = "Bilgi asistanına şu anda ulaşılamıyor. Lütfen birazdan tekrar dene.";
      setKnowledgeError(message);
      appendMessage({ role: "bot", content: message });
    } finally {
      setKnowledgeLoading(false);
    }
  };

  const handleSendMessage = (input: string) => {
    if (knowledgeLoading || state.loading) return;
    setKnowledgeError(null);

    if (state.step === "welcome") {
      if (shouldStartRegistration(input)) {
        beginRegistration(input);
        return;
      }

      void answerKnowledgeQuestion(input);
      return;
    }

    if (state.submitted || shouldRedirectToKnowledgeAssistant(input)) {
      void answerKnowledgeQuestion(input);
      return;
    }

    sendMessage(input);
  };

  const handleSelectQuickReply = (value: string) => {
    if (value === "__confirm__") {
      void submit();
      return;
    }
    if (value === "__go_back__") {
      goBack();
      return;
    }
    selectQuickReply(value);
  };

  const classicFormButton = classicFormMode === "route" ? (
    <Link
      to={classicFormHref}
      className="inline-flex items-center gap-2 rounded-xl border-2 border-primary/30 bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-primary hover:bg-primary/5"
    >
      <FileText className="h-4 w-4 text-primary" />
      Ben Form Dolduracağım
    </Link>
  ) : (
    <button
      type="button"
      onClick={() => setClassicFormOpen(true)}
      className="inline-flex items-center gap-2 rounded-xl border-2 border-primary/30 bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-primary hover:bg-primary/5"
    >
      <FileText className="h-4 w-4 text-primary" />
      Ben Form Dolduracağım
    </button>
  );

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
          Yapay Zeka Destekli Asistan
        </span>
      </div>
      <h2 className="mb-3 text-2xl font-bold leading-tight text-foreground md:text-4xl">
        Sorularını Sor! <span className="text-accent">Kaydını Bırak!</span>
      </h2>
      <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
        Aynı sohbet içinde önce CorteQS hakkında bilgi alabilir, hazır olduğunda kayıt akışına geçebilirsin.
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3">
        <span className="text-sm leading-relaxed text-muted-foreground md:text-base">
          Sohbet yerine klasik form mu istiyorsun?
        </span>
        {classicFormButton}
      </div>
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
          onSendMessage={handleSendMessage}
          onSelectQuickReply={handleSelectQuickReply}
          onUploadFiles={uploadFiles}
          onRemoveFile={removeFile}
          assistantTitle="CorteQS Asistanı"
          assistantStatus={
            state.submitted
              ? "Kayıt tamamlandı, sorularına devam edebilirsin ✅"
              : state.step === "welcome"
                ? "Sorulara cevap verir, istediğinde kayda geçer"
                : "Kayıt modunda, ama sorularını da yanıtlayabilir"
          }
          loadingOverride={state.loading || knowledgeLoading}
          errorOverride={knowledgeError ?? state.error}
          allowInputAfterSubmit
        />
      </div>

      {classicFormMode === "modal" ? (
        <RegisterInterestForm
          open={classicFormOpen}
          onOpenChange={(open) => {
            setClassicFormOpen(open);
            if (!open) setPresetCity(undefined);
          }}
          defaultCity={presetCity}
        />
      ) : null}
    </section>
  );
};

export default ChatBot;
