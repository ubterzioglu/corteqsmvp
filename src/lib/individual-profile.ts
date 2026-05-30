import type { Json, Tables } from "@/integrations/supabase/types";
import type { IndividualFeatureMeta } from "@/lib/features";

type JsonRecord = Record<string, Json | undefined>;

type IndividualProfileRow = Tables<"individual_profile_details">;

type ProfileStep = {
  label: string;
  completed: boolean;
};

type PlacePeriod = {
  label: string;
  period: string;
};

type ProfileDocument = {
  name: string;
  url: string | null;
};

type RecentEvent = {
  title: string;
  date: string;
  city: string;
};

type RelocationPlan = {
  enabled: boolean;
  country: string;
  city: string;
};

export type IndividualProfileFrontCardPayload = {
  profileImageUrl: string | null;
  passportStatus: string;
  previousCities: PlacePeriod[];
  miniEvent: {
    title: string;
    date: string;
  } | null;
  followRequestState: "locked" | "requested" | "connected";
  followRequestNote: string;
  profilePreviewNote: string;
  worldMessage: string;
  corteqsPassport: boolean;
  linkedinUrl: string | null;
  linkedinVisible: boolean;
  cvDoc: ProfileDocument | null;
  presentationDoc: ProfileDocument | null;
  birthdayDays: number | null;
  giftAcceptance: boolean;
};

export type IndividualProfileDetailCardPayload = {
  aboutText: string;
  interests: string[];
  languages: string[];
  livedCountries: PlacePeriod[];
  serviceRequests: string[];
  events: string[];
  followsPreview: string[];
  whatsappGroups: string[];
  activities: string[];
  recentEvents: RecentEvent[];
  countriesLived: PlacePeriod[];
  relocation: RelocationPlan;
  cvRequestEnabled: boolean;
  wishlistStatus: "hidden" | "v2";
};

export type IndividualProfileControlPanelPayload = {
  panelTagline: string;
  panelBadges: string[];
  navActions: string[];
  reminder: string;
  locationSummary: string;
  country: string;
  city: string;
  yearsInCity: string;
  phone: string;
  birthDate: string;
  education: string;
  school: string;
  institution: string;
  bio: string;
  linkedin: string;
  websiteLinks: string[];
  websites: string[];
  skills: string[];
  profileVisible: boolean;
  profileSteps: ProfileStep[];
};

export type IndividualProfileDetailsCore = {
  userId: string;
  displayName: string;
  email: string;
  tagline: string;
  statusText: string;
  presenceStatus: "online" | "cadde" | "offline";
  visibilityStatus: "open" | "locked";
  followerCount: number;
  followingCount: number;
  eventCount: number;
  activeCity: string;
  activeCountry: string;
  hometown: string;
  phoneVerified: boolean;
  jobSeeking: boolean;
  mentorOptIn: boolean;
  frontCard: IndividualProfileFrontCardPayload;
  detailCard: IndividualProfileDetailCardPayload;
  controlPanel: IndividualProfileControlPanelPayload;
};

export type IndividualProfileUpdateInput = {
  displayName: string;
  tagline: string;
  statusText: string;
  worldMessage: string;
  activeCountry: string;
  activeCity: string;
  hometown: string;
  profileVisible: boolean;
  jobSeeking: boolean;
  bio: string;
  linkedin: string;
  country: string;
  city: string;
  yearsInCity: string;
  phone: string;
  education: string;
  school: string;
  institution: string;
  languages: string[];
  interests: string[];
};

export type IndividualProfileModuleState = {
  visibleModules: IndividualFeatureMeta[];
  featuresLoading: boolean;
  featureErrorMessage: string | null;
  featureSourceByKey: Record<string, string>;
};

const isRecord = (value: unknown): value is JsonRecord => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const asRecord = (value: Json | null): JsonRecord => {
  if (!isRecord(value)) return {};
  return value;
};

