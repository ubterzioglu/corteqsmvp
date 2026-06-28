import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

import EditableProfilesSelector from "@/components/profile/EditableProfilesSelector";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/useAuth";
import {
  getCurrentMemberCatalogProfile,
  getMyEditableCatalogItems,
  type EditableCatalogItemSummary,
} from "@/lib/member-catalog";
import { profileEditorPathFor } from "@/lib/profile-routing";
import { defaultProfileType, getUiProfileType, type ProfileType } from "@/lib/profile-types";

const ProfileResolverPage = () => {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [initialProfileType, setInitialProfileType] = useState<ProfileType | null>(null);
  const [editableItems, setEditableItems] = useState<EditableCatalogItemSummary[]>([]);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  useEffect(() => {
    if (isLoading || !user) return;
    let isMounted = true;

    void (async () => {
      try {
        const [currentProfile, myItems] = await Promise.all([
          getCurrentMemberCatalogProfile(),
          getMyEditableCatalogItems(),
        ]);

        if (!isMounted) return;

        setEditableItems(myItems);

        const memberItem = myItems.find((item) => item.itemType === "member");
        if (currentProfile?.profileType) {
          setInitialProfileType(getUiProfileType(currentProfile.profileType));
        } else if (memberItem) {
          setInitialProfileType(memberItem.legacyProfileType);
        } else {
          setInitialProfileType(null);
        }
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(error instanceof Error ? error.message : "Profil tipi alınamadı.");
      } finally {
        if (isMounted) setIsProfileLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isLoading, user]);

  const handleOpenEditableItem = useCallback((item: EditableCatalogItemSummary) => {
    navigate(profileEditorPathFor(item), { replace: true });
  }, [navigate]);

  // Bireysel öncelikli açılış: tek profil VEYA (birden çok profil + bir Bireysel
  // profil) durumunda doğrudan Bireysel'e (member) yönlendir. Diğer profillere
  // editör içindeki "Diğer Profiller" geçişinden ulaşılır. Yalnızca hiç member'ı
  // olmayan (sadece katalog profilleri) hesaplarda seçim ekranı gösterilir.
  useEffect(() => {
    if (editableItems.length === 0) return;
    if (editableItems.length === 1) {
      handleOpenEditableItem(editableItems[0]);
      return;
    }
    const memberItem = editableItems.find((item) => item.itemType === "member");
    if (memberItem) {
      handleOpenEditableItem(memberItem);
    }
  }, [editableItems, handleOpenEditableItem]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } finally {
      navigate("/login", { replace: true });
    }
  }, [signOut, navigate]);

  if (!isLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading || isProfileLoading) {
    return <div className="flex min-h-[70vh] items-center justify-center">Profil yönlendirmeniz hazırlanıyor...</div>;
  }

  const hasMemberItem = editableItems.some((item) => item.itemType === "member");

  // Tek profil VEYA Bireysel profili olan çok-profilli hesaplar yukarıdaki effect
  // ile doğrudan editöre yönlendirilir; burada sadece yönlendirme beklenir.
  if (editableItems.length === 1 || (editableItems.length > 1 && hasMemberItem)) {
    return null;
  }

  // Yalnızca hiç Bireysel profili olmayan (sadece katalog) çok-profilli hesaplar
  // ilk hedefi seçim ekranından belirler.
  if (editableItems.length > 1) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="mb-4 flex justify-end">
          <Button
            type="button"
            variant="outline"
            className="gap-2 rounded-full"
            onClick={() => void handleSignOut()}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Çıkış Yap
          </Button>
        </div>
        <EditableProfilesSelector items={editableItems} onSelect={handleOpenEditableItem} />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <p className="text-center text-sm text-destructive">{errorMessage}</p>
      </div>
    );
  }

  // Her kullanıcıya signup'ta otomatik rol + member kaydı atanır; buraya yalnızca
  // istisnai durumlarda (kayıt köprüsü oluşmamış hesap) düşülür. Editör sayfası
  // profil verisini RPC'den rol-güdümlü çözdüğü için varsayılan kategoriye yönlendirmek güvenlidir.
  return <Navigate to={`/profile/${initialProfileType ?? defaultProfileType}`} replace />;
};

export default ProfileResolverPage;
