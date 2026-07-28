// src/hooks/useMuhasebeButce.ts
// React Query hook'ları — muhasebe bütçe sekmesi

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchButceYear, upsertButceYear } from '@/lib/muhasebe-butce-api';
import { seedYear, type ButceYearState } from '@/lib/muhasebe-butce-schemas';

export const muhasebeButceKeys = {
  all: ['muhasebe-butce'] as const,
  year: (year: number) => [...muhasebeButceKeys.all, year] as const,
};

export function useButceYear(year: number) {
  return useQuery({
    queryKey: muhasebeButceKeys.year(year),
    queryFn: async (): Promise<ButceYearState> => {
      const stored = await fetchButceYear(year);
      return stored ?? seedYear();
    },
  });
}

export function useSaveButceYear(year: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (state: ButceYearState) => upsertButceYear(year, state),
    onError: (err: Error) => {
      toast.error('Bütçe kaydedilemedi', { description: err.message });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: muhasebeButceKeys.year(year) });
    },
  });
}
