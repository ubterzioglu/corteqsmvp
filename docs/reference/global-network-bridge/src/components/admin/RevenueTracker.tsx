import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  DollarSign, TrendingUp, CreditCard, Crown, Megaphone, Radio,
  Calendar, Briefcase, Hospital, Tag, Users, Globe, MapPin,
  ArrowUpRight, ArrowDownRight, Ticket, ShieldCheck, Layers,
  Music, Gift, Rocket, BarChart3
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ComposedChart
} from "recharts";

// ─── Revenue Categories ─────────────────────────────────
const revenueCategories = [
  { key: "all", label: "Tüm Gelir Kalemleri" },
  { key: "subscription", label: "Üyelik Paketleri", dataKey: "subscription" },
  { key: "ai_twin", label: "AI Twin Seansları", dataKey: "ai_twin" },
  { key: "live_session", label: "Canlı Görüşmeler", dataKey: "live_session" },
  { key: "event_ticket", label: "Etkinlik Bilet Satışı", dataKey: "event_ticket" },
  { key: "event_boost", label: "Etkinlik Boost", dataKey: "event_boost" },
  { key: "showcase", label: "Kategori Vitrini", dataKey: "showcase" },
  { key: "social_campaign", label: "Sosyal Medya Kampanyaları", dataKey: "social_campaign" },
  { key: "radio", label: "Radyo İstek Parça", dataKey: "radio" },
  { key: "hospital", label: "Hastane Randevu", dataKey: "hospital" },
  { key: "coupon", label: "Kupon & İndirim", dataKey: "coupon" },
  { key: "job_listing", label: "İş İlanları", dataKey: "job_listing" },
  { key: "whatsapp", label: "WhatsApp Tanıtımı", dataKey: "whatsapp" },
  { key: "service_fee", label: "Hizmet Komisyonu", dataKey: "service_fee" },
];

// ─── Full Mock Data ──────────────────────────────────────
const allMonthlyRevenue = [
  { month: "Oca", subscription: 3200, ai_twin: 1800, live_session: 2400, event_ticket: 900, event_boost: 490, showcase: 870, social_campaign: 1200, radio: 380, hospital: 600, coupon: 150, job_listing: 300, whatsapp: 250, service_fee: 420 },
  { month: "Şub", subscription: 3800, ai_twin: 2200, live_session: 2800, event_ticket: 1100, event_boost: 588, showcase: 1050, social_campaign: 1500, radio: 420, hospital: 750, coupon: 180, job_listing: 375, whatsapp: 300, service_fee: 510 },
  { month: "Mar", subscription: 4500, ai_twin: 2800, live_session: 3200, event_ticket: 1400, event_boost: 735, showcase: 1260, social_campaign: 1800, radio: 480, hospital: 900, coupon: 220, job_listing: 450, whatsapp: 380, service_fee: 630 },
  { month: "Nis", subscription: 5200, ai_twin: 3400, live_session: 3600, event_ticket: 1800, event_boost: 882, showcase: 1500, social_campaign: 2100, radio: 550, hospital: 1100, coupon: 260, job_listing: 525, whatsapp: 450, service_fee: 750 },
  { month: "May", subscription: 6100, ai_twin: 4200, live_session: 4100, event_ticket: 2200, event_boost: 1029, showcase: 1740, social_campaign: 2500, radio: 620, hospital: 1350, coupon: 310, job_listing: 600, whatsapp: 520, service_fee: 890 },
  { month: "Haz", subscription: 7200, ai_twin: 5100, live_session: 4800, event_ticket: 2700, event_boost: 1225, showcase: 2010, social_campaign: 3000, radio: 720, hospital: 1600, coupon: 380, job_listing: 700, whatsapp: 600, service_fee: 1050 },
];

