import { useEffect, useMemo, useState } from "react";
import { StickyNote, BarChart3, Music, Plus, Pin, Star, Trash2, Crown, Lock, Play, Pause, X, Settings2, ExternalLink, Coffee, QrCode } from "lucide-react";
import jukeboxImg from "@/assets/jukebox.png";
import coffeeCupImg from "@/assets/coffee-cup.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

interface Props {
  cafeId: string;
  isOwner: boolean;
  isMember: boolean;
  cafeName?: string;
}

/* -------- types -------- */
interface PostIt {
  id: string;
  author: string;
  text: string;
  color: string;
  pinned?: boolean;
  highlighted?: boolean;
  approved?: boolean;
  rot: number;
}
interface Poll {
  id: string;
  question: string;
  options: { id: string; label: string; votes: number }[];
  pinned?: boolean;
  highlighted?: boolean;
  approved?: boolean;
}
interface Track {
  id: string;
  title: string;
  artist: string;
  url?: string;
  provider: "spotify" | "youtube" | "custom";
}

const NOTE_COLORS = [
  "bg-yellow-200 text-yellow-950",
  "bg-pink-200 text-pink-950",
  "bg-emerald-200 text-emerald-950",
  "bg-sky-200 text-sky-950",
  "bg-orange-200 text-orange-950",
  "bg-violet-200 text-violet-950",
];

