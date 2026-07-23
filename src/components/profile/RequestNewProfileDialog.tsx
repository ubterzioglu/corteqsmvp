import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { requestNewCatalogItem } from "@/lib/member-profile-api";
import { supabase } from "@/integrations/supabase/client";

type FlatRoleOption = {
  key: string;
  label: string;
  description: string | null;
};

type RequestNewProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const RequestNewProfileDialog = ({ open, onOpenChange, onSuccess }: RequestNewProfileDialogProps) => {
  const { toast } = useToast();
  const [roleOptions, setRoleOptions] = useState<FlatRoleOption[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [selectedRoleKey, setSelectedRoleKey] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setRolesLoading(true);

    void (async () => {
      const { data, error } = await supabase.rpc("get_flat_roles");
      if (cancelled) return;

      if (error) {
        setRoleOptions([]);
        setRolesLoading(false);
        toast({
          title: "Rol listesi yüklenemedi",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      const options = (Array.isArray(data) ? data : [])
        .map((item) => ({
          key: typeof item?.key === "string" ? item.key : "",
          label: typeof item?.label === "string" ? item.label : "",
          description: typeof item?.description === "string" ? item.description : null,
        }))
        .filter((item) => item.key && item.label);
      setRoleOptions(options);
      setRolesLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, toast]);

  const resetForm = () => {
    setSelectedRoleKey("");
    setTitle("");
    setNote("");
  };

  const handleSubmit = async () => {
    if (!selectedRoleKey || !title.trim()) return;

    setSubmitting(true);
    try {
      await requestNewCatalogItem(selectedRoleKey, title, note);
      toast({
        title: "Talep gönderildi",
        description: "Yeni profil talebin admin onay kuyruğuna eklendi.",
      });
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Talep gönderilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Profil Aç</DialogTitle>
          <DialogDescription>
            Başka bir rol için ikinci bir profil talep et. Talebin admin onayından sonra profilin açılır;
            mevcut profilin değişmeden kalır.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-profile-role">Rol</Label>
            <Select value={selectedRoleKey} onValueChange={setSelectedRoleKey} disabled={rolesLoading}>
              <SelectTrigger id="new-profile-role">
                <SelectValue placeholder={rolesLoading ? "Roller yükleniyor..." : "Bir rol seç"} />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-profile-title">Profil Başlığı</Label>
            <Input
              id="new-profile-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ör. Dr. Ahmet Yılmaz Danışmanlık"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-profile-note">Kısa Açıklama</Label>
            <Textarea
              id="new-profile-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Admin değerlendirmesi için kısa bir not (opsiyonel)"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            disabled={!selectedRoleKey || !title.trim() || submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting ? "Gönderiliyor..." : "Talebi Gönder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestNewProfileDialog;
