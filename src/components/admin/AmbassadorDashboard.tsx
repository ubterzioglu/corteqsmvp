import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Flag, Users, Calendar, DollarSign, TrendingUp, Trophy, Crown,
  ArrowUpRight, Search, Mail, Send, Tag, Globe, MapPin, Star,
  Ticket, Gift, BarChart3, Megaphone
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

// ─── Mock Ambassador Data ────────────────────────────────
const ambassadors = [
  {
    id: "amb1", name: "Ali Demir", city: "Berlin", country: "Almanya",
    events: 12, participants: 840, totalRevenue: 4200, corteqsRevenue: 1260,
    couponSubscriptions: 28, subscriptionTotal: 2100, year: 1,
    monthlyTrend: [
      { m: "Oca", rev: 320 }, { m: "Şub", rev: 480 }, { m: "Mar", rev: 550 },
      { m: "Nis", rev: 620 }, { m: "May", rev: 780 }, { m: "Haz", rev: 920 },
    ]
  },
  {
    id: "amb2", name: "Selin Ak", city: "Londra", country: "İngiltere",
    events: 9, participants: 620, totalRevenue: 3100, corteqsRevenue: 930,
    couponSubscriptions: 22, subscriptionTotal: 1650, year: 1,
    monthlyTrend: [
      { m: "Oca", rev: 250 }, { m: "Şub", rev: 380 }, { m: "Mar", rev: 420 },
      { m: "Nis", rev: 510 }, { m: "May", rev: 640 }, { m: "Haz", rev: 750 },
    ]
  },
  {
    id: "amb3", name: "Kemal Öz", city: "Dubai", country: "BAE",
    events: 15, participants: 1100, totalRevenue: 5500, corteqsRevenue: 1650,
    couponSubscriptions: 35, subscriptionTotal: 2625, year: 1,
    monthlyTrend: [
      { m: "Oca", rev: 400 }, { m: "Şub", rev: 600 }, { m: "Mar", rev: 700 },
      { m: "Nis", rev: 850 }, { m: "May", rev: 1050 }, { m: "Haz", rev: 1200 },
    ]
  },
  {
    id: "amb4", name: "Zeynep Tan", city: "Paris", country: "Fransa",
    events: 6, participants: 380, totalRevenue: 1900, corteqsRevenue: 570,
    couponSubscriptions: 14, subscriptionTotal: 1050, year: 2,
    monthlyTrend: [
      { m: "Oca", rev: 180 }, { m: "Şub", rev: 220 }, { m: "Mar", rev: 280 },
      { m: "Nis", rev: 320 }, { m: "May", rev: 400 }, { m: "Haz", rev: 480 },
    ]
  },
  {
    id: "amb5", name: "Emre Yıldız", city: "Amsterdam", country: "Hollanda",
    events: 7, participants: 450, totalRevenue: 2250, corteqsRevenue: 675,
    couponSubscriptions: 18, subscriptionTotal: 1350, year: 1,
    monthlyTrend: [
      { m: "Oca", rev: 200 }, { m: "Şub", rev: 280 }, { m: "Mar", rev: 320 },
      { m: "Nis", rev: 380 }, { m: "May", rev: 450 }, { m: "Haz", rev: 520 },
    ]
  },
  {
    id: "amb6", name: "Mehmet Kara", city: "Münih", country: "Almanya",
    events: 8, participants: 520, totalRevenue: 2600, corteqsRevenue: 780,
    couponSubscriptions: 20, subscriptionTotal: 1500, year: 2,
    monthlyTrend: [
      { m: "Oca", rev: 220 }, { m: "Şub", rev: 300 }, { m: "Mar", rev: 380 },
      { m: "Nis", rev: 420 }, { m: "May", rev: 500 }, { m: "Haz", rev: 580 },
    ]
  },
  {
    id: "amb7", name: "Aylin Çelik", city: "Frankfurt", country: "Almanya",
    events: 5, participants: 310, totalRevenue: 1550, corteqsRevenue: 465,
    couponSubscriptions: 12, subscriptionTotal: 900, year: 1,
    monthlyTrend: [
      { m: "Oca", rev: 140 }, { m: "Şub", rev: 180 }, { m: "Mar", rev: 220 },
      { m: "Nis", rev: 260 }, { m: "May", rev: 320 }, { m: "Haz", rev: 380 },
    ]
  },
  {
    id: "amb8", name: "Can Doğan", city: "New York", country: "ABD",
    events: 4, participants: 280, totalRevenue: 1400, corteqsRevenue: 420,
    couponSubscriptions: 10, subscriptionTotal: 750, year: 1,
    monthlyTrend: [
      { m: "Oca", rev: 120 }, { m: "Şub", rev: 160 }, { m: "Mar", rev: 200 },
      { m: "Nis", rev: 240 }, { m: "May", rev: 300 }, { m: "Haz", rev: 350 },
    ]
  },
];

const getSubscriptionShare = (ambassador: typeof ambassadors[0]) => {
  const rate = ambassador.year === 1 ? 0.20 : 0.10;
  return Math.round(ambassador.subscriptionTotal * rate);
};

const chartTooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

const AmbassadorDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("revenue");
  const [countryFilter, setCountryFilter] = useState("all");
  const [autoNewsletter, setAutoNewsletter] = useState(false);

  const filtered = useMemo(() => {
    let list = [...ambassadors];
    if (countryFilter !== "all") list = list.filter(a => a.country === countryFilter);
    if (searchTerm) list = list.filter(a =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
    list.sort((a, b) => {
      switch (sortBy) {
        case "name": return a.name.localeCompare(b.name);
        case "city": return a.city.localeCompare(b.city);
        case "country": return a.country.localeCompare(b.country);
        case "events": return b.events - a.events;
        case "participants": return b.participants - a.participants;
        case "subscriptionShare": return getSubscriptionShare(b) - getSubscriptionShare(a);
        default: return b.totalRevenue - a.totalRevenue;
      }
    });
    return list;
  }, [searchTerm, sortBy, countryFilter]);

  const top3 = useMemo(() => {
    return [...ambassadors].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 3);
  }, []);

  const totals = useMemo(() => {
    const list = countryFilter === "all" ? ambassadors : ambassadors.filter(a => a.country === countryFilter);
    return {
      ambassadors: list.length,
      events: list.reduce((s, a) => s + a.events, 0),
      participants: list.reduce((s, a) => s + a.participants, 0),
      totalRevenue: list.reduce((s, a) => s + a.totalRevenue, 0),
      corteqsRevenue: list.reduce((s, a) => s + a.corteqsRevenue, 0),
      subscriptionShare: list.reduce((s, a) => s + getSubscriptionShare(a), 0),
      couponSubscriptions: list.reduce((s, a) => s + a.couponSubscriptions, 0),
    };
  }, [countryFilter]);

  const countries = [...new Set(ambassadors.map(a => a.country))];

  const countryPieData = useMemo(() => {
    const colors = ["hsl(var(--primary))", "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
    const grouped: Record<string, number> = {};
    ambassadors.forEach(a => { grouped[a.country] = (grouped[a.country] || 0) + a.totalRevenue; });
    return Object.entries(grouped).map(([country, revenue], i) => ({
      country, revenue, color: colors[i % colors.length]
    }));
  }, []);

  const trendData = useMemo(() => {
    const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz"];
    return months.map((m, mi) => {
      const list = countryFilter === "all" ? ambassadors : ambassadors.filter(a => a.country === countryFilter);
      return { month: m, revenue: list.reduce((s, a) => s + a.monthlyTrend[mi].rev, 0) };
    });
  }, [countryFilter]);

  const medalColors = ["text-yellow-500", "text-muted-foreground", "text-amber-700"];
  const medalLabels = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Elçi ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="revenue">Gelire Göre</SelectItem>
            <SelectItem value="name">İsme Göre</SelectItem>
            <SelectItem value="city">Şehre Göre</SelectItem>
            <SelectItem value="country">Ülkeye Göre</SelectItem>
            <SelectItem value="events">Etkinlik Sayısına Göre</SelectItem>
            <SelectItem value="participants">Katılımcı Sayısına Göre</SelectItem>
            <SelectItem value="subscriptionShare">Sub. Share'e Göre</SelectItem>
          </SelectContent>
        </Select>
        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Ülkeler</SelectItem>
            {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Elçi Sayısı", value: totals.ambassadors, icon: Flag, color: "text-primary" },
          { label: "Etkinlikler", value: totals.events, icon: Calendar, color: "text-chart-1" },
          { label: "Katılımcılar", value: totals.participants.toLocaleString(), icon: Users, color: "text-chart-2" },
          { label: "Toplam Gelir", value: `€${totals.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-chart-3" },
          { label: "CorteQS Geliri", value: `€${totals.corteqsRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-chart-4" },
          { label: "Sub. Share", value: `€${totals.subscriptionShare.toLocaleString()}`, icon: Crown, color: "text-chart-5" },
          { label: "Kupon Abonelik", value: totals.couponSubscriptions, icon: Tag, color: "text-primary" },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="border-border">
              <CardContent className="p-3">
                <Icon className={`h-3.5 w-3.5 ${kpi.color} mb-1`} />
                <p className="text-lg font-bold text-foreground">{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Top 3 Ambassadors */}
      <Card className="border-border bg-gradient-to-r from-primary/5 to-chart-1/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" /> Ayın En İyi 3 Elçisi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3.map((amb, i) => {
              const share = getSubscriptionShare(amb);
              return (
                <Card key={amb.id} className={`border-border ${i === 0 ? "ring-2 ring-yellow-400/40" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{medalLabels[i]}</span>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{amb.name}</p>
                        <p className="text-xs text-muted-foreground">{amb.city}, {amb.country}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-muted/50 rounded p-2">
                        <p className="text-muted-foreground">Etkinlik</p>
                        <p className="font-bold text-foreground">{amb.events}</p>
                      </div>
                      <div className="bg-muted/50 rounded p-2">
                        <p className="text-muted-foreground">Katılımcı</p>
                        <p className="font-bold text-foreground">{amb.participants}</p>
                      </div>
                      <div className="bg-muted/50 rounded p-2">
                        <p className="text-muted-foreground">Gelir</p>
                        <p className="font-bold text-primary">€{amb.totalRevenue.toLocaleString()}</p>
                      </div>
                      <div className="bg-muted/50 rounded p-2">
                        <p className="text-muted-foreground">Sub. Share</p>
                        <p className="font-bold text-chart-4">€{share}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <ResponsiveContainer width="100%" height={60}>
                        <AreaChart data={amb.monthlyTrend}>
                          <defs>
                            <linearGradient id={`ambGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="rev" stroke="hsl(var(--primary))" fill={`url(#ambGrad${i})`} strokeWidth={1.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Elçi Gelir Trendi (€)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="ambTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#ambTrend)" strokeWidth={2} name="Gelir (€)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-chart-4" /> Ülke Bazlı Elçi Geliri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={countryPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="revenue"
                  label={({ country, revenue }) => `${country} €${revenue.toLocaleString()}`} labelLine={false}>
                  {countryPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} formatter={(val: number) => `€${val.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ambassador List */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Flag className="h-4 w-4 text-primary" /> Tüm Elçiler ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[480px]">
            {/* Header Row */}
            <div className="grid grid-cols-9 gap-2 px-4 py-2 text-[10px] font-semibold text-muted-foreground border-b border-border bg-muted/30 sticky top-0">
              <span>İsim</span>
              <span>Şehir</span>
              <span>Ülke</span>
              <span className="text-center">Etkinlik</span>
              <span className="text-center">Katılımcı</span>
              <span className="text-right">T. Gelir</span>
              <span className="text-right">CQ Geliri</span>
              <span className="text-center">Kupon Sub.</span>
              <span className="text-right">Sub. Share</span>
            </div>
            <div className="divide-y divide-border">
              {filtered.map((amb) => {
                const share = getSubscriptionShare(amb);
                return (
                  <div key={amb.id} className="grid grid-cols-9 gap-2 px-4 py-3 hover:bg-muted/30 transition-colors items-center text-xs">
                    <span className="font-medium text-foreground">{amb.name}</span>
                    <span className="text-muted-foreground">{amb.city}</span>
                    <span className="text-muted-foreground">{amb.country}</span>
                    <span className="text-center font-semibold text-foreground">{amb.events}</span>
                    <span className="text-center text-foreground">{amb.participants}</span>
                    <span className="text-right font-bold text-primary">€{amb.totalRevenue.toLocaleString()}</span>
                    <span className="text-right text-chart-3">€{amb.corteqsRevenue.toLocaleString()}</span>
                    <span className="text-center">
                      <Badge variant="secondary" className="text-[10px]">{amb.couponSubscriptions}</Badge>
                    </span>
                    <div className="text-right">
                      <span className="font-bold text-chart-4">€{share}</span>
                      <span className="text-[9px] text-muted-foreground ml-1">({amb.year === 1 ? "20%" : "10%"})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Newsletter Section */}
      <Card className="border-border border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" /> Aylık Ambassador Newsletter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-4 mb-4">
            <p className="text-xs text-muted-foreground mb-2">Newsletter Önizleme:</p>
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <h3 className="font-bold text-foreground text-sm">🏆 CorteQS Ambassador Raporu — Mart 2026</h3>
              <div className="border-l-2 border-primary pl-3 space-y-1">
                <p className="text-xs text-foreground font-semibold">Ayın En İyi Elçisi: {top3[0].name} ({top3[0].city})</p>
                <p className="text-xs text-muted-foreground">
                  {top3[0].events} etkinlik · {top3[0].participants} katılımcı · €{top3[0].totalRevenue.toLocaleString()} gelir
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {top3.map((amb, i) => (
                  <div key={amb.id} className="bg-muted/50 rounded p-2">
                    <p className="font-semibold text-foreground">{medalLabels[i]} {amb.name}</p>
                    <p className="text-muted-foreground">{amb.city} · €{amb.totalRevenue.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>📊 Toplam {totals.ambassadors} elçi · {totals.events} etkinlik · {totals.participants} katılımcı</p>
                <p>💰 Platform Geliri: €{totals.totalRevenue.toLocaleString()} · CorteQS: €{totals.corteqsRevenue.toLocaleString()}</p>
                <p>👑 Toplam Sub. Share: €{totals.subscriptionShare.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button size="sm" className="gap-1.5 h-8 text-xs">
                <Send className="h-3.5 w-3.5" /> Newsletter Gönder
              </Button>
              <div className="flex items-center gap-2">
                <Switch checked={autoNewsletter} onCheckedChange={setAutoNewsletter} />
                <span className="text-xs text-muted-foreground">Otomatik Gönder (Her ayın 1'i)</span>
              </div>
            </div>
            {autoNewsletter && (
              <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600">
                ✓ Otomatik aktif
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AmbassadorDashboard;
