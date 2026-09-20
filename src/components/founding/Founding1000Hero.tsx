// Founding 1000 hero'su — Etkinlikler / Radar / Araçlar ile AYNI kabuk (`PageHero`).
//
// 2026-09-20 (kullanıcı kararı): /founding-1000 de bu düzene geçti. Sayfanın eski
// başlığı `Founding1000Section` içindeki grid'in sol kolonundaydı (rozet + h2 + paragraf)
// ve sayfada HİÇ `h1` yoktu. Başlık buraya taşındı; bölümde yalnız açıklama paragrafı
// ile görsel/istatistik kartı kaldı — aynı cümleyi iki yerde tutmuyoruz.
//
// Renkler sayfanın kendi temasından gelir: `--accent` turuncu (18 85% 55%),
// `--primary` teal (170 65% 42%). Bu yüzden turuncu→teal gradyan seçildi.

import { Globe2 } from "lucide-react";

import { PageHero } from "@/components/common/PageHero";

export function Founding1000Hero() {
  return (
    <PageHero
      icon={Globe2}
      iconClassName="text-orange-500"
      shellClassName="border border-orange-100 bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#fafafa_45%,#ffffff_100%)]"
      tintClassName="bg-[linear-gradient(135deg,rgba(234,88,12,0.07),transparent_45%,rgba(20,184,166,0.08))]"
      image={{
        src: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=400&fit=crop",
        alt: "Uzaydan görünen dünya üzerinde ışıkla birbirine bağlanan şehirler",
      }}
      titleLines={[
        {
          text: "Founding",
          gradientClassName: "bg-[linear-gradient(90deg,#ea580c_0%,#f59e0b_45%,#f97316_80%)]",
        },
        {
          text: "1000",
          gradientClassName: "bg-[linear-gradient(90deg,#f59e0b_0%,#14b8a6_55%,#0d9488_100%)]",
        },
      ]}
      badges={[
        { label: "5 Kıta", className: "border-orange-200/70 text-orange-700" },
        { label: "Her Kıtadan İlk 200", className: "border-teal-200/70 text-teal-700" },
        { label: "Founding Verified Badge", className: "border-amber-200/70 text-amber-700" },
      ]}
      lines={[
        "Diasporanın dijital haritasında erken yerini al.",
        "Her kıtadan yalnızca ilk 200 kontenjan.",
        "Founding Verified rozetiyle öne çık.",
      ]}
    />
  );
}

export default Founding1000Hero;
