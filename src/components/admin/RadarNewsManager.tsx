import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Edit, ExternalLink, Eye, FileImage, Loader2, Newspaper, PlusCircle, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  createRadarNews,
  deleteRadarNews,
  fetchRadarNewsAdmin,
  slugify,
  updateRadarNews,
  uploadRadarImage,
  type RadarNewsInput,
  type RadarNewsItem,
} from "@/lib/radarNews";

type FormState = {
  title: string;
  summary: string;
  detailContent: string;
  imageUrl: string;
  imageAlt: string;
  metricValue: string;
  externalUrl: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  publishedAt: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  summary: "",
  detailContent: "",
  imageUrl: "",
  imageAlt: "",
  metricValue: "",
  externalUrl: "",
  slug: "",
  sortOrder: 0,
  isActive: true,
  publishedAt: new Date().toISOString().slice(0, 16),
};

const toFormState = (item: RadarNewsItem): FormState => ({
  title: item.title,
  summary: item.summary,
  detailContent: item.detailContent || "",
  imageUrl: item.imageUrl || "",
  imageAlt: item.imageAlt || "",
  metricValue: item.metricValue || "",
  externalUrl: item.externalUrl || "",
  slug: item.slug || "",
  sortOrder: item.sortOrder,
  isActive: item.isActive,
  publishedAt: item.publishedAt.slice(0, 16),
});

