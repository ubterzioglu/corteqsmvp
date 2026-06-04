import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import {
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Check, ExternalLink, Instagram, Mail, MessageCircle, Pencil, Phone, RefreshCcw, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { isValidWhatsappPhone, normalizePhone } from "@/lib/lansman";
import {
import {
  categoryOptions,
  formatBytes,
  getCategoryLabel,
  getSubmissionDocumentAccessUrl,
  getSubmissionDocuments,
  getSubmissionDocumentsBucketLevel,
  getSubmissionDocumentsBucketStats,
  getFormTypeLabel,
  getReferralSourceLabel,
  getStatusLabel,
  referralSourceOptions,
  type Submission,
  type SubmissionDocumentsBucketStats,
  type SubmissionStatus,
} from "@/lib/submissions";
import { normalizeTurkishText } from "@/lib/text-normalization";

const DEFAULT_PAGE_SIZE = 20;
const AI_CHAT_REFERRAL_SOURCE = "ai-chat";

type MemberSourceType = "form" | "chatbot" | "wa";
type AdminMemberRow = Omit<Submission, "source_type"> & {
  source_type: MemberSourceType;
};

function useDebouncedValue<T>(value: T, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, value]);
  return debounced;
}

function parseBool(value: string | null): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function getSubmissionSourceType(submission: Submission): MemberSourceType {
  if (submission.source_type === "wa") return "wa";
  if (submission.source_type === "chatbot") return "chatbot";
  if (submission.referral_source === AI_CHAT_REFERRAL_SOURCE) return "chatbot";
  return "form";
}

function buildWhatsappHref(phone: string | null) {
  const trimmedPhone = phone?.trim();
  if (!trimmedPhone) return null;

  const normalizedPhone = normalizePhone(trimmedPhone);
  if (!isValidWhatsappPhone(normalizedPhone)) return null;

  return `https://wa.me/${normalizedPhone.replace(/^\+/, "")}`;
}

function getSourceLabel(sourceType: MemberSourceType) {
  if (sourceType === "wa") return "WA Bot";
  if (sourceType === "chatbot") return "Chatbot";
  return "Form";
}

function getSourceBadgeClass(sourceType: MemberSourceType) {
  if (sourceType === "wa") {
    return "border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
  }
  if (sourceType === "chatbot") {
    return "border-sky-300 bg-sky-100 text-sky-800 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200";
  }
  return "border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";
}

function sanitizeCsvCell(value: unknown): string {
  const stringValue = String(value ?? "");
  return /^[=+\-@]/.test(stringValue) ? `'${stringValue}` : stringValue;
}

function toSubmissionMemberRow(submission: Submission): AdminMemberRow {
  return {
    ...submission,
    source_type: getSubmissionSourceType(submission),
  };
}

type RowDraft = {
  fullname: string;
  email: string;
  city: string;
  status: SubmissionStatus;
};

type DetailDraft = {
  fullname: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  status: SubmissionStatus;
  referral_source: string;
  referral_code: string;
  contact_phone_reached: boolean;
  contact_whatsapp_reached: boolean;
  contact_instagram_reached: boolean;
  contact_email_reached: boolean;
};

type ContactChannelKey =
  | "contact_phone_reached"
  | "contact_whatsapp_reached"
  | "contact_instagram_reached"
  | "contact_email_reached";

const contactChannelOptions: Array<{
  key: ContactChannelKey;
  label: string;
  Icon: typeof Phone;
}> = [
  { key: "contact_phone_reached", label: "Telefon", Icon: Phone },
  { key: "contact_whatsapp_reached", label: "WhatsApp", Icon: MessageCircle },
  { key: "contact_instagram_reached", label: "Instagram", Icon: Instagram },
  { key: "contact_email_reached", label: "Mail", Icon: Mail },
];

const documentsBucketLevelStyles = {
  normal: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200",
  info: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
  warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  critical: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200",
} as const;

const documentsBucketLevelLabels = {
  normal: "Normal",
  info: "Yaklaşıyor",
  warning: "Uyarı",
  critical: "Kritik",
} as const;

