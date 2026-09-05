// src/lib/muhasebe-butce-api.ts
// Supabase CRUD — muhasebe_butce_state (bütçe sekmesi yıl state'i)

import { fromJson, toJson } from '@/lib/supabase-json';
import { supabase } from '@/integrations/supabase/client';
import type { ButceYearState } from '@/lib/muhasebe-butce-schemas';

export async function fetchButceYear(year: number): Promise<ButceYearState | null> {
  const { data, error } = await supabase
    .from('muhasebe_butce_state')
    .select('*')
    .eq('year', year)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  // `state` sütunu DB'de `jsonb`, yani üretilen tipte `Json`. Uygulama onu
  // `ButceYearState` olarak okur. Eskiden bu, satırın TAMAMINI sahte bir arayüze
  // (`state: ButceYearState` diyen `MuhasebeButceStateRow`) çevirerek yapılıyordu;
  // TypeScript iki tipin yeterince örtüşmediğini söyleyip TS2352 veriyordu ve haklıydı —
  // o arayüz DB'nin gerçek şeklini YANLIŞ tarif ediyordu.
  // Şimdi yalnızca ilgili ALAN daraltılıyor: satırın geri kalanı üretilen tipiyle kalır.
  // ⚠️ Bu bir doğrulama değildir. `state` bozuk yazılmışsa burada yakalanmaz; gerçek
  // güvence isteniyorsa `muhasebe-butce-schemas` içindeki zod şemasıyla parse et.
  return fromJson<ButceYearState>(data.state);
}

export async function upsertButceYear(year: number, state: ButceYearState): Promise<void> {
  const { error } = await supabase
    .from('muhasebe_butce_state')
    .upsert({ year, state: toJson(state) }, { onConflict: 'year' });
  if (error) throw error;
}
