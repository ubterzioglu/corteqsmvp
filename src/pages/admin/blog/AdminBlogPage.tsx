import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit, Eye, EyeOff, Loader2, Plus, Trash2 } from "lucide-react";

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
  blogCategoryLabels,
  blogCategoryOrder,
  createBlogPost,
  deleteBlogPost,
  listAllBlogPosts,
  slugifyBlogTitle,
  updateBlogPost,
  type BlogCategory,
  type BlogPostInsert,
  type BlogPostRow,
} from "@/lib/blog";

type BlogFormState = {
  slug: string;
  title: string;
  excerpt: string;
  content_markdown: string;
  country: string;
  country_label: string;
  category: BlogCategory;
  cover_image: string;
  published: boolean;
  sort_order: string;
};

const emptyForm = (): BlogFormState => ({
  slug: "",
  title: "",
  excerpt: "",
  content_markdown: "",
  country: "",
  country_label: "",
  category: "genel",
  cover_image: "",
  published: false,
  sort_order: "0",
});

const toFormState = (item: BlogPostRow): BlogFormState => ({
  slug: item.slug,
  title: item.title,
  excerpt: item.excerpt ?? "",
  content_markdown: item.content_markdown ?? "",
  country: item.country ?? "",
  country_label: item.country_label ?? "",
  category: item.category,
  cover_image: item.cover_image ?? "",
  published: item.published,
  sort_order: String(item.sort_order),
});

