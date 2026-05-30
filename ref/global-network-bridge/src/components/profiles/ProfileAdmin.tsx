import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Building2, Calendar, BarChart3, ShieldCheck,
  AlertTriangle, CheckCircle, Clock, Eye, TrendingUp,
  Settings, Globe, Megaphone, CreditCard, Ban, UserCheck, Star, Sparkles,
  Crown, Mail, Package, MessageSquare, PenLine, Coffee
} from "lucide-react";
import BrandSettings from "@/components/admin/BrandSettings";
import RevenueTracker from "@/components/admin/RevenueTracker";
import WelcomePackTracker from "@/components/admin/WelcomePackTracker";
import VBloggerDashboard from "@/components/admin/VBloggerDashboard";
import AmbassadorDashboard from "@/components/admin/AmbassadorDashboard";
import WhatsAppLandingsModeration from "@/components/admin/WhatsAppLandingsModeration";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const ProfileAdmin = () => {
  const { toast } = useToast();
  const [ambassadorApps, setAmbassadorApps] = useState<any[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [foundingSignups, setFoundingSignups] = useState<any[]>([]);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalBusinesses: 0,
    totalAssociations: 0,
    totalConsultants: 0,
    totalEvents: 0,
    totalCafes: 0,
    totalJobs: 0,
    revenue: 0,
    foundingCount: 0,
    contactCount: 0,
  });

  useEffect(() => {
    fetchAmbassadorApps();
    fetchApprovals();
    fetchFounding();
    fetchContacts();
    fetchStats();
  }, []);

  const fetchAmbassadorApps = async () => {
    setAppsLoading(true);
    const { data } = await supabase.from("city_ambassador_applications" as any).select("*").order("created_at", { ascending: false });
    setAmbassadorApps((data as any[]) || []);
    setAppsLoading(false);
  };

  const fetchApprovals = async () => {
    const { data } = await (supabase.from("approval_requests" as any) as any)
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setPendingApprovals((data as any[]) || []);
  };

  const fetchFounding = async () => {
    const { data } = await (supabase.from("founding_1000_signups" as any) as any)
      .select("*")
      .order("created_at", { ascending: false });
    setFoundingSignups((data as any[]) || []);
  };

  const fetchContacts = async () => {
    const { data } = await (supabase.from("contact_messages" as any) as any)
      .select("*")
      .order("created_at", { ascending: false });
    setContactMessages((data as any[]) || []);
  };

  const fetchStats = async () => {
    const head = { count: "exact" as const, head: true };
    const [users, biz, assoc, cons, ev, cf, jb, fnd, ctc] = await Promise.all([
      supabase.from("profiles").select("*", head),
      supabase.from("profiles").select("*", head).eq("account_type", "business"),
      supabase.from("profiles").select("*", head).eq("account_type", "association"),
      supabase.from("profiles").select("*", head).eq("account_type", "consultant"),
      supabase.from("events" as any).select("*", head),
      supabase.from("cafes" as any).select("*", head),
      supabase.from("job_listings" as any).select("*", head),
      supabase.from("founding_1000_signups" as any).select("*", head),
      supabase.from("contact_messages" as any).select("*", head),
    ]);
    setStats((prev) => ({
      ...prev,
      totalUsers: users.count || 0,
      activeUsers: users.count || 0,
      totalBusinesses: biz.count || 0,
      totalAssociations: assoc.count || 0,
      totalConsultants: cons.count || 0,
      totalEvents: ev.count || 0,
      totalCafes: cf.count || 0,
      totalJobs: jb.count || 0,
      foundingCount: fnd.count || 0,
      contactCount: ctc.count || 0,
    }));
  };

  const updateFoundingStatus = async (id: string, status: string) => {
    const { error } = await (supabase.from("founding_1000_signups" as any) as any)
      .update({ status }).eq("id", id);
    if (error) { toast({ title: "Hata", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Güncellendi", description: status });
    fetchFounding();
  };

  const updateContactStatus = async (id: string, status: string) => {
    const { error } = await (supabase.from("contact_messages" as any) as any)
      .update({ status }).eq("id", id);
    if (error) { toast({ title: "Hata", description: error.message, variant: "destructive" }); return; }
    fetchContacts();
  };

  const decideApproval = async (item: any, approve: boolean) => {
    const status = approve ? "approved" : "rejected";
    const { error } = await (supabase.from("approval_requests" as any) as any)
      .update({ status, decided_at: new Date().toISOString() })
      .eq("id", item.id);
    if (error) { toast({ title: "Hata", description: error.message, variant: "destructive" }); return; }
    if (approve) {
      const patch = item.request_type === "verified_business" ? { is_verified: true } : item.request_type === "hiring_mode" ? { hiring_mode: true } : null;
      if (patch) await (supabase.from("profiles") as any).update(patch).eq("id", item.user_id);
    }
    toast({ title: approve ? "Onaylandı ✓" : "Reddedildi", description: item.request_type });
    fetchApprovals();
  };

  const updateAppStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("city_ambassador_applications" as any).update({ status } as any).eq("id", id);
    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Güncellendi", description: `Başvuru ${status === "approved" ? "onaylandı" : "reddedildi"}.` });
      fetchAmbassadorApps();
    }
  };

  const platformStats = {
    ...stats,
    pendingApprovals: pendingApprovals.length,
    reports: 0,
  };

  const recentReports: { id: number; reporter: string; target: string; reason: string; status: string }[] = [];
  const recentTransactions: { user: string; type: string; amount: number; date: string }[] = [];
  return (
    <>
      {/* Admin header */}
      <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Paneli</h1>
            <p className="text-muted-foreground">CorteQS Platform Yönetimi</p>
          </div>
          {platformStats.pendingApprovals > 0 && (
            <Badge className="bg-gold/15 text-gold border-gold/30 ml-auto gap-1">
              <AlertTriangle className="h-3 w-3" /> {platformStats.pendingApprovals} onay bekliyor
            </Badge>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Toplam Kullanıcı", value: platformStats.totalUsers.toLocaleString(), icon: Users, color: "text-primary" },
          { label: "İşletme", value: platformStats.totalBusinesses, icon: Building2, color: "text-gold" },
          { label: "Dernek / Vakıf", value: platformStats.totalAssociations, icon: Globe, color: "text-turquoise" },
          { label: "Danışman", value: platformStats.totalConsultants, icon: UserCheck, color: "text-violet-500" },
          { label: "Etkinlik", value: platformStats.totalEvents, icon: Calendar, color: "text-primary" },
          { label: "Cafe", value: platformStats.totalCafes, icon: Coffee, color: "text-amber-600" },
          { label: "İş İlanı", value: platformStats.totalJobs, icon: Megaphone, color: "text-emerald-500" },
          { label: "Founding 1000", value: platformStats.foundingCount, icon: Crown, color: "text-amber-500" },
          { label: "İletişim", value: platformStats.contactCount, icon: Mail, color: "text-primary" },
          { label: "Onay Bekleyen", value: platformStats.pendingApprovals, icon: Clock, color: "text-gold" },
        ].map((stat, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 shadow-card text-center">
            <stat.icon className={`h-5 w-5 ${stat.color} mx-auto mb-2`} />
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="approvals" className="w-full">
        <TabsList className="bg-card border border-border w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="approvals" className="gap-1.5"><Clock className="h-4 w-4" /> Onaylar</TabsTrigger>
          <TabsTrigger value="founding" className="gap-1.5"><Crown className="h-4 w-4" /> Founding 1000{stats.foundingCount > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{stats.foundingCount}</Badge>}</TabsTrigger>
          <TabsTrigger value="contact" className="gap-1.5"><Mail className="h-4 w-4" /> İletişim{stats.contactCount > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{stats.contactCount}</Badge>}</TabsTrigger>
          <TabsTrigger value="ambassadors" className="gap-1.5"><Star className="h-4 w-4" /> Elçi Başvuruları</TabsTrigger>
          <TabsTrigger value="ambassadors-dash" className="gap-1.5"><Globe className="h-4 w-4" /> Elçi Yönetimi</TabsTrigger>
          <TabsTrigger value="welcome-pack" className="gap-1.5"><Package className="h-4 w-4" /> Welcome Pack</TabsTrigger>
          <TabsTrigger value="bloggers" className="gap-1.5"><PenLine className="h-4 w-4" /> Bloggerlar</TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5"><MessageSquare className="h-4 w-4" /> WhatsApp</TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5"><AlertTriangle className="h-4 w-4" /> Şikayetler</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5"><Users className="h-4 w-4" /> Kullanıcılar</TabsTrigger>
          <TabsTrigger value="revenue" className="gap-1.5"><CreditCard className="h-4 w-4" /> Gelir</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Analitik</TabsTrigger>
          <TabsTrigger value="brand" className="gap-1.5"><Sparkles className="h-4 w-4" /> Marka</TabsTrigger>
        </TabsList>

        <TabsContent value="brand" className="mt-6"><BrandSettings /></TabsContent>
        <TabsContent value="ambassadors-dash" className="mt-6"><AmbassadorDashboard /></TabsContent>
        <TabsContent value="welcome-pack" className="mt-6"><WelcomePackTracker /></TabsContent>
        <TabsContent value="bloggers" className="mt-6"><VBloggerDashboard /></TabsContent>
        <TabsContent value="whatsapp" className="mt-6"><WhatsAppLandingsModeration /></TabsContent>

        {/* FOUNDING 1000 */}
        <TabsContent value="founding" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" /> Founding 1000 Kayıtları
              <Badge variant="secondary" className="ml-2">{foundingSignups.length}</Badge>
            </h2>
            {foundingSignups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Henüz kayıt yok.</p>
            ) : (
              <div className="space-y-3">
                {foundingSignups.map((s) => (
                  <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Crown className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{s.full_name || s.email || s.user_id?.slice(0, 8)}</h3>
                      <p className="text-sm text-muted-foreground">
                        {s.account_type} · {s.email || "—"} · {new Date(s.created_at).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                    <Badge className={s.status === "approved" ? "bg-success/15 text-success" : s.status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-gold/15 text-gold"}>
                      {s.status === "approved" ? "Onaylı" : s.status === "rejected" ? "Reddedildi" : "Beklemede"}
                    </Badge>
                    {s.status === "pending" && (
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" className="gap-1" onClick={() => updateFoundingStatus(s.id, "approved")}><CheckCircle className="h-3 w-3" /> Onayla</Button>
                        <Button variant="outline" size="sm" className="gap-1 text-destructive" onClick={() => updateFoundingStatus(s.id, "rejected")}><Ban className="h-3 w-3" /> Reddet</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* CONTACT MESSAGES */}
        <TabsContent value="contact" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" /> İletişim Mesajları
              <Badge variant="secondary" className="ml-2">{contactMessages.length}</Badge>
            </h2>
            {contactMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Henüz mesaj yok.</p>
            ) : (
              <div className="space-y-3">
                {contactMessages.map((m) => (
                  <div key={m.id} className="p-4 rounded-xl bg-muted/50 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{m.full_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          <a href={`mailto:${m.email}`} className="hover:text-primary underline-offset-2 hover:underline">{m.email}</a>
                          {(m.city || m.country) && <> · {[m.city, m.country].filter(Boolean).join(", ")}</>}
                          {" · "}{new Date(m.created_at).toLocaleString("tr-TR")}
                        </p>
                      </div>
                      <Badge className={m.status === "resolved" ? "bg-success/15 text-success" : "bg-primary/15 text-primary"}>
                        {m.status === "resolved" ? "Çözüldü" : "Yeni"}
                      </Badge>
                    </div>
                    {m.message && <p className="text-sm text-foreground whitespace-pre-wrap">{m.message}</p>}
                    {m.status !== "resolved" && (
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => updateContactStatus(m.id, "resolved")}>
                          <CheckCircle className="h-3 w-3" /> Çözüldü olarak işaretle
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* APPROVALS */}
        <TabsContent value="approvals" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5 text-gold" /> Onay Bekleyen Hesaplar
            </h2>
            <div className="space-y-3">
              {pendingApprovals.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Onay bekleyen talep yok.</p>
              )}
              {pendingApprovals.map((item) => {
                const label = item.request_type === "verified_business" ? "Onaylı İşletme Rozeti"
                  : item.request_type === "hiring_mode" ? "İşe Alım Modu" : item.request_type;
                const name = item.payload?.business_name || item.user_id?.slice(0, 8);
                return (
                  <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{name}</h3>
                      <p className="text-sm text-muted-foreground">{label} · {new Date(item.created_at).toLocaleDateString("tr-TR")}</p>
                      {(item.payload?.country || item.payload?.city) && (
                        <p className="text-xs text-muted-foreground">{item.payload?.city}{item.payload?.city && item.payload?.country ? ", " : ""}{item.payload?.country}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" className="gap-1" onClick={() => decideApproval(item, true)}><CheckCircle className="h-3 w-3" /> Onayla</Button>
                      <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={() => decideApproval(item, false)}><Ban className="h-3 w-3" /> Reddet</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* AMBASSADOR APPLICATIONS */}
        <TabsContent value="ambassadors" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Star className="h-5 w-5 text-gold" /> Şehir Elçisi Başvuruları
            </h2>
            {appsLoading ? (
              <p className="text-muted-foreground text-sm">Yükleniyor...</p>
            ) : ambassadorApps.length === 0 ? (
              <p className="text-muted-foreground text-sm">Henüz başvuru yok.</p>
            ) : (
              <div className="space-y-4">
                {ambassadorApps.map((app: any) => (
                  <div key={app.id} className="p-4 rounded-xl bg-muted/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{app.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{app.city}, {app.country} · {app.email} · {app.phone}</p>
                      </div>
                      <Badge className={app.status === "approved" ? "bg-success/15 text-success" : app.status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-gold/15 text-gold"}>
                        {app.status === "approved" ? "Onaylandı" : app.status === "rejected" ? "Reddedildi" : "Beklemede"}
                      </Badge>
                    </div>
                    {app.motivation && <p className="text-xs text-muted-foreground"><strong>Motivasyon:</strong> {app.motivation}</p>}
                    {app.reach_count && <p className="text-xs text-muted-foreground"><strong>Erişim:</strong> {app.reach_count} kişi — {app.reach_description}</p>}
                    {app.weekly_hours && <p className="text-xs text-muted-foreground"><strong>Haftalık saat:</strong> {app.weekly_hours}</p>}
                    {app.status === "pending" && (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="gap-1" onClick={() => updateAppStatus(app.id, "approved")}><CheckCircle className="h-3 w-3" /> Onayla</Button>
                        <Button variant="outline" size="sm" className="gap-1 text-destructive" onClick={() => updateAppStatus(app.id, "rejected")}><Ban className="h-3 w-3" /> Reddet</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* REPORTS */}
        <TabsContent value="reports" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Şikayetler & Raporlar
            </h2>
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div key={report.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{report.target}</h3>
                    <p className="text-sm text-muted-foreground">
                      Raporlayan: {report.reporter} · Sebep: {report.reason}
                    </p>
                  </div>
                  <Badge variant={report.status === "Beklemede" ? "destructive" : "secondary"} className="text-xs shrink-0">
                    {report.status}
                  </Badge>
                  <Button variant="outline" size="sm">İncele</Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* USERS */}
        <TabsContent value="users" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Kullanıcı Dağılımı
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { label: "Bireysel", count: 3800, pct: 84, color: "bg-primary" },
                { label: "İşletme", count: 312, pct: 7, color: "bg-turquoise" },
                { label: "Dernek/Vakıf", count: 87, pct: 2, color: "bg-gold" },
              ].map((cat) => (
                <div key={cat.label} className="p-4 rounded-xl bg-muted/50 text-center">
                  <p className="text-2xl font-bold text-foreground">{cat.count}</p>
                  <p className="text-sm text-muted-foreground">{cat.label} ({cat.pct}%)</p>
                  <div className="bg-muted rounded-full h-2 mt-2">
                    <div className={`${cat.color} rounded-full h-2`} style={{ width: `${cat.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Ülkelere Göre</h3>
              {[
                { country: "🇩🇪 Almanya", users: 1820, pct: 40 },
                { country: "🇳🇱 Hollanda", users: 680, pct: 15 },
                { country: "🇬🇧 İngiltere", users: 520, pct: 12 },
                { country: "🇫🇷 Fransa", users: 410, pct: 9 },
                { country: "🇦🇹 Avusturya", users: 340, pct: 8 },
              ].map((c) => (
                <div key={c.country} className="flex items-center gap-3">
                  <span className="text-sm w-28">{c.country}</span>
                  <div className="flex-1 bg-muted rounded-full h-3">
                    <div className="bg-primary rounded-full h-3" style={{ width: `${c.pct * 2.5}%` }} />
                  </div>
                  <span className="text-sm font-medium text-foreground w-16 text-right">{c.users}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* REVENUE */}
        <TabsContent value="revenue" className="mt-6">
          <RevenueTracker />
        </TabsContent>

        {/* ANALYTICS */}
        <TabsContent value="analytics" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Platform Büyümesi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-foreground mb-3">Haftalık Kayıtlar</h3>
                <div className="space-y-2">
                  {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day, i) => {
                    const val = [12, 18, 22, 15, 25, 8, 5][i];
                    return (
                      <div key={day} className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-8">{day}</span>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div className="bg-primary rounded-full h-2" style={{ width: `${val * 4}%` }} />
                        </div>
                        <span className="text-xs font-medium text-foreground w-6">{val}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-3">Popüler Özellikler</h3>
                <div className="space-y-3">
                  {[
                    { feature: "Danışman Arama", usage: 89 },
                    { feature: "Etkinlik Katılım", usage: 72 },
                    { feature: "AI Twin", usage: 58 },
                    { feature: "WhatsApp Grup", usage: 45 },
                    { feature: "İşletme Arama", usage: 38 },
                  ].map((f) => (
                    <div key={f.feature}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-foreground">{f.feature}</span>
                        <span className="text-muted-foreground">{f.usage}%</span>
                      </div>
                      <div className="bg-muted rounded-full h-2">
                        <div className="bg-turquoise rounded-full h-2" style={{ width: `${f.usage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default ProfileAdmin;
