import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Briefcase, MapPin, Clock, DollarSign, MessageSquare, ChevronDown, ChevronUp, CheckCircle, XCircle, FileText, ExternalLink, Info, Eye, EyeOff } from "lucide-react";
import { useDemoFlag, markRealServiceRequest } from "@/lib/demoFlags";
import PlatformMessageButton from "@/components/messaging/PlatformMessageButton";
import { isRequestVisible, setRequestVisible } from "@/lib/serviceRequestVisibility";

interface Proposal {
  id: string;
  consultant_id: string;
  message: string;
  price: number | null;
  estimated_duration: string | null;
  scope: string | null;
  payment_terms: string | null;
  status: string;
  created_at: string;
  consultant_name?: string;
}

interface ServiceRequest {
  id: string;
  category: string;
  subcategory: string | null;
  title: string;
  description: string;
  city: string | null;
  country: string | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_time: string | null;
  urgency: string;
  attachment_urls: string[];
  status: string;
  created_at: string;
  proposals?: Proposal[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  open: { label: "Açık", color: "bg-turquoise/15 text-turquoise border-turquoise/30" },
  in_progress: { label: "Devam Ediyor", color: "bg-primary/15 text-primary border-primary/30" },
  completed: { label: "Tamamlandı", color: "bg-success/15 text-success border-success/30" },
  cancelled: { label: "İptal", color: "bg-destructive/15 text-destructive border-destructive/30" },
};

const URGENCY_MAP: Record<string, { label: string; color: string }> = {
  low: { label: "Acil Değil", color: "text-muted-foreground" },
  normal: { label: "Normal", color: "text-primary" },
  high: { label: "Acil", color: "text-gold" },
  urgent: { label: "Çok Acil", color: "text-destructive" },
};

const TIME_MAP: Record<string, string> = {
  "weekday-morning": "Hafta İçi Sabah",
  "weekday-afternoon": "Hafta İçi Öğleden Sonra",
  "weekday-evening": "Hafta İçi Akşam",
  "weekend": "Hafta Sonu",
  "flexible": "Esnek",
};

const DEMO_REQUEST: ServiceRequest = {
  id: "demo-req-1",
  category: "Danışman › Vize / Göçmenlik",
  subcategory: "Çalışma Vizesi",
  title: "[DEMO] Almanya çalışma vizesi başvurusu için danışmanlık",
  description: "Bu bir demo talebidir. Gerçek bir hizmet talebi oluşturduğunuzda burada listelenecek.",
  city: "Berlin",
  country: "Almanya",
  budget_min: 100,
  budget_max: 500,
  preferred_time: "flexible",
  urgency: "normal",
  attachment_urls: [],
  status: "open",
  created_at: new Date().toISOString(),
  proposals: [],
};

const ServiceRequestsList = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibilityTick, setVisibilityTick] = useState(0);
  const hasReal = useDemoFlag("serviceRequests");

  useEffect(() => {
    const onChange = () => setVisibilityTick(t => t + 1);
    window.addEventListener("corteqs:service-request-visibility-change", onChange);
    return () => window.removeEventListener("corteqs:service-request-visibility-change", onChange);
  }, []);

  const fetchRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    const { data: reqData } = await supabase
      .from("service_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!reqData) {
      setRequests([]);
      setLoading(false);
      return;
    }

    // Fetch proposals for each request
    const requestsWithProposals = await Promise.all(
      reqData.map(async (req) => {
        const { data: proposals } = await supabase
          .from("service_proposals")
          .select("*")
          .eq("request_id", req.id)
          .order("created_at", { ascending: false });

        // Fetch consultant names
        const proposalsWithNames = await Promise.all(
          (proposals || []).map(async (p) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", p.consultant_id)
              .single();
            return { ...p, consultant_name: profile?.full_name || "Danışman" };
          })
        );

        return { ...req, proposals: proposalsWithNames } as ServiceRequest;
      })
    );

    if (requestsWithProposals.length > 0) markRealServiceRequest();
    setRequests(requestsWithProposals);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();

    // Listen for new proposals in realtime
    const channel = supabase
      .channel("proposals-updates")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "service_proposals" }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleProposalAction = async (proposalId: string, action: "accepted" | "rejected") => {
    await supabase.from("service_proposals").update({ status: action }).eq("id", proposalId);
    if (action === "accepted") {
      const proposal = requests.flatMap(r => r.proposals || []).find(p => p.id === proposalId);
      if (proposal) {
        await supabase.from("service_requests").update({ status: "in_progress" }).eq("id", requests.find(r => r.proposals?.some(p => p.id === proposalId))?.id || "");
      }
    }
    fetchRequests();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  const showDemo = !hasReal && requests.length === 0;
  const baseRequests = showDemo ? [DEMO_REQUEST] : requests;

  // Business rule: a service request remains on the profile and in AI-matched
  // providers' notifications for max 21 days. Only up to 4 active requests are
  // shown at the same time (newest first; expired/closed ones drop out).
  const MAX_ACTIVE = 4;
  const EXPIRY_DAYS = 21;
  const now = Date.now();
  const ACTIVE_STATUSES = new Set(["open", "in_progress"]);
  const isActive = (r: ServiceRequest) => {
    const ageDays = (now - new Date(r.created_at).getTime()) / 86400000;
    return ACTIVE_STATUSES.has(r.status) && ageDays <= EXPIRY_DAYS;
  };
  const activeRequests = baseRequests.filter(isActive).slice(0, MAX_ACTIVE);
  const inactiveRequests = baseRequests.filter((r) => !isActive(r));
  const displayRequests = [...activeRequests, ...inactiveRequests];
  const hiddenActiveCount = baseRequests.filter(isActive).length - activeRequests.length;

  if (displayRequests.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-5xl mb-4 block">📋</span>
        <p className="text-lg font-semibold text-foreground mb-2">Bu bölgeye henüz bir hizmet talebiniz bulunmamaktadır</p>
        <p className="text-sm text-muted-foreground">
          Yeni bir talep oluşturarak danışmanlardan teklif alın.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showDemo && (
        <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-foreground">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>
            Bu bir <strong>demo görünümdür</strong>. İlk gerçek hizmet talebinizi oluşturduğunuzda demo kaldırılacak ve gerçek talepleriniz burada listelenecek.
          </span>
        </div>
      )}
      <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-foreground">
        <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <span>
          Aynı anda en fazla <strong>4 aktif hizmet talebi</strong> görüntülenir. Her talep, oluşturulduktan sonra <strong>21 gün</strong> boyunca profilinizde ve AI-match ile eşleşen hizmet verenlerin bildirimlerinde aktif kalır; süresi dolan talepler otomatik olarak listeden ve bildirimlerden düşer.
          {hiddenActiveCount > 0 && (
            <> Şu anda <strong>{hiddenActiveCount}</strong> aktif talebiniz limit nedeniyle gizli — biri kapanınca sıradaki otomatik aktifleşir.</>
          )}
        </span>
      </div>
      <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-foreground">
        <Eye className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
        <span>
          Her talebin yanındaki anahtarla <strong>"Talebimi profilimde göster"</strong> seçeneğini açıp kapatabilirsiniz. Açık olduğunda <em>Talebiniz Profilinizde Görünür</em> ve diğer üyeler bu talebi profilinizdeki "Hizmet Talepleri" sekmesinde görebilir.
        </span>
      </div>
      {displayRequests.map((req) => {
        const isExpanded = expandedId === req.id;
        const statusInfo = STATUS_MAP[req.status] || STATUS_MAP.open;
        const urgencyInfo = URGENCY_MAP[req.urgency] || URGENCY_MAP.normal;
        const proposalCount = req.proposals?.length || 0;
        const visible = isRequestVisible(req.id);
        void visibilityTick;

        return (
          <div key={req.id} className="border border-border rounded-xl bg-card overflow-hidden">
            {/* Header */}
            <div
              className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : req.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-foreground">{req.title}</h3>
                    <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                    <Badge variant="outline" className={urgencyInfo.color}>{urgencyInfo.label}</Badge>
                    {visible ? (
                      <Badge variant="outline" className="gap-1 text-[10px] text-emerald-600 border-emerald-500/30">
                        <Eye className="h-3 w-3" /> Profilde Görünür
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
                        <EyeOff className="h-3 w-3" /> Profilde Gizli
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {req.category}{req.subcategory ? ` / ${req.subcategory}` : ""}</span>
                    {req.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {req.city}{req.country ? `, ${req.country}` : ""}</span>}
                    {req.preferred_time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {TIME_MAP[req.preferred_time] || req.preferred_time}</span>}
                    {(req.budget_min || req.budget_max) && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {req.budget_min && req.budget_max ? `€${req.budget_min} - €${req.budget_max}` : req.budget_min ? `€${req.budget_min}+` : `Max €${req.budget_max}`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {proposalCount > 0 && (
                    <Badge className="bg-primary/15 text-primary border-primary/30 gap-1">
                      <MessageSquare className="h-3 w-3" /> {proposalCount} teklif
                    </Badge>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-border p-4 space-y-4">
                {/* Profile visibility toggle (per request) */}
                <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                  {visible ? <Eye className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" /> : <EyeOff className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">Talebimi profilimde göster</span>
                      <Switch
                        checked={visible}
                        onCheckedChange={(v) => setRequestVisible(req.id, v)}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Talebiniz Profilinizde Görünür — açıkken diğer üyeler profilinizdeki "Hizmet Talepleri" sekmesinden bu talebi görebilir.
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{req.description}</p>
                </div>

                {/* Attachments */}
                {req.attachment_urls && req.attachment_urls.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {req.attachment_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <Badge variant="outline" className="gap-1.5 cursor-pointer hover:bg-muted">
                          <FileText className="h-3 w-3" /> Dosya {i + 1} <ExternalLink className="h-3 w-3" />
                        </Badge>
                      </a>
                    ))}
                  </div>
                )}

                {/* Proposals */}
                <div>
                  <h4 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" /> Gelen Teklifler ({proposalCount})
                  </h4>
                  {proposalCount === 0 ? (
                    <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4 text-center">
                      Henüz teklif gelmedi. Danışmanlar talebinizi inceliyor...
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {req.proposals?.map((proposal) => (
                        <div key={proposal.id} className="border border-border rounded-lg p-4 bg-muted/20">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <p className="font-medium text-foreground text-sm">{proposal.consultant_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(proposal.created_at).toLocaleDateString("tr-TR")}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {proposal.price && (
                                <Badge className="bg-success/15 text-success border-success/30">€{proposal.price}</Badge>
                              )}
                              {proposal.status === "pending" ? (
                                <Badge variant="outline" className="text-gold">Beklemede</Badge>
                              ) : proposal.status === "accepted" ? (
                                <Badge className="bg-turquoise/15 text-turquoise border-turquoise/30">Kabul Edildi</Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">Reddedildi</Badge>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-foreground whitespace-pre-wrap mb-2">{proposal.message}</p>

                          {(proposal.estimated_duration || proposal.scope || proposal.payment_terms) && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 mb-3">
                              {proposal.estimated_duration && (
                                <div><span className="font-medium text-foreground">Süre:</span> {proposal.estimated_duration}</div>
                              )}
                              {proposal.scope && (
                                <div><span className="font-medium text-foreground">Kapsam:</span> {proposal.scope}</div>
                              )}
                              {proposal.payment_terms && (
                                <div><span className="font-medium text-foreground">Ödeme:</span> {proposal.payment_terms}</div>
                              )}
                            </div>
                          )}

                          <div className="flex gap-2 flex-wrap">
                            <PlatformMessageButton
                              recipientKind="consultant"
                              recipientSlug={proposal.consultant_id}
                              recipientName={proposal.consultant_name || "Danışman"}
                              recipientUserId={proposal.consultant_id}
                              defaultSubject={`Teklif: ${req.title}`}
                              size="sm"
                              variant="outline"
                              label="Mesaj Gönder"
                              className="h-7 text-xs"
                            />
                            {proposal.status === "pending" && (
                              <>
                                <Button size="sm" className="gap-1 h-7 text-xs" onClick={() => handleProposalAction(proposal.id, "accepted")}>
                                  <CheckCircle className="h-3 w-3" /> Kabul Et
                                </Button>
                                <Button size="sm" variant="outline" className="gap-1 h-7 text-xs text-destructive" onClick={() => handleProposalAction(proposal.id, "rejected")}>
                                  <XCircle className="h-3 w-3" /> Reddet
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground/60">
                  Oluşturulma: {new Date(req.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ServiceRequestsList;
