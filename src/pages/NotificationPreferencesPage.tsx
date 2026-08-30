import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  getRelocationReminderPreference,
  setRelocationReminderOptOut,
} from "@/lib/relocation-reminders-api";
import { useSeo } from "@/lib/seo";

const QUERY_KEY = ["notification-preferences", "relocation-tool-reminders"] as const;

export default function NotificationPreferencesPage() {
  const queryClient = useQueryClient();
  useSeo({ title: "Bildirim Tercihleri | CorteQS", robots: "noindex, nofollow" }, []);

  const preferenceQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getRelocationReminderPreference,
  });
  const mutation = useMutation({
    mutationFn: setRelocationReminderOptOut,
    onSuccess: (preference) => queryClient.setQueryData(QUERY_KEY, preference),
  });

  const preference = preferenceQuery.data;
  const enabledForUser = preference ? !preference.opted_out : false;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" aria-hidden="true" />
            Bildirim tercihleri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {preferenceQuery.isLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Tercihler yükleniyor…
            </p>
          ) : preferenceQuery.isError ? (
            <p role="alert" className="text-sm text-destructive">Bildirim tercihleri yüklenemedi.</p>
          ) : (
            <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
              <div className="space-y-1">
                <label htmlFor="relocation-reminders" className="font-medium">
                  Yarım kalan araç hatırlatmaları
                </label>
                <p className="text-sm text-muted-foreground">
                  Başladığın bir taşınma aracını tamamlamazsan en fazla bir e-posta alırsın.
                </p>
                {!preference?.global_enabled && (
                  <p className="text-xs text-amber-700">
                    Bu özellik hukuk/izin onayına kadar platform genelinde kapalıdır.
                  </p>
                )}
              </div>
              <Switch
                id="relocation-reminders"
                aria-label="Yarım kalan araç hatırlatmaları"
                checked={enabledForUser}
                disabled={mutation.isPending}
                onCheckedChange={(checked) => mutation.mutate(!checked)}
              />
            </div>
          )}
          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">Tercih kaydedilemedi.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
