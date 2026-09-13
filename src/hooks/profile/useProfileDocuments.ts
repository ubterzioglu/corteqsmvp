import { useState, type ChangeEvent } from "react";

import { useToast } from "@/hooks/use-toast";
import { updateProfileAttribute } from "@/lib/member-profile-api";
import {
  CV_DOCUMENT_ATTRIBUTE_KEY,
  PRESENTATION_DOCUMENT_ATTRIBUTE_KEY,
  PROFILE_CV_BUCKET,
  PROFILE_PRESENTATION_BUCKET,
} from "@/lib/profile-attribute-keys";
import {
  getProfileDocumentAccessUrl,
  removeProfileDocument,
  uploadProfileDocument,
  type ProfileDocumentRecord,
} from "@/lib/profile-documents";
import { validateCvFile, validatePresentationFile } from "@/lib/security";

export type UseProfileDocumentsParams = {
  userId: string | undefined;
  cvDocument: ProfileDocumentRecord | null;
  presentationDocument: ProfileDocumentRecord | null;
  refreshProfile: () => Promise<void>;
};

export type UseProfileDocumentsResult = {
  uploadingDocumentKey: string | null;
  removingDocumentKey: string | null;
  openingDocumentKey: string | null;
  handleCvFileChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handlePresentationFileChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleOpenDocument: (documentKey: string, document: ProfileDocumentRecord | null) => Promise<void>;
  handleRemoveDocument: (attributeKey: string, document: ProfileDocumentRecord | null) => Promise<void>;
};

/** CV ve sunum belgelerinin private bucket akışı (yükle / aç / kaldır). */
export const useProfileDocuments = ({
  userId,
  cvDocument,
  presentationDocument,
  refreshProfile,
}: UseProfileDocumentsParams): UseProfileDocumentsResult => {
  const { toast } = useToast();
  const [uploadingDocumentKey, setUploadingDocumentKey] = useState<string | null>(null);
  const [removingDocumentKey, setRemovingDocumentKey] = useState<string | null>(null);
  const [openingDocumentKey, setOpeningDocumentKey] = useState<string | null>(null);

  const handleUploadDocument = async (
    attributeKey: string,
    bucket: string,
    file: File,
    currentDocument: ProfileDocumentRecord | null,
  ) => {
    if (!userId) return;

    setUploadingDocumentKey(attributeKey);
    let nextDocument: ProfileDocumentRecord | null = null;
    try {
      nextDocument = await uploadProfileDocument(bucket, userId, file);
      await updateProfileAttribute(attributeKey, nextDocument, "private");

      if (currentDocument) {
        await removeProfileDocument(currentDocument);
      }

      await refreshProfile();
      toast({
        title: "Dosya yüklendi",
        description: `${file.name} profil dosyalarına eklendi.`,
      });
    } catch (error) {
      toast({
        title: "Dosya yüklenemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
      if (nextDocument) {
        await removeProfileDocument(nextDocument).catch(() => undefined);
      }
    } finally {
      setUploadingDocumentKey(null);
    }
  };

  const handleCvFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateCvFile(file);
    if (validationError) {
      toast({
        title: "CV yüklenemedi",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    await handleUploadDocument(CV_DOCUMENT_ATTRIBUTE_KEY, PROFILE_CV_BUCKET, file, cvDocument);
  };

  const handlePresentationFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validatePresentationFile(file);
    if (validationError) {
      toast({
        title: "Sunum yüklenemedi",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    await handleUploadDocument(PRESENTATION_DOCUMENT_ATTRIBUTE_KEY, PROFILE_PRESENTATION_BUCKET, file, presentationDocument);
  };

  const handleOpenDocument = async (documentKey: string, document: ProfileDocumentRecord | null) => {
    if (!document) return;
    setOpeningDocumentKey(documentKey);
    try {
      const signedUrl = await getProfileDocumentAccessUrl(document);
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast({
        title: "Dosya açılamadı",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setOpeningDocumentKey(null);
    }
  };

  const handleRemoveDocument = async (attributeKey: string, document: ProfileDocumentRecord | null) => {
    setRemovingDocumentKey(attributeKey);
    try {
      await updateProfileAttribute(attributeKey, null, "private");

      if (document) {
        await removeProfileDocument(document);
      }

      await refreshProfile();
      toast({
        title: "Dosya kaldırıldı",
        description: "Profil dosyası güvenli şekilde silindi.",
      });
    } catch (error) {
      toast({
        title: "Dosya kaldırılamadı",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setRemovingDocumentKey(null);
    }
  };

  return {
    uploadingDocumentKey,
    removingDocumentKey,
    openingDocumentKey,
    handleCvFileChange,
    handlePresentationFileChange,
    handleOpenDocument,
    handleRemoveDocument,
  };
};
