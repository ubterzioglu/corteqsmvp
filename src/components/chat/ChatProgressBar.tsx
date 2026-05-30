import { Progress } from "@/components/ui/progress";

type Props = {
  percentage: number;
};

const ChatProgressBar = ({ percentage }: Props) => {
  return (
    <div className="flex items-center gap-3">
      <Progress value={percentage} className="h-2 flex-1" />
      <span className="text-xs font-bold text-primary whitespace-nowrap">%{percentage}</span>
    </div>
  );
};

export default ChatProgressBar;
