import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type ConnectionStatus = "pending" | "accepted" | "declined" | "blocked";

export interface ConnectionRow {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: ConnectionStatus;
  block_reason: string | null;
  created_at: string;
  decided_at: string | null;
}

export const BLOCK_REASONS = [
  "Spam / istenmeyen içerik",
  "Taciz / saldırgan davranış",
  "Sahte/yanıltıcı profil",
  "Uygunsuz teklif",
  "Kişisel — paylaşmak istemiyorum",
  "Diğer",
];

export function useConnections() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [rows, setRows] = useState<ConnectionRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setRows([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("user_connections")
      .select("*")
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    if (!error && data) setRows(data as ConnectionRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Find row between current user and other (in either direction). */
  const findWith = useCallback(
    (otherId: string) =>
      rows.find(
        (r) =>
          (r.requester_id === user?.id && r.recipient_id === otherId) ||
          (r.recipient_id === user?.id && r.requester_id === otherId)
      ) ?? null,
    [rows, user]
  );

  const statusWith = useCallback(
    (otherId: string): ConnectionStatus | "none" => findWith(otherId)?.status ?? "none",
    [findWith]
  );

  /** Whether messaging is allowed (mutual permission). */
  const canMessage = useCallback(
    (otherId: string) => {
      const r = findWith(otherId);
      return !!r && r.status === "accepted";
    },
    [findWith]
  );

  const isBlockedByMe = useCallback(
    (otherId: string) => {
      const r = findWith(otherId);
      return !!r && r.status === "blocked" && r.recipient_id === user?.id;
    },
    [findWith, user]
  );

  const requestConnection = useCallback(
    async (otherId: string, otherName?: string) => {
      if (!user) {
        toast({ title: "Giriş gerekli", description: "Bağlantı kurmak için giriş yap.", variant: "destructive" });
        navigate("/auth");
        return false;
      }
      if (otherId === user.id) return false;
      const existing = findWith(otherId);
      if (existing) {
        toast({
          title: existing.status === "pending" ? "İstek zaten beklemede" : "Zaten bağlantı var",
          description: existing.status === "accepted" ? "Mesaj gönderebilirsin." : undefined,
        });
        return true;
      }
      const { error } = await supabase
        .from("user_connections")
        .insert({ requester_id: user.id, recipient_id: otherId, status: "pending" });
      if (error) {
        toast({ title: "İstek gönderilemedi", description: error.message, variant: "destructive" });
        return false;
      }
      toast({ title: "Bağlantı isteği gönderildi 🤝", description: `${otherName ?? "Karşı taraf"} onayladığında mesaj atabilirsin.` });
      await refresh();
      return true;
    },
    [user, toast, navigate, findWith, refresh]
  );

  const decide = useCallback(
    async (rowId: string, status: "accepted" | "declined") => {
      const { error } = await supabase
        .from("user_connections")
        .update({ status, decided_at: new Date().toISOString() })
        .eq("id", rowId);
      if (error) {
        toast({ title: "Güncellenemedi", description: error.message, variant: "destructive" });
        return false;
      }
      toast({
        title: status === "accepted" ? "Bağlantı kabul edildi ✅" : "Bağlantı reddedildi",
      });
      await refresh();
      return true;
    },
    [toast, refresh]
  );

  const block = useCallback(
    async (otherId: string, reason: string) => {
      if (!user) return false;
      const existing = findWith(otherId);
      if (existing) {
        const { error } = await supabase
          .from("user_connections")
          .update({ status: "blocked", block_reason: reason, decided_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) {
          toast({ title: "Bloklanamadı", description: error.message, variant: "destructive" });
          return false;
        }
      } else {
        const { error } = await supabase
          .from("user_connections")
          .insert({ requester_id: user.id, recipient_id: otherId, status: "blocked", block_reason: reason });
        if (error) {
          toast({ title: "Bloklanamadı", description: error.message, variant: "destructive" });
          return false;
        }
      }
      toast({ title: "Kullanıcı bloklandı", description: "Artık seni takip edemez ve mesaj atamaz." });
      await refresh();
      return true;
    },
    [user, findWith, refresh, toast]
  );

  const unblock = useCallback(
    async (rowId: string) => {
      const { error } = await supabase.from("user_connections").delete().eq("id", rowId);
      if (error) {
        toast({ title: "Kaldırılamadı", description: error.message, variant: "destructive" });
        return false;
      }
      toast({ title: "Blok kaldırıldı" });
      await refresh();
      return true;
    },
    [toast, refresh]
  );

  // Derived collections
  const incomingPending = rows.filter((r) => r.recipient_id === user?.id && r.status === "pending");
  const acceptedConnections = rows.filter((r) => r.status === "accepted");
  const blockedByMe = rows.filter((r) => r.status === "blocked" && r.recipient_id !== user?.id ? false : r.status === "blocked");

  return {
    rows,
    loading,
    refresh,
    statusWith,
    canMessage,
    isBlockedByMe,
    requestConnection,
    decide,
    block,
    unblock,
    incomingPending,
    acceptedConnections,
    blockedByMe,
    connectionsCount: acceptedConnections.length,
  };
}
