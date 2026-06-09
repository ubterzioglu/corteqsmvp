import { useEffect, useMemo, useState } from "react";
import { MessageSquare, Inbox, Send, Mail, MailOpen, RefreshCcw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type DirectMessage = Tables<"direct_messages">;
type UserProfile = { user_id: string; full_name: string | null; email: string | null };

type MessageWithDisplay = DirectMessage & {
  counterpartId: string;
  counterpartName: string;
};

const fmtAgo = (d: string) => {
  try {
    return formatDistanceToNow(new Date(d), { addSuffix: true, locale: tr });
  } catch {
    return "";
  }
};

const MessagesInbox = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inbox, setInbox] = useState<DirectMessage[]>([]);
  const [sent, setSent] = useState<DirectMessage[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);

    const [recv, sentRes] = await Promise.all([
      supabase
        .from("direct_messages")
        .select("id, sender_id, recipient_id, content, created_at, read_at")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("direct_messages")
        .select("id, sender_id, recipient_id, content, created_at, read_at")
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    if (recv.error || sentRes.error) {
      toast({
        title: "Mesajlar yüklenemedi",
        description: recv.error?.message ?? sentRes.error?.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const inboxRows = recv.data ?? [];
    const sentRows = sentRes.data ?? [];
    setInbox(inboxRows);
    setSent(sentRows);

    const counterpartIds = Array.from(
      new Set(
        [...inboxRows.map((message) => message.sender_id), ...sentRows.map((message) => message.recipient_id)].filter(
          Boolean,
        ),
      ),
    );

    if (counterpartIds.length === 0) {
      setProfileMap({});
      setLoading(false);
      return;
    }

    const attrsData = await supabase
      .from("user_profile_attributes")
      .select("user_id, value_text, afs_attributes!inner(key)")
      .in("user_id", counterpartIds)
      .eq("afs_attributes.key", "full_name");
    const profilesError = attrsData.error;
    const nameByUser: Record<string, string | null> = {};
    for (const row of (attrsData.data ?? []) as any[]) {
      nameByUser[row.user_id] = row.value_text ?? null;
    }
    const profiles: UserProfile[] = counterpartIds.map((uid) => ({
      user_id: uid,
      full_name: nameByUser[uid] ?? null,
      email: null,
    }));

    if (profilesError) {
      toast({
        title: "Kullanıcı bilgileri yüklenemedi",
        description: profilesError.message,
        variant: "destructive",
      });
      setProfileMap({});
      setLoading(false);
      return;
    }

    const nextMap = (profiles ?? []).reduce<Record<string, UserProfile>>((acc, profile) => {
      acc[profile.user_id] = profile;
      return acc;
    }, {});

    setProfileMap(nextMap);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    if (!user) return;

    const channel = supabase
      .channel(`direct-messages-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, (payload) => {
        const message = payload.new as Partial<DirectMessage>;
        if (message.sender_id === user.id || message.recipient_id === user.id) {
          void load();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const markRead = async (message: DirectMessage) => {
    if (message.read_at || !user || message.recipient_id !== user.id) return;

    const readAt = new Date().toISOString();
    const { error } = await supabase
      .from("direct_messages")
      .update({ read_at: readAt })
      .eq("id", message.id)
      .eq("recipient_id", user.id);

    if (error) {
      toast({ title: "Mesaj okundu işaretlenemedi", description: error.message, variant: "destructive" });
      return;
    }

    setInbox((prev) => prev.map((item) => (item.id === message.id ? { ...item, read_at: readAt } : item)));
  };

  const reply = async (original: MessageWithDisplay) => {
    if (!user) return;

    const content = replyText.trim();
    if (!content) return;

    setSending(true);

    const payload: TablesInsert<"direct_messages"> = {
      sender_id: user.id,
      recipient_id: original.sender_id === user.id ? original.recipient_id : original.sender_id,
      content,
    };

    const { error } = await supabase.from("direct_messages").insert(payload);

    setSending(false);

    if (error) {
      toast({ title: "Cevap gönderilemedi", description: error.message, variant: "destructive" });
      return;
    }

    setReplyText("");
    toast({ title: "Cevap gönderildi" });
    void load();
  };

  const inboxWithDisplay = useMemo<MessageWithDisplay[]>(
    () =>
      inbox.map((message) => ({
        ...message,
        counterpartId: message.sender_id,
        counterpartName:
          profileMap[message.sender_id]?.full_name ?? profileMap[message.sender_id]?.email ?? "Kullanıcı",
      })),
    [inbox, profileMap],
  );

  const sentWithDisplay = useMemo<MessageWithDisplay[]>(
    () =>
      sent.map((message) => ({
        ...message,
        counterpartId: message.recipient_id,
        counterpartName:
          profileMap[message.recipient_id]?.full_name ?? profileMap[message.recipient_id]?.email ?? "Kullanıcı",
      })),
    [profileMap, sent],
  );

  const unreadCount = inboxWithDisplay.filter((message) => !message.read_at).length;
  const active = inboxWithDisplay.find((message) => message.id === activeId) ?? sentWithDisplay.find((message) => message.id === activeId);

  if (!user) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card text-center">
        <p className="text-sm text-muted-foreground font-body">Mesaj kutunu görmek için giriş yapmalısın.</p>
      </div>
    );
  }

  const renderList = (items: MessageWithDisplay[], emptyLabel: string, kind: "inbox" | "sent") => (
    <div className="divide-y divide-border max-h-[480px] overflow-y-auto">
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground font-body py-10 text-center">{emptyLabel}</p>
      )}
      {items.map((message) => {
        const isActive = activeId === message.id;
        const unread = kind === "inbox" && !message.read_at;

        return (
          <button
            key={message.id}
            onClick={() => {
              setActiveId(message.id);
              if (kind === "inbox") {
                void markRead(message);
              }
            }}
            className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${isActive ? "bg-muted/60" : ""}`}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 min-w-0">
                {unread ? (
                  <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                ) : (
                  <MailOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                <span className={`text-sm truncate ${unread ? "font-bold text-foreground" : "text-foreground"}`}>
                  {message.counterpartName}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{fmtAgo(message.created_at)}</span>
            </div>
            <p className="text-xs text-muted-foreground font-body truncate">{message.content}</p>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Mesaj Kutusu</h2>
          {unreadCount > 0 && <Badge className="bg-primary text-primary-foreground">{unreadCount} yeni</Badge>}
        </div>
        <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading} className="gap-1">
          <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Yenile
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5">
        <div className="md:col-span-2 border-r border-border">
          <Tabs defaultValue="inbox" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-2">
              <TabsTrigger value="inbox" className="gap-1.5">
                <Inbox className="h-3.5 w-3.5" /> Gelen ({inboxWithDisplay.length})
              </TabsTrigger>
              <TabsTrigger value="sent" className="gap-1.5">
                <Send className="h-3.5 w-3.5" /> Gönderilen ({sentWithDisplay.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="inbox" className="m-0">
              {renderList(inboxWithDisplay, "Henüz mesaj yok.", "inbox")}
            </TabsContent>
            <TabsContent value="sent" className="m-0">
              {renderList(sentWithDisplay, "Henüz mesaj göndermedin.", "sent")}
            </TabsContent>
          </Tabs>
        </div>

        <div className="md:col-span-3 p-4 min-h-[300px]">
          {!active ? (
            <div className="h-full flex items-center justify-center text-center text-sm text-muted-foreground font-body py-10">
              Sol taraftan bir mesaj seç.
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="mb-3 pb-3 border-b border-border">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{active.sender_id === user.id ? "Gönderilen" : "Gelen"}</Badge>
                  <span className="text-xs text-muted-foreground">{fmtAgo(active.created_at)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {active.sender_id === user.id ? `Kime: ${active.counterpartName}` : `Kimden: ${active.counterpartName}`}
                </p>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap font-body flex-1">{active.content}</p>
              {active.recipient_id === user.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <Textarea
                    placeholder="Cevabını yaz..."
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => void reply(active)} disabled={!replyText.trim() || sending} className="gap-1.5">
                      <Send className="h-3.5 w-3.5" /> {sending ? "..." : "Cevap Gönder"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesInbox;