const RadarNewsManager = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<RadarNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RadarNewsItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.sortOrder - b.sortOrder || new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()),
    [items],
  );

  const load = async () => {
    setLoading(true);
    try {
      setItems(await fetchRadarNewsAdmin());
    } catch (error) {
      toast({ title: "Radar haberleri yuklenemedi", description: String(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (item: RadarNewsItem) => {
    setEditingItem(item);
    setForm(toFormState(item));
    setOpen(true);
  };

  const onUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadRadarImage(file);
      setForm((current) => ({ ...current, imageUrl: url, imageAlt: current.imageAlt || current.title }));
      toast({ title: "Gorsel yuklendi" });
    } catch (error) {
      toast({ title: "Gorsel yuklenemedi", description: String(error), variant: "destructive" });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.summary.trim()) {
      toast({ title: "Baslik ve ozet zorunlu", variant: "destructive" });
      return;
    }

    const payload: RadarNewsInput = {
      type: "news",
      title: form.title,
      summary: form.summary,
      detailContent: form.detailContent,
      imageUrl: form.imageUrl,
      imageAlt: form.imageAlt,
      metricValue: form.metricValue,
      externalUrl: form.externalUrl,
      slug: form.slug,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
      publishedAt: new Date(form.publishedAt).toISOString(),
    };

    setSaving(true);
    try {
      if (editingItem) {
        await updateRadarNews(editingItem.id, payload);
        toast({ title: "Haber guncellendi" });
      } else {
        await createRadarNews(payload);
        toast({ title: "Haber eklendi" });
      }
      setOpen(false);
      setEditingItem(null);
      setForm(EMPTY_FORM);
      await load();
    } catch (error) {
      toast({ title: "Kayit basarisiz", description: String(error), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (item: RadarNewsItem) => {
    if (!confirm(`"${item.title}" kaydini silmek istediginden emin misin?`)) return;
    try {
      await deleteRadarNews(item.id);
      toast({ title: "Haber silindi" });
      await load();
    } catch (error) {
      toast({ title: "Silme basarisiz", description: String(error), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Newspaper className="h-5 w-5 text-primary" /> CorteQS Radar Yonetimi
          </h2>
          <p className="text-sm text-muted-foreground">
            Ana sayfadaki marquee, tum haberler listesi ve detay sayfalari buradan yonetilir.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void load()}>
            <RefreshCw className="h-3.5 w-3.5" /> Yenile
          </Button>
          <Button size="sm" className="gap-1.5" onClick={openCreate}>
            <PlusCircle className="h-3.5 w-3.5" /> Haber Ekle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-48 animate-pulse rounded-2xl border border-border bg-card" />
          ))
        ) : sortedItems.length === 0 ? (
          <Card className="xl:col-span-2">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Henuz Radar haberi bulunmuyor.
            </CardContent>
          </Card>
        ) : (
          sortedItems.map((item) => {
            const hasDetail = Boolean(item.detailContent && item.slug);
            return (
              <Card key={item.id} className="overflow-hidden rounded-2xl border-border">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant={item.isActive ? "default" : "secondary"}>
                          {item.isActive ? "Aktif" : "Pasif"}
                        </Badge>
                        <Badge variant="outline">Sira: {item.sortOrder}</Badge>
                        {hasDetail ? <Badge variant="outline">Detay var</Badge> : <Badge variant="secondary">Detay yok</Badge>}
                      </div>
                      <CardTitle className="line-clamp-2 text-lg">{item.title}</CardTitle>
                    </div>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.imageAlt || item.title}
                        className="h-20 w-24 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-24 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        <FileImage className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="line-clamp-3 text-sm text-muted-foreground">{item.summary}</p>
                  <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                    <div>Slug: {item.slug || "—"}</div>
                    <div>Yayin: {new Date(item.publishedAt).toLocaleString("tr-TR")}</div>
                    <div>Metrik: {item.metricValue || "—"}</div>
                    <div>Harici URL: {item.externalUrl ? "Var" : "Yok"}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                    {hasDetail ? (
                      <Link to={`/radar/${item.slug}`}>
                        <Button size="sm" variant="outline" className="gap-1.5">
                          <Eye className="h-3.5 w-3.5" /> Detay
                        </Button>
                      </Link>
                    ) : null}
                    {item.externalUrl ? (
                      <a href={item.externalUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-1.5">
                          <ExternalLink className="h-3.5 w-3.5" /> Kaynak
                        </Button>
                      </a>
                    ) : null}
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openEdit(item)}>
                      <Edit className="h-3.5 w-3.5" /> Duzenle
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-destructive hover:text-destructive"
                      onClick={() => void onDelete(item)}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Sil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Radar Haberini Duzenle" : "Yeni Radar Haberi"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="radar-title">Baslik</Label>
                <Input
                  id="radar-title"
                  value={form.title}
                  onChange={(event) => {
                    const title = event.target.value;
                    setForm((current) => ({
                      ...current,
                      title,
                      slug: current.detailContent ? slugify(title) : current.slug,
                    }));
                  }}
                  placeholder="CorteQS Radar basligi"
                />
              </div>
              <div className="space-y-2">
                <Label>Kayit Turu</Label>
                <div className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm font-medium text-foreground">
                  Haber
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="radar-summary">Kisa Ozet</Label>
              <Textarea
                id="radar-summary"
                rows={3}
                value={form.summary}
                onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
                placeholder="Marquee ve liste kartlarinda gorunecek kisa ozet"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="radar-detail">Detay Icerigi</Label>
              <Textarea
                id="radar-detail"
                rows={8}
                value={form.detailContent}
                onChange={(event) => {
                  const detailContent = event.target.value;
                  setForm((current) => ({
                    ...current,
                    detailContent,
                    slug: detailContent.trim() ? slugify(current.title) : "",
                  }));
                }}
                placeholder="Bos birakilirsa detay sayfasi olusmaz ve 'Detayi oku' gosterilmez."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="radar-image-url">Gorsel URL</Label>
                <Input
                  id="radar-image-url"
                  value={form.imageUrl}
                  onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="radar-image-alt">Gorsel Alt Metni</Label>
                <Input
                  id="radar-image-alt"
                  value={form.imageAlt}
                  onChange={(event) => setForm((current) => ({ ...current, imageAlt: event.target.value }))}
                  placeholder="Gorsel aciklamasi"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="radar-upload">Gorsel Yukle</Label>
              <Input id="radar-upload" type="file" accept="image/*" onChange={(event) => void onUpload(event)} />
              {uploading ? <p className="text-xs text-muted-foreground">Gorsel yukleniyor...</p> : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="radar-external-url">Dis Kaynak URL</Label>
                <Input
                  id="radar-external-url"
                  value={form.externalUrl}
                  onChange={(event) => setForm((current) => ({ ...current, externalUrl: event.target.value }))}
                  placeholder="https://kaynak-site.com/haber"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="radar-metric">Metrik / Etiket</Label>
                <Input
                  id="radar-metric"
                  value={form.metricValue}
                  onChange={(event) => setForm((current) => ({ ...current, metricValue: event.target.value }))}
                  placeholder="Son dakika / 4.2M / Berlin"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="radar-slug">Slug</Label>
                <Input
                  id="radar-slug"
                  value={form.slug}
                  onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))}
                  placeholder="corteqs-radar-haberi"
                  disabled={!form.detailContent.trim()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="radar-sort-order">Siralama</Label>
                <Input
                  id="radar-sort-order"
                  type="number"
                  value={form.sortOrder}
                  onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="radar-published-at">Yayin Tarihi</Label>
                <Input
                  id="radar-published-at"
                  type="datetime-local"
                  value={form.publishedAt}
                  onChange={(event) => setForm((current) => ({ ...current, publishedAt: event.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Yayinda gorunsun</p>
                <p className="text-xs text-muted-foreground">Kapaliysa public tarafta listelenmez.</p>
              </div>
              <Switch checked={form.isActive} onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))} />
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Vazgec
              </Button>
              <Button type="submit" disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editingItem ? "Degisiklikleri Kaydet" : "Haberi Yayinla"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RadarNewsManager;