const AdminBlogPage = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<BlogPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BlogFormState>(() => emptyForm());

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listAllBlogPosts());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bilinmeyen hata";
      toast({ title: "Blog yazıları yüklenemedi", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateForm = <Key extends keyof BlogFormState>(key: Key, value: BlogFormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const editItem = (item: BlogPostRow) => {
    setEditingId(item.id);
    setForm(toFormState(item));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSlugFromTitle = () => {
    if (!form.title.trim() || form.slug.trim()) return;
    updateForm("slug", slugifyBlogTitle(form.title));
  };

  const buildPayload = (): BlogPostInsert | null => {
    const slug = form.slug.trim() || slugifyBlogTitle(form.title);
    if (!slug) {
      toast({ title: "Slug gerekli", description: "Başlık veya slug giriniz.", variant: "destructive" });
      return null;
    }
    if (form.title.trim().length < 3) {
      toast({ title: "Başlık çok kısa", description: "En az 3 karakter.", variant: "destructive" });
      return null;
    }
    if (form.content_markdown.trim().length < 10) {
      toast({ title: "İçerik çok kısa", description: "En az 10 karakter.", variant: "destructive" });
      return null;
    }
    const sortOrder = Number.parseInt(form.sort_order, 10);
    return {
      slug,
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      content_markdown: form.content_markdown,
      country: form.country.trim(),
      country_label: form.country_label.trim(),
      category: form.category,
      category_label: blogCategoryLabels[form.category],
      cover_image: form.cover_image.trim() || null,
      published: form.published,
      published_at: form.published ? new Date().toISOString() : null,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    };
  };

  const handleSubmit = async () => {
    const payload = buildPayload();
    if (!payload) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await updateBlogPost(editingId, payload);
        toast({ title: "Yazı güncellendi" });
      } else {
        await createBlogPost(payload);
        toast({ title: "Yazı oluşturuldu" });
      }
      resetForm();
      await refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bilinmeyen hata";
      toast({ title: "Kaydedilemedi", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = async (item: BlogPostRow) => {
    try {
      await updateBlogPost(item.id, {
        published: !item.published,
        published_at: !item.published ? new Date().toISOString() : null,
      });
      await refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bilinmeyen hata";
      toast({ title: "Durum değiştirilemedi", description: message, variant: "destructive" });
    }
  };

  const handleDelete = async (item: BlogPostRow) => {
    if (typeof window !== "undefined" && !window.confirm(`"${item.title}" yazısını silmek istiyor musunuz?`)) {
      return;
    }
    setDeletingId(item.id);
    try {
      await deleteBlogPost(item.id);
      if (editingId === item.id) resetForm();
      toast({ title: "Yazı silindi" });
      await refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bilinmeyen hata";
      toast({ title: "Silinemedi", description: message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title, "tr")),
    [items],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Blog Yönetimi</h1>
        <p className="text-sm text-muted-foreground">
          Ülke rehberi yazılarını oluşturun, düzenleyin, yayınlayın veya gizleyin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Yazıyı Düzenle" : "Yeni Yazı"}</CardTitle>
          <CardDescription>
            İçerik markdown formatındadır; tablolar ve başlıklar desteklenir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="blog-title">Başlık</Label>
              <Input
                id="blog-title"
                value={form.title}
                onChange={(event) => updateForm("title", event.target.value)}
                onBlur={handleSlugFromTitle}
                placeholder="Almanya için giriş ve ulaşım notları"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blog-slug">Slug</Label>
              <Input
                id="blog-slug"
                value={form.slug}
                onChange={(event) => updateForm("slug", event.target.value)}
                placeholder="almanya-giris-ulasim"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blog-country">Ülke anahtarı</Label>
              <Input
                id="blog-country"
                value={form.country}
                onChange={(event) => updateForm("country", event.target.value)}
                placeholder="almanya"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blog-country-label">Ülke adı (görünür)</Label>
              <Input
                id="blog-country-label"
                value={form.country_label}
                onChange={(event) => updateForm("country_label", event.target.value)}
                placeholder="Almanya"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blog-category">Kategori</Label>
              <Select value={form.category} onValueChange={(value) => updateForm("category", value as BlogCategory)}>
                <SelectTrigger id="blog-category">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  {blogCategoryOrder.map((category) => (
                    <SelectItem key={category} value={category}>
                      {blogCategoryLabels[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="blog-sort">Sıra</Label>
              <Input
                id="blog-sort"
                type="number"
                value={form.sort_order}
                onChange={(event) => updateForm("sort_order", event.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="blog-cover">Kapak görseli URL (opsiyonel)</Label>
              <Input
                id="blog-cover"
                value={form.cover_image}
                onChange={(event) => updateForm("cover_image", event.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="blog-excerpt">Özet</Label>
            <Textarea
              id="blog-excerpt"
              value={form.excerpt}
              onChange={(event) => updateForm("excerpt", event.target.value)}
              rows={2}
              placeholder="Liste kartında görünecek kısa özet"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="blog-content">İçerik (markdown)</Label>
            <Textarea
              id="blog-content"
              value={form.content_markdown}
              onChange={(event) => updateForm("content_markdown", event.target.value)}
              rows={14}
              className="font-mono text-sm"
              placeholder="## Başlık&#10;&#10;Paragraf metni..."
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch id="blog-published" checked={form.published} onCheckedChange={(checked) => updateForm("published", checked)} />
            <Label htmlFor="blog-published">Yayında</Label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              {editingId ? "Güncelle" : "Oluştur"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm} disabled={submitting}>
                İptal
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Yazılar ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor...
            </div>
          ) : sortedItems.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">Henüz yazı yok.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sıra</TableHead>
                    <TableHead>Başlık</TableHead>
                    <TableHead>Ülke</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground">{item.sort_order}</TableCell>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>{item.country_label || "—"}</TableCell>
                      <TableCell>{blogCategoryLabels[item.category]}</TableCell>
                      <TableCell>
                        <span
                          className={
                            "rounded-full px-2 py-0.5 text-xs font-semibold " +
                            (item.published
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600")
                          }
                        >
                          {item.published ? "Yayında" : "Taslak"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            title={item.published ? "Gizle" : "Yayınla"}
                            onClick={() => handleTogglePublish(item)}
                          >
                            {item.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button size="icon" variant="ghost" title="Düzenle" onClick={() => editItem(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Sil"
                            onClick={() => handleDelete(item)}
                            disabled={deletingId === item.id}
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBlogPage;
