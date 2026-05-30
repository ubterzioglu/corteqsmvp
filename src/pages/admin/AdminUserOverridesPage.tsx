import { useEffect, useMemo, useState } from "react";

import AdminPageGuideAccordion, { type AdminPageGuideSection } from "@/components/admin/AdminPageGuideAccordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { clearUserFeatureOverrideAsAdmin, setUserFeatureOverrideDetailedAsAdmin } from "@/lib/admin";

type UserRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  profile_type: string;
};

type FeatureRow = {
  key: string;
  label: string;
  scope_role: string;
};

type OverrideRow = {
  user_id: string;
  feature_key: string;
  is_enabled: boolean;
  reason: string | null;
  updated_at: string;
};

const guideSections: AdminPageGuideSection[] = [
  {
    title: "Bu ekran ne için kullanılır?",
    items: [
      "Bu ekran, sadece tek bir kullanıcı için özel yetki açmak veya kapatmak için kullanılır.",
      "Yani tüm rolü değiştirmeden sadece bir kişiye istisna tanımlarsın.",
      "Geçici erişim verme, özel izin açma veya hatalı bir davranışı kullanıcı bazında düzeltme için en doğru yer burasıdır.",
      "Bu ekran attribute, taxonomy veya public profil section istisnası vermez; yalnızca feature override yazar.",
    ],
  },
  {
    title: "Adım adım nasıl kullanılır?",
    items: [
      "1. İlk açılır listeden kullanıcıyı seç.",
      "2. İkinci listeden o kullanıcı için override vermek istediğin feature'ı seç.",
      "3. `Aç` veya `Kapat` kararını seç.",
      "4. `Override nedeni` alanına neden bu istisnayı verdiğini kısa ama anlaşılır şekilde yaz.",
      "5. `Override Kaydet` butonuna bas.",
      "6. Alttaki listede yeni override kaydının oluştuğunu kontrol et.",
      "7. Kullanıcı seçince listelenen feature'lar rol scope'una göre filtrelenir; aradığın kayıt burada yoksa önce rol veya global feature tanımını kontrol et.",
    ],
  },
  {
    title: "Hangi durumda burada işlem yapmalısın?",
    items: [
      "Sorun sadece tek kullanıcıdaysa burada işlem yap.",
      "Sorun aynı roldeki herkes için geçerliyse burada override verme; `Roller & Featurelar` ekranına git.",
      "Kullanıcının rolü tamamen yanlışsa override ile uğraşma; önce `Loginli Kullanıcılar & Roller` ekranından rolü düzelt.",
      "Sorun form alanı, public kart görünümü veya alt kategori seçimi ise bu ekran yerine ilgili yönetim ekranını kullan.",
    ],
  },
  {
    title: "Kaydettikten sonra ne kontrol etmelisin?",
    items: [
      "Override listesinde doğru kullanıcı, doğru feature ve doğru açık-kapalı durumu görünüyor mu kontrol et.",
      "Geçici amaçla açtığın override'ları iş bitince `Kaldır` ile temizle; gereksiz eski istisnalar sistemi kirletir.",
      "Aynı kullanıcı beklenmedik erişim gösteriyorsa burada eski bir override kalmış olabilir; arama kutusuyla kullanıcıyı tekrar kontrol et.",
      "Dashboard erişimi override ettiysen kullanıcının profil ekranındaki dashboard erişim özetinden sonucu da görebilirsin.",
    ],
  },
];

