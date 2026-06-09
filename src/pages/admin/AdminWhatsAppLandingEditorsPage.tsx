import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { ExternalLink, ShieldCheck, Trash2, UserPlus } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  grantLandingEditorAsAdmin,
  listAllSubmissions,
  listLandingEditorAssignmentsAsAdmin,
  revokeLandingEditorAsAdmin,
  type LandingEditorAssignment,
  type WhatsAppLanding,
} from "@/lib/whatsapp-landings";

type UserOption = {
  user_id: string;
  email: string | null;
  full_name: string | null;
};

export default function AdminWhatsAppLandingEditorsPage() {
  const { toast } = useToast();
  const [landings, setLandings] = useState<WhatsAppLanding[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [assignments, setAssignments] = useState<LandingEditorAssignment[]>([]);
  const [selectedLandingId, setSelectedLandingId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      setLoading(true);
      try {
        const [landingRows, assignmentRows, usersResult] = await Promise.all([
          listAllSubmissions(),
          listLandingEditorAssignmentsAsAdmin(),
          supabase.from("user_role_assignments").select("user_id"),
        ]);

        if (!mounted) return;

        if (usersResult.error) throw usersResult.error;

        const userIds = (usersResult.data ?? []).map((u: any) => u.user_id);
        const attrsResult = userIds.length > 0
          ? await supabase
              .from("user_profile_attributes")
              .select("user_id, value_text, afs_attributes!inner(key)")
              .in("user_id", userIds)
              .in("afs_attributes.key", ["full_name"])
          : { data: [] };

        const nameByUser: Record<string, string | null> = {};
        for (const row of (attrsResult.data ?? []) as any[]) {
          nameByUser[row.user_id] = row.value_text ?? null;
        }

        const enrichedUsers: UserOption[] = userIds.map((uid: string) => ({
          user_id: uid,
          email: null,
          full_name: nameByUser[uid] ?? null,
        }));

        setLandings(landingRows.filter((row) => Boolean(row.dbId)));
        setAssignments(assignmentRows);
        setUsers(enrichedUsers);
      } catch (error) {
        toast({
          title: "Landing editör verileri alınamadı",
          description: error instanceof Error ? error.message : "Beklenmeyen hata",
          variant: "destructive",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [toast]);

  const availableUsers = useMemo(() => {
    if (!selectedLandingId) return users;
    const assignedUserIds = new Set(
      assignments.filter((assignment) => assignment.landingId === selectedLandingId).map((assignment) => assignment.userId),
    );
    return users.filter((user) => !assignedUserIds.has(user.user_id));
  }, [assignments, selectedLandingId, users]);

  const handleAssign = async () => {
    if (!selectedLandingId || !selectedUserId) return;

    try {
      setSubmitting(true);
      await grantLandingEditorAsAdmin(selectedLandingId, selectedUserId);
      const nextAssignments = await listLandingEditorAssignmentsAsAdmin();
      setAssignments(nextAssignments);
      setSelectedUserId("");
      toast({
        title: "Landing editörü atandı",
        description: "Kullanıcı artık atanmış landing kaydını düzenleyebilir.",
      });
    } catch (error) {
      toast({
        title: "Atama kaydedilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen hata",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (assignmentId: string) => {
    try {
      setRemovingId(assignmentId);
      await revokeLandingEditorAsAdmin(assignmentId);
      setAssignments((current) => current.filter((assignment) => assignment.id !== assignmentId));
      toast({
        title: "Landing editör yetkisi kaldırıldı",
        description: "Kullanıcının bu landing üzerindeki düzenleme erişimi kaldırıldı.",
      });
    } catch (error) {
      toast({
        title: "Yetki kaldırılamadı",
        description: error instanceof Error ? error.message : "Beklenmeyen hata",
        variant: "destructive",
      });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Topluluk Landing Editörleri
          </h1>
          <p className="text-sm text-muted-foreground">
            Belirli kullanıcıları yalnızca belirli topluluk landing kayıtlarını düzenleyebilecek şekilde ata.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/whatsapp-landings/guide">
            <Button variant="outline" className="gap-2">
              Topluluk Kullanma Kılavuzu
            </Button>
          </Link>
          <Link to="/admin/whatsapp-landings">
            <Button variant="outline" className="gap-2">
              Moderasyon ekranına dön
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yeni Editör Ata</CardTitle>
          <CardDescription>
            Bu atama ilgili kullanıcı için landing bazlı edit yetkisi açar ve gerekli feature override kaydını otomatik hazırlar.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1.3fr_1fr_auto]">
          <Select value={selectedLandingId} onValueChange={setSelectedLandingId} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Landing seç" />
            </SelectTrigger>
            <SelectContent>
              {landings.map((landing) => (
                <SelectItem key={landing.dbId} value={landing.dbId!}>
                  {landing.groupName} ({landing.city}, {landing.country})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={loading || !selectedLandingId}>
            <SelectTrigger>
              <SelectValue placeholder="Kullanıcı seç" />
            </SelectTrigger>
            <SelectContent>
              {availableUsers.map((user) => (
                <SelectItem key={user.user_id} value={user.user_id}>
                  {user.full_name ?? user.email ?? user.user_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700" disabled={!selectedLandingId || !selectedUserId || submitting} onClick={() => void handleAssign()}>
            <UserPlus className="h-4 w-4" />
            {submitting ? "Kaydediliyor..." : "Editör Ata"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aktif Atamalar</CardTitle>
          <CardDescription>Landing bazlı verilen editör yetkileri burada listelenir.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Yükleniyor...</p>
          ) : assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz landing editör ataması yok.</p>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold text-foreground">{assignment.landingGroupName}</p>
                    <p className="text-sm text-muted-foreground">
                      {assignment.userFullName ?? assignment.userEmail ?? assignment.userId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Atandı: {new Date(assignment.createdAt).toLocaleString("tr-TR")}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/addcom?group=${encodeURIComponent(assignment.landingSlug)}`}>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Landing
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-destructive hover:text-destructive"
                      disabled={removingId === assignment.id}
                      onClick={() => void handleRevoke(assignment.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {removingId === assignment.id ? "Kaldırılıyor..." : "Yetkiyi Kaldır"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
