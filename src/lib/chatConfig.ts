import {
  categoryOptions,
  referralSourceOptions,
  shouldShowReferralDetail,
  getReferralDetailLabel,
  getCategoryLabel,
  getReferralSourceLabel,
} from "@/lib/submissions";

export type ChatStep =
  | "welcome"
  | "category"
  | "contest_interest"
  | "fullname"
  | "country"
  | "city"
  | "business"
  | "field"
  | "email"
  | "phone"
  | "referral_source"
  | "referral_detail"
  | "referral_code"
  | "offers_needs"
  | "documents"
  | "documents_add_more"
  | "consent"
  | "summary"
  | "completed";

export type QuickReply = {
  label: string;
  value: string;
};

export type ChatMessage = {
  id: string;
  role: "bot" | "user";
  content: string;
  timestamp: number;
  quickReplies?: QuickReply[];
  isSummary?: boolean;
};

export type ChatCollectedData = {
  category: string | null;
  fullname: string | null;
  country: string | null;
  city: string | null;
  business: string | null;
  field: string | null;
  email: string | null;
  phone: string | null;
  referral_source: string | null;
  referral_detail: string | null;
  referral_code: string | null;
  offers_needs: string | null;
  contest_interest: boolean;
  whatsapp_interest: boolean;
  consent: boolean;
};

export const INITIAL_DATA: ChatCollectedData = {
  category: null,
  fullname: null,
  country: null,
  city: null,
  business: null,
  field: null,
  email: null,
  phone: null,
  referral_source: null,
  referral_detail: null,
  referral_code: null,
  offers_needs: null,
  contest_interest: false,
  whatsapp_interest: false,
  consent: false,
};

export const STEP_ORDER: ChatStep[] = [
  "welcome",
  "category",
  "contest_interest",
  "fullname",
  "country",
  "city",
  "business",
  "field",
  "email",
  "phone",
  "referral_source",
  "referral_detail",
  "referral_code",
  "offers_needs",
  "documents",
  "documents_add_more",
  "consent",
  "summary",
  "completed",
];

export const REQUIRED_STEPS: ChatStep[] = [
  "category",
  "fullname",
  "country",
  "city",
  "field",
  "email",
  "phone",
  "consent",
];

const CATEGORY_QUICK_REPLIES: QuickReply[] = categoryOptions
  .filter((c) => c.value !== "support")
  .map((c) => ({ label: c.label, value: c.value }));

const SOURCE_QUICK_REPLIES: QuickReply[] = [
  ...referralSourceOptions.map((s) => ({ label: s.label, value: s.value })),
  { label: "Ge\u00e7 \u23ed\ufe0f", value: "__skip__" },
];

const SKIP_REPLY: QuickReply = { label: "Ge\u00e7 \u23ed\ufe0f", value: "__skip__" };

const categoryAliasMap: Array<{ value: string; aliases: string[] }> = [
  { value: "danisman", aliases: ["danisman", "danışman", "doktor", "avukat", "muhasebe", "mali musavir", "mali müşavir", "terapist", "koc", "koç", "uzman", "consultant"] },
  { value: "isletme", aliases: ["isletme", "işletme", "sirket", "şirket", "firma", "girisim", "girişim", "startup", "restoran", "kafe", "ajans", "emlak"] },
  { value: "dernek", aliases: ["dernek", "stk", "ngo"] },
  { value: "vakif", aliases: ["vakif", "vakıf", "foundation"] },
  { value: "radyo-tv", aliases: ["radyo", "tv", "televizyon", "podcast", "media", "medya"] },
  { value: "blogger-vlogger", aliases: ["blogger", "vlogger", "blog", "vlog", "youtube", "youtuber"] },
  { value: "influencer", aliases: ["influencer", "creator", "icerik ureticisi", "içerik üreticisi", "content creator"] },
  { value: "sehir-elcisi", aliases: ["sehir elcisi", "şehir elçisi", "elci", "elçi", "community lead", "topluluk lideri"] },
  { value: "bireysel", aliases: ["bireysel", "kullanici", "kullanıcı", "user", "birey"] },
];

