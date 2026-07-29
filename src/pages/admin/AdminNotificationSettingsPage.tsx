// Bildirim Ayarları — admin sayfası.
// İki e-posta bildiriminin genel anahtarlarını, giriş yapan kişinin kendi aboneliğini ve
// son gönderim kayıtlarını yönetir. DB katmanı: src/lib/admin-shell/notification-settings-api.ts
// (mig 20260729100000 — tüm erişim security-definer RPC'ler üzerinden).
//
// Yetki iki kademelidir: genel anahtarları yalnız admin değiştirebilir, kişisel abonelik
// tüm moderator'lara açıktır. isAdmin bilgisi RPC'den gelir — UI kendi başına karar vermez.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Send } from "lucide-react";

import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
  AdminPageShell,
  AdminStatusBadge,
  type AdminStatusTone,
} from "@/components/admin/page";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { adminQueryKeys } from "@/lib/admin-shell/admin-query-keys";
import {
  NOTIFICATION_EVENT_LABELS,
  NOTIFICATION_SETTING_KEYS,
  OUTBOX_STATUS_LABELS,
  dispatchPendingNotifications,
  fetchAdminNotificationState,
  setMyNotificationSubscription,
  setNotificationSetting,
  type AdminNotificationState,
  type NotificationSettingKey,
  type OutboxStatus,
} from "@/lib/admin-shell/notification-settings-api";

const STATUS_TONES: Record<OutboxStatus, AdminStatusTone> = {
  pending: "info",
  sent: "success",
  failed: "danger",
  skipped: "neutral",
};

