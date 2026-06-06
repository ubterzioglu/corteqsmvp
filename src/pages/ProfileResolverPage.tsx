import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { BriefcaseBusiness, Building2, CircleUserRound, Gift, Globe2, PenLine } from "lucide-react";

import EditableProfilesSelector from "@/components/profile/EditableProfilesSelector";
import { useAuth } from "@/components/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  getCurrentMemberCatalogProfile,
  getMyEditableCatalogItems,
  type EditableCatalogItemSummary,
} from "@/lib/member-catalog";
import { defaultProfileType, profileTypeOptions, type ProfileType } from "@/lib/profile-types";

const iconByType: Record<ProfileType, JSX.Element> = {
  bireysel: <CircleUserRound className="h-5 w-5 text-blue-500" />,
  danisman: <Gift className="h-5 w-5 text-emerald-500" />,
  isletme: <BriefcaseBusiness className="h-5 w-5 text-amber-500" />,
  "kurulus-dernek": <Building2 className="h-5 w-5 text-violet-500" />,
  "blogger-vlogger-youtuber": <PenLine className="h-5 w-5 text-rose-500" />,
  "sehir-elcisi": <Globe2 className="h-5 w-5 text-cyan-500" />,
};

const ProfileResolverPage = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<ProfileType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
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
          setInitialProfileType(currentProfile.profileType as ProfileType);
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

  if (initialProfileType) {
    return <Navigate to={`/profile/${initialProfileType}`} replace />;
  }

  const handleContinue = async () => {
    if (!user || !selectedType) return;
    setErrorMessage(null);
    setIsSaving(true);

    const { error } = await supabase.rpc("set_current_member_catalog_role", {
      p_role_key: selectedType,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    navigate(`/profile/${selectedType || defaultProfileType}`, { replace: true });
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-3xl">Hoş Geldiniz!</CardTitle>
          <p className="text-center text-muted-foreground">Hesap türünüzü seçerek profilinizi oluşturmaya başlayın.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {profileTypeOptions.map((option) => {
            const checked = selectedType === option.type;
            return (
              <button
                key={option.type}
                type="button"
                onClick={() => setSelectedType(option.type)}
                className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                  checked ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/30"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-muted p-2">{iconByType[option.type]}</div>
                  <div>
                    <p className="font-semibold">{option.title}</p>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
                <div className={`h-5 w-5 rounded-full border ${checked ? "border-primary bg-primary" : "border-muted-foreground"}`} />
              </button>
            );
          })}

          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

          <Button type="button" className="mt-2 w-full" disabled={!selectedType || isSaving} onClick={handleContinue}>
            {isSaving ? "Kaydediliyor..." : "Devam Et"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileResolverPage;
