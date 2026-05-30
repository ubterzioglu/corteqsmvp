// Supabase-backed store for WhatsApp Group landing pages.
// Submissions go to whatsapp_landings table with status='pending';
// admins approve to make them public. Demo entries kept as fallback
// so example cards keep rendering even before any approval.

import { supabase } from "@/integrations/supabase/client";

export type LandingMode = "visual" | "text";
export type LandingCategory =
  | "alumni" | "hobi" | "is" | "doktor"
  | "yatirim" | "girisim" | "akademik" | "dayanisma" | "diger";
export type LandingStatus = "pending" | "approved" | "rejected";

export interface WhatsAppLanding {
  id: string;
  groupName: string;
  category: LandingCategory;
  country: string;
  city: string;
  mode: LandingMode;
  heroImage?: string;
  tagline: string;
  callToActionText: string;
  conditions: string;
  whatsappLink: string;
  adminName?: string;
  adminContact?: string;
  status?: LandingStatus;
  createdAt: string;
}

const DEMOS: WhatsAppLanding[] = [
  {
    id: "odtu-almanya",
    groupName: "ODTÜ Mezunları Almanya",
    category: "alumni",
    country: "Almanya",
    city: "Berlin",
    mode: "visual",
    heroImage:
      "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&h=600&fit=crop",
    tagline: "Almanya'daki ODTÜ ailesi tek çatı altında",
    callToActionText:
      "Mezun networking, kariyer fırsatları ve aylık şehir buluşmaları için aramıza katıl. Her hafta bir mezunumuzdan kariyer hikayesi paylaşıyoruz.",
    conditions:
      "Sadece ODTÜ mezunları (lisans/yüksek lisans/doktora)\nMezuniyet yılı ve bölüm ile tanış\nReklam ve link spam yasak\nGrup dili: Türkçe",
    whatsappLink: "https://chat.whatsapp.com/odtu-almanya",
    adminName: "Burak Yılmaz",
    adminContact: "+49 170 000 0000",
    status: "approved",
    createdAt: new Date().toISOString(),
  },
  {
    id: "doktor-londra",
    groupName: "Londra Türk Doktorlar Networking",
    category: "doktor",
    country: "İngiltere",
    city: "Londra",
    mode: "text",
    tagline: "NHS ve özel sektörde Türk hekim dayanışması",
    callToActionText:
      "Vaka tartışması, branş referansı ve iş ilanları için Londra ve çevresindeki Türk doktorların buluştuğu profesyonel ağ. Yeni gelen meslektaşlara mentorluk önceliklidir.",
    conditions:
      "Sadece GMC kayıtlı veya kayıt sürecinde olan Türk hekimler\nKısa CV ve branş bilgisi gerekli\nReçete / hasta bilgisi paylaşımı kesinlikle yasak\nReklam yasak — sadece mesleki içerik",
    whatsappLink: "https://chat.whatsapp.com/doktor-london",
    adminName: "Dr. Leyla Aydın",
    adminContact: "admin@drleylaaydin.co.uk",
    status: "approved",
    createdAt: new Date().toISOString(),
  },
  {
    id: "kitap-dubai",
    groupName: "Dubai Türk Kitap Kulübü",
    category: "hobi",
    country: "BAE",
    city: "Dubai",
    mode: "visual",
    heroImage:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=600&fit=crop",
    tagline: "Ayda bir kitap, ayda bir buluşma",
    callToActionText:
      "Dubai'de yaşayan Türk kitapseverler için her ay seçilen bir kitabı tartışıyoruz. Kafe buluşmaları, yazar söyleşileri ve okuma maratonları seni bekliyor.",
    conditions:
      "Aylık seçilen kitabı okuma sözü ver\nBuluşmalara ayda en az 1 kez katıl\nSpoiler uyarısı zorunlu\nGrup içi reklam yasak",
    whatsappLink: "https://chat.whatsapp.com/kitap-dubai",
    adminName: "Selma Kaya",
    adminContact: "+971 50 000 0000",
    status: "approved",
    createdAt: new Date().toISOString(),
  },
];

type Row = {
  id: string;
  slug: string;
  group_name: string;
  category: LandingCategory;
  country: string;
  city: string;
  mode: LandingMode;
  hero_image: string | null;
  tagline: string | null;
  call_to_action_text: string | null;
  conditions: string | null;
  whatsapp_link: string;
  admin_name: string | null;
  admin_contact: string | null;
  status: LandingStatus;
  created_at: string;
};

const rowToLanding = (r: Row): WhatsAppLanding => ({
  id: r.slug,
  groupName: r.group_name,
  category: r.category,
  country: r.country,
  city: r.city,
  mode: r.mode,
  heroImage: r.hero_image ?? undefined,
  tagline: r.tagline ?? "",
  callToActionText: r.call_to_action_text ?? "",
  conditions: r.conditions ?? "",
  whatsappLink: r.whatsapp_link,
  adminName: r.admin_name ?? undefined,
  adminContact: r.admin_contact ?? undefined,
  status: r.status,
  createdAt: r.created_at,
});

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);

/** Fetch single landing by slug. Falls back to local demos. */
export const getLanding = async (
  slug: string,
): Promise<WhatsAppLanding | undefined> => {
  const { data, error } = await supabase
    .from("whatsapp_landings")
    .select("*")
    .eq("slug", slug)
    .eq("status", "approved")
    .maybeSingle();
  if (!error && data) return rowToLanding(data as Row);
  return undefined;
};

