import { useState } from "react";
import { ExternalLink, FileText, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { createServiceAttachmentUrl } from "@/lib/service-attachment-url";

type ServiceAttachmentLinkProps = {
  /** DB'deki kayıt: storage path (yeni) veya public/imzalı URL (eski). */
  stored: string;
  index: number;
};

/**
 * B3/Y6: hizmet talebi ekleri PRIVATE bucket'ta — doğrudan link YOK.
 * Tıklayınca RLS'e uygun (own-or-admin) 15 dakikalık imzalı adres üretilir
 * ve yeni sekmede açılır. Yetki/dosya yoksa kullanıcıya Türkçe mesaj gösterilir.
 */
export function ServiceAttachmentLink({ stored, index }: ServiceAttachmentLinkProps) {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const open = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const url = await createServiceAttachmentUrl(stored);
      if (!url) {
        toast({
          title: "Ek açılamadı",
          description: "Bu dosyaya erişim izniniz yok ya da dosya artık mevcut değil.",
          variant: "destructive",
        });
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={open}
      disabled={busy}
      aria-label={`Dosya ${index + 1} eki`}
      className="cursor-pointer"
    >
      <Badge variant="outline" className="gap-1.5 cursor-pointer hover:bg-muted">
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
        Dosya {index + 1} <ExternalLink className="h-3 w-3" />
      </Badge>
    </button>
  );
}