const readString = (record: JsonRecord, key: string, fallback = ""): string => {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : fallback;
};

const readNullableString = (record: JsonRecord, key: string): string | null => {
  const value = record[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const readBoolean = (record: JsonRecord, key: string, fallback = false): boolean => {
  const value = record[key];
  return typeof value === "boolean" ? value : fallback;
};

const readNumber = (record: JsonRecord, key: string): number | null => {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const readStringArray = (record: JsonRecord, key: string): string[] => {
  const value = record[key];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
};

const readPlacePeriodArray = (record: JsonRecord, key: string): PlacePeriod[] => {
  const value = record[key];
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      const cityValue = item.city ?? item.country ?? item.label;
      const label = typeof cityValue === "string" ? cityValue : "";
      const period = typeof item.period === "string" ? item.period : "";
      if (!label) return null;
      return { label, period };
    })
    .filter((item): item is PlacePeriod => Boolean(item));
};

const readProfileSteps = (record: JsonRecord, key: string): ProfileStep[] => {
  const value = record[key];
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      const label = typeof item.label === "string" ? item.label : "";
      if (!label) return null;
      const completed = typeof item.completed === "boolean" ? item.completed : false;
      return { label, completed };
    })
    .filter((item): item is ProfileStep => Boolean(item));
};

const readMiniEvent = (record: JsonRecord): { title: string; date: string } | null => {
  const raw = record.mini_event;
  if (!isRecord(raw)) return null;
  const title = typeof raw.title === "string" ? raw.title : "";
  const date = typeof raw.date === "string" ? raw.date : "";
  if (!title && !date) return null;
  return { title, date };
};

const readDocument = (record: JsonRecord, key: string): ProfileDocument | null => {
  const value = record[key];
  if (!isRecord(value)) return null;
  const name = typeof value.name === "string" ? value.name : "";
  const urlRaw = value.url;
  const url = typeof urlRaw === "string" && urlRaw.trim().length > 0 ? urlRaw : null;
  if (!name && !url) return null;
  return { name: name || (url ? "Dokuman" : ""), url };
};

const readRecentEvents = (record: JsonRecord, key: string): RecentEvent[] => {
  const value = record[key];
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      const title = typeof item.title === "string" ? item.title : "";
      if (!title) return null;
      const date = typeof item.date === "string" ? item.date : "";
      const city = typeof item.city === "string" ? item.city : "";
      return { title, date, city };
    })
    .filter((item): item is RecentEvent => Boolean(item));
};

const readRelocation = (record: JsonRecord, key: string): RelocationPlan | null => {
  const value = record[key];
  if (!isRecord(value)) return null;

  return {
    enabled: typeof value.enabled === "boolean" ? value.enabled : false,
    country: typeof value.country === "string" ? value.country : "",
    city: typeof value.city === "string" ? value.city : "",
  };
};

const toPositiveInteger = (value: number | null | undefined): number => {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) return 0;
  return Math.floor(value);
};

const normalizePresence = (value: string | null | undefined): "online" | "cadde" | "offline" => {
  if (value === "online" || value === "cadde") return value;
  return "offline";
};

const normalizeVisibility = (value: string | null | undefined): "open" | "locked" => {
  if (value === "open") return "open";
  return "locked";
};

