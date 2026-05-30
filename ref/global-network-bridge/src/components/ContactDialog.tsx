import { useState } from "react";
import { z } from "zod";
import { Mail, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  full_name: z.string().trim().min(2, "İsim en az 2 karakter").max(120),
  email: z.string().trim().email("Geçerli bir e-posta girin").max(254),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

interface Props {
  trigger?: React.ReactNode;
  className?: string;
}

const ContactDialog = ({ trigger, className }: Props) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", country: "", city: "", message: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Eksik bilgi", description: parsed.error.errors[0]?.message, variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await (supabase.from("contact_messages") as any).insert({
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      country: parsed.data.country || null,
      city: parsed.data.city || null,
      message: parsed.data.message || null,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Gönderilemedi", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Mesajın iletildi 🎉", description: "Platform yöneticisi en kısa sürede dönüş yapacak." });
    setForm({ full_name: "", email: "", country: "", city: "", message: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button className={className ?? "hover:text-primary transition-colors text-left"}>İletişim</button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" /> Bize ulaşın
          </DialogTitle>
          <DialogDescription>
            Mesajın doğrudan platform yöneticisine iletilir. 1 iş günü içinde dönüş yapılır.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="cm-name">İsim *</Label>
            <Input id="cm-name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} maxLength={120} required />
          </div>
          <div>
            <Label htmlFor="cm-email">E-posta *</Label>
            <Input id="cm-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={254} required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="cm-country">Ülke</Label>
              <Input id="cm-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} maxLength={80} />
            </div>
            <div>
              <Label htmlFor="cm-city">Şehir</Label>
              <Input id="cm-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} maxLength={80} />
            </div>
          </div>
          <div>
            <Label htmlFor="cm-msg">Mesajın</Label>
            <Textarea id="cm-msg" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={2000} placeholder="Nasıl yardımcı olabiliriz?" />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Gönder
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactDialog;
