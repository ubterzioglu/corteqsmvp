import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CONSULTANT_FEATURES, useConsultantFeatures } from "@/hooks/useProfileFeatures";
import { useToast } from "@/hooks/use-toast";

interface Props {
  consultantId: string;
}

const ConsultantFeatureToggles = ({ consultantId }: Props) => {
  const { features, setFeature } = useConsultantFeatures(consultantId);
  const { toast } = useToast();

  const grouped = CONSULTANT_FEATURES.reduce<Record<string, typeof CONSULTANT_FEATURES>>((acc, f) => {
    (acc[f.category] ||= []).push(f);
    return acc;
  }, {});

  const handleToggle = (key: string, label: string, value: boolean) => {
    setFeature(key as any, value);
    toast({
      title: value ? `${label} aktif edildi` : `${label} pasif edildi`,
      description: "Değişiklik anında profilinize yansır.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Profilinizde gösterilecek özellikleri buradan açıp kapatabilirsiniz. Pasif edilen özellikler ziyaretçilere gösterilmez. "Yakında" ibareli özellikler aktif edildiğinde otomatik çalışmaya başlar.
        </p>
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">{category}</h3>
          <div className="space-y-2">
            {items.map((f) => (
              <div
                key={f.key}
                className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-foreground text-sm">{f.label}</p>
                    {f.comingSoon && (
                      <Badge className="bg-gold/20 text-gold-foreground hover:bg-gold/20 text-[10px]">Yakında</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>
                </div>
                <Switch
                  checked={features[f.key] ?? false}
                  onCheckedChange={(v) => handleToggle(f.key, f.label, v)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConsultantFeatureToggles;
