import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEvent,
  deleteEvent,
  fetchAllEventsAdmin,
  fetchEventById,
  fetchMyEvents,
  fetchPublishedEvents,
  publishEvent,
  toggleFeaturedEvent,
  unpublishEvent,
  updateEvent,
  type CreateEventInput,
  type EventFilters,
} from "@/lib/events-api";
import type { TablesUpdate } from "@/integrations/supabase/types";

const PUBLISHED_EVENTS_KEY = ["events", "published"] as const;
const MY_EVENTS_KEY = ["events", "my"] as const;
const ADMIN_EVENTS_KEY = ["events", "admin"] as const;

export function usePublishedEvents(filters?: EventFilters) {
  return useQuery({
    queryKey: [...PUBLISHED_EVENTS_KEY, filters],
    queryFn: () => fetchPublishedEvents(filters),
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ["events", "detail", id],
    queryFn: () => fetchEventById(id),
    enabled: !!id,
  });
}

export function useMyEvents(userId: string | undefined) {
  return useQuery({
    queryKey: [...MY_EVENTS_KEY, userId],
    queryFn: () => fetchMyEvents(userId!),
    enabled: !!userId,
  });
}

export function useAdminEvents() {
  return useQuery({
    queryKey: ADMIN_EVENTS_KEY,
    queryFn: fetchAllEventsAdmin,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEventInput) => createEvent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...PUBLISHED_EVENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [...MY_EVENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: ADMIN_EVENTS_KEY });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TablesUpdate<"events"> }) => updateEvent(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...PUBLISHED_EVENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [...MY_EVENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: ADMIN_EVENTS_KEY });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...PUBLISHED_EVENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [...MY_EVENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: ADMIN_EVENTS_KEY });
    },
  });
}

export function usePublishEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => publishEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...PUBLISHED_EVENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: ADMIN_EVENTS_KEY });
    },
  });
}

export function useUnpublishEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unpublishEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...PUBLISHED_EVENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: ADMIN_EVENTS_KEY });
    },
  });
}

export function useToggleFeaturedEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) => toggleFeaturedEvent(id, featured),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...PUBLISHED_EVENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: ADMIN_EVENTS_KEY });
    },
  });
}
