import { useState, type ChangeEvent } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { updateProfileAvatar } from "@/lib/member-profile-api";
import {
  AVATARS_BUCKET,
  MAX_PROFILE_IMAGE_SIZE_BYTES,
  buildAvatarStoragePath,
  getAvatarStoragePathFromUrl,
  getPublicAvatarUrl,
} from "@/lib/profile-avatar-storage";

export type UseProfileAvatarParams = {
  userId: string | undefined;
  /** Profilde kayıtlı mevcut avatar URL'si (boş string = avatar yok). */
  currentAvatarUrl: string;
  refreshProfile: () => Promise<void>;
};

export type UseProfileAvatarResult = {
  avatarUploading: boolean;
  avatarRemoving: boolean;
  handleAvatarFileChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleRemoveAvatar: () => Promise<void>;
};

/** Profil fotoğrafı yükleme/kaldırma akışı (storage + attribute + eski dosya temizliği). */
export const useProfileAvatar = ({
  userId,
  currentAvatarUrl,
  refreshProfile,
}: UseProfileAvatarParams): UseProfileAvatarResult => {
  const { toast } = useToast();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarRemoving, setAvatarRemoving] = useState(false);

  const handleAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!userId || !file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Geçersiz dosya",
        description: "Lütfen bir görsel dosyası seç.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE_BYTES) {
      toast({
        title: "Dosya çok büyük",
        description: "Profil resmi en fazla 5 MB olabilir.",
        variant: "destructive",
      });
      return;
    }

    const nextPath = buildAvatarStoragePath(userId, file);
    const previousPath = getAvatarStoragePathFromUrl(currentAvatarUrl);

    setAvatarUploading(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(nextPath, file, { contentType: file.type, upsert: true });

      if (uploadError) throw uploadError;

      const publicUrl = getPublicAvatarUrl(nextPath);
      await updateProfileAvatar(publicUrl);

      if (previousPath && previousPath !== nextPath) {
        await supabase.storage.from(AVATARS_BUCKET).remove([previousPath]);
      }

      await refreshProfile();
      toast({
        title: "Profil resmi güncellendi",
        description: "Yeni görsel profilinde kullanılmaya başlandı.",
      });
    } catch (error) {
      toast({
        title: "Profil resmi yüklenemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    const previousPath = getAvatarStoragePathFromUrl(currentAvatarUrl);

    setAvatarRemoving(true);
    try {
      await updateProfileAvatar(null);

      if (previousPath) {
        await supabase.storage.from(AVATARS_BUCKET).remove([previousPath]);
      }

      await refreshProfile();
      toast({
        title: "Profil resmi kaldırıldı",
        description: "Avatar ve public profil görseli temizlendi.",
      });
    } catch (error) {
      toast({
        title: "Profil resmi kaldırılamadı",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setAvatarRemoving(false);
    }
  };

  return { avatarUploading, avatarRemoving, handleAvatarFileChange, handleRemoveAvatar };
};
