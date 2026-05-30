import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Globe2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  providerId: string;
  providerName: string;
  providerKind?: "consultant" | "blogger" | "vlogger";
  trigger?: React.ReactNode;
}

const DURATIONS = [15, 30, 45, 60];

const AppointmentBookingDialog = ({ open, onOpenChange, providerId, providerName, providerKind = "consultant" }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const submit = async () => {
    if (!user) {
      toast({ title: "Giriş gerekli", description: "Randevu talep etmek için giriş yapmalısınız.", variant: "destructive" });
      return;
    }
    if (!date || !time) {
      toast({ title: "Tarih & saat seçin", variant: "destructive" });
      return;
    }
    setSaving(true);
    // Build a local Date in the user's timezone, then store as UTC ISO
    const localIso = `${date}T${time}:00`;
    const scheduled = new Date(localIso);
    const { error } = await supabase.from("appointments").insert({
      provider_id: providerId,
      provider_kind: providerKind,
      client_id: user.id,
      client_name: name || user.email || null,
      client_email: email || user.email || null,
      client_timezone: userTz,
      scheduled_at: scheduled.toISOString(),
      duration_minutes: Number(duration),
      topic: topic || null,
      notes: notes || null,
      status: "pending",
    });
    setSaving(false);
    if (error) {
      toast({ title: "Talep gönderilemedi", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Randevu talebiniz iletildi", description: `${providerName} onayladığında bildirim alacaksınız.` });
    onOpenChange(false);
    setDate(""); setTime(""); setTopic(""); setNotes("");
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Randevu Talep Et</DialogTitle>
          <DialogDescription>
            {providerName} ile canlı görüşme için kendi saat diliminizden uygun zamanı seçin.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
          <Globe2 className="h-3.5 w-3.5" /> Saat diliminiz: <span className="font-semibold text-foreground">{userTz}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="appt-date">Tarih</Label>
            <Input id="appt-date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="appt-time">Saat</Label>
            <Input id="appt-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <div>
          <Label>Süre</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DURATIONS.map((d) => <SelectItem key={d} value={String(d)}>{d} dk</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="appt-topic">Konu (opsiyonel)</Label>
          <Input id="appt-topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Örn. Vize başvurusu danışmanlığı" />
        </div>

        <div>
          <Label htmlFor="appt-notes">Notlarınız (opsiyonel)</Label>
          <Textarea id="appt-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>

        {!user?.email && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="appt-name">Ad Soyad</Label>
              <Input id="appt-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="appt-email">E-posta</Label>
              <Input id="appt-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Vazgeç</Button>
          <Button onClick={submit} disabled={saving} className="gap-2">
            <Clock className="h-4 w-4" /> {saving ? "Gönderiliyor..." : "Randevu Talep Et"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentBookingDialog;
