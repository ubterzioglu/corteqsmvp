import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import EditableProfilesSelector from "@/components/profile/EditableProfilesSelector";
import { useAuth } from "@/components/auth/useAuth";
import {
  getCurrentMemberCatalogProfile,
  getMyEditableCatalogItems,
  type EditableCatalogItemSummary,
} from "@/lib/member-catalog";
import { defaultProfileType, getUiProfileType, type ProfileType } from "@/lib/profile-types";

const ProfileResolverPage = () => {
  const { user, isLoading } = useAuth();
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
    if (item.itemType === "member") {
      navigate(`/profile/${item.legacyProfileType}`, { replace: true });
      return;
    }

    navigate(`/profile/catalog/${item.itemId}`, { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (editableItems.length !== 1) return;
    handleOpenEditableItem(editableItems[0]);
  }, [editableItems, handleOpenEditableItem]);

  if (!isLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading || isProfileLoading) {
    return <div className="flex min-h-[70vh] items-center justify-center">Profil yönlendirmeniz hazırlanıyor...</div>;
  }

  if (editableItems.length > 1) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <EditableProfilesSelector items={editableItems} onSelect={handleOpenEditableItem} />
      </div>
    );
  }

  if (editableItems.length === 1) {
    return null;
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
