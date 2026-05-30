import { useEffect, useState } from "react";
import { MessageSquare, Inbox, Send, Mail, MailOpen, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_name: string | null;
  recipient_user_id: string | null;
  recipient_kind: string;
  recipient_slug: string | null;
  recipient_name: string | null;
  subject: string | null;
  body: string;
  context_url: string | null;
  is_read: boolean;
  created_at: string;
}

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
  const [inbox, setInbox] = useState<Message[]>([]);
  const [sent, setSent] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [recv, sentRes] = await Promise.all([
      supabase
        .from("messages")
        .select("*")
        .eq("recipient_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("messages")
        .select("*")
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
    setInbox((recv.data ?? []) as Message[]);
    setSent((sentRes.data ?? []) as Message[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!user) return;
    const channel = supabase
      .channel("messages-inbox")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `recipient_user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const markRead = async (m: Message) => {
    if (m.is_read) return;
    await supabase.from("messages").update({ is_read: true }).eq("id", m.id);
    setInbox((prev) => prev.map((x) => (x.id === m.id ? { ...x, is_read: true } : x)));
  };

  const reply = async (original: Message) => {
    if (!user) return;
    const text = replyText.trim();
    if (!text) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      thread_id: original.thread_id,
      sender_id: user.id,
      recipient_user_id: original.sender_id,
      recipient_kind: "individual",
      recipient_name: original.sender_name ?? "Kullanıcı",
      subject: original.subject ? `Re: ${original.subject}` : null,
      body: text,
    });
    setSending(false);
    if (error) {
      toast({ title: "Cevap gönderilemedi", description: error.message, variant: "destructive" });
      return;
    }
    setReplyText("");
    toast({ title: "Cevap gönderildi" });
    load();
  };

  const unreadCount = inbox.filter((m) => !m.is_read).length;
  const active = inbox.find((m) => m.id === activeId) ?? sent.find((m) => m.id === activeId);

  if (!user) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card text-center">
        <p className="text-sm text-muted-foreground font-body">Mesaj kutunu görmek için giriş yapmalısın.</p>
      </div>
    );
  }

  const renderList = (items: Message[], emptyLabel: string, kind: "inbox" | "sent") => (
    <div className="divide-y divide-border max-h-[480px] overflow-y-auto">
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground font-body py-10 text-center">{emptyLabel}</p>
      )}
      {items.map((m) => {
        const counterpart = kind === "inbox" ? m.sender_name ?? "Kullanıcı" : m.recipient_name ?? "Alıcı";
        const isActive = activeId === m.id;
        const unread = kind === "inbox" && !m.is_read;
        return (
          <button
            key={m.id}
            onClick={() => {
              setActiveId(m.id);
              if (kind === "inbox") markRead(m);
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
                  {counterpart}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{fmtAgo(m.created_at)}</span>
            </div>
            {m.subject && (
              <p className={`text-xs truncate ${unread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                {m.subject}
              </p>
            )}
            <p className="text-xs text-muted-foreground font-body truncate">{m.body}</p>
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
          {unreadCount > 0 && (
            <Badge className="bg-primary text-primary-foreground">{unreadCount} yeni</Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="gap-1">
          <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Yenile
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5">
        <div className="md:col-span-2 border-r border-border">
          <Tabs defaultValue="inbox" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-2">
              <TabsTrigger value="inbox" className="gap-1.5">
                <Inbox className="h-3.5 w-3.5" /> Gelen ({inbox.length})
              </TabsTrigger>
              <TabsTrigger value="sent" className="gap-1.5">
                <Send className="h-3.5 w-3.5" /> Gönderilen ({sent.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="inbox" className="m-0">
              {renderList(inbox, "Henüz mesaj yok.", "inbox")}
            </TabsContent>
            <TabsContent value="sent" className="m-0">
              {renderList(sent, "Henüz mesaj göndermedin.", "sent")}
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
                  <Badge variant="secondary" className="capitalize">{active.recipient_kind}</Badge>
                  <span className="text-xs text-muted-foreground">{fmtAgo(active.created_at)}</span>
                </div>
                {active.subject && <h3 className="font-bold text-foreground mt-2">{active.subject}</h3>}
                <p className="text-xs text-muted-foreground mt-1">
                  {active.sender_id === user.id
                    ? `Kime: ${active.recipient_name ?? "—"}`
                    : `Kimden: ${active.sender_name ?? "Kullanıcı"}`}
                </p>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap font-body flex-1">{active.body}</p>
              {active.recipient_user_id === user.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <Textarea
                    placeholder="Cevabını yaz..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => reply(active)} disabled={!replyText.trim() || sending} className="gap-1.5">
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
