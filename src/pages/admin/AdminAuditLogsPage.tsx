import { useEffect, useMemo, useState } from "react";
import { ScrollText } from "lucide-react";

import { AdminEmptyState, AdminFilterBar, AdminPageShell } from "@/components/admin/page";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type AuditLogRow = {
  id: string;
  actor_user_id: string | null;
  action: string;
  target_user_id: string | null;
  target_entity_type: string | null;
  target_entity_id: string | null;
  before_value: unknown;
  after_value: unknown;
  created_at: string;
};

type UserRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
};

const AdminAuditLogsPage = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [actionFilter, setActionFilter] = useState("all");
  const [actorFilter, setActorFilter] = useState("all");
  const [targetFilter, setTargetFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const [logsResult, usersResult] = await Promise.all([
        supabase
          .from("admin_audit_logs")
          .select("id, actor_user_id, action, target_user_id, target_entity_type, target_entity_id, before_value, after_value, created_at")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.from("user_role_assignments").select("user_id"),
      ]);

      if (!isMounted) return;

      if (logsResult.error || usersResult.error) {
        toast({
          title: "Audit log verisi alınamadı",
          description: logsResult.error?.message ?? usersResult.error?.message ?? "Bilinmeyen hata",
          variant: "destructive",
        });
        return;
      }

      const userIds = ((usersResult.data ?? []) as Array<{ user_id: string }>).map((u) => u.user_id);
      const attrsResult = userIds.length > 0
        ? await supabase
            .from("user_profile_attributes")
            .select("user_id, value_text, afs_attributes!inner(key)")
            .in("user_id", userIds)
            .eq("afs_attributes.key", "full_name")
        : { data: [] };

      const nameByUser: Record<string, string | null> = {};
      for (const row of (attrsResult.data ?? []) as Array<{ user_id: string; value_text: string | null }>) {
        nameByUser[row.user_id] = row.value_text ?? null;
      }

      const enrichedUsers: UserRow[] = userIds.map((uid: string) => ({
        user_id: uid,
        email: null,
        full_name: nameByUser[uid] ?? null,
      }));

      setLogs((logsResult.data ?? []) as AuditLogRow[]);
      setUsers(enrichedUsers);
    })();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const actionOptions = useMemo(() => ["all", ...Array.from(new Set(logs.map((log) => log.action)))], [logs]);

  const filteredLogs = useMemo(() => {
    const normalizedSearch = searchText.trim().toLocaleLowerCase("tr-TR");
    return logs.filter((log) => {
      if (actionFilter !== "all" && log.action !== actionFilter) return false;
      if (actorFilter !== "all" && log.actor_user_id !== actorFilter) return false;
      if (targetFilter !== "all" && log.target_user_id !== targetFilter) return false;
      if (!normalizedSearch) return true;
      return (
        log.action.toLocaleLowerCase("tr-TR").includes(normalizedSearch) ||
        (log.target_entity_type ?? "").toLocaleLowerCase("tr-TR").includes(normalizedSearch)
      );
    });
  }, [actionFilter, actorFilter, logs, searchText, targetFilter]);

  const resolveUserLabel = (userId: string | null) => {
    if (!userId) return "-";
    const user = users.find((item) => item.user_id === userId);
    return user?.full_name ?? user?.email ?? userId;
  };

  return (
    <AdminPageShell
      title="Audit Logs"
      description="Admin işlemlerinin önce/sonra değerlerini filtreleyerek incele."
      icon={ScrollText}
      accent="sky"
      filters={
        <AdminFilterBar className="grid gap-3 xl:grid-cols-4">
          <Input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Action / entity ara" />
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Action filtrele" />
            </SelectTrigger>
            <SelectContent>
              {actionOptions.map((action) => (
                <SelectItem key={action} value={action}>
                  {action === "all" ? "Tüm action'lar" : action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={actorFilter} onValueChange={setActorFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Actor filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm actor'lar</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.user_id} value={user.user_id}>
                  {user.full_name ?? user.email ?? user.user_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={targetFilter} onValueChange={setTargetFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Target user filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm target user'lar</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.user_id} value={user.user_id}>
                  {user.full_name ?? user.email ?? user.user_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </AdminFilterBar>
      }
    >
      <div className="space-y-3">
        {filteredLogs.map((log) => (
          <div key={log.id} className="rounded-xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-medium">{log.action}</p>
                <p className="text-xs text-muted-foreground">Actor: {resolveUserLabel(log.actor_user_id)}</p>
                <p className="text-xs text-muted-foreground">Target: {resolveUserLabel(log.target_user_id)}</p>
                <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString("tr-TR")}</p>
              </div>
              <div className="grid flex-1 gap-3 md:grid-cols-2">
                <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
                  {JSON.stringify(log.before_value ?? {}, null, 2)}
                </pre>
                <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
                  {JSON.stringify(log.after_value ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        ))}

        {filteredLogs.length === 0 ? (
          <AdminEmptyState
            icon={ScrollText}
            title="Audit log bulunamadı"
            description="Filtreye uygun audit log bulunamadı."
          />
        ) : null}
      </div>
    </AdminPageShell>
  );
};

export default AdminAuditLogsPage;
