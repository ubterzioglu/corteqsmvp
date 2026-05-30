import { useEffect, useState } from "react";
import { Globe, Instagram, Linkedin, Youtube } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buildLansmanSocialHref, getAllRegistrations, updateRegistrationStatus } from "@/lib/lansman";
import type { LansmanRegistration, LansmanRegistrationStatus } from "@/types/lansman";

const statusLabels: Record<LansmanRegistrationStatus, string> = {
  pending: "Onay Bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};

const socialPlatforms = [
  { key: "linkedin", label: "LinkedIn", Icon: Linkedin },
  { key: "instagram", label: "Instagram", Icon: Instagram },
  { key: "youtube", label: "YouTube", Icon: Youtube },
  { key: "website", label: "Website", Icon: Globe },
] as const;

const AdminLansmanTable = () => {
  const [rows, setRows] = useState<LansmanRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getAllRegistrations();
        if (!cancelled) {
          setRows(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Kayıtlar yüklenemedi.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStatusUpdate = async (
    id: string,
    status: Extract<LansmanRegistrationStatus, "approved" | "rejected">,
  ) => {
    setUpdatingId(id);
    setError("");

    try {
      const updated = await updateRegistrationStatus(id, status);
      setRows((current) =>
        current.map((row) => (row.id === id ? updated : row)),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Durum güncellenemedi.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Lansman Kayıtları</h2>
        <p className="text-sm text-muted-foreground">
          Tüm kayıtları görüntüleyin ve durumlarını yönetin.
        </p>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Kayıtlar yükleniyor...</p> : null}
      {!loading && error ? <p className="text-sm text-destructive">{error}</p> : null}
      {!loading && !error && rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz kayıt bulunmuyor.</p>
      ) : null}

      {!loading && rows.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kayıt</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Sosyal</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const isUpdating = updatingId === row.id;
                return (
                  <TableRow key={row.id}>
                    <TableCell className="min-w-[180px]">
                      <div className="font-medium text-foreground">{`${row.first_name} ${row.last_name}`}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{row.phone}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {socialPlatforms.map(({ key, label, Icon }) => {
                          const href = buildLansmanSocialHref(key, row[key]);
                          const isActive = Boolean(href);
                          return isActive ? (
                            <a
                              key={key}
                              href={href}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={label}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/15 text-emerald-300 transition hover:bg-emerald-500/25 hover:text-emerald-200"
                            >
                              <Icon className="h-4 w-4" />
                            </a>
                          ) : (
                            <span
                              key={key}
                              aria-label={`${label} yok`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-400/35 bg-rose-500/10 text-rose-300"
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[240px]">
                      <p className="line-clamp-1 text-sm text-foreground/90">{row.description || "-"}</p>
                    </TableCell>
                    <TableCell>{statusLabels[row.status]}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {new Date(row.created_at).toLocaleString("tr-TR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="h-9 px-3"
                          onClick={() => void handleStatusUpdate(row.id, "approved")}
                          disabled={isUpdating || row.status === "approved"}
                        >
                          Onayla
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="h-9 px-3"
                          onClick={() => void handleStatusUpdate(row.id, "rejected")}
                          disabled={isUpdating || row.status === "rejected"}
                        >
                          Reddet
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </section>
  );
};

export default AdminLansmanTable;
