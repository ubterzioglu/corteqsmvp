// Bildirim e-postası ayarları — ortak veri/mutation katmanı.
// İki tüketici var: topbar'daki AdminNotificationMenu (hızlı aç/kapa) ve
// /admin/notifications sayfası (tam görünüm + gönderim logu). Aynı React Query
// anahtarını paylaştıkları için birinde yapılan değişiklik diğerine anında yansır.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/hooks/use-toast";
import { adminQueryKeys } from "@/lib/admin-shell/admin-query-keys";
import {
  NOTIFICATION_SETTING_KEYS,
  dispatchPendingNotifications,
  fetchAdminNotificationState,
  sendWelcomeEmailPreview,
  setMyNotificationSubscription,
  setNotificationSetting,
  type AdminNotificationState,
  type NotificationSettingKey,
} from "@/lib/admin-shell/notification-settings-api";

// Topbar her admin sayfasında render edilir; her gezinmede RPC atmamak için
// makul bir tazelik penceresi.
const STALE_TIME_MS = 60_000;

export type NotificationSubscriptionPatch = Partial<{
  newMemberEmail: boolean;
  adminUpdateEmail: boolean;
  revisionRequestEmail: boolean;
}>;

export function useNotificationSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: adminQueryKeys.notificationState(),
    queryFn: fetchAdminNotificationState,
    staleTime: STALE_TIME_MS,
    // Yetkisiz kullanıcıda RPC 'forbidden' atar; tekrar denemenin anlamı yok.
    retry: false,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.notificationState() });

  const notifyError = (error: unknown, fallback: string) => {
    toast({
      title: fallback,
      description: error instanceof Error ? error.message : undefined,
      variant: "destructive",
    });
  };

  const settingMutation = useMutation({
    mutationFn: ({ key, enabled }: { key: NotificationSettingKey; enabled: boolean }) =>
      setNotificationSetting(key, enabled),
    onSuccess: async () => {
      await invalidate();
      toast({ title: "Genel anahtar güncellendi" });
    },
    onError: (error: unknown) => notifyError(error, "Genel anahtar güncellenemedi"),
  });

  const subscriptionMutation = useMutation({
    mutationFn: setMyNotificationSubscription,
    onSuccess: async () => {
      await invalidate();
      toast({ title: "Aboneliğin güncellendi" });
    },
    onError: (error: unknown) => notifyError(error, "Aboneliğin güncellenemedi"),
  });

  const dispatchMutation = useMutation({
    mutationFn: dispatchPendingNotifications,
    onSuccess: async (result) => {
      await invalidate();
      toast({
        title: "Kuyruk işlendi",
        description: `${result.processed} kayıt işlendi — ${result.sent} gönderildi, ${result.skipped} atlandı, ${result.failed} başarısız.`,
      });
    },
    onError: (error: unknown) => notifyError(error, "Kuyruk işlenemedi"),
  });

  // Örnek mail kuyruğa dokunmaz → state'i invalidate etmeye gerek yok.
  const welcomePreviewMutation = useMutation({
    mutationFn: sendWelcomeEmailPreview,
    onSuccess: (sentTo) => {
      toast({
        title: "Örnek mail gönderildi",
        description: sentTo
          ? `${sentTo} adresini kontrol et. Spam klasörüne de bak.`
          : "Gelen kutunu kontrol et. Spam klasörüne de bak.",
      });
    },
    onError: (error: unknown) => notifyError(error, "Örnek mail gönderilemedi"),
  });

  const state: AdminNotificationState | undefined = query.data;

  /** Tek bir tercihi değiştirirken diğerini olduğu gibi korur. */
  const updateSubscription = (patch: NotificationSubscriptionPatch) => {
    if (!state) return;
    subscriptionMutation.mutate({
      newMemberEmail: state.myNewMemberEmail,
      adminUpdateEmail: state.myAdminUpdateEmail,
      revisionRequestEmail: state.myRevisionRequestEmail,
      ...patch,
    });
  };

  const setGlobal = (key: NotificationSettingKey, enabled: boolean) =>
    settingMutation.mutate({ key, enabled });

  // Kişisel tercihi açık ama genel anahtarı kapalı olan türler: kullanıcı mail
  // bekler ama gitmez. Uyarı metni bu listeden üretilir.
  const mutedTypes = state
    ? [
        state.myNewMemberEmail && !state.newMemberEnabled ? "yeni üye" : null,
        state.myAdminUpdateEmail && !state.adminUpdateEnabled ? "güncelleme" : null,
        state.myRevisionRequestEmail && !state.revisionRequestEnabled
          ? "revizyon isteği"
          : null,
      ].filter((value): value is string => value !== null)
    : [];

  /** Kullanıcı fiilen en az bir bildirim alıyor mu (kişisel AÇIK + genel AÇIK). */
  const isReceiving = Boolean(
    state &&
      ((state.myNewMemberEmail && state.newMemberEnabled) ||
        (state.myAdminUpdateEmail && state.adminUpdateEnabled) ||
        (state.myRevisionRequestEmail && state.revisionRequestEnabled)),
  );

  return {
    state,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    settingsBusy: settingMutation.isPending,
    subscriptionBusy: subscriptionMutation.isPending,
    dispatchBusy: dispatchMutation.isPending,
    welcomePreviewBusy: welcomePreviewMutation.isPending,
    setGlobal,
    updateSubscription,
    dispatchPending: () => dispatchMutation.mutate(),
    sendWelcomePreview: () => welcomePreviewMutation.mutate(),
    mutedTypes,
    isReceiving,
    SETTING_KEYS: NOTIFICATION_SETTING_KEYS,
  };
}
