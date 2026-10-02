import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Check, Copy, Download, Loader2, Medal, ShieldCheck, Trash2 } from "lucide-react";

import SearchableCitySelect from "@/components/SearchableCitySelect";
import SearchableCountrySelect from "@/components/SearchableCountrySelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MOTOR_CATEGORIES } from "@/lib/group-submit";
import {
  downloadBadgeSvg,
  fetchOwnerPanelState,
  ownerRenew,
  ownerUpdate,
  requestGroupRemoval,
  reviewGroupPost,
  scoreHints,
  type OwnerPanelState,
  type OwnerScoreState,
} from "@/lib/group-owner-panel";
import { resolveMotorLocation } from "@/lib/group-submit";
import { getCategoryMeta } from "@/lib/whatsapp-landing-presentation";
import { getErrorMessage } from "@/lib/whatsapp-landing-form";
import type { WhatsAppLanding } from "@/lib/whatsapp-landings";

const SCORE_ITEM_LABELS: Array<{
  key: keyof OwnerScoreState["components"];
  label: string;
  max: number;
}> = [
  // Kalem adları G17 formülüyle birebir (components anahtarları).
  { key: "profile", label: "Profil (açıklama + kategori + şehir)", max: 15 },
  { key: "rules", label: "Yazılı grup kuralları", max: 15 },
  { key: "moderation", label: "Doğrulanmış sahip + 48 saat kuyruk", max: 15 },
  { key: "link", label: "Çalışan davet linki", max: 15 },
  { key: "recommendations", label: "Üye tavsiyeleri", max: 20 },
  { key: "reports", label: "Onaylanmış şikayet yok", max: 20 },
];

interface GroupOwnerPanelProps {
  landing: WhatsAppLanding;
  isSignedIn: boolean;
  /** Kaldırma isteği sonrası sayfa tazelenir (grup anında hidden — kabul #9). */
  onHidden: () => void;
}

/**
 * G21 · S4 Sahip paneli (tasarım §11). Yalnız doğrulanmış sahip görür —
 * `group_owner_panel_state` `is_owner:false` dönerse bileşen HİÇBİR ŞEY çizmez
 * (iç veri sızmaz). Dört iş: skor + eksik adımlar · düzenleme · onay kuyruğu
 * (G16 RPC) · "Grubu listeden kaldır" (G12 owner_request — ANINDA hidden,
 * gerekçe sorulmaz).
 */
