// Admin Panel V2 — bildirim e-postası hızlı aç/kapa menüsü.
// AdminThemeToggle gibi bir KONTROL'dür, navigasyon linki değil — topbar kuralına uyar.
// Ayrıntılı görünüm (gönderim logu, bekleyen kuyruk) /admin/notifications sayfasında.
//
// Zil ikonu (AdminUpdatesMenu) ürün güncellemeleri içindir; bu menü e-posta bildirimlerini
// yönettiği icin zarf ikonu kullanır, ikisi karışmasın.

import { Mail } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useNotificationSettings } from "@/hooks/admin/useNotificationSettings";

type ToggleLineProps = {
  label: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
};

function ToggleLine({ label, checked, disabled, onCheckedChange }: ToggleLineProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-2 py-1.5">
      <span className="text-sm leading-tight">{label}</span>
      <Switch
        aria-label={label}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

const AdminNotificationMenu = () => {
  const {
    state,
    isError,
    settingsBusy,
    subscriptionBusy,
    setGlobal,
    updateSubscription,
    mutedTypes,
    isReceiving,
    SETTING_KEYS,
  } = useNotificationSettings();

  // Yetkisiz kullanıcıda RPC 'forbidden' atar; menüyü hiç gösterme.
  if (isError || !state) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Bildirim e-postaları"
          className="relative"
        >
          <Mail className="h-4 w-4" />
          {isReceiving && (
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-card"
            />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Bildirim e-postaları</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <p className="px-2 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Kendi aboneliğim
        </p>
        <ToggleLine
          label="Yeni üye kaydolduğunda bana mail gelsin"
          checked={state.myNewMemberEmail}
          disabled={subscriptionBusy}
          onCheckedChange={(checked) => updateSubscription({ newMemberEmail: checked })}
        />
        <ToggleLine
          label="Yeni güncelleme yayınlandığında bana mail gelsin"
          checked={state.myAdminUpdateEmail}
          disabled={subscriptionBusy}
          onCheckedChange={(checked) => updateSubscription({ adminUpdateEmail: checked })}
        />

        <DropdownMenuSeparator />

        <p className="px-2 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Genel anahtarlar {state.isAdmin ? "(tüm platform)" : "(yalnız admin)"}
        </p>
        <ToggleLine
          label="Yeni üye bildirimleri açık"
          checked={state.newMemberEnabled}
          disabled={!state.isAdmin || settingsBusy}
          onCheckedChange={(checked) => setGlobal(SETTING_KEYS.newMember, checked)}
        />
        <ToggleLine
          label="Güncelleme bildirimleri açık"
          checked={state.adminUpdateEnabled}
          disabled={!state.isAdmin || settingsBusy}
          onCheckedChange={(checked) => setGlobal(SETTING_KEYS.adminUpdate, checked)}
        />

        {mutedTypes.length > 0 && (
          <p
            role="status"
            className="mx-2 my-1 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-900 dark:text-amber-200"
          >
            Genel anahtar kapalı: {mutedTypes.join(" ve ")} bildirimi kimseye gitmiyor.
          </p>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/admin/notifications" className="flex w-full justify-center text-sm font-medium">
            Ayrıntılar ve gönderim geçmişi
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AdminNotificationMenu;
