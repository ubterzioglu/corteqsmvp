// Etkinlikler hero'su — ortak `PageHero` kabuğunun etkinlik yapılandırması.
//
// Biçim ilk olarak burada yazılmıştı; 2026-09-20'de Radar ve Araçlar da aynı düzene
// geçince kabuk `components/common/PageHero.tsx`'e taşındı. Bu dosya yalnız
// ETKİNLİĞE ÖZGÜ içeriği tutar (mor vurgu, kategori rozetleri, üç satır).
// Dışa açılan arayüz değişmedi: `<EventsHero />` — EventsPage'e dokunulmadı.

import { Calendar } from "lucide-react";

import { PageHero } from "@/components/common/PageHero";
import { EVENT_CATEGORY_OPTIONS, type EventCategory } from "@/lib/events-vocabulary";

/**
 * Hero rozetleri kategori etiketlerinin KOPYASI DEĞİL, sözlükten türetilir.
 * Etiketleri buraya elle yazmak `events-vocabulary.test.ts`'in yakaladığı tam olarak
 * o drift'ti: hero "Kültür & Sanat" derken sözlük başka bir şey diyebilirdi.
 * Burada yalnız hangi kategorilerin VİTRİNE çıkacağı ve renkleri seçilir.
 */
const BADGE_TONES: { value: EventCategory; className: string }[] = [
  { value: "networking", className: "border-violet-200/70 text-violet-700" },
  { value: "eğitim", className: "border-blue-200/70 text-blue-700" },
  { value: "kültür", className: "border-indigo-200/70 text-indigo-700" },
  { value: "sosyal", className: "border-rose-200/70 text-rose-700" },
];

const HERO_BADGES = BADGE_TONES.map((tone) => ({
  label: EVENT_CATEGORY_OPTIONS.find((option) => option.value === tone.value)?.label ?? tone.value,
  className: tone.className,
}));

export function EventsHero() {
  return (
    <PageHero
      icon={Calendar}
      iconClassName="text-violet-600"
      shellClassName="border border-violet-100 bg-[radial-gradient(circle_at_top_left,#f5f3ff_0%,#fafafa_45%,#ffffff_100%)]"
      tintClassName="bg-[linear-gradient(135deg,rgba(139,92,246,0.06),transparent_45%,rgba(59,130,246,0.08))]"
      image={{
        src: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=400&fit=crop",
        alt: "Kalabalık bir salonda buluşan insanlar — Türk diaspora etkinlikleri",
      }}
      titleLines={[
        {
          text: "Diaspora",
          gradientClassName: "bg-[linear-gradient(90deg,#7c3aed_0%,#3b82f6_30%,#06b6d4_65%)]",
        },
        {
          text: "Etkinlikleri",
          gradientClassName: "bg-[linear-gradient(90deg,#3b82f6_0%,#8b5cf6_45%,#ec4899_100%)]",
        },
      ]}
      badges={HERO_BADGES}
      lines={[
        "Dünyadaki Türk diaspora etkinliklerini keşfet.",
        "Sana uygun etkinliğe katıl!",
        "Kendi etkinliğini ücretsiz oluştur.",
      ]}
    />
  );
}

export default EventsHero;
