// Relocation Tools — paylaşımlı UI metinleri + CTA hedef haritası.
// Sözleşme: docs/10tool/00 §"Ortak CTA türleri". Araç sonuç copy'si her araç fazında
// kendi config'inde; burada motor genel metinleri + CTA key→href haritası.

import type { ToolCta } from "@/lib/relocation-tools-types";
import { CHALLENGE_LABELS } from "@/lib/relocation-tools-challenge";
import {
  READINESS_DIMENSION_ACTIONS,
  READINESS_DIMENSION_DESCRIPTIONS,
  READINESS_LABELS,
  READINESS_WEIGHTS,
} from "@/lib/relocation-tools-readiness";
import { CITY_LABELS } from "@/lib/relocation-tools-city";
import { COUNTRY_LABELS } from "@/lib/relocation-tools-country";
import { SALARY_LABELS } from "@/lib/relocation-tools-salary";
import { CAREER_LABELS } from "@/lib/relocation-tools-career";
import { JOBPROB_LABELS } from "@/lib/relocation-tools-jobprob";
import { DIASPORA_LABELS } from "@/lib/relocation-tools-diaspora";

/** docs/10tool/00 §CTA — key → varsayılan hedef + Türkçe etiket. */
export const CTA_TARGETS: Record<string, ToolCta> = {
  complete_profile: { key: "complete_profile", label: "Profilini Tamamla", href: "/profile" },
  view_directory: { key: "view_directory", label: "Dizini Gör", href: "/directory" },
  open_cadde: { key: "open_cadde", label: "Cadde'yi Aç", href: "/cadde" },
  view_relocation_plan: { key: "view_relocation_plan", label: "Taşınma Planın", href: "/relocation" },
  open_service_finder: { key: "open_service_finder", label: "Hizmet Bulucu", href: "/relocation" },
  find_mentor: { key: "find_mentor", label: "Mentor Bul", href: "/directory" },
  start_related_tool: { key: "start_related_tool", label: "İlgili Aracı Başlat", href: "/tools" },
};

/** Bir CTA key'ini (opsiyonel override href ile) tam ToolCta'ya çevirir. */
export function resolveCta(key: string, overrideHref?: string): ToolCta {
  const base = CTA_TARGETS[key] ?? { key, label: key, href: "/tools" };
  return overrideHref ? { ...base, href: overrideHref } : base;
}

/**
 * #7 Persona — persona anahtarı → Türkçe etiket (ScoreBreakdownCard dimensionLabels için).
 * SQL relocation_score_expat_lifestyle_persona_v1 v_persona_label + persona.ts PERSONA_LABELS aynası.
 */
export const PERSONA_DIMENSION_LABELS: Record<string, string> = {
  global_networker: "Global Networker",
  quiet_local: "Sakin Yerleşik",
  adventure_seeker: "Maceracı Kaşif",
  family_planner: "Aile Planlayıcısı",
  career_builder: "Kariyer İnşacısı",
  community_anchor: "Topluluk Çapası",
};

/**
 * sub_scores boyut anahtarı → görünen etiket. Önce tool_key (aracın kendi kategori
 * etiketleri), yoksa result_kind genel haritası. Yoksa boş (ham anahtar gösterilir).
 */
export function dimensionLabelsForResult(
  resultKind: string,
  toolKey?: string,
): Record<string, string> {
  if (toolKey === "top_relocation_challenge") return CHALLENGE_LABELS;
  if (toolKey === "relocation_readiness") return READINESS_LABELS;
  if (toolKey === "city_match") return CITY_LABELS;
  if (toolKey === "country_match") return COUNTRY_LABELS;
  if (toolKey === "profession_salary") return SALARY_LABELS;
  if (toolKey === "career_path_abroad") return CAREER_LABELS;
  if (toolKey === "job_finding_probability") return JOBPROB_LABELS;
  if (toolKey === "diaspora_matchmaker") return DIASPORA_LABELS;
  if (resultKind === "persona") return PERSONA_DIMENSION_LABELS;
  return {};
}

/**
 * sub_scores boyut anahtarı → "bu puan neyi ölçüyor" açıklaması.
 * `dimensionLabelsForResult` ile AYNI desen: araç bazlı, eşleşme yoksa boş harita
 * döner ve arayüz açıklama satırını hiç çizmez. Yeni araç eklerken buraya bir
 * satır ekle — bileşen tarafında değişiklik gerekmez.
 */
export function dimensionDescriptionsForResult(
  _resultKind: string,
  toolKey?: string,
): Record<string, string> {
  if (toolKey === "relocation_readiness") return READINESS_DIMENSION_DESCRIPTIONS;
  return {};
}

/**
 * Boyut zayıf çıktığında gösterilecek somut ilk adım (weakest3 kartı).
 * Eşleşme yoksa kart, DB'den gelen `detail` metnine düşer.
 */
export function dimensionActionsForResult(toolKey?: string): Record<string, string> {
  if (toolKey === "relocation_readiness") return READINESS_DIMENSION_ACTIONS;
  return {};
}

/**
 * Boyutun toplam skordaki ağırlığı (0..1). Kullanıcıya "%25" olarak gösterilir —
 * hangi alanı düzeltmenin skoru en çok oynatacağını görebilmesi için.
 * Kaynak, aracın SQL↔TS ağırlık aynasıdır; ayrı bir kopya TUTULMAZ.
 */
export function dimensionWeightsForResult(toolKey?: string): Record<string, number> {
  if (toolKey === "relocation_readiness") return READINESS_WEIGHTS;
  return {};
}

/**
 * Bucket → tek cümlelik "bu ne demek" açıklaması. Rozet tek başına bant adını
 * veriyor ama ne yapılması gerektiğini söylemiyordu.
 */
