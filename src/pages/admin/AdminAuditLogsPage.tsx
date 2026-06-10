import { useMemo, useState } from "react";
import { ScrollText } from "lucide-react";

import {
  AdminEmptyState,
  AdminErrorState,
  AdminFilterBar,
  AdminLoadingState,
  AdminPageShell,
} from "@/components/admin/page";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminAuditLogs } from "@/hooks/admin/useAdminAuditLogs";
import { resolveAdminUserLabel } from "@/lib/admin-shell/admin-user-labels";

const AdminAuditLogsPage = () => {
  const { data, isLoading, error, refetch } = useAdminAuditLogs();
  const [actionFilter, setActionFilter] = useState("all");
  const [actorFilter, setActorFilter] = useState("all");
  const [targetFilter, setTargetFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  const logs = useMemo(() => data?.logs ?? [], [data]);
  const users = data?.users ?? [];

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
      {isLoading ? <AdminLoadingState label="Audit log verisi yükleniyor..." /> : null}

      {error ? (
        <AdminErrorState
          title="Audit log verisi alınamadı"
          description={error instanceof Error ? error.message : "Bilinmeyen hata"}
          onRetry={() => void refetch()}
        />
      ) : null}

      {!isLoading && !error ? (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div key={log.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{log.action}</p>
                  <p className="text-xs text-muted-foreground">Actor: {resolveAdminUserLabel(users, log.actor_user_id)}</p>
                  <p className="text-xs text-muted-foreground">Target: {resolveAdminUserLabel(users, log.target_user_id)}</p>
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
      ) : null}
    </AdminPageShell>
  );
};

export default AdminAuditLogsPage;
