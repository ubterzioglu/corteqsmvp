import { useEffect, useRef, useState } from "react";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatQuickReply from "@/components/chat/ChatQuickReply";
import ChatInput from "@/components/chat/ChatInput";
import ChatProgressBar from "@/components/chat/ChatProgressBar";
import type { ChatState } from "@/hooks/useChatMachine";
import { getProgressInfo } from "@/lib/chatConfig";
import chatbotMascot from "../../../lmaskot.png";

type Props = {
  state: ChatState;
  onSendMessage: (input: string) => void;
  onSelectQuickReply: (value: string) => void;
  onUploadFiles: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  assistantTitle?: string;
  assistantStatus?: string;
  loadingOverride?: boolean;
  errorOverride?: string | null;
  allowInputAfterSubmit?: boolean;
  showProgress?: boolean;
};

const ChatWindow = ({
  state,
  onSendMessage,
  onSelectQuickReply,
  onUploadFiles,
  onRemoveFile,
  assistantTitle = "CorteQS Asistanı",
  assistantStatus,
  loadingOverride,
  errorOverride,
  allowInputAfterSubmit = false,
  showProgress = true,
}: Props) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isLoading = loadingOverride ?? state.loading;
  const errorMessage = errorOverride ?? state.error;
  const inputLocked = state.submitted && !allowInputAfterSubmit;

  const { percentage } = getProgressInfo(state.step, state.data);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [isLoading, state.messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInput("");
  };

  const handleFileSelect = (fileList: FileList) => {
    onUploadFiles(Array.from(fileList));
  };

  const lastMessage = state.messages[state.messages.length - 1];
  const showQuickReplies =
    !inputLocked &&
    !isLoading &&
    lastMessage?.role === "bot" &&
    lastMessage?.quickReplies &&
    lastMessage.quickReplies.length > 0;

  const showFileInput =
    state.step === "documents" || state.step === "documents_add_more";

  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-primary/5">
      <div className="border-b border-border bg-background/50 px-6 py-3.5 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-primary/15 bg-white shadow-lg shadow-primary/20">
                <img src={chatbotMascot} alt="CorteQS chatbot logosu" className="h-full w-full object-cover" />
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card"
                style={{ background: "hsl(var(--primary))" }}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {assistantTitle}
              </p>
              <p className="text-xs text-muted-foreground">
                {assistantStatus ?? (state.submitted ? "Kayıt tamamlandı, sorulara devam edebilirsin ✅" : "Online")}
              </p>
            </div>
          </div>
          {showProgress ? (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">İlerleme</p>
              <ChatProgressBar percentage={percentage} />
            </div>
          ) : null}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="h-[320px] space-y-4 overflow-y-auto bg-gradient-to-b from-background/30 to-transparent p-5"
      >
        {state.messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/15 bg-white">
              <img src={chatbotMascot} alt="" className="h-full w-full object-cover" aria-hidden="true" />
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
        {errorMessage && (
          <div className="mx-auto max-w-md rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-center text-sm text-destructive">
            {errorMessage}
          </div>
        )}
      </div>

      {showQuickReplies && (
        <div className="border-t border-border bg-background/40 px-6 py-3">
          <ChatQuickReply
            replies={lastMessage.quickReplies!}
            onSelect={onSelectQuickReply}
            disabled={isLoading || inputLocked}
          />
        </div>
      )}

      <ChatInput
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
        onFileSelect={handleFileSelect}
        documentFiles={state.documentFiles}
        onRemoveFile={onRemoveFile}
        disabled={isLoading}
        loading={isLoading}
        submitted={inputLocked}
        step={state.step}
        showFileInput={showFileInput}
      />
    </div>
  );
};

export default ChatWindow;
