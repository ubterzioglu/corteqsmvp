export type LansmanRegistrationStatus = "pending" | "approved" | "rejected";

export type LansmanRegistration = {
  id: string;
  first_name: string;
  last_name: string;
  initials: string | null;
  phone: string;
  linkedin: string | null;
  instagram: string | null;
  youtube: string | null;
  website: string | null;
  description: string | null;
  status: LansmanRegistrationStatus;
  created_at: string;
};

export type LansmanRegistrationInsert = Omit<
  LansmanRegistration,
  "id" | "created_at"
>;

export type LansmanRegistrationFormData = {
  first_name: string;
  last_name: string;
  phone: string;
  linkedin: string;
  instagram: string;
  youtube: string;
  website: string;
  description: string;
};