export function GroupOwnerPanel({ landing, isSignedIn, onHidden }: GroupOwnerPanelProps) {
  const [state, setState] = useState<OwnerPanelState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"" | "review" | "save" | "remove">("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const [copied, setCopied] = useState(false);

  // Düzenleme formu (null/"" = dokunma; RPC eski değeri korur)
  const [shortDescription, setShortDescription] = useState<string | null>(null);
  const [rules, setRules] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("");
  const [tagline, setTagline] = useState<string | null>(null);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [countryName, setCountryName] = useState("");
  const [cityName, setCityName] = useState("");
  const [isGlobal, setIsGlobal] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    if (!isSignedIn || !landing.dbId || landing.ownership !== "verified") {
      setState(null);
      return;
    }
    try {
      const panel = await fetchOwnerPanelState(landing.dbId);
      setState(panel);
      if (panel.is_owner) {
        setShortDescription(panel.landing.short_description ?? "");
        setRules(panel.landing.rules ?? "");
        setTagline(panel.landing.tagline ?? "");
        setHeroImage(panel.landing.hero_image ?? "");
      }
    } catch (error) {
      setLoadError(getErrorMessage(error));
    }
  }, [isSignedIn, landing.dbId, landing.ownership]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!state?.is_owner) {
    // Sahip değil (ya da doğrulanmamış) — panel yok. Yükleme hatası da sessiz:
    // ziyaretçiye iç panelin varlığı bile görünmez.
    if (loadError) return null;
    return null;
  }

  const panel = state;
  const hints = scoreHints(panel.score);
  const categoryMeta = getCategoryMeta(panel.landing.category);

  const handleReview = async (postId: string, decision: "approve" | "reject") => {
    setBusy("review");
    setErrorText(null);
    try {
      await reviewGroupPost(postId, decision);
      setMessage(decision === "approve" ? "Gönderi yayınlandı." : "Gönderi reddedildi.");
      await load();
    } catch (error) {
      setErrorText(getErrorMessage(error));
    } finally {
      setBusy("");
    }
  };

  const handleSave = async () => {
    if (!landing.dbId) return;
    setBusy("save");
    setErrorText(null);
    setMessage(null);
    try {
      let location: { countryCode: string | null; cityId: string | null } = {
        countryCode: null,
        cityId: null,
      };
      if (countryName.trim()) {
        const resolved = await resolveMotorLocation({
          countryName,
          cityName,
          isGlobal: isGlobal === true,
        });
        location = { countryCode: resolved.countryCode, cityId: resolved.cityId };
      } else if (isGlobal === true && !panel.landing.is_global) {
        // Ülke seçilmeden Global'e geçiş: hedef ülke mevcut ülke kalır.
        location = { countryCode: null, cityId: null };
      }

      await ownerUpdate({
        landingDbId: landing.dbId,
        shortDescription: shortDescription?.trim() ? shortDescription.trim() : null,
        rules,
        category: category || null,
        tagline,
        heroImage: heroImage?.trim() ? heroImage.trim() : null,
        countryCode: location.countryCode,
        cityId: location.cityId,
        isGlobal: countryName.trim() || isGlobal !== null ? isGlobal === true : null,
      });
      setMessage("Değişiklikler kaydedildi. Skor ertesi günkü hesapta güncellenir.");
      await load();
    } catch (error) {
      setErrorText(getErrorMessage(error));
    } finally {
      setBusy("");
    }
  };

  const handleRemove = async () => {
    if (!landing.dbId) return;
    setBusy("remove");
    setErrorText(null);
    try {
      await requestGroupRemoval(landing.dbId);
      onHidden();
    } catch (error) {
      setErrorText(getErrorMessage(error));
      setBusy("");
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/addcom?group=${encodeURIComponent(panel.landing.slug)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage(`Sayfa linkin: ${url}`);
    }
  };

  // G22: yıllık yenileme onayı (tasarım §8) — 30 gün yanıt vermeyen sahip
  // unclaimed'a düşer; tek tıkla due 365 gün uzar.
  const handleRenew = async () => {
    setErrorText(null);
    try {
      const due = await ownerRenew();
      setMessage(
        due
          ? `Yenileme onayın kaydedildi — sonraki onay ${new Date(due).toLocaleDateString("tr-TR")} tarihine kadar.`
          : "Yenileme onayın kaydedildi.",
      );
    } catch (error) {
      setErrorText(getErrorMessage(error));
    }
  };

  return (
    <section
      aria-labelledby="owner-panel-title"
      className="rounded-[1.75rem] border border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.6)_0%,rgba(255,255,255,0.96)_100%)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="owner-panel-title" className="flex items-center gap-2 text-xl font-bold text-foreground">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          Sahip Paneli
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => void handleShare()}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Kopyalandı" : "Sayfayı paylaş"}
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => void handleRenew()}>
            <ShieldCheck className="h-4 w-4" />
            Yenileme onayını ver
          </Button>
          {panel.landing.has_approved_badge ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-violet-300 text-violet-700"
              onClick={() => downloadBadgeSvg(panel.landing.group_name, panel.landing.group_score)}
            >
              <Download className="h-4 w-4" />
              Rozet görselini indir
            </Button>
          ) : null}
        </div>
      </div>

      {errorText ? (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-semibold text-red-700">
          {errorText}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="mt-4 text-left text-sm font-semibold text-emerald-700">{message}</p>
      ) : null}

      {/* ── Skor + eksik adımlar ── */}
      <div className="mt-5 rounded-2xl border border-border bg-white p-5">
        <div className="flex flex-wrap items-center gap-3">
          {panel.landing.has_approved_badge ? (
            <Badge className="gap-1 border-violet-600 bg-violet-500 text-white">
              <Medal className="h-3.5 w-3.5" /> Onaylı Grup
            </Badge>
          ) : null}
          {panel.score.score === null ? (
            <p className="text-sm text-muted-foreground">
              {panel.score.in_grace
                ? "Grup yayında 7 günü doldurduğunda skor hesaplanacak."
                : "Skor henüz hesaplanmadı."}
            </p>
          ) : (
            <p className="text-sm font-bold text-foreground">
              Grup Sağlık Skoru: <span className="text-2xl text-violet-700">{panel.score.score}</span>
              <span className="text-muted-foreground"> / 100</span>
            </p>
          )}
        </div>

        <ul className="mt-4 grid gap-2 sm:grid-cols-2" aria-label="Skor kalemleri">
          {SCORE_ITEM_LABELS.map((item) => {
            const value = panel.score.components[item.key] ?? 0;
            const full = value >= item.max;
            return (
              <li
                key={item.label}
                className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                  full ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                <span>{item.label}</span>
                <span className="font-bold tabular-nums">
                  {value}/{item.max}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Eksik adımlar</p>
          <ul className="mt-2 space-y-1">
            {hints.map((hint) => (
              <li key={hint} className="text-left text-sm text-slate-700">• {hint}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Onay kuyruğu (tasarım §11 + §9: 48 saat uyarısı) ── */}
      <div className="mt-5 rounded-2xl border border-border bg-white p-5">
        <h3 className="text-base font-bold text-foreground">
          Onay bekleyen gönderiler{" "}
          <span className="text-sm font-semibold text-muted-foreground">({panel.pending_count})</span>
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          48 saat içinde bakmazsan gönderi ekibimizin kuyruğuna geçer.
        </p>

        {panel.pending_posts.length === 0 ? (
          <p className="mt-3 text-sm text-emerald-700">Onay bekleyen gönderi yok.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {panel.pending_posts.map((post) => (
              <li key={post.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="line-clamp-3 text-left text-sm text-slate-800">{post.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(post.created_at).toLocaleString("tr-TR")}
                </p>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => void handleReview(post.id, "approve")}
                    disabled={busy !== ""}
                  >
                    {busy === "review" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                    Onayla
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-700"
                    onClick={() => void handleReview(post.id, "reject")}
                    disabled={busy !== ""}
                  >
                    Reddet
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Düzenleme (tasarım §11: grup bilgilerini düzenleme) ── */}
      <div className="mt-5 rounded-2xl border border-border bg-white p-5">
        <h3 className="text-base font-bold text-foreground">Grup bilgilerini düzenle</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Mevcut kategori: <span className="font-semibold">{categoryMeta.label}</span>. Skor
          kalemlerine doğrudan etki eden alanlar: kısa açıklama, kurallar, kategori, şehir.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <Label htmlFor="owner-short-description">Kısa açıklama (en fazla 160 karakter)</Label>
            <Textarea
              id="owner-short-description"
              rows={2}
              maxLength={160}
              className="mt-1"
              value={shortDescription ?? ""}
              onChange={(event) => setShortDescription(event.target.value)}
            />
            <p className="mt-1 text-right text-xs tabular-nums text-slate-500">
              {(shortDescription ?? "").length}/160
            </p>
          </div>

          <div>
            <Label htmlFor="owner-rules">Grup kuralları (skor +15)</Label>
            <Textarea
              id="owner-rules"
              rows={3}
              className="mt-1"
              value={rules ?? ""}
              onChange={(event) => setRules(event.target.value)}
              placeholder="Örn: Reklam yasak, saygı zorunlu..."
            />
          </div>

          <div>
            <Label htmlFor="owner-category">Kategori</Label>
            <Select value={category || undefined} onValueChange={setCategory}>
              <SelectTrigger id="owner-category" className="mt-1">
                <SelectValue placeholder="Değiştirmek için seç" />
              </SelectTrigger>
              <SelectContent>
                {MOTOR_CATEGORIES.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={"locked" in option && option.locked === true}
                  >
                    {option.label}
                    {"locked" in option && option.locked === true ? " — yakında" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="owner-is-global"
              checked={isGlobal === true}
              onCheckedChange={(checked) => {
                setIsGlobal(checked === true);
                if (checked === true) setCityName("");
              }}
            />
            <Label htmlFor="owner-is-global" className="cursor-pointer font-medium">
              Global grup (şehir gerekmez)
            </Label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="owner-country">Ülke değiştir</Label>
              <SearchableCountrySelect
                id="owner-country"
                name="owner-country"
                value={countryName}
                onChange={(value) => {
                  setCountryName(value);
                  setCityName("");
                }}
                placeholder={panel.landing.country_code ?? "Değiştirmek için seç"}
              />
            </div>
            <div>
              <Label htmlFor="owner-city">Şehir değiştir</Label>
              <SearchableCitySelect
                id="owner-city"
                name="owner-city"
                value={cityName}
                onChange={setCityName}
                countryName={countryName}
                disabled={isGlobal === true || !countryName}
                placeholder={isGlobal === true ? "Global grup" : "Değiştirmek için seç"}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="owner-tagline">Vurgu cümlesi (tagline)</Label>
            <Input
              id="owner-tagline"
              className="mt-1"
              value={tagline ?? ""}
              onChange={(event) => setTagline(event.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="owner-hero">Görsel URL'si</Label>
            <Input
              id="owner-hero"
              className="mt-1"
              value={heroImage ?? ""}
              onChange={(event) => setHeroImage(event.target.value)}
              placeholder="https://..."
            />
          </div>

          <Button
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => void handleSave()}
            disabled={busy !== ""}
          >
            {busy === "save" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Değişiklikleri kaydet
          </Button>
        </div>
      </div>

      {/* ── Tehlikeli bölge: listeden kaldırma (tasarım §3.C — gerekçe YOK) ── */}
      <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">
        <h3 className="flex items-center gap-2 text-base font-bold text-red-700">
          <AlertTriangle className="h-4 w-4" />
          Grubu listeden kaldır
        </h3>
        <p className="mt-1 text-left text-sm text-red-700/80">
          Grup ANINDA gizlenir — gerekçe sormayız. 24 saat içinde moderatör kalıcı kaldırmaya
          çevirir. Bu işlem geri alınamaz.
        </p>
        {confirmingRemoval ? (
          <div className="mt-3 flex gap-2">
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => void handleRemove()}
              disabled={busy !== ""}
            >
              {busy === "remove" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Evet, listeden kaldır
            </Button>
            <Button variant="outline" onClick={() => setConfirmingRemoval(false)} disabled={busy !== ""}>
              Vazgeç
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="mt-3 border-red-300 text-red-700"
            onClick={() => setConfirmingRemoval(true)}
            disabled={busy !== ""}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Grubu listeden kaldır
          </Button>
        )}
      </div>
    </section>
  );
}
