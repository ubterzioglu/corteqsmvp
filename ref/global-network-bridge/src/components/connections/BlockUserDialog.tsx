import { useState } from "react";
import { Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useConnections, BLOCK_REASONS } from "@/hooks/useConnections";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  otherUserId: string;
  otherName: string;
  onBlocked?: () => void;
}

const BlockUserDialog = ({ open, onOpenChange, otherUserId, otherName, onBlocked }: Props) => {
  const { block } = useConnections();
  const [reason, setReason] = useState<string>(BLOCK_REASONS[0]);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const handleBlock = async () => {
    setBusy(true);
    const finalReason = reason === "Diğer" && details.trim() ? `Diğer: ${details.trim()}` : reason;
    const ok = await block(otherUserId, finalReason);
    setBusy(false);
    if (ok) {
      onOpenChange(false);
      onBlocked?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-destructive" /> {otherName} kullanıcısını blokla
          </DialogTitle>
          <DialogDescription>
            Bloklanan kullanıcı seni takip edemez ve mesaj gönderemez. Sebep zorunludur.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Sebep</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BLOCK_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {reason === "Diğer" && (
            <Textarea
              placeholder="Lütfen kısa bir açıklama yaz..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={300}
              rows={3}
            />
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Vazgeç</Button>
          <Button variant="destructive" onClick={handleBlock} disabled={busy}>
            {busy ? "Bloklanıyor..." : "Blokla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BlockUserDialog;
