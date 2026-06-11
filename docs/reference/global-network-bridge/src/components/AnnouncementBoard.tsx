import { useState } from "react";
import { Megaphone, GraduationCap, Heart, Tag, Store, Image, Link as LinkIcon, Plus, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Announcement {
  id: number;
  category: "eğitim" | "gönüllü" | "indirim" | "kampanya" | "franchise";
  title: string;
  content: string;
  image?: string;
  link?: string;
  date: string;
  author: string;
}

const categoryConfig: Record<string, { label: string; icon: typeof Megaphone; color: string }> = {
  eğitim: { label: "Eğitim", icon: GraduationCap, color: "bg-primary/10 text-primary border-primary/20" },
  gönüllü: { label: "Gönüllü Arayışı", icon: Heart, color: "bg-turquoise/10 text-turquoise border-turquoise/20" },
  indirim: { label: "İndirim", icon: Tag, color: "bg-gold/10 text-gold border-gold/20" },
  kampanya: { label: "Kampanya", icon: Megaphone, color: "bg-destructive/10 text-destructive border-destructive/20" },
  franchise: { label: "Franchise", icon: Store, color: "bg-gold/10 text-gold border-gold/20" },
};

const AnnouncementBoard = ({ orgName, announcements: initialAnnouncements, isOwner = false }: {
  orgName: string;
  announcements: Announcement[];
  isOwner?: boolean;
}) => {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [showForm, setShowForm] = useState(false);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [form, setForm] = useState({ category: "indirim" as Announcement["category"], title: "", content: "", image: "", link: "" });

  const filtered = filterCat === "all" ? announcements : announcements.filter(a => a.category === filterCat);

  const handlePost = () => {
    if (!form.title || !form.content) return;
    setAnnouncements(prev => [{
      id: Date.now(),
      ...form,
      image: form.image || undefined,
      link: form.link || undefined,
      date: new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }),
      author: orgName,
    }, ...prev]);
    setForm({ category: "indirim", title: "", content: "", image: "", link: "" });
    setShowForm(false);
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" /> Duyuru Panosu
        </h2>
        {isOwner && (
          <Button size="sm" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "İptal" : "Duyuru Paylaş"}
          </Button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="border border-dashed border-primary/30 rounded-xl p-5 bg-primary/5 mb-6 space-y-4">
          <div>
            <Label>Kategori</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(categoryConfig).map(([key, cfg]) => (
                <Button
                  key={key}
                  variant={form.category === key ? "default" : "outline"}
                  size="sm"
                  className="gap-1 text-xs"
                  onClick={() => setForm(p => ({ ...p, category: key as Announcement["category"] }))}
                >
                  <cfg.icon className="h-3 w-3" /> {cfg.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label>Başlık</Label>
            <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Duyuru başlığı" />
          </div>
          <div>
            <Label>İçerik</Label>
            <Textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Duyuru detayı..." rows={3} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-1"><Image className="h-3 w-3" /> Görsel URL (opsiyonel)</Label>
              <Input value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <Label className="flex items-center gap-1"><LinkIcon className="h-3 w-3" /> Link (opsiyonel)</Label>
              <Input value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))} placeholder="https://..." />
            </div>
          </div>
          <Button onClick={handlePost} className="w-full">Duyuru Yayınla</Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button variant={filterCat === "all" ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setFilterCat("all")}>Tümü</Button>
        {Object.entries(categoryConfig).map(([key, cfg]) => (
          <Button key={key} variant={filterCat === key ? "default" : "outline"} size="sm" className="text-xs gap-1" onClick={() => setFilterCat(key)}>
            <cfg.icon className="h-3 w-3" /> {cfg.label}
          </Button>
        ))}
      </div>

      {/* Announcements */}
      <div className="space-y-4">
        {filtered.map(a => {
          const cfg = categoryConfig[a.category];
          const Icon = cfg.icon;
          return (
            <div key={a.id} className="border border-border rounded-xl p-5 hover:border-primary/20 transition-colors">
              <div className="flex items-start gap-4">
                {a.image && (
                  <img src={a.image} alt={a.title} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="outline" className={`text-xs gap-1 ${cfg.color}`}>
                      <Icon className="h-3 w-3" /> {cfg.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{a.date}</span>
                  </div>
                  <h3 className="font-bold text-foreground mb-1">{a.title}</h3>
                  <p className="text-sm text-muted-foreground font-body">{a.content}</p>
                  {a.link && (
                    <a href={a.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2">
                      <ExternalLink className="h-3 w-3" /> Detay
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8 font-body">Bu kategoride duyuru bulunmuyor.</p>
        )}
      </div>
    </div>
  );
};

export default AnnouncementBoard;
