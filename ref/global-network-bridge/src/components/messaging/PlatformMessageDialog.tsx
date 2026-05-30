import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Send, Lock, Mail, UserPlus, Clock } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useConnections } from "@/hooks/useConnections";
import { supabase } from "@/integrations/supabase/client";

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
  recipientKind,
  recipientSlug,
  recipientName,
  recipientUserId,
  defaultSubject,
}: Props) => {
  const { user, profile, accountType } = useAuth();
  const { toast } = useToast();
  const { canMessage, statusWith, requestConnection } = useConnections();
  const navigate = useNavigate();
  const [subject, setSubject] = useState(defaultSubject ?? "");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const isAdmin = accountType === "admin";
  const status = recipientUserId ? statusWith(recipientUserId) : "none";
  const isPending = status === "pending";
  const isAccepted = status === "accepted";
  const isBlocked = status === "blocked" || status === "declined";
  // Without a real recipient user id we cannot enforce DB-level connection (mock profile);
  // in that case fall back to allowing send for admins only.
  const canSend = isAdmin || isAccepted || (!recipientUserId && false);

  const goToAuth = () => {
    const redirect = encodeURIComponent(window.location.pathname + window.location.search);
    onOpenChange(false);
    navigate(`/auth?redirect=${redirect}`);
  };

  const send = async () => {
    if (!user) return;
    if (!canSend) {
      toast({
        title: "Mesaj gönderilemedi",
        description: "Önce takip et ve karşı tarafın onayını bekle.",
        variant: "destructive",
      });
      return;
    }
    const text = body.trim();
    if (!text) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      sender_name: profile?.full_name ?? null,
      recipient_user_id: recipientUserId ?? null,
      recipient_kind: recipientKind,
      recipient_slug: recipientSlug,
      recipient_name: recipientName,
      subject: subject.trim() || null,
      body: text,
      context_url: window.location.pathname,
    });
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
    setSubject("");
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
                Mesajın platform üzerinden iletilir. Cevap geldiğinde panelindeki Mesaj Kutusu'nda bildirim alırsın.
              </DialogDescription>
            </DialogHeader>
            {!canSend && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-foreground flex items-start gap-2">
                {isPending ? (
                  <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                ) : (
                  <Lock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                )}
                <div className="min-w-0">
                  {isPending ? (
                    <p>
                      <strong>Bağlantı onayı bekleniyor.</strong> {recipientName} isteğini onayladığında mesaj gönderebilirsin.
                    </p>
                  ) : isBlocked ? (
                    <p>
                      Bu kullanıcıyla bağlantı kurulamıyor. Mesaj göndermek mümkün değil.
                    </p>
                  ) : !recipientUserId ? (
                    <p>
                      Bu profil henüz platforma katılmamış. Mesajlaşma için kullanıcının kayıt olması gerekir.
                    </p>
                  ) : (
                    <p>
                      Mesaj gönderebilmek için önce <strong>{recipientName}</strong> ile <strong>bağlantı</strong> kurman ve karşı tarafın isteği onaylaması gerekir.
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-3">
              <Input
                placeholder="Konu (opsiyonel)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={120}
                disabled={!canSend}
              />
              <Textarea
                placeholder={canSend ? "Mesajını yaz..." : "Bağlantı onayından sonra yazabilirsin..."}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                maxLength={2000}
                disabled={!canSend}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
              {!canSend && status === "none" && recipientUserId ? (
                <Button onClick={() => requestConnection(recipientUserId, recipientName)} className="gap-2">
                  <UserPlus className="h-4 w-4" /> Bağlantı İsteği Gönder
                </Button>
              ) : (
                <Button onClick={send} disabled={!body.trim() || sending || !canSend} className="gap-2">
                  <Send className="h-4 w-4" /> {sending ? "Gönderiliyor..." : "Gönder"}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PlatformMessageDialog;
