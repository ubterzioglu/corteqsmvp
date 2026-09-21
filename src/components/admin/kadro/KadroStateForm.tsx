import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KADRO_STATUSES, KADRO_PRIORITIES } from "@/lib/kadro/kadro-taxonomy";
import type { KadroResolvedRole, KadroRoleState, KadroStatus, KadroPriority } from "@/lib/kadro/kadro-types";

interface KadroStateFormProps {
  role: KadroResolvedRole;
  onSave: (state: Partial<KadroRoleState>) => void;
  isSaving: boolean;
}

export function KadroStateForm({ role, onSave, isSaving }: KadroStateFormProps) {
  const [status, setStatus] = useState(role.currentStatus);
  const [priority, setPriority] = useState(role.currentPriority);
  const [ownerName, setOwnerName] = useState(role.currentOwner);
  const [note, setNote] = useState(role.note);

  useEffect(() => {
    setStatus(role.currentStatus);
    setPriority(role.currentPriority);
    setOwnerName(role.currentOwner);
    setNote(role.note);
  }, [role]);

  const hasChanges = 
    status !== role.currentStatus ||
    priority !== role.currentPriority ||
    ownerName !== role.currentOwner ||
    note !== role.note;

  const handleSave = () => {
    onSave({
      status,
      priority,
      ownerName,
      note,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Durum
        </label>
        <Select value={status} onValueChange={(value) => setStatus(value as KadroStatus)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(KADRO_STATUSES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Öncelik
        </label>
        <Select value={priority} onValueChange={(value) => setPriority(value as KadroPriority)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(KADRO_PRIORITIES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Sorumlu Kişi
        </label>
        <Input
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          placeholder="İsim soyisim"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Not
        </label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Rol hakkında notlar..."
          rows={3}
        />
      </div>

      <Button
        onClick={handleSave}
        disabled={!hasChanges || isSaving}
        className="w-full"
      >
        {isSaving ? "Kaydediliyor..." : hasChanges ? "Değişiklikleri Kaydet" : "Değişiklik Yok"}
      </Button>
    </div>
  );
}
