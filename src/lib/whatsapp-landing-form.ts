export type GroupFormState = {
  platform: "WhatsApp" | "Facebook";
  groupName: string;
  whatsappLink: string;
  country: string;
  city: string;
  description: string;
};

export type JoinFormState = {
  fullName: string;
  email: string;
  phone: string;
  note: string;
};

export const initialGroupForm: GroupFormState = {
  platform: "WhatsApp",
  groupName: "",
  whatsappLink: "",
  country: "",
  city: "",
  description: "",
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

export function buildSubmitterDescription(form: GroupFormState) {
  return form.description.trim();
}
