import { Bot, User as UserIcon } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/lib/chatConfig";

type Props = {
  message: ChatMessageType;
};

const ChatMessage = ({ message }: Props) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow">
          <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
      <div className={`flex max-w-[80%] flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "rounded-tr-sm bg-primary text-primary-foreground"
              : `rounded-tl-sm bg-muted text-foreground ${message.isSummary ? "font-mono text-xs" : ""}`
          }`}
        >
          {message.content.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={i} className="font-semibold">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </div>
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent shadow">
          <UserIcon className="h-4 w-4 text-accent-foreground" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
