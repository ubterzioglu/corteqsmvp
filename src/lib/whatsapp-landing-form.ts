export type GroupPlatform = "WhatsApp" | "Facebook" | "Instagram" | "LinkedIn" | "Reddit" | "YouTube";

export const GROUP_PLATFORM_OPTIONS: { value: GroupPlatform; label: string }[] = [
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "Facebook", label: "Facebook" },
  { value: "Instagram", label: "Instagram" },
  { value: "LinkedIn", label: "LinkedIn" },
  { value: "Reddit", label: "Reddit" },
  { value: "YouTube", label: "YouTube" },
];

export type GroupFormState = {
  groupName: string;
  platform: GroupPlatform;
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
  groupName: "",
  platform: "WhatsApp",
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