function formatDateTime(value: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type ToggleRowProps = {
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
};

function ToggleRow({ title, description, checked, disabled, onCheckedChange, label }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch
        aria-label={label}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

const AdminNotificationSettingsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const stateQuery = useQuery({
    queryKey: adminQueryKeys.notificationState(),
    queryFn: fetchAdminNotificationState,
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

  if (stateQuery.isLoading) {
    return (
      <AdminPageShell title="Bildirim Ayarları" icon={BellRing} accent="red">
        <AdminLoadingState />
      </AdminPageShell>
    );
  }

  if (stateQuery.isError || !stateQuery.data) {
    return (
      <AdminPageShell title="Bildirim Ayarları" icon={BellRing} accent="red">
        <AdminErrorState
          description={
            stateQuery.error instanceof Error
              ? stateQuery.error.message
              : "Bildirim ayarları okunamadı."
          }
          onRetry={() => stateQuery.refetch()}
        />
      </AdminPageShell>
    );
  }

  const state: AdminNotificationState = stateQuery.data;
  const settingsBusy = settingMutation.isPending;
  const subscriptionBusy = subscriptionMutation.isPending;

  const updateSubscription = (patch: Partial<{ newMemberEmail: boolean; adminUpdateEmail: boolean }>) => {
    subscriptionMutation.mutate({
      newMemberEmail: state.myNewMemberEmail,
      adminUpdateEmail: state.myAdminUpdateEmail,
      ...patch,
    });
  };

  // Kişisel tercih açık ama genel anahtar kapalıysa hiç mail gitmez — tercih silinmez,
  // yalnız uyarılır. Kullanıcının "açtım ama gelmiyor" sorusunun cevabı budur.
  const mutedWarnings = [
    state.myNewMemberEmail && !state.newMemberEnabled ? "yeni üye" : null,
    state.myAdminUpdateEmail && !state.adminUpdateEnabled ? "güncelleme" : null,
  ].filter((value): value is string => value !== null);

  return (
    <AdminPageShell
      title="Bildirim Ayarları"
      description="Yeni üye kayıtları ve ürün güncellemeleri için e-posta bildirimlerini yönet."
      eyebrow="Sistem"
      icon={BellRing}
      accent="red"
      actions={
        state.isAdmin ? (
          <Button
            variant="outline"
            disabled={dispatchMutation.isPending || state.pendingCount === 0}
            onClick={() => dispatchMutation.mutate()}
          >
            <Send className="mr-2 h-4 w-4" />
            {state.pendingCount > 0
              ? `Bekleyen ${state.pendingCount} kaydı şimdi gönder`
              : "Bekleyen kayıt yok"}
          </Button>
        ) : null
      }
      contentWidth="default"
    >
      <div className="space-y-8">
        {mutedWarnings.length > 0 ? (
          <p
            role="status"
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200"
          >
            Genel anahtar kapalı olduğu için {mutedWarnings.join(" ve ")} bildirimleri kimseye
            gitmiyor. Tercihin korunuyor; anahtarı bir admin açtığında mailler akmaya başlar.
          </p>
        ) : null}

        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">Genel anahtarlar</h2>
            <p className="text-sm text-muted-foreground">
              {state.isAdmin
                ? "Kapalıyken hiçbir aboneye mail gitmez. Tüm platform için geçerlidir."
                : "Bu anahtarları yalnız admin yetkisi olanlar değiştirebilir."}
            </p>
          </div>

          <ToggleRow
            title="Yeni üye bildirimleri açık"
            description="Siteye yeni bir üye kaydolup e-postasını doğruladığında abonelere mail gider."
            checked={state.newMemberEnabled}
            disabled={!state.isAdmin || settingsBusy}
            label="Yeni üye bildirimleri açık"
            onCheckedChange={(checked) =>
              settingMutation.mutate({ key: NOTIFICATION_SETTING_KEYS.newMember, enabled: checked })
            }
          />

          <ToggleRow
            title="Güncelleme bildirimleri açık"
            description="Admin panelinde yeni bir ürün güncellemesi yayınlandığında abonelere mail gider."
            checked={state.adminUpdateEnabled}
            disabled={!state.isAdmin || settingsBusy}
            label="Güncelleme bildirimleri açık"
            onCheckedChange={(checked) =>
              settingMutation.mutate({ key: NOTIFICATION_SETTING_KEYS.adminUpdate, enabled: checked })
            }
          />
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">Kendi aboneliğim</h2>
            <p className="text-sm text-muted-foreground">
              Yalnız senin hesabın için geçerlidir; diğer yöneticileri etkilemez.
            </p>
          </div>

          <ToggleRow
            title="Yeni üye kaydolduğunda bana mail gelsin"
            description="Her yeni üye için ayrı bir bildirim maili alırsın."
            checked={state.myNewMemberEmail}
            disabled={subscriptionBusy}
            label="Yeni üye kaydolduğunda bana mail gelsin"
            onCheckedChange={(checked) => updateSubscription({ newMemberEmail: checked })}
          />

          <ToggleRow
            title="Yeni güncelleme yayınlandığında bana mail gelsin"
            description="Ürün güncellemeleri listesine eklenen her kayıt için mail alırsın."
            checked={state.myAdminUpdateEmail}
            disabled={subscriptionBusy}
            label="Yeni güncelleme yayınlandığında bana mail gelsin"
            onCheckedChange={(checked) => updateSubscription({ adminUpdateEmail: checked })}
          />
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">Son gönderimler</h2>
            <p className="text-sm text-muted-foreground">
              En son 20 kayıt. "Atlandı", genel anahtarın kapalı olduğu ya da hiç abone
              bulunmadığı anlamına gelir.
            </p>
          </div>

          {state.recent.length === 0 ? (
            <AdminEmptyState
              title="Henüz gönderim yok"
              description="Bildirim kuyruğuna düşen ilk kayıttan sonra burada listelenir."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3 font-medium">Tür</th>
                    <th className="p-3 font-medium">Konu</th>
                    <th className="p-3 font-medium">Durum</th>
                    <th className="p-3 font-medium">Alıcı</th>
                    <th className="p-3 font-medium">Oluşturuldu</th>
                    <th className="p-3 font-medium">Gönderim zamanı</th>
                  </tr>
                </thead>
                <tbody>
                  {state.recent.map((entry) => (
                    <tr key={entry.id} className="border-t border-border/60 align-top">
                      <td className="p-3 whitespace-nowrap">
                        {NOTIFICATION_EVENT_LABELS[entry.eventType]}
                      </td>
                      <td className="p-3">
                        <span className="block max-w-md truncate" title={entry.summary}>
                          {entry.summary}
                        </span>
                        {entry.lastError ? (
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {entry.lastError}
                          </span>
                        ) : null}
                      </td>
                      <td className="p-3">
                        <AdminStatusBadge tone={STATUS_TONES[entry.status]}>
                          {OUTBOX_STATUS_LABELS[entry.status]}
                        </AdminStatusBadge>
                      </td>
                      <td className="p-3 whitespace-nowrap">{entry.recipientCount ?? "-"}</td>
                      <td className="p-3 whitespace-nowrap">{formatDateTime(entry.createdAt)}</td>
                      <td className="p-3 whitespace-nowrap">{formatDateTime(entry.sentAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminPageShell>
  );
};

export default AdminNotificationSettingsPage;
