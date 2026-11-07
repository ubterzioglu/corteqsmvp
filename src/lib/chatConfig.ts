// CH01 (07.11.2026): eski kayıt sohbeti SİLİNDİ — `useChatMachine` + `chatReducer` +
// `detectCommand` ve onlara hizmet eden adım mesajları, adım doğrulama, kategori çözümleme
// yardımcıları. Haziran 2026'dan (17ad6c22) beri hiçbir ekran çağırmıyordu ve `submit()`
// hep "Bu asistan artık kayıt almıyor" diyordu; yalnız testleri onu "kullanılıyor"
// gösteriyordu. Burada kalanlar canlı bilgi asistanının (ChatBot → ChatWindow → ChatInput /
// ChatMessage / ChatQuickReply) hâlâ okuduğu tipler ve ilerleme hesabıdır.

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

// Kayıt sohbetinden kalan veri şekli. Canlı asistan hiçbir alanını doldurmaz (ChatBot
// her zaman INITIAL_DATA verir); yalnız ChatWindow'un ilerleme hesabı okur.
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

// useChatMachine.ts'ten taşındı (CH01). Yalnız silinen reducer'ın okuduğu `stepHistory`
// ve `prefillCity` alanları taşınmadı.
export type ChatState = {
  step: ChatStep;
  messages: ChatMessage[];
  data: ChatCollectedData;
  documentFiles: File[];
  loading: boolean;
  error: string | null;
  submitted: boolean;
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

const REQUIRED_STEPS: ChatStep[] = ["category", "fullname", "country", "city", "field", "email", "phone", "consent"];

export function getProgressInfo(
  step: ChatStep,
  data: ChatCollectedData,
): { completed: number; total: number; percentage: number } {
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
