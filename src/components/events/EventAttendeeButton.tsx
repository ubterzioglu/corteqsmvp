// M06 · Etkinlik katılım düğmesi (Faz 1 UI).
//
// Veri: `fetchEventAttendeeCount` (aggregate RPC — katılımcı SATIRLARI istemciye
// gelmez, M04) · yazma: `joinEvent`/`leaveEvent` (kapasite + yarış kilidi SQL'de).
// Durumlar: girişsiz → login yönlendirmesi · katılmamış → "Etkinliğe katıl" ·
// katılmış → "Katılımdan ayrıl" · kontenjan dolu → pasif "Kontenjan dolu".
// Yalnız `published` etkinlikte çizilir (pending etkinlikte düğme GÖRÜNMEZ —
// onay bekleyen etkinlik katılım toplamaz).
//
// ⚠️ Sayaç İKİNCİL yüzey: fetch null dönerse düğme yine çizilir (katılım
// çalışır), yalnız sayaç satırı gizlenir — sayfa çökmez (cadde ikincil kalıbı).
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, UserPlus, UserX, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "@/components/auth/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fetchEventAttendeeCount, joinEvent, leaveEvent } from "@/lib/events-api";
import { getErrorMessage } from "@/lib/whatsapp-landing-form";

const COUNT_KEY = "event-attendee-count";

interface EventAttendeeButtonProps {
  eventId: string;
  eventStatus: string;
}

export function EventAttendeeButton({ eventId, eventStatus }: EventAttendeeButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const countQuery = useQuery({
    queryKey: [COUNT_KEY, eventId],
    queryFn: () => fetchEventAttendeeCount(eventId),
    enabled: eventStatus === "published",
  });

  const joinMutation = useMutation({
    mutationFn: () => joinEvent(eventId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [COUNT_KEY, eventId] });
      toast({ title: "Katıldın", description: "Etkinlikte görüşmek üzere!" });
    },
    onError: (error) => {
      toast({ title: "Katılamadın", description: getErrorMessage(error), variant: "destructive" });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveEvent(eventId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [COUNT_KEY, eventId] });
      toast({ title: "Katılımın iptal edildi" });
    },
    onError: (error) => {
      toast({ title: "İptal edilemedi", description: getErrorMessage(error), variant: "destructive" });
    },
  });

  // Onay bekleyen/removed etkinlikte düğme YOK (M04 RPC'si de reddeder —
  // kullanıcıya ölü düğme gösterilmez).
  if (eventStatus !== "published") return null;

  const summary = countQuery.data ?? null;
  const joined = summary?.viewerStatus === "going";
  const busy = joinMutation.isPending || leaveMutation.isPending;

  if (!user) {
    return (
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center" data-testid="event-attendee-anon">
        <p className="text-sm text-muted-foreground">
          Katılmak için giriş yap — katılım listesi üyelere açık.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to="/login">Giriş yap</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2" data-testid="event-attendee-panel">
      <div className="flex flex-wrap items-center gap-3">
        {joined ? (
          <Button
            variant="outline"
            className="gap-2 border-red-300 text-red-700"
            onClick={() => leaveMutation.mutate()}
            disabled={busy}
            data-testid="event-leave-button"
          >
            {leaveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <UserX className="h-4 w-4" aria-hidden="true" />
            )}
            Katılımdan ayrıl
          </Button>
        ) : summary?.isFull ? (
          <Button variant="secondary" disabled data-testid="event-full-badge">
            <Users className="mr-2 h-4 w-4" aria-hidden="true" />
            Kontenjan dolu
          </Button>
        ) : (
          <Button
            className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => joinMutation.mutate()}
            disabled={busy}
            data-testid="event-join-button"
          >
            {joinMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <UserPlus className="h-4 w-4" aria-hidden="true" />
            )}
            Etkinliğe katıl
          </Button>
        )}

        {summary ? (
          <p className="text-sm text-muted-foreground" data-testid="event-attendee-count">
            <Users className="mr-1 inline h-4 w-4" aria-hidden="true" />
            {summary.goingCount} kişi katılıyor
            {summary.maxAttendees != null ? ` · kapasite ${summary.maxAttendees}` : ""}
          </p>
        ) : null}
      </div>
      {joined ? (
        <p className="text-xs text-emerald-700">Katılımcı listesinde görünüyorsun.</p>
      ) : null}
    </div>
  );
}

export default EventAttendeeButton;
