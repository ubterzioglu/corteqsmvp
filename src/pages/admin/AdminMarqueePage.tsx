import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit, ExternalLink, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  createMarqueeItem,
  deleteMarqueeItem,
  importNewsPostToMarquee,
  listAdminMarqueeItems,
  listImportableNewsPosts,
  marqueeTypeLabels,
  slugifyMarqueeTitle,
  updateMarqueeItem,
  uploadNewsImage,
  validateNewsImageFile,
  type MarqueeItemRow,
  type MarqueeItemType,
  type NewsPostRow,
} from "@/lib/marquee";

type MarqueeFormState = {
  type: MarqueeItemType;
  slug: string;
  title: string;
  summary: string;
  detail_content: string;
  image_url: string;
  image_alt: string;
  metric_value: string;
  link_enabled: boolean;
  sort_order: string;
  is_active: boolean;
  published_at: string;
};

const emptyForm = (): MarqueeFormState => ({
  type: "news",
  slug: "",
  title: "",
  summary: "",
  detail_content: "",
  image_url: "",
  image_alt: "",
  metric_value: "",
  link_enabled: false,
  sort_order: "0",
  is_active: true,
  published_at: new Date().toISOString().slice(0, 16),
});

const toLocalInputValue = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 16);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const toFormState = (item: MarqueeItemRow): MarqueeFormState => ({
  type: item.type === "news" || item.type === "stat" || item.type === "announcement" ? item.type : "news",
  slug: item.slug ?? "",
  title: item.title,
  summary: item.summary,
  detail_content: item.detail_content ?? "",
  image_url: item.image_url ?? "",
  image_alt: item.image_alt ?? "",
  metric_value: item.metric_value ?? "",
  link_enabled: item.link_enabled,
  sort_order: String(item.sort_order),
  is_active: item.is_active,
  published_at: toLocalInputValue(item.published_at),
});