const AdminUserOverridesPage = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [overrides, setOverrides] = useState<OverrideRow[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedFeatureKey, setSelectedFeatureKey] = useState("");
  const [reason, setReason] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      const [usersResult, featuresResult, overridesResult] = await Promise.all([
        supabase.from("user_profiles").select("user_id, email, full_name, profile_type").order("created_at", { ascending: false }),
        supabase.from("feature_catalog").select("key, label, scope_role").order("key"),
        supabase.from("user_feature_overrides").select("user_id, feature_key, is_enabled, reason, updated_at").order("updated_at", { ascending: false }),
      ]);

      if (!isMounted) return;

      if (usersResult.error || featuresResult.error || overridesResult.error) {
        toast({
          title: "Override verileri alınamadı",
          description: usersResult.error?.message ?? featuresResult.error?.message ?? overridesResult.error?.message ?? "Bilinmeyen hata",
          variant: "destructive",
        });
        return;
      }

      const userRows = (usersResult.data ?? []) as UserRow[];
      setUsers(userRows);
      setFeatures((featuresResult.data ?? []) as FeatureRow[]);
      setOverrides((overridesResult.data ?? []) as OverrideRow[]);
      setSelectedUserId(userRows[0]?.user_id ?? "");
    })();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const selectedUser = useMemo(() => users.find((user) => user.user_id === selectedUserId) ?? null, [users, selectedUserId]);

  const scopedFeatures = useMemo(() => {
    if (!selectedUser) return [];
    return features.filter((feature) => feature.scope_role === selectedUser.profile_type);
  }, [features, selectedUser]);

  const filteredOverrides = useMemo(() => {
    const normalizedSearch = searchText.trim().toLocaleLowerCase("tr-TR");
    return overrides.filter((override) => {
      if (!normalizedSearch) return true;
      const user = users.find((item) => item.user_id === override.user_id);
      const label = user?.full_name ?? user?.email ?? override.user_id;
      return label.toLocaleLowerCase("tr-TR").includes(normalizedSearch) || override.feature_key.includes(normalizedSearch);
    });
  }, [overrides, searchText, users]);

  const handleSaveOverride = async () => {
    if (!selectedUser || !selectedFeatureKey) return;

    setSubmitting(true);
    try {
      await setUserFeatureOverrideDetailedAsAdmin(selectedUser.user_id, selectedFeatureKey, isEnabled, reason.trim() || null);
      const nextOverride: OverrideRow = {
        user_id: selectedUser.user_id,
        feature_key: selectedFeatureKey,
        is_enabled: isEnabled,
        reason: reason.trim() || null,
        updated_at: new Date().toISOString(),
      };
      setOverrides((current) => {
        const filtered = current.filter(
          (override) => !(override.user_id === nextOverride.user_id && override.feature_key === nextOverride.feature_key),
        );
        return [nextOverride, ...filtered];
      });
      setReason("");
      toast({
        title: "Override kaydedildi",
        description: `${selectedUser.full_name ?? selectedUser.email ?? selectedUser.user_id} için override güncellendi.`,
      });
    } catch (error) {
      toast({
        title: "Override kaydedilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearOverride = async (override: OverrideRow) => {
    try {
      await clearUserFeatureOverrideAsAdmin(override.user_id, override.feature_key);
      setOverrides((current) =>
        current.filter((item) => !(item.user_id === override.user_id && item.feature_key === override.feature_key)),
      );
      toast({
        title: "Override kaldırıldı",
        description: `${override.feature_key} override kaydı silindi.`,
      });
    } catch (error) {
      toast({
        title: "Override kaldırılamadı",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageGuideAccordion
        summary="Rol varsayımını ezerek tek kullanıcı seviyesinde feature açıp kapatmak ve istisna kayıtları izlemek için bu ekranı kullan."
        sections={guideSections}
      />
      <Card>
        <CardHeader>
          <CardTitle>User Feature Overrides</CardTitle>
          <CardDescription>Kullanıcı bazlı feature açma/kapatma, sebep yazma ve override kaldırma.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <div className="space-y-3 rounded-xl border p-4">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Kullanıcı seç" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {(user.full_name ?? user.email ?? user.user_id) + ` • ${user.profile_type}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedFeatureKey} onValueChange={setSelectedFeatureKey} disabled={!selectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Feature seç" />
              </SelectTrigger>
              <SelectContent>
                {scopedFeatures.map((feature) => (
                  <SelectItem key={`${feature.scope_role}:${feature.key}`} value={feature.key}>
                    {feature.label} ({feature.key})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={isEnabled ? "enabled" : "disabled"} onValueChange={(value) => setIsEnabled(value === "enabled")}>
              <SelectTrigger>
                <SelectValue placeholder="Override türü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enabled">Aç</SelectItem>
                <SelectItem value="disabled">Kapat</SelectItem>
              </SelectContent>
            </Select>

            <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Override nedeni" />

            <Button className="w-full" disabled={!selectedUserId || !selectedFeatureKey || submitting} onClick={() => void handleSaveOverride()}>
              {submitting ? "Kaydediliyor..." : "Override Kaydet"}
            </Button>
          </div>

          <div className="space-y-3">
            <Input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Override ara" />
            <div className="space-y-3">
              {filteredOverrides.map((override) => {
                const user = users.find((item) => item.user_id === override.user_id);
                return (
                  <div key={`${override.user_id}:${override.feature_key}`} className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{user?.full_name ?? user?.email ?? override.user_id}</p>
                        <p className="text-xs text-muted-foreground">{override.feature_key}</p>
                        <p className="mt-1 text-sm text-muted-foreground">Sebep: {override.reason ?? "-"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded border px-2 py-1 text-xs">
                          {override.is_enabled ? "Override Açık" : "Override Kapalı"}
                        </span>
                        <Button size="sm" variant="outline" onClick={() => void handleClearOverride(override)}>
                          Kaldır
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredOverrides.length === 0 ? (
                <p className="text-sm text-muted-foreground">Henüz override kaydı bulunmuyor.</p>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserOverridesPage;