const AdminMembersPage = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [rows, setRows] = useState<AdminMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [formMemberCount, setFormMemberCount] = useState(0);
  const [chatbotMemberCount, setChatbotMemberCount] = useState(0);
  const [waMemberCount, setWaMemberCount] = useState(0);
  const [memberCountsLoading, setMemberCountsLoading] = useState(true);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [savingSubmissionId, setSavingSubmissionId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [rowDraft, setRowDraft] = useState<RowDraft | null>(null);
  const [isDetailEditing, setIsDetailEditing] = useState(false);
  const [detailDraft, setDetailDraft] = useState<DetailDraft | null>(null);
  const [documentsBucketStats, setDocumentsBucketStats] = useState<SubmissionDocumentsBucketStats | null>(null);
  const [documentsBucketLoading, setDocumentsBucketLoading] = useState(true);
  const [documentsBucketError, setDocumentsBucketError] = useState("");
  const [openingDocumentKey, setOpeningDocumentKey] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [importCsvText, setImportCsvText] = useState("");

  const action = searchParams.get("action");

  useEffect(() => {
    if (action === "create-member") setCreateOpen(true);
    if (action === "import-export") setImportOpen(true);
    if (action === "bulk") setBulkOpen(true);
  }, [action]);

  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE));
  const sortBy = searchParams.get("sortBy") ?? "created_at";
  const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";
  const statusFilter = searchParams.get("status") ?? "";
  const formTypeFilter = searchParams.get("formType") ?? "";
  const categoryFilter = searchParams.get("category") ?? "";
  const referralSourceFilter = searchParams.get("referralSource") ?? "";
  const sourceTypeFilter = searchParams.get("sourceType") ?? "";
  const fromDate = searchParams.get("fromDate") ?? "";
  const toDate = searchParams.get("toDate") ?? "";
  const whatsappFilter = parseBool(searchParams.get("whatsapp"));
  const contestFilter = parseBool(searchParams.get("contest"));

  const [fullnameInput, setFullnameInput] = useState(searchParams.get("fullname") ?? "");
  const [emailInput, setEmailInput] = useState(searchParams.get("email") ?? "");
  const [cityInput, setCityInput] = useState(searchParams.get("city") ?? "");
  const debouncedFullname = useDebouncedValue(fullnameInput);
  const debouncedEmail = useDebouncedValue(emailInput);
  const debouncedCity = useDebouncedValue(cityInput);
  const fullnameParam = searchParams.get("fullname") ?? "";
  const emailParam = searchParams.get("email") ?? "";
  const cityParam = searchParams.get("city") ?? "";

  useEffect(() => {
    if (
      debouncedFullname === fullnameParam &&
      debouncedEmail === emailParam &&
      debouncedCity === cityParam
    ) {
      return;
    }

    const next = new URLSearchParams(searchParams);
    if (debouncedFullname) next.set("fullname", debouncedFullname); else next.delete("fullname");
    if (debouncedEmail) next.set("email", debouncedEmail); else next.delete("email");
    if (debouncedCity) next.set("city", debouncedCity); else next.delete("city");
    next.set("page", "1");
    setSearchParams(next, { replace: true });
  }, [
    cityParam,
    debouncedCity,
    debouncedEmail,
    debouncedFullname,
    emailParam,
    fullnameParam,
    searchParams,
    setSearchParams,
  ]);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value == null || value === "") next.delete(key); else next.set(key, value);
    if (key !== "page") next.set("page", "1");
    setSearchParams(next, { replace: true });
  };

  const fetchMemberCounts = useCallback(async () => {
    setMemberCountsLoading(true);

    const [submissionResult, chatbotResult, waResult] = await Promise.all([
      supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("source_type", "form")
        .neq("status", "archived"),
      supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("source_type", "chatbot")
        .neq("status", "archived"),
      supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("source_type", "wa")
        .neq("status", "archived"),
    ]);

    if (submissionResult.error || chatbotResult.error || waResult.error) {
      console.error(submissionResult.error ?? chatbotResult.error ?? waResult.error);
      setChatbotMemberCount(0);
      setWaMemberCount(0);
      setFormMemberCount(0);
    } else {
      setChatbotMemberCount(chatbotResult.count ?? 0);
      setWaMemberCount(waResult.count ?? 0);
      setFormMemberCount(submissionResult.count ?? 0);
    }

    setMemberCountsLoading(false);
  }, []);

  const fetchDocumentsBucketStats = useCallback(async () => {
    setDocumentsBucketLoading(true);
    try {
      const nextStats = await getSubmissionDocumentsBucketStats();
      setDocumentsBucketStats(nextStats);
      setDocumentsBucketError("");
    } catch (error) {
      console.error(error);
      setDocumentsBucketError("Doküman kapasite özeti şu anda alınamıyor.");
    } finally {
      setDocumentsBucketLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMemberCounts();
  }, [fetchMemberCounts]);

  useEffect(() => {
    void fetchDocumentsBucketStats();
    const intervalId = window.setInterval(() => {
      void fetchDocumentsBucketStats();
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, [fetchDocumentsBucketStats]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      let query = supabase.from("submissions").select("*", { count: "exact" });

      if (debouncedFullname) query = query.ilike("fullname", `%${debouncedFullname}%`);
      if (debouncedEmail) query = query.ilike("email", `%${debouncedEmail}%`);
      if (debouncedCity) query = query.ilike("city", `%${debouncedCity}%`);
      if (statusFilter) query = query.eq("status", statusFilter);
      else query = query.neq("status", "archived");
      if (formTypeFilter) query = query.eq("form_type", formTypeFilter);
      if (categoryFilter) query = query.eq("category", categoryFilter);
      if (referralSourceFilter) query = query.eq("referral_source", referralSourceFilter);
      if (sourceTypeFilter) query = query.eq("source_type", sourceTypeFilter);
      if (whatsappFilter !== null) query = query.eq("whatsapp_interest", whatsappFilter);
      if (contestFilter !== null) query = query.eq("contest_interest", contestFilter);
      if (fromDate) query = query.gte("created_at", `${fromDate}T00:00:00.000Z`);
      if (toDate) query = query.lte("created_at", `${toDate}T23:59:59.999Z`);

      const start = (Math.max(page, 1) - 1) * Math.max(pageSize, 1);
      const end = start + Math.max(pageSize, 1) - 1;
      const { data, count, error } = await query.order(sortBy, { ascending: sortDir === "asc" }).range(start, end);

      if (cancelled) return;

      if (error) {
        console.error(error);
        toast({ title: "Kayıtlar yüklenemedi", description: error.message, variant: "destructive" });
        setRows([]);
        setTotalCount(0);
      } else {
        setRows((data ?? []).map(toSubmissionMemberRow));
        setTotalCount(count ?? 0);
      }
      setLoading(false);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    categoryFilter,
    contestFilter,
    debouncedCity,
    debouncedEmail,
    debouncedFullname,
    formTypeFilter,
    fromDate,
    page,
    pageSize,
    referralSourceFilter,
    sortBy,
    sortDir,
    sourceTypeFilter,
    statusFilter,
    toDate,
    toast,
    whatsappFilter,
  ]);

  useEffect(() => {
    if (!rows.length) {
      setSelectedSubmissionId(null);
      return;
    }
    if (selectedSubmissionId && !rows.some((submission) => submission.id === selectedSubmissionId)) {
      setSelectedSubmissionId(null);
    }
  }, [rows, selectedSubmissionId]);

  useEffect(() => {
    setIsDetailEditing(false);
    setDetailDraft(null);
  }, [selectedSubmissionId]);

  useEffect(() => {
    if (editingRowId && !rows.some((submission) => submission.id === editingRowId)) {
      setEditingRowId(null);
      setRowDraft(null);
    }
  }, [editingRowId, rows]);

  const selectedSubmission = useMemo(
    () => rows.find((submission) => submission.id === selectedSubmissionId) ?? null,
    [rows, selectedSubmissionId],
  );

  const selectedIds = useMemo(
    () => Object.entries(rowSelection).filter(([, checked]) => checked).map(([id]) => id),
    [rowSelection],
  );

  const toRowDraft = (submission: AdminMemberRow): RowDraft => ({
    fullname: submission.fullname,
    email: submission.email,
    city: submission.city,
    status: submission.status,
  });

  const toDetailDraft = (submission: AdminMemberRow): DetailDraft => ({
    fullname: submission.fullname,
    email: submission.email,
    phone: submission.phone,
    country: submission.country,
    city: submission.city,
    status: submission.status,
    referral_source: submission.referral_source ?? "",
    referral_code: submission.referral_code ?? "",
    contact_phone_reached: submission.contact_phone_reached ?? false,
    contact_whatsapp_reached: submission.contact_whatsapp_reached ?? false,
    contact_instagram_reached: submission.contact_instagram_reached ?? false,
    contact_email_reached: submission.contact_email_reached ?? false,
  });

  const updateSubmission = useCallback(async (
    submissionId: string,
    patch: Partial<Submission>,
    successTitle = "Kayıt güncellendi",
  ) => {
    setSavingSubmissionId(submissionId);
    const { data, error } = await supabase.from("submissions").update(patch).eq("id", submissionId).select("*").single();

    if (error) {
      toast({ title: "Kayıt güncellenemedi", description: error.message, variant: "destructive" });
      setSavingSubmissionId(null);
      return false;
    }

    if (data) {
      setRows((current) => {
        const updatedRow = toSubmissionMemberRow(data);
        const updatedRows = current.map((submission) => (submission.id === submissionId ? updatedRow : submission));
        if (statusFilter && data.status !== statusFilter) {
          return updatedRows.filter((submission) => submission.id !== submissionId);
        }
        if (sourceTypeFilter && updatedRow.source_type !== sourceTypeFilter) {
          return updatedRows.filter((submission) => submission.id !== submissionId);
        }
        return updatedRows;
      });
      toast({ title: successTitle });
      if ("referral_source" in patch || "source_type" in patch) void fetchMemberCounts();
    }

    setSavingSubmissionId(null);
    return true;
  }, [fetchMemberCounts, sourceTypeFilter, statusFilter, toast]);

  const startRowEdit = useCallback((submission: AdminMemberRow) => {
    setEditingRowId(submission.id);
    setRowDraft(toRowDraft(submission));
  }, []);

  const cancelRowEdit = useCallback(() => {
    setEditingRowId(null);
    setRowDraft(null);
  }, []);

  const saveRowEdit = useCallback(async (submissionId: string) => {
    if (!rowDraft) return;
    const saved = await updateSubmission(
      submissionId,
      {
        fullname: normalizeTurkishText(rowDraft.fullname),
        email: normalizeTurkishText(rowDraft.email),
        city: normalizeTurkishText(rowDraft.city),
        status: rowDraft.status,
      },
      "Kayıt satırdan güncellendi",
    );
    if (saved) cancelRowEdit();
  }, [cancelRowEdit, rowDraft, updateSubmission]);

  const softDeleteSubmission = useCallback(async (submission: AdminMemberRow) => {
    const confirmed = window.confirm(
      `${submission.fullname} kaydı arşivlenecek. Bu işlem geri alınabilir (Durum: Arşiv). Devam edilsin mi?`,
    );
    if (!confirmed) return;

    setDeletingId(submission.id);
    const archived = await updateSubmission(submission.id, { status: "archived" }, "Kayıt arşivlendi");
    if (archived) {
      if (editingRowId === submission.id) cancelRowEdit();
      if (selectedSubmissionId === submission.id) setIsDetailEditing(false);
    }
    setDeletingId(null);
  }, [cancelRowEdit, editingRowId, selectedSubmissionId, updateSubmission]);

  const startDetailEdit = () => {
    if (!selectedSubmission) return;
    setDetailDraft(toDetailDraft(selectedSubmission));
    setIsDetailEditing(true);
  };

  const cancelDetailEdit = () => {
    setIsDetailEditing(false);
    setDetailDraft(null);
  };

  const closeDetailDialog = useCallback(() => {
    setSelectedSubmissionId(null);
    setIsDetailEditing(false);
    setDetailDraft(null);
  }, []);

  const saveDetailEdit = async () => {
    if (!selectedSubmission || !detailDraft) return;
    const saved = await updateSubmission(
      selectedSubmission.id,
      {
        fullname: normalizeTurkishText(detailDraft.fullname),
        email: normalizeTurkishText(detailDraft.email),
        phone: normalizeTurkishText(detailDraft.phone),
        country: normalizeTurkishText(detailDraft.country),
        city: normalizeTurkishText(detailDraft.city),
        status: detailDraft.status,
        referral_source: detailDraft.referral_source.trim()
          ? normalizeTurkishText(detailDraft.referral_source)
          : null,
        referral_code: detailDraft.referral_code.trim()
          ? normalizeTurkishText(detailDraft.referral_code).toUpperCase()
          : null,
        contact_phone_reached: detailDraft.contact_phone_reached,
        contact_whatsapp_reached: detailDraft.contact_whatsapp_reached,
        contact_instagram_reached: detailDraft.contact_instagram_reached,
        contact_email_reached: detailDraft.contact_email_reached,
      },
      "Kayıt detaydan güncellendi",
    );
    if (saved) cancelDetailEdit();
  };

  const columns = useMemo<ColumnDef<AdminMemberRow>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(checked) => table.toggleAllPageRowsSelected(Boolean(checked))}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
          />
        ),
      },
      {
        accessorKey: "source_type",
        header: "Kaynak",
        cell: ({ row }) => (
          <Badge className={`whitespace-nowrap ${getSourceBadgeClass(row.original.source_type)}`}>
            {getSourceLabel(row.original.source_type)}
          </Badge>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Tarih",
        cell: ({ row }) => <span className="text-xs text-muted-foreground">{new Date(row.original.created_at).toLocaleDateString("tr-TR")}</span>,
      },
      {
        accessorKey: "form_type",
        header: "Tür",
        cell: ({ row }) => <Badge variant="outline">{row.original.source_type === "wa" ? "WA" : getFormTypeLabel(row.original.form_type)}</Badge>,
      },
      { accessorKey: "category", header: "Kategori", cell: ({ row }) => <span className="text-xs">{getCategoryLabel(row.original.category)}</span> },
      {
        accessorKey: "status",
        header: "Durum",
        cell: ({ row }) => {
          if (editingRowId !== row.original.id || !rowDraft) {
            return <Badge variant="secondary">{getStatusLabel(row.original.status)}</Badge>;
          }
          return (
            <div onClick={(event) => event.stopPropagation()}>
              <Select
                value={rowDraft.status}
                onValueChange={(value) => setRowDraft((current) => (current ? { ...current, status: value as SubmissionStatus } : current))}
                disabled={savingSubmissionId === row.original.id}
              >
                <SelectTrigger className="h-8 w-[148px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Yeni</SelectItem>
                  <SelectItem value="contacted">İletişime geçildi</SelectItem>
                  <SelectItem value="archived">Arşiv</SelectItem>
                </SelectContent>
              </Select>
            </div>
          );
        },
      },
      {
        accessorKey: "fullname",
        header: "Ad Soyad",
        cell: ({ row }) => {
          if (editingRowId !== row.original.id || !rowDraft) {
            return <span className="text-xs font-medium">{row.original.fullname}</span>;
          }
          return (
            <Input
              className="h-8 text-xs"
              value={rowDraft.fullname}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => setRowDraft((current) => (current ? { ...current, fullname: event.target.value } : current))}
            />
          );
        },
      },
      {
        accessorKey: "city",
        header: "Şehir",
        cell: ({ row }) => {
          if (editingRowId !== row.original.id || !rowDraft) {
            return <span className="text-xs">{row.original.city}</span>;
          }
          return (
            <Input
              className="h-8 text-xs"
              value={rowDraft.city}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => setRowDraft((current) => (current ? { ...current, city: event.target.value } : current))}
            />
          );
        },
      },
      {
        accessorKey: "email",
        header: "E-posta",
        cell: ({ row }) => (
          <span className="text-xs">{row.original.email}</span>
        ),
      },
      {
        accessorKey: "referral_code",
        header: "Referral Kodu",
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.referral_code || "-"}</span>,
      },
      {
        accessorKey: "phone",
        header: "Telefon",
        cell: ({ row }) => {
          const phone = row.original.phone?.trim() || "-";
          const whatsappHref = buildWhatsappHref(row.original.phone);

          if (!whatsappHref) {
            return <span className="text-xs">{phone}</span>;
          }

          return (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-emerald-700 underline-offset-2 hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              {phone}
            </a>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Aksiyon</div>,
        cell: ({ row }) => {
          const busy = savingSubmissionId === row.original.id || deletingId === row.original.id;
          const isEditing = editingRowId === row.original.id;

          if (isEditing) {
            return (
              <div className="flex items-center justify-end gap-1" onClick={(event) => event.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={busy}
                  onClick={() => void saveRowEdit(row.original.id)}
                  title="Kaydet"
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={busy}
                  onClick={cancelRowEdit}
                  title="Vazgeç"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          }

          return (
            <div className="flex items-center justify-end gap-1" onClick={(event) => event.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={busy}
                onClick={() => startRowEdit(row.original)}
                title="Düzenle"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                disabled={busy}
                onClick={() => void softDeleteSubmission(row.original)}
                title="Arşivle"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
      },
    ],
    [cancelRowEdit, deletingId, editingRowId, rowDraft, saveRowEdit, savingSubmissionId, softDeleteSubmission, startRowEdit],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getRowId: (row) => row.id,
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / Math.max(pageSize, 1)));

  const closeAction = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("action");
    setSearchParams(next, { replace: true });
  };

  const exportCSV = () => {
    const headers = ["Tarih", "Kayıt Kaynağı", "Tür", "Kategori", "Durum", "Ad Soyad", "Ülke", "Şehir", "E-posta", "Telefon", "Referral Kaynağı", "Referral Kodu"];
    const csvRows = rows.map((submission) => [
      sanitizeCsvCell(new Date(submission.created_at).toLocaleDateString("tr-TR")),
      sanitizeCsvCell(getSourceLabel(submission.source_type)),
      sanitizeCsvCell(submission.form_type),
      sanitizeCsvCell(submission.category || ""),
      sanitizeCsvCell(submission.status),
      sanitizeCsvCell(submission.fullname),
      sanitizeCsvCell(submission.country),
      sanitizeCsvCell(submission.city),
      sanitizeCsvCell(submission.email),
      sanitizeCsvCell(submission.phone),
      sanitizeCsvCell(submission.referral_source || ""),
      sanitizeCsvCell(submission.referral_code || ""),
    ]);

    const csvContent = [headers, ...csvRows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `diaspora-connect-members-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const createMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      fullname: normalizeTurkishText(String(form.get("fullname") ?? "")),
      country: normalizeTurkishText(String(form.get("country") ?? "")),
      city: normalizeTurkishText(String(form.get("city") ?? "")),
      field: normalizeTurkishText(String(form.get("field") ?? "")),
      email: normalizeTurkishText(String(form.get("email") ?? "")),
      phone: normalizeTurkishText(String(form.get("phone") ?? "")),
      form_type: "register",
      source_type: "form",
      category: "bireysel",
      consent: true,
      status: "new",
    };
    const { error } = await supabase.from("submissions").insert(payload);
    if (error) {
      toast({ title: "Kayıt eklenemedi", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Yeni kayıt eklendi" });
    void fetchMemberCounts();
    setCreateOpen(false);
    closeAction();
    setRows([]);
    setSearchParams(new URLSearchParams(searchParams), { replace: true });
  };

  const importCsv = async () => {
    const lines = importCsvText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      toast({ title: "CSV geçersiz", description: "En az bir satır veri olmalı.", variant: "destructive" });
      return;
    }

    const header = lines[0].split(",").map((cell) => cell.trim().toLowerCase());
    const required = ["fullname", "country", "city", "field", "email", "phone"];
    if (!required.every((key) => header.includes(key))) {
      toast({ title: "CSV başlığı eksik", description: "Gerekli başlıklar: fullname,country,city,field,email,phone", variant: "destructive" });
      return;
    }

    const rowsToInsert = lines.slice(1).map((line) => {
      const values = line.split(",").map((cell) => cell.trim());
      const get = (key: string) => values[header.indexOf(key)] ?? "";
      return {
        fullname: normalizeTurkishText(get("fullname")),
        country: normalizeTurkishText(get("country")),
        city: normalizeTurkishText(get("city")),
        field: normalizeTurkishText(get("field")),
        email: normalizeTurkishText(get("email")),
        phone: normalizeTurkishText(get("phone")),
        form_type: get("form_type") || "register",
        source_type: "form",
        category: get("category") || "bireysel",
        status: (get("status") as SubmissionStatus) || "new",
        consent: true,
      };
    });

    const { error } = await supabase.from("submissions").insert(rowsToInsert);
    if (error) {
      toast({ title: "Import başarısız", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Import tamamlandı", description: `${rowsToInsert.length} kayıt eklendi.` });
    void fetchMemberCounts();
    setImportOpen(false);
    closeAction();
    setImportCsvText("");
  };

  const applyBulk = async (status: SubmissionStatus, note: string) => {
    if (!selectedIds.length) {
      toast({ title: "Toplu işlem", description: "Önce en az bir kayıt seçin.", variant: "destructive" });
      return;
    }
    const patch: Partial<Submission> = { status };
    if (note.trim()) patch.notes = normalizeTurkishText(note);
    const { error } = await supabase.from("submissions").update(patch).in("id", selectedIds);
    if (error) {
      toast({ title: "Toplu işlem başarısız", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Toplu işlem tamamlandı", description: `${selectedIds.length} kayıt güncellendi.` });
    setBulkOpen(false);
    closeAction();
    setRowSelection({});
  };

  const detailBusy = selectedSubmission
    ? savingSubmissionId === selectedSubmission.id || deletingId === selectedSubmission.id
    : false;
  const selectedIsAdvisor = selectedSubmission?.category === "danisman";
  const totalMemberCount = formMemberCount + chatbotMemberCount + waMemberCount;
  const selectedDocuments = useMemo(
    () => (selectedSubmission ? getSubmissionDocuments(selectedSubmission) : []),
    [selectedSubmission],
  );
  const documentsBucketLevel = getSubmissionDocumentsBucketLevel(documentsBucketStats?.usageRatio ?? 0);
  const documentsUsagePercent = Math.round((documentsBucketStats?.usageRatio ?? 0) * 100);

  const openSubmissionDocument = useCallback(async (documentKey: string, documentIndex: number) => {
    const document = selectedDocuments[documentIndex];
    if (!document) return;

    setOpeningDocumentKey(documentKey);
    try {
      const resolvedUrl = await getSubmissionDocumentAccessUrl(document);
      window.open(resolvedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast({
        title: "Doküman açılamadı",
        description: error instanceof Error ? error.message : "Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setOpeningDocumentKey((current) => (current === documentKey ? null : current));
    }
  }, [selectedDocuments, toast]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="gap-4 md:flex md:flex-row md:items-start md:justify-between">
          <div className="space-y-1.5">
            <CardTitle>Üye Takibi</CardTitle>
            <CardDescription>Sunucu tarafı sayfalama, kolon bazlı filtre ve URL persistent state.</CardDescription>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:min-w-[560px] sm:grid-cols-4">
            <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
              <div className="text-[11px] font-medium text-primary">Toplam Üye</div>
              <div className="text-lg font-semibold leading-tight text-primary">
                {memberCountsLoading ? "..." : totalMemberCount}
              </div>
            </div>
            <div className="rounded-md border bg-muted/30 px-3 py-2">
              <div className="text-[11px] font-medium text-muted-foreground">Üye Sayısı Form</div>
              <div className="text-lg font-semibold leading-tight">{memberCountsLoading ? "..." : formMemberCount}</div>
            </div>
            <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 dark:border-sky-900 dark:bg-sky-950/40">
              <div className="text-[11px] font-medium text-sky-700 dark:text-sky-300">Üye Sayısı Chatbot</div>
              <div className="text-lg font-semibold leading-tight text-sky-800 dark:text-sky-200">
                {memberCountsLoading ? "..." : chatbotMemberCount}
              </div>
            </div>
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-950/40">
              <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">Üye Sayısı WA</div>
              <div className="text-lg font-semibold leading-tight text-emerald-800 dark:text-emerald-200">
                {memberCountsLoading ? "..." : waMemberCount}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`rounded-lg border p-3 ${documentsBucketLevelStyles[documentsBucketLevel]}`}
            data-testid="documents-bucket-summary"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">Yüklenen Doküman Kapasitesi</span>
                  <Badge variant="outline" className={documentsBucketLevelStyles[documentsBucketLevel]}>
                    {documentsBucketLevelLabels[documentsBucketLevel]}
                  </Badge>
                </div>
                <p className="text-xs opacity-90">
                  `submission-documents` bucket kullanımı bu ekranda her 60 saniyede bir yenilenir.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-white/70 text-xs dark:bg-background/40"
                onClick={() => void fetchDocumentsBucketStats()}
                disabled={documentsBucketLoading}
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Yenile
              </Button>
            </div>
            {documentsBucketError ? (
              <p className="mt-3 text-xs font-medium">{documentsBucketError}</p>
            ) : (
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                <div className="rounded-md border border-current/10 bg-white/60 px-3 py-2 dark:bg-background/30">
                  <div className="text-[11px] font-medium opacity-80">Toplam Kullanım</div>
                  <div className="text-sm font-semibold">
                    {documentsBucketLoading ? "..." : formatBytes(documentsBucketStats?.totalBytes ?? 0)}
                  </div>
                </div>
                <div className="rounded-md border border-current/10 bg-white/60 px-3 py-2 dark:bg-background/30">
                  <div className="text-[11px] font-medium opacity-80">Bucket Limiti</div>
                  <div className="text-sm font-semibold">
                    {documentsBucketLoading ? "..." : formatBytes(documentsBucketStats?.fileSizeLimit ?? 0)}
                  </div>
                </div>
                <div className="rounded-md border border-current/10 bg-white/60 px-3 py-2 dark:bg-background/30">
                  <div className="text-[11px] font-medium opacity-80">Doluluk</div>
                  <div className="text-sm font-semibold">
                    {documentsBucketLoading ? "..." : `%${documentsUsagePercent}`}
                  </div>
                </div>
                <div className="rounded-md border border-current/10 bg-white/60 px-3 py-2 dark:bg-background/30">
                  <div className="text-[11px] font-medium opacity-80">Dosya Adedi</div>
                  <div className="text-sm font-semibold">
                    {documentsBucketLoading ? "..." : documentsBucketStats?.fileCount ?? 0}
                  </div>
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Filtreler iki satırda düzenlendi. Dropdown alanlarının üstündeki etiketler hangi veriyi filtrelediğini gösterir.
          </p>
          <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Ad Soyad (metin)</label>
              <Input className="h-8 text-xs" value={fullnameInput} onChange={(event) => setFullnameInput(event.target.value)} placeholder="Ada Lovelace" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">E-posta (metin)</label>
              <Input className="h-8 text-xs" value={emailInput} onChange={(event) => setEmailInput(event.target.value)} placeholder="mail ara" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Şehir (metin)</label>
              <Input className="h-8 text-xs" value={cityInput} onChange={(event) => setCityInput(event.target.value)} placeholder="şehir ara" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Durum (enum)</label>
              <Select value={statusFilter || "__all__"} onValueChange={(value) => updateParam("status", value === "__all__" ? "" : value)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Durum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tümü</SelectItem>
                  <SelectItem value="new">Yeni</SelectItem>
                  <SelectItem value="contacted">İletişime geçildi</SelectItem>
                  <SelectItem value="archived">Arşiv</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Form Türü (enum)</label>
              <Select value={formTypeFilter || "__all__"} onValueChange={(value) => updateParam("formType", value === "__all__" ? "" : value)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Form Türü" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tümü</SelectItem>
                  <SelectItem value="register">Kayıt</SelectItem>
                  <SelectItem value="support">Destek</SelectItem>
                  <SelectItem value="backer">Backer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Kategori (enum)</label>
              <Select value={categoryFilter || "__all__"} onValueChange={(value) => updateParam("category", value === "__all__" ? "" : value)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Kategori" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tümü</SelectItem>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Referral Kaynağı (enum)</label>
              <Select value={referralSourceFilter || "__all__"} onValueChange={(value) => updateParam("referralSource", value === "__all__" ? "" : value)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Referral kaynağı" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tümü</SelectItem>
                  {referralSourceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Kayıt Kaynağı</label>
              <Select value={sourceTypeFilter || "__all__"} onValueChange={(value) => updateParam("sourceType", value === "__all__" ? "" : value)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Kayıt kaynağı" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tümü</SelectItem>
                  <SelectItem value="form">Form</SelectItem>
                  <SelectItem value="chatbot">Chatbot</SelectItem>
                  <SelectItem value="wa">WA Bot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Başlangıç Tarihi</label>
              <Input className="h-8 text-xs" type="date" value={fromDate} onChange={(event) => updateParam("fromDate", event.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Bitiş Tarihi</label>
              <Input className="h-8 text-xs" type="date" value={toDate} onChange={(event) => updateParam("toDate", event.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">WhatsApp İlgisi (boolean)</label>
              <Select value={searchParams.get("whatsapp") ?? "__all__"} onValueChange={(value) => updateParam("whatsapp", value === "__all__" ? "" : value)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="WhatsApp ilgisi" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tümü</SelectItem>
                  <SelectItem value="true">Evet</SelectItem>
                  <SelectItem value="false">Hayır</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Yarışma İlgisi (boolean)</label>
              <Select value={searchParams.get("contest") ?? "__all__"} onValueChange={(value) => updateParam("contest", value === "__all__" ? "" : value)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Yarışma ilgisi" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tümü</SelectItem>
                  <SelectItem value="true">Evet</SelectItem>
                  <SelectItem value="false">Hayır</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Filtreleri Temizle</label>
              <Button
                variant="outline"
                className="h-8 w-full text-xs"
                onClick={() =>
                  setSearchParams(
                    new URLSearchParams({ page: "1", pageSize: String(pageSize), sortBy, sortDir }),
                    { replace: true },
                  )
                }
              >
                Sıfırla
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted/70">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-xs">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="py-10 text-center text-sm text-muted-foreground">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row, index) => (
                    <TableRow
                      key={row.id}
                      className={`${
                        row.original.id === selectedSubmissionId
                          ? "bg-green-100/70 dark:bg-green-900/30"
                          : index % 2 === 0
                            ? "bg-background"
                            : "bg-muted/20"
                      } cursor-pointer hover:bg-green-100/60 dark:hover:bg-green-900/40`}
                      onClick={() => {
                        setSelectedSubmissionId(row.original.id);
                        setIsDetailEditing(false);
                        setDetailDraft(null);
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-2 align-middle text-xs">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="py-10 text-center text-sm text-muted-foreground">
                      Kayıt bulunamadı.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Toplam {totalCount} kayıt · Seçili {selectedIds.length}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateParam("page", String(Math.max(1, page - 1)))}
                disabled={page <= 1}
              >
                Önceki
              </Button>
              <span className="text-xs">{page} / {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateParam("page", String(Math.min(totalPages, page + 1)))}
                disabled={page >= totalPages}
              >
                Sonraki
              </Button>
              <Select value={String(pageSize)} onValueChange={(value) => updateParam("pageSize", value)}>
                <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / sayfa</SelectItem>
                  <SelectItem value="20">20 / sayfa</SelectItem>
                  <SelectItem value="50">50 / sayfa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedSubmission)}
        onOpenChange={(open) => {
          if (!open) closeDetailDialog();
        }}
      >
        <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kayıt Detayı</DialogTitle>
            <DialogDescription>Seçili üyenin detay bilgilerini ve kayıt kaynağını görüntüleyin.</DialogDescription>
          </DialogHeader>
          {selectedSubmission ? (
            isDetailEditing && detailDraft ? (
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground">Ad Soyad</label>
                      <Input
                        className="h-8 text-xs"
                        value={detailDraft.fullname}
                        onChange={(event) => setDetailDraft((current) => (current ? { ...current, fullname: event.target.value } : current))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground">E-posta</label>
                      <Input
                        className="h-8 text-xs"
                        value={detailDraft.email}
                        onChange={(event) => setDetailDraft((current) => (current ? { ...current, email: event.target.value } : current))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground">Telefon</label>
                      <Input
                        className="h-8 text-xs"
                        value={detailDraft.phone}
                        onChange={(event) => setDetailDraft((current) => (current ? { ...current, phone: event.target.value } : current))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground">Durum</label>
                      <Select
                        value={detailDraft.status}
                        onValueChange={(value) => setDetailDraft((current) => (current ? { ...current, status: value as SubmissionStatus } : current))}
                      >
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Yeni</SelectItem>
                          <SelectItem value="contacted">İletişime geçildi</SelectItem>
                          <SelectItem value="archived">Arşiv</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground">Ülke</label>
                      <Input
                        className="h-8 text-xs"
                        value={detailDraft.country}
                        onChange={(event) => setDetailDraft((current) => (current ? { ...current, country: event.target.value } : current))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground">Şehir</label>
                      <Input
                        className="h-8 text-xs"
                        value={detailDraft.city}
                        onChange={(event) => setDetailDraft((current) => (current ? { ...current, city: event.target.value } : current))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground">Referral Kaynağı</label>
                      <Select
                        value={detailDraft.referral_source || "__none__"}
                        onValueChange={(value) =>
                          setDetailDraft((current) => (current ? { ...current, referral_source: value === "__none__" ? "" : value } : current))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Belirtilmedi</SelectItem>
                          {referralSourceOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground">Referral Kodu</label>
                      <Input
                        className="h-8 font-mono text-xs"
                        value={detailDraft.referral_code}
                        onChange={(event) => setDetailDraft((current) => (current ? { ...current, referral_code: event.target.value } : current))}
                      />
                    </div>
                  </div>
                  {selectedIsAdvisor && (
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="mb-2 text-xs font-medium">Kontak Durumu</p>
                      <div className="space-y-2">
                        {contactChannelOptions.map(({ key, label, Icon }) => {
                          const reached = detailDraft[key];
                          return (
                            <Button
                              key={key}
                              type="button"
                              variant="outline"
                              className={`h-9 w-full justify-between border text-xs ${
                                reached
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  : "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
                              }`}
                              onClick={() =>
                                setDetailDraft((current) =>
                                  current ? { ...current, [key]: !current[key] } : current,
                                )
                              }
                            >
                              <span className="inline-flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {label}
                              </span>
                              <span>{reached ? "Kuruldu" : "Kurulmadı"}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="mb-2 text-sm font-medium">Yüklenen Dokümanlar</div>
                  {selectedDocuments.length ? (
                    <div className="space-y-2">
                      {selectedDocuments.map((document, index) => {
                        const documentKey = `${document.path ?? document.url ?? document.name}-${index}`;

                        return (
                          <div
                            key={documentKey}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-xs"
                          >
                            <div className="min-w-0">
                              <div className="truncate font-medium text-foreground">{document.name}</div>
                              {document.sizeBytes ? (
                                <div className="text-muted-foreground">{formatBytes(document.sizeBytes)}</div>
                              ) : null}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1 text-xs"
                              disabled={openingDocumentKey === documentKey}
                              onClick={() => void openSubmissionDocument(documentKey, index)}
                            >
                              Aç
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Bu kayda bağlı yüklenmiş doküman bulunmuyor.</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => void saveDetailEdit()} disabled={detailBusy}>
                    Kaydet
                  </Button>
                  <Button variant="secondary" size="sm" onClick={cancelDetailEdit} disabled={detailBusy}>
                    Vazgeç
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportCSV} disabled={detailBusy}>
                    CSV Export
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => void softDeleteSubmission(selectedSubmission)}
                    disabled={detailBusy}
                  >
                    Sil (Arşivle)
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="space-y-3">
                    <div className="font-semibold">{selectedSubmission.fullname}</div>
                    <div>
                      Kaynak: <Badge className={getSourceBadgeClass(selectedSubmission.source_type)}>{getSourceLabel(selectedSubmission.source_type)}</Badge>
                    </div>
                    <div>{selectedSubmission.email} · {selectedSubmission.phone}</div>
                    <div>{selectedSubmission.country}, {selectedSubmission.city}</div>
                    <div>Durum: <Badge variant="secondary">{getStatusLabel(selectedSubmission.status)}</Badge></div>
                    <div>Referral: {getReferralSourceLabel(selectedSubmission.referral_source)} / {selectedSubmission.referral_code || "-"}</div>
                  </div>
                  {selectedIsAdvisor && (
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="mb-2 text-xs font-medium">Kontak Durumu</p>
                      <div className="space-y-2">
                        {contactChannelOptions.map(({ key, label, Icon }) => {
                          const reached = selectedSubmission[key];
                          return (
                            <div
                              key={key}
                              className={`flex items-center justify-between rounded-md border px-2.5 py-2 text-xs ${
                                reached
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                  : "border-rose-300 bg-rose-50 text-rose-700"
                              }`}
                            >
                              <span className="inline-flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {label}
                              </span>
                              <span>{reached ? "Kuruldu" : "Kurulmadı"}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="mb-2 text-sm font-medium">Yüklenen Dokümanlar</div>
                  {selectedDocuments.length ? (
                    <div className="space-y-2">
                      {selectedDocuments.map((document, index) => {
                        const documentKey = `${document.path ?? document.url ?? document.name}-${index}`;

                        return (
                          <div
                            key={documentKey}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-xs"
                          >
                            <div className="min-w-0">
                              <div className="truncate font-medium text-foreground">{document.name}</div>
                              {document.sizeBytes ? (
                                <div className="text-muted-foreground">{formatBytes(document.sizeBytes)}</div>
                              ) : null}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1 text-xs"
                              disabled={openingDocumentKey === documentKey}
                              onClick={() => void openSubmissionDocument(documentKey, index)}
                            >
                              Aç
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Bu kayda bağlı yüklenmiş doküman bulunmuyor.</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={startDetailEdit} disabled={detailBusy}>
                    Düzenle
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => void softDeleteSubmission(selectedSubmission)}
                    disabled={detailBusy}
                  >
                    Sil (Arşivle)
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportCSV} disabled={detailBusy}>
                    CSV Export
                  </Button>
                </div>
              </div>
            )
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) closeAction(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni kayıt ekle</DialogTitle>
            <DialogDescription>Gerekli alanları girerek üye oluşturun.</DialogDescription>
          </DialogHeader>
          <form className="space-y-3" onSubmit={(event) => void createMember(event)}>
            <Input name="fullname" placeholder="Ad Soyad" required />
            <Input name="country" placeholder="Ülke" required />
            <Input name="city" placeholder="Şehir" required />
            <Input name="field" placeholder="Alan" required />
            <Input name="email" type="email" placeholder="E-posta" required />
            <Input name="phone" placeholder="Telefon" required />
            <DialogFooter>
              <Button type="submit">Kaydet</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={(open) => { setImportOpen(open); if (!open) closeAction(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export / Import</DialogTitle>
            <DialogDescription>CSV export alın veya CSV metni ile toplu import yapın.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button variant="secondary" onClick={exportCSV}>Mevcut listeyi CSV export et</Button>
            <Textarea
              value={importCsvText}
              onChange={(event) => setImportCsvText(event.target.value)}
              placeholder="fullname,country,city,field,email,phone&#10;Ada Lovelace,Germany,Berlin,AI,ada@example.com,+49..."
              rows={10}
            />
            <DialogFooter>
              <Button onClick={() => void importCsv()}>CSV Import</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <BulkDialog
        open={bulkOpen}
        onClose={() => { setBulkOpen(false); closeAction(); }}
        onApply={(status, note) => void applyBulk(status, note)}
        selectedCount={selectedIds.length}
      />
    </div>
  );
};

const BulkDialog = ({
  open,
  onClose,
  onApply,
  selectedCount,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (status: SubmissionStatus, note: string) => void;
  selectedCount: number;
}) => {
  const [status, setStatus] = useState<SubmissionStatus>("contacted");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setStatus("contacted");
      setNote("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Toplu işlem</DialogTitle>
          <DialogDescription>{selectedCount} seçili kayıt güncellenecek.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={status} onValueChange={(value) => setStatus(value as SubmissionStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Yeni</SelectItem>
              <SelectItem value="contacted">İletişime geçildi</SelectItem>
              <SelectItem value="archived">Arşiv</SelectItem>
            </SelectContent>
          </Select>
          <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Opsiyonel admin notu" rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Vazgeç</Button>
            <Button onClick={() => onApply(status, note)}>Uygula</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminMembersPage;