export const buildFallbackIndividualProfileDetails = (input: {
  userId: string;
  displayName: string;
  email: string;
}): IndividualProfileDetailsCore => {
  return {
    userId: input.userId,
    displayName: input.displayName,
    email: input.email,
    tagline: "Tagline henuz eklenmedi.",
    statusText: "Profil alanlari tamamlandikca burasi guncellenecek.",
    presenceStatus: "offline",
    visibilityStatus: "locked",
    followerCount: 0,
    followingCount: 0,
    eventCount: 0,
    activeCity: "-",
    activeCountry: "-",
    hometown: "-",
    phoneVerified: false,
    jobSeeking: false,
    mentorOptIn: false,
    frontCard: {
      profileImageUrl: null,
      passportStatus: "Pasaport / dogrulama bilgisi yok",
      previousCities: [],
      miniEvent: null,
      followRequestState: "locked",
      followRequestNote: "Profil kilitli",
      profilePreviewNote: "On izleme modu",
      worldMessage: "",
      corteqsPassport: false,
      linkedinUrl: null,
      linkedinVisible: true,
      cvDoc: null,
      presentationDoc: null,
      birthdayDays: null,
      giftAcceptance: false,
    },
    detailCard: {
      aboutText: "Kullanici henuz hakkinda bolumunu doldurmadi.",
      interests: [],
      languages: [],
      livedCountries: [],
      serviceRequests: [],
      events: [],
      followsPreview: [],
      whatsappGroups: [],
      activities: [],
      recentEvents: [],
      countriesLived: [],
      relocation: {
        enabled: false,
        country: "",
        city: "",
      },
      cvRequestEnabled: false,
      wishlistStatus: "v2",
    },
    controlPanel: {
      panelTagline: "Bireysel Panelim",
      panelBadges: [],
      navActions: [
        "Hizmet Talepleri",
        "Etkinlikler",
        "Takip",
        "WhatsApp",
        "Mesaj Kutusu",
        "Profil Ayarlari",
      ],
      reminder: "Panel kilitliyse profil ayarlarinizi tamamlayin.",
      locationSummary: "-",
      country: "-",
      city: "-",
      yearsInCity: "-",
      phone: "-",
      birthDate: "-",
      education: "-",
      school: "-",
      institution: "-",
      bio: "Bio / Hakkinda alani henuz doldurulmadi.",
      linkedin: "-",
      websiteLinks: [],
      websites: [],
      skills: [],
      profileVisible: true,
      profileSteps: [
        { label: "Telefon Dogrulama", completed: false },
        { label: "Profil Fotografi", completed: false },
        { label: "Bio / Hakkinda", completed: false },
        { label: "Ilgi Alanlari", completed: false },
      ],
    },
  };
};

