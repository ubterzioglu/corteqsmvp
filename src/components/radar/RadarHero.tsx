// Radar hero'su — Etkinlikler ile AYNI kabuk (`PageHero`), radar yapılandırmasıyla.
//
// Öncesi: /radar sayfasının başlığı ince bir bant içinde düz metindi ve sağ kenarda
// 112px'lik küçük bir görsel vardı. 2026-09-20'de kullanıcı bu sayfanın da Etkinlikler
// formatına geçmesini istedi.
//
// Görsel `public/radar-hero.png` — zaten depoda olan radar/dünya çizimi. Eskiden
// `alt=""` ile dekoratif işaretlenmişti; hero ölçüsüne çıkınca sayfanın ne hakkında
// olduğunu anlatan bir görsel oldu, bu yüzden gerçek bir alt metin aldı.

import { RadioTower } from "lucide-react";

import { PageHero } from "@/components/common/PageHero";

export function RadarHero() {
  return (
    <PageHero
      icon={RadioTower}
      iconClassName="text-teal-600"
      shellClassName="border border-teal-100 bg-[radial-gradient(circle_at_top_left,#ecfdf7_0%,#fafafa_45%,#ffffff_100%)]"
      tintClassName="bg-[linear-gradient(135deg,rgba(13,148,136,0.07),transparent_45%,rgba(59,130,246,0.08))]"
      image={{
        src: "/radar-hero.png",
        alt: "Dünya haritası üzerinde tarama yapan radar ekranı",
      }}
      titleLines={[
        {
          text: "Diaspora",
          gradientClassName: "bg-[linear-gradient(90deg,#0d9488_0%,#0ea5e9_35%,#3b82f6_70%)]",
        },
        {
          text: "Radarı",
          gradientClassName: "bg-[linear-gradient(90deg,#3b82f6_0%,#0ea5e9_45%,#14b8a6_100%)]",
        },
      ]}
      badges={[
        { label: "Haberler", className: "border-teal-200/70 text-teal-700" },
        { label: "Duyurular", className: "border-sky-200/70 text-sky-700" },
        { label: "Ülke Rehberleri", className: "border-blue-200/70 text-blue-700" },
      ]}
      lines={[
        "Türk diasporasından haberler ve topluluk sinyalleri.",
        "Ülke ülke rehberler, tek sayfada.",
        "Kaynaklar her gün taranır.",
      ]}
    />
  );
}

export default RadarHero;
