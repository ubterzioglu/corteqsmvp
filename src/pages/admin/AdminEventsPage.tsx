import { useMemo, useState } from "react";
import { Calendar, Eye, EyeOff, Star, StarOff, Trash2, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
  AdminPageShell,
} from "@/components/admin/page";
import { useAdminEvents, useDeleteEvent, usePublishEvent, useToggleFeaturedEvent, useUnpublishEvent } from "@/hooks/use-events";
import { useToast } from "@/hooks/use-toast";
import type { EventRow } from "@/lib/events-api";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

function statusLabel(status: string): string {
  switch (status) {
    case "published": return "Yayında";
    case "pending": return "Onay Bekliyor";
    case "draft": return "Taslak";
    case "rejected": return "Reddedildi";
    default: return status;
  }
}

function statusTone(status: string): string {
  switch (status) {
    case "published": return "bg-emerald-100 text-emerald-700";
    case "pending": return "bg-amber-100 text-amber-700";
    case "draft": return "bg-slate-100 text-slate-600";
    case "rejected": return "bg-red-100 text-red-700";
    default: return "bg-slate-100 text-slate-600";
  }
}

function typeLabel(type: string): string {
  if (type === "online") return "Dijital";
  if (type === "hybrid") return "Hibrit";
  return "Fiziksel";
}

const AdminEventsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: events, isLoading, error } = useAdminEvents();
  const deleteEventMutation = useDeleteEvent();
  const publishEventMutation = usePublishEvent();
  const unpublishEventMutation = useUnpublishEvent();
  const toggleFeaturedMutation = useToggleFeaturedEvent();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    return events.filter((e) => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!e.title.toLowerCase().includes(q) && !e.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [events, statusFilter, typeFilter, search]);

  const handleDelete = async (event: EventRow) => {
    if (!confirm(`"${event.title}" silinecek. Emin misiniz?`)) return;
    try {
      await deleteEventMutation.mutateAsync(event.id);
      toast({ title: "Etkinlik silindi" });
    } catch {
      toast({ title: "Silinemedi", variant: "destructive" });
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishEventMutation.mutateAsync(id);
      toast({ title: "Etkinlik yayınlandı" });
    } catch {
      toast({ title: "Yayınlanamadı", variant: "destructive" });
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      await unpublishEventMutation.mutateAsync(id);
      toast({ title: "Etkinlik yayından kaldırıldı" });
    } catch {
      toast({ title: "İşlem başarısız", variant: "destructive" });
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    try {
      await toggleFeaturedMutation.mutateAsync({ id, featured: !currentFeatured });
      toast({ title: !currentFeatured ? "Öne çıkarıldı" : "Öne çıkarma kaldırıldı" });
    } catch {
      toast({ title: "İşlem başarısız", variant: "destructive" });
    }
  };

  const stats = (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-lg border bg-white p-3">
        <p className="text-xs text-slate-500">Toplam</p>
        <p className="text-xl font-bold text-slate-900">{events?.length ?? 0}</p>
      </div>
      <div className="rounded-lg border bg-white p-3">
        <p className="text-xs text-emerald-600">Yayında</p>
        <p className="text-xl font-bold text-emerald-700">{events?.filter((e) => e.status === "published").length ?? 0}</p>
      </div>
      <div className="rounded-lg border bg-white p-3">
        <p className="text-xs text-amber-600">Onay Bekleyen</p>
        <p className="text-xl font-bold text-amber-700">{events?.filter((e) => e.status === "pending").length ?? 0}</p>
      </div>
      <div className="rounded-lg border bg-white p-3">
        <p className="text-xs text-slate-500">Öne Çıkan</p>
        <p className="text-xl font-bold text-slate-900">{events?.filter((e) => e.featured).length ?? 0}</p>
      </div>
    </div>
  );

  const filters = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Etkinlik ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Durum" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Durumlar</SelectItem>
          <SelectItem value="published">Yayında</SelectItem>
          <SelectItem value="pending">Onay Bekliyor</SelectItem>
          <SelectItem value="draft">Taslak</SelectItem>
          <SelectItem value="rejected">Reddedildi</SelectItem>
        </SelectContent>
      </Select>
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Tür" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Türler</SelectItem>
          <SelectItem value="yüz yüze">Fiziksel</SelectItem>
          <SelectItem value="online">Dijital</SelectItem>
          <SelectItem value="hybrid">Hibrit</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <AdminPageShell
      title="Etkinlik Yönetimi"
      description="Tüm etkinlikleri görüntüle, onayla, yayınla ve yönet."
      icon={Calendar}
      accent="violet"
      stats={stats}
      filters={filters}
    >
      {isLoading ? <AdminLoadingState /> : null}
      {error ? <AdminErrorState message="Etkinlikler yüklenemedi." /> : null}

      {!isLoading && !error && filteredEvents.length === 0 ? (
        <AdminEmptyState
          title="Etkinlik bulunamadı"
          description={events && events.length > 0 ? "Filtreleri değiştirmeyi deneyin." : "Henüz hiçbir etkinlik oluşturulmadı."}
        />
      ) : null}

      {filteredEvents.length > 0 && (
        <div className="overflow-hidden rounded-lg border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50">
                <tr className="text-left text-xs font-medium text-slate-500">
                  <th className="px-4 py-3">Etkinlik</th>
                  <th className="px-4 py-3">Tür</th>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Konum</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {event.featured && <Star className="h-3.5 w-3.5 text-amber-500" />}
                        <div>
                          <p className="font-medium text-slate-900 line-clamp-1">{event.title}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{event.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{typeLabel(event.type)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(event.event_date)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {event.city ? `${event.city}${event.country ? `, ${event.country}` : ""}` : event.type === "online" ? "Online" : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(event.status)}`}>
                        {statusLabel(event.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {event.status === "pending" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Onayla ve Yayınla" onClick={() => handlePublish(event.id)}>
                            <Eye className="h-4 w-4 text-emerald-600" />
                          </Button>
                        )}
                        {event.status === "published" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Yayından Kaldır" onClick={() => handleUnpublish(event.id)}>
                            <EyeOff className="h-4 w-4 text-amber-600" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" title={event.featured ? "Öne Çıkarmayı Kaldır" : "Öne Çıkar"} onClick={() => handleToggleFeatured(event.id, event.featured)}>
                          {event.featured ? <StarOff className="h-4 w-4 text-amber-500" /> : <Star className="h-4 w-4 text-slate-400" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Sil" onClick={() => handleDelete(event)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
};

export default AdminEventsPage;