export const BUCKET_DESCRIPTIONS: Record<string, string> = {
  // #3 readiness
  ready: "Temel hazırlıkların tamam. Artık tarih belirleyip uygulamaya geçebilirsin.",
  proceed:
    "Yola çıkabilirsin ama açık kalan alanlar var. Aşağıdaki zayıf başlıkları taşınmadan önce kapat.",
  prepare:
    "Henüz taşınma tarihi vermek için erken. Önce aşağıdaki zayıf alanları güçlendir, sonra testi tekrar çöz.",
  high_risk:
    "Bu tabloyla taşınmak yüksek risk taşır. Finans ve evrak başlıklarını kapatmadan tarih belirleme.",
};

/** Bucket açıklaması; tanımsız bucket → boş (arayüz satırı hiç çizmez). */
export function bucketDescription(bucketKey: string | null | undefined): string {
  if (!bucketKey) return "";
  return BUCKET_DESCRIPTIONS[bucketKey] ?? "";
}

/**
 * Boyut puanının (0..1) okunabilir bandı. Eşikler toplam skorun bantlarıyla
 * (80/60/40) bilinçli olarak aynıdır ki kullanıcı iki yerde farklı ölçek görmesin.
 * Bu SALT GÖRÜNTÜ bandıdır — `score_bucket` ile karıştırma, o SQL'den gelir.
 */
export function dimensionBandLabel(value01: number): string {
  const pct = value01 * 100;
  if (pct >= 80) return "Güçlü";
  if (pct >= 60) return "İyi";
  if (pct >= 40) return "Orta";
  return "Zayıf";
}

/** Bucket/bant anahtarı → Türkçe etiket (araçlar arası ortak; bilinmeyen anahtar boş). */
export const BUCKET_LABELS: Record<string, string> = {
  // #3 readiness
  ready: "Hazır",
  proceed: "Kontrollü İlerle",
  prepare: "Önce Hazırlık",
  high_risk: "Yüksek Risk",
  // genel skor bantları (sonraki araçlar)
  excellent: "Mükemmel",
  strong: "Güçlü",
  good: "İyi",
  moderate: "Orta",
  risky: "Riskli",
  low: "Düşük",
  // #2 maaş bucket'ları
  high_value: "Yüksek Değer",
  balanced: "Dengeli",
  expensive_but_high_salary: "Pahalı ama Yüksek Maaş",
  low_salary_or_high_barrier: "Düşük Maaş / Yüksek Bariyer",
  // #10 iş bulma bucket'ları
  high: "Yüksek",
  medium_high: "Orta-Yüksek",
  challenging: "Zorlu",
};

/** Bucket anahtarını yerelleştirilmiş etikete çevirir; bilinmeyen → anahtarın kendisi. */
export function bucketLabel(bucketKey: string | null | undefined): string {
  if (!bucketKey) return "";
  return BUCKET_LABELS[bucketKey] ?? bucketKey;
}

/**
 * result_kind → hub kartındaki rozet etiketi (araçları görsel olarak ayırt eder).
 * Sayı vermiyoruz: canlıda 2026-08-07 itibarıyla 18 aktif araç var (12 motor + 6
 * standalone) ve bu sayı büyümeye devam ediyor — yoruma yazılan sabit sayı bayatlıyor.
 * Güncel sayı: `select count(*) from relocation_tools where is_active`.
 */
export const RESULT_KIND_BADGE_LABELS: Record<string, string> = {
  score: "Skor",
  ranked_list: "Sıralama",
  persona: "Persona",
  checklist: "Görev Planı",
  match_list: "Eşleşme",
  comparison: "Karşılaştırma",
};

/** Motor genel UI metinleri (Türkçe; araç-bağımsız). */
export const TOOLS_UI_COPY = {
  hubTitle: "CorteQS Araçlar",
  hubSubtitle: "Tamamen ücretsiz — bir kaç soruyla yol haritanı keşfet!",
  quickMode: "Hızlı",
  detailedMode: "Detaylı",
  quickModeDesc: "En önemli sorularla kısa sürede sonuç al — hızlıca fikir edinmek için ideal.",
  detailedModeDesc: "Daha fazla soruyla daha kişiselleştirilmiş ve doğru bir sonuç al.",
  next: "İleri",
  back: "Geri",
  finish: "Sonucu Gör",
  submitting: "Hesaplanıyor…",
  required: "Bu soru zorunlu",
  selectHint: "Bir seçenek seçin",
  multiHint: "Birden fazla seçebilirsiniz",
  scaleLow: "Düşük",
  scaleHigh: "Yüksek",
  resultTitle: "Sonucun",
  rankedListTitle: "Sana En Uygun Sıralama",
  checklistTitle: "İlk 90 Gün Görev Takvimin",
  comparisonTitle: "Ülke Bazlı Maaş Karşılaştırması",
  matchListTitle: "Güvenli Eşleşmeler",
  breakdownTitle: "Puan Dağılımı",
  breakdownHint:
    "Her başlık toplam skoruna farklı ağırlıkta girer. Yüzde, o başlığı düzeltmenin skorunu ne kadar oynatacağını gösterir.",
  weakestTitle: "Önce Buraya Odaklan",
  weakestHint: "En düşük puanlı 3 başlık ve her biri için atacağın ilk adım.",
  whyTitle: "Neden?",
  retake: "Tekrar Çöz",
  backToHub: "Araçlar Sayfasına Dön",
  comingSoon: "Yakında",
  loading: "Yükleniyor…",
  notFound: "Araç bulunamadı.",
  privacyNote:
    "Cevapların yalnızca bu sonucu üretmek için kullanılır ve 30 gün sonra silinebilir. " +
    "Açık rıza vermeden profiline hiçbir şey yazılmaz.",
} as const;
