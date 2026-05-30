import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ExternalLink, MapPin, MessageSquare, Pencil, RefreshCw, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  deleteLanding,
  listAllSubmissions,
  setLandingStatus,
  type LandingCategory,
  type LandingStatus,
  type UpdateLandingInput,
  type WhatsAppLanding,
  updateLanding,
} from "@/lib/whatsapp-landings";

const statusBadgeClass: Record<LandingStatus, string> = {
  pending: "border-amber-200 bg-amber-100 text-amber-800",
  approved: "border-emerald-200 bg-emerald-100 text-emerald-800",
  rejected: "border-rose-200 bg-rose-100 text-rose-800",
};

const statusLabel: Record<LandingStatus, string> = {
  pending: "Beklemede",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};

const categoryOptions: Array<{ value: LandingCategory; label: string }> = [
  { value: "alumni", label: "Alumni" },
  { value: "hobi", label: "Hobi" },
  { value: "is", label: "İş Grubu" },
  { value: "doktor", label: "Doktor / Sağlık" },
  { value: "yatirim", label: "Yatırım" },
  { value: "girisim", label: "Girişim" },
  { value: "akademik", label: "Akademik" },
  { value: "dayanisma", label: "Dayanışma" },
  { value: "diger", label: "Diğer" },
];

const platformOptions = [
  "WhatsApp",
  "Telegram",
  "Discord",
  "Facebook",
  "Instagram",
  "LinkedIn",
  "X",
  "TikTok",
  "YouTube",
  "Reddit",
] as const;

type EditLandingState = UpdateLandingInput & {
  dbId: string;
  slug: string;
  platform: string;
  adminEmail: string;
  adminPhone: string;
  memberApproved: boolean;
  adminApproved: boolean;
};

type ApprovalSelection = "member" | "admin";

function getApprovalSelection(memberApproved: boolean, adminApproved: boolean): ApprovalSelection {
  if (adminApproved) return "admin";
  return "member";
}

function parseAdminContact(adminContact?: string) {
  const lines = adminContact?.split("\n").map((line) => line.trim()).filter(Boolean) ?? [];
  const emailLine = lines.find((line) => line.toLowerCase().startsWith("e-posta:"));
  const phoneLine = lines.find((line) => line.toLowerCase().startsWith("telefon:"));
  const emailMatch = adminContact?.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = adminContact?.match(/(\+?\d[\d\s().-]{6,}\d)/);

  return {
    adminEmail: emailLine ? emailLine.replace(/^e-posta:\s*/i, "").trim() : (emailMatch?.[0] ?? ""),
    adminPhone: phoneLine ? phoneLine.replace(/^telefon:\s*/i, "").trim() : (phoneMatch?.[0]?.trim() ?? ""),
  };
}

function createEditState(row: WhatsAppLanding): EditLandingState | null {
  if (!row.dbId) return null;
  const { adminEmail, adminPhone } = parseAdminContact(row.adminContact);
  const approvalSelection = getApprovalSelection(row.memberApproved ?? true, row.adminApproved ?? false);

  return {
    dbId: row.dbId,
    slug: row.id,
    groupName: row.groupName,
    platform: row.platform ?? "WhatsApp",
    category: row.category,
    country: row.country,
    city: row.city,
    mode: row.mode,
    heroImage: row.heroImage ?? "",
    tagline: "",
    callToActionText: row.callToActionText ?? "",
    conditions: row.conditions ?? "",
    whatsappLink: row.whatsappLink,
    adminName: row.adminName ?? "",
    adminContact: row.adminContact ?? "",
    description: row.description ?? "",
    adminEmail,
    adminPhone,
    memberApproved: approvalSelection === "member",
    adminApproved: approvalSelection === "admin",
  };
}

