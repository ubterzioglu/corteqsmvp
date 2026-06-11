// Dünya Kupası kampanyası — admin onay paneli (/admin/dunya-kupasi).
// Bekleyen başvurular admin_review_world_cup_registration_v1 ile onaylanır/reddedilir;
// onayda Business_* rolü atanır (rol korunduysa roleAssigned=false uyarısı gösterilir).

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  listWorldCupRegistrationsAsAdmin,
  reviewWorldCupRegistrationAsAdmin,
} from "@/lib/admin/admin-dunya-kupasi-api";
import {
  WORLD_CUP_STATUS_LABELS,
  type WorldCupAdminRegistration,
  type WorldCupRegistrationStatus,
} from "@/lib/dunya-kupasi-schemas";

const STATUS_BADGE_VARIANTS: Record<WorldCupRegistrationStatus, "secondary" | "default" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("tr-TR", { dateStyle: "medium" }) : "—";

const AdminDunyaKupasiPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<WorldCupRegistrationStatus>("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const registrationsQuery = useQuery({
    queryKey: ["admin", "world-cup", statusFilter],
    queryFn: () => listWorldCupRegistrationsAsAdmin(statusFilter),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ registration, approve }: { registration: WorldCupAdminRegistration; approve: boolean }) =>
      reviewWorldCupRegistrationAsAdmin(registration.id, approve, notes[registration.id]?.trim() || null),
    onSuccess: async (result, variables) => {
      setNotes((current) => ({ ...current, [variables.registration.id]: "" }));
      await queryClient.invalidateQueries({ queryKey: ["admin", "world-cup"] });
      await queryClient.invalidateQueries({ queryKey: ["world-cup", "businesses"] });

      if (result.status === "approved" && result.roleAssigned === false) {
        toast({
          title: "Onaylandı — rol korundu",
          description: `Kullanıcının mevcut rolü (${result.previousRoleKey ?? "bilinmiyor"}) değiştirilmedi. Gerekirse rol matrisinden güncelleyin.`,
        });
      } else {
        toast({
          title: result.status === "approved" ? "Başvuru onaylandı" : "Başvuru reddedildi",
          description:
            result.status === "approved"
              ? "İşletme rolü atandı; profil dizinde işletme olarak görünecek."
              : undefined,
        });
      }
    },
    onError: (error: unknown) => {
      toast({
        title: "İşlem uygulanamadı",
        description: error instanceof Error ? error.message : "Bilinmeyen hata",
        variant: "destructive",
      });
    },
  });

  const registrations = registrationsQuery.data ?? [];

  return (
    <div className="space-y-5 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Dünya Kupası İşletme Başvuruları
          </CardTitle>
          <CardDescription>
            {registrationsQuery.isLoading
              ? "Yükleniyor..."
              : `${registrations.length} kayıt. Onayda kullanıcıya seçilen işletme rolü atanır ve profili dizinde işletmeye dönüşür.`}
          </CardDescription>
          <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as WorldCupRegistrationStatus)}>
            <TabsList>
              <TabsTrigger value="pending">Bekleyen</TabsTrigger>
              <TabsTrigger value="approved">Onaylanan</TabsTrigger>
              <TabsTrigger value="rejected">Reddedilen</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
      </Card>

      {registrations.map((registration) => (
        <Card key={registration.id}>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">{registration.businessName}</CardTitle>
              <Badge variant={STATUS_BADGE_VARIANTS[registration.status]}>
                {WORLD_CUP_STATUS_LABELS[registration.status]}
              </Badge>
            </div>
            <CardDescription className="space-x-2">
              <span>{registration.categoryLabel}</span>
              <span>·</span>
              <span>
                {registration.city}, {registration.country}
              </span>
              <span>·</span>
              <span>{registration.email ?? "e-posta yok"}</span>
              <span>·</span>
              <span>Başvuru: {formatDate(registration.createdAt)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {registration.address && (
              <p className="text-sm text-muted-foreground">Adres: {registration.address}</p>
            )}
            {registration.applicantNote && (
              <p className="text-sm text-muted-foreground">Başvuru notu: {registration.applicantNote}</p>
            )}
            {registration.status !== "pending" && (
              <p className="text-sm text-muted-foreground">
                Değerlendirme: {formatDate(registration.reviewedAt)}
                {registration.reviewNote ? ` — ${registration.reviewNote}` : ""}
                {registration.status === "approved" && registration.roleAssigned === false
                  ? ` (rol korundu: ${registration.previousRoleKey ?? "?"})`
                  : ""}
              </p>
            )}

            {registration.status === "pending" && (
              <>
                <Textarea
                  placeholder="Değerlendirme notu (opsiyonel; redde gerekçe olarak gösterilir)"
                  value={notes[registration.id] ?? ""}
                  onChange={(event) =>
                    setNotes((current) => ({ ...current, [registration.id]: event.target.value }))
                  }
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => reviewMutation.mutate({ registration, approve: true })}
                    disabled={reviewMutation.isPending}
                  >
                    Onayla
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => reviewMutation.mutate({ registration, approve: false })}
                    disabled={reviewMutation.isPending}
                  >
                    Reddet
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}

      {!registrationsQuery.isLoading && registrations.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Bu durumda başvuru bulunmuyor.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDunyaKupasiPage;
