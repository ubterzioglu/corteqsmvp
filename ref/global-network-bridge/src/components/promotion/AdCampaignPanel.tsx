import { useState } from "react";
import {
  Megaphone, Search, Coffee, Newspaper, Layout, Sparkles,
  Image as ImageIcon, Link2, Calendar, Check, Crown, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface AdSlot {
  id: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  size: { w: number; h: number; label: string };
  durations: Array<{ label: string; price: string }>;
  textLimit: number;
  themeMatch?: boolean;
}

const SLOTS: AdSlot[] = [
  {
    id: "ai-bar",
    title: "Ana Sayfa · AI Bar Altı",
    desc: "Platform ana sayfasında AI arama barının hemen altındaki sponsorluk şeridi. Max 3 ay.",
    icon: Sparkles,
    size: { w: 1200, h: 180, label: "1200×180 px (banner)" },
    durations: [
      { label: "1 ay", price: "€199" },
      { label: "2 ay", price: "€349" },
      { label: "3 ay (max)", price: "€479" },
    ],
    textLimit: 90,
  },
  {
    id: "category",
    title: "Kategori Arama · İlk Ekran",
    desc: "Kendi kategorinin arama sonuçlarında ilk ekranda (mobilde ilk 6 içinde) öne çıkar.",
    icon: Search,
    size: { w: 600, h: 600, label: "600×600 px (kare kart)" },
    durations: [
      { label: "1 hafta", price: "€59" },
      { label: "1 ay", price: "€179" },
    ],
    textLimit: 120,
  },
  {
    id: "cadde-side",
    title: "Cadde · Sağ Kolon (Ülke / Şehir / Köprü / Global Akış)",
    desc: "Cadde sekmesinin Ülke, Şehir, Köprü ve Global Akış görünümlerinde en sağ kolonda ilan kartı.",
    icon: Layout,
    size: { w: 320, h: 480, label: "320×480 px (dikey kart)" },
    durations: [
      { label: "1 hafta", price: "€69" },
      { label: "1 ay", price: "€219" },
    ],
    textLimit: 140,
  },
  {
    id: "cadde-feed",
    title: "Cadde Feed · Akış İçi İlan",
    desc: "Cadde feed akışının arasına yerleşen sponsorlu post.",
    icon: Newspaper,
    size: { w: 1080, h: 1080, label: "1080×1080 px (feed kartı)" },
    durations: [
      { label: "1 hafta", price: "€89" },
      { label: "1 ay", price: "€269" },
    ],
    textLimit: 220,
  },
  {
    id: "cafe-theme",
    title: "Cafe Feed · Tema Eşleşmeli (AI)",
    desc: "AI eşleşmesiyle tema-uyumlu cafelerin feed'inde sağ kolonda ilan. Aşağıdan temaları seçin.",
    icon: Coffee,
    size: { w: 300, h: 250, label: "300×250 px (medium rectangle)" },
    durations: [
      { label: "1 hafta", price: "€79" },
      { label: "1 ay", price: "€239" },
    ],
    textLimit: 160,
    themeMatch: true,
  },
];

const CAFE_THEMES = [
  "Girişimcilik", "Teknoloji", "Sağlık", "Eğitim", "Sanat", "Müzik",
  "Yemek", "Spor", "Seyahat", "Aile", "Kariyer", "Yatırım", "Hukuk", "Gayrimenkul"
];

const AdCampaignPanel = ({ isPremium = false }: { isPremium?: boolean }) => {
  const [openSlot, setOpenSlot] = useState<string | null>(null);
  const [form, setForm] = useState({
    headline: "",
    body: "",
    url: "",
    image: "",
    duration: 0,
    themes: [] as string[],
  });

  const toggleTheme = (t: string) =>
    setForm((f) => ({
      ...f,
      themes: f.themes.includes(t) ? f.themes.filter((x) => x !== t) : [...f.themes, t],
    }));

  const reset = () => {
    setOpenSlot(null);
    setForm({ headline: "", body: "", url: "", image: "", duration: 0, themes: [] });
  };

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Tanıtım & Reklam</h2>
              <p className="text-sm text-muted-foreground">
                Platform genelinde 5 farklı yerleşimde tıklanabilir ilan verebilirsiniz.
              </p>
            </div>
          </div>
          {!isPremium && (
            <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 gap-1">
              <Crown className="h-3 w-3" /> Premium özellik (önizleme modu)
            </Badge>
          )}
        </div>
      </div>

      {/* Slot cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {SLOTS.map((slot) => {
          const Icon = slot.icon;
          const isOpen = openSlot === slot.id;
          return (
            <div key={slot.id} className="bg-card rounded-2xl border border-border p-5 shadow-card">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-foreground text-sm">{slot.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{slot.desc}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3 text-[11px]">
                <Badge variant="outline" className="gap-1">
                  <ImageIcon className="h-3 w-3" /> {slot.size.label}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Info className="h-3 w-3" /> Metin: max {slot.textLimit} karakter
                </Badge>
                {slot.themeMatch && (
                  <Badge className="gap-1 bg-turquoise/15 text-turquoise border-turquoise/30">
                    <Sparkles className="h-3 w-3" /> AI tema eşleşmesi
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {slot.durations.map((d) => (
                  <span
                    key={d.label}
                    className="text-[11px] px-2 py-1 rounded-md border border-border bg-muted/30"
                  >
                    <strong className="text-foreground">{d.label}</strong> · {d.price}
                  </span>
                ))}
              </div>

              {!isOpen ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-1.5"
                  onClick={() => setOpenSlot(slot.id)}
                >
                  <Megaphone className="h-3.5 w-3.5" /> İlan oluştur
                </Button>
              ) : (
                <div className="space-y-3 border-t border-border pt-3 mt-2">
                  {/* Size preview */}
                  <div className="rounded-lg border border-dashed border-border p-2 bg-muted/20 text-center">
                    <div
                      className="mx-auto bg-gradient-to-br from-primary/10 to-turquoise/10 rounded flex items-center justify-center"
                      style={{
                        aspectRatio: `${slot.size.w} / ${slot.size.h}`,
                        maxWidth: 240,
                      }}
                    >
                      <span className="text-[10px] text-muted-foreground">
                        Önizleme · {slot.size.label}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Başlık</Label>
                    <Input
                      value={form.headline}
                      onChange={(e) => setForm({ ...form, headline: e.target.value })}
                      placeholder="Kısa, dikkat çekici başlık"
                      maxLength={60}
                      className="h-9 text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Metin ({form.body.length}/{slot.textLimit})</Label>
                    <Textarea
                      value={form.body}
                      onChange={(e) => setForm({ ...form, body: e.target.value.slice(0, slot.textLimit) })}
                      placeholder="İlan metni"
                      rows={2}
                      className="text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs flex items-center gap-1">
                      <Link2 className="h-3 w-3" /> Tıklama Hedef URL
                    </Label>
                    <Input
                      value={form.url}
                      onChange={(e) => setForm({ ...form, url: e.target.value })}
                      placeholder="https://..."
                      className="h-9 text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" /> Görsel ({slot.size.label})
                    </Label>
                    <Input type="file" accept="image/*" className="h-9 text-sm" />
                  </div>

                  <div>
                    <Label className="text-xs flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Süre
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {slot.durations.map((d, i) => (
                        <button
                          key={d.label}
                          type="button"
                          onClick={() => setForm({ ...form, duration: i })}
                          className={`text-xs px-3 py-1.5 rounded-md border transition ${
                            form.duration === i
                              ? "border-primary bg-primary/10 text-primary font-semibold"
                              : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          {d.label} · {d.price}
                        </button>
                      ))}
                    </div>
                  </div>

                  {slot.themeMatch && (
                    <div>
                      <Label className="text-xs flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Hedef Tema(lar) — AI eşleştirir
                      </Label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {CAFE_THEMES.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleTheme(t)}
                            className={`text-[11px] px-2 py-1 rounded-full border ${
                              form.themes.includes(t)
                                ? "bg-turquoise/15 border-turquoise/40 text-turquoise"
                                : "bg-muted/30 border-border text-muted-foreground"
                            }`}
                          >
                            {form.themes.includes(t) && <Check className="inline h-3 w-3 mr-0.5" />}
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-2">
                    <Button variant="ghost" size="sm" onClick={reset}>İptal</Button>
                    <Button size="sm" className="gap-1.5" disabled={!isPremium}>
                      {isPremium ? <><Check className="h-3.5 w-3.5" /> İlanı yayınla</> : <><Crown className="h-3.5 w-3.5" /> Premium gerekli</>}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Public profile toggle reminder */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
              <Layout className="h-4 w-4 text-primary" /> Profilim public açık
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
              Kapalıyken dış görünüm yalnızca logo/foto + isim olarak gösterilir.
              Reklamlarınız çalışsa bile tıklama sonrası profiliniz minimal görünür.
              Public toggle'ı Profil Ayarları'ndan yönetebilirsiniz.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Profil Ayarları sekmesinden değiştir</span>
            <Switch checked disabled />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdCampaignPanel;
