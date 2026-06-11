import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Instagram, Mail, MessageCircle, Pencil, Phone, Plus, Save, Trash2, X } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  advisorProfileSections,
  createAdvisorResourceLink,
  createEmptyAdvisorResourceLinkFormState,
  deleteResourceLink,
  listAdvisorResourceLinks,
  resourceLinkAuthors,
  toAdvisorResourceLinkFormState,
  toAdvisorResourceLinkPayload,
  updateAdvisorContactStatus,
  updateAdvisorResourceLink,
  type AdvisorContactStatusKey,
  type AdvisorResourceLinkFormState,
  type AdvisorResourceLinkRow,
  type ResourceLinkAuthor,
} from "@/lib/resource-links";

const contactChannels: Array<{
  key: AdvisorContactStatusKey;
  label: string;
  Icon: typeof MessageCircle;
}> = [
  { key: "contacted_whatsapp", label: "WhatsApp", Icon: MessageCircle },
  { key: "contacted_instagram", label: "Instagram", Icon: Instagram },
  { key: "contacted_email", label: "Mail", Icon: Mail },
  { key: "contacted_phone", label: "Telefon", Icon: Phone },
];

type ContactStatusButtonsProps = {
  values: Pick<
    AdvisorResourceLinkFormState,
    "contacted_whatsapp" | "contacted_instagram" | "contacted_email" | "contacted_phone"
  >;
  disabled?: boolean;
  onToggle: (key: AdvisorContactStatusKey, value: boolean) => void;
};

const ContactStatusButtons = ({ values, disabled, onToggle }: ContactStatusButtonsProps) => (
  <div className="flex flex-wrap gap-2">
    {contactChannels.map(({ key, label, Icon }) => {
      const contacted = values[key];

      return (
        <Button
          key={key}
          type="button"
          size="icon"
          variant="outline"
          aria-label={`${label}: ${contacted ? "iletişim kuruldu" : "iletişim kurulmadı"}`}
          title={`${label}: ${contacted ? "iletişim kuruldu" : "iletişim kurulmadı"}`}
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            onToggle(key, !contacted);
          }}
          className={
            contacted
              ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
          }
        >
          <Icon className="h-4 w-4" />
        </Button>
      );
    })}
  </div>
);

type ContactInfoIconsProps = {
  item: AdvisorResourceLinkRow;
};

