import { useEffect, useState } from "react";
import { Briefcase, Plus, ArrowLeft, Eye, Users, Tag, Inbox, Mail, Paperclip, Link as LinkIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import CreateJobListingForm from "@/components/CreateJobListingForm";
import { useToast } from "@/hooks/use-toast";

type Listing = {
  id: string;
  title: string;
  employment_type: string;
  status: string;
  package: string;
  hide_business_name: boolean | null;
  created_at: string;
};

type Application = {
  id: string;
  applicant_name: string | null;
  applicant_email: string | null;
  applicant_phone: string | null;
  message: string | null;
  link_url: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  created_at: string;
};

const JobListingsManager = () => {
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openAppsFor, setOpenAppsFor] = useState<string | null>(null);
  const [apps, setApps] = useState<Record<string, Application[]>>({});

  const load = async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) { setLoading(false); return; }
    const { data } = await supabase
      .from("job_listings")
      .select("id,title,employment_type,status,package,hide_business_name,created_at")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });
    setListings((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const loadApps = async (listingId: string) => {
    const { data } = await supabase
      .from("job_applications")
      .select("id,applicant_name,applicant_email,applicant_phone,message,link_url,attachment_url,attachment_name,created_at")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false });
    setApps((p) => ({ ...p, [listingId]: (data as any) || [] }));
  };

  const toggleApps = (id: string) => {
    if (openAppsFor === id) { setOpenAppsFor(null); return; }
    setOpenAppsFor(id);
    if (!apps[id]) loadApps(id);
  };

  const getAttachmentUrl = async (path: string) => {
    const { data } = await supabase.storage.from("job-applications").createSignedUrl(path, 60 * 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    else toast({ title: "Bağlantı oluşturulamadı", variant: "destructive" });
  };

  if (showCreate) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        <Button variant="ghost" size="sm" className="gap-1 mb-4" onClick={() => setShowCreate(false)}>
          <ArrowLeft className="h-4 w-4" /> İlanlara Dön
        </Button>
        <CreateJobListingForm onClose={() => { setShowCreate(false); load(); }} />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" /> İş İlanlarım
        </h2>
        <Button className="gap-2" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Yeni İlan
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Yükleniyor…</p>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Henüz ilanınız yok. İlk iş ilanınızı oluşturun.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <div key={l.id} className="rounded-xl bg-muted/40 border border-border">
              <div className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-foreground">{l.title}</h3>
                    <Badge variant={l.status === "published" ? "default" : "secondary"} className="text-xs">{l.status}</Badge>
                    {l.hide_business_name && <Badge variant="outline" className="text-[10px]">Firma gizli</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1"><Tag className="h-3 w-3" />{l.employment_type}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{(apps[l.id]?.length ?? "—")} başvuru</span>
                  </p>
                </div>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => toggleApps(l.id)}>
                  <Inbox className="h-3.5 w-3.5" /> Başvurular
                </Button>
              </div>
              {openAppsFor === l.id && (
                <div className="border-t border-border p-4 space-y-2">
                  {(apps[l.id] ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">Henüz başvuru yok.</p>
                  ) : (
                    apps[l.id].map((a) => (
                      <div key={a.id} className="rounded-lg bg-background border border-border p-3 text-sm">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-medium text-foreground">{a.applicant_name || "Aday"}</span>
                          <span className="text-[11px] text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                          {a.applicant_email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{a.applicant_email}</span>}
                          {a.applicant_phone && <span>📞 {a.applicant_phone}</span>}
                        </p>
                        {a.message && <p className="text-xs mt-2 text-foreground/80 whitespace-pre-wrap">{a.message}</p>}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {a.link_url && (
                            <a href={a.link_url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                              <LinkIcon className="h-3 w-3" />Link <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {a.attachment_url && (
                            <button onClick={() => getAttachmentUrl(a.attachment_url!)} className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                              <Paperclip className="h-3 w-3" />{a.attachment_name || "Belge"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobListingsManager;
