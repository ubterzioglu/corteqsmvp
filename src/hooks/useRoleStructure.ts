// B6 · Rol yapısı API hook'ları (3 adımlı seçici için)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type RoleStructureEntry = {
  id: string;
  ana_rol: string;
  alt_rol: string;
  uzmanlik: string;
  yeni_kod: string;
  eski_kod: string | null;
  durum: "onaylandi" | "oneri";
};

export type AnaRolOption = {
  key: string;
  label: string;
  description?: string;
  icon?: string;
};

// Ana rol listesi (sabit, DB'den okunmaz)
export const ANA_ROL_OPTIONS: AnaRolOption[] = [
  { key: "Bireysel Kullanıcı", label: "Bireysel Kullanıcı", description: "Standart üye", icon: "User" },
  { key: "Danışman", label: "Danışman", description: "Profesyonel danışmanlık", icon: "Briefcase" },
  { key: "İşletme", label: "İşletme", description: "Şirket veya mağaza", icon: "Building2" },
  { key: "Kuruluş", label: "Kuruluş", description: "STK, vakıf, dernek", icon: "Landmark" },
  { key: "Şehir Elçisi", label: "Şehir Elçisi", description: "Topluluk lideri", icon: "MapPin" },
  { key: "İçerik Üretici", label: "İçerik Üretici", description: "Blogger, vlogger", icon: "Camera" },
  { key: "Venture Hub", label: "Venture Hub", description: "Girişimcilik merkezi", icon: "Rocket" },
];

/** Tüm rol yapısını getirir (onaylanmış). */
export function useRoleStructure() {
  return useQuery({
    queryKey: ["role-structure"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_role_structure");
      if (error) throw error;
      return (data as RoleStructureEntry[]) || [];
    },
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}

/** Belirli ana rolün alt rol ve uzmanlıklarını getirir. */
export function useRoleStructureByAnaRol(anaRol: string | null) {
  return useQuery({
    queryKey: ["role-structure", anaRol],
    queryFn: async () => {
      if (!anaRol) return [];
      const { data, error } = await supabase.rpc("get_role_structure_by_ana_rol", { p_ana_rol: anaRol });
      if (error) throw error;
      return (data as RoleStructureEntry[]) || [];
    },
    enabled: !!anaRol,
    staleTime: 5 * 60 * 1000,
  });
}

/** Ana rol listesini getirir. */
export function useAnaRoller() {
  return useQuery({
    queryKey: ["ana-roller"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_ana_roller");
      if (error) throw error;
      return (data as string[]) || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Uzmanlık etiketleri ─────────────────────────────────────────────────────

export type SpecialtyTag = {
  id: string;
  specialty_slug: string;
  specialty_label: string;
};

/** Kullanıcının uzmanlık etiketlerini getirir. */
export function useUserSpecialtyTags(userId?: string) {
  return useQuery({
    queryKey: ["user-specialty-tags", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_specialty_tags", { p_user_id: userId || null });
      if (error) throw error;
      return (data as SpecialtyTag[]) || [];
    },
    staleTime: 60 * 1000,
  });
}

/** Uzmanlık etiketi ekler. */
export function useAddSpecialtyTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, label }: { slug: string; label: string }) => {
      const { data, error } = await supabase.rpc("add_user_specialty_tag", {
        p_specialty_slug: slug,
        p_specialty_label: label,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-specialty-tags"] });
    },
  });
}

/** Uzmanlık etiketi kaldırır. */
export function useRemoveSpecialtyTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string) => {
      const { data, error } = await supabase.rpc("remove_user_specialty_tag", {
        p_specialty_slug: slug,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-specialty-tags"] });
    },
  });
}
