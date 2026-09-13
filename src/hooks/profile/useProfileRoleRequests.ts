import { useEffect, useMemo, useRef, useState } from "react";

import { useToast } from "@/hooks/use-toast";
import { fetchFlatRoles, mapFlatRoleOptions, type FlatRoleOption } from "@/lib/flat-roles-api";
import { submitFeatureRequest, submitRoleChangeRequest } from "@/lib/member-profile-api";

export type UseProfileRoleRequestsParams = {
  /** Rol listesi yalnız "Başvurular & Erişimler" kartı ilk açıldığında çekilir. */
  isAccessCardOpen: boolean;
  currentRoleKey: string | null | undefined;
  refreshProfile: () => Promise<void>;
};

export type UseProfileRoleRequestsResult = {
  roleRequestTarget: string;
  setRoleRequestTarget: (value: string) => void;
  roleRequestNote: string;
  setRoleRequestNote: (value: string) => void;
  submittingRoleRequest: boolean;
  handleSubmitRoleRequest: () => Promise<void>;
  featureRequestingKey: string | null;
  handleRequestFeature: (featureKey: string) => Promise<void>;
  flatRolesLoading: boolean;
  availableRoleTargets: FlatRoleOption[];
};

/** Rol başvurusu + feature talebi akışları ve tembel yüklenen flat rol kataloğu. */
export const useProfileRoleRequests = ({
  isAccessCardOpen,
  currentRoleKey,
  refreshProfile,
}: UseProfileRoleRequestsParams): UseProfileRoleRequestsResult => {
  const { toast } = useToast();
  const [roleRequestTarget, setRoleRequestTarget] = useState("");
  const [roleRequestNote, setRoleRequestNote] = useState("");
  const [submittingRoleRequest, setSubmittingRoleRequest] = useState(false);
  const [featureRequestingKey, setFeatureRequestingKey] = useState<string | null>(null);
  const [flatRoleOptions, setFlatRoleOptions] = useState<FlatRoleOption[]>([]);
  const [flatRolesLoading, setFlatRolesLoading] = useState(false);
  const flatRolesLoadedRef = useRef(false);

  useEffect(() => {
    if (!isAccessCardOpen || flatRolesLoadedRef.current) return;
    flatRolesLoadedRef.current = true;

    let cancelled = false;
    setFlatRolesLoading(true);

    void (async () => {
      const { data, error } = await fetchFlatRoles();
      if (cancelled) return;

      if (error) {
        flatRolesLoadedRef.current = false;
        setFlatRoleOptions([]);
        setFlatRolesLoading(false);
        toast({
          title: "Rol listesi yüklenemedi",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setFlatRoleOptions(mapFlatRoleOptions(data));
      setFlatRolesLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAccessCardOpen, toast]);

  const availableRoleTargets = useMemo(() => {
    return flatRoleOptions.filter((option) => option.key !== currentRoleKey);
  }, [flatRoleOptions, currentRoleKey]);

  const handleSubmitRoleRequest = async () => {
    if (!roleRequestTarget) return;

    setSubmittingRoleRequest(true);
    try {
      await submitRoleChangeRequest(roleRequestTarget, roleRequestNote.trim());
      setRoleRequestTarget("");
      setRoleRequestNote("");
      await refreshProfile();
      toast({
        title: "Rol başvurusu alındı",
        description: "Talebin admin onay kuyruğuna eklendi.",
      });
    } catch (error) {
      toast({
        title: "Rol başvurusu gönderilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSubmittingRoleRequest(false);
    }
  };

  const handleRequestFeature = async (featureKey: string) => {
    setFeatureRequestingKey(featureKey);
    try {
      await submitFeatureRequest(featureKey);
      await refreshProfile();
      toast({
        title: "Talep alındı",
        description: "Feature talebin admin onay kuyruğuna eklendi.",
      });
    } catch (error) {
      toast({
        title: "Talep gönderilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setFeatureRequestingKey(null);
    }
  };

  return {
    roleRequestTarget,
    setRoleRequestTarget,
    roleRequestNote,
    setRoleRequestNote,
    submittingRoleRequest,
    handleSubmitRoleRequest,
    featureRequestingKey,
    handleRequestFeature,
    flatRolesLoading,
    availableRoleTargets,
  };
};
