// Workshop m88 — "Yakında gelecek özellikler" tek alanı.
//
// Önceki durum: çalışmayan fonksiyonlar bulundukları yerde tek tek gösteriliyordu
// (filtre şeridinde disabled "Yakınımda" çipi gibi). Kullanıcı bunları çalışan
// kontrollerle aynı satırda görünce her seferinde deniyor ve tıkanıyordu.
// Karar: hepsi buraya toplanır, kendi yüzeylerinden kalkar.
//
// İSTİSNA — CorteQS Çarşı: kendi markalı teaser'ı m40/m51 kararıyla ayrı yaşar
// (CarsiGlobalTicker). Buraya taşınmaz, o bilinçli bir pazarlama yüzeyi.
//
// Yeni bir "yakında" özelliği çıktığında: kendi yüzeyinde disabled kontrol BIRAKMA,
// buraya tek satır ekle.

import { Clock3 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ComingSoonFeature = {
  key: string;
  label: string;
  /** Neden henüz açık değil — kullanıcı "bozuk mu" diye düşünmesin. */
  note: string;
};

// Bilinçli olarak dışa AÇILMADI: react-refresh kuralı bileşen dosyasından sabit
// ihracını uyarıyor. Liste büyürse ayrı bir modüle çıkar, buraya export ekleme.
const CADDE_COMING_SOON_FEATURES: readonly ComingSoonFeature[] = [
  {
    key: "nearby",
    label: "Yakınımda akışı",
    note: "Konum koordinatı altyapısı tamamlanınca açılacak.",
  },
];

const CaddeComingSoon = () => {
  if (CADDE_COMING_SOON_FEATURES.length === 0) return null;

  return (
    <Card className="border-slate-200 bg-white/90" data-testid="cadde-coming-soon">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1.5 font-display text-base">
          <Clock3 className="h-4 w-4 text-slate-400" />
          Yakında gelecek özellikler
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-2">
          {CADDE_COMING_SOON_FEATURES.map((feature) => (
            <li key={feature.key} className="text-sm">
              <span className="font-medium text-slate-800">{feature.label}</span>
              <span className="block text-xs leading-relaxed text-slate-500">{feature.note}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default CaddeComingSoon;
