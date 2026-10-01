import { User as UserIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { parseRichText } from "@/components/chat/chatbot-message-helpers";
import type { ChatMessage as ChatMessageType } from "@/lib/chatConfig";

type Props = {
  message: ChatMessageType;
};

const LINK_CLASS = "font-medium underline underline-offset-2";

const ChatMessage = ({ message }: Props) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <img
          src="/lmaskog.png"
          alt=""
          aria-hidden="true"
          className="h-8 w-8 shrink-0 rounded-full object-cover shadow"
        />
      )}
      <div className={`flex max-w-[80%] flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "rounded-tr-sm bg-primary text-primary-foreground"
              : `rounded-tl-sm bg-muted text-foreground ${message.isSummary ? "font-mono text-xs" : ""}`
          }`}
        >
          {parseRichText(message.content).map((segment, i) => {
            if (segment.kind === "bold") {
              return (
                <strong key={i} className="font-semibold">
                  {segment.text}
                </strong>
              );
            }
            if (segment.kind === "link") {
              // Güvenlik sözleşmesi parseRichText'te: hedef ya iç yol ya https.
              return segment.external ? (
                <a
                  key={i}
                  href={segment.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={LINK_CLASS}
                >
                  {segment.text}
                </a>
              ) : (
                <Link key={i} to={segment.href} className={LINK_CLASS}>
                  {segment.text}
                </Link>
              );
            }
            return <span key={i}>{segment.text}</span>;
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