export const mapIndividualProfileRow = (
  row: IndividualProfileRow | null,
  fallback: IndividualProfileDetailsCore,
): IndividualProfileDetailsCore => {
  if (!row) return fallback;

  const frontCard = asRecord(row.front_card);
  const detailCard = asRecord(row.detail_card);
  const controlPanel = asRecord(row.control_panel);
  const profileSettings = asRecord(row.profile_settings);

  const profileImageUrl = frontCard.profile_image_url;
  const followRequestRaw = frontCard.follow_request_state;
  const followRequestState: IndividualProfileFrontCardPayload["followRequestState"] =
    followRequestRaw === "requested" || followRequestRaw === "connected" ? followRequestRaw : "locked";

  const wishlistRaw = detailCard.wishlist_status;
  const wishlistStatus: IndividualProfileDetailCardPayload["wishlistStatus"] =
    wishlistRaw === "hidden" ? "hidden" : "v2";

  return {
    ...fallback,
    tagline: row.tagline ?? fallback.tagline,
    statusText: row.status_text ?? fallback.statusText,
    presenceStatus: normalizePresence(row.presence_status),
    visibilityStatus: normalizeVisibility(row.visibility_status),
    followerCount: toPositiveInteger(row.follower_count),
    followingCount: toPositiveInteger(row.following_count),
    eventCount: toPositiveInteger(row.event_count),
    activeCity: row.active_city ?? fallback.activeCity,
    activeCountry: row.active_country ?? fallback.activeCountry,
    hometown: row.hometown ?? fallback.hometown,
    phoneVerified: Boolean(row.phone_verified),
    jobSeeking: Boolean(row.job_seeking),
    mentorOptIn: Boolean(row.mentor_opt_in),
    frontCard: {
      ...fallback.frontCard,
      profileImageUrl: typeof profileImageUrl === "string" && profileImageUrl.trim() ? profileImageUrl : null,
      passportStatus: readString(frontCard, "passport_status", fallback.frontCard.passportStatus),
      previousCities: readPlacePeriodArray(frontCard, "previous_cities"),
      miniEvent: readMiniEvent(frontCard),
      followRequestState,
      followRequestNote: readString(frontCard, "follow_request_note", fallback.frontCard.followRequestNote),
      profilePreviewNote: readString(frontCard, "profile_preview_note", fallback.frontCard.profilePreviewNote),
      worldMessage: readString(frontCard, "world_message", fallback.frontCard.worldMessage),
      corteqsPassport: readBoolean(frontCard, "corteqs_passport", fallback.frontCard.corteqsPassport),
      linkedinUrl: readNullableString(frontCard, "linkedin_url"),
      linkedinVisible: readBoolean(frontCard, "linkedin_visible", fallback.frontCard.linkedinVisible),
      cvDoc: readDocument(frontCard, "cv_doc"),
      presentationDoc: readDocument(frontCard, "presentation_doc"),
      birthdayDays: readNumber(frontCard, "birthday_days"),
      giftAcceptance: readBoolean(frontCard, "gift_acceptance", fallback.frontCard.giftAcceptance),
    },
    detailCard: {
      ...fallback.detailCard,
      aboutText: readString(detailCard, "about_text", fallback.detailCard.aboutText),
      interests: readStringArray(detailCard, "interests"),
      languages: readStringArray(detailCard, "languages"),
      livedCountries: readPlacePeriodArray(detailCard, "lived_countries"),
      serviceRequests: readStringArray(detailCard, "service_requests"),
      events: readStringArray(detailCard, "events"),
      followsPreview: readStringArray(detailCard, "follows_preview"),
      whatsappGroups: readStringArray(detailCard, "whatsapp_groups"),
      activities: readStringArray(detailCard, "activities"),
      recentEvents: readRecentEvents(detailCard, "recent_events"),
      countriesLived: readPlacePeriodArray(detailCard, "countries_lived"),
      relocation: readRelocation(detailCard, "relocation") ?? fallback.detailCard.relocation,
      cvRequestEnabled: readBoolean(detailCard, "cv_request_enabled", fallback.detailCard.cvRequestEnabled),
      wishlistStatus,
    },
    controlPanel: {
      ...fallback.controlPanel,
      panelTagline: readString(controlPanel, "panel_tagline", fallback.controlPanel.panelTagline),
      panelBadges: readStringArray(controlPanel, "panel_badges"),
      navActions: readStringArray(controlPanel, "nav_actions"),
      reminder: readString(controlPanel, "reminder", fallback.controlPanel.reminder),
      locationSummary: readString(controlPanel, "location_summary", fallback.controlPanel.locationSummary),
      country: readString(profileSettings, "country", fallback.controlPanel.country),
      city: readString(profileSettings, "city", fallback.controlPanel.city),
      yearsInCity: readString(profileSettings, "years_in_city", fallback.controlPanel.yearsInCity),
      phone: readString(profileSettings, "phone", fallback.controlPanel.phone),
      birthDate: readString(profileSettings, "birth_date", fallback.controlPanel.birthDate),
      education: readString(profileSettings, "education", fallback.controlPanel.education),
      school: readString(profileSettings, "school", fallback.controlPanel.school),
      institution: readString(profileSettings, "institution", fallback.controlPanel.institution),
      bio: readString(profileSettings, "bio", fallback.controlPanel.bio),
      linkedin: readString(profileSettings, "linkedin", fallback.controlPanel.linkedin),
      websiteLinks: readStringArray(profileSettings, "website_links"),
      websites: readStringArray(profileSettings, "websites"),
      skills: readStringArray(profileSettings, "skills"),
      profileVisible: readBoolean(profileSettings, "profile_visible", fallback.controlPanel.profileVisible),
      profileSteps: readProfileSteps(profileSettings, "profile_steps"),
    },
  };
};
