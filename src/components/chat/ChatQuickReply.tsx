import type { QuickReply as QuickReplyType } from "@/lib/chatConfig";

type Props = {
  replies: QuickReplyType[];
  onSelect: (value: string) => void;
  disabled?: boolean;
};

const ChatQuickReply = ({ replies, onSelect, disabled }: Props) => {
  if (!replies.length) return null;

  return (
    <div className="flex flex-wrap gap-2 pl-11">
      {replies.map((reply) => (
        <button
          key={reply.value}
          type="button"
          onClick={() => onSelect(reply.value)}
          disabled={disabled}
          className="rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary transition-all hover:border-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {reply.label}
        </button>
      ))}
    </div>
  );
};

export default ChatQuickReply;
