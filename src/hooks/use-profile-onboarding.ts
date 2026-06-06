import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  activateCurrentOnboardingProfile,
  getCurrentOnboardingActivation,
  resendCurrentOnboardingActivationLink,
  resumePendingOnboarding,
} from "@/lib/pending-onboarding-api";

export const useCurrentOnboardingActivation = (enabled = true) => {
  return useQuery({
    queryKey: ["profile-onboarding", "activation"],
    queryFn: getCurrentOnboardingActivation,
    enabled,
  });
};

export const useResumePendingOnboarding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resumePendingOnboarding,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["current-user-profile"] });
    },
  });
};

export const useActivateCurrentOnboardingProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activateCurrentOnboardingProfile,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile-onboarding", "activation"] }),
        queryClient.invalidateQueries({ queryKey: ["current-user-profile"] }),
      ]);
    },
  });
};

export const useResendCurrentOnboardingActivationLink = () => {
  return useMutation({
    mutationFn: resendCurrentOnboardingActivationLink,
  });
};
