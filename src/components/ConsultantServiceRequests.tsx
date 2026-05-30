import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Briefcase, MapPin, DollarSign, Clock, Send, ChevronDown, ChevronUp,
  FileText, ExternalLink, User, MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ServiceRequest {
  id: string;
  user_id: string;
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
  user_name?: string;
  my_proposal?: any;
}

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

const ConsultantServiceRequests = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [proposalFormId, setProposalFormId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingProposal, setSendingProposal] = useState(false);
  const [isDetailed, setIsDetailed] = useState(false);
  const [proposalForm, setProposalForm] = useState({
    message: "",
    price: "",
    estimatedDuration: "",
    scope: "",
    paymentTerms: "",
  });

  const fetchRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    // Detect role — consultants filter by their categories; businesses see all open requests
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roleNames = (roles || []).map((r) => r.role as string);
    const isConsultant = roleNames.includes("consultant");
    const isBusiness = roleNames.includes("business");

    let query = supabase
      .from("service_requests")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (isConsultant && !isBusiness) {
      const { data: myCats } = await supabase
        .from("consultant_categories")
        .select("category")
        .eq("user_id", user.id);
      const myCategories = myCats?.map((c) => c.category) || [];
      if (myCategories.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }
      query = query.in("category", myCategories);
    }

    const { data: reqData } = await query;

    if (!reqData) { setRequests([]); setLoading(false); return; }

    const enriched = await Promise.all(
      reqData.map(async (req) => {
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", req.user_id).single();
        const { data: myProposal } = await supabase
          .from("service_proposals")
          .select("*")
          .eq("request_id", req.id)
          .eq("consultant_id", user.id)
          .maybeSingle();
        return { ...req, user_name: profile?.full_name || "Kullanıcı", my_proposal: myProposal };
      })
    );

    setRequests(enriched as ServiceRequest[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSendProposal = async (requestId: string) => {
    if (!proposalForm.message) {
      toast({ title: "Mesaj zorunludur", variant: "destructive" });
      return;
    }

    setSendingProposal(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("service_proposals").insert({
        request_id: requestId,
        consultant_id: user.id,
        message: proposalForm.message,
        price: proposalForm.price ? parseFloat(proposalForm.price) : null,
        estimated_duration: proposalForm.estimatedDuration || null,
        scope: proposalForm.scope || null,
        payment_terms: proposalForm.paymentTerms || null,
      });

      if (error) throw error;

      // Send notification to the request owner
      const request = requests.find(r => r.id === requestId);
      if (request) {
        await supabase.from("notifications").insert({
          user_id: request.user_id,
          type: "proposal_received",
          title: "Yeni Teklif Geldi!",
          message: `"${request.title}" talebinize yeni bir teklif geldi.`,
          related_id: requestId,
        });
      }

      toast({ title: "Teklif gönderildi!", description: "Kullanıcı teklifinizi değerlendirecektir." });
      setProposalFormId(null);
      setProposalForm({ message: "", price: "", estimatedDuration: "", scope: "", paymentTerms: "" });
      fetchRequests();
    } catch (err: any) {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    } finally {
      setSendingProposal(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-5xl mb-4 block">📭</span>
        <p className="text-lg font-semibold text-foreground mb-2">Henüz açık talep yok</p>
        <p className="text-sm text-muted-foreground">
          Kategorilerinize uygun yeni hizmet talepleri geldiğinde burada görünecektir.
          <br />Profil Düzenle sekmesinden hizmet kategorilerinizi seçtiğinizden emin olun.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((req) => {
        const isExpanded = expandedId === req.id;
        const urgencyInfo = URGENCY_MAP[req.urgency] || URGENCY_MAP.normal;
        const alreadyProposed = !!req.my_proposal;

        return (
          <div key={req.id} className="border border-border rounded-xl bg-card overflow-hidden">
            <div
              className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : req.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-foreground">{req.title}</h3>
                    <Badge variant="outline" className={urgencyInfo.color}>{urgencyInfo.label}</Badge>
                    {alreadyProposed && (
                      <Badge className="bg-turquoise/15 text-turquoise border-turquoise/30">Teklif Verildi</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {req.user_name}</span>
                    <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {req.category}{req.subcategory ? ` / ${req.subcategory}` : ""}</span>
                    {req.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {req.city}</span>}
                    {(req.budget_min || req.budget_max) && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {req.budget_min && req.budget_max ? `€${req.budget_min}-${req.budget_max}` : req.budget_min ? `€${req.budget_min}+` : `Max €${req.budget_max}`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString("tr-TR")}</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-border p-4 space-y-4">
                <p className="text-sm text-foreground whitespace-pre-wrap">{req.description}</p>

                {req.preferred_time && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Tercih: {TIME_MAP[req.preferred_time] || req.preferred_time}
                  </p>
                )}

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

                {/* Already proposed */}
                {alreadyProposed ? (
                  <div className="bg-turquoise/5 border border-turquoise/20 rounded-lg p-4">
                    <p className="text-sm font-medium text-turquoise mb-1">✓ Teklifiniz gönderildi</p>
                    <p className="text-sm text-foreground">{req.my_proposal.message}</p>
                    {req.my_proposal.price && <p className="text-sm font-semibold text-foreground mt-1">Fiyat: €{req.my_proposal.price}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      Durum: {req.my_proposal.status === "pending" ? "Beklemede" : req.my_proposal.status === "accepted" ? "Kabul Edildi ✓" : "Reddedildi"}
                    </p>
                  </div>
                ) : proposalFormId === req.id ? (
                  /* Proposal Form */
                  <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" /> Teklif Gönder
                    </h4>

                    <div className="flex gap-2 mb-3">
                      <Button
                        size="sm"
                        variant={!isDetailed ? "default" : "outline"}
                        onClick={() => setIsDetailed(false)}
                        className="text-xs h-7"
                      >
                        Hızlı Not
                      </Button>
                      <Button
                        size="sm"
                        variant={isDetailed ? "default" : "outline"}
                        onClick={() => setIsDetailed(true)}
                        className="text-xs h-7"
                      >
                        Detaylı Teklif
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Mesaj *</Label>
                        <Textarea
                          placeholder="Teklifinizi açıklayın..."
                          value={proposalForm.message}
                          onChange={e => setProposalForm(p => ({ ...p, message: e.target.value }))}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Fiyat (€)</Label>
                        <Input
                          type="number"
                          placeholder="250"
                          value={proposalForm.price}
                          onChange={e => setProposalForm(p => ({ ...p, price: e.target.value }))}
                        />
                      </div>

                      {isDetailed && (
                        <>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Tahmini Süre</Label>
                            <Input
                              placeholder="Örn: 2-3 hafta"
                              value={proposalForm.estimatedDuration}
                              onChange={e => setProposalForm(p => ({ ...p, estimatedDuration: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Hizmet Kapsamı</Label>
                            <Textarea
                              placeholder="Hangi hizmetleri sunacaksınız..."
                              value={proposalForm.scope}
                              onChange={e => setProposalForm(p => ({ ...p, scope: e.target.value }))}
                              rows={2}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Ödeme Koşulları</Label>
                            <Input
                              placeholder="Örn: %50 peşin, %50 tamamlandığında"
                              value={proposalForm.paymentTerms}
                              onChange={e => setProposalForm(p => ({ ...p, paymentTerms: e.target.value }))}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="gap-1" onClick={() => handleSendProposal(req.id)} disabled={sendingProposal}>
                        <Send className="h-3 w-3" /> {sendingProposal ? "Gönderiliyor..." : "Gönder"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setProposalFormId(null)}>İptal</Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" className="gap-1.5" onClick={() => setProposalFormId(req.id)}>
                    <Send className="h-3.5 w-3.5" /> Teklif Ver
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ConsultantServiceRequests;
