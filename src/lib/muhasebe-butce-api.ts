// src/lib/muhasebe-butce-api.ts
// Supabase CRUD — muhasebe_butce_state (bütçe sekmesi yıl state'i)

import { supabase } from '@/integrations/supabase/client';
import type { ButceYearState } from '@/lib/muhasebe-butce-schemas';

interface MuhasebeButceStateRow {
  id: string;
  year: number;
  state: ButceYearState;
  updated_at: string;
}

export async function fetchButceYear(year: number): Promise<ButceYearState | null> {
  const { data, error } = await supabase
    .from('muhasebe_butce_state')
    .select('*')
    .eq('year', year)
    .maybeSingle();
  if (error) throw error;
  return (data as MuhasebeButceStateRow | null)?.state ?? null;
}

export async function upsertButceYear(year: number, state: ButceYearState): Promise<void> {
  const { error } = await supabase
    .from('muhasebe_butce_state')
    .upsert({ year, state }, { onConflict: 'year' });
  if (error) throw error;
}
