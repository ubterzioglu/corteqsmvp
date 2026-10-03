import { supabase } from "@/integrations/supabase/client";
import type { TablesUpdate } from "@/integrations/supabase/types";
import type { EventType } from "@/lib/events-vocabulary";
import { resolveEventRpcErrorMessage } from "@/lib/events-rules";

export type EventRow = {
  id: string;
  category: string;
  city: string | null;
  country: string | null;
  cover_image: string | null;
  created_at: string;
  description: string;
  end_time: string | null;
  event_date: string;
  featured: boolean;
  location: string | null;
  max_attendees: number | null;
  online_url: string | null;
  organizer_name: string | null;
  organizer_type: string;
  price: number | null;
  registration_url: string | null;
  start_time: string | null;
  status: string;
  tags: string[] | null;
  /** Etkinlik saatinin IANA saat dilimi. NULL = 20.09.2026 öncesi kayıt. */
  timezone: string | null;
  title: string;
  type: string;
  updated_at: string;
  user_id: string;
};

export type EventFilters = {
  type?: string;
  category?: string;
  country?: string;
  city?: string;
  status?: string;
  search?: string;
};

/**
 * PostgREST `or()` ifadesine gömülecek kullanıcı girdisini güvenli hâle getirir.
 *
 * `or()` sözdiziminde VİRGÜL koşul ayırıcıdır. Ham girdi gömülürse "kültür, sanat"
 * yazan kullanıcı ifadeyi ikiye böler, sunucu 400 döner ve liste
 * "Etkinlikler yüklenemedi." ile tamamen düşer. Değer çift tırnağa alınır;
 * içindeki ters bölü ve çift tırnak kaçırılır.
 */
export function escapeOrFilterValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export async function fetchPublishedEvents(filters?: EventFilters): Promise<EventRow[]> {
  let query = supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .order("event_date", { ascending: true });

  if (filters?.type && filters.type !== "all") {
    query = query.eq("type", filters.type);
  }
  if (filters?.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }
  if (filters?.country && filters.country !== "all") {
    query = query.eq("country", filters.country);
  }
  if (filters?.city && filters.city !== "all") {
    query = query.eq("city", filters.city);
  }
  if (filters?.search) {
    const needle = escapeOrFilterValue(filters.search);
    query = query.or(`title.ilike."%${needle}%",description.ilike."%${needle}%"`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as EventRow[]) ?? [];
}

export async function fetchEventById(id: string): Promise<EventRow | null> {
  const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as EventRow;
}

export async function fetchMyEvents(userId: string): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as EventRow[]) ?? [];
}

export async function fetchAllEventsAdmin(): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as EventRow[]) ?? [];
}

export interface CreateEventInput {
  title: string;
  description: string;
  category: string;
  type: EventType;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  country: string | null;
  city: string | null;
  location: string | null;
  onlineUrl: string | null;
  price: number | null;
  maxAttendees: number | null;
  coverImage: string | null;
  tags: string[];
  organizerName: string | null;
  organizerType: string;
  registrationUrl: string | null;
  /** IANA saat dilimi (ör. Europe/Berlin) — saat girildiyse zorunludur. */
  timezone: string | null;
}

/** M05 · create_event_v1 sonucu (M02): ilk etkinlik pending, sonrası published+auto. */
export type CreateEventResult = {
  eventId: string;
  status: "pending" | "published";
  approvalSource: "auto" | null;
};

/**
 * M05: etkinlik oluşturma artık `create_event_v1` RPC'sinden — doğrudan insert
 * YOK (M03 INSERT politikası zaten yalnız `pending` kabul ediyor; ilk-onay
 * kuralı ve aktif limiti SQL'de). `userId` İSTEMCİDEN ALINMAZ — RPC auth.uid()
 * kullanır (eski CreateEventInput.userId alanı kaldırıldı).
 *
 * ⚠️ types.ts regen BORCU (G12): RPC üretilmiş tiplerde YOK — `as never`
 * deseni bilinçli (emsal: group-submit.ts). RPC hataları DÜZ NESNE (m75):
 * `resolveEventRpcErrorMessage` ile Türkçeleştirilir.
 */