const ContactInfoIcons = ({ item }: ContactInfoIconsProps) => {
  const instagram = item.instagram || item.link;
  const values = [
    { label: "WhatsApp", value: item.whatsapp, Icon: MessageCircle },
    { label: "Instagram", value: instagram, Icon: Instagram },
    { label: "Mail", value: item.email, Icon: Mail },
    { label: "Telefon", value: item.phone, Icon: Phone },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {values.map(({ label, value, Icon }) => (
        <span
          key={label}
          title={value ? `${label}: ${value}` : `${label} yok`}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-md border",
            value ? "border-primary/30 bg-primary/5 text-primary" : "border-muted bg-muted/30 text-muted-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      ))}
    </div>
  );
};

const AdminAdvisorLinksPage = () => {
  const { toast } = useToast();
  const { profile } = useParams<{ profile: string }>();
  const [items, setItems] = useState<AdvisorResourceLinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | null>(null);
  const [createAccordionValue, setCreateAccordionValue] = useState<string | undefined>();
  const [form, setForm] = useState<AdvisorResourceLinkFormState>(() => createEmptyAdvisorResourceLinkFormState());
  const [editingForm, setEditingForm] = useState<AdvisorResourceLinkFormState>(() =>
    createEmptyAdvisorResourceLinkFormState(),
  );

  const activeProfile = useMemo(() => {
    if (!profile) return null;
    return advisorProfileSections.find((section) => section.key === profile) ?? null;
  }, [profile]);
  const editingItem = useMemo(() => items.find((item) => item.id === editingId) ?? null, [editingId, items]);
  const selectedAdvisor = useMemo(
    () => items.find((item) => item.id === selectedAdvisorId) ?? null,
    [items, selectedAdvisorId],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const nextItems = await listAdvisorResourceLinks(activeProfile.tableName);
      setItems(nextItems);
      setSelectedAdvisorId((current) =>
        current && nextItems.some((item) => item.id === current) ? current : nextItems[0]?.id ?? null,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bilinmeyen hata";
      toast({ title: `${activeProfile.label} kayıtları yüklenemedi`, description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [activeProfile, toast]);

  useEffect(() => {
    if (!activeProfile) return;
    void refresh();
  }, [activeProfile, refresh]);

  useEffect(() => {
    setItems([]);
    setEditingId(null);
    setSelectedAdvisorId(null);
    setCreateAccordionValue(undefined);
    setForm(createEmptyAdvisorResourceLinkFormState());
    setEditingForm(createEmptyAdvisorResourceLinkFormState());
  }, [activeProfile]);

  const updateForm = <Key extends keyof AdvisorResourceLinkFormState>(
    key: Key,
    value: AdvisorResourceLinkFormState[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateEditingForm = <Key extends keyof AdvisorResourceLinkFormState>(
    key: Key,
    value: AdvisorResourceLinkFormState[Key],
  ) => {
    setEditingForm((current) => ({ ...current, [key]: value }));
  };

  const startEdit = (item: AdvisorResourceLinkRow) => {
    setSelectedAdvisorId(item.id);
    setEditingId(item.id);
    setEditingForm(toAdvisorResourceLinkFormState(item));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingForm(createEmptyAdvisorResourceLinkFormState());
  };

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const created = await createAdvisorResourceLink(activeProfile.tableName, toAdvisorResourceLinkPayload(form));
      setItems((current) => [created, ...current]);
      setSelectedAdvisorId(created.id);
      setCreateAccordionValue(undefined);
      setForm(createEmptyAdvisorResourceLinkFormState());
      toast({ title: `${activeProfile.label} kaydı eklendi` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Eklenemedi";
      toast({ title: `${activeProfile.label} kaydı eklenemedi`, description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setSubmitting(true);
    try {
      const updated = await updateAdvisorResourceLink(activeProfile.tableName, id, toAdvisorResourceLinkPayload(editingForm));
      setItems((current) => current.map((item) => (item.id === id ? updated : item)));
      setSelectedAdvisorId(updated.id);
      cancelEdit();
      toast({ title: `${activeProfile.label} kaydı güncellendi` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Güncellenemedi";
      toast({ title: `${activeProfile.label} kaydı güncellenemedi`, description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickToggle = async (item: AdvisorResourceLinkRow, key: AdvisorContactStatusKey, value: boolean) => {
    setSubmitting(true);
    setItems((current) =>
      current.map((currentItem) => (currentItem.id === item.id ? { ...currentItem, [key]: value } : currentItem)),
    );
    try {
      const updated = await updateAdvisorContactStatus(activeProfile.tableName, item.id, key, value);
      setItems((current) => current.map((currentItem) => (currentItem.id === item.id ? updated : currentItem)));
    } catch (error) {
      setItems((current) => current.map((currentItem) => (currentItem.id === item.id ? item : currentItem)));
      const message = error instanceof Error ? error.message : "Güncellenemedi";
      toast({ title: "İletişim durumu güncellenemedi", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: AdvisorResourceLinkRow) => {
    if (!window.confirm(`"${item.name}" ${activeProfile.label} kaydı silinsin mi?`)) return;

    setSubmitting(true);
    try {
      await deleteResourceLink(activeProfile.tableName, item.id);
      setItems((current) => {
        const nextItems = current.filter((currentItem) => currentItem.id !== item.id);
        if (selectedAdvisorId === item.id) setSelectedAdvisorId(nextItems[0]?.id ?? null);
        return nextItems;
      });
      if (editingId === item.id) cancelEdit();
      toast({ title: `${activeProfile.label} kaydı silindi` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Silinemedi";
      toast({ title: `${activeProfile.label} kaydı silinemedi`, description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const renderEditor = (
    state: AdvisorResourceLinkFormState,
    onChange: <Key extends keyof AdvisorResourceLinkFormState>(
      key: Key,
      value: AdvisorResourceLinkFormState[Key],
    ) => void,
    submitLabel: string,
    onSubmit: () => void,
    onCancel?: () => void,
  ) => (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Input
          value={state.name}
          onChange={(event) => onChange("name", event.target.value)}
          placeholder="Ad"
          required
        />
        <Input
          type="email"
          value={state.email}
          onChange={(event) => onChange("email", event.target.value)}
          placeholder="Email"
        />
        <Input
          type="tel"
          value={state.phone}
          onChange={(event) => onChange("phone", event.target.value)}
          placeholder="Telefon"
        />
        <Input
          value={state.whatsapp}
          onChange={(event) => onChange("whatsapp", event.target.value)}
          placeholder="WhatsApp"
        />
        <Input
          value={state.instagram}
          onChange={(event) => onChange("instagram", event.target.value)}
          placeholder="Instagram"
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
      </div>
      <Textarea
        value={state.description}
        onChange={(event) => onChange("description", event.target.value)}
        placeholder="Açıklama / not"
        rows={3}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ContactStatusButtons
          values={state}
          disabled={submitting}
          onToggle={(key, value) => onChange(key, value)}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={onSubmit} disabled={submitting}>
            {onCancel ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
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
    </div>
  );

  if (!activeProfile) {
    return <Navigate to="/admin/advisors/consultant" replace />;
  }

  return (
    <div className="space-y-6">
      <Accordion
        type="single"
        collapsible
        value={createAccordionValue}
        onValueChange={setCreateAccordionValue}
        className="w-full"
      >
        <AccordionItem value="create-advisor" className="rounded-lg border bg-card px-6">
          <AccordionTrigger className="hover:no-underline">
            <div className="text-left">
              <div className="text-lg font-semibold">Yeni {activeProfile.label} ekle</div>
              <div className="text-sm font-normal text-muted-foreground">
                {activeProfile.label} iletişim bilgilerini ve ilk ulaşım durumunu kaydedin.
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {renderEditor(form, updateForm, submitting ? "Kaydediliyor..." : "Yeni ekle", () => void handleCreate())}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Card>
        <CardHeader>
          <CardTitle>Seçilen {activeProfile.label}</CardTitle>
          <CardDescription>Seçili kaydın iletişim bilgileri ve ulaşım durumu.</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedAdvisor ? (
            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_auto]">
              <div>
                <div className="text-lg font-semibold">{selectedAdvisor.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">{selectedAdvisor.description || "-"}</div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {selectedAdvisor.added_by} · {new Date(selectedAdvisor.created_at).toLocaleDateString("tr-TR")}
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div>Mail: {selectedAdvisor.email || "-"}</div>
                <div>Telefon: {selectedAdvisor.phone || "-"}</div>
                <div>WhatsApp: {selectedAdvisor.whatsapp || "-"}</div>
                <div>Instagram: {selectedAdvisor.instagram || selectedAdvisor.link || "-"}</div>
              </div>
              <ContactStatusButtons
                values={selectedAdvisor}
                disabled={submitting}
                onToggle={(key, value) => void handleQuickToggle(selectedAdvisor, key, value)}
              />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Henüz seçili danışman yok.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mevcut {activeProfile.label} Kayıtları</CardTitle>
          <CardDescription>Yeşil ikon iletişim kurulduğunu, kırmızı ikon henüz kurulmadığını gösterir.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{activeProfile.label}</TableHead>
                <TableHead>İletişim Bilgileri</TableHead>
                <TableHead>Durum</TableHead>
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
                  <TableCell colSpan={6}>Henüz {activeProfile.label} kaydı yok.</TableCell>
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
                    <TableRow
                      key={item.id}
                      data-state={selectedAdvisorId === item.id ? "selected" : undefined}
                      onClick={() => setSelectedAdvisorId(item.id)}
                      className={cn("cursor-pointer", selectedAdvisorId === item.id && "bg-muted/60")}
                    >
                      <TableCell className="min-w-52 align-top">
                        <div className="font-medium">{item.name}</div>
                        <div className="mt-1 max-w-sm text-sm text-muted-foreground">{item.description || "-"}</div>
                      </TableCell>
                      <TableCell className="align-top">
                        <ContactInfoIcons item={item} />
                      </TableCell>
                      <TableCell className="align-top">
                        <ContactStatusButtons
                          values={item}
                          disabled={submitting}
                          onToggle={(key, value) => void handleQuickToggle(item, key, value)}
                        />
                      </TableCell>
                      <TableCell className="align-top">{item.added_by}</TableCell>
                      <TableCell className="align-top">
                        {new Date(item.created_at).toLocaleDateString("tr-TR")}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              startEdit(item);
                            }}
                            disabled={submitting || Boolean(editingItem)}
                          >
                            <Pencil className="h-4 w-4" />
                            Düzenle
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleDelete(item);
                            }}
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

export default AdminAdvisorLinksPage;