function foldForComparison(input: string) {
  return input
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ı]/g, "i")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function resolveCategoryInput(input: string): string | null {
  const foldedInput = foldForComparison(input);
  if (!foldedInput) return null;

  const directMatch = categoryOptions.find((option) => option.value === input.trim());
  if (directMatch) return directMatch.value;

  for (const option of categoryOptions) {
    if (option.value === "support") continue;
    const foldedLabel = foldForComparison(option.label);
    const foldedValue = foldForComparison(option.value);
    if (foldedInput === foldedLabel || foldedInput === foldedValue) {
      return option.value;
    }
  }

  for (const { value, aliases } of categoryAliasMap) {
    const matchedAlias = aliases.find((alias) => {
      const foldedAlias = foldForComparison(alias);
      return foldedInput === foldedAlias || foldedInput.includes(foldedAlias);
    });
    if (matchedAlias) return value;
  }

  return null;
}

export function shouldRedirectToKnowledgeAssistant(input: string) {
  const trimmed = input.trim();
  if (trimmed.length < 5) return false;
  if (trimmed.includes("?")) return true;

  const folded = foldForComparison(trimmed);
  return [
    "corteqs",
    "nedir",
    "nasil",
    "nasıl",
    "ne ise yarar",
    "ne işe yarar",
    "hangi",
    "kim",
    "neden",
    "niye",
  ].some((pattern) => folded.includes(foldForComparison(pattern)));
}

export function shouldStartRegistration(input: string) {
  const folded = foldForComparison(input);
  if (!folded) return false;

  return [
    "kayit olmak istiyorum",
    "kaydolmak istiyorum",
    "kayit ol",
    "kaydol",
    "beni ekle",
    "uye olayim",
    "uye olmak istiyorum",
    "basvuru yapmak istiyorum",
    "basvuru yapmak",
    "kaydimi al",
  ].some((pattern) => folded.includes(foldForComparison(pattern)));
}

export function getStepMessage(step: ChatStep, data: ChatCollectedData): { content: string; quickReplies?: QuickReply[] } {
  switch (step) {
    case "welcome":
      return {
        content:
          "Merhaba! Ben CorteQS Asistan\u0131.\n\nCorteQS hakk\u0131nda sorular\u0131n\u0131 yan\u0131tlayabilirim ya da istersen kayd\u0131n\u0131 sohbet i\u00e7inde tamamlayabilirim.",
        quickReplies: [{ label: "Kay\u0131t Ol \ud83d\ude80", value: "__start__" }],
      };

    case "category":
      return {
        content: "Sana en uygun kategori hangisi?",
        quickReplies: CATEGORY_QUICK_REPLIES,
      };

    case "contest_interest":
      return {
        content: "\ud83c\udfc6 \u00d6d\u00fcll\u00fc blog yar\u0131\u015fam\u0131z var! Haberdar olmak ister misin?",
        quickReplies: [
          { label: "Evet", value: "yes" },
          { label: "Hay\u0131r", value: "no" },
        ],
      };

    case "fullname":
      return {
        content: "Ad soyad\u0131n\u0131 yazabilir misin?",
      };

    case "country":
      return {
        content: "Hangi \u00fclkede ya\u015f\u0131yorsun?",
      };

    case "city":
      return {
        content: "Hangi \u015fehirde ya\u015f\u0131yorsun?",
      };

    case "business":
      return {
        content: "Ba\u011fl\u0131 oldu\u011fun bir i\u015fletme veya olu\u015fum varsa yazabilirsin.\nYoksa 'ge\u00e7' yaz.",
        quickReplies: [SKIP_REPLY],
      };

    case "field":
      return {
        content: "Ne yapt\u0131\u011f\u0131n\u0131 veya ilgi alan\u0131n\u0131 k\u0131saca yazar m\u0131s\u0131n?\n(\u00f6rn: yaz\u0131l\u0131m testi, avukatl\u0131k, i\u00e7erik \u00fcretimi)",
      };

    case "email":
      return {
        content: "E-posta adresini yazabilir misin?",
      };

    case "phone":
      return {
        content: "WhatsApp kulland\u0131\u011f\u0131n telefon numaran\u0131 \u00fclke koduyla yaz l\u00fctfen\n(\u00f6rn: +49 170 1234567)",
      };

    case "referral_source":
      return {
        content: "Bizi nereden buldun? (opsiyonel)",
        quickReplies: SOURCE_QUICK_REPLIES,
      };

    case "referral_detail":
      return {
        content: data.referral_source ? getReferralDetailLabel(data.referral_source) : "Detay yaz\u0131n",
      };

    case "referral_code":
      return {
        content: "Davet kodun varsa yazabilirsin. Yoksa 'ge\u00e7' yaz.",
        quickReplies: [SKIP_REPLY],
      };

    case "offers_needs":
      return {
        content: "K\u0131saca ne arad\u0131\u011f\u0131n\u0131 veya ne sunabilece\u011fini yazabilir misin?\n(\u00f6rn: i\u015f ar\u0131yorum, m\u00fc\u015fteri ar\u0131yorum, ev ar\u0131yorum)\n\nDetayl\u0131 veri e\u015fle\u015fme kalitesini art\u0131r\u0131r. \ud83e\udd16",
        quickReplies: [SKIP_REPLY],
      };

    case "documents":
      return {
        content: "CV, portf\u00f6y veya sertifika y\u00fcklemek ister misin?\n(PDF, DOC, DOCX, JPG, PNG, WEBP \u2014 dosya ba\u015f\u0131na maks. 50 MB, en fazla 5 dosya)",
        quickReplies: [SKIP_REPLY],
      };

    case "documents_add_more":
      return {
        content: "Ba\u015fka dosya eklemek ister misin?",
        quickReplies: [
          { label: "Ba\u015fka dosya ekle", value: "__add_more__" },
          { label: "Devam et \u2192", value: "__continue__" },
        ],
      };

    case "consent":
      return {
        content: "Son bir ad\u0131m! Ki\u015fisel bilgilerini CorteQS taraf\u0131ndan taraf\u0131ma ula\u015f\u0131lmas\u0131 amac\u0131yla payla\u015fmay\u0131 onayl\u0131yor musun? Bilgilerim \u00fc\u00e7\u00fcnc\u00fc \u015fah\u0131slarla payla\u015f\u0131lmayacakt\u0131r.",
        quickReplies: [{ label: "Onayl\u0131yorum \u2705", value: "yes" }],
      };

    case "summary":
      return buildSummaryMessage(data);

    case "completed":
      return {
        content: "\ud83c\udf89 Kayd\u0131n ba\u015far\u0131yla al\u0131nd\u0131!\n\nSeni CorteQS diaspora a\u011f\u0131na dahil edece\u011fiz.\n\n\ud83d\udc49 Web: https://corteqs.net\n\ud83d\udc49 WhatsApp: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD\n\nYak\u0131nda seninle ileti\u015fime ge\u00e7ece\u011fiz. Ho\u015f geldin! \ud83c\udf0d",
      };

    default:
      return { content: "" };
  }
}

