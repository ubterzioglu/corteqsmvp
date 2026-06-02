import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Send, Lock, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";

export type RecipientKind =
  | "consultant"
  | "volunteer"
  | "business"
  | "association"
  | "blogger"
  | "vlogger"
  | "ambassador"
  | "individual";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientKind: RecipientKind;
  recipientSlug: string;
  recipientName: string;
  /** Optional already-known auth user id of the recipient (for real users). */
  recipientUserId?: string | null;
  defaultSubject?: string;
}

const PlatformMessageDialog = ({
  open,
  onOpenChange,
  recipientName,
  recipientUserId,
}: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const goToAuth = () => {
    const redirect = encodeURIComponent(window.location.pathname + window.location.search);
    onOpenChange(false);
    navigate(`/auth?redirect=${redirect}`);
  };

  const send = async () => {
    if (!user) return;
    if (!recipientUserId) {
      toast({
        title: "Mesaj gönderilemedi",
        description: "Bu profilin aktif bir kullanıcı hesabı bulunamadı.",
        variant: "destructive",
      });
      return;
    }
    const text = body.trim();
    if (!text) return;
    setSending(true);
    const payload: TablesInsert<"direct_messages"> = {
      sender_id: user.id,
      recipient_id: recipientUserId,
      content: text,
    };
    const { error } = await supabase.from("direct_messages").insert(payload);
    setSending(false);
    if (error) {
      toast({ title: "Mesaj gönderilemedi", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Mesaj gönderildi",
      description: `${recipientName} en kısa sürede sana dönecek. Mesajların panelindeki Mesaj Kutusu'nda.`,
    });
    setBody("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {!user ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" /> Mesaj göndermek için kayıt ol
              </DialogTitle>
              <DialogDescription>
                Platform içi gizlilik için iletişim doğrudan numara/mail üzerinden yapılmaz. Ücretsiz hesabını oluştur — kayıt biter bitmez {recipientName} ile mesaj penceresinden devam edersin.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Vazgeç</Button>
              <Button onClick={goToAuth} className="gap-2">
                <Mail className="h-4 w-4" /> Kayıt Ol / Giriş Yap
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" /> {recipientName}'e mesaj
              </DialogTitle>
              <DialogDescription>
                Mesajın platform üzerinden iletilir. Cevap geldiğinde panelindeki Mesaj Kutusu'nda görürsün.
              </DialogDescription>
            </DialogHeader>
            {!recipientUserId && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-foreground flex items-start gap-2">
                <Lock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p>Bu profil henüz platforma bağlı bir kullanıcı hesabına sahip değil. Şimdilik mesaj gönderilemiyor.</p>
                </div>
              </div>
            )}
            <div className="space-y-3">
              <Textarea
                placeholder={recipientUserId ? "Mesajını yaz..." : "Bu profil için mesajlaşma henüz aktif değil..."}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                maxLength={2000}
                disabled={!recipientUserId}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
              <Button onClick={send} disabled={!body.trim() || sending || !recipientUserId} className="gap-2">
                <Send className="h-4 w-4" /> {sending ? "Gönderiliyor..." : "Gönder"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PlatformMessageDialog;
