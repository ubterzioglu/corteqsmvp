import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Building2, Calendar, BarChart3, ShieldCheck,
  AlertTriangle, CheckCircle, Clock, Eye, TrendingUp,
  Settings, Globe, Megaphone, CreditCard, Ban, UserCheck, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const ProfileAdmin = () => {
  const { toast } = useToast();
  const [ambassadorApps, setAmbassadorApps] = useState<any[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);

  useEffect(() => {
    fetchAmbassadorApps();
  }, []);

  const fetchAmbassadorApps = async () => {
    setAppsLoading(true);
    const { data } = await supabase.from("city_ambassador_applications" as any).select("*").order("created_at", { ascending: false });
    setAmbassadorApps((data as any[]) || []);
    setAppsLoading(false);
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
    totalUsers: 4520,
    activeUsers: 2180,
    totalBusinesses: 312,
    totalAssociations: 87,
    totalEvents: 156,
    revenue: 28400,
    pendingApprovals: 14,
    reports: 3,
  };

  const pendingApprovals = [
    { id: 1, name: "Berlin Türk İşadamları Derneği", type: "Dernek", date: "07 Mar 2026" },
    { id: 2, name: "Doner Kings GmbH", type: "İşletme", date: "06 Mar 2026" },
    { id: 3, name: "Istanbul Consulting", type: "İşletme", date: "05 Mar 2026" },
    { id: 4, name: "Hollanda Türk Kadınlar Birliği", type: "Dernek", date: "04 Mar 2026" },
  ];

  const recentReports = [
    { id: 1, reporter: "Elif D.", target: "Spam Etkinlik", reason: "Sahte etkinlik ilanı", status: "Beklemede" },
    { id: 2, reporter: "Can Ö.", target: "FakeConsult Ltd.", reason: "Yanıltıcı bilgi", status: "Beklemede" },
    { id: 3, reporter: "Zeynep A.", target: "Kullanıcı #4521", reason: "Uygunsuz içerik", status: "İnceleniyor" },
  ];

  const recentTransactions = [
    { user: "Anatolian Tech GmbH", type: "Etkinlik Boost", amount: 49, date: "08 Mar" },
    { user: "Emre Aydın", type: "Para Yükleme", amount: 100, date: "07 Mar" },
    { user: "ATT Derneği", type: "Öne Çıkan Dernek", amount: 29, date: "06 Mar" },
    { user: "Zeynep Arslan", type: "AI Twin Seans", amount: 15, date: "05 Mar" },
  ];

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
          { label: "Aktif Kullanıcı", value: platformStats.activeUsers.toLocaleString(), icon: UserCheck, color: "text-turquoise" },
          { label: "İşletme", value: platformStats.totalBusinesses, icon: Building2, color: "text-gold" },
          { label: "Dernek / Vakıf", value: platformStats.totalAssociations, icon: Globe, color: "text-turquoise" },
          { label: "Etkinlik", value: platformStats.totalEvents, icon: Calendar, color: "text-primary" },
          { label: "Gelir", value: `€${(platformStats.revenue / 1000).toFixed(1)}K`, icon: CreditCard, color: "text-success" },
          { label: "Onay Bekleyen", value: platformStats.pendingApprovals, icon: Clock, color: "text-gold" },
          { label: "Şikayet", value: platformStats.reports, icon: AlertTriangle, color: "text-destructive" },
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
          <TabsTrigger value="ambassadors" className="gap-1.5"><Star className="h-4 w-4" /> Elçi Başvuruları</TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5"><AlertTriangle className="h-4 w-4" /> Şikayetler</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5"><Users className="h-4 w-4" /> Kullanıcılar</TabsTrigger>
          <TabsTrigger value="revenue" className="gap-1.5"><CreditCard className="h-4 w-4" /> Gelir</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Analitik</TabsTrigger>
        </TabsList>

        {/* APPROVALS */}
        <TabsContent value="approvals" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5 text-gold" /> Onay Bekleyen Hesaplar
            </h2>
            <div className="space-y-3">
              {pendingApprovals.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {item.type === "Dernek" ? <Users className="h-5 w-5 text-primary" /> : <Building2 className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.type} · Başvuru: {item.date}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" className="gap-1"><CheckCircle className="h-3 w-3" /> Onayla</Button>
                    <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive"><Ban className="h-3 w-3" /> Reddet</Button>
                  </div>
                </div>
              ))}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" /> Aylık Gelir
              </h2>
              <div className="space-y-3">
                {["Oca", "Şub", "Mar"].map((month, i) => {
                  const val = [3200, 4100, 5800][i];
                  return (
                    <div key={month} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-8">{month}</span>
                      <div className="flex-1 bg-muted rounded-full h-3">
                        <div className="bg-success rounded-full h-3" style={{ width: `${(val / 6000) * 100}%` }} />
                      </div>
                      <span className="text-sm font-medium text-foreground w-16 text-right">€{val}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" /> Son İşlemler
              </h2>
              <div className="space-y-3">
                {recentTransactions.map((tx, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.user}</p>
                      <p className="text-xs text-muted-foreground">{tx.type} · {tx.date}</p>
                    </div>
                    <span className="font-bold text-sm text-success">+€{tx.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