const allRevenueByCountry = [
  { country: "Almanya", subscription: 4200, ai_twin: 3100, live_session: 2200, event_ticket: 1200, hospital: 800, other: 900 },
  { country: "İngiltere", subscription: 2400, ai_twin: 1800, live_session: 1500, event_ticket: 700, hospital: 400, other: 400 },
  { country: "Hollanda", subscription: 1600, ai_twin: 1200, live_session: 900, event_ticket: 500, hospital: 300, other: 300 },
  { country: "BAE", subscription: 1800, ai_twin: 900, live_session: 1200, event_ticket: 800, hospital: 1200, other: 600 },
  { country: "ABD", subscription: 1000, ai_twin: 800, live_session: 600, event_ticket: 400, hospital: 200, other: 200 },
  { country: "Fransa", subscription: 900, ai_twin: 700, live_session: 500, event_ticket: 350, hospital: 150, other: 200 },
];

const allRevenueByCity = [
  { city: "Berlin", country: "Almanya", subscription: 2200, ai_twin: 1400, live_session: 800, event_ticket: 400, hospital: 300, other: 100 },
  { city: "Londra", country: "İngiltere", subscription: 1600, ai_twin: 1200, live_session: 1000, event_ticket: 500, hospital: 300, other: 200 },
  { city: "Dubai", country: "BAE", subscription: 1200, ai_twin: 600, live_session: 800, event_ticket: 600, hospital: 800, other: 200 },
  { city: "Münih", country: "Almanya", subscription: 1100, ai_twin: 900, live_session: 700, event_ticket: 200, hospital: 100, other: 100 },
  { city: "Amsterdam", country: "Hollanda", subscription: 1000, ai_twin: 800, live_session: 500, event_ticket: 300, hospital: 200, other: 100 },
  { city: "Paris", country: "Fransa", subscription: 900, ai_twin: 700, live_session: 500, event_ticket: 350, hospital: 150, other: 200 },
  { city: "Frankfurt", country: "Almanya", subscription: 600, ai_twin: 500, live_session: 400, event_ticket: 300, hospital: 300, other: 300 },
  { city: "New York", country: "ABD", subscription: 600, ai_twin: 500, live_session: 400, event_ticket: 300, hospital: 100, other: 200 },
];

const allFeatureRevenue = [
  { name: "Üyelik", key: "subscription", revenue: 7200, change: "+18%", transactions: 480, avgTicket: 15 },
  { name: "AI Twin", key: "ai_twin", revenue: 5100, change: "+42%", transactions: 3200, avgTicket: 1.6 },
  { name: "Canlı Seans", key: "live_session", revenue: 4800, change: "+12%", transactions: 2400, avgTicket: 2 },
  { name: "Sosyal Kampanya", key: "social_campaign", revenue: 3000, change: "+25%", transactions: 120, avgTicket: 25 },
  { name: "Etkinlik Bilet", key: "event_ticket", revenue: 2700, change: "+22%", transactions: 540, avgTicket: 5 },
  { name: "Kategori Vitrini", key: "showcase", revenue: 2010, change: "+30%", transactions: 67, avgTicket: 30 },
  { name: "Hastane Randevu", key: "hospital", revenue: 1600, change: "+35%", transactions: 89, avgTicket: 18 },
  { name: "Etkinlik Boost", key: "event_boost", revenue: 1225, change: "+15%", transactions: 25, avgTicket: 49 },
  { name: "Hizmet Komisyonu", key: "service_fee", revenue: 1050, change: "+20%", transactions: 210, avgTicket: 5 },
  { name: "Radyo İstek", key: "radio", revenue: 720, change: "+10%", transactions: 144, avgTicket: 5 },
  { name: "İş İlanları", key: "job_listing", revenue: 700, change: "+28%", transactions: 35, avgTicket: 20 },
  { name: "WhatsApp Tanıtım", key: "whatsapp", revenue: 600, change: "+15%", transactions: 24, avgTicket: 25 },
  { name: "Kupon", key: "coupon", revenue: 380, change: "+20%", transactions: 76, avgTicket: 5 },
];

