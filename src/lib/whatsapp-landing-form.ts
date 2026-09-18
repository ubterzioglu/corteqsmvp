export type GroupFormState = {
  groupName: string;
  whatsappLink: string;
  country: string;
  city: string;
  description: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
};

export type JoinFormState = {
  fullName: string;
  email: string;
  phone: string;
  note: string;
};

export const initialGroupForm: GroupFormState = {
  groupName: "",
  whatsappLink: "",
  country: "",
  city: "",
  description: "",
  adminName: "",
  adminEmail: "",
  adminPhone: "",
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
  return form.description.trim();
}
