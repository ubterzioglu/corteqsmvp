// A1.6 · ProfileDocumentsSection — CV, sunum, ruhsat belgeleri bölümü.
// ProfilePage.tsx'ten çıkarıldı (satır sayısını ≤ 800'e düşürmek için).

import { type RefObject } from "react";
import { BookOpen, FileText } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { updateProfileAttribute } from "@/lib/member-profile-api";
import { formatDocumentMeta } from "@/lib/profile-attribute-drafts";
import type { ProfileDocumentRecord } from "@/lib/profile-documents";
import {
  CV_DOCUMENT_ATTRIBUTE_KEY,
  CV_SHARE_WITH_PREMIUM_ATTRIBUTE_KEY,
  LICENSE_DOCUMENT_ATTRIBUTE_KEY,
  PRESENTATION_DOCUMENT_ATTRIBUTE_KEY,
} from "@/lib/profile-attribute-keys";

import { ProfileDocumentCard } from "@/components/profile/ProfileDocumentCard";

const GOOGLE_SOFT_CARD_YELLOW_SECTION = "border-amber-200/60 bg-amber-50/30";
const GOOGLE_SOFT_CARD_RED_SECTION = "border-rose-200/60 bg-rose-50/30";

export type ProfileDocumentsSectionProps = {
  cvUploadEnabled: boolean;
  presentationUploadEnabled: boolean;
  licenseUploadEnabled: boolean;
  cvDocument: ProfileDocumentRecord | null;
  presentationDocument: ProfileDocumentRecord | null;
  licenseDocument: ProfileDocumentRecord | null;
  cvShareEnabled: boolean;
  uploadingDocumentKey: string | null;
  removingDocumentKey: string | null;
  openingDocumentKey: string | null;
  cvInputRef: RefObject<HTMLInputElement | null>;
  presentationInputRef: RefObject<HTMLInputElement | null>;
  licenseInputRef: RefObject<HTMLInputElement | null>;
  onOpenDocument: (key: string, doc: ProfileDocumentRecord | null) => void;
  onRemoveDocument: (key: string, doc: ProfileDocumentRecord | null) => void;
  onRefreshProfile: () => Promise<void>;
};

export function ProfileDocumentsSection({
  cvUploadEnabled,
  presentationUploadEnabled,
  licenseUploadEnabled,
  cvDocument,
  presentationDocument,
  licenseDocument,
  cvShareEnabled,
  uploadingDocumentKey,
  removingDocumentKey,
  openingDocumentKey,
  cvInputRef,
  presentationInputRef,
  licenseInputRef,
  onOpenDocument,
  onRemoveDocument,
  onRefreshProfile,
}: ProfileDocumentsSectionProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {cvUploadEnabled ? (
        <>
          <ProfileDocumentCard
            cardClassName={GOOGLE_SOFT_CARD_YELLOW_SECTION}
            title="CV / Özgeçmiş"
            description={cvShareEnabled
              ? "Premium üyeler CV'nizi görüntüleyebilir."
              : "Private bucket içinde saklanır. Sadece sen ve admin erişebilir."}
            icon={FileText}
            document={cvDocument}
            acceptLabel="PDF, DOC, DOCX"
            statusLabel={formatDocumentMeta(cvDocument)}
            isUploading={uploadingDocumentKey === CV_DOCUMENT_ATTRIBUTE_KEY}
            isRemoving={removingDocumentKey === CV_DOCUMENT_ATTRIBUTE_KEY}
            isOpening={openingDocumentKey === CV_DOCUMENT_ATTRIBUTE_KEY}
            onUploadClick={() => cvInputRef.current?.click()}
            onOpenClick={() => onOpenDocument(CV_DOCUMENT_ATTRIBUTE_KEY, cvDocument)}
            onRemoveClick={() => onRemoveDocument(CV_DOCUMENT_ATTRIBUTE_KEY, cvDocument)}
          />
          {cvDocument && (
            <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
              <Switch
                id="cv-share-premium"
                checked={cvShareEnabled}
                onCheckedChange={async (checked) => {
                  await updateProfileAttribute(CV_SHARE_WITH_PREMIUM_ATTRIBUTE_KEY, checked, "private");
                  await onRefreshProfile();
                }}
              />
              <label htmlFor="cv-share-premium" className="text-sm font-medium text-slate-700 cursor-pointer">
                CV'mi Premium üyeler görebilsin
              </label>
            </div>
          )}
        </>
      ) : null}

      {presentationUploadEnabled ? (
        <ProfileDocumentCard
          cardClassName={GOOGLE_SOFT_CARD_RED_SECTION}
          title="Sunum / Tanıtım"
          description="Private bucket içinde saklanır. Public profile linklerine eklenmez."
          icon={BookOpen}
          document={presentationDocument}
          acceptLabel="PDF, PPT, PPTX, KEY"
          statusLabel={formatDocumentMeta(presentationDocument)}
          isUploading={uploadingDocumentKey === PRESENTATION_DOCUMENT_ATTRIBUTE_KEY}
          isRemoving={removingDocumentKey === PRESENTATION_DOCUMENT_ATTRIBUTE_KEY}
          isOpening={openingDocumentKey === PRESENTATION_DOCUMENT_ATTRIBUTE_KEY}
          onUploadClick={() => presentationInputRef.current?.click()}
          onOpenClick={() => onOpenDocument(PRESENTATION_DOCUMENT_ATTRIBUTE_KEY, presentationDocument)}
          onRemoveClick={() => onRemoveDocument(PRESENTATION_DOCUMENT_ATTRIBUTE_KEY, presentationDocument)}
        />
      ) : null}

      {licenseUploadEnabled ? (
        <ProfileDocumentCard
          cardClassName={GOOGLE_SOFT_CARD_YELLOW_SECTION}
          title="İşletme Ruhsatı / Meslek Lisansı"
          description="Private bucket içinde saklanır. Yalnızca sen ve admin erişebilir."
          icon={FileText}
          document={licenseDocument}
          acceptLabel="PDF, JPG, PNG"
          statusLabel={formatDocumentMeta(licenseDocument)}
          isUploading={uploadingDocumentKey === LICENSE_DOCUMENT_ATTRIBUTE_KEY}
          isRemoving={removingDocumentKey === LICENSE_DOCUMENT_ATTRIBUTE_KEY}
          isOpening={openingDocumentKey === LICENSE_DOCUMENT_ATTRIBUTE_KEY}
          onUploadClick={() => licenseInputRef.current?.click()}
          onOpenClick={() => onOpenDocument(LICENSE_DOCUMENT_ATTRIBUTE_KEY, licenseDocument)}
          onRemoveClick={() => onRemoveDocument(LICENSE_DOCUMENT_ATTRIBUTE_KEY, licenseDocument)}
        />
      ) : null}
    </div>
  );
}
