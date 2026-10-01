import { useEffect, useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CAREER_SIGNED_URL_TTL_SECONDS,
  createCareerFileUrl,
  listCareerApplications,
  updateCareerApplicationNotes,
  updateCareerApplicationStatus,
} from "@/lib/careers/careers-admin-api";
import { CAREER_INTERNSHIP, CAREER_JOBS } from "@/lib/careers/careers-data";
import { LEGACY_CAREER_POSITIONS } from "@/lib/careers/careers-legacy";
import {
  CAREER_APPLICATION_STATUSES,
  CAREER_STATUS_LABELS,
  type CareerApplicationRow,
  type CareerApplicationStatus,
} from "@/lib/careers/careers-schemas";
import { trIncludes } from "@/lib/text-normalization";

/** Radix/`select` boş değerle çalışmaz; "tümü" için sentinel. */
const ALL = "all";

/** Pozisyon kimliği → kullanıcıya görünen ad. Eski ilanlar da dahil. */
const positionLabel = (id: string) =>
  CAREER_JOBS.find((job) => job.id === id)?.tr ??
  LEGACY_CAREER_POSITIONS.find((job) => job.id === id)?.title ??
  (id === CAREER_INTERNSHIP.id ? CAREER_INTERNSHIP.tr : id);

function AdminKadroBasvurularPage() {
  const [rows, setRows] = useState<CareerApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [positionFilter, setPositionFilter] = useState<string>(ALL);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    listCareerApplications()
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch(() => {
        // Yetkisiz oturumda RLS boş döndürmez, hata verir: sessizce yutma.
        if (!cancelled) toast.error("Başvurular yüklenemedi. Yönetici yetkisi gerekli.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const positions = useMemo(
    () => [...new Set(rows.map((row) => row.position))].sort(),
    [rows],
  );

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (statusFilter !== ALL && row.status !== statusFilter) return false;
        if (positionFilter !== ALL && row.position !== positionFilter) return false;
        if (search) {
          // ⚠️ `trIncludes` — çıplak `toLowerCase()` Türkçe'de "İ" harfini bozar.
          const haystack = `${row.full_name} ${row.email} ${row.country} ${row.city ?? ""} ${positionLabel(row.position)}`;
          if (!trIncludes(haystack, search)) return false;
        }
        return true;
      }),
    [rows, search, statusFilter, positionFilter],
  );

  const changeStatus = async (row: CareerApplicationRow, status: CareerApplicationStatus) => {
    const previous = row.status;
    setRows((current) => current.map((item) => (item.id === row.id ? { ...item, status } : item)));
    try {
      await updateCareerApplicationStatus(row.id, status);
    } catch {
      setRows((current) => current.map((item) => (item.id === row.id ? { ...item, status: previous } : item)));
      toast.error("Durum güncellenemedi.");
    }
  };

  const saveNote = async (row: CareerApplicationRow) => {
    const value = noteDrafts[row.id] ?? row.notes ?? "";
    try {
      await updateCareerApplicationNotes(row.id, value);
      setRows((current) =>
        current.map((item) => (item.id === row.id ? { ...item, notes: value.trim() === "" ? null : value } : item)),
      );
      toast.success("Not kaydedildi.");
    } catch {
      toast.error("Not kaydedilemedi.");
    }
  };

  const openFile = async (path: string) => {
    try {
      const url = await createCareerFileUrl(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Dosya bağlantısı üretilemedi.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold">Kariyer Başvuruları</h1>
        <p className="text-sm text-muted-foreground">
          `/kariyer` formundan gelen başvurular. Dosyalar {CAREER_SIGNED_URL_TTL_SECONDS / 60} dakikalık
          imzalı bağlantıyla açılır; kova herkese kapalıdır.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Input
          placeholder="Ad, e-posta, ülke veya pozisyon ara"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-xs"
        />
        <select
          aria-label="Duruma göre filtrele"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value={ALL}>Tüm durumlar</option>
          {CAREER_APPLICATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {CAREER_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <select
          aria-label="Pozisyona göre filtrele"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={positionFilter}
          onChange={(event) => setPositionFilter(event.target.value)}
        >
          <option value={ALL}>Tüm pozisyonlar</option>
          {positions.map((position) => (
            <option key={position} value={position}>
              {positionLabel(position)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Yükleniyor…
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {rows.length === 0 ? "Henüz başvuru yok." : "Filtreye uyan başvuru yok."}
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{filtered.length} başvuru</p>
          {filtered.map((row) => (
            <Card key={row.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{row.full_name}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {positionLabel(row.position)} · {row.country}
                      {row.city ? ` / ${row.city}` : ""} ·{" "}
                      {new Date(row.created_at).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  <select
                    aria-label={`${row.full_name} başvuru durumu`}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    value={row.status}
                    onChange={(event) => changeStatus(row, event.target.value as CareerApplicationStatus)}
                  >
                    {CAREER_APPLICATION_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {CAREER_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid gap-1 text-sm sm:grid-cols-2">
                  <p>
                    <span className="text-muted-foreground">E-posta: </span>
                    <a href={`mailto:${row.email}`} className="text-primary hover:underline">
                      {row.email}
                    </a>
                  </p>
                  {row.phone && (
                    <p>
                      <span className="text-muted-foreground">Telefon: </span>
                      {row.phone}
                    </p>
                  )}
                  {row.linkedin && (
                    <p className="truncate">
                      <span className="text-muted-foreground">LinkedIn: </span>
                      <a href={row.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {row.linkedin}
                      </a>
                    </p>
                  )}
                  <p>
                    <span className="text-muted-foreground">Model: </span>
                    {row.model}
                  </p>
                </div>

                {row.cover_letter_text && (
                  <p className="whitespace-pre-line rounded-md bg-muted/40 p-3 text-sm">{row.cover_letter_text}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => openFile(row.cv_path)}>
                    <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                    CV
                  </Button>
                  {row.cover_letter_path && (
                    <Button size="sm" variant="outline" onClick={() => openFile(row.cover_letter_path!)}>
                      <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                      Ön yazı
                    </Button>
                  )}
                  {row.presentation_path && (
                    <Button size="sm" variant="outline" onClick={() => openFile(row.presentation_path!)}>
                      <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                      Sunum
                    </Button>
                  )}
                </div>

                <div>
                  <label htmlFor={`note-${row.id}`} className="text-sm font-medium">
                    Not
                  </label>
                  <Textarea
                    id={`note-${row.id}`}
                    rows={2}
                    className="mt-2"
                    value={noteDrafts[row.id] ?? row.notes ?? ""}
                    onChange={(event) =>
                      setNoteDrafts((current) => ({ ...current, [row.id]: event.target.value }))
                    }
                  />
                  <Button size="sm" variant="secondary" className="mt-2" onClick={() => saveNote(row)}>
                    Notu kaydet
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminKadroBasvurularPage;