function buildSummaryMessage(data: ChatCollectedData): { content: string; quickReplies?: QuickReply[]; isSummary?: boolean } {
  const lines = [
    "Bilgilerini kontrol edelim:\n",
    "\ud83d\udccb Kay\u0131t \u00d6zeti",
    "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500",
    `Kategori: ${data.category ? getCategoryLabel(data.category) : "\u2014"}`,
    `Ad Soyad: ${data.fullname || "\u2014"}`,
    `\u00dclke: ${data.country || "\u2014"}`,
    `\u015eehir: ${data.city || "\u2014"}`,
    `\u0130\u015fletme: ${data.business || "\u2014"}`,
    `\u0130\u015ftigal: ${data.field || "\u2014"}`,
    `E-posta: ${data.email || "\u2014"}`,
    `Telefon: ${data.phone || "\u2014"}`,
    `Kaynak: ${data.referral_source ? getReferralSourceLabel(data.referral_source) : "\u2014"}`,
    `Referral: ${data.referral_code || "\u2014"}`,
    `Arz/Talep: ${data.offers_needs || "\u2014"}`,
    "",
    "Bilgiler do\u011fruysa onayla.",
  ];

  return {
    content: lines.join("\n"),
    quickReplies: [
      { label: "\u2705 Onayla ve G\u00f6nder", value: "__confirm__" },
      { label: "\u270f\ufe0f D\u00fczelt", value: "__go_back__" },
    ],
    isSummary: true,
  };
}

export type ValidationResult = { ok: true } | { ok: false; message: string };

