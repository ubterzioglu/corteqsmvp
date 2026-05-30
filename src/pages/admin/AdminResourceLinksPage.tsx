import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Pencil, Plus, Save, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  createEmptyResourceLinkFormState,
  createResourceLink,
  deleteResourceLink,
  listResourceLinks,
  resourceLinkAuthors,
  resourceLinkPlatforms,
  safeResourceHref,
  toResourceLinkFormState,
  toResourceLinkPayload,
  updateResourceLink,
  type ResourceLinkAuthor,
  type ResourceLinkFormState,
  type ResourceLinkPlatform,
  type ResourceLinkRow,
  type ResourceLinkTableName,
} from "@/lib/resource-links";

type AdminResourceLinksPageProps = {
  tableName: ResourceLinkTableName;
  title: string;
  description: string;
  emptyMessage: string;
};

const AdminResourceLinksPage = ({ tableName, title, description, emptyMessage }: AdminResourceLinksPageProps) => {
  const { toast } = useToast();
  const [items, setItems] = useState<ResourceLinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ResourceLinkFormState>(() => createEmptyResourceLinkFormState());
  const [editingForm, setEditingForm] = useState<ResourceLinkFormState>(() => createEmptyResourceLinkFormState());

  const editingItem = useMemo(() => items.find((item) => item.id === editingId) ?? null, [editingId, items]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listResourceLinks(tableName));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bilinmeyen hata";
      toast({ title: "Liste yüklenemedi", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [tableName, toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateForm = <Key extends keyof ResourceLinkFormState>(
    key: Key,
    value: ResourceLinkFormState[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateEditingForm = <Key extends keyof ResourceLinkFormState>(
    key: Key,
    value: ResourceLinkFormState[Key],
  ) => {
    setEditingForm((current) => ({ ...current, [key]: value }));
  };

  const resetCreateForm = () => setForm(createEmptyResourceLinkFormState());

  const startEdit = (item: ResourceLinkRow) => {
    setEditingId(item.id);
    setEditingForm(toResourceLinkFormState(item));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingForm(createEmptyResourceLinkFormState());
  };

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const created = await createResourceLink(tableName, toResourceLinkPayload(form));
      setItems((current) => [created, ...current]);
      resetCreateForm();
      toast({ title: "Kayıt eklendi" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Eklenemedi";
      toast({ title: "Kayıt eklenemedi", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setSubmitting(true);
    try {
      const updated = await updateResourceLink(tableName, id, toResourceLinkPayload(editingForm));
      setItems((current) => current.map((item) => (item.id === id ? updated : item)));
      cancelEdit();
      toast({ title: "Kayıt güncellendi" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Güncellenemedi";
      toast({ title: "Kayıt güncellenemedi", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: ResourceLinkRow) => {
    if (!window.confirm(`"${item.description || item.platform}" kaydı silinsin mi?`)) return;

    setSubmitting(true);
    try {
      await deleteResourceLink(tableName, item.id);
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
      if (editingId === item.id) cancelEdit();
      toast({ title: "Kayıt silindi" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Silinemedi";
      toast({ title: "Kayıt silinemedi", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const renderEditor = (
    state: ResourceLinkFormState,
    onChange: <Key extends keyof ResourceLinkFormState>(key: Key, value: ResourceLinkFormState[Key]) => void,
    submitLabel: string,
    onSubmit: () => void,
    onCancel?: () => void,
  ) => (
    <div className="grid gap-3 md:grid-cols-[0.8fr_1.4fr_1.4fr_0.7fr_auto]">
      <Select value={state.platform} onValueChange={(value) => onChange("platform", value as ResourceLinkPlatform)}>
        <SelectTrigger>
          <SelectValue placeholder="Platform" />
        </SelectTrigger>
        <SelectContent>
          {resourceLinkPlatforms.map((platform) => (
            <SelectItem key={platform} value={platform}>
              {platform}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={state.description}
        onChange={(event) => onChange("description", event.target.value)}
        placeholder="Açıklama"
      />
      <Input
        type="url"
        value={state.link}
        onChange={(event) => onChange("link", event.target.value)}
        placeholder="https://..."
        required
      />
      <Select value={state.added_by} onValueChange={(value) => onChange("added_by", value as ResourceLinkAuthor)}>
        <SelectTrigger>
          <SelectValue placeholder="Kim ekledi" />
        </SelectTrigger>
        <SelectContent>
          {resourceLinkAuthors.map((author) => (
            <SelectItem key={author} value={author}>
              {author}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onSubmit} disabled={submitting}>
          <Plus className="h-4 w-4" />
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            <X className="h-4 w-4" />
            İptal
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderEditor(form, updateForm, submitting ? "Kaydediliyor..." : "Yeni ekle", () => void handleCreate())}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mevcut Kayıtlar</CardTitle>
          <CardDescription>Platform, açıklama, link ve ekleyen bilgisini yönetin.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Kim</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6}>Yükleniyor...</TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>{emptyMessage}</TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const rowIsEditing = editingId === item.id;

                  if (rowIsEditing) {
                    return (
                      <TableRow key={item.id}>
                        <TableCell colSpan={6}>
                          {renderEditor(
                            editingForm,
                            updateEditingForm,
                            submitting ? "Kaydediliyor..." : "Kaydet",
                            () => void handleUpdate(item.id),
                            cancelEdit,
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.platform}</TableCell>
                      <TableCell className="max-w-md">{item.description || "-"}</TableCell>
                      <TableCell>
                        {item.link ? (
                          <a
                            href={safeResourceHref(item.link)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Link
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{item.added_by}</TableCell>
                      <TableCell>{new Date(item.created_at).toLocaleDateString("tr-TR")}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(item)}
                            disabled={submitting || Boolean(editingItem)}
                          >
                            <Pencil className="h-4 w-4" />
                            Düzenle
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => void handleDelete(item)}
                            disabled={submitting}
                          >
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

export default AdminResourceLinksPage;
