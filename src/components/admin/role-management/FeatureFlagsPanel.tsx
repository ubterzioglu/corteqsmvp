import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  setRoleFeatureFlagAsAdmin,
  setFeatureGlobalStateAsAdmin,
  upsertEntityMetadataAsAdmin,
  type RoleManagementFeature,
} from "@/lib/admin";

type Props = {
  roleKey: string;
  roleLabel: string;
  features: RoleManagementFeature[];
  onFeaturesChange: (next: RoleManagementFeature[]) => void;
};

const FeatureFlagsPanel = ({ roleKey, roleLabel, features, onFeaturesChange }: Props) => {
  const { toast } = useToast();
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [editingDesc, setEditingDesc] = useState<string | null>(null);
  const [descDraft, setDescDraft] = useState("");

  const handleRoleToggle = async (feature: RoleManagementFeature, nextEnabled: boolean) => {
    onFeaturesChange(
      features.map((f) => (f.key === feature.key ? { ...f, is_enabled: nextEnabled } : f)),
    );
    setSavingKey(`role:${feature.key}`);
    try {
      await setRoleFeatureFlagAsAdmin(roleKey, feature.key, nextEnabled);
      toast({
        title: "Feature güncellendi",
        description: `${roleLabel} → ${feature.label} ${nextEnabled ? "açıldı" : "kapatıldı"}`,
      });
    } catch (err: unknown) {
      onFeaturesChange(features);
      toast({
        title: "Kaydedilemedi",
        description: err instanceof Error ? err.message : "Beklenmeyen hata",
        variant: "destructive",
      });
    } finally {
      setSavingKey(null);
    }
  };

  const handleGlobalToggle = async (feature: RoleManagementFeature, nextGlobal: boolean) => {
    onFeaturesChange(
      features.map((f) => (f.key === feature.key ? { ...f, is_active_globally: nextGlobal } : f)),
    );
    setSavingKey(`global:${feature.key}`);
    try {
      await setFeatureGlobalStateAsAdmin(feature.key, nextGlobal);
      toast({
        title: "Global durum güncellendi",
        description: `${feature.key} ${nextGlobal ? "global açık" : "global kapalı"}`,
      });
    } catch (err: unknown) {
      onFeaturesChange(features);
      toast({
        title: "Kaydedilemedi",
        description: err instanceof Error ? err.message : "Beklenmeyen hata",
        variant: "destructive",
      });
    } finally {
      setSavingKey(null);
    }
  };

  const saveDescription = async (feature: RoleManagementFeature) => {
    try {
      await upsertEntityMetadataAsAdmin({
        entityType: "feature",
        entityKey: feature.key,
        description: descDraft || null,
      });
      onFeaturesChange(
        features.map((f) => (f.key === feature.key ? { ...f, description: descDraft || null } : f)),
      );
      toast({ title: "Açıklama kaydedildi" });
    } catch (err: unknown) {
      toast({
        title: "Açıklama kaydedilemedi",
        description: err instanceof Error ? err.message : "Beklenmeyen hata",
        variant: "destructive",
      });
    } finally {
      setEditingDesc(null);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">Feature Bayrakları</h3>
      <p className="text-xs text-muted-foreground">
        {roleLabel} rolü için hangi featureların açık olduğunu ve global durumlarını yönet.
      </p>

      {features.length === 0 && (
        <p className="text-sm text-muted-foreground">Bu rol için tanımlı feature yok.</p>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left text-[12px] font-medium">Feature</th>
              <th className="w-24 px-3 py-2 text-left text-[12px] font-medium">Global</th>
              <th className="w-24 px-3 py-2 text-left text-[12px] font-medium">{roleLabel}</th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature, idx) => {
              const disabledRole   = savingKey === `role:${feature.key}`;
              const disabledGlobal = savingKey === `global:${feature.key}`;
              return (
                <tr
                  key={feature.key}
                  className={`border-t align-top ${idx % 2 === 0 ? "bg-white" : "bg-muted/10"}`}
                >
                  <td className="px-3 py-2">
                    <p className="text-[13px] font-medium leading-5">{feature.label}</p>
                    <p className="text-[10px] text-muted-foreground">{feature.key}</p>
                    {editingDesc === feature.key ? (
                      <div className="mt-1 flex items-center gap-1.5">
                        <Input
                          className="h-6 text-xs px-1.5"
                          value={descDraft}
                          onChange={(e) => setDescDraft(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") void saveDescription(feature); if (e.key === "Escape") setEditingDesc(null); }}
                          autoFocus
                        />
                        <button type="button" className="text-[10px] text-primary" onClick={() => void saveDescription(feature)}>Kaydet</button>
                        <button type="button" className="text-[10px] text-muted-foreground" onClick={() => setEditingDesc(null)}>İptal</button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="mt-0.5 text-[10px] text-muted-foreground hover:text-foreground text-left"
                        onClick={() => { setEditingDesc(feature.key); setDescDraft(feature.description ?? ""); }}
                      >
                        {feature.description ? feature.description : "Açıklama ekle…"}
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={feature.is_active_globally}
                        disabled={disabledGlobal}
                        onCheckedChange={(checked) => void handleGlobalToggle(feature, checked)}
                      />
                      <Badge variant={feature.is_active_globally ? "secondary" : "outline"} className="px-1.5 py-0 text-[10px]">
                        {feature.is_active_globally ? "Açık" : "Kapalı"}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Switch
                      checked={feature.is_enabled}
                      disabled={disabledRole}
                      onCheckedChange={(checked) => void handleRoleToggle(feature, checked)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeatureFlagsPanel;
