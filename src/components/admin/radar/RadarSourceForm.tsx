import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { RadarNewsSource } from "@/lib/radarNewsPipeline";

type Props = {
  source: RadarNewsSource;
  onSave: (id: string, patch: Partial<RadarNewsSource>) => Promise<void>;
};

export function RadarSourceForm({ source, onSave }: Props) {
  const [isEnabled, setIsEnabled] = useState(source.is_enabled);
  const [termsChecked, setTermsChecked] = useState(source.terms_checked);
  const [termsNotes, setTermsNotes] = useState(source.terms_notes ?? "");
  const [maxItems, setMaxItems] = useState(String(source.max_items_per_scan));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(source.id, {
        is_enabled: isEnabled,
        terms_checked: termsChecked,
        terms_notes: termsNotes.trim() || null,
        terms_checked_at: termsChecked && !source.terms_checked ? new Date().toISOString() : source.terms_checked_at,
        max_items_per_scan: Math.max(1, Math.min(500, Number(maxItems) || 100)),
      });
    } finally {
      setSaving(false);
    }
  };

  const canEnable = termsChecked;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{source.name}</CardTitle>
          <div className="flex gap-1">
            <Badge variant="outline" className="text-xs">{source.source_type}</Badge>
            <Badge variant="outline" className="text-xs">{source.trust_level}</Badge>
            <Badge
              variant={source.is_enabled && source.terms_checked ? "outline" : "secondary"}
              className="text-xs"
            >
              {source.is_enabled && source.terms_checked ? "Aktif" : "Pasif"}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground break-all">{source.endpoint_url}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <Label className="text-sm">Kullanım Şartları Kontrol Edildi</Label>
              <p className="text-xs text-muted-foreground">Kaynak aktif edilmeden önce zorunlu</p>
            </div>
            <Switch
              checked={termsChecked}
              onCheckedChange={(v) => {
                setTermsChecked(v);
                if (!v) setIsEnabled(false);
              }}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <Label className="text-sm">Tarama Aktif</Label>
              {!canEnable && (
                <p className="text-xs text-destructive">Önce şartları kontrol et</p>
              )}
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
              disabled={!canEnable}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Şart Notları</Label>
          <Textarea
            value={termsNotes}
            onChange={(e) => setTermsNotes(e.target.value)}
            placeholder="RSS kullanım şartları, attribution gereksinimi vb."
            rows={2}
            className="text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Tarama Başına Maksimum Haber</Label>
          <Input
            type="number"
            min={1}
            max={500}
            value={maxItems}
            onChange={(e) => setMaxItems(e.target.value)}
            className="w-32 text-sm"
          />
        </div>

        {source.last_error_message && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Son hata: {source.last_error_message}
          </p>
        )}

        {source.last_success_at && (
          <p className="text-xs text-muted-foreground">
            Son başarılı tarama:{" "}
            {new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(source.last_success_at))}
          </p>
        )}

        <Button size="sm" onClick={() => void handleSave()} disabled={saving}>
          {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
          Kaydet
        </Button>
      </CardContent>
    </Card>
  );
}