export async function createEvent(input: CreateEventInput): Promise<CreateEventResult> {
  const { data, error } = await supabase.rpc("create_event_v1" as never, {
    p_title: input.title,
    p_description: input.description,
    p_category: input.category,
    p_type: input.type,
    p_event_date: input.eventDate,
    p_start_time: input.startTime,
    p_end_time: input.endTime,
    p_country: input.country,
    p_city: input.city,
    p_location: input.location,
    p_online_url: input.onlineUrl,
    p_price: input.price,
    p_max_attendees: input.maxAttendees,
    p_cover_image: input.coverImage,
    p_tags: input.tags.length > 0 ? input.tags : null,
    p_organizer_name: input.organizerName,
    p_organizer_type: input.organizerType,
    p_registration_url: input.registrationUrl,
    p_timezone: input.timezone,
  } as never);

  if (error) throw new Error(resolveEventRpcErrorMessage(error, "Etkinlik oluşturulamadı."));

  const result = data as { event_id: string; status: string; approval_source: string | null } | null;
  if (!result?.event_id) throw new Error("Etkinlik oluşturulamadı.");
  return {
    eventId: result.event_id,
    status: result.status === "published" ? "published" : "pending",
    approvalSource: result.approval_source === "auto" ? "auto" : null,
  };
}

// ── M04 katılım RPC'leri (kapasite SQL'de, yarış kilidi sunucuda) ───────────

export type EventAttendeeSummary = {
  goingCount: number;
  maxAttendees: number | null;
  isFull: boolean;
  viewerStatus: "going" | "cancelled" | null;
};

/** Katılım durumu (aggregate RPC — istemci katılımcı satırlarını görmez). */
export async function joinEvent(eventId: string): Promise<EventAttendeeSummary> {
  const { data, error } = await supabase.rpc("join_event_v1" as never, {
    p_event_id: eventId,
  } as never);
  if (error) throw new Error(resolveEventRpcErrorMessage(error, "Etkinliğe katılamadın."));
  const result = data as { going_count: number; is_full: boolean };
  return {
    goingCount: result.going_count,
    maxAttendees: null, // join yanıtı max taşımaz; tam özet count RPC'sinde
    isFull: result.is_full,
    viewerStatus: "going",
  };
}

export async function leaveEvent(eventId: string): Promise<EventAttendeeSummary> {
  const { data, error } = await supabase.rpc("leave_event_v1" as never, {
    p_event_id: eventId,
  } as never);
  if (error) throw new Error(resolveEventRpcErrorMessage(error, "Katılım iptal edilemedi."));
  const result = data as { going_count: number };
  return {
    goingCount: result.going_count,
    maxAttendees: null,
    isFull: false,
    viewerStatus: "cancelled",
  };
}

/**
 * Sayaç + izleyici durumu. İKİNCİL yüzey (detaydaki katılım şeridi): hata
 * FIRLATMAZ, null döner — şerit hiç çizilmez, sayfa çökmez (cadde ikincil
 * yüzey kalıbı).
 */
export async function fetchEventAttendeeCount(eventId: string): Promise<EventAttendeeSummary | null> {
  const { data, error } = await supabase.rpc("event_attendee_count" as never, {
    p_event_id: eventId,
  } as never);
  if (error || !data) return null;
  const result = data as {
    going_count: number;
    max_attendees: number | null;
    is_full: boolean;
    viewer_status: string | null;
  };
  return {
    goingCount: result.going_count,
    maxAttendees: result.max_attendees,
    isFull: result.is_full,
    viewerStatus: result.viewer_status === "going" || result.viewer_status === "cancelled" ? result.viewer_status : null,
  };
}

export async function updateEvent(id: string, updates: TablesUpdate<"events">): Promise<void> {
  const { error } = await supabase.from("events").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

export async function publishEvent(id: string): Promise<void> {
  await updateEvent(id, { status: "published" });
}

export async function unpublishEvent(id: string): Promise<void> {
  await updateEvent(id, { status: "draft" });
}

export async function toggleFeaturedEvent(id: string, featured: boolean): Promise<void> {
  await updateEvent(id, { featured });
}
