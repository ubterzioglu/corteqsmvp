import { useState } from "react";
import { Loader2, Paperclip, LinkIcon, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

interface JobApplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: { id: string; title: string };
}

const JobApplyDialog = ({ open, onOpenChange, listing }: JobApplyDialogProps) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_BYTES) {
      toast({ title: "Dosya çok büyük", description: "Maksimum 5MB yükleyebilirsiniz.", variant: "destructive" });
      e.target.value = "";
      return;
    }
    setFile(f);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      toast({ title: "Eksik bilgi", description: "Ad-soyad ve e-posta zorunludur.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        toast({ title: "Giriş gerekli", description: "Başvuru için giriş yapın.", variant: "destructive" });
        setSubmitting(false);
        return;
      }
      let attachment_url: string | null = null;
      let attachment_name: string | null = null;
      if (file) {
        const path = `${auth.user.id}/${listing.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("job-applications").upload(path, file);
        if (upErr) throw upErr;
        attachment_url = path;
        attachment_name = file.name;
      }
      const { error } = await supabase.from("job_applications").insert({
        listing_id: listing.id,
        applicant_id: auth.user.id,
        applicant_name: name.trim(),
        applicant_email: email.trim(),
        applicant_phone: phone.trim() || null,
        message: message.trim() || null,
        link_url: linkUrl.trim() || null,
        attachment_url,
        attachment_name,
      });
      if (error) throw error;
      toast({ title: "Başvurun iletildi! 🎉", description: "İlan sahibine bildirim gönderildi." });
      onOpenChange(false);
      setName(""); setEmail(""); setPhone(""); setMessage(""); setLinkUrl(""); setFile(null);
    } catch (e: any) {
      toast({ title: "Hata", description: e?.message || "Başvuru gönderilemedi", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>İlana Başvur</DialogTitle>
          <DialogDescription className="line-clamp-2">{listing.title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Ad Soyad *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Adınız Soyadınız" />
            </div>
            <div>
              <Label>E-posta *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@mail.com" />
            </div>
          </div>
          <div>
            <Label>Telefon</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+49 …" />
          </div>
          <div>
            <Label>Mesaj / Ön Yazı</Label>
            <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Kendinizi kısaca tanıtın…" />
          </div>
          <div>
            <Label className="flex items-center gap-1.5"><LinkIcon className="h-3.5 w-3.5" /> Portfolyo / LinkedIn / Site</Label>
            <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div>
            <Label className="flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5" /> CV / Belge (max 5 MB)</Label>
            <Input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp" onChange={handleFileChange} />
            {file && <p className="text-xs text-muted-foreground mt-1">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">İptal</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="flex-1 gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Başvuruyu Gönder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobApplyDialog;
