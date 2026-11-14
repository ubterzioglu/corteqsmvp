import { GENERIC_FEATURE_KEYS, type GenericFeatureKey } from "@/lib/features";

export type RequestableFeature = {
  key: GenericFeatureKey;
  title: string;
  description: string;
};

/** "Başvurular & Erişimler" kartında tek tıkla talep bırakılabilen özellikler. */
export const REQUESTABLE_FEATURES: RequestableFeature[] = [
  {
    key: GENERIC_FEATURE_KEYS.directoryVisible,
    title: "Rehber Görünürlüğü",
    description: "Halka açık rehberde görünmek için onay isteği oluştur.",
  },
  {
    key: GENERIC_FEATURE_KEYS.directoryFeatured,
    title: "Öne Çıkarılmış Profil",
    description: "Profilinin rehberde öne çıkarılmış kart olarak listelenmesini iste.",
  },
  {
    key: GENERIC_FEATURE_KEYS.contactShowWhatsapp,
    title: "WhatsApp Yayınlama",
    description: "WhatsApp bilgisini public göstermek için onay isteği gönder.",
  },
  {
    key: GENERIC_FEATURE_KEYS.eventsCreate,
    title: "Etkinlik Oluşturma",
    description: "Etkinlik oluşturma akışına erişim için talep bırak.",
  },
  {
    key: GENERIC_FEATURE_KEYS.offersCreate,
    title: "Teklif / Hizmet Oluşturma",
    description: "Teklif yayınlama erişimi için talep bırak.",
  },
  {
    key: GENERIC_FEATURE_KEYS.referralCreate,
    title: "Referral Oluşturma",
    description: "Referral oluşturma erişimi için talep bırak.",
  },
];