export default function WhatsAppLandingsModeration() {
  const { toast } = useToast();
  const [tab, setTab] = useState<LandingStatus>("pending");
  const [rows, setRows] = useState<WhatsAppLanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editState, setEditState] = useState<EditLandingState | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const load = async (status: LandingStatus) => {
    setLoading(true);
    setRows(await listAllSubmissions(status));
    setLoading(false);
  };

  useEffect(() => {
    void load(tab);
  }, [tab]);

  const platformLabelByRowId = useMemo(
    () =>
      rows.reduce<Record<string, string>>((accumulator, row) => {
        accumulator[row.dbId ?? row.id] = row.platform?.trim() || "Belirtilmedi";
        return accumulator;
      }, {}),
    [rows],
  );

  const handleStatus = async (dbId: string, status: LandingStatus) => {
    try {
      await setLandingStatus(dbId, status);
      toast({ title: status === "approved" ? "Başvuru onaylandı" : "Başvuru reddedildi" });
      await load(tab);
    } catch (error) {
      toast({
        title: "İşlem başarısız",
        description: error instanceof Error ? error.message : "Beklenmeyen hata",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (dbId: string) => {
    if (!window.confirm("Bu başvuruyu silmek istediğinize emin misiniz?")) return;

    try {
      await deleteLanding(dbId);
      toast({ title: "Başvuru silindi" });
      await load(tab);
    } catch (error) {
      toast({
        title: "Silme başarısız",
        description: error instanceof Error ? error.message : "Beklenmeyen hata",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (row: WhatsAppLanding) => {
    const nextState = createEditState(row);
    if (!nextState) return;
    setEditState(nextState);
    setEditOpen(true);
  };

  const updateEditState = <K extends keyof EditLandingState>(field: K, value: EditLandingState[K]) => {
    setEditState((current) => (current ? { ...current, [field]: value } : current));
  };

  const setApprovalSelection = (value: ApprovalSelection) => {
    setEditState((current) => {
      if (!current) return current;

      return {
        ...current,
        memberApproved: value === "member",
        adminApproved: value === "admin",
      };
    });
  };

  const handleEditSave = async () => {
    if (!editState) return;
    const approvalSelection = getApprovalSelection(editState.memberApproved, editState.adminApproved);

    try {
      setSavingEdit(true);
      await updateLanding(editState.dbId, {
        groupName: editState.groupName,
        category: editState.category,
        country: editState.country,
        city: editState.city,
        mode: editState.mode,
        heroImage: editState.heroImage,
        tagline: "",
        callToActionText: editState.callToActionText,
        conditions: editState.conditions,
        whatsappLink: editState.whatsappLink,
        adminName: editState.adminName,
        adminContact: [
          editState.adminEmail.trim() ? `E-posta: ${editState.adminEmail.trim()}` : "",
          editState.adminPhone.trim() ? `Telefon: ${editState.adminPhone.trim()}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        description: [
          editState.description
            .replace(/\[Platform:\s*[^\]]+\]\s*/gi, "")
            .replace(/\[Badge member:\s*(true|false)\]\s*/gi, "")
            .replace(/\[Badge admin:\s*(true|false)\]\s*/gi, "")
            .trim(),
          `[Platform: ${editState.platform}]`,
          `[Badge member: ${approvalSelection === "member" ? "true" : "false"}]`,
          `[Badge admin: ${approvalSelection === "admin" ? "true" : "false"}]`,
        ]
          .filter(Boolean)
          .join(" ")
          .trim(),
      });
      toast({ title: "Topluluk kaydı güncellendi" });
      setEditOpen(false);
      setEditState(null);
      await load(tab);
    } catch (error) {
      toast({
        title: "Güncelleme başarısız",
        description: error instanceof Error ? error.message : "Beklenmeyen hata",
        variant: "destructive",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            Topluluk Başvuruları
          </h2>
          <p className="text-sm text-muted-foreground">
            Başvuruları tek satırda inceleyin, düzenleyin ve moderasyon kararını verin.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void load(tab)}>
          <RefreshCw className="h-3.5 w-3.5" />
          Yenile
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as LandingStatus)}>
        <TabsList>
          <TabsTrigger value="pending">Beklemede</TabsTrigger>
          <TabsTrigger value="approved">Onaylı</TabsTrigger>
          <TabsTrigger value="rejected">Reddedilen</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Yükleniyor...</p>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Bu durumda kayıt yok.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <div className="min-w-[1280px]">
                <div className="grid grid-cols-[2fr_1fr_1.1fr_1fr_1.2fr_2fr] gap-3 border-b border-border bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <span>Topluluk</span>
                  <span>Durum</span>
                  <span>Platform</span>
                  <span>Başvuru</span>
                  <span>Konum</span>
                  <span className="text-right">Aksiyonlar</span>
                </div>

                {rows.map((row) => (
                  <div
                    key={row.dbId}
                    className="grid grid-cols-[2fr_1fr_1.1fr_1fr_1.2fr_2fr] items-center gap-3 border-b border-border/80 px-4 py-3 text-sm last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{row.groupName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {row.callToActionText || "Çağrı metni yok"}
                      </p>
                    </div>

                    <div>
                      <Badge className={statusBadgeClass[(row.status ?? "pending") as LandingStatus]}>
                        {statusLabel[(row.status ?? "pending") as LandingStatus]}
                      </Badge>
                    </div>

                    <div className="truncate text-muted-foreground">
                      {platformLabelByRowId[row.dbId ?? row.id]}
                    </div>

                    <div className="truncate text-muted-foreground">
                      {row.submitterRole === "manager" ? "Topluluk Yöneticisi" : row.submitterRole === "member" ? "Üye" : "Belirtilmedi"}
                    </div>

                    <div className="flex min-w-0 items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {row.city}, {row.country}
                      </span>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openEditDialog(row)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Düzenle
                      </Button>
                      <a href={row.whatsappLink} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Topluluk Linki
                        </Button>
                      </a>
                      <Link to={`/addcom?group=${encodeURIComponent(row.id)}`}>
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Önizle
                        </Button>
                      </Link>
                      {row.status !== "approved" && row.dbId ? (
                        <Button
                          size="sm"
                          className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                          onClick={() => void handleStatus(row.dbId!, "approved")}
                        >
                          <Check className="h-3.5 w-3.5" />
                          Onayla
                        </Button>
                      ) : null}
                      {row.status !== "rejected" && row.dbId ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1.5"
                          onClick={() => void handleStatus(row.dbId!, "rejected")}
                        >
                          <X className="h-3.5 w-3.5" />
                          Reddet
                        </Button>
                      ) : null}
                      {row.dbId ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5 text-destructive hover:text-destructive"
                          onClick={() => void handleDelete(row.dbId!)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Sil
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditState(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Topluluk Bilgilerini Düzenle</DialogTitle>
          </DialogHeader>

          {editState ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-group-name">Topluluk Adı</Label>
                <Input
                  id="edit-group-name"
                  lang="tr"
                  spellCheck
                  value={editState.groupName}
                  onChange={(event) => updateEditState("groupName", event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <Select value={editState.category} onValueChange={(value) => updateEditState("category", value as LandingCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Platform</Label>
                <Select value={editState.platform} onValueChange={(value) => updateEditState("platform", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {platformOptions.map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-country">Ülke</Label>
                <Input
                  id="edit-country"
                  lang="tr"
                  spellCheck
                  value={editState.country}
                  onChange={(event) => updateEditState("country", event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-city">Şehir</Label>
                <Input
                  id="edit-city"
                  lang="tr"
                  spellCheck
                  value={editState.city}
                  onChange={(event) => updateEditState("city", event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-link">Topluluk Linki</Label>
                <Input
                  id="edit-link"
                  value={editState.whatsappLink}
                  onChange={(event) => updateEditState("whatsappLink", event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-hero-image">Hero Görsel URL</Label>
                <Input
                  id="edit-hero-image"
                  value={editState.heroImage}
                  onChange={(event) => updateEditState("heroImage", event.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-admin-name">Yönetici Adı</Label>
                <Input
                  id="edit-admin-name"
                  lang="tr"
                  spellCheck
                  value={editState.adminName}
                  onChange={(event) => updateEditState("adminName", event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-admin-email">Yönetici Mail</Label>
                <Input
                  id="edit-admin-email"
                  type="email"
                  value={editState.adminEmail}
                  onChange={(event) => updateEditState("adminEmail", event.target.value)}
                  placeholder="ornek@email.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-admin-phone">Yönetici Telefon</Label>
                <Input
                  id="edit-admin-phone"
                  value={editState.adminPhone}
                  onChange={(event) => updateEditState("adminPhone", event.target.value)}
                  placeholder="+44 20 0000 0000"
                />
              </div>

              <div className="space-y-2">
                <Label>Onay Badge'leri</Label>
                <RadioGroup
                  value={getApprovalSelection(editState.memberApproved, editState.adminApproved)}
                  onValueChange={(value) => setApprovalSelection(value as ApprovalSelection)}
                  className="grid gap-2 sm:grid-cols-2"
                >
                  <label
                    htmlFor="approval-member"
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                      editState.memberApproved
                        ? "border-sky-600 bg-sky-500 text-white"
                        : "border-border bg-background text-foreground"
                    }`}
                  >
                    <RadioGroupItem
                      id="approval-member"
                      value="member"
                      className={editState.memberApproved ? "border-white text-white" : "border-sky-600 text-sky-600"}
                    />
                    <span className="font-medium">Üye onaylı!</span>
                  </label>

                  <label
                    htmlFor="approval-admin"
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                      editState.adminApproved
                        ? "border-orange-600 bg-orange-500 text-white"
                        : "border-border bg-background text-foreground"
                    }`}
                  >
                    <RadioGroupItem
                      id="approval-admin"
                      value="admin"
                      className={editState.adminApproved ? "border-white text-white" : "border-orange-600 text-orange-600"}
                    />
                    <span className="font-medium">Admin onaylı!</span>
                  </label>
                </RadioGroup>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-call-to-action">Yeni Üyeler İçin Mesaj</Label>
                <Textarea
                  id="edit-call-to-action"
                  lang="tr"
                  spellCheck
                  rows={4}
                  value={editState.callToActionText}
                  onChange={(event) => updateEditState("callToActionText", event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-conditions">Topluluk Kuralları</Label>
                <Textarea
                  id="edit-conditions"
                  lang="tr"
                  spellCheck
                  rows={4}
                  value={editState.conditions}
                  onChange={(event) => updateEditState("conditions", event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-description">Açıklama / Metadata</Label>
                <Textarea
                  id="edit-description"
                  lang="tr"
                  spellCheck
                  rows={4}
                  value={editState.description}
                  onChange={(event) => updateEditState("description", event.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditOpen(false)} disabled={savingEdit}>
                  Vazgeç
                </Button>
                <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => void handleEditSave()} disabled={savingEdit}>
                  {savingEdit ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
