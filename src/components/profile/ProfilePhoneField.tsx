// Profil Workshop WS1 madde 1 (T19): telefon numarası profil formunun EN ÜSTÜNDE,
// ilk kutuda durur. Görünürlük anahtarı yoktur — numara her zaman private'tır
// (afs_attributes.phone.storage_strategy = private_storage; public sayfa RPC'si
// bu stratejiyi baştan eler). Biçim doğrulaması src/lib/profile-phone.ts'te.

import { Lock, Phone } from "lucide-react";

import { ProfileInfoTip } from "@/components/profile/ProfileInfoTip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PHONE_FORMAT_HINT } from "@/lib/profile-phone";

export const PHONE_PRIVACY_TIP =
  "Numaran herkese açık profilde hiçbir zaman gösterilmez. Doğrulama, güvenlik ve yalnız senin onayladığın iletişim için kullanılır; ülke bilgin numarandan türetilmez.";

export interface ProfilePhoneFieldProps {
  value: string;
  /** Doğrulama hatası; null ise ipucu metni gösterilir. */
  error: string | null;
  isRequired: boolean;
  isSaving: boolean;
  canEdit: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  /** ProfilePage'in kart içi buton stili (AMBER_BUTTON_PRIMARY) — stil tek kaynaktan gelsin. */
  saveButtonClassName?: string;
  /** Kilit rozetinin zemin stili (GOOGLE_SOFT_SWITCH_PANEL ile aynı görünüm). */
  lockPanelClassName?: string;
}

export function ProfilePhoneField({
  value,
  error,
  isRequired,
  isSaving,
  canEdit,
  onChange,
  onSave,
  saveButtonClassName,
  lockPanelClassName,
}: ProfilePhoneFieldProps) {
  return (
    <div className="space-y-1" data-testid="profile-phone-field">
      <div className="flex items-center gap-2">
        <div className="flex w-32 shrink-0 items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 shrink-0 text-foreground" aria-hidden="true" />
          <span className="truncate text-[10px] font-medium text-foreground">Telefon</span>
          {isRequired ? (
            <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[9px]">
              Zorunlu
            </Badge>
          ) : null}
          <ProfileInfoTip label="Telefon" text={PHONE_PRIVACY_TIP} />
        </div>
        <Input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="+49 170 1234567"
          aria-label="Telefon"
          aria-invalid={error ? true : undefined}
          aria-describedby="profile-phone-hint"
          disabled={!canEdit}
          className="h-8 flex-1 text-[10px] placeholder:text-[10px]"
        />
        <div
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-2 ${lockPanelClassName ?? "border border-gray-100 bg-gray-50"}`}
          style={{ height: "32px" }}
          title="Yalnız sen ve yöneticiler görür"
        >
          <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="text-[10px] text-muted-foreground">Yalnız sen</span>
        </div>
        <Button size="sm" className={saveButtonClassName} onClick={onSave} disabled={!canEdit || isSaving}>
          {isSaving ? "Kaydediliyor..." : "Telefonu Kaydet"}
        </Button>
      </div>
      <p
        id="profile-phone-hint"
        role={error ? "alert" : undefined}
        className={`text-[10px] ${error ? "text-red-600" : "text-muted-foreground"}`}
      >
        {error ?? PHONE_FORMAT_HINT}
      </p>
    </div>
  );
}

export default ProfilePhoneField;
