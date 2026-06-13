import type { RadarNewsSource, RelevanceReason } from "./types.ts";

type Rule = {
  rule: string;
  score: number;
  keywords?: string[];
  negative?: boolean;
};

const STRONG_DIASPORA_KEYWORDS = [
  "türk diasporası", "turkish diaspora", "türkische diaspora",
  "yurt dışında türkler", "diaspora turca",
];

const GERMANY_COMMUNITY_KEYWORDS = [
  "almanya türkler", "türken in deutschland", "turkish community germany",
  "türk toplumu almanya", "türkische community", "türkische gemeinde",
];

const LEGAL_IMMIGRATION_KEYWORDS = [
  "oturum izni", "aufenthaltsrecht", "aufenthaltstitel", "residence permit",
  "einbürgerung", "vatandaşlık almanya", "doppelte staatsbürgerschaft",
  "çifte vatandaşlık", "german citizenship", "citizenship reform",
];

const BUSINESS_KEYWORDS = [
  "türk girişimci", "türkische unternehmer", "turkish entrepreneur",
  "türk işletme", "fachkräfteeinwanderung",
];

const NEGATIVE_KEYWORDS = [
  "spor haberleri", "maç sonucu", "gol attı", "şampiyon",
  "erotik", "pornografi", "casino", "bahis sitesi",
  "tıkla kazan", "çekiliş katıl", "ücretsiz iphone",
];

const CLICKBAIT_PATTERNS = [
  /\d+ şey(i|den) bilmeli/i,
  /inanamayacaksınız/i,
  /\bshocking\b/i,
  /\byou won't believe\b/i,
  /\bclick here\b/i,
];

export function scoreRelevance(
  title: string,
  summary: string | null,
  source: RadarNewsSource,
): { score: number; reasons: RelevanceReason[] } {
  const reasons: RelevanceReason[] = [];
  let raw = 0;

  const titleLower = title.toLowerCase();
  const summaryLower = (summary ?? "").toLowerCase();
  const combinedLower = `${titleLower} ${summaryLower}`;

  const checkKeywords = (keywords: string[], text: string, ruleName: string, scoreVal: number) => {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        reasons.push({ rule: ruleName, value: kw, score: scoreVal });
        raw += scoreVal;
        return;
      }
    }
  };

  checkKeywords(STRONG_DIASPORA_KEYWORDS, titleLower, "keyword_title_diaspora", 35);
  checkKeywords(GERMANY_COMMUNITY_KEYWORDS, titleLower, "keyword_title_germany", 25);
  checkKeywords(LEGAL_IMMIGRATION_KEYWORDS, titleLower, "keyword_title_legal", 20);
  checkKeywords(BUSINESS_KEYWORDS, titleLower, "keyword_title_business", 15);

  checkKeywords(STRONG_DIASPORA_KEYWORDS, summaryLower, "keyword_summary_diaspora", 15);
  checkKeywords(GERMANY_COMMUNITY_KEYWORDS, summaryLower, "keyword_summary_germany", 10);

  if (source.trust_level === "official" || source.trust_level === "high") {
    reasons.push({ rule: "trusted_source", score: 10 });
    raw += 10;
  }

  const published = source.config?.["publishedAt"] as string | undefined;
  const publishedDate = published ? new Date(published) : null;
  if (publishedDate && Date.now() - publishedDate.getTime() < 24 * 60 * 60 * 1000) {
    reasons.push({ rule: "freshness_24h", score: 10 });
    raw += 10;
  }

  // Negatif: içerik kalitesiz
  for (const kw of NEGATIVE_KEYWORDS) {
    if (combinedLower.includes(kw)) {
      reasons.push({ rule: "negative_keyword", value: kw, score: -40 });
      raw -= 40;
      break;
    }
  }

  for (const pattern of CLICKBAIT_PATTERNS) {
    if (pattern.test(title)) {
      reasons.push({ rule: "clickbait_pattern", score: -50 });
      raw -= 50;
      break;
    }
  }

  if (source.trust_level === "discovery_only") {
    // GDELT ve keşif kaynakları için ufak ceza
    raw = Math.max(raw - 5, raw);
  }

  const score = Math.max(0, Math.min(100, raw));
  return { score, reasons };
}