/** List approved landings (public). */
export const listLandings = async (): Promise<WhatsAppLanding[]> => {
  const { data, error } = await supabase
    .from("whatsapp_landings")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  return !error && data ? (data as Row[]).map(rowToLanding) : [];
};

/** Submit a new landing. Returns slug or throws. */
export interface SaveLandingInput {
  groupName: string;
  category: LandingCategory;
  country: string;
  city: string;
  mode: LandingMode;
  heroImage?: string;
  tagline?: string;
  callToActionText?: string;
  conditions?: string;
  whatsappLink: string;
  adminName?: string;
  adminContact?: string;
  description?: string;
  theme?: string;
  memberCount?: number;
  centralCountry?: string;
  centralCity?: string;
  primaryLanguage?: string;
  foundedYear?: number;
  acceptFormEnabled?: boolean;
  acceptFormQuestions?: string;
}

/** Lightweight link-only submission (members). Notifies admins via DB trigger. */
export interface LinkRequestInput {
  whatsappLink: string;
  groupName?: string;
  category?: string;
  country?: string;
  city?: string;
  note?: string;
  submitterName?: string;
  submitterContact?: string;
}

export const submitLinkRequest = async (input: LinkRequestInput) => {
  const { data: userRes } = await supabase.auth.getUser();
  const { error } = await supabase.from("whatsapp_link_requests" as any).insert({
    user_id: userRes.user?.id ?? null,
    whatsapp_link: input.whatsappLink,
    group_name: input.groupName ?? null,
    category: input.category ?? null,
    country: input.country ?? null,
    city: input.city ?? null,
    note: input.note ?? null,
    submitter_name: input.submitterName ?? null,
    submitter_contact: input.submitterContact ?? null,
  });
  if (error) throw error;
};

export const submitLanding = async (
  input: SaveLandingInput,
): Promise<{ slug: string; id: string }> => {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) throw new Error("Giriş yapmalısın.");

  const baseSlug =
    slugify(`${input.groupName}-${input.city}`) || `landing-${Date.now()}`;
  // ensure uniqueness
  let slug = baseSlug;
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await supabase
      .from("whatsapp_landings")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const { data, error } = await supabase
    .from("whatsapp_landings")
    .insert({
      user_id: user.id,
      slug,
      group_name: input.groupName,
      category: input.category,
      country: input.country,
      city: input.city,
      mode: input.mode,
      hero_image: input.heroImage || null,
      tagline: input.tagline || null,
      call_to_action_text: input.callToActionText || null,
      conditions: input.conditions || null,
      whatsapp_link: input.whatsappLink,
      admin_name: input.adminName || null,
      admin_contact: input.adminContact || null,
      description: input.description || null,
      theme: input.theme || null,
      member_count: input.memberCount ?? null,
      central_country: input.centralCountry || null,
      central_city: input.centralCity || null,
      primary_language: input.primaryLanguage || null,
      founded_year: input.foundedYear ?? null,
      accept_form_enabled: input.acceptFormEnabled ?? true,
      accept_form_questions: input.acceptFormQuestions || null,
    } as any)
    .select("id, slug")
    .single();

  if (error) throw error;
  return { slug: data.slug, id: data.id };
};

/** Admin: list submissions with optional status filter. */
export const listAllSubmissions = async (
  status?: LandingStatus,
): Promise<(WhatsAppLanding & { dbId: string })[]> => {
  let q = supabase
    .from("whatsapp_landings")
    .select("*")
    .order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error || !data) return [];
  return (data as Row[]).map((r) => ({ ...rowToLanding(r), dbId: r.id }));
};

/** Admin: approve / reject. */
export const setLandingStatus = async (
  dbId: string,
  status: LandingStatus,
  rejection_reason?: string,
) => {
  const { error } = await supabase
    .from("whatsapp_landings")
    .update({ status, rejection_reason: rejection_reason ?? null })
    .eq("id", dbId);
  if (error) throw error;
};

/** Current user: list own submissions (any status). */
export const listMyLandings = async (): Promise<(WhatsAppLanding & { dbId: string })[]> => {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return [];
  const { data, error } = await supabase
    .from("whatsapp_landings")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Row[]).map((r) => ({ ...rowToLanding(r), dbId: r.id }));
};

/** Current user: delete own submission. */
export const deleteMyLanding = async (dbId: string) => {
  const { error } = await supabase.from("whatsapp_landings").delete().eq("id", dbId);
  if (error) throw error;
};

/** Admin: delete. */
export const deleteLanding = async (dbId: string) => {
  const { error } = await supabase.from("whatsapp_landings").delete().eq("id", dbId);
  if (error) throw error;
};

/** Backwards-compat shim — older callers expected sync save. */
export const saveLanding = (l: WhatsAppLanding) => {
  void submitLanding({
    groupName: l.groupName,
    category: l.category,
    country: l.country,
    city: l.city,
    mode: l.mode,
    heroImage: l.heroImage,
    tagline: l.tagline,
    callToActionText: l.callToActionText,
    conditions: l.conditions,
    whatsappLink: l.whatsappLink,
    adminName: l.adminName,
    adminContact: l.adminContact,
  }).catch(() => undefined);
};
