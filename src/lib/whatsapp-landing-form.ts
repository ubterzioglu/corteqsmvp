import type { LandingCategory, LandingLanguage, LandingOrigin } from "@/lib/whatsapp-landings";

export type GroupFormState = {
  submitterRole: "manager" | "member";
  platform: string;
  category: LandingCategory | "";
  groupName: string;
  country: string;
  whatsappLink: string;
  description: string;
  callToActionText: string;
  conditions: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  memberCount: string;
  language: LandingLanguage | "";
  origin: LandingOrigin | "";
};

export type JoinFormState = {
  fullName: string;
  email: string;
  phone: string;
  note: string;
};

export const initialGroupForm: GroupFormState = {
  submitterRole: "member",
  platform: "",
  category: "",
  groupName: "",
  country: "",
  whatsappLink: "",
  description: "",
  callToActionText: "",
  conditions: "",
  adminName: "",
  adminEmail: "",
  adminPhone: "",
  memberCount: "",
  language: "",
  origin: "",
};

export const initialJoinForm: JoinFormState = {
  fullName: "",
  email: "",
  phone: "",
  note: "",
};

export function getErrorMessage(error: unknown, fallback = "Beklenmeyen hata") {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "object" && error && "message" in error && typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}

export function buildAdminContact(form: GroupFormState) {
  return [form.adminEmail.trim() ? `E-posta: ${form.adminEmail.trim()}` : "", form.adminPhone.trim() ? `Telefon: ${form.adminPhone.trim()}` : ""]
    .filter(Boolean)
    .join("\n");
}

export function buildSubmitterDescription(form: GroupFormState) {
  const submitterLabel = form.submitterRole === "manager" ? "Topluluk Yöneticisiyim" : "Topluluk Üyesiyim";
  return `[Başvuru tipi: ${submitterLabel}] ${form.description}`.trim();
}