const allTransactions = [
  { id: "t1", user: "TürkMarkt GmbH", type: "İşletme Pro Üyelik", amount: 75, date: "30 Mar", country: "Almanya", featureKey: "subscription" },
  { id: "t2", user: "Dr. Hasan Türk", type: "Hastane Randevu Komisyonu", amount: 45, date: "30 Mar", country: "Almanya", featureKey: "hospital" },
  { id: "t3", user: "Ayşe Kara", type: "Kategori Vitrini (1 Ay)", amount: 79, date: "29 Mar", country: "İngiltere", featureKey: "showcase" },
  { id: "t4", user: "Nevruz Etkinliği", type: "Etkinlik Boost Paketi", amount: 49, date: "29 Mar", country: "İngiltere", featureKey: "event_boost" },
  { id: "t5", user: "Selin Yıldız", type: "Gold Sosyal Medya Kampanyası", amount: 150, date: "28 Mar", country: "ABD", featureKey: "social_campaign" },
  { id: "t6", user: "Ali Çelik", type: "Danışman Pro Üyelik", amount: 25, date: "28 Mar", country: "Almanya", featureKey: "subscription" },
  { id: "t7", user: "Osman Kaya", type: "AI Twin Seansı (42 dk)", amount: 42, date: "27 Mar", country: "İngiltere", featureKey: "ai_twin" },
  { id: "t8", user: "Fatma Güneş", type: "Canlı Görüşme (25 dk)", amount: 50, date: "27 Mar", country: "İngiltere", featureKey: "live_session" },
  { id: "t9", user: "Berlin Radyo", type: "Radyo İstek + Hediye", amount: 20, date: "26 Mar", country: "Almanya", featureKey: "radio" },
  { id: "t10", user: "Can Özdemir", type: "Etkinlik Bilet Satışı", amount: 35, date: "26 Mar", country: "BAE", featureKey: "event_ticket" },
];

const revenueByUserType = [
  { type: "Danışman", revenue: 14200, share: 35, color: "hsl(var(--primary))" },
  { type: "İşletme", revenue: 8100, share: 20, color: "hsl(var(--chart-2))" },
  { type: "Kuruluş", revenue: 5600, share: 14, color: "hsl(var(--chart-3))" },
  { type: "Bireysel", revenue: 7800, share: 19, color: "hsl(var(--chart-4))" },
  { type: "V/Blogger", revenue: 2400, share: 6, color: "hsl(var(--chart-5))" },
  { type: "Elçi", revenue: 2500, share: 6, color: "hsl(var(--chart-1))" },
];

const chartTooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

const dataKeys = ["subscription", "ai_twin", "live_session", "event_ticket", "event_boost", "showcase", "social_campaign", "radio", "hospital", "coupon", "job_listing", "whatsapp", "service_fee"] as const;

