import { useEffect, useState, useCallback } from "react";

export type ConsultantFeatureKey =
  | "message"
  | "follow"
  | "live_call"
  | "ai_twin"
  | "whatsapp"
  | "appointments"
  | "location"
  | "directions"
  | "bio_tab"
  | "specialties_tab"
  | "events_tab"
  | "contact_tab";

export interface FeatureMeta {
  key: ConsultantFeatureKey;
  label: string;
  description: string;
  category: "İletişim" | "Randevu" | "Konum" | "İçerik";
  defaultEnabled: boolean;
  comingSoon?: boolean;
}

export const CONSULTANT_FEATURES: FeatureMeta[] = [
  { key: "message", label: "Mesaj Gönder", description: "Ziyaretçiler size platform üzerinden mesaj atabilir.", category: "İletişim", defaultEnabled: true },
  { key: "follow", label: "Takip Et", description: "Ziyaretçiler profilinizi takip edebilir.", category: "İletişim", defaultEnabled: true },
  { key: "whatsapp", label: "WhatsApp ile Görüş", description: "Profilde WhatsApp butonu görünür.", category: "İletişim", defaultEnabled: true },
  { key: "appointments", label: "Randevu Al", description: "Takvim üzerinden randevu talep edilebilir.", category: "Randevu", defaultEnabled: true },
  { key: "live_call", label: "Canlı Görüşme", description: "Anlık video görüşme talebi alın.", category: "Randevu", defaultEnabled: true },
  { key: "ai_twin", label: "AI Twin Seans", description: "Yapay zeka klonunuzla 7/24 görüşme.", category: "Randevu", defaultEnabled: false, comingSoon: true },
  { key: "location", label: "Konum", description: "Profilde Google Maps konum butonu görünür.", category: "Konum", defaultEnabled: true },
  { key: "directions", label: "Yol Tarifi", description: "Profilde yol tarifi butonu görünür.", category: "Konum", defaultEnabled: true },
  { key: "bio_tab", label: "Hakkında Sekmesi", description: "Biyografi/tanıtım metni sekmesi.", category: "İçerik", defaultEnabled: true },
  { key: "specialties_tab", label: "Uzmanlık Alanları Sekmesi", description: "Uzmanlık alanları sekmesi.", category: "İçerik", defaultEnabled: true },
  { key: "events_tab", label: "Etkinlik Takvimi Sekmesi", description: "Yaklaşan etkinlikler sekmesi.", category: "İçerik", defaultEnabled: true },
  { key: "contact_tab", label: "İletişim Sekmesi", description: "İletişim bilgileri sekmesi.", category: "İçerik", defaultEnabled: true },
];

const storageKey = (consultantId: string) => `profile_features_consultant_${consultantId}`;

export type FeaturesState = Record<ConsultantFeatureKey, boolean>;

const buildDefaults = (): FeaturesState =>
  CONSULTANT_FEATURES.reduce((acc, f) => {
    acc[f.key] = f.defaultEnabled;
    return acc;
  }, {} as FeaturesState);

export function useConsultantFeatures(consultantId: string | undefined) {
  const [features, setFeatures] = useState<FeaturesState>(buildDefaults);

  useEffect(() => {
    if (!consultantId) return;
    try {
      const raw = localStorage.getItem(storageKey(consultantId));
      if (raw) setFeatures({ ...buildDefaults(), ...JSON.parse(raw) });
      else setFeatures(buildDefaults());
    } catch {
      setFeatures(buildDefaults());
    }
  }, [consultantId]);

  const setFeature = useCallback(
    (key: ConsultantFeatureKey, value: boolean) => {
      setFeatures((prev) => {
        const next = { ...prev, [key]: value };
        if (consultantId) {
          try {
            localStorage.setItem(storageKey(consultantId), JSON.stringify(next));
          } catch {}
        }
        return next;
      });
    },
    [consultantId]
  );

  const isEnabled = useCallback((key: ConsultantFeatureKey) => features[key] ?? false, [features]);
  const isComingSoon = useCallback(
    (key: ConsultantFeatureKey) => CONSULTANT_FEATURES.find((f) => f.key === key)?.comingSoon ?? false,
    []
  );

  return { features, setFeature, isEnabled, isComingSoon };
}