/* -------- storage helpers -------- */
const lsKey = (cafeId: string, k: string) => `cafe:${cafeId}:${k}`;
const load = <T,>(cafeId: string, k: string, fallback: T): T => {
  try { const v = localStorage.getItem(lsKey(cafeId, k)); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const save = (cafeId: string, k: string, v: unknown) => {
  try { localStorage.setItem(lsKey(cafeId, k), JSON.stringify(v)); } catch {}
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const CafeAmbiance = ({ cafeId, isOwner, isMember, cafeName }: Props) => {
  const [notes, setNotes] = useState<PostIt[]>(() => load(cafeId, "notes", DEMO_NOTES));
  const [polls, setPolls] = useState<Poll[]>(() => load(cafeId, "polls", DEMO_POLLS));
  const [tracks, setTracks] = useState<Track[]>(() => load(cafeId, "tracks", DEMO_TRACKS));
  const [votes, setVotes] = useState<Record<string, string>>(() => load(cafeId, "votes", {}));

  useEffect(() => save(cafeId, "notes", notes), [cafeId, notes]);
  useEffect(() => save(cafeId, "polls", polls), [cafeId, polls]);
  useEffect(() => save(cafeId, "tracks", tracks), [cafeId, tracks]);
  useEffect(() => save(cafeId, "votes", votes), [cafeId, votes]);

  const [zoom, setZoom] = useState<{ kind: "note" | "poll"; id: string } | null>(null);
  const [jukeOpen, setJukeOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [coffeeOpen, setCoffeeOpen] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  /* notes actions */
  const addNote = (text: string, author: string) => {
    if (!text.trim()) return;
    const note: PostIt = {
      id: crypto.randomUUID(),
      author: author || "Misafir",
      text: text.trim(),
      color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
      rot: Math.random() * 6 - 3,
      approved: isOwner, // owner posts auto-approved, others need approval
    };
    setNotes((p) => [note, ...p]);
    toast({ title: isOwner ? "Post-it eklendi" : "Post-it admin onayına gönderildi 📌" });
  };
  const updateNote = (id: string, patch: Partial<PostIt>) => setNotes((p) => p.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  const removeNote = (id: string) => setNotes((p) => p.filter((n) => n.id !== id));

  /* poll actions */
  const addPoll = (q: string, opts: string[]) => {
    const valid = opts.map((s) => s.trim()).filter(Boolean);
    if (!q.trim() || valid.length < 2) return;
    const poll: Poll = {
      id: crypto.randomUUID(),
      question: q.trim(),
      options: valid.map((label) => ({ id: crypto.randomUUID(), label, votes: 0 })),
      approved: isOwner,
    };
    setPolls((p) => [poll, ...p]);
    toast({ title: isOwner ? "Anket yayında" : "Anket admin onayına gönderildi 📊" });
  };
  const vote = (pollId: string, optId: string) => {
    if (votes[pollId]) {
      toast({ title: "Zaten oy verdin", variant: "destructive" });
      return;
    }
    setPolls((p) =>
      p.map((pl) =>
        pl.id === pollId ? { ...pl, options: pl.options.map((o) => (o.id === optId ? { ...o, votes: o.votes + 1 } : o)) } : pl,
      ),
    );
    setVotes((v) => ({ ...v, [pollId]: optId }));
  };
  const updatePoll = (id: string, patch: Partial<Poll>) => setPolls((p) => p.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  const removePoll = (id: string) => setPolls((p) => p.filter((n) => n.id !== id));

  /* tracks */
  const addTrack = (t: Omit<Track, "id">) => setTracks((p) => [...p, { ...t, id: crypto.randomUUID() }]);
  const removeTrack = (id: string) => setTracks((p) => p.filter((t) => t.id !== id));

  /* derived */
  const visibleNotes = useMemo(() => notes.filter((n) => n.approved !== false).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned)), [notes]);
  const visiblePolls = useMemo(() => polls.filter((n) => n.approved !== false).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned)), [polls]);
  const pendingCount = notes.filter((n) => n.approved === false).length + polls.filter((n) => n.approved === false).length;

  const zoomedNote = zoom?.kind === "note" ? notes.find((n) => n.id === zoom.id) : null;
  const zoomedPoll = zoom?.kind === "poll" ? polls.find((n) => n.id === zoom.id) : null;

  return (
    <section className="relative mb-3 rounded-xl border border-border bg-gradient-to-br from-amber-50/60 to-rose-50/40 dark:from-amber-500/5 dark:to-rose-500/5 p-2.5 pb-4">
      {/* Header row — Post-it Yapıştır artık absolute olarak ortada üstte duruyor */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            ☕ Cafe Köşesi
          </span>
          <span className="text-[10px] text-muted-foreground">Post-it · Anket · Juke Box</span>
        </div>
        {isOwner && (
          <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px] relative" onClick={() => setAdminOpen(true)}>
            <Settings2 className="h-3 w-3" /> Mini Admin
            {pendingCount > 0 && (
              <Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] p-0 px-1 text-[9px] bg-rose-500">{pendingCount}</Badge>
            )}
          </Button>
        )}
      </div>

      {/* "Post-it Yapıştır" — header üstünde absolute, boşluk kazandırır */}
      {isMember && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
          <PostItComposer onAdd={addNote} />
        </div>
      )}

      {/* 3-column layout: post-its | jukebox center | polls */}
      <div className="grid grid-cols-12 gap-3 items-start">
        {/* POST-ITS — LEFT */}
        <div className="col-span-12 lg:col-span-5 order-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300 mb-1">
            <StickyNote className="h-3.5 w-3.5" /> Post-it'ler
          </div>
          <div className="min-h-[180px] rounded-xl bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.08)_1px,transparent_0)] [background-size:14px_14px] p-2 flex flex-wrap gap-2 items-start">
            {visibleNotes.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setZoom({ kind: "note", id: n.id })}
                className={`relative w-[96px] h-[96px] ${n.color} rounded-sm shadow-md hover:shadow-xl transition-all duration-200 hover:scale-110 hover:z-10 p-2 text-left flex flex-col ${n.highlighted ? "ring-2 ring-amber-500 ring-offset-2" : ""}`}
                style={{ transform: `rotate(${n.rot}deg)` }}
              >
                <Pin className={`absolute -top-1.5 left-1/2 -translate-x-1/2 h-4 w-4 ${n.pinned ? "text-rose-600 fill-rose-600" : "text-stone-500/70 fill-stone-400/70"}`} />
                {n.highlighted && <Star className="absolute top-1 right-1 h-3 w-3 text-amber-700 fill-amber-500" />}
                <p className="text-[10px] font-medium leading-tight flex-1 overflow-hidden line-clamp-4">{n.text}</p>
                <span className="text-[8px] opacity-70 mt-1">— {n.author}</span>
              </button>
            ))}
            {visibleNotes.length === 0 && (
              <div className="w-full text-center py-6 text-[11px] text-muted-foreground">Henüz post-it yok 📌</div>
            )}
          </div>
        </div>

        {/* JUKEBOX — CENTER (25% büyütüldü) */}
        <div className="col-span-12 lg:col-span-2 order-2 flex flex-col items-center justify-start -mt-1">
          <div className="text-[11px] font-semibold text-violet-700 dark:text-violet-300 mb-1 flex items-center gap-1">
            <Music className="h-3.5 w-3.5" /> Juke Box
          </div>
          <button
            type="button"
            onClick={() => setJukeOpen(true)}
            className="group relative transition-transform duration-300 hover:scale-105 active:scale-95"
            aria-label="Juke Box'u aç"
          >
            <img
              src={jukeboxImg}
              alt="Cafe Juke Box"
              className="h-[184px] w-auto drop-shadow-[0_8px_20px_rgba(236,72,153,0.35)] group-hover:drop-shadow-[0_12px_28px_rgba(236,72,153,0.6)] transition-all"
            />
            <Badge className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[9px] px-1.5 py-0 shadow-lg">
              {tracks.length} parça
            </Badge>
          </button>
          <span className="text-[9px] text-muted-foreground mt-1.5 text-center">Tıkla, çalma listesini aç 🎶</span>
          <MusicPromptPostIt cafeId={cafeId} isOwner={isOwner} />
        </div>


        {/* POLLS — RIGHT */}
        <div className="col-span-12 lg:col-span-5 order-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-700 dark:text-sky-300">
              <BarChart3 className="h-3.5 w-3.5" /> Anketler
            </span>
          </div>
          <div className="min-h-[200px] rounded-xl bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.08)_1px,transparent_0)] [background-size:14px_14px] p-2 flex flex-wrap gap-2 items-start">
            {isMember && (
              <PollComposer
                onAdd={addPoll}
                trigger={
                  <button
                    type="button"
                    className="relative w-[96px] h-[96px] rounded-sm border-2 border-dashed border-sky-400/70 bg-sky-50/60 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-all duration-200 hover:scale-110 hover:z-10 flex flex-col items-center justify-center gap-1 text-sky-700 dark:text-sky-300 shadow-sm hover:shadow-xl"
                    style={{ transform: "rotate(-1.5deg)" }}
                  >
                    <Pin className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-4 w-4 text-sky-500 fill-sky-500" />
                    <BarChart3 className="h-5 w-5" />
                    <span className="text-[10px] font-bold">Anket Aç</span>
                    <span className="text-[8px] opacity-70">tıkla →</span>
                  </button>
                }
              />
            )}
            {visiblePolls.map((pl) => {
              const total = pl.options.reduce((a, o) => a + o.votes, 0) || 1;
              const rot = ((pl.id.charCodeAt(0) % 7) - 3) * 0.8;
              return (
                <button
                  key={pl.id}
                  type="button"
                  onClick={() => setZoom({ kind: "poll", id: pl.id })}
                  className={`relative w-[154px] h-[96px] rounded-sm shadow-md hover:shadow-xl transition-all duration-200 hover:scale-110 hover:z-10 p-2 text-left flex flex-col bg-sky-100 dark:bg-sky-500/20 ${pl.highlighted ? "ring-2 ring-amber-500 ring-offset-1" : ""}`}
                  style={{ transform: `rotate(${rot}deg)` }}
                >
                  <Pin className={`absolute -top-1.5 left-1/2 -translate-x-1/2 h-4 w-4 ${pl.pinned ? "text-rose-600 fill-rose-600" : "text-sky-600 fill-sky-500"}`} />
                  {pl.highlighted && <Star className="absolute top-1 right-1 h-3 w-3 text-amber-700 fill-amber-500" />}
                  <div className="flex items-center gap-1 mb-1">
                    <BarChart3 className="h-2.5 w-2.5 text-sky-700 shrink-0" />
                    <p className="text-[10px] font-bold leading-tight line-clamp-2 text-sky-950 dark:text-sky-100">{pl.question}</p>
                  </div>
                  <div className="space-y-0.5 flex-1 overflow-hidden">
                    {pl.options.slice(0, 3).map((o) => {
                      const pct = Math.round((o.votes / total) * 100);
                      return (
                        <div key={o.id} className="relative h-2.5 rounded-sm bg-white/60 dark:bg-black/20 overflow-hidden">
                          <div className="absolute inset-y-0 left-0 bg-sky-500/60" style={{ width: `${pct}%` }} />
                          <div className="relative px-1 flex items-center justify-between h-full text-[7px] font-semibold text-sky-950 dark:text-sky-50">
                            <span className="truncate">{o.label}</span>
                            <span>{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-[7px] opacity-70 mt-0.5 text-sky-900 dark:text-sky-200">{pl.options.reduce((a,o)=>a+o.votes,0)} oy</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SPONSOR COFFEE — bottom right */}
      <button
        type="button"
        onClick={() => setCoffeeOpen(true)}
        className="absolute bottom-2 right-2 group flex items-end gap-1.5 hover:scale-110 active:scale-95 transition-transform z-20"
        aria-label="Sponsor kahve give-away"
      >
        <div className="hidden sm:flex flex-col items-end mb-1">
          <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/15 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Sponsor · Bedava ☕</span>
          <span className="text-[8px] text-muted-foreground mt-0.5">QR için tıkla</span>
        </div>
        <img
          src={coffeeCupImg}
          alt="Sponsor Starbucks kahve give-away"
          className="h-16 w-auto drop-shadow-[0_6px_14px_rgba(0,100,40,0.35)] group-hover:drop-shadow-[0_10px_22px_rgba(0,150,60,0.55)] transition-all"
        />
      </button>

      {/* ============ COFFEE QR DIALOG ============ */}
      <Dialog open={coffeeOpen} onOpenChange={setCoffeeOpen}>
        <DialogContent className="max-w-sm p-0 overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-emerald-950/40 dark:via-background dark:to-emerald-950/30 border-emerald-500/30">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600" />
          <div className="p-5 pt-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Coffee className="h-5 w-5 text-emerald-700" />
                <span>CorteQS × Sponsor Give-away</span>
              </DialogTitle>
            </DialogHeader>
            <div className="mt-3 flex flex-col items-center text-center">
              <div className="relative">
                <img src={coffeeCupImg} alt="Starbucks coffee cup" className="h-44 w-auto drop-shadow-xl" />
                {/* QR overlay on cup */}
                <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1.5 rounded-md shadow-lg border-2 border-emerald-600 rotate-[-4deg]">
                  <div className="h-20 w-20 grid grid-cols-8 grid-rows-8 gap-[1px] bg-white">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div
                        key={i}
                        className={`${[0,1,2,5,6,7,8,10,13,15,16,18,19,21,23,24,27,28,30,31,32,34,37,40,42,45,47,48,49,52,54,55,56,57,58,61,62,63].includes(i) ? "bg-black" : "bg-white"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 mt-3">
                Kahveniz bizden ☕
              </p>
              <p className="text-[12px] text-muted-foreground leading-relaxed mt-1.5 max-w-[280px]">
                Kahvenizi <strong>ülkenizdeki bir şubemizden</strong> bu QR kodumuzu göstererek alabilirsiniz.
              </p>
              <div className="mt-3 flex items-center gap-2 text-[10px]">
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 gap-1">
                  <QrCode className="h-3 w-3" /> Tek kullanımlık
                </Badge>
                <Badge variant="secondary" className="text-emerald-700 dark:text-emerald-300">
                  Powered by CorteQS Cadde
                </Badge>
              </div>
              <p className="text-[9px] text-muted-foreground mt-3">
                Sponsorlu içerik · Şubede ID doğrulaması yapılabilir.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============ ZOOM DIALOG (note) ============ */}
      <Dialog open={!!zoomedNote} onOpenChange={(o) => !o && setZoom(null)}>
        <DialogContent className="max-w-md p-0 bg-transparent border-0 shadow-none">
          {zoomedNote && (
            <div className={`${zoomedNote.color} rounded-md shadow-2xl p-6 animate-in zoom-in-95 duration-300 relative`}>
              <Pin className="absolute -top-3 left-1/2 -translate-x-1/2 h-7 w-7 text-rose-600 fill-rose-600 drop-shadow" />
              <button onClick={() => setZoom(null)} className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10">
                <X className="h-4 w-4" />
              </button>
              <p className="text-lg font-medium leading-relaxed whitespace-pre-wrap">{zoomedNote.text}</p>
              <p className="text-xs opacity-70 mt-4">— {zoomedNote.author}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ============ ZOOM DIALOG (poll) ============ */}
      <Dialog open={!!zoomedPoll} onOpenChange={(o) => !o && setZoom(null)}>
        <DialogContent className="max-w-md animate-in zoom-in-95 duration-300">
          {zoomedPoll && (() => {
            const total = zoomedPoll.options.reduce((a, o) => a + o.votes, 0) || 1;
            const myVote = votes[zoomedPoll.id];
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-4 w-4 text-sky-500" /> {zoomedPoll.question}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  {zoomedPoll.options.map((o) => {
                    const pct = Math.round((o.votes / total) * 100);
                    const mine = myVote === o.id;
                    return (
                      <button
                        key={o.id}
                        disabled={!!myVote || !isMember}
                        onClick={() => vote(zoomedPoll.id, o.id)}
                        className={`w-full relative h-9 rounded-lg overflow-hidden text-left border transition-colors ${mine ? "border-sky-500" : "border-border hover:border-sky-300"} disabled:cursor-default`}
                      >
                        <div className={`absolute inset-y-0 left-0 ${mine ? "bg-sky-500/40" : "bg-sky-500/15"}`} style={{ width: `${pct}%` }} />
                        <div className="relative h-full flex items-center justify-between px-3 text-sm">
                          <span>{o.label}</span>
                          <span className="font-bold">{o.votes} ({pct}%)</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground text-center pt-1">
                  {!isMember ? "Oy vermek için cafe'ye katıl." : myVote ? "Oyun kaydedildi 🎉" : "Bir seçenek seç"}
                </p>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ============ JUKE BOX ============ */}
      <Dialog open={jukeOpen} onOpenChange={setJukeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Music className="h-5 w-5 text-violet-600" /> {cafeName || "Cafe"} · Juke Box
              <Badge variant="secondary" className="text-[10px]">Ücretsiz beta</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 p-3 text-[11px] text-muted-foreground">
            Şu an dinleme ücretsiz. İleride <strong>İşletmeler</strong> ve <strong>Premium son kullanıcılar</strong> kendi listelerini çalabilecek.
            İşletme sahipleri Spotify / YouTube listelerini import edebilir.
          </div>
          <div className="space-y-1.5 max-h-[225px] overflow-y-auto">
            {tracks.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground">Liste boş. Cafe sahibi parça ekleyebilir.</div>
            )}
            {tracks.map((t, i) => {
              const playing = playingId === t.id;
              return (
                <div key={t.id} className={`flex items-center gap-2 p-2 rounded-lg border ${playing ? "border-violet-500 bg-violet-500/10" : "border-border hover:bg-muted/50"}`}>
                  <button
                    onClick={() => setPlayingId(playing ? null : t.id)}
                    className="h-8 w-8 rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0 hover:scale-110 transition-transform"
                  >
                    {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
                  </button>
                  <span className="text-[10px] text-muted-foreground w-5">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{t.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{t.artist} · {t.provider}</p>
                  </div>
                  {t.url && (
                    <a href={t.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {isOwner && (
                    <button onClick={() => removeTrack(t.id)} className="text-rose-500 hover:text-rose-700 p-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {isOwner ? (
            <TrackImporter onAdd={addTrack} />
          ) : (
            <div className="rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-2.5 text-[11px] flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-amber-600" />
              <span>Parça eklemek için <strong>cafe sahibi</strong> olmalısın. (Premium kullanıcı yetkisi yakında)</span>
              <Badge variant="secondary" className="ml-auto gap-0.5"><Crown className="h-2.5 w-2.5" /> Pro</Badge>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ============ MINI ADMIN ============ */}
      {isOwner && (
        <Dialog open={adminOpen} onOpenChange={setAdminOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5" /> Cafe Mini Admin</DialogTitle>
            </DialogHeader>

            <div>
              <h3 className="text-xs font-bold mb-2 flex items-center gap-1.5"><StickyNote className="h-3.5 w-3.5 text-amber-600" /> Post-it'ler ({notes.length})</h3>
              <div className="space-y-1.5">
                {notes.map((n) => (
                  <div key={n.id} className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${n.approved === false ? "border-amber-500/50 bg-amber-500/5" : "border-border"}`}>
                    <span className={`inline-block w-3 h-3 rounded-sm ${n.color}`} />
                    <span className="flex-1 truncate">{n.text}</span>
                    <span className="text-[10px] text-muted-foreground">— {n.author}</span>
                    {n.approved === false && (
                      <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => updateNote(n.id, { approved: true })}>
                        İzin Ver
                      </Button>
                    )}
                    <ToggleIcon active={!!n.pinned} onClick={() => updateNote(n.id, { pinned: !n.pinned })} icon={<Pin className="h-3.5 w-3.5" />} title="Pin" />
                    <ToggleIcon active={!!n.highlighted} onClick={() => updateNote(n.id, { highlighted: !n.highlighted })} icon={<Star className="h-3.5 w-3.5" />} title="Vurgula" />
                    <button onClick={() => removeNote(n.id)} className="text-rose-500 hover:text-rose-700 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                {notes.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-2">Post-it yok</p>}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold mb-2 flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5 text-sky-600" /> Anketler ({polls.length})</h3>
              <div className="space-y-1.5">
                {polls.map((p) => (
                  <div key={p.id} className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${p.approved === false ? "border-amber-500/50 bg-amber-500/5" : "border-border"}`}>
                    <span className="flex-1 truncate">{p.question}</span>
                    <span className="text-[10px] text-muted-foreground">{p.options.length} sçnk</span>
                    {p.approved === false && (
                      <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => updatePoll(p.id, { approved: true })}>
                        İzin Ver
                      </Button>
                    )}
                    <ToggleIcon active={!!p.pinned} onClick={() => updatePoll(p.id, { pinned: !p.pinned })} icon={<Pin className="h-3.5 w-3.5" />} title="Pin" />
                    <ToggleIcon active={!!p.highlighted} onClick={() => updatePoll(p.id, { highlighted: !p.highlighted })} icon={<Star className="h-3.5 w-3.5" />} title="Vurgula" />
                    <button onClick={() => removePoll(p.id)} className="text-rose-500 hover:text-rose-700 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                {polls.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-2">Anket yok</p>}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold mb-2 flex items-center gap-1.5"><Music className="h-3.5 w-3.5 text-violet-600" /> Juke Box ({tracks.length})</h3>
              <TrackImporter onAdd={addTrack} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
};

/* ============ Sub-components ============ */
const ToggleIcon = ({ active, onClick, icon, title }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string }) => (
  <button title={title} onClick={onClick} className={`p-1 rounded ${active ? "text-amber-600 bg-amber-500/15" : "text-muted-foreground hover:bg-muted"}`}>
    {icon}
  </button>
);

const PostItComposer = ({ onAdd }: { onAdd: (text: string, author: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1"><Plus className="h-3 w-3" /> Post-it Yapıştır</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>📌 Post-it Yapıştır</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Adın</Label>
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Misafir" maxLength={30} />
          </div>
          <div>
            <Label className="text-xs">Mesaj</Label>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Cafe köşesine sempatik bir not bırak…" rows={4} maxLength={140} />
            <p className="text-[10px] text-muted-foreground mt-1">{text.length}/140 · onaylı girişli cafelerde sahibin onayı gerekir.</p>
          </div>
          <Button className="w-full" onClick={() => { onAdd(text, author); setText(""); setOpen(false); }} disabled={!text.trim()}>Yapıştır</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PollComposer = ({ onAdd, trigger }: { onAdd: (q: string, opts: string[]) => void; trigger?: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState<string[]>(["", ""]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1"><Plus className="h-3 w-3" /> Anket Aç</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>📊 Anket Aç</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Soru</Label>
            <Input value={q} onChange={(e) => setQ(e.target.value)} maxLength={120} placeholder="Bugün hangisini içelim?" />
          </div>
          {opts.map((o, i) => (
            <div key={i}>
              <Label className="text-xs">Seçenek {i + 1}</Label>
              <Input value={o} onChange={(e) => setOpts((p) => p.map((v, j) => (i === j ? e.target.value : v)))} maxLength={60} />
            </div>
          ))}
          {opts.length < 6 && (
            <Button size="sm" variant="outline" className="w-full" onClick={() => setOpts((p) => [...p, ""])}>+ Seçenek Ekle</Button>
          )}
          <Button className="w-full" onClick={() => { onAdd(q, opts); setQ(""); setOpts(["", ""]); setOpen(false); }} disabled={!q.trim() || opts.filter((o) => o.trim()).length < 2}>
            Yayınla
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const TrackImporter = ({ onAdd }: { onAdd: (t: Omit<Track, "id">) => void }) => {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [url, setUrl] = useState("");
  const [provider, setProvider] = useState<Track["provider"]>("spotify");
  const [importing, setImporting] = useState(false);
  const submit = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), artist: artist.trim() || "—", url: url.trim() || undefined, provider });
    setTitle(""); setArtist(""); setUrl("");
    toast({ title: "Parça eklendi 🎵" });
  };
  const importPlaylist = () => {
    if (!url.trim()) { toast({ title: "Önce Spotify / YouTube playlist URL'i gir", variant: "destructive" }); return; }
    setImporting(true);
    setTimeout(() => {
      ["Tutku — Sezen Aksu", "Ya Sen Ya Hiç — Teoman", "Olmaz Oğlum — Şebnem Ferah"].forEach((t) => {
        const [tt, aa] = t.split(" — ");
        onAdd({ title: tt, artist: aa, url, provider });
      });
      setImporting(false);
      setUrl("");
      toast({ title: "Playlist import edildi 🎉", description: "3 parça eklendi (demo)" });
    }, 800);
  };
  return (
    <div className="rounded-lg border border-border p-2.5 space-y-2 bg-card">
      <div className="flex items-center gap-2 text-[11px] font-semibold"><Music className="h-3.5 w-3.5 text-violet-600" /> Parça / Playlist Ekle</div>
      <div className="flex gap-1.5">
        {(["spotify", "youtube", "custom"] as const).map((p) => (
          <button key={p} onClick={() => setProvider(p)} className={`px-2 py-1 rounded text-[10px] font-semibold capitalize border ${provider === p ? "border-violet-500 bg-violet-500/10 text-violet-700" : "border-border"}`}>
            {p}
          </button>
        ))}
      </div>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Parça adı" className="h-8 text-xs" />
      <Input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Sanatçı" className="h-8 text-xs" />
      <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Spotify / YouTube URL (parça veya playlist)" className="h-8 text-xs" />
      <div className="flex gap-1.5">
        <Button size="sm" className="flex-1 h-7 text-[11px]" onClick={submit} disabled={!title.trim()}>Tek Parça Ekle</Button>
        <Button size="sm" variant="outline" className="flex-1 h-7 text-[11px]" onClick={importPlaylist} disabled={importing}>
          {importing ? "İçe aktarılıyor…" : "Playlist Import"}
        </Button>
      </div>
    </div>
  );
};

/* ============ Demo seed ============ */
const DEMO_NOTES: PostIt[] = [
  { id: "n1", author: "Elif", text: "Bugün espressolar bizden ☕✨", color: NOTE_COLORS[0], pinned: true, highlighted: true, approved: true, rot: -2 },
  { id: "n2", author: "Kerem", text: "React 19 hakkında konuşmak isteyen var mı?", color: NOTE_COLORS[3], approved: true, rot: 3 },
  { id: "n3", author: "Selin", text: "Berlin'den selamlar 👋", color: NOTE_COLORS[1], approved: true, rot: -1 },
];
const DEMO_POLLS: Poll[] = [
  {
    id: "p1",
    question: "Cafe müziği bugün ne olsun?",
    pinned: true,
    approved: true,
    options: [
      { id: "o1", label: "Lo-fi", votes: 12 },
      { id: "o2", label: "Türkçe Akustik", votes: 18 },
      { id: "o3", label: "Jazz", votes: 7 },
    ],
  },
];
const DEMO_TRACKS: Track[] = [
  { id: "t1", title: "Tutku", artist: "Sezen Aksu", provider: "spotify", url: "https://open.spotify.com" },
  { id: "t2", title: "Lo-fi Beats", artist: "Various", provider: "youtube", url: "https://youtube.com" },
  { id: "t3", title: "Blue in Green", artist: "Miles Davis", provider: "spotify" },
];

/* -------- Music Prompt Post-it (set in CreateCafeForm) -------- */
const MusicPromptPostIt = ({ cafeId, isOwner }: { cafeId: string; isOwner: boolean }) => {
  const storageKey = `cafe:${cafeId}:music_prompt`;
  const [prompt, setPrompt] = useState<string>(() => {
    try { return localStorage.getItem(storageKey) || ""; } catch { return ""; }
  });
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState(prompt);

  if (!prompt && !isOwner) return null;

  const save = () => {
    try { localStorage.setItem(storageKey, draft.trim()); } catch {}
    setPrompt(draft.trim());
    setEditOpen(false);
    toast({ title: "Cafe teması/anketi güncellendi 🎵" });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => isOwner ? setEditOpen(true) : undefined}
        className="mt-2 relative w-[120px] min-h-[72px] bg-pink-200 text-pink-950 rounded-sm shadow-md hover:shadow-xl transition-all p-2 text-left rotate-[-3deg] hover:rotate-0 hover:scale-105 cursor-pointer"
      >
        <Pin className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-4 w-4 text-rose-600 fill-rose-600" />
        <div className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-pink-900/80 mb-1">
          <Music className="h-2.5 w-2.5" /> Tema / Anket
        </div>
        {prompt ? (
          <p className="text-[10px] font-medium leading-tight line-clamp-4">{prompt}</p>
        ) : (
          <p className="text-[10px] italic opacity-70 leading-tight">Anket aç ya da temanı yaz — tıkla</p>
        )}
      </button>
      {isOwner && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Music className="h-4 w-4" /> Cafe Teması / Anketi</DialogTitle>
            </DialogHeader>
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              maxLength={180}
              placeholder="Cafe temanızı yazın veya bir anket sorusu girin."
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditOpen(false)}>İptal</Button>
              <Button size="sm" onClick={save}>Kaydet</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default CafeAmbiance;
