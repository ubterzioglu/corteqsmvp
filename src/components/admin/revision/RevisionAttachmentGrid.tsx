// Revizyon talebi/yorum görsel ekleri — ortak thumbnail grid.
// AdminRevisionRequestsPage (talep detay drawer'ı) ve RevisionCommentThread
// (her yorumun altı) tarafından kullanılır.

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  deleteAttachment,
  fetchAttachments,
  getAttachmentUrl,
  uploadAttachment,
  type AttachmentParent,
  type RevisionAttachment,
} from "@/lib/admin-shell/revision-requests";

function attachmentsKey(parent: AttachmentParent) {
  return "requestId" in parent
    ? (["revision-attachments", "request", parent.requestId] as const)
    : (["revision-attachments", "comment", parent.commentId] as const);
}

const errMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Beklenmeyen hata";

function AttachmentThumbnail({
  attachment,
  onDelete,
  isDeleting,
}: {
  attachment: RevisionAttachment;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useState(() => {
    getAttachmentUrl(attachment.storagePath)
      .then(setUrl)
      .catch(() => setUrl(null));
  });

  return (
    <div className="group relative h-16 w-16 overflow-hidden rounded border border-border bg-muted">
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img src={url} alt={attachment.fileName} className="h-full w-full object-cover" />
        </a>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      <button
        type="button"
        aria-label="Görseli sil"
        onClick={onDelete}
        disabled={isDeleting}
        className="absolute right-0.5 top-0.5 hidden rounded-full bg-background/90 p-1 text-muted-foreground hover:text-red-500 group-hover:block"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

export type RevisionAttachmentGridProps = {
  parent: AttachmentParent;
};

export function RevisionAttachmentGrid({ parent }: RevisionAttachmentGridProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const key = attachmentsKey(parent);

  const attachmentsQuery = useQuery({
    queryKey: key,
    queryFn: () => fetchAttachments(parent),
  });
  const attachments = attachmentsQuery.data ?? [];

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadAttachment(parent, file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
    onError: (error: unknown) => {
      toast({ title: "Yüklenemedi", description: errMessage(error), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (attachment: RevisionAttachment) =>
      deleteAttachment(attachment.id, attachment.storagePath),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
    onError: (error: unknown) => {
      toast({ title: "Silinemedi", description: errMessage(error), variant: "destructive" });
    },
  });

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => uploadMutation.mutate(file));
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {attachments.map((attachment) => (
          <AttachmentThumbnail
            key={attachment.id}
            attachment={attachment}
            onDelete={() => deleteMutation.mutate(attachment)}
            isDeleting={deleteMutation.isPending}
          />
        ))}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={uploadMutation.isPending}
        onClick={() => fileRef.current?.click()}
      >
        {uploadMutation.isPending ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="mr-1.5 h-3.5 w-3.5" />
        )}
        Görsel Ekle
      </Button>
    </div>
  );
}
