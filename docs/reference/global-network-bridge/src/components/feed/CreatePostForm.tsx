import { useState, useEffect, useRef, useMemo } from "react";
import { Send, MapPin, Info, ImagePlus, Video, X, Loader2, Globe, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { countryCities } from "@/data/countryCities";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { canPostCadde, canPostKopru, isTRResident } from "@/lib/caddeRules";

interface Props {
  onCreated: () => void;
  cafeId?: string;
  /** Active country selected from the feed filter — overrides profile country for the post. */
  activeCountry?: string | null;
  /** Active city selected from the feed filter (only used if it belongs to activeCountry). */
  activeCity?: string | null;
}

interface MediaItem { type: "image" | "video"; url: string; path: string }

const isTRPhone = (p?: string | null) => {
  if (!p) return false;
  const x = p.replace(/\s|-/g, "");
  return x.startsWith("+90") || x.startsWith("0090");
};

const CreatePostForm = ({ onCreated, cafeId, activeCountry, activeCity }: Props) => {
  const { user, accountType, profile } = useAuth();
  const isTR = isTRResident(profile);
  const allowedCadde = canPostCadde(profile);
  const allowedKopru = canPostKopru(profile);
  // Auto-lock to Köprü if user can only post there.
  useEffect(() => {
    if (allowedKopru && !allowedCadde) setKopruOnly(true);
  }, [allowedKopru, allowedCadde]);
  const [content, setContent] = useState("");
  const [profileCountry, setProfileCountry] = useState<string>("");
  const [profileCity, setProfileCity] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [kopruOnly, setKopruOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const vidInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("country, city")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setProfileCountry(data.country || "");
        setProfileCity(data.city || "");
      }
    })();
  }, [user]);

  // The country a user posts to: feed's active country (if non-TR) overrides profile country.
  // TR users are always locked to Türkiye unless they choose Köprü.
  const postCountry = useMemo(() => {
    if (kopruOnly) return "Köprü";
    if (isTR) return "Türkiye";
    return activeCountry || profileCountry || "";
  }, [kopruOnly, isTR, activeCountry, profileCountry]);

  const availableCities = useMemo(() => countryCities[postCountry] || [], [postCountry]);

  // Reset city when post country changes; if active city belongs to that country use it,
  // otherwise fall back to profile city when posting to profile country.
  useEffect(() => {
    if (kopruOnly) { setCity(""); return; }
    if (activeCity && availableCities.includes(activeCity)) {
      setCity(activeCity);
    } else if (postCountry === profileCountry && profileCity) {
      setCity(profileCity);
    } else {
      setCity("");
    }
  }, [postCountry, activeCity, profileCountry, profileCity, kopruOnly, availableCities]);

  const handleFiles = async (files: FileList | null, kind: "image" | "video") => {
    if (!files || !user) return;
    const arr = Array.from(files);
    const maxImg = 8 * 1024 * 1024;
    const maxVid = 80 * 1024 * 1024;
    setUploading(true);
    try {
      for (const f of arr) {
        if (kind === "image" && f.size > maxImg) {
          toast({ title: `${f.name} çok büyük (max 8MB)`, variant: "destructive" });
          continue;
        }
        if (kind === "video" && f.size > maxVid) {
          toast({ title: `${f.name} çok büyük (max 80MB)`, variant: "destructive" });
          continue;
        }
        const ext = f.name.split(".").pop() || (kind === "image" ? "jpg" : "mp4");
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from("post-archive").upload(path, f, { contentType: f.type });
        if (error) {
          toast({ title: "Yükleme başarısız", description: error.message, variant: "destructive" });
          continue;
        }
        const { data: pub } = supabase.storage.from("post-archive").getPublicUrl(path);
        setMedia((m) => [...m, { type: kind, url: pub.publicUrl, path }]);
      }
    } finally {
      setUploading(false);
      if (imgInputRef.current) imgInputRef.current.value = "";
      if (vidInputRef.current) vidInputRef.current.value = "";
    }
  };

  const removeMedia = async (idx: number) => {
    const item = media[idx];
    setMedia((m) => m.filter((_, i) => i !== idx));
    if (item) await supabase.storage.from("post-archive").remove([item.path]);
  };

  const submit = async () => {
    if (!user) {
      toast({ title: "Giriş yapmalısınız", variant: "destructive" });
      return;
    }
    if (!content.trim() && media.length === 0) return;

    if (!kopruOnly && !postCountry) {
      toast({
        title: "Önce ülke ayarla",
        description: "Profil ülken yok ve menüden de ülke seçilmemiş. Sol menüden bir ülke seç.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const firstImg = media.find((m) => m.type === "image");
    const { error } = await supabase.from("feed_posts").insert({
      user_id: user.id,
      content: content.trim(),
      country: postCountry || null,
      city: kopruOnly ? null : (city || null),
      author_role: accountType || "user",
      image_url: firstImg?.url || null,
      media: media.map(({ type, url }) => ({ type, url })) as any,
      ...(cafeId ? { cafe_id: cafeId } : {}),
    } as any);
    setSubmitting(false);

    if (error) {
      toast({ title: "Paylaşım eklenemedi", description: error.message, variant: "destructive" });
      return;
    }
    setContent("");
    setMedia([]);
    setKopruOnly(false);
    toast({ title: "Paylaşım yayınlandı", description: `@${kopruOnly ? "Köprü" : postCountry}${city ? " · @" + city : ""}` });
    onCreated();
  };

  if (!user) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground text-center">
        Feed'e paylaşım yapmak için giriş yapmalısınız.
      </div>
    );
  }

  const usingActive = !!activeCountry && activeCountry !== profileCountry && !isTR && !kopruOnly;

  // If user is not allowed to post anywhere, show a lock card.
  if (!allowedCadde && !allowedKopru) {
    return (
      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold mb-1">Cadde'de paylaşım yapmak için profilini tamamla</p>
            <p className="text-xs text-muted-foreground mb-3">
              Cadde paylaşımı için <strong>ülkeni</strong> ve <strong>telefon doğrulamanı</strong> tamamlamış olmalısın.
              TR kullanıcıysan paylaşımların <strong>@Türkiye</strong> caddesinde, yurt dışındaysan yaşadığın ülke caddesinde yayınlanır.
            </p>
            <Button asChild size="sm">
              <Link to="/profile?tab=settings">Profil ayarlarına git</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      {/* Cadde / Köprü seçici — yalnızca her ikisi de uygunsa görünür */}
      {allowedKopru && allowedCadde && (
        <div className="flex items-center gap-1 p-1 rounded-full bg-muted/60 w-fit text-[11px]">
          <button
            type="button"
            onClick={() => setKopruOnly(false)}
            className={`px-3 py-1 rounded-full font-semibold transition ${!kopruOnly ? "bg-card shadow text-foreground" : "text-muted-foreground"}`}
          >
            🛣️ Cadde
          </button>
          <button
            type="button"
            onClick={() => setKopruOnly(true)}
            className={`px-3 py-1 rounded-full font-semibold transition ${kopruOnly ? "bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 text-white" : "text-muted-foreground"}`}
          >
            🌉 Köprü
          </button>
        </div>
      )}
      

      <Textarea
        placeholder="Diaspora'ya bir şeyler paylaş..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className="resize-none"
      />

      {media.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {media.map((m, i) => (
            <div key={i} className="relative group">
              {m.type === "image" ? (
                <img src={m.url} alt="" className="h-20 w-20 object-cover rounded-lg ring-1 ring-border" />
              ) : (
                <video src={m.url} className="h-20 w-32 object-cover rounded-lg ring-1 ring-border bg-black" muted />
              )}
              <button
                type="button"
                onClick={() => removeMedia(i)}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow"
                aria-label="Kaldır"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Where this post will appear */}
      {kopruOnly ? (
        <div className="rounded-lg border border-rose-500/30 bg-gradient-to-r from-rose-500/5 via-amber-400/5 to-emerald-500/5 p-2.5 text-[11px] flex items-start gap-2">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-rose-500" />
          <span>
            <strong>🌉 Köprü</strong> — Paylaşımın TR–Diaspora ortak akışında ve Global akışta görünür.
          </span>
        </div>
      ) : isTR ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-2">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            Türkiye merkezli kullanıcı olarak paylaşımların <strong>@Türkiye caddesinde</strong> yayınlanır. Yüksek etkileşim alan paylaşımlar Global akışta da görünür.
          </span>
        </div>
      ) : (
        <div className={`rounded-lg border p-2.5 text-[11px] flex items-start gap-2 ${usingActive ? "border-primary/40 bg-primary/5" : "border-border bg-muted/30"}`}>
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
          <div className="flex-1 leading-snug">
            {postCountry === "Köprü" ? (
              <>Paylaşımın <strong>@Köprü</strong>'ye düşer ve Global akışta da <strong>@Köprü</strong> etiketiyle görünür.</>
            ) : (
              <>Paylaşımın <strong>@{postCountry || "—"}{city ? ` · @${city}` : ""}</strong> caddesine düşer ve Global akışta da ülke/şehir etiketiyle görünür.</>
            )}
            {usingActive && postCountry !== "Köprü" && (
              <span className="block mt-0.5 text-primary font-semibold">Sol menüden {activeCountry} seçtiğin için bu paylaşım orada yayınlanır.</span>
            )}
            {!activeCountry && profileCountry && (
              <span className="block mt-0.5 text-muted-foreground">Başka bir ülkede paylaşmak için sol menüden o ülkeyi seç. Aynı anda yalnız 1 ülkede yayın yapabilirsin.</span>
            )}
          </div>
        </div>
      )}

      {/* Optional city pick within the chosen country */}
      {!kopruOnly && !isTR && postCountry && availableCities.length > 0 && (
        <div className="flex items-center gap-2">
          <Select value={city || "__none"} onValueChange={(v) => setCity(v === "__none" ? "" : v)}>
            <SelectTrigger className="h-9 text-xs w-56">
              <MapPin className="h-3.5 w-3.5 text-turquoise mr-1" />
              <SelectValue placeholder={`@Şehir — ${postCountry}`} />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="__none">Sadece @{postCountry} (şehir yok)</SelectItem>
              {availableCities.map((c) => (
                <SelectItem key={c} value={c}>@{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <input ref={imgInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files, "image")} />
        <input ref={vidInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleFiles(e.target.files, "video")} />
        <Button type="button" variant="outline" size="sm" onClick={() => imgInputRef.current?.click()} disabled={uploading} className="h-9 gap-1.5">
          <ImagePlus className="h-4 w-4 text-emerald-500" /> Fotoğraf
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => vidInputRef.current?.click()} disabled={uploading} className="h-9 gap-1.5">
          <Video className="h-4 w-4 text-violet-500" /> Video
        </Button>
        {uploading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}

        {!kopruOnly && (
          <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold inline-flex items-center gap-1">
            <Globe className="h-3 w-3" /> @{postCountry || "—"}{city ? ` · @${city}` : ""}
          </span>
        )}
        {kopruOnly && (
          <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 text-white font-semibold">🌉 Köprü — TR↔Diaspora</span>
        )}
        <Button
          onClick={submit}
          disabled={submitting || uploading || (!content.trim() && media.length === 0)}
          className="ml-auto gap-1.5"
          size="sm"
        >
          <Send className="h-4 w-4" /> Paylaş
        </Button>
      </div>
    </div>
  );
};

export default CreatePostForm;
