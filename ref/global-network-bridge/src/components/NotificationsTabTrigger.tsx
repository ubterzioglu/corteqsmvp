import { Bell } from "lucide-react";
import { TabsTrigger } from "@/components/ui/tabs";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";

const NotificationsTabTrigger = ({ value = "notifications", className = "" }: { value?: string; className?: string }) => {
  const count = useUnreadNotifications();
  return (
    <TabsTrigger value={value} className={`gap-1.5 relative ${className}`}>
      <Bell className="h-4 w-4" /> Bildirimler
      {count > 0 && (
        <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </TabsTrigger>
  );
};

export default NotificationsTabTrigger;
