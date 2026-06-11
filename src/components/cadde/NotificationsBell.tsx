// Bildirim zili — Faz 7 (spec §17.2): unread badge + dropdown + deep link +
// tekil/yekun okundu işaretleme. Realtime yalnız alıcının kanalını dinler (§17.3);
// yeni satır gelince query invalidate edilir (stream yok).

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";

import { useAuth } from "@/components/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationDeepLink,
  subscribeToMyNotifications,
} from "@/lib/cadde-notifications-api";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";

const formatRelative = (value: string): string => {
  const diffMinutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (diffMinutes < 1) return "şimdi";
  if (diffMinutes < 60) return `${diffMinutes} dk`;
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `${hours} sa`;
  return `${Math.floor(hours / 24)} g`;
};

const NotificationsBell = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  const notificationsQuery = useQuery({
    queryKey: caddeQueryKeys.notifications(userId),
    queryFn: () => listMyNotifications(userId ?? ""),
    enabled: Boolean(userId),
  });

  useEffect(() => {
    if (!userId) return;
    return subscribeToMyNotifications(userId, () => {
      void queryClient.invalidateQueries({ queryKey: caddeQueryKeys.notificationsRoot });
    });
  }, [userId, queryClient]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: caddeQueryKeys.notificationsRoot });

  const markOneMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: invalidate,
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(userId ?? ""),
    onSuccess: invalidate,
  });

  if (!userId) return null;

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative h-9 rounded-full px-3" aria-label="Bildirimler">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="text-sm font-semibold">Bildirimler</p>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => markAllMutation.mutate()}
              className="text-xs font-medium text-orange-700 hover:underline"
              disabled={markAllMutation.isPending}
            >
              Tümünü okundu işaretle
            </button>
          ) : null}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {notificationsQuery.isLoading ? "Yükleniyor..." : "Bildirim yok."}
            </p>
          ) : (
            notifications.map((notification) => (
              <Link
                key={notification.id}
                to={notificationDeepLink(notification)}
                onClick={() => {
                  if (!notification.isRead) markOneMutation.mutate(notification.id);
                }}
                className={`block border-b border-border/60 px-3 py-2.5 transition hover:bg-accent ${notification.isRead ? "opacity-70" : "bg-orange-50/50"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900">{notification.title}</p>
                  <span className="shrink-0 text-[10px] text-slate-400">{formatRelative(notification.createdAt)}</span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{notification.message}</p>
              </Link>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBell;
