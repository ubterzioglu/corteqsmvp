import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import type { EventType } from "@/lib/events-vocabulary";

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
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
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
  userId: string;
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
}

export async function createEvent(input: CreateEventInput): Promise<EventRow> {
  const payload: TablesInsert<"events"> = {
    user_id: input.userId,
    title: input.title,
    description: input.description,
    category: input.category,
    type: input.type,
    event_date: input.eventDate,
    start_time: input.startTime,
    end_time: input.endTime,
    country: input.country,
    city: input.city,
    location: input.location,
    online_url: input.onlineUrl,
    price: input.price,
    max_attendees: input.maxAttendees,
    cover_image: input.coverImage,
    tags: input.tags.length > 0 ? input.tags : null,
    organizer_name: input.organizerName,
    organizer_type: input.organizerType,
    registration_url: input.registrationUrl,
    status: "pending",
  };

  const { data, error } = await supabase.from("events").insert(payload).select().single();
  if (error) throw error;
  return data as EventRow;
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
