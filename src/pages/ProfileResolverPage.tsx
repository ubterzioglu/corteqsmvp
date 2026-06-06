import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { BriefcaseBusiness, Building2, CircleUserRound, Gift, Globe2, PenLine } from "lucide-react";

import { useAuth } from "@/components/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { defaultProfileType, profileTypeOptions, type ProfileType } from "@/lib/profile-types";
import { getCurrentMemberCatalogProfile } from "@/lib/member-catalog";

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
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  useEffect(() => {
    if (isLoading || !user) return;
    let isMounted = true;

    void (async () => {
      try {
        const data = await getCurrentMemberCatalogProfile();

        if (!isMounted) return;

        const profileType = data?.profileType;
        if (profileType && profileTypeOptions.some((option) => option.type === profileType)) {
          setInitialProfileType(profileType as ProfileType);
        } else {
          setInitialProfileType(null);
        }
        setIsProfileLoading(false);
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(error instanceof Error ? error.message : "Profil tipi alınamadı.");
        setIsProfileLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isLoading, user]);

  if (!isLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading || isProfileLoading) {
    return <div className="flex min-h-[70vh] items-center justify-center">Profil yönlendirmeniz hazırlanıyor...</div>;
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

    navigate(`/profile/${selectedType}`, { replace: true });
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
