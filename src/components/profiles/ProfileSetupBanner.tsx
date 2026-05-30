import { Lock, ShieldCheck, ImageIcon, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * A profile is considered "fully set up" (online in categories) when:
 *  - phone is verified (Diaspora Pasaport rozeti)
 *  - avatar uploaded
 *  - description filled (varies by account type)
 * Admin role is always unlocked.
 */
export const useProfileGate = () => {
  const { profile, accountType } = useAuth();
  const verified = !!profile?.phone_verified;

  const hasAvatar = !!profile?.avatar_url;
  let hasDescription = false;
  switch (accountType) {
    case "business":
      hasDescription = !!(profile?.business_description && profile.business_description.trim().length > 10);
      break;
    case "consultant":
    case "ambassador":
    case "blogger":
    case "association":
      hasDescription = !!(profile?.mentor_topics && profile.mentor_topics.trim().length > 10);
      break;
    case "individual":
    default:
      hasDescription = !!(profile?.profession && profile.profession.trim().length > 2);
      break;
  }

  const profileFilled = hasAvatar && hasDescription;
  const isAdmin = accountType === "admin";
  const locked = !isAdmin && (!verified || !profileFilled);

  return { locked, verified, profileFilled, hasAvatar, hasDescription, isAdmin };
};

/**
 * Banner explaining the dashboard is locked until phone verification AND
 * profile content (avatar + description) is filled in.
 */
export const ProfileSetupBanner = () => {
  const { locked, verified, hasAvatar, hasDescription } = useProfileGate();
  if (!locked) return null;

  return (
    <div className="mb-4 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 to-amber-500/5 p-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
          <Lock className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            Panel Kilitli — Önce Profil Ayarları
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Diğer sekmelerin açılması ve profilinin <strong>Cadde / Kategoriler</strong>de yayına çıkması için aşağıdakileri tamamla:
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            <li className="flex items-center gap-2">
              <ShieldCheck className={`h-4 w-4 ${verified ? "text-emerald-600" : "text-muted-foreground"}`} />
              <span className={verified ? "line-through text-muted-foreground" : ""}>Telefon doğrulama (CorteQS / Diaspora Pasaport)</span>
            </li>
            <li className="flex items-center gap-2">
              <ImageIcon className={`h-4 w-4 ${hasAvatar ? "text-emerald-600" : "text-muted-foreground"}`} />
              <span className={hasAvatar ? "line-through text-muted-foreground" : ""}>Profil fotoğrafı yükle</span>
            </li>
            <li className="flex items-center gap-2">
              <FileText className={`h-4 w-4 ${hasDescription ? "text-emerald-600" : "text-muted-foreground"}`} />
              <span className={hasDescription ? "line-through text-muted-foreground" : ""}>Bio / şirket / danışman açıklamasını doldur</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupBanner;