export function validateStep(step: ChatStep, input: string, _data: ChatCollectedData): ValidationResult {
  const trimmed = input.trim();

  switch (step) {
    case "category": {
      if (!resolveCategoryInput(trimmed)) return { ok: false, message: "L\u00fctfen bir kategori se\u00e7." };
      return { ok: true };
    }

    case "fullname": {
      const words = trimmed.split(/\s+/).filter(Boolean);
      if (words.length < 2) {
        return { ok: false, message: "L\u00fctfen ad\u0131n\u0131 ve soyad\u0131n\u0131 yaz (\u00f6rn: Ahmet Y\u0131lmaz)." };
      }
      const digitCount = (trimmed.match(/\d/g) || []).length;
      if (digitCount / trimmed.length > 0.5) {
        return { ok: false, message: "Ad soyad rakam i\u00e7eremez. L\u00fctfen kontrol et." };
      }
      return { ok: true };
    }

    case "country": {
      if (trimmed.length < 2) return { ok: false, message: "L\u00fctfen \u00fclke ad\u0131n\u0131 yaz." };
      return { ok: true };
    }

    case "city": {
      if (trimmed.length < 2) return { ok: false, message: "L\u00fctfen \u015fehir ad\u0131n\u0131 yaz." };
      return { ok: true };
    }

    case "field": {
      if (trimmed.length < 2) return { ok: false, message: "L\u00fctfen ilgi alan\u0131n\u0131 yaz." };
      return { ok: true };
    }

    case "email": {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) return { ok: false, message: "Ge\u00e7erli bir e-posta adresi gir (\u00f6rn: ornek@mail.com)." };
      return { ok: true };
    }

    case "phone": {
      const cleaned = trimmed.replace(/[\s\-().]/g, "");
      const e164 = /^\+[1-9]\d{7,14}$/;
      if (!e164.test(cleaned)) return { ok: false, message: "Telefon + ile ba\u015flamal\u0131 ve \u00fclke kodu i\u00e7ermeli (\u00f6rn: +49 170 1234567)." };
      return { ok: true };
    }

    case "referral_code": {
      if (trimmed.length > 32) return { ok: false, message: "Davet kodu en fazla 32 karakter olabilir." };
      return { ok: true };
    }

    case "offers_needs": {
      if (trimmed.length > 1000) return { ok: false, message: "En fazla 1000 karakter yazabilirsin." };
      return { ok: true };
    }

    default:
      return { ok: true };
  }
}

export type CommandType = "back" | "skip" | "reset" | "classic_form" | null;

export function detectCommand(input: string): CommandType {
  const lower = input.trim().toLowerCase();
  if (lower === "geri" || lower === "d\u00fczenle" || lower === "geri al") return "back";
  if (lower === "ge\u00e7" || lower === "skip" || lower === "sonraki") return "skip";
  if (lower === "iptal" || lower === "s\u0131f\u0131rla" || lower === "ba\u015ftan") return "reset";
  if (lower === "klasik form" || lower === "form" || lower === "formu a\u00e7") return "classic_form";
  return null;
}

export function getNextStep(currentStep: ChatStep, data: ChatCollectedData): ChatStep {
  const idx = STEP_ORDER.indexOf(currentStep);

  const skipSet = new Set<ChatStep>();

  if (data.category !== "blogger-vlogger") skipSet.add("contest_interest");
  if (!data.referral_source || data.referral_source === "__skip__") {
    skipSet.add("referral_detail");
  } else if (!shouldShowReferralDetail(data.referral_source)) {
    skipSet.add("referral_detail");
  }

  for (let i = idx + 1; i < STEP_ORDER.length; i++) {
    const candidate = STEP_ORDER[i];
    if (!skipSet.has(candidate)) return candidate;
  }

  return "completed";
}

export function getPreviousStep(stepHistory: ChatStep[]): ChatStep | null {
  if (stepHistory.length < 2) return null;
  return stepHistory[stepHistory.length - 2];
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function getProgressInfo(step: ChatStep, data: ChatCollectedData): { completed: number; total: number; percentage: number } {
  const total = REQUIRED_STEPS.length;

  const completedFields: ChatStep[] = [];
  if (data.category) completedFields.push("category");
  if (data.fullname) completedFields.push("fullname");
  if (data.country) completedFields.push("country");
  if (data.city) completedFields.push("city");
  if (data.field) completedFields.push("field");
  if (data.email) completedFields.push("email");
  if (data.phone) completedFields.push("phone");
  if (data.consent) completedFields.push("consent");

  const completed = completedFields.length;
  return { completed, total, percentage: Math.round((completed / total) * 100) };
}