const RevenueTracker = () => {
  const [period, setPeriod] = useState("monthly");
  const [countryFilter, setCountryFilter] = useState("all");
  const [featureFilter, setFeatureFilter] = useState("all");

  // Compute filtered data based on selections
  const filteredMonthly = useMemo(() => {
    const periodSlice = period === "weekly" ? 2 : period === "quarterly" ? 4 : period === "yearly" ? 6 : 6;
    const sliced = allMonthlyRevenue.slice(-periodSlice);
    
    // Apply country multiplier for simulation
    const countryMultiplier = countryFilter === "all" ? 1 :
      countryFilter === "Almanya" ? 0.35 : countryFilter === "İngiltere" ? 0.18 :
      countryFilter === "BAE" ? 0.16 : countryFilter === "Hollanda" ? 0.12 :
      countryFilter === "ABD" ? 0.1 : 0.09;

    return sliced.map(row => {
      const newRow: any = { month: row.month };
      let total = 0;
      dataKeys.forEach(k => {
        const val = Math.round((row as any)[k] * countryMultiplier);
        if (featureFilter === "all" || featureFilter === k) {
          newRow[k] = val;
          total += val;
        } else {
          newRow[k] = 0;
        }
      });
      newRow.total = total;
      return newRow;
    });
  }, [period, countryFilter, featureFilter]);

  const filteredCountryData = useMemo(() => {
    if (countryFilter !== "all") {
      return allRevenueByCountry.filter(c => c.country === countryFilter);
    }
    if (featureFilter !== "all") {
      return allRevenueByCountry.map(c => ({
        country: c.country,
        revenue: (c as any)[featureFilter] || (c as any).other || 0,
      }));
    }
    return allRevenueByCountry.map(c => ({
      country: c.country,
      revenue: c.subscription + c.ai_twin + c.live_session + c.event_ticket + c.hospital + c.other,
    }));
  }, [countryFilter, featureFilter]);

  const filteredCityData = useMemo(() => {
    let cities = allRevenueByCity;
    if (countryFilter !== "all") {
      cities = cities.filter(c => c.country === countryFilter);
    }
    return cities.map(c => ({
      city: c.city,
      country: c.country,
      revenue: featureFilter === "all"
        ? c.subscription + c.ai_twin + c.live_session + c.event_ticket + c.hospital + c.other
        : (c as any)[featureFilter] || (c as any).other || 0,
    }));
  }, [countryFilter, featureFilter]);

  const filteredFeatureRevenue = useMemo(() => {
    let features = allFeatureRevenue;
    if (featureFilter !== "all") {
      features = features.filter(f => f.key === featureFilter);
    }
    if (countryFilter !== "all") {
      const mult = countryFilter === "Almanya" ? 0.35 : countryFilter === "İngiltere" ? 0.18 :
        countryFilter === "BAE" ? 0.16 : countryFilter === "Hollanda" ? 0.12 :
        countryFilter === "ABD" ? 0.1 : 0.09;
      return features.map(f => ({ ...f, revenue: Math.round(f.revenue * mult), transactions: Math.round(f.transactions * mult) }));
    }
    return features;
  }, [countryFilter, featureFilter]);

  const filteredTransactions = useMemo(() => {
    let txs = allTransactions;
    if (countryFilter !== "all") txs = txs.filter(t => t.country === countryFilter);
    if (featureFilter !== "all") txs = txs.filter(t => t.featureKey === featureFilter);
    return txs;
  }, [countryFilter, featureFilter]);

  const lastMonth = filteredMonthly[filteredMonthly.length - 1];
  const prevMonth = filteredMonthly.length > 1 ? filteredMonthly[filteredMonthly.length - 2] : null;
  const totalRevenue = lastMonth?.total || 0;
  const growthPct = prevMonth && prevMonth.total > 0 ? (((totalRevenue - prevMonth.total) / prevMonth.total) * 100).toFixed(1) : "0";
  const totalTransactions = filteredFeatureRevenue.reduce((s, f) => s + f.transactions, 0);
  const subscriptionRevenue = filteredFeatureRevenue.find(f => f.key === "subscription")?.revenue || 0;

  return (
    <div className="space-y-6">
      {/* Filters Row */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Haftalık</SelectItem>
            <SelectItem value="monthly">Aylık</SelectItem>
            <SelectItem value="quarterly">Çeyreklik</SelectItem>
            <SelectItem value="yearly">Yıllık</SelectItem>
          </SelectContent>
        </Select>
        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Ülkeler</SelectItem>
            {allRevenueByCountry.map(c => (
              <SelectItem key={c.country} value={c.country}>{c.country}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={featureFilter} onValueChange={setFeatureFilter}>
          <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {revenueCategories.map(c => (
              <SelectItem key={c.key} value={c.key === "all" ? "all" : (c as any).dataKey}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(countryFilter !== "all" || featureFilter !== "all" || period !== "monthly") && (
          <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => { setCountryFilter("all"); setFeatureFilter("all"); setPeriod("monthly"); }}>
            Filtreleri Temizle ✕
          </Badge>
        )}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-xs text-emerald-500 font-semibold flex items-center gap-0.5">
                <ArrowUpRight className="h-3 w-3" /> {growthPct}%
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">€{totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Toplam Aylık Gelir</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <CreditCard className="h-4 w-4 text-chart-2" />
              <span className="text-xs text-emerald-500 font-semibold">+22%</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalTransactions.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Toplam İşlem</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <Crown className="h-4 w-4 text-chart-4" />
              <span className="text-xs text-emerald-500 font-semibold">+18%</span>
            </div>
            <p className="text-2xl font-bold text-foreground">€{subscriptionRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Üyelik Geliri</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <TrendingUp className="h-4 w-4 text-chart-3" />
            </div>
            <p className="text-2xl font-bold text-foreground">€{totalTransactions > 0 ? (totalRevenue / totalTransactions).toFixed(2) : "0"}</p>
            <p className="text-xs text-muted-foreground">Ort. İşlem Tutarı</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Gelir Trendi (€)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={filteredMonthly}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="url(#revGrad)" strokeWidth={2.5} name="Toplam Gelir" />
                {featureFilter === "all" && <Area type="monotone" dataKey="subscription" stroke="hsl(var(--chart-2))" fill="transparent" strokeWidth={1.5} strokeDasharray="5 5" name="Üyelik" />}
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-chart-2" /> Gelir Kaynakları Dağılımı (€)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={filteredMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="subscription" stackId="a" fill="hsl(var(--primary))" name="Üyelik" />
                <Bar dataKey="ai_twin" stackId="a" fill="hsl(var(--chart-1))" name="AI Twin" />
                <Bar dataKey="live_session" stackId="a" fill="hsl(var(--chart-2))" name="Canlı Seans" />
                <Bar dataKey="event_ticket" stackId="a" fill="hsl(var(--chart-3))" name="Etkinlik" />
                <Bar dataKey="social_campaign" stackId="a" fill="hsl(var(--chart-4))" name="Kampanya" />
                <Bar dataKey="hospital" stackId="a" fill="hsl(var(--chart-5))" name="Hastane" radius={[3, 3, 0, 0]} />
                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-chart-4" /> Ülke Bazlı Gelir (€)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={filteredCountryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis type="category" dataKey="country" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={70} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Gelir (€)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-chart-2" /> Kullanıcı Tipi Bazlı Gelir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={revenueByUserType} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="revenue"
                  label={({ type, share }) => `${type} ${share}%`} labelLine={false}>
                  {revenueByUserType.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} formatter={(val: number) => `€${val.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-chart-5" /> Şehir Bazlı Gelir (€)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={filteredCityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="city" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} angle={-35} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="revenue" fill="hsl(var(--chart-1))" name="Gelir (€)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom: Feature Revenue Table + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" /> Gelir Kalemleri Detayı
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[420px]">
              <div className="divide-y divide-border">
                {filteredFeatureRevenue.map((f) => {
                  const maxRev = Math.max(...filteredFeatureRevenue.map(x => x.revenue), 1);
                  return (
                    <div key={f.name} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{f.name}</span>
                        <span className="text-sm font-bold text-primary">€{f.revenue.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{f.transactions.toLocaleString()} işlem</span>
                          <span>Ort: €{f.avgTicket}</span>
                        </div>
                        <span className={`text-xs font-semibold flex items-center gap-0.5 ${f.change.startsWith("+") ? "text-emerald-500" : "text-destructive"}`}>
                          {f.change.startsWith("+") ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {f.change}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary/60" style={{ width: `${(f.revenue / maxRev) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
                {filteredFeatureRevenue.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">Bu filtre için veri bulunamadı</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-chart-3" /> Son İşlemler
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[420px]">
              <div className="divide-y divide-border">
                {filteredTransactions.map((tx) => (
                  <div key={tx.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{tx.user}</span>
                      <span className="text-sm font-bold text-primary">€{tx.amount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{tx.type}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{tx.country}</span>
                        <span>{tx.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredTransactions.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">Bu filtre için işlem bulunamadı</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RevenueTracker;
