import type { KadroRoutine } from "./kadro-types";

export const KADRO_ROUTINE_FREQS = ["Günlük", "Haftalık", "Aylık", "Yıllık"] as const;

export const KADRO_ROUTINES: KadroRoutine[] = [
  {
    freq: "Günlük",
    name: "Radar story dizilimi",
    owner: "pz-radar",
    detail: "Tema gününe uygun 7-9 kart. Güçlü sinyal ikinci sırada, sticker üçüncü karttan sonra, tek kapanış CTA'sı.",
  },
  {
    freq: "Günlük",
    name: "Instagram story yayını",
    owner: "pz-ig",
    detail: "Günlük story akışını yayına alma. Feed post planlaması, yorum moderasyonu ve DM yanıtları.",
  },
  {
    freq: "Günlük",
    name: "Short-form video üretimi",
    owner: "pz-short",
    detail: "Reels, TikTok ve Shorts için 1-2 kısa video. Trend takibi, kurgu ve yayın.",
  },
  {
    freq: "Günlük",
    name: "Topluluk moderasyonu",
    owner: "pz-topluluk",
    detail: "DM ve yorum yanıtları, topluluk kurallarının uygulanması, hassas içerik taraması.",
  },
  {
    freq: "Günlük",
    name: "Platform sağlık kontrolü",
    owner: "op-platform",
    detail: "Supabase dashboard ve Vercel analytics üzerinden sistem performansı izleme, kullanıcı raporlarına ilk yanıt.",
  },
  {
    freq: "Haftalık",
    name: "Pazarlama standup'ı",
    owner: "ld-cmo",
    detail: "Tüm pazarlama ekibinin haftalık hizalanma toplantısı. Ürün, işlev ve coğrafya eksenleri koordinasyonu.",
  },
  {
    freq: "Haftalık",
    name: "F1000 abone raporu",
    owner: "pz-f1000",
    detail: "Haftalık abone sayısı, elde tutma oranı ve story etkileşim metriklerinin raporu.",
  },
  {
    freq: "Haftalık",
    name: "Defter yayın planı",
    owner: "pz-defter",
    detail: "Haftalık 3 Defter yayınının konu ve şehir bazlı planlaması. Şehir küratörleriyle koordinasyon.",
  },
  {
    freq: "Haftalık",
    name: "Creator check-in",
    owner: "pz-creator",
    detail: "Aktif creator'larla haftalık iletişim, içerik brief takibi ve performans geri bildirimi.",
  },
  {
    freq: "Haftalık",
    name: "Büyüme metrikleri review",
    owner: "pz-perf",
    detail: "Çoklu kanal büyüme metriklerinin haftalık değerlendirmesi. ROAS, CAC ve organik büyüme takibi.",
  },
  {
    freq: "Haftalık",
    name: "Sprint review",
    owner: "tk-fullstack",
    detail: "Ürün & teknoloji ekibinin haftalık sprint gözden geçirmesi. Teslim edilen işler, bloklar ve sonraki sprint planı.",
  },
  {
    freq: "Haftalık",
    name: "Güvenlik taraması",
    owner: "op-trust",
    detail: "RLS politika denetimi, güvenlik açığı taraması ve kullanıcı ihlallerinin haftalık gözden geçirmesi.",
  },
  {
    freq: "Aylık",
    name: "Şehir lansman review",
    owner: "pz-sehir",
    detail: "Aktif şehirlerin lansman performansının aylık değerlendirmesi. Abone büyüme, içerik kalitesi ve küratör performansı.",
  },
  {
    freq: "Aylık",
    name: "İçerik performansı analizi",
    owner: "pz-analitik",
    detail: "Tüm içerik tiplerinin aylık performans karşılaştırması. Hangi formatın hangi kitlede çalıştığının analizi.",
  },
  {
    freq: "Aylık",
    name: "Partner performansı",
    owner: "op-partner",
    detail: "Aktif partnerlerin aylık değerlendirme raporu. Memnuniyet, kaynak kullanım ve işbirliği fırsatları.",
  },
  {
    freq: "Aylık",
    name: "B2B pipeline review",
    owner: "gl-b2b",
    detail: "B2B satış pipeline'ının aylık gözden geçirmesi. Kapanan anlaşmalar, bekleyen teklifler ve yeni fırsatlar.",
  },
  {
    freq: "Yıllık",
    name: "Yıllık strateji review",
    owner: "ld-ceo",
    detail: "CorteQS'in yıllık stratejik hedeflerinin gözden geçirmesi. Geçen yılın sonuçları, yeni yılın öncelikleri ve kaynak planlaması.",
  },
];

export function groupRoutinesByFreq(
  routines: KadroRoutine[],
): Array<{ freq: string; items: KadroRoutine[] }> {
  return KADRO_ROUTINE_FREQS
    .map((freq) => ({ freq, items: routines.filter((r) => r.freq === freq) }))
    .filter((group) => group.items.length > 0);
}