const normalizeOptional = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const formatNewsDate = (value: string | null) => {
  if (!value) return "Tarih yok";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Tarih yok";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const AdminMarqueePage = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<MarqueeItemRow[]>([]);
  const [newsPosts, setNewsPosts] = useState<NewsPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNewsPosts, setLoadingNewsPosts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [importingNewsPostId, setImportingNewsPostId] = useState<number | null>(null);
  const [imageUploadError, setImageUploadError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MarqueeFormState>(() => emptyForm());

  const editingItem = useMemo(() => items.find((item) => item.id === editingId) ?? null, [editingId, items]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listAdminMarqueeItems());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bilinmeyen hata";
      toast({ title: "Haber bandı yüklenemedi", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const refreshNewsPosts = useCallback(async () => {
    setLoadingNewsPosts(true);
    try {
      setNewsPosts(await listImportableNewsPosts());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bilinmeyen hata";
      toast({ title: "Haber havuzu yüklenemedi", description: message, variant: "destructive" });
    } finally {
      setLoadingNewsPosts(false);
    }
  }, [toast]);

  useEffect(() => {
    void refresh();
    void refreshNewsPosts();
  }, [refresh, refreshNewsPosts]);

  const updateForm = <Key extends keyof MarqueeFormState>(key: Key, value: MarqueeFormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleImageUpload = async (file: File | null) => {
    setImageUploadError("");
    if (!file) return;

    const validation = validateNewsImageFile(file);
    if (!validation.ok) {
      setImageUploadError(validation.message);
      return;
    }

    setUploadingImage(true);
    try {
      const publicUrl = await uploadNewsImage(file);
      updateForm("image_url", publicUrl);
      if (!form.image_alt.trim()) {
        updateForm("image_alt", form.title.trim() || file.name.replace(/\.[^.]+$/, ""));
      }
      toast({ title: "Görsel yüklendi", description: "Görsel URL alanı otomatik güncellendi." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Görsel yüklenemedi";
      setImageUploadError(message);
      toast({ title: "Görsel yüklenemedi", description: message, variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const editItem = (item: MarqueeItemRow) => {
    setEditingId(item.id);
    setForm(toFormState(item));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const buildPayload = () => {
    const title = form.title.trim();
    const summary = form.summary.trim();
    const slug = form.slug.trim() || (form.link_enabled ? slugifyMarqueeTitle(title) : "");

    if (!title) throw new Error("Başlık zorunlu.");
    if (!summary) throw new Error("Kısa bilgi zorunlu.");
    if (form.link_enabled && !slug) throw new Error("Detay sayfası açıksa slug zorunlu.");

    const sortOrder = Number.parseInt(form.sort_order, 10);
    if (Number.isNaN(sortOrder)) throw new Error("Sıralama sayısal olmalı.");

    const publishedAt = new Date(form.published_at);
    if (Number.isNaN(publishedAt.getTime())) throw new Error("Yayın tarihi geçersiz.");

    return {
      type: form.type,
      slug: slug || null,
      title,
      summary,
      detail_content: normalizeOptional(form.detail_content),
      image_url: normalizeOptional(form.image_url),
      image_alt: normalizeOptional(form.image_alt),
      metric_value: normalizeOptional(form.metric_value),
      link_enabled: form.link_enabled,
      sort_order: sortOrder,
      is_active: form.is_active,
      published_at: publishedAt.toISOString(),
    };
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = buildPayload();
      if (editingId) {
        await updateMarqueeItem(editingId, payload);
        toast({ title: "Haber bandı kaydı güncellendi" });
      } else {
        await createMarqueeItem(payload);
        toast({ title: "Haber bandı kaydı eklendi" });
      }
      resetForm();
      await refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kaydedilemedi";
      toast({ title: "Kayıt başarısız", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const removeItem = async (item: MarqueeItemRow) => {
    if (!window.confirm(`"${item.title}" kaydı silinsin mi?`)) return;
    try {
      await deleteMarqueeItem(item.id);
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
      if (editingId === item.id) resetForm();
      toast({ title: "Kayıt silindi" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Silinemedi";
      toast({ title: "Silme başarısız", description: message, variant: "destructive" });
    }
  };

  const handleImportNewsPost = async (post: NewsPostRow) => {
    setImportingNewsPostId(post.id);
    try {
      const imported = await importNewsPostToMarquee(post.id);
      setItems((current) => {
        const existingIndex = current.findIndex((item) => item.id === imported.id);
        if (existingIndex >= 0) {
          return current.map((item) => (item.id === imported.id ? imported : item));
        }
        return [...current, imported].sort((first, second) => {
          if (first.sort_order !== second.sort_order) return first.sort_order - second.sort_order;
          return new Date(second.published_at).getTime() - new Date(first.published_at).getTime();
        });
      });
      toast({ title: "Haber marquee’ye aktarıldı" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Aktarım yapılamadı";
      toast({ title: "Aktarım başarısız", description: message, variant: "destructive" });
    } finally {
      setImportingNewsPostId(null);
    }
  };

  const importedByNewsPostId = useMemo(
    () => new Map(items.filter((item) => item.news_post_id != null).map((item) => [item.news_post_id as number, item])),
    [items],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingItem ? "Haber Bandı Kaydını Düzenle" : "Yeni Haber Bandı Kaydı"}</CardTitle>
          <CardDescription>Hero altında dönen görselli haber, istatistik ve duyuru kartlarını yönetin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Tip</Label>
              <Select value={form.type} onValueChange={(value) => updateForm("type", value as MarqueeItemType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="news">Haber</SelectItem>
                  <SelectItem value="stat">İstatistik</SelectItem>
                  <SelectItem value="announcement">Duyuru</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Yayın tarihi</Label>
              <Input type="datetime-local" value={form.published_at} onChange={(event) => updateForm("published_at", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sıralama</Label>
              <Input value={form.sort_order} onChange={(event) => updateForm("sort_order", event.target.value)} inputMode="numeric" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
            <div className="space-y-2">
              <Label>Başlık</Label>
              <Input value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="Türk diasporası 164 ülkede görünür" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(event) => updateForm("slug", slugifyMarqueeTitle(event.target.value))}
                placeholder="turk-diasporasi-164-ulke"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Kısa bilgi</Label>
            <Textarea value={form.summary} onChange={(event) => updateForm("summary", event.target.value)} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Detay metni</Label>
            <Textarea value={form.detail_content} onChange={(event) => updateForm("detail_content", event.target.value)} rows={6} />
          </div>

          <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
            <div className="space-y-2">
              <Label>Görsel URL</Label>
              <Input value={form.image_url} onChange={(event) => updateForm("image_url", event.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Görsel alt metni</Label>
              <Input value={form.image_alt} onChange={(event) => updateForm("image_alt", event.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 md:grid-cols-[180px_1fr]">
            <div className="aspect-[4/3] overflow-hidden rounded-md border border-border bg-background">
              {form.image_url ? (
                <img src={form.image_url} alt={form.image_alt || "Haber bandı görsel önizleme"} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <ImagePlus className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center gap-3">
              <div>
                <Label htmlFor="marquee-image-upload">Photo upload</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Görsel `newsimage` bucket içine yüklenir ve URL alanına otomatik yazılır. JPG, PNG, WEBP veya GIF; maksimum 5 MB.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  id="marquee-image-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={uploadingImage}
                  onChange={(event) => {
                    void handleImageUpload(event.target.files?.[0] ?? null);
                    event.currentTarget.value = "";
                  }}
                  className="max-w-md bg-background"
                />
                {uploadingImage && (
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Yükleniyor...
                  </span>
                )}
              </div>
              {imageUploadError && <p className="text-sm text-destructive">{imageUploadError}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Sayı / değer</Label>
              <Input value={form.metric_value} onChange={(event) => updateForm("metric_value", event.target.value)} placeholder="8.8 milyon" />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <Label>Detay sayfası</Label>
                <p className="text-xs text-muted-foreground">Açıksa kart slug sayfasına gider.</p>
              </div>
              <Switch checked={form.link_enabled} onCheckedChange={(checked) => updateForm("link_enabled", checked)} />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <Label>Aktif</Label>
                <p className="text-xs text-muted-foreground">Pasif kayıt public tarafta görünmez.</p>
              </div>
              <Switch checked={form.is_active} onCheckedChange={(checked) => updateForm("is_active", checked)} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void handleSubmit()} disabled={submitting}>
              <Plus className="h-4 w-4" />
              {submitting ? "Kaydediliyor..." : editingId ? "Kaydı Güncelle" : "Kayıt Ekle"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm}>
                Vazgeç
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>OpenClaw Haber Havuzu</CardTitle>
          <CardDescription>Aktif haberleri tek tek marquee akışına ekleyin. Aynı haber ikinci kez eklenmez.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Başlık</TableHead>
                <TableHead>Kaynak</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingNewsPosts ? (
                <TableRow>
                  <TableCell colSpan={5}>Yükleniyor...</TableCell>
                </TableRow>
              ) : newsPosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>Aktarılabilir aktif haber yok.</TableCell>
                </TableRow>
              ) : (
                newsPosts.map((post) => {
                  const importedItem = importedByNewsPostId.get(post.id);
                  return (
                    <TableRow key={post.id}>
                      <TableCell className="max-w-md">
                        <div className="font-semibold text-foreground">{post.title}</div>
                        <div className="line-clamp-2 text-xs text-muted-foreground">{post.summary ?? "Özet yok"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{post.source_name ?? "-"}</div>
                        <div className="text-xs text-muted-foreground">
                          {[post.city, post.country].filter(Boolean).join(", ") || post.category || "-"}
                        </div>
                      </TableCell>
                      <TableCell>{formatNewsDate(post.published_at ?? post.created_at)}</TableCell>
                      <TableCell>
                        {importedItem ? <Badge variant="outline">Marquee’de</Badge> : <Badge>Hazır</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => void handleImportNewsPost(post)}
                            disabled={Boolean(importedItem) || importingNewsPostId === post.id}
                          >
                            {importingNewsPostId === post.id ? "Ekleniyor..." : importedItem ? "Eklendi" : "Marquee’ye ekle"}
                          </Button>
                          {importedItem && (
                            <Button variant="outline" size="sm" onClick={() => editItem(importedItem)}>
                              <Edit className="h-4 w-4" />
                              Düzenle
                            </Button>
                          )}
                          {post.source_url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={post.source_url} target="_blank" rel="noreferrer">
                                <ExternalLink className="h-4 w-4" />
                                Kaynak
                              </a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mevcut Haber Bandı Kayıtları</CardTitle>
          <CardDescription>Görsel, durum, detay ve sıralama bilgilerini hızlıca kontrol edin.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Görsel</TableHead>
                <TableHead>Başlık</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Detay</TableHead>
                <TableHead>Sıra</TableHead>
                <TableHead>İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7}>Yükleniyor...</TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>Kayıt yok.</TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const type = item.type === "news" || item.type === "stat" || item.type === "announcement" ? item.type : "announcement";
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <img
                          src={item.image_url || "/og-image.png"}
                          alt={item.image_alt || item.title}
                          className="h-14 w-20 rounded-md object-cover"
                        />
                      </TableCell>
                      <TableCell className="max-w-sm">
                        <div className="font-semibold text-foreground">{item.title}</div>
                        <div className="line-clamp-1 text-xs text-muted-foreground">{item.summary}</div>
                      </TableCell>
                      <TableCell>{marqueeTypeLabels[type]}</TableCell>
                      <TableCell>
                        <Badge variant={item.is_active ? "outline" : "secondary"}>{item.is_active ? "Aktif" : "Pasif"}</Badge>
                      </TableCell>
                      <TableCell>{item.link_enabled ? "Açık" : "Kapalı"}</TableCell>
                      <TableCell>{item.sort_order}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => editItem(item)}>
                            <Edit className="h-4 w-4" />
                            Düzenle
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => void removeItem(item)}>
                            <Trash2 className="h-4 w-4" />
                            Sil
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMarqueePage;
